import Link from "next/link";

import { TerminalShell } from "@/components/layout/terminal-shell";

const AUDIENCE = [
  {
    title: "Investors & portfolio teams",
    body: "Track sanctions, export flows, and benchmark spreads with a daily investor-grade briefing.",
  },
  {
    title: "Advisors & operators",
    body: "Monitor PDVSA production signals, JV activity, and terminal throughput in one terminal view.",
  },
  {
    title: "Compliance & engineering",
    body: "Surface high-severity alerts and role-specific context without rebuilding your own news stack.",
  },
] as const;

const CAPABILITIES = [
  "Five specialized monitoring agents ingest Venezuela petroleum intelligence daily.",
  "Role-based briefings tailored to investor, consultant, compliance, and operations lenses.",
  "Live alerts, news wire, and agent health on a single operations dashboard.",
] as const;

export default function HomePage() {
  return (
    <TerminalShell
      title="Venezuela petroleum intelligence, delivered daily"
      subtitle="PetroSignal turns regional monitoring agents into role-based briefings, alerts, and a terminal-grade dashboard for teams tracking Venezuelan oil markets."
    >
      <section className="grid gap-gutter lg:grid-cols-[3fr_2fr]">
        <article className="space-y-4 border border-outline-variant bg-surface-container p-container">
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Stop stitching together scattered headlines. PetroSignal aggregates sanctions, PDVSA,
            market, JV, and social signals into structured daily briefings—with severity-ranked
            alerts when conditions shift.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/login?mode=sign-up&next=/onboarding"
              className="inline-block border border-primary bg-primary px-4 py-2 font-heading text-xs uppercase tracking-[0.04em] text-primary-foreground transition hover:brightness-110"
            >
              Start free beta
            </Link>
            <Link
              href="/login?next=/dashboard"
              className="inline-block border border-outline-variant bg-surface-container-high px-4 py-2 font-heading text-xs uppercase tracking-[0.04em] transition hover:bg-surface-container-highest"
            >
              Sign in
            </Link>
          </div>
          <p className="font-mono text-[11px] text-muted-foreground">
            Free during beta · No credit card required
          </p>
        </article>

        <article className="border border-outline-variant bg-surface-container p-container">
          <h2 className="font-heading text-xs uppercase tracking-[0.04em] text-primary">
            Built for
          </h2>
          <ul className="mt-3 space-y-3">
            {AUDIENCE.map((item) => (
              <li key={item.title}>
                <p className="font-heading text-xs uppercase tracking-[0.04em] text-foreground">
                  {item.title}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="mt-gutter border border-outline-variant bg-surface-container p-container">
        <h2 className="font-heading text-xs uppercase tracking-[0.04em] text-primary">
          What you get
        </h2>
        <ul className="mt-3 grid gap-3 md:grid-cols-3">
          {CAPABILITIES.map((item) => (
            <li key={item} className="text-sm text-muted-foreground">
              {item}
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/pricing"
            className="font-mono text-xs uppercase tracking-[0.04em] text-primary underline underline-offset-4 hover:text-foreground"
          >
            View pricing
          </Link>
          <Link
            href="/dashboard"
            className="font-mono text-xs uppercase tracking-[0.04em] text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            Open dashboard
          </Link>
        </div>
      </section>
    </TerminalShell>
  );
}
