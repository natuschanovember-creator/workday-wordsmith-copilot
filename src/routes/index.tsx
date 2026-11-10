import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  ListTree,
  Mail,
  MessagesSquare,
  PenLine,
  Save,
  Search,
  ShieldCheck,
} from "lucide-react";

import { BrandBadge, LogoMark, Wordmark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AI Workplace Productivity Assistant — Automate everyday work with AI" },
      {
        name: "description",
        content:
          "Generate polished emails, structured research briefs and get instant help from an AI chat assistant — with editable outputs and responsible AI built in.",
      },
      { property: "og:title", content: "AI Workplace Productivity Assistant" },
      {
        property: "og:description",
        content:
          "Smart email generator, AI research assistant and chat bot for busy professionals. Structured prompts, editable outputs, responsible AI.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  {
    icon: Mail,
    title: "Smart Email Generator",
    body: "Pick the purpose, recipient and tone. Get a ready-to-send draft with subject line in seconds — then refine it with one click.",
  },
  {
    icon: Search,
    title: "AI Research Assistant",
    body: "Turn any topic into an executive brief, SWOT, or comparison table, written for your audience and flagged for what to verify.",
  },
  {
    icon: MessagesSquare,
    title: "AI Chat Assistant",
    body: "Brainstorm, plan, summarise and draft with an assistant that keeps every conversation organised and saved.",
  },
];

const STEPS = [
  { icon: ListTree, title: "Structured prompt", body: "Fill a short form — we build a clear Role → Context → Task → Requirements → Format prompt you can see and edit." },
  { icon: PenLine, title: "Editable output", body: "Every result lands in an editor. Tweak it yourself or ask the AI to make it shorter, friendlier or more formal." },
  { icon: Save, title: "Save & reuse", body: "Keep your best emails and briefs in your private workspace and pick up where you left off." },
];

function Landing() {
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
  }, []);

  return (
    <div className="min-h-svh bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-hero text-forest-foreground">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-50" />
        <div className="pointer-events-none absolute inset-0 bg-glow" />

        <header className="relative mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
          <Link to="/" className="flex items-center gap-3">
            <BrandBadge className="bg-forest-foreground ring-0" />
            <Wordmark inverted />
          </Link>
          <nav className="flex items-center gap-2">
            {signedIn ? (
              <Button asChild variant="hero" size="sm">
                <Link to="/dashboard">Open dashboard</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="hero-outline" size="sm" className="hidden sm:inline-flex">
                  <Link to="/auth">Sign in</Link>
                </Button>
                <Button asChild variant="hero" size="sm">
                  <Link to="/auth">Get started</Link>
                </Button>
              </>
            )}
          </nav>
        </header>

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 pb-20 pt-10 sm:px-8 lg:grid-cols-2 lg:pb-28 lg:pt-16">
          <div className="animate-fade-up space-y-7">
            <span className="inline-flex items-center gap-2 rounded-full border border-forest-foreground/20 bg-forest-foreground/5 px-3 py-1 text-xs font-semibold text-moss">
              <ShieldCheck className="size-3.5" /> Responsible AI, built in
            </span>
            <h1 className="text-4xl font-semibold leading-[1.05] sm:text-5xl lg:text-6xl">
              Your AI teammate for everyday workplace tasks.
            </h1>
            <p className="max-w-xl text-lg text-forest-foreground/80">
              Write emails, research topics and get answers in one clean workspace — with prompts you can
              see, outputs you can edit, and your work saved securely.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild variant="hero" size="lg">
                <Link to={signedIn ? "/dashboard" : "/auth"}>
                  {signedIn ? "Go to dashboard" : "Start for free"} <ArrowRight />
                </Link>
              </Button>
              <Button asChild variant="hero-outline" size="lg">
                <a href="#features">See what it does</a>
              </Button>
            </div>
          </div>

          {/* Product preview */}
          <div className="animate-fade-up relative [animation-delay:120ms]">
            <div className="rounded-2xl border border-forest-foreground/15 bg-card p-2 text-card-foreground shadow-elevated">
              <div className="flex items-center gap-1.5 px-3 py-2">
                <span className="size-2.5 rounded-full bg-moss" />
                <span className="size-2.5 rounded-full bg-secondary" />
                <span className="size-2.5 rounded-full bg-secondary" />
                <span className="ml-3 text-xs font-medium text-muted-foreground">Email Generator</span>
              </div>
              <div className="grid gap-2 sm:grid-cols-5">
                <div className="space-y-2 rounded-xl bg-muted p-3 sm:col-span-2">
                  {[
                    ["Type", "Follow-up"],
                    ["To", "Dana · Client"],
                    ["Tone", "Friendly"],
                  ].map(([k, v]) => (
                    <div key={k} className="rounded-lg bg-card px-3 py-2">
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">{k}</p>
                      <p className="text-sm font-medium">{v}</p>
                    </div>
                  ))}
                  <div className="rounded-lg bg-primary px-3 py-2 text-center text-sm font-semibold text-primary-foreground">
                    Generate email
                  </div>
                </div>
                <div className="rounded-xl border bg-card p-4 sm:col-span-3">
                  <p className="text-xs font-semibold text-muted-foreground">Subject: Great speaking today — next steps</p>
                  <div className="mt-3 space-y-2 text-sm leading-relaxed">
                    <p>Hi Dana,</p>
                    <p>Thanks again for the call this morning. As promised, I'll send over the proposal by Friday…</p>
                    <p className="text-muted-foreground">Best,<br />Sam</p>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {["Shorter", "More formal", "Add CTA"].map((c) => (
                      <span key={c} className="rounded-md border px-2 py-0.5 text-[11px] font-medium">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Three tools, one workspace</p>
          <h2 className="mt-2 text-3xl font-semibold sm:text-4xl">Automate the work that slows you down</h2>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <article key={title} className="rounded-2xl border bg-card p-6 shadow-soft transition-shadow hover:shadow-elevated">
              <span className="grid size-11 place-items-center rounded-xl bg-secondary text-primary">
                <Icon className="size-5" />
              </span>
              <h3 className="mt-5 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-y bg-gradient-moss">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
          <h2 className="text-3xl font-semibold sm:text-4xl">You stay in control</h2>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {STEPS.map(({ icon: Icon, title, body }, i) => (
              <div key={title} className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {i + 1}
                  </span>
                  <Icon className="size-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Responsible AI */}
      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
        <div className="grid gap-8 rounded-3xl bg-forest p-8 text-forest-foreground sm:p-12 lg:grid-cols-2">
          <div>
            <ShieldCheck className="size-8 text-moss" />
            <h2 className="mt-4 text-3xl font-semibold">Responsible AI by design</h2>
            <p className="mt-3 text-forest-foreground/75">
              AI is a powerful assistant, not a replacement for your judgement. Every tool is built to keep
              a human in the loop.
            </p>
          </div>
          <ul className="space-y-3">
            {[
              "Clear disclaimers on every AI output",
              "Visible, editable prompts — no black boxes",
              "Instructions to never invent facts, sources or statistics",
              "Your saved work is private to your account",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-moss" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <footer className="border-t">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-5 py-8 text-sm text-muted-foreground sm:flex-row sm:px-8">
          <span className="flex items-center gap-2">
            <LogoMark className="size-5" /> AI Workplace Productivity Assistant
          </span>
          <span>AI can make mistakes — always review outputs.</span>
        </div>
      </footer>
    </div>
  );
}
