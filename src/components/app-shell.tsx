import { Outlet, useRouterState } from "@tanstack/react-router";

import { AppSidebar, NAV_ITEMS } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

export function AppShell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const current = NAV_ITEMS.find((item) => pathname === item.url || pathname.startsWith(`${item.url}/`));
  const isChat = pathname.startsWith("/chat");

  return (
    <SidebarProvider>
      <div className="flex min-h-svh w-full">
        <AppSidebar />
        <SidebarInset className="min-w-0 bg-background">
          <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b bg-background/85 px-3 backdrop-blur sm:px-5">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mx-1 h-5" />
            <span className="truncate font-display text-sm font-semibold text-foreground">
              {current?.title ?? "Workspace"}
            </span>
          </header>
          {isChat ? (
            <div className="flex min-h-0 flex-1 flex-col">
              <Outlet />
            </div>
          ) : (
            <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
              <Outlet />
            </main>
          )}
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
