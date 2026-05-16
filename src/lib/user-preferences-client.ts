"use client";

import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import type { UserPreferences } from "@/types/domain";

const DEFAULT_PREFERENCES: UserPreferences = {
  defaultRole: "investor",
  timezone: "UTC",
  onboardingCompleted: false,
  dashboard: {
    role: "investor",
  },
  alerts: {
    severityFilter: "all",
    windowFilter: "7d",
    sortOrder: "newest",
  },
  news: {
    sourceFilter: "all",
    agentFilter: "all",
    roleFocus: "investor",
  },
};

function mergePreferences(input: Partial<UserPreferences> | null | undefined): UserPreferences {
  return {
    defaultRole: input?.defaultRole ?? DEFAULT_PREFERENCES.defaultRole,
    timezone: input?.timezone ?? DEFAULT_PREFERENCES.timezone,
    onboardingCompleted: input?.onboardingCompleted ?? DEFAULT_PREFERENCES.onboardingCompleted,
    dashboard: {
      role: input?.dashboard?.role ?? input?.defaultRole ?? DEFAULT_PREFERENCES.dashboard.role,
    },
    alerts: {
      severityFilter: input?.alerts?.severityFilter ?? DEFAULT_PREFERENCES.alerts.severityFilter,
      windowFilter: input?.alerts?.windowFilter ?? DEFAULT_PREFERENCES.alerts.windowFilter,
      sortOrder: input?.alerts?.sortOrder ?? DEFAULT_PREFERENCES.alerts.sortOrder,
    },
    news: {
      sourceFilter: input?.news?.sourceFilter ?? DEFAULT_PREFERENCES.news.sourceFilter,
      agentFilter: input?.news?.agentFilter ?? DEFAULT_PREFERENCES.news.agentFilter,
      roleFocus: input?.news?.roleFocus ?? DEFAULT_PREFERENCES.news.roleFocus,
    },
  };
}

export function useUserPreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!user) {
      setPreferences(DEFAULT_PREFERENCES);
      setLoading(false);
      return;
    }

    async function loadPreferences() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/preferences", { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`Failed to load preferences (${response.status})`);
        }
        const payload = (await response.json()) as Partial<UserPreferences>;
        if (!cancelled) {
          setPreferences(mergePreferences(payload));
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Unable to load preferences.",
          );
          setPreferences(DEFAULT_PREFERENCES);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadPreferences();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const savePreferences = useCallback(async (next: UserPreferences) => {
    const merged = mergePreferences(next);
    setPreferences(merged);
    setError(null);

    const response = await fetch("/api/preferences", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(merged),
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || `Failed to save preferences (${response.status})`);
    }

    return merged;
  }, []);

  return {
    preferences,
    loading,
    error,
    savePreferences,
    setPreferences,
  };
}
