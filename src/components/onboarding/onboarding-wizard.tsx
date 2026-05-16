"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { ROLE_LABELS } from "@/components/dashboard/role-selector";
import { useUserPreferences } from "@/lib/user-preferences-client";
import { TIMEZONE_OPTIONS } from "@/lib/timezones";
import { BRIEFING_ROLES, type AlertSeverity, type BriefingRole } from "@/types/domain";

export function OnboardingWizard() {
  const router = useRouter();
  const { preferences, loading, savePreferences } = useUserPreferences();
  const [role, setRole] = useState<BriefingRole>("investor");
  const [timezone, setTimezone] = useState<string>("America/Caracas");
  const [severityFilter, setSeverityFilter] = useState<AlertSeverity | "all">("all");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && preferences.onboardingCompleted) {
      router.replace("/dashboard");
    }
  }, [loading, preferences.onboardingCompleted, router]);

  if (!loading && preferences.onboardingCompleted) {
    return null;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      await savePreferences({
        ...preferences,
        defaultRole: role,
        timezone,
        onboardingCompleted: true,
        dashboard: { role },
        alerts: {
          ...preferences.alerts,
          severityFilter,
        },
        news: {
          ...preferences.news,
          roleFocus: role,
        },
      });
      router.replace("/dashboard");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to save onboarding preferences.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="min-h-screen bg-surface-dim px-container py-container text-foreground">
      <section className="mx-auto w-full max-w-2xl border border-outline-variant bg-surface-container-low">
        <header className="border-b border-outline-variant px-container py-compact">
          <p className="font-heading text-xs uppercase tracking-[0.04em] text-muted-foreground">
            Welcome to PetroSignal
          </p>
          <h1 className="mt-1 font-heading text-lg font-semibold">Configure your briefing workspace</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Set defaults once. Your dashboard, alerts, and daily briefings will align to this profile.
          </p>
        </header>

        <form className="space-y-4 p-container" onSubmit={onSubmit}>
          <fieldset className="space-y-2">
            <legend className="font-heading text-xs uppercase tracking-[0.04em] text-primary">
              Primary briefing role
            </legend>
            <p className="text-xs text-muted-foreground">
              Choose the lens that best matches how you consume Venezuela petroleum intelligence.
            </p>
            <div className="flex flex-wrap gap-2">
              {BRIEFING_ROLES.map((option) => {
                const isActive = option === role;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setRole(option)}
                    className={`border px-2 py-1 font-heading text-xs uppercase tracking-[0.04em] transition ${
                      isActive
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-outline-variant bg-surface-container-high hover:bg-surface-container-highest"
                    }`}
                  >
                    {ROLE_LABELS[option]}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <label className="block">
            <span className="font-heading text-xs uppercase tracking-[0.04em] text-primary">
              Delivery timezone
            </span>
            <select
              value={timezone}
              onChange={(event) => setTimezone(event.target.value)}
              className="mt-2 w-full border border-outline-variant bg-surface-container px-3 py-2 text-sm"
            >
              {TIMEZONE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="font-heading text-xs uppercase tracking-[0.04em] text-primary">
              Alert sensitivity
            </span>
            <select
              value={severityFilter}
              onChange={(event) =>
                setSeverityFilter(event.target.value as AlertSeverity | "all")
              }
              className="mt-2 w-full border border-outline-variant bg-surface-container px-3 py-2 text-sm"
            >
              <option value="all">All severities</option>
              <option value="high">High only</option>
              <option value="medium">Medium and above</option>
              <option value="low">Include low-signal items</option>
            </select>
          </label>

          {error ? (
            <p className="border border-outline-variant bg-surface-container p-2 text-xs text-rose-400">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={pending || loading}
            className="w-full border border-primary bg-primary px-3 py-2 font-heading text-xs uppercase tracking-[0.04em] text-primary-foreground transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {pending ? "Saving..." : "Enter dashboard"}
          </button>
        </form>
      </section>
    </main>
  );
}
