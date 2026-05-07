import { TerminalShell } from "@/components/layout/terminal-shell"

export default function NewsPage() {
  return (
    <TerminalShell
      title="News Desk"
      subtitle="Regional and sector headlines structured for live monitoring and triage."
    >
      <section className="grid gap-gutter lg:grid-cols-[2fr_1fr]">
        <article className="border border-outline-variant bg-surface-container p-container">
          <h2 className="font-heading text-xs uppercase tracking-[0.04em] text-primary">
            Live Wire Stream (Scaffold)
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            This route will host the expanded news stream with source-level controls and
            analyst-ready drilldown states.
          </p>
        </article>
        <article className="border border-outline-variant bg-surface-container p-container">
          <h2 className="font-heading text-xs uppercase tracking-[0.04em] text-primary">
            Next Build
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Integrate `/api/news` and add source reputation tags, watchlists, and role-aware
            highlight rules.
          </p>
        </article>
      </section>
    </TerminalShell>
  )
}
