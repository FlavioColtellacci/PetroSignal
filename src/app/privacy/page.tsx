import { TerminalShell } from "@/components/layout/terminal-shell";

export default function PrivacyPage() {
  return (
    <TerminalShell
      title="Privacy Policy"
      subtitle="How PetroSignal handles authentication and intelligence data."
    >
      <article className="space-y-4 border border-outline-variant bg-surface-container p-container text-sm text-muted-foreground">
        <p>
          PetroSignal stores account identifiers, saved interface preferences, and generated
          intelligence artifacts to deliver the product experience.
        </p>
        <p>
          Operational telemetry (for example cron execution metadata and provider errors) is used
          only for reliability monitoring and abuse prevention.
        </p>
        <p>
          We do not sell personal data. Access to account-scoped data is restricted by authenticated
          Firebase sessions and Firestore security rules.
        </p>
      </article>
    </TerminalShell>
  );
}
