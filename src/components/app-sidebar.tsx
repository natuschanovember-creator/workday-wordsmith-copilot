import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronsUpDown,
  LayoutDashboard,
  LogOut,
  Mail,
  MessagesSquare,
  Search,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useState } from "react";

import { BrandBadge, Wordmark } from "@/components/brand";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";
import { profileQuery } from "@/lib/queries";

export const NAV_ITEMS = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Email Generator", url: "/email", icon: Mail },
  { title: "Research Assistant", url: "/research", icon: Search },
  { title: "AI Chat", url: "/chat", icon: MessagesSquare },
  { title: "Responsible AI", url: "/responsible-ai", icon: ShieldCheck },
  { title: "Settings", url: "/settings", icon: Settings },
] as const;

const TOOLS = NAV_ITEMS.slice(0, 4);
const ACCOUNT = NAV_ITEMS.slice(4);

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { isMobile, setOpenMobile } = useSidebar();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUser({ id: data.user.id, email: data.user.email });
    });
  }, []);

  const { data: profile } = useQuery({ ...profileQuery(user?.id ?? ""), enabled: !!user });
  const name = profile?.display_name || user?.email?.split("@")[0] || "You";
  const initials = name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const isActive = (url: string) => pathname === url || pathname.startsWith(`${url}/`);
  const closeOnMobile = () => {
    if (isMobile) setOpenMobile(false);
  };

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  const renderItems = (items: typeof TOOLS | typeof ACCOUNT) =>
    items.map((item) => (
      <SidebarMenuItem key={item.url}>
        <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title} size="lg">
          <Link to={item.url} onClick={closeOnMobile}>
            <item.icon />
            <span>{item.title}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    ));

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-3 pt-4">
        <Link
          to="/dashboard"
          onClick={closeOnMobile}
          className="flex items-center gap-3 rounded-lg px-1 py-1 group-data-[collapsible=icon]:px-0"
        >
          <BrandBadge className="bg-sidebar-foreground ring-0" />
          <span className="group-data-[collapsible=icon]:hidden">
            <Wordmark inverted />
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-1 pt-3">
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/55">AI tools</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderItems(TOOLS)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/55">Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderItems(ACCOUNT)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-sidebar-primary text-xs font-bold text-sidebar-primary-foreground">
                    {initials}
                  </span>
                  <span className="grid min-w-0 flex-1 text-left leading-tight">
                    <span className="truncate text-sm font-semibold">{name}</span>
                    <span className="truncate text-xs text-sidebar-foreground/60">{user?.email}</span>
                  </span>
                  <ChevronsUpDown className="ml-auto size-4 opacity-60" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-56">
                <DropdownMenuLabel className="truncate font-normal text-muted-foreground">
                  {user?.email}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/settings" onClick={closeOnMobile}>
                    <Settings /> Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={signOut}>
                  <LogOut /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
