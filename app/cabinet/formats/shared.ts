import type { FormatType, VideoProvider } from "@/lib/api";

export const FORMAT_COLORS = [
  "#8E86D6",
  "#5B7A9E",
  "#C79A2E",
  "#B5533A",
  "#4E79A7",
  "#5EA9E6",
  "#3FA294",
  "#D9B382",
  "#2F4B7C",
  "#7B5EA7",
];

export const DURATION_PRESETS = [15, 30, 45, 60, 90, 120, 150, 180];

export const PROVIDER_LABELS: Record<VideoProvider, string> = {
  google_meet: "Google Meet",
  zoom: "Zoom",
  yandex_telemost: "Яндекс Телемост",
};

export const PROVIDER_ORDER: VideoProvider[] = ["google_meet", "zoom", "yandex_telemost"];

export const TYPE_LABELS: Record<FormatType, { title: string; subtitle: string }> = {
  one: { title: "Один на один", subtitle: "Консультация 1:1" },
  group: { title: "Групповая", subtitle: "Лимит мест" },
  many: { title: "Без лимита", subtitle: "Сколько угодно" },
};

export function formatDuration(min: number): string {
  if (min % 60 === 0 && min >= 60) return `${min / 60} ч`;
  if (min > 60) return `${Math.floor(min / 60)} ч ${min % 60} мин`;
  return `${min} минут`;
}

export function formatMeta(f: { durationMin: number; seats: number | null }): string {
  const dur = formatDuration(f.durationMin);
  return f.seats ? `${dur} · до ${f.seats} мест` : dur;
}

export function formatPriceLabel(priceKopecks: number): string {
  if (priceKopecks === 0) return "Бесплатно";
  return `${Math.round(priceKopecks / 100).toLocaleString("ru-RU")} ₽`;
}

export function rublesToKopecks(rubles: string): number {
  const normalized = rubles.trim().replace(/\s/g, "").replace(",", ".");
  const n = Number(normalized);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100);
}

export function kopecksToRublesInput(kopecks: number): string {
  if (!kopecks) return "";
  return String(Math.round(kopecks / 100));
}

const WEEKDAY_LABELS = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

export function weekdayLabel(weekday: number): string {
  return WEEKDAY_LABELS[weekday] ?? "?";
}
