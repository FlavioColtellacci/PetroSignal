import Link from "next/link";

import { TerminalShell } from "@/components/layout/terminal-shell";

export default function PricingPage() {
  return (
    <TerminalShell
      title="Pricing"
      subtitle="Full intelligence access is free during the public beta. Paid tiers arrive after launch feedback."
    >
      <section className="mb-gutter border border-primary/40 bg-surface-container p-container">
        <p className="font-heading text-xs uppercase tracking-[0.04em] text-primary">
          Beta access
        </p>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Every account receives daily role briefings, the alert stream, news wire, and dashboard
          exports at no cost while we validate product-market fit. Billing via Stripe is planned for
          a later release.
        </p>
        <Link
          href="/login?mode=sign-up&next=/onboarding"
          className="mt-4 inline-block border border-primary bg-primary px-4 py-2 font-heading text-xs uppercase tracking-[0.04em] text-primary-foreground transition hover:brightness-110"
        >
          Join the beta
        </Link>
      </section>

      <section className="grid gap-gutter lg:grid-cols-3">
        <article className="border border-primary bg-surface-container p-container">
          <h2 className="font-heading text-xs uppercase tracking-[0.04em] text-primary">
            Free · Beta
          </h2>
          <p className="mt-1 font-mono text-2xl text-foreground">$0</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Daily role briefings, alert stream, news wire, JSON/PDF export, and dashboard access.
          </p>
          <p className="mt-3 font-mono text-[11px] uppercase text-primary">Current plan</p>
        </article>
        <article className="border border-outline-variant bg-surface-container p-container opacity-80">
          <h2 className="font-heading text-xs uppercase tracking-[0.04em] text-muted-foreground">
            Professional
          </h2>
          <p className="mt-1 font-mono text-2xl text-muted-foreground">Coming soon</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Custom alert rules, extended history, and API access for operational teams.
          </p>
        </article>
        <article className="border border-outline-variant bg-surface-container p-container opacity-80">
          <h2 className="font-heading text-xs uppercase tracking-[0.04em] text-muted-foreground">
            Enterprise
          </h2>
          <p className="mt-1 font-mono text-2xl text-muted-foreground">Contact us</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Multi-seat workspaces, governance workflows, and dedicated intelligence integrations.
          </p>
        </article>
      </section>
    </TerminalShell>
  );
}
