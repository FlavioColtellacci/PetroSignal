import * as Sentry from "@sentry/nextjs";

type MonitoringContext = {
  route?: string;
  component?: string;
  details?: Record<string, string | number | boolean | null | undefined>;
};

function isSentryConfigured() {
  return Boolean(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN);
}

export function captureException(error: unknown, context: MonitoringContext = {}) {
  if (isSentryConfigured()) {
    Sentry.withScope((scope) => {
      if (context.route) {
        scope.setTag("route", context.route);
      }
      if (context.component) {
        scope.setTag("component", context.component);
      }
      if (context.details) {
        for (const [key, value] of Object.entries(context.details)) {
          if (value === undefined) {
            continue;
          }
          scope.setExtra(key, value);
        }
      }
      Sentry.captureException(error);
    });
  }

  console.error("[monitoring] Captured exception", {
    route: context.route,
    component: context.component,
    details: context.details,
    error,
  });
}
