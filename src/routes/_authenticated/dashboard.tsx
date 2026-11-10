import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ArrowRight, FileText, Mail, MessagesSquare, Search, TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

import { ResponsibleAiNotice } from "@/components/responsible-ai-notice";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { dashboardQuery, profileQuery } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — AI Workplace Productivity Assistant" },
      { name: "description", content: "Your AI productivity overview: recent emails, research and conversations." },
      { property: "og:title", content: "Dashboard — AI Workplace Productivity Assistant" },
      { property: "og:description", content: "Your AI productivity overview." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(dashboardQuery()),
      context.queryClient.ensureQueryData(profileQuery(context.user.id)),
    ]);
  },
  component: Dashboard,
});

const chartConfig = {
  emails: { label: "Emails", color: "var(--chart-1)" },
  research: { label: "Research", color: "var(--chart-2)" },
  chats: { label: "Chat messages", color: "var(--chart-3)" },
} satisfies ChartConfig;

const TOOLS = [
  {
    to: "/email" as const,
    icon: Mail,
    title: "Write an email",
    body: "Follow-ups, updates, requests — drafted in your tone.",
  },
  {
    to: "/research" as const,
    icon: Search,
    title: "Research a topic",
    body: "Get a structured brief tailored to your audience.",
  },
  {
    to: "/chat" as const,
    icon: MessagesSquare,
    title: "Ask the assistant",
    body: "Plan, brainstorm, summarise and solve problems.",
  },
];

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function Dashboard() {
  const { user } = Route.useRouteContext();
  const { data } = useSuspenseQuery(dashboardQuery());
  const { data: profile } = useSuspenseQuery(profileQuery(user.id));
  const firstName = (profile?.display_name || user.email?.split("@")[0] || "there").split(" ")[0];

  const stats = [
    { label: "Emails saved", value: data.counts.emails, icon: Mail },
    { label: "Research briefs", value: data.counts.research, icon: FileText },
    { label: "Conversations", value: data.counts.threads, icon: MessagesSquare },
    { label: "Actions this week", value: data.counts.week, icon: TrendingUp },
  ];

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-hero px-6 py-8 text-forest-foreground sm:px-10 sm:py-10">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-40" />
        <div className="pointer-events-none absolute inset-0 bg-glow" />
        <div className="relative">
          <p className="text-sm font-medium text-moss">{greeting()}, {firstName}</p>
          <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">What would you like to get done today?</h1>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {TOOLS.map(({ to, icon: Icon, title, body }) => (
              <Link
                key={to}
                to={to}
                className="group flex items-start gap-3 rounded-2xl border border-forest-foreground/15 bg-forest-foreground/5 p-4 transition-colors hover:bg-forest-foreground/10"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-moss text-moss-foreground">
                  <Icon className="size-5" />
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-1 font-display text-sm font-semibold">
                    {title}
                    <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                  <span className="mt-0.5 block text-xs text-forest-foreground/70">{body}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-2xl border bg-card p-4 shadow-soft sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">{label}</span>
              <Icon className="size-4 text-primary" />
            </div>
            <p className="mt-2 font-display text-3xl font-semibold">{value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-5">
        <div className="rounded-2xl border bg-card p-4 shadow-soft sm:p-5 lg:col-span-3">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-base font-semibold">Activity · last 7 days</h2>
          </div>
          <ChartContainer config={chartConfig} className="mt-4 h-56 w-full">
            <BarChart data={data.activity} margin={{ left: -16, right: 4 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="emails" stackId="a" fill="var(--color-emails)" radius={[0, 0, 4, 4]} />
              <Bar dataKey="research" stackId="a" fill="var(--color-research)" />
              <Bar dataKey="chats" stackId="a" fill="var(--color-chats)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </div>

        <div className="rounded-2xl border bg-card shadow-soft lg:col-span-2">
          <h2 className="border-b px-5 py-4 font-display text-base font-semibold">Recent work</h2>
          <ul className="divide-y">
            {data.recentDocs.length === 0 && data.recentThreads.length === 0 ? (
              <li className="px-5 py-8 text-center text-sm text-muted-foreground">
                Your saved emails, research and chats will show up here.
              </li>
            ) : null}
            {data.recentDocs.map((doc) => (
              <li key={doc.id}>
                <Link
                  to={doc.kind === "email" ? "/email" : "/research"}
                  search={{ doc: doc.id }}
                  className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted"
                >
                  {doc.kind === "email" ? (
                    <Mail className="size-4 shrink-0 text-primary" />
                  ) : (
                    <Search className="size-4 shrink-0 text-primary" />
                  )}
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{doc.title}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(doc.updated_at), { addSuffix: true })}
                  </span>
                </Link>
              </li>
            ))}
            {data.recentThreads.map((t) => (
              <li key={t.id}>
                <Link
                  to="/chat/$threadId"
                  params={{ threadId: t.id }}
                  className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted"
                >
                  <MessagesSquare className="size-4 shrink-0 text-primary" />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{t.title}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(t.updated_at), { addSuffix: true })}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <ResponsibleAiNotice />
    </div>
  );
}
