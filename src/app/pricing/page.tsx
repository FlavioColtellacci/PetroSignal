import { TerminalShell } from "@/components/layout/terminal-shell"

export default function PricingPage() {
  return (
    <TerminalShell
      title="Pricing"
      subtitle="Subscription tiers for intelligence access, automation depth, and team controls."
    >
      <section className="grid gap-gutter lg:grid-cols-3">
        <article className="border border-outline-variant bg-surface-container p-container">
          <h2 className="font-heading text-xs uppercase tracking-[0.04em] text-primary">Free</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Daily digest, basic alert stream, and limited historical context.
          </p>
        </article>
        <article className="border border-outline-variant bg-surface-container p-container">
          <h2 className="font-heading text-xs uppercase tracking-[0.04em] text-primary">
            Professional
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Full role briefings, customizable alerting, and API access for operational teams.
          </p>
        </article>
        <article className="border border-outline-variant bg-surface-container p-container">
          <h2 className="font-heading text-xs uppercase tracking-[0.04em] text-primary">
            Enterprise
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Multi-region controls, governance workflows, and dedicated intelligence integrations.
          </p>
        </article>
      </section>
    </TerminalShell>
  )
}
