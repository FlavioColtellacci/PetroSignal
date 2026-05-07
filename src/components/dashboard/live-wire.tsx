"use client"

import { AnimatePresence, motion } from "framer-motion"

import type { AlertItem, NewsItem } from "@/types/domain"

type LiveWireItem = {
  id: string
  title: string
  summary: string
  timestamp: string
  sourceLabel: string
  url: string
  tag: string
  severity: "high" | "medium" | "low" | "info"
}

function formatTimestamp(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
}

function tagToneClass(severity: LiveWireItem["severity"]) {
  if (severity === "high") return "text-red-300"
  if (severity === "medium") return "text-amber-300"
  if (severity === "low") return "text-emerald-300"
  return "text-primary"
}

function buildItems(news: NewsItem[], alerts: AlertItem[]): LiveWireItem[] {
  const newsItems: LiveWireItem[] = news.map((item) => ({
    id: item.id,
    title: item.headline,
    summary: item.summary,
    timestamp: item.publishedAt,
    sourceLabel: item.outlet,
    url: item.url,
    tag: "News",
    severity: "info",
  }))

  const alertItems: LiveWireItem[] = alerts.map((item) => ({
    id: item.id,
    title: item.title,
    summary: item.summary,
    timestamp: item.timestamp,
    sourceLabel: item.source.title ?? "Alert source",
    url: item.source.url,
    tag: `Alert · ${item.severity}`,
    severity: item.severity,
  }))

  return [...alertItems, ...newsItems]
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    )
    .slice(0, 12)
}

type LiveWireProps = {
  news: NewsItem[] | null
  alerts: AlertItem[] | null
  isLoading: boolean
  error: string | null
}

export function LiveWire({ news, alerts, isLoading, error }: LiveWireProps) {
  const items = news && alerts ? buildItems(news, alerts) : []

  return (
    <article className="flex min-h-[420px] flex-col border border-outline-variant bg-surface-container">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-outline-variant bg-surface-container px-container py-compact">
        <p className="font-heading text-xs uppercase tracking-[0.04em] text-muted-foreground">
          Live Wire
        </p>
        <p className="font-mono text-[11px] text-muted-foreground">
          {items.length} signals
        </p>
      </header>

      <div className="flex-1 space-y-gutter overflow-y-auto p-gutter">
        {isLoading ? (
          <p className="px-container py-compact text-sm text-muted-foreground">
            Loading live articles and alerts...
          </p>
        ) : null}
        {error ? (
          <p className="px-container py-compact text-sm text-destructive">
            Live Wire failed to refresh: {error}
          </p>
        ) : null}
        {!isLoading && !error && items.length === 0 ? (
          <p className="px-container py-compact text-sm text-muted-foreground">
            No live wire items available.
          </p>
        ) : null}
        <AnimatePresence initial={false}>
          {items.map((item) => (
            <motion.article
              key={item.id}
              layout
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="border border-outline-variant bg-surface-container-low px-container py-compact"
            >
              <div className="mb-1 flex items-center justify-between gap-3">
                <span
                  className={`font-heading text-[11px] uppercase tracking-[0.04em] ${tagToneClass(item.severity)}`}
                >
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
            </motion.article>
          ))}
        </AnimatePresence>
      </div>
    </article>
  )
}
