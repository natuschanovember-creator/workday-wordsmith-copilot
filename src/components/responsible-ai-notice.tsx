import { Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";

import { cn } from "@/lib/utils";

type Props = {
  variant?: "banner" | "inline";
  className?: string;
  message?: string;
};

const DEFAULT_MESSAGE =
  "AI-generated content can be inaccurate or incomplete. Review, fact-check and edit before you send or rely on it, and avoid sharing confidential or personal data.";

export function ResponsibleAiNotice({ variant = "banner", className, message }: Props) {
  if (variant === "inline") {
    return (
      <p className={cn("flex items-start gap-1.5 text-xs text-muted-foreground", className)}>
        <ShieldCheck className="mt-px size-3.5 shrink-0 text-primary" aria-hidden="true" />
        <span>
          {message ?? "AI can make mistakes. Always review outputs before using them."}{" "}
          <Link to="/responsible-ai" className="font-medium text-primary underline-offset-2 hover:underline">
            Responsible AI
          </Link>
        </span>
      </p>
    );
  }

  return (
    <div
      role="note"
      className={cn(
        "flex items-start gap-3 rounded-xl border border-warning/25 bg-warning-surface px-4 py-3 text-sm text-warning-foreground",
        className,
      )}
    >
      <ShieldCheck className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
      <p>
        <span className="font-semibold">Responsible AI: </span>
        {message ?? DEFAULT_MESSAGE}{" "}
        <Link to="/responsible-ai" className="font-semibold underline underline-offset-2">
          Learn more
        </Link>
      </p>
    </div>
  );
}
