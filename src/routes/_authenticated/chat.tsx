import { createFileRoute, Outlet } from "@tanstack/react-router";

import { ThreadList } from "@/components/chat/thread-list";
import { threadsQuery } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/chat")({
  head: () => ({
    meta: [
      { title: "AI Chat — AI Workplace Productivity Assistant" },
      { name: "description", content: "Chat with your AI workplace assistant to plan, draft and solve problems." },
      { property: "og:title", content: "AI Chat Assistant" },
      { property: "og:description", content: "Chat with your AI workplace assistant to plan, draft and solve problems." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(threadsQuery()),
  component: ChatLayout,
});

function ChatLayout() {
  return (
    <div className="flex h-[calc(100svh-3.5rem)] min-h-0">
      <aside className="hidden w-72 shrink-0 border-r bg-card lg:block">
        <ThreadList />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <Outlet />
      </div>
    </div>
  );
}
