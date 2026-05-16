import { getFirestoreDb } from "@/lib/firebase-admin";
import type { UserPreferencesRecord } from "@/lib/firestore-types";
import type { UserPreferences } from "@/types/domain";

const USER_PREFERENCES_COLLECTION = "user_preferences";

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
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

function mergePreferences(
  input: Partial<UserPreferences> | null | undefined,
  options?: { legacyUser?: boolean },
): UserPreferences {
  const onboardingCompleted =
    input?.onboardingCompleted ??
    (options?.legacyUser ? true : DEFAULT_USER_PREFERENCES.onboardingCompleted);

  return {
    defaultRole: input?.defaultRole ?? DEFAULT_USER_PREFERENCES.defaultRole,
    timezone: input?.timezone ?? DEFAULT_USER_PREFERENCES.timezone,
    onboardingCompleted,
    dashboard: {
      role: input?.dashboard?.role ?? input?.defaultRole ?? DEFAULT_USER_PREFERENCES.dashboard.role,
    },
    alerts: {
      severityFilter:
        input?.alerts?.severityFilter ?? DEFAULT_USER_PREFERENCES.alerts.severityFilter,
      windowFilter: input?.alerts?.windowFilter ?? DEFAULT_USER_PREFERENCES.alerts.windowFilter,
      sortOrder: input?.alerts?.sortOrder ?? DEFAULT_USER_PREFERENCES.alerts.sortOrder,
    },
    news: {
      sourceFilter: input?.news?.sourceFilter ?? DEFAULT_USER_PREFERENCES.news.sourceFilter,
      agentFilter: input?.news?.agentFilter ?? DEFAULT_USER_PREFERENCES.news.agentFilter,
      roleFocus: input?.news?.roleFocus ?? DEFAULT_USER_PREFERENCES.news.roleFocus,
    },
  };
}

export async function getUserPreferences(userId: string): Promise<UserPreferences | null> {
  const db = getFirestoreDb();
  if (!db) {
    return null;
  }

  const snapshot = await db.collection(USER_PREFERENCES_COLLECTION).doc(userId).get();
  if (!snapshot.exists) {
    return null;
  }

  const data = snapshot.data() as UserPreferencesRecord | undefined;
  return mergePreferences(data?.preferences, { legacyUser: true });
}

export async function saveUserPreferences(
  userId: string,
  preferences: UserPreferences,
): Promise<boolean> {
  const db = getFirestoreDb();
  if (!db) {
    return false;
  }

  const nowIso = new Date().toISOString();
  const existing = await db.collection(USER_PREFERENCES_COLLECTION).doc(userId).get();
  const payload: UserPreferencesRecord = {
    id: userId,
    userId,
    preferences: mergePreferences(preferences),
    createdAt: existing.exists
      ? ((existing.data() as UserPreferencesRecord | undefined)?.createdAt ?? nowIso)
      : nowIso,
    updatedAt: nowIso,
  };

  await db.collection(USER_PREFERENCES_COLLECTION).doc(userId).set(payload);
  return true;
}

export function withDefaultUserPreferences(
  preferences: Partial<UserPreferences> | null | undefined,
): UserPreferences {
  return mergePreferences(preferences);
}
