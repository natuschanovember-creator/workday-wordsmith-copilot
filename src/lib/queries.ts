import { queryOptions } from "@tanstack/react-query";
import type { UIMessage } from "ai";

import { supabase } from "@/integrations/supabase/client";

export type DocKind = "email" | "research";

export const profileQuery = (userId: string) =>
  queryOptions({
    queryKey: ["profile", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, job_title")
        .eq("id", userId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export const documentsQuery = (kind: DocKind) =>
  queryOptions({
    queryKey: ["documents", kind],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("id, kind, title, content, updated_at, created_at")
        .eq("kind", kind)
        .order("updated_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

export const documentQuery = (id: string) =>
  queryOptions({
    queryKey: ["document", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export const threadsQuery = () =>
  queryOptions({
    queryKey: ["threads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chat_threads")
        .select("id, title, updated_at, created_at")
        .order("updated_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

export const threadMessagesQuery = (threadId: string) =>
  queryOptions({
    queryKey: ["thread-messages", threadId],
    queryFn: async (): Promise<UIMessage[]> => {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("message_id, role, parts, created_at")
        .eq("thread_id", threadId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((row) => ({
        id: row.message_id,
        role: row.role as UIMessage["role"],
        parts: (row.parts ?? []) as unknown as UIMessage["parts"],
      }));
    },
    staleTime: 0,
  });

export const dashboardQuery = () =>
  queryOptions({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const since = new Date();
      since.setHours(0, 0, 0, 0);
      since.setDate(since.getDate() - 6);
      const sinceIso = since.toISOString();

      const [emails, research, threads, recentDocs, recentThreads, weekDocs, weekMsgs] =
        await Promise.all([
          supabase.from("documents").select("id", { count: "exact", head: true }).eq("kind", "email"),
          supabase
            .from("documents")
            .select("id", { count: "exact", head: true })
            .eq("kind", "research"),
          supabase.from("chat_threads").select("id", { count: "exact", head: true }),
          supabase
            .from("documents")
            .select("id, kind, title, updated_at")
            .order("updated_at", { ascending: false })
            .limit(5),
          supabase
            .from("chat_threads")
            .select("id, title, updated_at")
            .order("updated_at", { ascending: false })
            .limit(5),
          supabase.from("documents").select("kind, created_at").gte("created_at", sinceIso).limit(1000),
          supabase
            .from("chat_messages")
            .select("created_at")
            .eq("role", "user")
            .gte("created_at", sinceIso)
            .limit(1000),
        ]);

      for (const r of [emails, research, threads, recentDocs, recentThreads, weekDocs, weekMsgs]) {
        if (r.error) throw r.error;
      }

      const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(since);
        d.setDate(since.getDate() + i);
        return {
          key: d.toDateString(),
          label: d.toLocaleDateString(undefined, { weekday: "short" }),
          emails: 0,
          research: 0,
          chats: 0,
        };
      });
      const byKey = new Map(days.map((d) => [d.key, d]));
      for (const doc of weekDocs.data ?? []) {
        const day = byKey.get(new Date(doc.created_at).toDateString());
        if (day) {
          if (doc.kind === "email") day.emails++;
          else day.research++;
        }
      }
      for (const msg of weekMsgs.data ?? []) {
        const day = byKey.get(new Date(msg.created_at).toDateString());
        if (day) day.chats++;
      }

      const weekTotal = days.reduce((sum, d) => sum + d.emails + d.research + d.chats, 0);

      return {
        counts: {
          emails: emails.count ?? 0,
          research: research.count ?? 0,
          threads: threads.count ?? 0,
          week: weekTotal,
        },
        recentDocs: recentDocs.data ?? [],
        recentThreads: recentThreads.data ?? [],
        activity: days,
      };
    },
  });
