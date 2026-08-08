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

interface TimeRange {
  startTime: string;
  endTime: string;
}

interface DayRow {
  enabled: boolean;
  ranges: TimeRange[];
}

function defaultRow(enabled: boolean): DayRow {
  return { enabled, ranges: [{ startTime: "10:00", endTime: "19:00" }] };
}

/** The account's default week, inherited by every format that has no schedule of its own.
 * Per-format schedules are edited on the format page; this is only the fallback. */
export function AccountScheduleCard() {
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
            for (let i = 0; i < 7; i++) next[i] = { enabled: false, ranges: [] };
            for (const rule of rules) {
              const day = next[rule.weekday];
              day.enabled = true;
              day.ranges.push({ startTime: rule.startTime, endTime: rule.endTime });
            }
            // A day with no saved ranges yet (shouldn't happen for enabled days coming
            // from the API, but keeps the UI from rendering an empty, unaddable row).
            for (let i = 0; i < 7; i++) {
              if (next[i].enabled && next[i].ranges.length === 0) {
                next[i].ranges = [{ startTime: "10:00", endTime: "19:00" }];
              }
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

  const toggleDay = (weekday: number, enabled: boolean) => {
    setDays((prev) => ({
      ...prev,
      [weekday]: {
        enabled,
        ranges: prev[weekday].ranges.length > 0 ? prev[weekday].ranges : [{ startTime: "10:00", endTime: "19:00" }],
      },
    }));
  };

  const updateRange = (weekday: number, index: number, patch: Partial<TimeRange>) => {
    setDays((prev) => {
      const ranges = prev[weekday].ranges.map((r, i) => (i === index ? { ...r, ...patch } : r));
      return { ...prev, [weekday]: { ...prev[weekday], ranges } };
    });
  };

  const addRange = (weekday: number) => {
    setDays((prev) => {
      const last = prev[weekday].ranges[prev[weekday].ranges.length - 1];
      const ranges = [...prev[weekday].ranges, { startTime: last?.endTime ?? "10:00", endTime: "19:00" }];
      return { ...prev, [weekday]: { ...prev[weekday], ranges } };
    });
  };

  const removeRange = (weekday: number, index: number) => {
    setDays((prev) => {
      const ranges = prev[weekday].ranges.filter((_, i) => i !== index);
      return { ...prev, [weekday]: { ...prev[weekday], ranges } };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const rules = Object.entries(days).flatMap(([weekday, day]) =>
        day.enabled
          ? day.ranges.map((r) => ({
              weekday: Number(weekday),
              startTime: r.startTime,
              endTime: r.endTime,
              timezone,
            }))
          : [],
      );
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
      <h2 className="m-0 mb-1 text-[18px] font-bold tracking-tight text-(--color-ink)">Общее расписание</h2>
      <p className="mb-6 text-sm text-(--color-muted)">
        Его наследует каждый формат встреч, у которого нет собственного расписания. Своё расписание задаётся на
        странице формата. Для каждого дня можно указать несколько интервалов, например «9:00–12:00» и «14:00–18:00»
        с перерывом на обед.
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
          const day = days[weekday];
          return (
            <div
              key={weekday}
              className="flex flex-wrap items-start gap-4 py-3.5"
              style={idx > 0 ? { borderTop: "1px solid rgba(20,30,45,.07)" } : undefined}
            >
              <label className="flex w-[150px] flex-none cursor-pointer items-center gap-2.5 pt-2 text-sm font-semibold text-(--color-ink)">
                <input
                  type="checkbox"
                  checked={day.enabled}
                  onChange={(e) => toggleDay(weekday, e.target.checked)}
                  className="h-4.5 w-4.5 cursor-pointer accent-(--color-primary)"
                />
                {WEEKDAY_LABELS[weekday]}
              </label>
              {day.enabled ? (
                <div className="flex flex-1 flex-col gap-2">
                  {day.ranges.map((range, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="time"
                        value={range.startTime}
                        onChange={(e) => updateRange(weekday, index, { startTime: e.target.value })}
                        className="input-field w-[120px]"
                      />
                      <span className="text-(--color-muted)">—</span>
                      <input
                        type="time"
                        value={range.endTime}
                        onChange={(e) => updateRange(weekday, index, { endTime: e.target.value })}
                        className="input-field w-[120px]"
                      />
                      {day.ranges.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeRange(weekday, index)}
                          aria-label="Удалить интервал"
                          className="flex h-8 w-8 flex-none items-center justify-center rounded-lg text-(--color-muted) hover:bg-black/5"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <path d="M18 6L6 18M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addRange(weekday)}
                    className="w-fit cursor-pointer text-left text-[13px] font-semibold text-(--color-link)"
                  >
                    + Добавить интервал
                  </button>
                </div>
              ) : (
                <span className="pt-2 text-sm text-(--color-faint)">Недоступно</span>
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
