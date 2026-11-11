import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Copy, PanelLeft } from "lucide-react";

import { LogoMark } from "@/components/brand";
import { ThreadList } from "@/components/chat/thread-list";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { ResponsibleAiNotice } from "@/components/responsible-ai-notice";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { threadMessagesQuery, threadsQuery } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/chat/$threadId")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(threadMessagesQuery(params.threadId)),
  head: () => ({
    meta: [
      { title: "Conversation — AI Workplace Productivity Assistant" },
      { name: "description", content: "Your conversation with the AI workplace assistant." },
      { property: "og:title", content: "AI Chat Assistant" },
      { property: "og:description", content: "Your conversation with the AI workplace assistant." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ThreadPage,
});

function ThreadPage() {
  const { threadId } = Route.useParams();
  const { data: initialMessages } = useSuspenseQuery(threadMessagesQuery(threadId));
  return <ChatWindow key={threadId} threadId={threadId} initialMessages={initialMessages} />;
}

const SUGGESTIONS = [
  "Draft an agenda for a 30-minute project kickoff meeting",
  "Help me prioritise my tasks for this week",
  "Turn these meeting notes into clear action items",
  "Write a polite reply declining a meeting invite",
];

function textOf(message: UIMessage) {
  return message.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
}

function ChatWindow({ threadId, initialMessages }: { threadId: string; initialMessages: UIMessage[] }) {
  const queryClient = useQueryClient();
  const { data: threads = [] } = useSuspenseQuery(threadsQuery());
  const title = threads.find((t) => t.id === threadId)?.title ?? "Conversation";
  const composerRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const transport = useMemo(
    () =>
      new DefaultChatTransport<UIMessage>({
        api: "/api/chat",
        prepareSendMessagesRequest: async ({ id, messages }) => {
          const { data } = await supabase.auth.getSession();
          return {
            headers: { Authorization: `Bearer ${data.session?.access_token ?? ""}` },
            body: { threadId: id, message: messages[messages.length - 1] },
          };
        },
      }),
    [],
  );

  const { messages, sendMessage, status, stop, error } = useChat({
    id: threadId,
    messages: initialMessages,
    transport,
    onFinish: () => {
      queryClient.invalidateQueries({ queryKey: ["threads"] });
      queryClient.invalidateQueries({ queryKey: ["thread-messages", threadId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const focusComposer = () => composerRef.current?.querySelector("textarea")?.focus();

  useEffect(() => {
    if (status === "ready" || status === "error") focusComposer();
  }, [status]);

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || status === "submitted" || status === "streaming") return;
    sendMessage({ text: trimmed });
    // Title is set server-side from the first message; refresh the list shortly after.
    setTimeout(() => queryClient.invalidateQueries({ queryKey: ["threads"] }), 1500);
    focusComposer();
  };

  const handleSubmit = (message: PromptInputMessage) => send(message.text);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-2 border-b px-3 py-2 sm:px-5">
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon-sm" className="lg:hidden" aria-label="Show conversations">
              <PanelLeft />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 p-0">
            <SheetTitle className="sr-only">Conversations</SheetTitle>
            <div className="h-full pt-10">
              <ThreadList onNavigate={() => setSheetOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>
        <h1 className="truncate font-display text-sm font-semibold">{title}</h1>
      </div>

      <Conversation className="min-h-0 flex-1">
        <ConversationContent className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">
          {messages.length === 0 ? (
            <ConversationEmptyState>
              <LogoMark className="size-14" />
              <div className="space-y-1">
                <h2 className="text-xl font-semibold">How can I help you work smarter?</h2>
                <p className="text-sm text-muted-foreground">
                  Ask anything about your work — planning, writing, summarising or problem-solving.
                </p>
              </div>
              <div className="mt-2 grid w-full max-w-xl gap-2 sm:grid-cols-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className="rounded-xl border bg-card px-4 py-3 text-left text-sm shadow-soft transition-colors hover:border-primary/40 hover:bg-secondary"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </ConversationEmptyState>
          ) : (
            messages.map((message) => (
              <Message key={message.id} from={message.role}>
                {message.role === "assistant" ? (
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-card ring-1 ring-border">
                      <LogoMark className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <MessageContent>
                        {message.parts.map((part, i) =>
                          part.type === "text" ? (
                            <MessageResponse key={`${message.id}-${i}`}>{part.text}</MessageResponse>
                          ) : null,
                        )}
                      </MessageContent>
                      {status !== "streaming" || message.id !== messages[messages.length - 1]?.id ? (
                        <MessageActions className="mt-1">
                          <MessageAction
                            label="Copy"
                            tooltip="Copy"
                            onClick={async () => {
                              await navigator.clipboard.writeText(textOf(message));
                              setCopiedId(message.id);
                              setTimeout(() => setCopiedId(null), 1500);
                            }}
                          >
                            {copiedId === message.id ? <Check /> : <Copy />}
                          </MessageAction>
                        </MessageActions>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <MessageContent className="group-[.is-user]:rounded-2xl group-[.is-user]:bg-primary group-[.is-user]:text-primary-foreground">
                    {message.parts.map((part, i) =>
                      part.type === "text" ? (
                        <p key={`${message.id}-${i}`} className="whitespace-pre-wrap">
                          {part.text}
                        </p>
                      ) : null,
                    )}
                  </MessageContent>
                )}
              </Message>
            ))
          )}
          {status === "submitted" ? (
            <div className="flex items-center gap-3">
              <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-card ring-1 ring-border">
                <LogoMark className="size-5" />
              </span>
              <Shimmer className="text-sm">Thinking…</Shimmer>
            </div>
          ) : null}
          {error ? (
            <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {error.message || "Something went wrong. Please try again."}
            </p>
          ) : null}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="border-t bg-background px-3 pb-3 pt-3 sm:px-6">
        <div className="mx-auto w-full max-w-3xl space-y-2" ref={composerRef}>
          <PromptInput onSubmit={handleSubmit} className="rounded-2xl bg-card shadow-soft">
            <PromptInputTextarea autoFocus placeholder="Ask your workplace assistant…" maxLength={8000} />
            <PromptInputFooter className="justify-end">
              <PromptInputSubmit status={status} onStop={stop} />
            </PromptInputFooter>
          </PromptInput>
          <ResponsibleAiNotice variant="inline" className="justify-center text-center" />
        </div>
      </div>
    </div>
  );
}
