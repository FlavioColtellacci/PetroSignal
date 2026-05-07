import Link from "next/link"
import type { ReactNode } from "react"

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/alerts", label: "Alerts" },
  { href: "/news", label: "News" },
  { href: "/pricing", label: "Pricing" },
  { href: "/settings", label: "Settings" },
] as const

type TerminalShellProps = {
  title: string
  subtitle: string
  children: ReactNode
}

export function TerminalShell({ title, subtitle, children }: TerminalShellProps) {
  return (
    <main className="min-h-screen bg-surface-dim px-container py-container text-foreground">
      <section className="mx-auto flex min-h-[calc(100vh-24px)] w-full max-w-7xl flex-col border border-outline-variant bg-surface-container-low">
        <header className="flex flex-wrap items-center justify-between gap-stack border-b border-outline-variant px-container py-compact">
          <div className="space-y-1">
            <p className="font-heading text-xs uppercase tracking-[0.04em] text-muted-foreground">
              PetroSignal Intelligence Terminal
            </p>
            <h1 className="font-heading text-lg font-semibold tracking-[-0.02em]">{title}</h1>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
          <nav className="flex flex-wrap gap-stack" aria-label="Primary">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="border border-outline-variant bg-surface-container px-2 py-1 font-heading text-xs uppercase tracking-[0.04em] text-foreground transition hover:bg-surface-container-high"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </header>
        <div className="flex-1 p-gutter">{children}</div>
      </section>
    </main>
  )
}
