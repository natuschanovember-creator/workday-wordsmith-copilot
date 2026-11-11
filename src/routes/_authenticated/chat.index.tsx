import { createFileRoute, redirect } from "@tanstack/react-router";

import { supabase } from "@/integrations/supabase/client";
import { threadsQuery } from "@/lib/queries";

// /chat opens the most recent conversation, or starts the first one.
export const Route = createFileRoute("/_authenticated/chat/")({
  loader: async ({ context }) => {
    const threads = await context.queryClient.ensureQueryData(threadsQuery());
    if (threads.length > 0) {
      throw redirect({ to: "/chat/$threadId", params: { threadId: threads[0].id }, replace: true });
    }
    const { data, error } = await supabase
      .from("chat_threads")
      .insert({ user_id: context.user.id })
      .select("id")
      .single();
    if (error) throw error;
    await context.queryClient.invalidateQueries({ queryKey: ["threads"] });
    throw redirect({ to: "/chat/$threadId", params: { threadId: data.id }, replace: true });
  },
});
