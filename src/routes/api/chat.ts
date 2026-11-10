import { createFileRoute } from "@tanstack/react-router";
import type { UIMessage } from "ai";
import { z } from "zod";

import type { Database, Json } from "@/integrations/supabase/types";

const bodySchema = z.object({
  threadId: z.string().uuid(),
  message: z.object({
    id: z.string().min(1).max(200),
    role: z.literal("user"),
    parts: z.array(z.any()).min(1).max(20),
  }),
});

function textOf(message: Pick<UIMessage, "parts">): string {
  return message.parts
    .map((p) => (p.type === "text" ? p.text : ""))
    .join("")
    .trim();
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authHeader = request.headers.get("authorization") ?? "";
        const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
        if (!token) return new Response("Unauthorized", { status: 401 });

        let parsed: z.infer<typeof bodySchema>;
        try {
          parsed = bodySchema.parse(await request.json());
        } catch {
          return new Response("Invalid request", { status: 400 });
        }

        const { createClient } = await import("@supabase/supabase-js");
        const url = process.env["SUPABASE_URL"]!;
        const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
        const supabase = createClient<Database>(url, key, {
          auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
          global: {
            headers: { Authorization: `Bearer ${token}` },
            fetch: (input, init) => {
              const h = new Headers(init?.headers);
              h.set("apikey", key);
              return fetch(input, { ...init, headers: h });
            },
          },
        });

        const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
        const userId = claimsData?.claims?.sub;
        if (claimsError || !userId) return new Response("Unauthorized", { status: 401 });

        // Thread must belong to the caller (RLS also enforces this).
        const { data: thread, error: threadError } = await supabase
          .from("chat_threads")
          .select("id, title")
          .eq("id", parsed.threadId)
          .maybeSingle();
        if (threadError) return new Response("Could not load conversation", { status: 500 });
        if (!thread) return new Response("Conversation not found", { status: 404 });

        const userMessage = parsed.message as UIMessage;
        const userText = textOf(userMessage);
        if (!userText || userText.length > 8000) {
          return new Response("Message must be between 1 and 8000 characters", { status: 400 });
        }

        const { error: insertError } = await supabase.from("chat_messages").upsert(
          {
            thread_id: thread.id,
            user_id: userId,
            message_id: userMessage.id,
            role: "user",
            parts: userMessage.parts as unknown as Json,
          },
          { onConflict: "thread_id,message_id", ignoreDuplicates: true },
        );
        if (insertError) {
          console.error("Failed to save user message", insertError);
          return new Response("Could not save your message", { status: 500 });
        }

        // Rebuild the full conversation from storage so the model always sees every turn.
        const { data: history, error: historyError } = await supabase
          .from("chat_messages")
          .select("role, parts")
          .eq("thread_id", thread.id)
          .order("created_at", { ascending: true })
          .limit(200);
        if (historyError) return new Response("Could not load history", { status: 500 });

        const input = (history ?? [])
          .map((row) => {
            const text = textOf({ parts: row.parts as unknown as UIMessage["parts"] });
            if (!text) return null;
            return row.role === "assistant"
              ? {
                  role: "assistant" as const,
                  content: [{ type: "output_text" as const, text }],
                }
              : { role: "user" as const, content: text };
          })
          .filter((m): m is NonNullable<typeof m> => m !== null);

        if (thread.title === "New conversation") {
          const title = userText.replace(/\s+/g, " ").slice(0, 60);
          await supabase.from("chat_threads").update({ title }).eq("id", thread.id);
        } else {
          await supabase
            .from("chat_threads")
            .update({ updated_at: new Date().toISOString() })
            .eq("id", thread.id);
        }

        const { streamResponse } = await import("@lovable.dev/ai-gateway");
        const { TEXT_MODEL, SYSTEM_PROMPTS, friendlyAiError } = await import("@/lib/ai.server");
        const { createUIMessageStream, createUIMessageStreamResponse, generateId } = await import(
          "ai"
        );

        const assistantId = generateId();
        const stream = createUIMessageStream({
          execute: async ({ writer }) => {
            writer.write({ type: "start", messageId: assistantId });
            const textId = generateId();
            let started = false;
            let fullText = "";
            const gatewayStream = await streamResponse(
              {
                model: TEXT_MODEL,
                instructions: SYSTEM_PROMPTS.chat,
                input,
                reasoning: { effort: "low" },
              },
              { signal: request.signal },
            );
            for await (const event of gatewayStream) {
              if (event.type === "response.output_text.delta") {
                if (!started) {
                  writer.write({ type: "text-start", id: textId });
                  started = true;
                }
                fullText += event.delta;
                writer.write({ type: "text-delta", id: textId, delta: event.delta });
              }
            }
            if (started) writer.write({ type: "text-end", id: textId });
            writer.write({ type: "finish" });

            if (fullText.trim()) {
              const { error } = await supabase.from("chat_messages").insert({
                thread_id: thread.id,
                user_id: userId,
                message_id: assistantId,
                role: "assistant",
                parts: [{ type: "text", text: fullText }] as unknown as Json,
              });
              if (error) console.error("Failed to save assistant message", error);
            }
          },
          onError: (error) => friendlyAiError(error),
        });

        return createUIMessageStreamResponse({ stream });
      },
    },
  },
});
