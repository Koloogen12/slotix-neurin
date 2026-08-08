import type { PublicProfile, VideoProvider } from "@/lib/api";

export type PublicFormat = PublicProfile["formats"][number];

export const PROVIDER_LABELS: Record<VideoProvider, string> = {
  google_meet: "Google Meet",
  zoom: "Zoom",
  yandex_telemost: "Яндекс Телемост",
  phone: "Телефонный звонок",
};

const WEEKDAY_FULL = ["воскресенье", "понедельник", "вторник", "среда", "четверг", "пятница", "суббота"];

const MONTH_GENITIVE = [
  "января",
  "февраля",
  "марта",
  "апреля",
  "мая",
  "июня",
  "июля",
  "августа",
  "сентября",
  "октября",
  "ноября",
  "декабря",
];

export const MONTH_NOMINATIVE = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
];

export const WEEKDAY_SHORT = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

export function formatPrice(priceKopecks: number): string {
  if (priceKopecks <= 0) return "Бесплатно";
  return `${(priceKopecks / 100).toLocaleString("ru-RU")} ₽`;
}

export function formatDuration(durationMin: number): string {
  return `${durationMin} минут`;
}

export function formatMeta(format: Pick<PublicFormat, "durationMin" | "priceKopecks">): string {
  const priceLabel = format.priceKopecks > 0 ? formatPrice(format.priceKopecks) : "бесплатно";
  return `${formatDuration(format.durationMin)} · ${priceLabel}`;
}

/** `dateStr` is a plain YYYY-MM-DD calendar date (no instant/timezone attached) — parsed via
 * Date.UTC and read back with getUTC* so weekday/month extraction can't be skewed by the
 * host machine's own timezone. */
export function formatOwnerDateLabel(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const utcDate = new Date(Date.UTC(year, month - 1, day));
  const weekday = WEEKDAY_FULL[utcDate.getUTCDay()];
  const capitalizedWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
  return `${capitalizedWeekday}, ${day} ${MONTH_GENITIVE[month - 1]}`;
}

export function formatOwnerDateShort(dateStr: string): string {
  const [, month, day] = dateStr.split("-").map(Number);
  return `${day} ${MONTH_GENITIVE[month - 1]}`;
}

/** "today" expressed as owner-timezone calendar-date parts, so the calendar widget disables
 * past days and highlights "today" against the owner's clock, not the visitor's. */
export function ownerTodayParts(timezone: string): { year: number; month: number; day: number; dateStr: string } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value])) as Record<string, string>;
  return {
    year: Number(map.year),
    month: Number(map.month) - 1,
    day: Number(map.day),
    dateStr: `${map.year}-${map.month}-${map.day}`,
  };
}

/** Formats a slot's absolute UTC instant as HH:mm in the given (client) IANA timezone. */
export function formatTimeInTimezone(iso: string, timezone: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone,
  }).format(new Date(iso));
}

/** Full "weekday, day month" label for an absolute instant, read in the given timezone —
 * used post-booking where we display the confirmed time back in the client's own zone. */
export function formatFullDateInTimezone(iso: string, timezone: string): string {
  const label = new Intl.DateTimeFormat("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: timezone,
  }).format(new Date(iso));
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function formatTimezoneLabel(timezone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: timezone, timeZoneName: "shortOffset" }).formatToParts(
    new Date(),
  );
  const offset = parts.find((p) => p.type === "timeZoneName")?.value ?? "";
  const city = timezone.split("/").pop()?.replace(/_/g, " ") ?? timezone;
  return `${city} (${offset})`;
}

export function getInitials(name: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  const initials = parts.map((p) => p[0]?.toUpperCase() ?? "").join("");
  return initials || "?";
}
