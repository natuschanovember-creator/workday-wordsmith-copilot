import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import { Search } from "lucide-react";

import { GeneratorWorkspace } from "@/components/generator-workspace";
import { PageHeader } from "@/components/page-header";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  RESEARCH_AUDIENCES,
  RESEARCH_DEPTHS,
  RESEARCH_FOCUS,
  RESEARCH_FORMATS,
  buildResearchSections,
  type ResearchInputs,
} from "@/lib/prompts";

export const Route = createFileRoute("/_authenticated/research")({
  validateSearch: (search: Record<string, unknown>): { doc?: string } => ({
    doc: typeof search.doc === "string" ? search.doc : undefined,
  }),
  head: () => ({
    meta: [
      { title: "AI Research Assistant — AI Workplace Productivity Assistant" },
      { name: "description", content: "Turn any topic into a structured, editable research brief." },
      { property: "og:title", content: "AI Research Assistant" },
      { property: "og:description", content: "Turn any topic into a structured, editable research brief." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResearchPage,
});

const DEFAULTS: ResearchInputs = {
  topic: "",
  question: "",
  audience: "My team",
  depth: "Standard brief",
  focus: ["Key concepts", "Best practices"],
  format: "Executive brief",
};

function ResearchPage() {
  const { doc } = Route.useSearch();
  const navigate = useNavigate({ from: "/research" });
  const [inputs, setInputs] = useState<ResearchInputs>(DEFAULTS);

  const set = <K extends keyof ResearchInputs>(key: K, value: ResearchInputs[K]) =>
    setInputs((prev) => ({ ...prev, [key]: value }));

  const sections = useMemo(() => buildResearchSections(inputs), [inputs]);
  const onLoadInputs = useCallback(
    (saved: Record<string, unknown>) => setInputs({ ...DEFAULTS, ...(saved as Partial<ResearchInputs>) }),
    [],
  );
  const onDocChange = useCallback(
    (id: string | undefined) => navigate({ search: { doc: id }, replace: true }),
    [navigate],
  );

  const form = (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="topic">Research topic</Label>
        <Input
          id="topic"
          value={inputs.topic}
          maxLength={300}
          onChange={(e) => set("topic", e.target.value)}
          placeholder="e.g. Adopting a 4-day work week in tech companies"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="question">Goal or key question <span className="font-normal text-muted-foreground">(optional)</span></Label>
        <Textarea
          id="question"
          value={inputs.question}
          maxLength={1500}
          onChange={(e) => set("question", e.target.value)}
          placeholder="What decision is this research for?"
          className="min-h-20"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Audience</Label>
          <Select value={inputs.audience} onValueChange={(v) => set("audience", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {RESEARCH_AUDIENCES.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Output format</Label>
          <Select value={inputs.format} onValueChange={(v) => set("format", v as ResearchInputs["format"])}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {(Object.keys(RESEARCH_FORMATS) as ResearchInputs["format"][]).map((f) => (
                <SelectItem key={f} value={f}>{f}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Depth</Label>
        <ToggleGroup
          type="single"
          variant="outline"
          value={inputs.depth}
          onValueChange={(v) => v && set("depth", v as ResearchInputs["depth"])}
          className="w-full"
        >
          {(Object.keys(RESEARCH_DEPTHS) as ResearchInputs["depth"][]).map((d) => (
            <ToggleGroupItem key={d} value={d} className="flex-1 px-2 text-xs data-[state=on]:bg-secondary data-[state=on]:text-secondary-foreground">
              {d}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
      <div className="space-y-2">
        <Label>Focus areas</Label>
        <ToggleGroup
          type="multiple"
          variant="outline"
          value={inputs.focus}
          onValueChange={(v) => set("focus", v)}
          className="flex flex-wrap justify-start gap-1.5"
        >
          {RESEARCH_FOCUS.map((f) => (
            <ToggleGroupItem
              key={f}
              value={f}
              size="sm"
              className="rounded-full border px-3 text-xs data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            >
              {f}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Search}
        eyebrow="AI tool"
        title="AI Research Assistant"
        description="Get a structured brief on any work topic, written for your audience. The assistant uses its general knowledge — it doesn't browse the web — so verify key facts."
      />
      <GeneratorWorkspace
        kind="research"
        form={form}
        sections={sections}
        inputs={inputs}
        canGenerate={inputs.topic.trim().length >= 3}
        titleFallback={inputs.topic || "Research brief"}
        docId={doc}
        onDocChange={onDocChange}
        onLoadInputs={onLoadInputs}
        refinePresets={["Make it more concise", "Add a comparison table", "Simplify for non-experts", "Add next steps"]}
        copy={{
          generate: "Generate research brief",
          generating: "Researching your topic…",
          outputTitle: "Research brief",
          emptyTitle: "Your brief will appear here",
          emptyBody: "Enter a topic, choose your audience and focus areas, then generate. Switch to Edit to change anything.",
          savedTitle: "Saved research",
        }}
      />
    </div>
  );
}
