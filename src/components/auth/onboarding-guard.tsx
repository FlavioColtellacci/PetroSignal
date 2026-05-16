"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useUserPreferences } from "@/lib/user-preferences-client";

export function OnboardingGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { preferences, loading } = useUserPreferences();

  useEffect(() => {
    if (loading || preferences.onboardingCompleted) {
      return;
    }
    if (pathname !== "/onboarding") {
      router.replace("/onboarding");
    }
  }, [loading, pathname, preferences.onboardingCompleted, router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-surface-dim px-container py-container text-foreground">
        <section className="mx-auto max-w-2xl border border-outline-variant bg-surface-container-low p-container">
          <p className="font-mono text-xs uppercase tracking-[0.04em] text-muted-foreground">
            Loading workspace profile...
          </p>
        </section>
      </main>
    );
  }

  if (!preferences.onboardingCompleted) {
    return null;
  }

  return <>{children}</>;
}
