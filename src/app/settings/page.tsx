"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { OnboardingGuard } from "@/components/auth/onboarding-guard"
import { ProtectedPage } from "@/components/auth/protected-page"
import { useAuth } from "@/components/auth/auth-provider"
import { TerminalShell } from "@/components/layout/terminal-shell"
import { useUserPreferences } from "@/lib/user-preferences-client"
import { BRIEFING_ROLES, type BriefingRole } from "@/types/domain"

import { TIMEZONE_OPTIONS } from "@/lib/timezones"

export default function SettingsPage() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const { preferences, loading: preferencesLoading, error: preferencesError, savePreferences } = useUserPreferences()
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const [pendingSignOut, setPendingSignOut] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const userDisplay = useMemo(() => {
    if (!user) {
      return "No authenticated user."
    }
    return user.email ?? user.uid
  }, [user])

  async function persistSettings(nextDefaultRole: BriefingRole, nextTimezone: string) {
    try {
      setSaveError(null)
      await savePreferences({
        ...preferences,
        defaultRole: nextDefaultRole,
        timezone: nextTimezone,
        dashboard: {
          role: nextDefaultRole,
        },
        news: {
          ...preferences.news,
          roleFocus: nextDefaultRole,
        },
      })
      setSavedAt(new Date().toLocaleTimeString())
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Unable to persist settings.")
    }
  }

  async function handleSignOut() {
    setPendingSignOut(true)
    try {
      await signOut()
      router.replace("/login")
    } finally {
      setPendingSignOut(false)
    }
  }

  return (
    <ProtectedPage>
      <OnboardingGuard>
      <TerminalShell
        title="Workspace Settings"
        subtitle="Manage your session, defaults, and per-user operational preferences."
      >
        <section className="grid gap-gutter lg:grid-cols-2">
          <article className="space-y-3 border border-outline-variant bg-surface-container p-container">
            <h2 className="font-heading text-xs uppercase tracking-[0.04em] text-primary">
              Preferences
            </h2>

            <label className="block">
              <span className="text-xs uppercase tracking-[0.04em] text-muted-foreground">
                Default briefing role
              </span>
              <select
                value={preferences.defaultRole}
                onChange={(event) =>
                  void persistSettings(event.target.value as BriefingRole, preferences.timezone)
                }
                className="mt-1 w-full border border-outline-variant bg-surface-container-low px-3 py-2 text-sm"
                disabled={preferencesLoading}
              >
                {BRIEFING_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-xs uppercase tracking-[0.04em] text-muted-foreground">
                Timezone
              </span>
              <select
                value={preferences.timezone}
                onChange={(event) =>
                  void persistSettings(preferences.defaultRole, event.target.value)
                }
                className="mt-1 w-full border border-outline-variant bg-surface-container-low px-3 py-2 text-sm"
                disabled={preferencesLoading}
              >
                {TIMEZONE_OPTIONS.map((timezone) => (
                  <option key={timezone} value={timezone}>
                    {timezone}
                  </option>
                ))}
              </select>
            </label>

            <p className="text-xs text-muted-foreground">Saved to your profile preferences{savedAt ? ` at ${savedAt}` : "."}</p>
            {(preferencesError || saveError) && (
              <p className="text-xs text-rose-400">{preferencesError ?? saveError}</p>
            )}
          </article>

          <article className="space-y-3 border border-outline-variant bg-surface-container p-container">
            <h2 className="font-heading text-xs uppercase tracking-[0.04em] text-primary">
              Security & Session
            </h2>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>
                Signed in as: <span className="text-foreground">{userDisplay}</span>
              </p>
              <p>Auth provider: Firebase email/password</p>
              <p>
                Legal:{" "}
                <Link href="/privacy" className="underline underline-offset-4">
                  Privacy
                </Link>{" "}
                and{" "}
                <Link href="/terms" className="underline underline-offset-4">
                  Terms
                </Link>
              </p>
            </div>

            <button
              type="button"
              onClick={handleSignOut}
              disabled={pendingSignOut}
              className="border border-outline-variant bg-surface-container-low px-3 py-2 font-heading text-xs uppercase tracking-[0.04em] transition hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-70"
            >
              {pendingSignOut ? "Signing out..." : "Sign out"}
            </button>
          </article>
        </section>
      </TerminalShell>
      </OnboardingGuard>
    </ProtectedPage>
  )
}
