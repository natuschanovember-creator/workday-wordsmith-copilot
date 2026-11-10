import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Mail } from "lucide-react";

import { GeneratorWorkspace } from "@/components/generator-workspace";
import { PageHeader } from "@/components/page-header";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  EMAIL_LENGTHS,
  EMAIL_TONES,
  EMAIL_TYPES,
  RELATIONSHIPS,
  buildEmailSections,
  type EmailInputs,
} from "@/lib/prompts";
import { profileQuery } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/email")({
  validateSearch: (search: Record<string, unknown>): { doc?: string } => ({
    doc: typeof search.doc === "string" ? search.doc : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Smart Email Generator — AI Workplace Productivity Assistant" },
      { name: "description", content: "Generate polished, editable workplace emails with AI in seconds." },
      { property: "og:title", content: "Smart Email Generator" },
      { property: "og:description", content: "Generate polished, editable workplace emails with AI in seconds." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EmailPage,
});

const DEFAULTS: EmailInputs = {
  emailType: "Follow-up",
  recipient: "",
  relationship: "Colleague",
  tone: "Professional",
  length: "Medium",
  keyPoints: "",
  senderName: "",
  senderRole: "",
};

function EmailPage() {
  const { user } = Route.useRouteContext();
  const { doc } = Route.useSearch();
  const navigate = useNavigate({ from: "/email" });
  const { data: profile } = useQuery(profileQuery(user.id));
  const [inputs, setInputs] = useState<EmailInputs>(DEFAULTS);

  useEffect(() => {
    if (!profile) return;
    setInputs((prev) => ({
      ...prev,
      senderName: prev.senderName || profile.display_name || "",
      senderRole: prev.senderRole || profile.job_title || "",
    }));
  }, [profile]);

  const set = <K extends keyof EmailInputs>(key: K, value: EmailInputs[K]) =>
    setInputs((prev) => ({ ...prev, [key]: value }));

  const sections = useMemo(() => buildEmailSections(inputs), [inputs]);
  const onLoadInputs = useCallback(
    (saved: Record<string, unknown>) => setInputs({ ...DEFAULTS, ...(saved as Partial<EmailInputs>) }),
    [],
  );
  const onDocChange = useCallback(
    (id: string | undefined) => navigate({ search: { doc: id }, replace: true }),
    [navigate],
  );

  const form = (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Email type</Label>
          <Select value={inputs.emailType} onValueChange={(v) => set("emailType", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {EMAIL_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Tone</Label>
          <Select value={inputs.tone} onValueChange={(v) => set("tone", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {EMAIL_TONES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="recipient">Recipient</Label>
          <Input id="recipient" value={inputs.recipient} maxLength={120} onChange={(e) => set("recipient", e.target.value)} placeholder="e.g. Dana Lee" />
        </div>
        <div className="space-y-2">
          <Label>Relationship</Label>
          <Select value={inputs.relationship} onValueChange={(v) => set("relationship", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {RELATIONSHIPS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="points">Key points to cover</Label>
        <Textarea
          id="points"
          value={inputs.keyPoints}
          maxLength={3000}
          onChange={(e) => set("keyPoints", e.target.value)}
          placeholder={"One per line, e.g.\nThanks for the meeting on Tuesday\nProposal will be ready by Friday\nAsk for a 15-min review call next week"}
          className="min-h-28"
        />
      </div>

      <div className="space-y-2">
        <Label>Length</Label>
        <ToggleGroup
          type="single"
          variant="outline"
          value={inputs.length}
          onValueChange={(v) => v && set("length", v as EmailInputs["length"])}
          className="w-full"
        >
          {(Object.keys(EMAIL_LENGTHS) as EmailInputs["length"][]).map((l) => (
            <ToggleGroupItem key={l} value={l} className="flex-1 data-[state=on]:bg-secondary data-[state=on]:text-secondary-foreground">
              {l}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="sender">Your name</Label>
          <Input id="sender" value={inputs.senderName} maxLength={120} onChange={(e) => set("senderName", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="role">Your role</Label>
          <Input id="role" value={inputs.senderRole} maxLength={120} onChange={(e) => set("senderRole", e.target.value)} placeholder="e.g. Account Manager" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Mail}
        eyebrow="AI tool"
        title="Smart Email Generator"
        description="Describe what you need — the assistant drafts a clear, ready-to-edit email with a subject line."
      />
      <GeneratorWorkspace
        kind="email"
        form={form}
        sections={sections}
        inputs={inputs}
        canGenerate={inputs.keyPoints.trim().length >= 5}
        titleFallback={`${inputs.emailType} email${inputs.recipient ? ` to ${inputs.recipient}` : ""}`}
        docId={doc}
        onDocChange={onDocChange}
        onLoadInputs={onLoadInputs}
        refinePresets={["Shorter", "More formal", "Friendlier", "Add a clear call to action", "Fix grammar"]}
        copy={{
          generate: "Generate email",
          generating: "Drafting your email…",
          outputTitle: "Your email",
          emptyTitle: "Your draft will appear here",
          emptyBody: "Add a few key points on the left, then press Generate email. You can edit everything afterwards.",
          savedTitle: "Saved emails",
        }}
      />
    </div>
  );
}
