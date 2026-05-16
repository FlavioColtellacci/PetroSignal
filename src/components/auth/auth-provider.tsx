"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import {
  createUserWithEmailAndPassword,
  onIdTokenChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth"

import { firebaseAuth, isFirebaseClientConfigured } from "@/lib/firebase-client"

const AUTH_COOKIE_NAME = "ps_auth_token"
const AUTH_COOKIE_MAX_AGE_SECONDS = 60 * 60

interface AuthContextValue {
  user: User | null
  loading: boolean
  configured: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  getAccessToken: () => Promise<string | null>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function writeTokenCookie(token: string | null) {
  if (typeof document === "undefined") {
    return
  }

  if (!token) {
    document.cookie = `${AUTH_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`
    return
  }

  document.cookie = `${AUTH_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; Max-Age=${AUTH_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message
  }
  return "Authentication request failed."
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isFirebaseClientConfigured()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!configured || !firebaseAuth) {
      setLoading(false)
      setError("Firebase Auth is not configured in this environment.")
      writeTokenCookie(null)
      return
    }

    const unsubscribe = onIdTokenChanged(firebaseAuth, async (nextUser) => {
      setUser(nextUser)

      if (!nextUser) {
        writeTokenCookie(null)
        setLoading(false)
        return
      }

      try {
        const token = await nextUser.getIdToken()
        writeTokenCookie(token)
        setError(null)
      } catch (tokenError) {
        writeTokenCookie(null)
        setError(getErrorMessage(tokenError))
      } finally {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [configured])

  const signIn = useCallback(async (email: string, password: string) => {
    if (!firebaseAuth) {
      throw new Error("Firebase Auth is not configured.")
    }
    setError(null)
    await signInWithEmailAndPassword(firebaseAuth, email, password)
  }, [])

  const signUp = useCallback(async (email: string, password: string) => {
    if (!firebaseAuth) {
      throw new Error("Firebase Auth is not configured.")
    }
    setError(null)
    await createUserWithEmailAndPassword(firebaseAuth, email, password)
  }, [])

  const signOut = useCallback(async () => {
    if (!firebaseAuth) {
      writeTokenCookie(null)
      setUser(null)
      return
    }

    await firebaseSignOut(firebaseAuth)
    writeTokenCookie(null)
    setUser(null)
  }, [])

  const getAccessToken = useCallback(async () => {
    if (!user) {
      return null
    }

    try {
      const token = await user.getIdToken()
      writeTokenCookie(token)
      return token
    } catch (tokenError) {
      setError(getErrorMessage(tokenError))
      return null
    }
  }, [user])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      configured,
      error,
      signIn,
      signUp,
      signOut,
      getAccessToken,
    }),
    [configured, error, getAccessToken, loading, signIn, signOut, signUp, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.")
  }
  return context
}
