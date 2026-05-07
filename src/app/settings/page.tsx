import { TerminalShell } from "@/components/layout/terminal-shell"

export default function SettingsPage() {
  return (
    <TerminalShell
      title="Workspace Settings"
      subtitle="Configure account defaults, role preferences, and delivery options."
    >
      <section className="grid gap-gutter lg:grid-cols-2">
        <article className="border border-outline-variant bg-surface-container p-container">
          <h2 className="font-heading text-xs uppercase tracking-[0.04em] text-primary">
            Preferences (Scaffold)
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Reserved for notification cadence, default briefing role, and operator profile
            settings.
          </p>
        </article>
        <article className="border border-outline-variant bg-surface-container p-container">
          <h2 className="font-heading text-xs uppercase tracking-[0.04em] text-primary">
            Security
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Future phases will add session controls, API key management, and organization-level
            access policies.
          </p>
        </article>
      </section>
    </TerminalShell>
  )
}
