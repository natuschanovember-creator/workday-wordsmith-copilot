import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Loader2, MessageSquarePlus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { threadsQuery } from "@/lib/queries";
import { cn } from "@/lib/utils";

export function useCreateThread() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("chat_threads")
        .insert({ user_id: userData.user!.id })
        .select("id")
        .single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: async (id) => {
      await queryClient.invalidateQueries({ queryKey: ["threads"] });
      navigate({ to: "/chat/$threadId", params: { threadId: id } });
    },
    onError: () => toast.error("Couldn't start a new conversation."),
  });
}

export function ThreadList({ onNavigate }: { onNavigate?: () => void }) {
  const { data: threads = [] } = useQuery(threadsQuery());
  const params = useParams({ strict: false }) as { threadId?: string };
  const activeId = params.threadId;
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const create = useCreateThread();

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("chat_threads").delete().eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: async (id) => {
      await queryClient.invalidateQueries({ queryKey: ["threads"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      if (id === activeId) navigate({ to: "/chat" });
    },
    onError: () => toast.error("Couldn't delete this conversation."),
  });

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="p-3">
        <Button
          className="w-full"
          onClick={() => {
            create.mutate();
            onNavigate?.();
          }}
          disabled={create.isPending}
        >
          {create.isPending ? <Loader2 className="animate-spin" /> : <MessageSquarePlus />}
          New conversation
        </Button>
      </div>
      <p className="px-4 pb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        Conversations
      </p>
      <ul className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-2 pb-3">
        {threads.map((t) => (
          <li
            key={t.id}
            className={cn(
              "group flex items-center rounded-lg pr-1 transition-colors hover:bg-muted",
              t.id === activeId && "bg-secondary hover:bg-secondary",
            )}
          >
            <Link
              to="/chat/$threadId"
              params={{ threadId: t.id }}
              onClick={onNavigate}
              className="min-w-0 flex-1 px-3 py-2"
            >
              <span className="block truncate text-sm font-medium">{t.title}</span>
              <span className="block text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(t.updated_at), { addSuffix: true })}
              </span>
            </Link>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Delete ${t.title}`}
              className="text-muted-foreground opacity-100 hover:text-destructive lg:opacity-0 lg:group-hover:opacity-100"
              onClick={() => remove.mutate(t.id)}
              disabled={remove.isPending}
            >
              <Trash2 />
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
