import { TerminalShell } from "@/components/layout/terminal-shell"

export default function AlertsPage() {
  return (
    <TerminalShell
      title="Alert Center"
      subtitle="High-priority notifications from sanctions, market, and compliance monitors."
    >
      <section className="grid gap-gutter lg:grid-cols-2">
        <article className="border border-outline-variant bg-surface-container p-container">
          <h2 className="font-heading text-xs uppercase tracking-[0.04em] text-primary">
            Alert Feed (Scaffold)
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            This route is reserved for alert filtering, acknowledgements, and operator escalation
            workflows in upcoming phases.
          </p>
        </article>
        <article className="border border-outline-variant bg-surface-container p-container">
          <h2 className="font-heading text-xs uppercase tracking-[0.04em] text-primary">
            Next Build
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Wire this view to `/api/alerts` with severity filters, region facets, and escalation
            timestamps.
          </p>
        </article>
      </section>
    </TerminalShell>
  )
}
