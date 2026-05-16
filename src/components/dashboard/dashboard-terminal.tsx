"use client"

import { useCallback, useEffect, useState } from "react"

import type {
  AgentStatus,
  AlertItem,
  BriefingDocument,
  BriefingRole,
  MetricSnapshot,
  NewsItem,
} from "@/types/domain"
import { useUserPreferences } from "@/lib/user-preferences-client"

import { AgentStatusPanel } from "./agent-status-panel"
import { BriefingCard } from "./briefing-card"
import { LiveWire } from "./live-wire"
import { MetricCards } from "./metric-cards"

type AsyncState<T> =
  | { status: "loading"; data: null; error: null }
  | { status: "success"; data: T; error: null }
  | { status: "error"; data: null; error: string }

type RuntimeMode = "live-firestore" | "fallback-mock" | "unknown"

const POLL_INTERVAL_MS = 60_000

const initialAsync = <T,>(): AsyncState<T> => ({
  status: "loading",
  data: null,
  error: null,
})

async function fetchJson<T>(
  url: string,
  signal?: AbortSignal,
): Promise<{ data: T; runtimeMode: RuntimeMode }> {
  const response = await fetch(url, { signal, cache: "no-store" })
  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`)
  }
  const runtimeModeHeader = response.headers.get("x-petrosignal-runtime-mode")
  const runtimeMode: RuntimeMode =
    runtimeModeHeader === "live-firestore" || runtimeModeHeader === "fallback-mock"
      ? runtimeModeHeader
      : "unknown"
  return {
    data: (await response.json()) as T,
    runtimeMode,
  }
}

function nowLabel() {
  return new Date().toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
}

export function DashboardTerminal() {
  const { preferences, loading: preferencesLoading, savePreferences } = useUserPreferences()
  const [role, setRole] = useState<BriefingRole>("investor")
  const [briefingState, setBriefingState] =
    useState<AsyncState<BriefingDocument>>(initialAsync())
  const [agentsState, setAgentsState] =
    useState<AsyncState<AgentStatus[]>>(initialAsync())
  const [newsState, setNewsState] =
    useState<AsyncState<NewsItem[]>>(initialAsync())
  const [alertsState, setAlertsState] =
    useState<AsyncState<AlertItem[]>>(initialAsync())
  const [metricsState, setMetricsState] =
    useState<AsyncState<MetricSnapshot[]>>(initialAsync())
  const [runtimeModes, setRuntimeModes] = useState<{
    briefing: RuntimeMode
    agents: RuntimeMode
    news: RuntimeMode
    alerts: RuntimeMode
    metrics: RuntimeMode
  }>({
    briefing: "unknown",
    agents: "unknown",
    news: "unknown",
    alerts: "unknown",
    metrics: "unknown",
  })
  const [refreshing, setRefreshing] = useState(false)
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string | null>(null)
  const [refreshGeneration, setRefreshGeneration] = useState(0)

  useEffect(() => {
    if (!preferencesLoading) {
      setRole(preferences.dashboard.role)
    }
  }, [preferences.dashboard.role, preferencesLoading])

  const loadBriefing = useCallback(
    async (signal: AbortSignal, activeRole: BriefingRole) => {
      setBriefingState(initialAsync())
      const payload = await fetchJson<BriefingDocument>(`/api/briefing/${activeRole}`, signal)
      setBriefingState({ status: "success", data: payload.data, error: null })
      setRuntimeModes((current) => ({ ...current, briefing: payload.runtimeMode }))
    },
    [],
  )

  const loadFeeds = useCallback(async (signal: AbortSignal) => {
    const [agents, news, alerts, metrics] = await Promise.all([
      fetchJson<AgentStatus[]>("/api/agents/status", signal),
      fetchJson<NewsItem[]>("/api/news", signal),
      fetchJson<AlertItem[]>("/api/alerts", signal),
      fetchJson<MetricSnapshot[]>("/api/metrics", signal),
    ])
    setAgentsState({ status: "success", data: agents.data, error: null })
    setNewsState({ status: "success", data: news.data, error: null })
    setAlertsState({ status: "success", data: alerts.data, error: null })
    setMetricsState({ status: "success", data: metrics.data, error: null })
    setRuntimeModes((current) => ({
      ...current,
      agents: agents.runtimeMode,
      news: news.runtimeMode,
      alerts: alerts.runtimeMode,
      metrics: metrics.runtimeMode,
    }))
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    loadBriefing(controller.signal, role).catch((error: unknown) => {
      if (error instanceof DOMException && error.name === "AbortError") return
      const message =
        error instanceof Error ? error.message : "Unable to load briefing."
      setBriefingState({ status: "error", data: null, error: message })
    })
    return () => controller.abort()
  }, [loadBriefing, role, refreshGeneration])

  useEffect(() => {
    const controller = new AbortController()

    loadFeeds(controller.signal)
      .then(() => setLastRefreshedAt(nowLabel()))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return
        const message =
          error instanceof Error ? error.message : "Unable to load dashboard feeds."
        setAgentsState({ status: "error", data: null, error: message })
        setNewsState({ status: "error", data: null, error: message })
        setAlertsState({ status: "error", data: null, error: message })
        setMetricsState({ status: "error", data: null, error: message })
      })

    return () => controller.abort()
  }, [loadFeeds, refreshGeneration])

  useEffect(() => {
    const interval = window.setInterval(() => {
      setRefreshGeneration((value) => value + 1)
    }, POLL_INTERVAL_MS)
    return () => window.clearInterval(interval)
  }, [])

  async function handleManualRefresh() {
    setRefreshing(true)
    const controller = new AbortController()
    try {
      await Promise.all([loadBriefing(controller.signal, role), loadFeeds(controller.signal)])
      setLastRefreshedAt(nowLabel())
    } catch (error: unknown) {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        console.error("Manual dashboard refresh failed.", error)
      }
    } finally {
      setRefreshing(false)
    }
  }

  function handleRoleChange(nextRole: BriefingRole) {
    setRole(nextRole)
    void savePreferences({
      ...preferences,
      defaultRole: nextRole,
      dashboard: { role: nextRole },
      news: { ...preferences.news, roleFocus: nextRole },
    }).catch((error) => {
      console.error("Failed to persist dashboard role preference.", error)
    })
  }

  return (
    <main className="flex min-h-screen w-full flex-col bg-surface-container-low text-foreground">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-stack border-b border-outline-variant px-container py-compact">
          <div>
            <p className="font-heading text-xs uppercase tracking-[0.04em] text-muted-foreground">
              PetroSignal Intelligence Terminal
            </p>
            <h1 className="font-heading text-lg font-semibold tracking-[-0.02em]">
              Daily Operations Dashboard
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-stack">
            <button
              type="button"
              onClick={() => void handleManualRefresh()}
              disabled={refreshing}
              className="border border-outline-variant bg-surface-container px-2 py-1 font-heading text-[11px] uppercase tracking-[0.04em] transition hover:bg-surface-container-high disabled:opacity-70"
            >
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
            <span className="inline-flex items-center gap-2 border border-outline-variant px-2 py-[2px] font-mono text-[11px] text-muted-foreground">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              {runtimeModes.news === "unknown" ||
              runtimeModes.alerts === "unknown" ||
              runtimeModes.metrics === "unknown"
                ? "Runtime mode · pending"
                : runtimeModes.news === "fallback-mock" ||
                    runtimeModes.alerts === "fallback-mock" ||
                    runtimeModes.metrics === "fallback-mock"
                  ? "Fallback mode · mock-assisted"
                  : "Live mode · Firestore-backed"}
            </span>
            <span className="font-mono text-xs text-muted-foreground">
              {lastRefreshedAt ? `Updated ${lastRefreshedAt}` : nowLabel()}
            </span>
          </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-gutter p-gutter">
        <MetricCards
          metrics={metricsState.data}
          isLoading={metricsState.status === "loading"}
          error={metricsState.error}
        />

        <div className="grid min-h-0 flex-1 gap-gutter lg:grid-cols-[2fr_1fr]">
          <section className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-gutter">
            <BriefingCard
              role={role}
              onRoleChange={handleRoleChange}
              briefing={briefingState.data}
              isLoading={briefingState.status === "loading"}
              error={briefingState.error}
              timezone={preferences.timezone}
            />
            <LiveWire
              news={newsState.data}
              alerts={alertsState.data}
              isLoading={
                newsState.status === "loading" || alertsState.status === "loading"
              }
              error={newsState.error ?? alertsState.error}
            />
          </section>

          <AgentStatusPanel
            agents={agentsState.data}
            isLoading={agentsState.status === "loading"}
            error={agentsState.error}
          />
        </div>
      </div>
    </main>
  )
}
