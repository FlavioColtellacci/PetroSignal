"use client"

import { FormEvent, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { useAuth } from "@/components/auth/auth-provider"

type AuthMode = "sign-in" | "sign-up"

export default function LoginPage() {
  const { user, loading, configured, signIn, signUp, error } = useAuth()
  const router = useRouter()
  const [mode, setMode] = useState<AuthMode>("sign-in")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [pending, setPending] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [nextPath, setNextPath] = useState("/onboarding")

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const next = params.get("next")
    if (next && next.startsWith("/")) {
      setNextPath(next)
    }
    const requestedMode = params.get("mode")
    if (requestedMode === "sign-up") {
      setMode("sign-up")
    }
  }, [])

  useEffect(() => {
    if (!loading && user) {
      router.replace(nextPath)
    }
  }, [loading, nextPath, router, user])

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    setPending(true)

    try {
      if (mode === "sign-in") {
        await signIn(email.trim(), password)
      } else {
        await signUp(email.trim(), password)
      }
      router.replace(nextPath)
    } catch (authError) {
      const message =
        authError instanceof Error
          ? authError.message
          : "Unable to authenticate with Firebase."
      setFormError(message)
    } finally {
      setPending(false)
    }
  }

  return (
    <main className="min-h-screen bg-surface-dim px-container py-container text-foreground">
      <section className="mx-auto w-full max-w-md border border-outline-variant bg-surface-container-low p-container">
        <p className="font-heading text-xs uppercase tracking-[0.04em] text-muted-foreground">
          PetroSignal Secure Access
        </p>
        <h1 className="mt-1 font-heading text-lg font-semibold">
          {mode === "sign-in" ? "Sign in to continue" : "Create your account"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Authentication uses Firebase email/password sessions and protects internal API routes.
        </p>

        {!configured ? (
          <p className="mt-4 border border-outline-variant bg-surface-container p-3 text-sm text-muted-foreground">
            Firebase client variables are missing. Add `NEXT_PUBLIC_FIREBASE_*` values to sign in.
          </p>
        ) : (
          <form className="mt-4 space-y-3" onSubmit={onSubmit}>
            <label className="block">
              <span className="text-xs uppercase tracking-[0.04em] text-muted-foreground">Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1 w-full border border-outline-variant bg-surface-container px-3 py-2 text-sm outline-none focus:border-primary"
                autoComplete="email"
              />
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-[0.04em] text-muted-foreground">Password</span>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-1 w-full border border-outline-variant bg-surface-container px-3 py-2 text-sm outline-none focus:border-primary"
                autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
              />
            </label>

            {(formError || error) && (
              <p className="border border-outline-variant bg-surface-container p-2 text-xs text-rose-400">
                {formError ?? error}
              </p>
            )}

            <button
              type="submit"
              disabled={pending || loading}
              className="w-full border border-primary bg-primary px-3 py-2 font-heading text-xs uppercase tracking-[0.04em] text-primary-foreground transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {pending
                ? "Submitting..."
                : mode === "sign-in"
                  ? "Sign In"
                  : "Create Account"}
            </button>
          </form>
        )}

        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
          <button
            type="button"
            onClick={() => setMode(mode === "sign-in" ? "sign-up" : "sign-in")}
            className="underline underline-offset-4 hover:text-foreground"
          >
            {mode === "sign-in" ? "Need an account? Register" : "Already registered? Sign in"}
          </button>
          <Link href="/" className="underline underline-offset-4 hover:text-foreground">
            Back to home
          </Link>
        </div>
      </section>
    </main>
  )
}
