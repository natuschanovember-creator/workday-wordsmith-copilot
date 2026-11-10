import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { FileText, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { documentsQuery, type DocKind } from "@/lib/queries";
import { cn } from "@/lib/utils";

type Props = {
  kind: DocKind;
  title: string;
  activeId?: string;
  onOpen: (id: string) => void;
  onDeleted?: (id: string) => void;
};

export function SavedDocuments({ kind, title, activeId, onOpen, onDeleted }: Props) {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery(documentsQuery(kind));

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("documents").delete().eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: (id) => {
      toast.success("Deleted");
      queryClient.invalidateQueries({ queryKey: ["documents", kind] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      onDeleted?.(id);
    },
    onError: () => toast.error("Couldn't delete. Please try again."),
  });

  return (
    <section className="rounded-2xl border bg-card shadow-soft">
      <header className="flex items-center justify-between border-b px-4 py-3 sm:px-5">
        <h2 className="font-display text-sm font-semibold">{title}</h2>
        <span className="text-xs text-muted-foreground">{data?.length ?? 0} saved</span>
      </header>
      <div className="max-h-80 overflow-y-auto p-2">
        {isLoading ? (
          <div className="space-y-2 p-2">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        ) : !data?.length ? (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">
            Nothing saved yet. Generate something and press Save.
          </p>
        ) : (
          <ul className="space-y-1">
            {data.map((doc) => (
              <li
                key={doc.id}
                className={cn(
                  "group flex items-center gap-2 rounded-lg pr-1 transition-colors hover:bg-muted",
                  activeId === doc.id && "bg-secondary hover:bg-secondary",
                )}
              >
                <button
                  type="button"
                  onClick={() => onOpen(doc.id)}
                  className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2 text-left"
                >
                  <FileText className="size-4 shrink-0 text-primary" aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{doc.title}</span>
                    <span className="block text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(doc.updated_at), { addSuffix: true })}
                    </span>
                  </span>
                </button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Delete ${doc.title}`}
                  onClick={() => remove.mutate(doc.id)}
                  disabled={remove.isPending}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
