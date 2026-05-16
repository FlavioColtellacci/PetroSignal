"use client"

import { useEffect, type ReactNode } from "react"
import { usePathname, useRouter } from "next/navigation"

import { useAuth } from "@/components/auth/auth-provider"

export function ProtectedPage({ children }: { children: ReactNode }) {
  const { user, loading, configured } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (loading || user) {
      return
    }
    const nextParam = encodeURIComponent(pathname || "/dashboard")
    router.replace(`/login?next=${nextParam}`)
  }, [loading, pathname, router, user])

  if (!configured) {
    return (
      <main className="min-h-screen bg-surface-dim px-container py-container text-foreground">
        <section className="mx-auto max-w-2xl border border-outline-variant bg-surface-container-low p-container">
          <h1 className="font-heading text-base font-semibold">
            Firebase authentication is not configured.
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Add the `NEXT_PUBLIC_FIREBASE_*` environment variables to enable protected pages.
          </p>
        </section>
      </main>
    )
  }

  if (loading || !user) {
    return (
      <main className="min-h-screen bg-surface-dim px-container py-container text-foreground">
        <section className="mx-auto max-w-2xl border border-outline-variant bg-surface-container-low p-container">
          <p className="font-mono text-xs uppercase tracking-[0.04em] text-muted-foreground">
            Verifying authenticated session...
          </p>
        </section>
      </main>
    )
  }

  return <>{children}</>
}
