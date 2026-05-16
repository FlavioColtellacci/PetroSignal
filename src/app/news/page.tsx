"use client"

import { useEffect, useMemo, useState } from "react"

import { OnboardingGuard } from "@/components/auth/onboarding-guard"
import { ProtectedPage } from "@/components/auth/protected-page"
import { TerminalShell } from "@/components/layout/terminal-shell"
import { useUserPreferences } from "@/lib/user-preferences-client"
import { BRIEFING_ROLES, type BriefingRole, type NewsItem } from "@/types/domain"

const ROLE_KEYWORDS: Record<BriefingRole, string[]> = {
  investor: ["investment", "capital", "returns", "asset", "production", "price"],
  consultant: ["advisory", "strategy", "contract", "market", "opportunity", "trend"],
  service_company: ["procurement", "service", "operations", "project", "maintenance"],
  compliance: ["sanctions", "regulatory", "enforcement", "compliance", "legal", "audit"],
  engineer: ["drilling", "pipeline", "field", "engineering", "infrastructure", "wells"],
}

function formatAgent(agent: string | undefined) {
  if (!agent) return "unknown"
  return agent.replaceAll("_", " ")
}

export default function NewsPage() {
  const { preferences, loading: preferencesLoading, savePreferences } = useUserPreferences()
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [runtimeMode, setRuntimeMode] = useState<"live-firestore" | "fallback-mock" | "unknown">("unknown")
  const [sourceFilter, setSourceFilter] = useState("all")
  const [agentFilter, setAgentFilter] = useState("all")
  const [roleFocus, setRoleFocus] = useState<BriefingRole>("investor")
  const [preferencesInitialized, setPreferencesInitialized] = useState(false)

  useEffect(() => {
    if (preferencesLoading || preferencesInitialized) {
      return
    }
    setSourceFilter(preferences.news.sourceFilter)
    setAgentFilter(preferences.news.agentFilter)
    setRoleFocus(preferences.news.roleFocus)
    setPreferencesInitialized(true)
  }, [preferences, preferencesInitialized, preferencesLoading])

  async function persistNewsPreferences(next: {
    sourceFilter: string
    agentFilter: string
    roleFocus: BriefingRole
  }) {
    void savePreferences({
      ...preferences,
      news: {
        sourceFilter: next.sourceFilter,
        agentFilter: next.agentFilter,
        roleFocus: next.roleFocus,
      },
    }).catch((requestError: unknown) => {
      console.error("Failed to persist news preferences.", requestError)
    })
  }

  useEffect(() => {
    const controller = new AbortController()

    async function loadNews() {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch("/api/news", {
          signal: controller.signal,
          cache: "no-store",
        })
        if (!response.ok) {
          throw new Error(`Failed to load news (${response.status})`)
        }
        const mode = response.headers.get("x-petrosignal-runtime-mode")
        if (mode === "live-firestore" || mode === "fallback-mock") {
          setRuntimeMode(mode)
        } else {
          setRuntimeMode("unknown")
        }
        const payload = (await response.json()) as NewsItem[]
        setNews(payload)
      } catch (requestError) {
        if (requestError instanceof DOMException && requestError.name === "AbortError") {
          return
        }
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to retrieve news feed.",
        )
      } finally {
        setLoading(false)
      }
    }

    void loadNews()
    return () => controller.abort()
  }, [])

  const sourceOptions = useMemo(
    () => Array.from(new Set(news.map((item) => item.outlet))).sort(),
    [news],
  )

  const agentOptions = useMemo(
    () => Array.from(new Set(news.map((item) => item.agent).filter(Boolean))).sort(),
    [news],
  )

  const filteredNews = useMemo(
    () =>
      news
        .filter((item) => (sourceFilter === "all" ? true : item.outlet === sourceFilter))
        .filter((item) => (agentFilter === "all" ? true : item.agent === agentFilter))
        .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)),
    [agentFilter, news, sourceFilter],
  )

  const focusedHighlights = useMemo(() => {
    const keywords = ROLE_KEYWORDS[roleFocus]
    return filteredNews
      .filter((item) => {
        const haystack = `${item.headline} ${item.summary} ${(item.tags ?? []).join(" ")}`
          .toLowerCase()
          .trim()
        return keywords.some((keyword) => haystack.includes(keyword))
      })
      .slice(0, 6)
  }, [filteredNews, roleFocus])

  return (
    <ProtectedPage>
      <OnboardingGuard>
      <TerminalShell
        title="News Desk"
        subtitle="Source-filtered, agent-aware stream with role-focused highlights."
      >
        <section className="grid gap-gutter lg:grid-cols-[2fr_1fr]">
          <article className="space-y-3 border border-outline-variant bg-surface-container p-container">
            <div className="grid gap-stack lg:grid-cols-3">
              <label className="space-y-1">
                <span className="font-heading text-[11px] uppercase tracking-[0.04em] text-muted-foreground">
                  Source
                </span>
                <select
                  value={sourceFilter}
                  onChange={(event) => {
                    const value = event.target.value
                    setSourceFilter(value)
                    void persistNewsPreferences({ sourceFilter: value, agentFilter, roleFocus })
                  }}
                  className="w-full border border-outline-variant bg-surface-container-low px-2 py-2 text-sm"
                >
                  <option value="all">All sources</option>
                  {sourceOptions.map((source) => (
                    <option key={source} value={source}>
                      {source}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1">
                <span className="font-heading text-[11px] uppercase tracking-[0.04em] text-muted-foreground">
                  Agent
                </span>
                <select
                  value={agentFilter}
                  onChange={(event) => {
                    const value = event.target.value
                    setAgentFilter(value)
                    void persistNewsPreferences({ sourceFilter, agentFilter: value, roleFocus })
                  }}
                  className="w-full border border-outline-variant bg-surface-container-low px-2 py-2 text-sm"
                >
                  <option value="all">All agents</option>
                  {agentOptions.map((agent) => (
                    <option key={agent} value={agent}>
                      {formatAgent(agent)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1">
                <span className="font-heading text-[11px] uppercase tracking-[0.04em] text-muted-foreground">
                  Role focus
                </span>
                <select
                  value={roleFocus}
                  onChange={(event) => {
                    const value = event.target.value as BriefingRole
                    setRoleFocus(value)
                    void persistNewsPreferences({ sourceFilter, agentFilter, roleFocus: value })
                  }}
                  className="w-full border border-outline-variant bg-surface-container-low px-2 py-2 text-sm"
                >
                  {BRIEFING_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {role.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <p className="font-mono text-[11px] text-muted-foreground">
              {runtimeMode === "fallback-mock"
                ? "Runtime mode: fallback-mock"
                : "Runtime mode: live-firestore"}
            </p>

            {loading && (
              <p className="font-mono text-xs uppercase tracking-[0.04em] text-muted-foreground">
                Loading news feed...
              </p>
            )}
            {error && (
              <p className="border border-outline-variant bg-surface-container-low p-2 text-xs text-rose-400">
                {error}
              </p>
            )}
            {!loading && !error && filteredNews.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No stories matched your selected filters.
              </p>
            )}

            <div className="space-y-2">
              {filteredNews.map((item) => (
                <article
                  key={item.id}
                  className="border border-outline-variant bg-surface-container-low p-3"
                >
                  <h2 className="font-heading text-sm">{item.headline}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">{item.summary}</p>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span>
                      {item.outlet} · {formatAgent(item.agent)}
                    </span>
                    <span>{new Date(item.publishedAt).toLocaleString()}</span>
                  </div>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block text-xs underline underline-offset-4"
                  >
                    Open source article
                  </a>
                </article>
              ))}
            </div>
          </article>

          <article className="border border-outline-variant bg-surface-container p-container">
            <h2 className="font-heading text-xs uppercase tracking-[0.04em] text-primary">
              Role Highlights
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Headlines prioritized for the <strong>{roleFocus.replaceAll("_", " ")}</strong>{" "}
              perspective.
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              {focusedHighlights.length === 0 && (
                <li className="text-muted-foreground">No role-focused highlights in this filter set.</li>
              )}
              {focusedHighlights.map((item) => (
                <li key={`highlight-${item.id}`} className="border border-outline-variant bg-surface-container-low p-2">
                  <a href={item.url} target="_blank" rel="noreferrer" className="underline underline-offset-4">
                    {item.headline}
                  </a>
                </li>
              ))}
            </ul>
          </article>
        </section>
      </TerminalShell>
      </OnboardingGuard>
    </ProtectedPage>
  )
}
