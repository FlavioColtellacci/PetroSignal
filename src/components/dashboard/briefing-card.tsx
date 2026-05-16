"use client"

import { useEffect, useMemo, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"

import type { BriefingDocument, BriefingRole } from "@/types/domain"
import { BRIEFING_ROLES } from "@/types/domain"

import { ROLE_LABELS, RoleSelector } from "./role-selector"

type BriefingCardProps = {
  role: BriefingRole
  onRoleChange: (role: BriefingRole) => void
  briefing: BriefingDocument | null
  isLoading: boolean
  error: string | null
  timezone?: string
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

export function BriefingCard({
  role,
  onRoleChange,
  briefing,
  isLoading,
  error,
  timezone = "UTC",
}: BriefingCardProps) {
  const [history, setHistory] = useState<BriefingDocument[]>([])
  const [comparison, setComparison] = useState<BriefingDocument[]>([])
  const [historyWindow, setHistoryWindow] = useState<7 | 30>(7)
  const [compareRole, setCompareRole] = useState<BriefingRole>("consultant")
  const [historyLoading, setHistoryLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [exportingPdf, setExportingPdf] = useState(false)
  const [shareUrl, setShareUrl] = useState<string | null>(null)

  const compareRoleOptions = useMemo(
    () => BRIEFING_ROLES.filter((candidate) => candidate !== role),
    [role],
  )

  useEffect(() => {
    if (!compareRoleOptions.includes(compareRole)) {
      setCompareRole(compareRoleOptions[0] ?? "consultant")
    }
  }, [compareRole, compareRoleOptions])

  useEffect(() => {
    const controller = new AbortController()
    setHistoryLoading(true)

    fetch(
      `/api/briefing/${role}/history?days=${historyWindow}&compareRole=${compareRole}`,
      {
        signal: controller.signal,
        cache: "no-store",
      },
    )
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Failed to load history (${response.status})`)
        }
        const payload = (await response.json()) as {
          history: BriefingDocument[]
          compare: BriefingDocument[]
        }
        setHistory(payload.history ?? [])
        setComparison(payload.compare ?? [])
      })
      .catch((requestError) => {
        if (requestError instanceof DOMException && requestError.name === "AbortError") {
          return
        }
        setHistory([])
        setComparison([])
      })
      .finally(() => setHistoryLoading(false))

    return () => controller.abort()
  }, [compareRole, historyWindow, role])

  async function downloadExport(format: "json" | "pdf") {
    const isPdf = format === "pdf"
    try {
      if (isPdf) {
        setExportingPdf(true)
      } else {
        setExporting(true)
        setShareUrl(null)
      }
      const response = await fetch(
        `/api/briefing/${role}/export?format=${format}&shareHours=24`,
        { cache: "no-store" },
      )
      if (!response.ok) {
        throw new Error(`Export failed (${response.status})`)
      }

      if (isPdf) {
        const blob = await response.blob()
        const blobUrl = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = blobUrl
        link.download = `petrosignal-${role}-briefing-${new Date().toISOString().slice(0, 10)}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(blobUrl)
        return
      }

      const payload = (await response.json()) as {
        data: BriefingDocument
        role: BriefingRole
        exportedAt: string
        shareUrl?: string
      }
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      })
      const blobUrl = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = blobUrl
      link.download = `petrosignal-${payload.role}-briefing-${payload.exportedAt.slice(0, 10)}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(blobUrl)
      if (payload.shareUrl) {
        setShareUrl(payload.shareUrl)
      }
    } finally {
      if (isPdf) {
        setExportingPdf(false)
      } else {
        setExporting(false)
      }
    }
  }

  return (
    <article className="border border-outline-variant bg-surface-container">
      <header className="flex items-center justify-between border-b border-outline-variant px-container py-compact">
        <p className="font-heading text-xs uppercase tracking-[0.04em] text-muted-foreground">
          Role Briefing
        </p>
        <p className="font-mono text-xs text-muted-foreground">
          {briefing
            ? `Generated ${formatTimestamp(briefing.generatedAt)}`
            : isLoading
              ? "Loading..."
              : "—"}
        </p>
      </header>

      <div className="border-b border-outline-variant px-container py-compact">
        <RoleSelector active={role} onChange={onRoleChange} />
      </div>

      <div className="space-y-stack p-container">
        <div className="flex flex-wrap items-center justify-between gap-2 border border-outline-variant bg-surface-container-low px-3 py-2">
          <div className="flex items-center gap-2">
            <label className="font-mono text-[11px] text-muted-foreground">
              History
              <select
                value={historyWindow}
                onChange={(event) => setHistoryWindow(Number(event.target.value) as 7 | 30)}
                className="ml-2 border border-outline-variant bg-surface-container px-1 py-[2px] text-xs"
              >
                <option value={7}>7d</option>
                <option value={30}>30d</option>
              </select>
            </label>
            <label className="font-mono text-[11px] text-muted-foreground">
              Compare
              <select
                value={compareRole}
                onChange={(event) => setCompareRole(event.target.value as BriefingRole)}
                className="ml-2 border border-outline-variant bg-surface-container px-1 py-[2px] text-xs"
              >
                {compareRoleOptions.map((optionRole) => (
                  <option key={optionRole} value={optionRole}>
                    {optionRole.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void downloadExport("json")}
              disabled={exporting || exportingPdf}
              className="border border-outline-variant px-2 py-1 font-heading text-[11px] uppercase tracking-[0.04em] hover:bg-surface-container-high disabled:opacity-70"
            >
              {exporting ? "Exporting..." : "Export JSON"}
            </button>
            <button
              type="button"
              onClick={() => void downloadExport("pdf")}
              disabled={exporting || exportingPdf}
              className="border border-outline-variant px-2 py-1 font-heading text-[11px] uppercase tracking-[0.04em] hover:bg-surface-container-high disabled:opacity-70"
            >
              {exportingPdf ? "Exporting..." : "Export PDF"}
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.p
              key={`loading-${role}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="text-sm text-muted-foreground"
            >
              Refreshing briefing for {ROLE_LABELS[role]}...
            </motion.p>
          ) : error ? (
            <motion.p
              key={`error-${role}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="text-sm text-destructive"
            >
              Unable to load briefing: {error}
            </motion.p>
          ) : briefing && briefing.sections.length === 0 ? (
            <motion.p
              key={`empty-${role}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="text-sm text-muted-foreground"
            >
              No briefing sections available for this role.
            </motion.p>
          ) : briefing ? (
            <motion.div
              key={`content-${briefing.role}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="space-y-stack"
            >
              {briefing.sections.map((section) => (
                <section key={section.label} className="space-y-1">
                  <h2 className="font-heading text-xs uppercase tracking-[0.04em] text-primary">
                    {section.label}
                  </h2>
                  <p className="text-sm text-foreground">{section.content}</p>
                </section>
              ))}
              {briefing.sources.length > 0 ? (
                <footer className="border-t border-outline-variant pt-2">
                  <p className="font-heading text-[11px] uppercase tracking-[0.04em] text-muted-foreground">
                    Sources
                  </p>
                  <ul className="mt-1 space-y-1">
                    {briefing.sources.map((source) => (
                      <li key={source.url}>
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noreferrer"
                          className="font-mono text-xs text-primary hover:underline"
                        >
                          {source.title ?? source.url}
                        </a>
                      </li>
                    ))}
                  </ul>
                </footer>
              ) : null}
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div className="grid gap-2 border-t border-outline-variant pt-3 lg:grid-cols-2">
          <section className="space-y-1">
            <h3 className="font-heading text-[11px] uppercase tracking-[0.04em] text-primary">
              Briefing History
            </h3>
            {historyLoading ? (
              <p className="font-mono text-xs text-muted-foreground">Loading history...</p>
            ) : history.length === 0 ? (
              <p className="text-xs text-muted-foreground">No historical briefings in this window.</p>
            ) : (
              <ul className="space-y-1">
                {history.slice(0, 5).map((item) => (
                  <li key={item.generatedAt} className="text-xs text-muted-foreground">
                    {new Date(item.generatedAt).toLocaleString("en-US", { timeZone: timezone })} · {item.sections.length} sections
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className="space-y-1">
            <h3 className="font-heading text-[11px] uppercase tracking-[0.04em] text-primary">
              Role Comparison
            </h3>
            {comparison.length === 0 ? (
              <p className="text-xs text-muted-foreground">No comparison briefing available.</p>
            ) : (
              <ul className="space-y-1">
                {comparison.slice(0, 3).map((item) => (
                  <li key={`${item.role}-${item.generatedAt}`} className="text-xs text-muted-foreground">
                    {item.role.replaceAll("_", " ")} · {new Date(item.generatedAt).toLocaleDateString("en-US", { timeZone: timezone })} · {item.sources.length} sources
                  </li>
                ))}
              </ul>
            )}
            {shareUrl && (
              <p className="break-all text-xs text-muted-foreground">
                Share URL: <a href={shareUrl} className="underline">{shareUrl}</a>
              </p>
            )}
          </section>
        </div>
      </div>
    </article>
  )
}
