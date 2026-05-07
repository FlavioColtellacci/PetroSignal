"use client"

import { AnimatePresence, motion } from "framer-motion"

import type { BriefingDocument, BriefingRole } from "@/types/domain"

import { ROLE_LABELS, RoleSelector } from "./role-selector"

type BriefingCardProps = {
  role: BriefingRole
  onRoleChange: (role: BriefingRole) => void
  briefing: BriefingDocument | null
  isLoading: boolean
  error: string | null
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
}: BriefingCardProps) {
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
      </div>
    </article>
  )
}
