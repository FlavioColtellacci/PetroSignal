"use client"

import { motion } from "framer-motion"

import { AGENT_NAMES, type AgentStatus } from "@/types/domain"

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

function healthDotClass(health: AgentStatus["health"]) {
  if (health === "online") return "bg-emerald-400"
  if (health === "processing") return "bg-amber-300"
  if (health === "degraded") return "bg-yellow-300"
  return "bg-red-400"
}

function healthBadgeClass(health: AgentStatus["health"]) {
  if (health === "online") return "text-emerald-300 border-emerald-400/30"
  if (health === "processing") return "text-amber-300 border-amber-400/30"
  if (health === "degraded") return "text-yellow-300 border-yellow-400/30"
  return "text-red-300 border-red-400/30"
}

function normalizeAgents(statuses: AgentStatus[]): AgentStatus[] {
  const byName = new Map(statuses.map((entry) => [entry.name, entry]))
  return AGENT_NAMES.map(
    (name) =>
      byName.get(name) ?? {
        name,
        health: "offline" as const,
        lastCheckAt: new Date(0).toISOString(),
        note: "No status available from upstream feed.",
      },
  )
}

type AgentStatusPanelProps = {
  agents: AgentStatus[] | null
  isLoading: boolean
  error: string | null
}

export function AgentStatusPanel({
  agents,
  isLoading,
  error,
}: AgentStatusPanelProps) {
  const list = agents ? normalizeAgents(agents) : []

  return (
    <aside className="flex flex-col border border-outline-variant bg-surface-container">
      <header className="sticky top-0 z-10 border-b border-outline-variant bg-surface-container px-container py-compact">
        <p className="font-heading text-xs uppercase tracking-[0.04em] text-muted-foreground">
          Agent Status
        </p>
      </header>

      <div className="flex-1 space-y-gutter p-gutter">
        {isLoading ? (
          <p className="px-container py-compact text-sm text-muted-foreground">
            Connecting to agent heartbeat feed...
          </p>
        ) : null}
        {error ? (
          <p className="px-container py-compact text-sm text-destructive">
            Agent feed unavailable: {error}
          </p>
        ) : null}
        {!isLoading && !error
          ? list.map((agent, index) => (
              <motion.article
                key={agent.name}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.2,
                  delay: index * 0.04,
                  ease: "easeOut",
                }}
                className="border border-outline-variant bg-surface-container-low px-container py-compact"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <motion.span
                      className={`inline-block h-2 w-2 rounded-full ${healthDotClass(agent.health)}`}
                      animate={
                        agent.health === "processing"
                          ? { scale: [1, 1.6, 1], opacity: [1, 0.6, 1] }
                          : { scale: 1, opacity: 1 }
                      }
                      transition={
                        agent.health === "processing"
                          ? {
                              duration: 1.4,
                              repeat: Infinity,
                              ease: "easeInOut",
                            }
                          : { duration: 0.2 }
                      }
                    />
                    <h2 className="font-heading text-sm">{agent.name}</h2>
                  </div>
                  <span
                    className={`rounded-full border px-2 py-[1px] font-mono text-[10px] uppercase tracking-[0.06em] ${healthBadgeClass(agent.health)}`}
                  >
                    {agent.health}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {agent.note}
                </p>
                <p className="mt-2 font-mono text-xs text-muted-foreground">
                  Last check {formatTimestamp(agent.lastCheckAt)}
                </p>
              </motion.article>
            ))
          : null}
      </div>
    </aside>
  )
}
