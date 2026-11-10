// Server-only AI helpers. Import dynamically from server handlers only.
import { GatewayError, PaymentRequiredError, RateLimitError } from "@lovable.dev/ai-gateway";

export const TEXT_MODEL = "openai/gpt-6-astra" as const;

export const RESPONSIBLE_AI_RULES = `Responsible AI rules (always follow):
- Be accurate and honest. Never invent facts, statistics, quotes, names, URLs or citations. If you are unsure, say so plainly.
- Clearly mark assumptions and anything the user should verify before relying on it.
- Do not include or request sensitive personal data (passwords, health, financial or ID numbers).
- Avoid discriminatory, biased, manipulative or unprofessional language.
- Decline requests that are deceptive, harmful, or illegal, and briefly explain why.
- Do not provide definitive legal, medical, financial or HR decisions — recommend consulting a qualified professional.`;

export const SYSTEM_PROMPTS = {
  email: `You are an expert workplace communication assistant who writes clear, effective professional emails.
Return ONLY the email in plain text, in this exact shape:
Subject: <subject line>

<email body with greeting, paragraphs and sign-off>

Do not use markdown formatting, code fences, or commentary before or after the email. Use [placeholders] in square brackets for any specific detail the user did not provide (e.g. [date], [link]).

${RESPONSIBLE_AI_RULES}`,
  research: `You are a rigorous research analyst helping professionals understand topics quickly.
Write in well-structured GitHub-flavoured markdown with clear headings, short paragraphs, bullet lists and tables where useful.
You do NOT have live internet access: rely on established knowledge, note when information may be outdated, and never fabricate sources, links or statistics. When a figure is approximate, say so. End with a short "What to verify" section listing claims the reader should confirm with primary sources.

${RESPONSIBLE_AI_RULES}`,
  chat: `You are a friendly, highly capable AI workplace productivity assistant. You help professionals plan their work, draft and edit documents, summarise information, brainstorm, prepare for meetings, and solve everyday workplace problems.
Be concise and practical. Use markdown (headings, bullet lists, tables, code blocks) when it improves readability. Ask a brief clarifying question when a request is ambiguous.

${RESPONSIBLE_AI_RULES}`,
} as const;

type OutputItem = { type?: string; content?: Array<{ type?: string; text?: string }> };

export function extractOutputText(response: unknown): string {
  const output = (response as { output?: OutputItem[] })?.output ?? [];
  return output
    .filter((item) => item.type === "message")
    .flatMap((item) => item.content ?? [])
    .filter((part) => part.type === "output_text" && typeof part.text === "string")
    .map((part) => part.text as string)
    .join("")
    .trim();
}

export function friendlyAiError(error: unknown): string {
  if (error instanceof RateLimitError) {
    return "The AI service is busy right now. Please wait a moment and try again.";
  }
  if (error instanceof PaymentRequiredError) {
    return "AI usage credits have run out for this workspace. Please add credits to continue.";
  }
  if (error instanceof GatewayError) {
    console.error("AI gateway error", error.code, error.ids);
    return "The AI service couldn't complete this request. Please try again.";
  }
  console.error("AI request failed", error);
  return "Something went wrong while generating. Please try again.";
}
