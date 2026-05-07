"use client"

import { useEffect, useState } from "react"

import type {
  AgentStatus,
  AlertItem,
  BriefingDocument,
  BriefingRole,
  MetricSnapshot,
  NewsItem,
} from "@/types/domain"

import { AgentStatusPanel } from "./agent-status-panel"
import { BriefingCard } from "./briefing-card"
import { LiveWire } from "./live-wire"
import { MetricCards } from "./metric-cards"

type AsyncState<T> =
  | { status: "loading"; data: null; error: null }
  | { status: "success"; data: T; error: null }
  | { status: "error"; data: null; error: string }

const initialAsync = <T,>(): AsyncState<T> => ({
  status: "loading",
  data: null,
  error: null,
})

async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal, cache: "no-store" })
  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`)
  }
  return response.json() as Promise<T>
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

  useEffect(() => {
    const controller = new AbortController()
    setBriefingState(initialAsync())
    fetchJson<BriefingDocument>(`/api/briefing/${role}`, controller.signal)
      .then((payload) =>
        setBriefingState({ status: "success", data: payload, error: null }),
      )
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return
        const message =
          error instanceof Error ? error.message : "Unable to load briefing."
        setBriefingState({ status: "error", data: null, error: message })
      })

    return () => controller.abort()
  }, [role])

  useEffect(() => {
    const controller = new AbortController()

    Promise.all([
      fetchJson<AgentStatus[]>("/api/agents/status", controller.signal),
      fetchJson<NewsItem[]>("/api/news", controller.signal),
      fetchJson<AlertItem[]>("/api/alerts", controller.signal),
      fetchJson<MetricSnapshot[]>("/api/metrics", controller.signal),
    ])
      .then(([agents, news, alerts, metrics]) => {
        setAgentsState({ status: "success", data: agents, error: null })
        setNewsState({ status: "success", data: news, error: null })
        setAlertsState({ status: "success", data: alerts, error: null })
        setMetricsState({ status: "success", data: metrics, error: null })
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return
        const message =
          error instanceof Error
            ? error.message
            : "Unable to load dashboard feeds."
        setAgentsState({ status: "error", data: null, error: message })
        setNewsState({ status: "error", data: null, error: message })
        setAlertsState({ status: "error", data: null, error: message })
        setMetricsState({ status: "error", data: null, error: message })
      })

    return () => controller.abort()
  }, [])

  return (
    <main className="min-h-screen bg-surface-dim px-container py-container text-foreground">
      <section className="mx-auto flex min-h-[calc(100vh-24px)] w-full max-w-7xl flex-col border border-outline-variant bg-surface-container-low">
        <header className="flex flex-wrap items-center justify-between gap-stack border-b border-outline-variant px-container py-compact">
          <div>
            <p className="font-heading text-xs uppercase tracking-[0.04em] text-muted-foreground">
              PetroSignal Intelligence Terminal
            </p>
            <h1 className="font-heading text-lg font-semibold tracking-[-0.02em]">
              Daily Operations Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-stack">
            <span className="inline-flex items-center gap-2 border border-outline-variant px-2 py-[2px] font-mono text-[11px] text-muted-foreground">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              Live · mock feeds
            </span>
            <span className="font-mono text-xs text-muted-foreground">
              {nowLabel()}
            </span>
          </div>
        </header>

        <div className="space-y-gutter p-gutter">
          <MetricCards
            metrics={metricsState.data}
            isLoading={metricsState.status === "loading"}
            error={metricsState.error}
          />

          <div className="grid gap-gutter lg:grid-cols-[2fr_1fr]">
            <section className="grid gap-gutter">
              <BriefingCard
                role={role}
                onRoleChange={setRole}
                briefing={briefingState.data}
                isLoading={briefingState.status === "loading"}
                error={briefingState.error}
              />
              <LiveWire
                news={newsState.data}
                alerts={alertsState.data}
                isLoading={
                  newsState.status === "loading" ||
                  alertsState.status === "loading"
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
      </section>
    </main>
  )
}
