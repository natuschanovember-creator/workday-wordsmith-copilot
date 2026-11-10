import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const generateSchema = z.object({
  kind: z.enum(["email", "research"]),
  prompt: z.string().trim().min(10, "Prompt is too short").max(12000, "Prompt is too long"),
});

/** Generate an email or research brief from the user's structured (and possibly edited) prompt. */
export const generateContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => generateSchema.parse(input))
  .handler(async ({ data }) => {
    const { generateResponse } = await import("@lovable.dev/ai-gateway");
    const { TEXT_MODEL, SYSTEM_PROMPTS, extractOutputText, friendlyAiError } = await import(
      "./ai.server"
    );
    try {
      const response = await generateResponse({
        model: TEXT_MODEL,
        instructions: SYSTEM_PROMPTS[data.kind],
        input: data.prompt,
        reasoning: { effort: "low" },
      });
      const text = extractOutputText(response);
      if (!text) return { ok: false as const, error: "The AI returned an empty response. Try again." };
      return { ok: true as const, text };
    } catch (error) {
      return { ok: false as const, error: friendlyAiError(error) };
    }
  });

const refineSchema = z.object({
  kind: z.enum(["email", "research"]),
  content: z.string().trim().min(1).max(30000),
  instruction: z.string().trim().min(2).max(1000),
});

/** Rewrite existing (possibly user-edited) output according to a refinement instruction. */
export const refineContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => refineSchema.parse(input))
  .handler(async ({ data }) => {
    const { generateResponse } = await import("@lovable.dev/ai-gateway");
    const { TEXT_MODEL, SYSTEM_PROMPTS, extractOutputText, friendlyAiError } = await import(
      "./ai.server"
    );
    try {
      const response = await generateResponse({
        model: TEXT_MODEL,
        instructions: SYSTEM_PROMPTS[data.kind],
        input: `Revise the draft below according to this instruction: "${data.instruction}".
Keep everything that is not affected by the instruction, preserve the same output format, and return only the revised version.

--- DRAFT START ---
${data.content}
--- DRAFT END ---`,
        reasoning: { effort: "low" },
      });
      const text = extractOutputText(response);
      if (!text) return { ok: false as const, error: "The AI returned an empty response. Try again." };
      return { ok: true as const, text };
    } catch (error) {
      return { ok: false as const, error: friendlyAiError(error) };
    }
  });
