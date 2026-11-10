import { useEffect, useRef, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Check,
  Copy,
  Download,
  FilePlus2,
  Loader2,
  RefreshCw,
  Save,
  Undo2,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";

import { MessageResponse } from "@/components/ai-elements/message";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { ResponsibleAiNotice } from "@/components/responsible-ai-notice";
import { SavedDocuments } from "@/components/saved-documents";
import { StructuredPrompt } from "@/components/structured-prompt";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { generateContent, refineContent } from "@/lib/ai.functions";
import { deriveTitle, renderPrompt, type PromptSection } from "@/lib/prompts";
import { documentQuery, type DocKind } from "@/lib/queries";

type Props = {
  kind: DocKind;
  form: ReactNode;
  sections: PromptSection[];
  inputs: Record<string, unknown>;
  canGenerate: boolean;
  titleFallback: string;
  docId?: string;
  onDocChange: (id: string | undefined) => void;
  onLoadInputs: (inputs: Record<string, unknown>) => void;
  refinePresets: string[];
  copy: {
    generate: string;
    generating: string;
    outputTitle: string;
    emptyTitle: string;
    emptyBody: string;
    savedTitle: string;
  };
};

export function GeneratorWorkspace({
  kind,
  form,
  sections,
  inputs,
  canGenerate,
  titleFallback,
  docId,
  onDocChange,
  onLoadInputs,
  refinePresets,
  copy,
}: Props) {
  const queryClient = useQueryClient();
  const generateFn = useServerFn(generateContent);
  const refineFn = useServerFn(refineContent);

  const structuredPrompt = renderPrompt(sections);
  const [customPrompt, setCustomPrompt] = useState<string | null>(null);
  const prompt = customPrompt ?? structuredPrompt;

  const [content, setContent] = useState("");
  const [savedContent, setSavedContent] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [refineText, setRefineText] = useState("");
  const [view, setView] = useState<"preview" | "edit">("preview");
  const [copied, setCopied] = useState(false);
  const loadedDocRef = useRef<string | undefined>(undefined);
  const outputRef = useRef<HTMLDivElement>(null);

  // Open a saved document when the URL points at one.
  const docQuery = useQuery({ ...documentQuery(docId ?? ""), enabled: !!docId });
  useEffect(() => {
    const doc = docQuery.data;
    if (!doc || loadedDocRef.current === doc.id) return;
    loadedDocRef.current = doc.id;
    onLoadInputs((doc.inputs ?? {}) as Record<string, unknown>);
    setCustomPrompt(null);
    setContent(doc.content);
    setSavedContent(doc.content);
    setHistory([]);
    setView("preview");
  }, [docQuery.data, onLoadInputs]);

  useEffect(() => {
    if (!docId) loadedDocRef.current = undefined;
  }, [docId]);

  const replaceContent = (next: string) => {
    setHistory((h) => (content ? [...h.slice(-9), content] : h));
    setContent(next);
    setView("preview");
  };

  const generate = useMutation({
    mutationFn: async () => {
      const res = await generateFn({ data: { kind, prompt } });
      if (!res.ok) throw new Error(res.error);
      return res.text;
    },
    onSuccess: (text) => {
      replaceContent(text);
      // A fresh generation starts a new, unsaved draft.
      if (docId) onDocChange(undefined);
      loadedDocRef.current = undefined;
      setSavedContent("");
      requestAnimationFrame(() =>
        outputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
      );
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const refine = useMutation({
    mutationFn: async (instruction: string) => {
      const res = await refineFn({ data: { kind, content, instruction } });
      if (!res.ok) throw new Error(res.error);
      return res.text;
    },
    onSuccess: (text) => {
      replaceContent(text);
      setRefineText("");
      toast.success("Draft updated — review the changes.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const save = useMutation({
    mutationFn: async () => {
      const title = deriveTitle(kind, content, titleFallback);
      const payload = {
        kind,
        title,
        content,
        prompt,
        inputs: inputs as unknown as Json,
      };
      if (docId) {
        const { error } = await supabase.from("documents").update(payload).eq("id", docId);
        if (error) throw error;
        return docId;
      }
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("documents")
        .insert({ ...payload, user_id: userData.user!.id })
        .select("id")
        .single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: (id) => {
      loadedDocRef.current = id;
      setSavedContent(content);
      onDocChange(id);
      queryClient.invalidateQueries({ queryKey: ["documents", kind] });
      queryClient.invalidateQueries({ queryKey: ["document", id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Saved to your workspace");
    },
    onError: () => toast.error("Couldn't save. Please try again."),
  });

  const busy = generate.isPending || refine.isPending;
  const dirty = content !== savedContent;
  const words = content.trim() ? content.trim().split(/\s+/).length : 0;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleDownload = () => {
    const ext = kind === "email" ? "txt" : "md";
    const blob = new Blob([content], { type: kind === "email" ? "text/plain" : "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${deriveTitle(kind, content, titleFallback).replace(/[^\w\- ]+/g, "").trim() || kind}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleNew = () => {
    onDocChange(undefined);
    loadedDocRef.current = undefined;
    setContent("");
    setSavedContent("");
    setHistory([]);
    setCustomPrompt(null);
  };

  const editor =
    kind === "email" ? (
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="min-h-[420px] resize-y border-0 bg-transparent p-0 text-[15px] leading-relaxed shadow-none focus-visible:ring-0"
        aria-label="Edit email"
      />
    ) : (
      <Tabs value={view} onValueChange={(v) => setView(v as "preview" | "edit")}>
        <TabsList className="mb-3">
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="edit">Edit</TabsTrigger>
        </TabsList>
        <TabsContent value="preview">
          <div className="prose-sm max-w-none text-[15px] leading-relaxed">
            <MessageResponse>{content}</MessageResponse>
          </div>
        </TabsContent>
        <TabsContent value="edit">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[480px] resize-y font-mono text-xs leading-relaxed"
            aria-label="Edit research brief (markdown)"
          />
        </TabsContent>
      </Tabs>
    );

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <div className="space-y-4 lg:col-span-5">
        <section className="rounded-2xl border bg-card p-4 shadow-soft sm:p-5">{form}</section>
        <StructuredPrompt
          sections={sections}
          customPrompt={customPrompt}
          structuredPrompt={structuredPrompt}
          onCustomPromptChange={setCustomPrompt}
        />
        <Button
          type="button"
          size="lg"
          className="w-full"
          disabled={!canGenerate || busy}
          onClick={() => generate.mutate()}
        >
          {generate.isPending ? <Loader2 className="animate-spin" /> : <Wand2 />}
          {generate.isPending ? copy.generating : copy.generate}
        </Button>
      </div>

      <div className="space-y-4 lg:col-span-7" ref={outputRef}>
        <section className="relative overflow-hidden rounded-2xl border bg-card shadow-soft">
          <header className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3 sm:px-5">
            <div className="flex items-center gap-2">
              <h2 className="font-display text-sm font-semibold">{copy.outputTitle}</h2>
              {content ? (
                <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold text-secondary-foreground">
                  {docId && !dirty ? "Saved" : dirty && savedContent ? "Unsaved edits" : "AI draft"}
                </span>
              ) : null}
            </div>
            {content ? (
              <div className="flex flex-wrap items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Undo last AI change"
                  title="Undo last AI change"
                  disabled={!history.length || busy}
                  onClick={() => {
                    setContent(history[history.length - 1]);
                    setHistory((h) => h.slice(0, -1));
                  }}
                >
                  <Undo2 />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Copy"
                  title="Copy"
                  onClick={handleCopy}
                >
                  {copied ? <Check /> : <Copy />}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Download"
                  title="Download"
                  onClick={handleDownload}
                >
                  <Download />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Regenerate"
                  title="Regenerate"
                  disabled={!canGenerate || busy}
                  onClick={() => generate.mutate()}
                >
                  <RefreshCw />
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={handleNew} disabled={busy}>
                  <FilePlus2 /> New
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => save.mutate()}
                  disabled={busy || save.isPending || !content.trim() || (!!docId && !dirty)}
                >
                  {save.isPending ? <Loader2 className="animate-spin" /> : <Save />}
                  {docId ? "Update" : "Save"}
                </Button>
              </div>
            ) : null}
          </header>

          <div className="px-4 py-4 sm:px-6 sm:py-5">
            {content ? (
              editor
            ) : busy ? (
              <div className="space-y-3 py-10">
                <Shimmer className="font-display text-base">{copy.generating}</Shimmer>
                <p className="text-sm text-muted-foreground">This usually takes a few seconds.</p>
              </div>
            ) : (
              <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-gradient-moss px-6 py-12 text-center">
                <Wand2 className="size-8 text-primary" aria-hidden="true" />
                <p className="font-display text-base font-semibold">{copy.emptyTitle}</p>
                <p className="max-w-sm text-sm text-muted-foreground">{copy.emptyBody}</p>
              </div>
            )}
          </div>

          {content && busy ? (
            <div className="absolute inset-0 grid place-items-center bg-card/75 backdrop-blur-[2px]">
              <Shimmer className="font-display text-base">
                {refine.isPending ? "Refining your draft…" : copy.generating}
              </Shimmer>
            </div>
          ) : null}

          {content ? (
            <footer className="space-y-3 border-t bg-muted/40 px-4 py-3 sm:px-5">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="mr-1 text-xs font-semibold text-muted-foreground">Refine:</span>
                {refinePresets.map((preset) => (
                  <Button
                    key={preset}
                    type="button"
                    variant="outline"
                    size="xs"
                    disabled={busy}
                    onClick={() => refine.mutate(preset)}
                  >
                    {preset}
                  </Button>
                ))}
              </div>
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (refineText.trim().length >= 2) refine.mutate(refineText.trim());
                }}
              >
                <Input
                  value={refineText}
                  onChange={(e) => setRefineText(e.target.value)}
                  placeholder="Or describe a change, e.g. “mention the budget deadline”"
                  maxLength={1000}
                  className="bg-card"
                />
                <Button type="submit" variant="secondary" disabled={busy || refineText.trim().length < 2}>
                  Apply
                </Button>
              </form>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{words} words · edit freely before saving</span>
              </div>
            </footer>
          ) : null}
        </section>

        <ResponsibleAiNotice />

        <SavedDocuments
          kind={kind}
          title={copy.savedTitle}
          activeId={docId}
          onOpen={(id) => onDocChange(id)}
          onDeleted={(id) => {
            if (id === docId) handleNew();
          }}
        />
      </div>
    </div>
  );
}
