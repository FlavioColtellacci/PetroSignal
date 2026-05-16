export const TIMEZONE_OPTIONS = [
  "UTC",
  "America/Caracas",
  "America/New_York",
  "America/Chicago",
  "Europe/London",
  "Europe/Madrid",
] as const;

export type TimezoneOption = (typeof TIMEZONE_OPTIONS)[number];
