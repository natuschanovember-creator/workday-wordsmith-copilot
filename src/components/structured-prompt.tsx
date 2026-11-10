import { useState } from "react";
import { ChevronDown, Pencil, RotateCcw, ListTree } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { PromptSection } from "@/lib/prompts";
import { cn } from "@/lib/utils";

type Props = {
  sections: PromptSection[];
  customPrompt: string | null;
  structuredPrompt: string;
  onCustomPromptChange: (value: string | null) => void;
};

export function StructuredPrompt({
  sections,
  customPrompt,
  structuredPrompt,
  onCustomPromptChange,
}: Props) {
  const [open, setOpen] = useState(true);
  const editing = customPrompt !== null;

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="rounded-2xl border bg-card shadow-soft">
      <div className="flex items-center justify-between gap-2 px-4 py-3 sm:px-5">
        <CollapsibleTrigger className="flex min-w-0 flex-1 items-center gap-2 text-left">
          <ListTree className="size-4 shrink-0 text-primary" aria-hidden="true" />
          <span className="font-display text-sm font-semibold">Structured AI prompt</span>
          {editing ? (
            <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold text-secondary-foreground">
              Edited
            </span>
          ) : null}
          <ChevronDown
            className={cn("ml-auto size-4 text-muted-foreground transition-transform", open && "rotate-180")}
            aria-hidden="true"
          />
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent>
        <div className="space-y-3 border-t px-4 pb-4 pt-3 sm:px-5">
          <p className="text-xs text-muted-foreground">
            This is exactly what will be sent to the AI. It updates as you fill in the form — or edit it
            directly for full control.
          </p>
          {editing ? (
            <Textarea
              value={customPrompt}
              onChange={(e) => onCustomPromptChange(e.target.value)}
              className="min-h-64 font-mono text-xs leading-relaxed"
              aria-label="Edit prompt"
            />
          ) : (
            <ol className="space-y-2">
              {sections.map((section) => (
                <li key={section.label} className="rounded-lg bg-muted/70 px-3 py-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
                    {section.label}
                  </p>
                  <p className="mt-0.5 whitespace-pre-wrap text-xs leading-relaxed text-foreground/85">
                    {section.body}
                  </p>
                </li>
              ))}
            </ol>
          )}
          <div className="flex flex-wrap gap-2">
            {editing ? (
              <Button type="button" variant="outline" size="sm" onClick={() => onCustomPromptChange(null)}>
                <RotateCcw /> Reset to form
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onCustomPromptChange(structuredPrompt)}
              >
                <Pencil /> Edit prompt
              </Button>
            )}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
