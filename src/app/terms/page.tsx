import { TerminalShell } from "@/components/layout/terminal-shell";

export default function TermsPage() {
  return (
    <TerminalShell
      title="Terms of Service"
      subtitle="Usage boundaries for PetroSignal beta access."
    >
      <article className="space-y-4 border border-outline-variant bg-surface-container p-container text-sm text-muted-foreground">
        <p>
          PetroSignal is provided during beta on an as-is basis. Intelligence output supports
          analyst workflows and should not be treated as legal, financial, or compliance advice.
        </p>
        <p>
          You agree not to automate abusive traffic, bypass authentication controls, or attempt
          unauthorized data access.
        </p>
        <p>
          We may suspend accounts that violate security safeguards or compromise platform stability.
        </p>
      </article>
    </TerminalShell>
  );
}
