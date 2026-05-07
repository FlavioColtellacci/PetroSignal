"use client"

import { motion } from "framer-motion"

import type { MetricSnapshot } from "@/types/domain"

import { CountUp } from "./count-up"

type MetricCardsProps = {
  metrics: MetricSnapshot[] | null
  isLoading: boolean
  error: string | null
}

function trendToneClass(trend: MetricSnapshot["trend"]) {
  if (trend === "up") return "text-emerald-300"
  if (trend === "down") return "text-red-300"
  return "text-muted-foreground"
}

function formatDelta(metric: MetricSnapshot) {
  if (metric.trend === "flat") return "—"
  const sign = metric.delta > 0 ? "+" : ""
  return `${sign}${metric.delta}`
}

export function MetricCards({ metrics, isLoading, error }: MetricCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-gutter lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div
            key={idx}
            className="h-[88px] animate-pulse border border-outline-variant bg-surface-container-low"
          />
        ))}
      </div>
    )
  }

  if (error || !metrics) {
    return (
      <div className="border border-destructive bg-surface-container-low px-container py-compact">
        <p className="text-sm text-destructive">
          Metrics unavailable{error ? `: ${error}` : "."}
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-gutter lg:grid-cols-4">
      {metrics.map((metric, index) => (
        <motion.article
          key={metric.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: index * 0.05, ease: "easeOut" }}
          className="border border-outline-variant bg-surface-container px-container py-compact"
        >
          <p className="font-heading text-[11px] uppercase tracking-[0.04em] text-muted-foreground">
            {metric.label}
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <CountUp
              value={metric.value}
              className="font-mono text-2xl font-medium tracking-[-0.01em]"
              suffix={metric.unit}
            />
            <span
              className={`font-mono text-xs ${trendToneClass(metric.trend)}`}
            >
              {formatDelta(metric)}
            </span>
          </div>
        </motion.article>
      ))}
    </div>
  )
}
