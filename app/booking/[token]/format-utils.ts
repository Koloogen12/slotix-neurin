import type { VideoProvider } from "@/lib/api";

export function formatDateLong(iso: string, timeZone: string): string {
  // ru-RU appends a trailing " г." when weekday+day+month+year are formatted together —
  // drop that literal to match the design's "Пятница, 17 июля 2026" (no "г." suffix).
  const parts = new Intl.DateTimeFormat("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone,
  }).formatToParts(new Date(iso));
  const formatted = parts
    .filter((p) => !(p.type === "literal" && p.value.includes("г")))
    .map((p) => p.value)
    .join("");
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

/** Renders a "YYYY-MM-DD" calendar-date key (already resolved to a specific day, with no
 * instant/timezone ambiguity left) as a Russian weekday + day + month label. */
export function formatDateKeyLabel(dateKey: string): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const formatted = new Intl.DateTimeFormat("ru-RU", { weekday: "long", day: "numeric", month: "long" }).format(date);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function formatTime(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  }).format(new Date(iso));
}

/** Generic GMT offset label for an arbitrary IANA timezone — avoids hard-coding a
 * city-name lookup table for timezones we can't enumerate in advance. */
export function tzOffsetLabel(timeZone: string, at: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "shortOffset",
  }).formatToParts(at);
  return parts.find((p) => p.type === "timeZoneName")?.value ?? timeZone;
}

const PROVIDER_LABELS: Record<VideoProvider, string> = {
  google_meet: "Google Meet",
  zoom: "Zoom",
  yandex_telemost: "Яндекс Телемост",
};

export function providerLabel(provider: VideoProvider): string {
  return PROVIDER_LABELS[provider] ?? provider;
}

export function formatPrice(priceKopecks: number): string {
  if (priceKopecks <= 0) return "Бесплатно";
  return `${new Intl.NumberFormat("ru-RU").format(priceKopecks / 100)} ₽`;
}

/** owner-local calendar date (YYYY-MM-DD) — the granularity the slots endpoint expects. */
export function toOwnerLocalDateKey(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const y = parts.find((p) => p.type === "year")?.value ?? "1970";
  const m = parts.find((p) => p.type === "month")?.value ?? "01";
  const d = parts.find((p) => p.type === "day")?.value ?? "01";
  return `${y}-${m}-${d}`;
}
