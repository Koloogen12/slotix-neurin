"use client";

import { useEffect, useState } from "react";
import { api, ApiError, type AvailabilityRule } from "@/lib/api";

const WEEKDAY_LABELS = ["Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"];
// Displayed Mon->Sun, matching how the rest of the cabinet (and most calendars) reads a week,
// even though the backend's weekday numbering follows JS's Date#getDay (0=Sunday).
const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

const TIMEZONES =
  typeof Intl.supportedValuesOf === "function"
    ? Intl.supportedValuesOf("timeZone")
    : ["Europe/Moscow", "Europe/Kaliningrad", "Asia/Yekaterinburg", "Asia/Novosibirsk", "Asia/Vladivostok"];

interface DayRow {
  enabled: boolean;
  startTime: string;
  endTime: string;
}

function defaultRow(enabled: boolean): DayRow {
  return { enabled, startTime: "10:00", endTime: "19:00" };
}

export default function AvailabilityPage() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [timezone, setTimezone] = useState("Europe/Moscow");
  const [days, setDays] = useState<Record<number, DayRow>>(() => {
    const initial: Record<number, DayRow> = {};
    for (let i = 0; i < 7; i++) initial[i] = defaultRow(i >= 1 && i <= 5);
    return initial;
  });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; kind: "success" | "error" } | null>(null);

  useEffect(() => {
    api
      .get<{ rules: AvailabilityRule[] }>("/api/availability")
      .then(({ rules }) => {
        if (rules.length > 0) {
          setTimezone(rules[0].timezone);
          setDays((prev) => {
            const next = { ...prev };
            for (let i = 0; i < 7; i++) next[i] = defaultRow(false);
            for (const rule of rules) {
              next[rule.weekday] = { enabled: true, startTime: rule.startTime, endTime: rule.endTime };
            }
            return next;
          });
        }
      })
      .catch((e) => setLoadError(e instanceof ApiError ? e.message : "Не удалось загрузить расписание"))
      .finally(() => setLoading(false));
  }, []);

  const showToast = (message: string, kind: "success" | "error" = "success") => {
    setToast({ message, kind });
    setTimeout(() => setToast((t) => (t?.message === message ? null : t)), 2600);
  };

  const updateDay = (weekday: number, patch: Partial<DayRow>) => {
    setDays((prev) => ({ ...prev, [weekday]: { ...prev[weekday], ...patch } }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const rules = Object.entries(days)
        .filter(([, row]) => row.enabled)
        .map(([weekday, row]) => ({
          weekday: Number(weekday),
          startTime: row.startTime,
          endTime: row.endTime,
          timezone,
        }));
      await api.put("/api/availability", { rules });
      showToast("Расписание сохранено");
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : "Не удалось сохранить расписание", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="glass-card rounded-[20px] px-6 py-14 text-center text-sm text-(--color-muted)">Загружаем расписание…</div>;
  }

  return (
    <div>
      <h1 className="m-0 mb-1 text-[28px] font-bold tracking-tight text-(--color-ink)">Расписание</h1>
      <p className="mb-6 text-sm text-(--color-muted)">
        Общее расписание для всех форматов встреч — когда клиенты могут вас забронировать.
      </p>

      {loadError && <div className="glass-card mb-5 p-4 text-sm text-(--color-danger)">{loadError}</div>}

      <div className="glass-card mb-5 rounded-[20px] p-5">
        <label className="mb-2 block text-sm font-semibold text-(--color-ink)">Часовой пояс</label>
        <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className="input-field max-w-md">
          {TIMEZONES.map((tz) => (
            <option key={tz} value={tz}>
              {tz}
            </option>
          ))}
        </select>
      </div>

      <div className="glass-card rounded-[20px] p-5">
        {DISPLAY_ORDER.map((weekday, idx) => {
          const row = days[weekday];
          return (
            <div
              key={weekday}
              className="flex flex-wrap items-center gap-4 py-3.5"
              style={idx > 0 ? { borderTop: "1px solid rgba(20,30,45,.07)" } : undefined}
            >
              <label className="flex w-[150px] flex-none cursor-pointer items-center gap-2.5 text-sm font-semibold text-(--color-ink)">
                <input
                  type="checkbox"
                  checked={row.enabled}
                  onChange={(e) => updateDay(weekday, { enabled: e.target.checked })}
                  className="h-4.5 w-4.5 cursor-pointer accent-(--color-primary)"
                />
                {WEEKDAY_LABELS[weekday]}
              </label>
              {row.enabled ? (
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={row.startTime}
                    onChange={(e) => updateDay(weekday, { startTime: e.target.value })}
                    className="input-field w-[120px]"
                  />
                  <span className="text-(--color-muted)">—</span>
                  <input
                    type="time"
                    value={row.endTime}
                    onChange={(e) => updateDay(weekday, { endTime: e.target.value })}
                    className="input-field w-[120px]"
                  />
                </div>
              ) : (
                <span className="text-sm text-(--color-faint)">Недоступно</span>
              )}
            </div>
          );
        })}
      </div>

      <button type="button" onClick={handleSave} disabled={saving} className="btn-primary mt-5">
        {saving ? "Сохраняем…" : "Сохранить расписание"}
      </button>

      {toast && (
        <div
          className="fixed bottom-6 left-1/2 z-60 flex -translate-x-1/2 items-center gap-2.5 rounded-2xl px-5 py-3.5 text-sm font-semibold text-white"
          style={{ background: toast.kind === "success" ? "#1A2733" : "var(--color-danger)" }}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
