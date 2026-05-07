"use client"

import { useEffect, useMemo, useState } from "react"

import { AGENT_NAMES, BRIEFING_ROLES, type AgentStatus, type AlertItem, type BriefingDocument, type BriefingRole, type NewsItem } from "@/types/domain"

type AsyncState<T> =
  | { status: "loading"; data: null; error: null }
  | { status: "success"; data: T; error: null }
  | { status: "error"; data: null; error: string }

type RoleLabelMap = Record<BriefingRole, string>

const ROLE_LABELS: RoleLabelMap = {
  investor: "Investor",
  consultant: "Consultant",
  service_company: "Service Company",
  compliance: "Compliance",
  engineer: "Engineer",
}

function formatTimestamp(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return date.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
}

function healthToneClass(health: AgentStatus["health"]) {
  if (health === "online") return "text-emerald-300"
  if (health === "processing") return "text-amber-300"
  if (health === "degraded") return "text-yellow-300"
  return "text-red-300"
}

async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal, cache: "no-store" })
  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`)
  }
  return response.json() as Promise<T>
}

function normalizeAgents(statuses: AgentStatus[]): AgentStatus[] {
  const statusByName = new Map(statuses.map((entry) => [entry.name, entry]))
  return AGENT_NAMES.map((name) => {
    const status = statusByName.get(name)
    return (
      status ?? {
        name,
        health: "offline",
        lastCheckAt: new Date(0).toISOString(),
        note: "No status available from upstream feed.",
      }
    )
  })
}

export function DashboardTerminal() {
  const [role, setRole] = useState<BriefingRole>("investor")
  const [briefingState, setBriefingState] = useState<AsyncState<BriefingDocument>>({
    status: "loading",
    data: null,
    error: null,
  })
  const [agentsState, setAgentsState] = useState<AsyncState<AgentStatus[]>>({
    status: "loading",
    data: null,
    error: null,
  })
  const [newsState, setNewsState] = useState<AsyncState<NewsItem[]>>({
    status: "loading",
    data: null,
    error: null,
  })
  const [alertsState, setAlertsState] = useState<AsyncState<AlertItem[]>>({
    status: "loading",
    data: null,
    error: null,
  })

  useEffect(() => {
    const controller = new AbortController()
    setBriefingState({ status: "loading", data: null, error: null })
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

    return () => {
      controller.abort()
    }
  }, [role])

  useEffect(() => {
    const controller = new AbortController()

    Promise.all([
      fetchJson<AgentStatus[]>("/api/agents/status", controller.signal),
      fetchJson<NewsItem[]>("/api/news", controller.signal),
      fetchJson<AlertItem[]>("/api/alerts", controller.signal),
    ])
      .then(([agents, news, alerts]) => {
        setAgentsState({
          status: "success",
          data: normalizeAgents(agents),
          error: null,
        })
        setNewsState({ status: "success", data: news, error: null })
        setAlertsState({ status: "success", data: alerts, error: null })
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return
        const message =
          error instanceof Error ? error.message : "Unable to load dashboard feeds."
        setAgentsState({ status: "error", data: null, error: message })
        setNewsState({ status: "error", data: null, error: message })
        setAlertsState({ status: "error", data: null, error: message })
      })

    return () => {
      controller.abort()
    }
  }, [])

  const liveWireItems = useMemo(() => {
    const news = newsState.status === "success" ? newsState.data : []
    const alerts = alertsState.status === "success" ? alertsState.data : []

    const mappedNews = news.map((item) => ({
      id: item.id,
      title: item.headline,
      summary: item.summary,
      timestamp: item.publishedAt,
      sourceLabel: item.outlet,
      url: item.url,
      tag: "News",
    }))

    const mappedAlerts = alerts.map((item) => ({
      id: item.id,
      title: item.title,
      summary: item.summary,
      timestamp: item.timestamp,
      sourceLabel: item.source.title ?? "Alert source",
      url: item.source.url,
      tag: item.severity === "high" ? "Alert - High" : `Alert - ${item.severity}`,
    }))

    return [...mappedAlerts, ...mappedNews]
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      )
      .slice(0, 12)
  }, [alertsState, newsState])

  return (
    <main className="min-h-screen bg-surface-dim px-container py-container text-foreground">
      <section className="mx-auto flex min-h-[calc(100vh-24px)] w-full max-w-7xl flex-col border border-outline-variant bg-surface-container-low">
        <header className="flex items-center justify-between border-b border-outline-variant px-container py-compact">
          <div>
            <p className="font-heading text-xs uppercase tracking-[0.04em] text-muted-foreground">
              PetroSignal Intelligence Terminal
            </p>
            <h1 className="font-heading text-lg font-semibold tracking-[-0.02em]">
              Daily Operations Dashboard
            </h1>
          </div>
          <p className="font-mono text-xs text-muted-foreground">
            Mock intelligence feeds
          </p>
        </header>

        <div className="grid flex-1 gap-gutter p-gutter lg:grid-cols-[2fr_1fr]">
          <section className="grid gap-gutter">
            <article className="border border-outline-variant bg-surface-container">
              <header className="flex items-center justify-between border-b border-outline-variant px-container py-compact">
                <p className="font-heading text-xs uppercase tracking-[0.04em] text-muted-foreground">
                  Role Briefing
                </p>
                <p className="font-mono text-xs text-muted-foreground">
                  {briefingState.status === "success"
                    ? `Generated ${formatTimestamp(briefingState.data.generatedAt)}`
                    : "Loading..."}
                </p>
              </header>

              <div className="border-b border-outline-variant px-container py-compact">
                <div className="flex flex-wrap gap-stack">
                  {BRIEFING_ROLES.map((briefingRole) => (
                    <button
                      key={briefingRole}
                      type="button"
                      onClick={() => setRole(briefingRole)}
                      className={`border px-2 py-1 font-heading text-xs uppercase tracking-[0.04em] transition ${
                        role === briefingRole
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-outline-variant bg-surface-container-high text-foreground hover:bg-surface-container-highest"
                      }`}
                    >
                      {ROLE_LABELS[briefingRole]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-stack p-container">
                {briefingState.status === "loading" ? (
                  <p className="text-sm text-muted-foreground">
                    Refreshing briefing for {ROLE_LABELS[role]}...
                  </p>
                ) : null}
                {briefingState.status === "error" ? (
                  <p className="text-sm text-destructive">
                    Unable to load briefing: {briefingState.error}
                  </p>
                ) : null}
                {briefingState.status === "success" &&
                briefingState.data.sections.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No briefing sections available for this role.
                  </p>
                ) : null}
                {briefingState.status === "success"
                  ? briefingState.data.sections.map((section) => (
                      <section key={section.label} className="space-y-1">
                        <h2 className="font-heading text-xs uppercase tracking-[0.04em] text-primary">
                          {section.label}
                        </h2>
                        <p className="text-sm text-foreground">{section.content}</p>
                      </section>
                    ))
                  : null}
              </div>
            </article>

            <article className="border border-outline-variant bg-surface-container">
              <header className="border-b border-outline-variant px-container py-compact">
                <p className="font-heading text-xs uppercase tracking-[0.04em] text-muted-foreground">
                  Live Wire
                </p>
              </header>
              <div className="max-h-[50vh] space-y-gutter overflow-y-auto p-gutter">
                {newsState.status === "loading" || alertsState.status === "loading" ? (
                  <p className="px-container py-compact text-sm text-muted-foreground">
                    Loading live articles and alerts...
                  </p>
                ) : null}
                {newsState.status === "error" || alertsState.status === "error" ? (
                  <p className="px-container py-compact text-sm text-destructive">
                    Live Wire failed to refresh.
                  </p>
                ) : null}
                {newsState.status === "success" &&
                alertsState.status === "success" &&
                liveWireItems.length === 0 ? (
                  <p className="px-container py-compact text-sm text-muted-foreground">
                    No live wire items available.
                  </p>
                ) : null}
                {newsState.status === "success" && alertsState.status === "success"
                  ? liveWireItems.map((item) => (
                      <article
                        key={item.id}
                        className="border border-outline-variant bg-surface-container-low px-container py-compact"
                      >
                        <div className="mb-1 flex items-center justify-between gap-3">
                          <span className="font-heading text-[11px] uppercase tracking-[0.04em] text-primary">
                            {item.tag}
                          </span>
                          <time className="font-mono text-[11px] text-muted-foreground">
                            {formatTimestamp(item.timestamp)}
                          </time>
                        </div>
                        <h3 className="font-heading text-sm font-medium">{item.title}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {item.summary}
                        </p>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-block font-mono text-xs text-primary hover:underline"
                        >
                          {item.sourceLabel}
                        </a>
                      </article>
                    ))
                  : null}
              </div>
            </article>
          </section>

          <aside className="border border-outline-variant bg-surface-container">
            <header className="border-b border-outline-variant px-container py-compact">
              <p className="font-heading text-xs uppercase tracking-[0.04em] text-muted-foreground">
                Agent Status
              </p>
            </header>

            <div className="space-y-gutter p-gutter">
              {agentsState.status === "loading" ? (
                <p className="px-container py-compact text-sm text-muted-foreground">
                  Connecting to agent heartbeat feed...
                </p>
              ) : null}
              {agentsState.status === "error" ? (
                <p className="px-container py-compact text-sm text-destructive">
                  Agent feed unavailable: {agentsState.error}
                </p>
              ) : null}
              {agentsState.status === "success"
                ? agentsState.data.map((agent) => (
                    <article
                      key={agent.name}
                      className="border border-outline-variant bg-surface-container-low px-container py-compact"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <h2 className="font-heading text-sm">{agent.name}</h2>
                        <span
                          className={`font-mono text-xs uppercase ${healthToneClass(agent.health)}`}
                        >
                          {agent.health}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{agent.note}</p>
                      <p className="mt-2 font-mono text-xs text-muted-foreground">
                        Last check {formatTimestamp(agent.lastCheckAt)}
                      </p>
                    </article>
                  ))
                : null}
            </div>
          </aside>
        </div>
      </section>
    </main>
  )
}
