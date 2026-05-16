"use client"

import { useEffect, useMemo, useState } from "react"

import { OnboardingGuard } from "@/components/auth/onboarding-guard"
import { ProtectedPage } from "@/components/auth/protected-page"
import { TerminalShell } from "@/components/layout/terminal-shell"
import { useUserPreferences } from "@/lib/user-preferences-client"
import type { AlertItem, AlertSeverity } from "@/types/domain"

const WINDOW_OPTIONS = [
  { value: "24h", label: "Last 24h", ms: 24 * 60 * 60 * 1000 },
  { value: "7d", label: "Last 7d", ms: 7 * 24 * 60 * 60 * 1000 },
  { value: "30d", label: "Last 30d", ms: 30 * 24 * 60 * 60 * 1000 },
] as const

type WindowValue = (typeof WINDOW_OPTIONS)[number]["value"]

function severityClass(severity: AlertSeverity) {
  if (severity === "high") return "text-rose-400"
  if (severity === "medium") return "text-amber-400"
  return "text-emerald-400"
}

export default function AlertsPage() {
  const { preferences, loading: preferencesLoading, savePreferences } = useUserPreferences()
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [runtimeMode, setRuntimeMode] = useState<"live-firestore" | "fallback-mock" | "unknown">("unknown")
  const [severityFilter, setSeverityFilter] = useState<AlertSeverity | "all">("all")
  const [windowFilter, setWindowFilter] = useState<WindowValue>("7d")
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest")
  const [preferencesInitialized, setPreferencesInitialized] = useState(false)

  useEffect(() => {
    if (preferencesLoading || preferencesInitialized) {
      return
    }
    setSeverityFilter(preferences.alerts.severityFilter)
    setWindowFilter(preferences.alerts.windowFilter)
    setSortOrder(preferences.alerts.sortOrder)
    setPreferencesInitialized(true)
  }, [preferences, preferencesInitialized, preferencesLoading])

  function persistAlertPreferences(next: {
    severityFilter: AlertSeverity | "all"
    windowFilter: WindowValue
    sortOrder: "newest" | "oldest"
  }) {
    void savePreferences({
      ...preferences,
      alerts: next,
    }).catch((requestError: unknown) => {
      console.error("Failed to persist alert preferences.", requestError)
    })
  }

  useEffect(() => {
    const controller = new AbortController()

    async function loadAlerts() {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch("/api/alerts", {
          signal: controller.signal,
          cache: "no-store",
        })
        if (!response.ok) {
          throw new Error(`Failed to load alerts (${response.status})`)
        }
        const mode = response.headers.get("x-petrosignal-runtime-mode")
        if (mode === "live-firestore" || mode === "fallback-mock") {
          setRuntimeMode(mode)
        } else {
          setRuntimeMode("unknown")
        }
        const payload = (await response.json()) as AlertItem[]
        setAlerts(payload)
      } catch (requestError) {
        if (requestError instanceof DOMException && requestError.name === "AbortError") {
          return
        }
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to retrieve alert feed.",
        )
      } finally {
        setLoading(false)
      }
    }

    void loadAlerts()
    return () => controller.abort()
  }, [])

  const filteredAlerts = useMemo(() => {
    const selectedWindow = WINDOW_OPTIONS.find((option) => option.value === windowFilter)
    const thresholdMs = Date.now() - (selectedWindow?.ms ?? WINDOW_OPTIONS[1].ms)

    const result = alerts.filter((alert) => {
      const timestampMs = Date.parse(alert.timestamp)
      const inWindow = Number.isNaN(timestampMs) ? true : timestampMs >= thresholdMs
      const matchesSeverity =
        severityFilter === "all" ? true : alert.severity === severityFilter
      return inWindow && matchesSeverity
    })

    return result.sort((a, b) =>
      sortOrder === "newest"
        ? b.timestamp.localeCompare(a.timestamp)
        : a.timestamp.localeCompare(b.timestamp),
    )
  }, [alerts, severityFilter, sortOrder, windowFilter])

  return (
    <ProtectedPage>
      <OnboardingGuard>
      <TerminalShell
        title="Alert Center"
        subtitle="Filter, triage, and monitor priority intelligence alerts in real time."
      >
        <section className="space-y-gutter">
          <article className="grid gap-stack border border-outline-variant bg-surface-container p-container lg:grid-cols-3">
            <label className="space-y-1">
              <span className="font-heading text-[11px] uppercase tracking-[0.04em] text-muted-foreground">
                Severity
              </span>
              <select
                value={severityFilter}
                onChange={(event) => {
                  const value = event.target.value as AlertSeverity | "all"
                  setSeverityFilter(value)
                  persistAlertPreferences({
                    severityFilter: value,
                    windowFilter,
                    sortOrder,
                  })
                }}
                className="w-full border border-outline-variant bg-surface-container-low px-2 py-2 text-sm"
              >
                <option value="all">All severities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </label>
            <label className="space-y-1">
              <span className="font-heading text-[11px] uppercase tracking-[0.04em] text-muted-foreground">
                Time window
              </span>
              <select
                value={windowFilter}
                onChange={(event) => {
                  const value = event.target.value as WindowValue
                  setWindowFilter(value)
                  persistAlertPreferences({
                    severityFilter,
                    windowFilter: value,
                    sortOrder,
                  })
                }}
                className="w-full border border-outline-variant bg-surface-container-low px-2 py-2 text-sm"
              >
                {WINDOW_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className="font-heading text-[11px] uppercase tracking-[0.04em] text-muted-foreground">
                Sort
              </span>
              <select
                value={sortOrder}
                onChange={(event) => {
                  const value = event.target.value as "newest" | "oldest"
                  setSortOrder(value)
                  persistAlertPreferences({
                    severityFilter,
                    windowFilter,
                    sortOrder: value,
                  })
                }}
                className="w-full border border-outline-variant bg-surface-container-low px-2 py-2 text-sm"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
              </select>
            </label>
          </article>

          <article className="border border-outline-variant bg-surface-container p-container">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-heading text-xs uppercase tracking-[0.04em] text-primary">
                Live Alert Feed
              </h2>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] text-muted-foreground">
                  {runtimeMode === "fallback-mock" ? "Fallback mode" : "Live mode"}
                </span>
                <span className="font-mono text-xs text-muted-foreground">
                  {filteredAlerts.length} alerts
                </span>
              </div>
            </div>

            {loading && (
              <p className="mt-3 font-mono text-xs uppercase tracking-[0.04em] text-muted-foreground">
                Loading alerts...
              </p>
            )}
            {error && (
              <p className="mt-3 border border-outline-variant bg-surface-container-low p-2 text-xs text-rose-400">
                {error}
              </p>
            )}
            {!loading && !error && filteredAlerts.length === 0 && (
              <p className="mt-3 text-sm text-muted-foreground">
                No alerts matched the selected filters.
              </p>
            )}

            <div className="mt-3 space-y-2">
              {filteredAlerts.map((alert) => (
                <article
                  key={alert.id}
                  className="border border-outline-variant bg-surface-container-low p-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-heading text-sm">{alert.title}</h3>
                    <span
                      className={`font-mono text-[11px] uppercase tracking-[0.04em] ${severityClass(alert.severity)}`}
                    >
                      {alert.severity}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{alert.summary}</p>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span>{new Date(alert.timestamp).toLocaleString()}</span>
                    <a href={alert.source.url} target="_blank" rel="noreferrer" className="underline">
                      {alert.source.title ?? "Source"}
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </article>
        </section>
      </TerminalShell>
      </OnboardingGuard>
    </ProtectedPage>
  )
}
