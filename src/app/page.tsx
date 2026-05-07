import Link from "next/link"

import { TerminalShell } from "@/components/layout/terminal-shell"

export default function HomePage() {
  return (
    <TerminalShell
      title="PetroSignal Landing"
      subtitle="Production-oriented foundation for petroleum intelligence workflows."
    >
      <section className="grid gap-gutter lg:grid-cols-[2fr_1fr]">
        <article className="border border-outline-variant bg-surface-container p-container">
          <h2 className="font-heading text-xs uppercase tracking-[0.04em] text-primary">
            Platform Overview
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            PetroSignal combines regional monitoring agents, role-based daily briefing output,
            and high-signal market alerts in a terminal-grade operating interface.
          </p>
          <div className="mt-4">
            <Link
              href="/dashboard"
              className="inline-block border border-primary bg-primary px-3 py-2 font-heading text-xs uppercase tracking-[0.04em] text-primary-foreground transition hover:brightness-110"
            >
              Open Dashboard
            </Link>
          </div>
        </article>
        <article className="border border-outline-variant bg-surface-container p-container">
          <h2 className="font-heading text-xs uppercase tracking-[0.04em] text-primary">
            Build Status
          </h2>
          <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
            <li>Next.js App Router foundation enabled</li>
            <li>Internal mock APIs feeding dashboard cards</li>
            <li>Role-based briefing contract wired end-to-end</li>
          </ul>
        </article>
      </section>
    </TerminalShell>
  )
}
