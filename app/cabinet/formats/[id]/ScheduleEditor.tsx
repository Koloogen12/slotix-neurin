"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";

interface Interval {
  startTime: string;
  endTime: string;
}

interface Rule extends Interval {
  weekday: number;
  timezone: string;
}

interface ExceptionRow {
  id: string;
  date: string;
  isAvailable: boolean;
  startTime: string | null;
  endTime: string | null;
}

interface FormatAvailability {
  hasOverride: boolean;
  own: { rules: Rule[]; exceptions: ExceptionRow[] };
  account: { rules: Rule[]; exceptions: ExceptionRow[] };
}

const WEEKDAY_LABELS = ["воскресенье", "понедельник", "вторник", "среда", "четверг", "пятница", "суббота"];
const WEEKDAY_SHORT = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
const DEFAULT_INTERVAL: Interval = { startTime: "10:00", endTime: "19:00" };

/** Local calendar date as YYYY-MM-DD — `toISOString` would shift the day for anyone east of UTC. */
function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function addDays(d: Date, days: number): Date {
  const next = new Date(d);
  next.setDate(next.getDate() + days);
  return next;
}

function groupIntervalsByWeekday(rules: Rule[]): Record<number, Interval[]> {
  const byDay: Record<number, Interval[]> = {};
  for (const r of rules) {
    (byDay[r.weekday] ??= []).push({ startTime: r.startTime, endTime: r.endTime });
  }
  for (const day of Object.keys(byDay)) {
    byDay[Number(day)].sort((a, b) => a.startTime.localeCompare(b.startTime));
  }
  return byDay;
}

export function ScheduleEditor({ formatId, timezone }: { formatId: string; timezone: string }) {
  const [data, setData] = useState<FormatAvailability | null>(null);
  const [weekStart, setWeekStart] = useState(() => new Date());
  const [selected, setSelected] = useState<string | null>(null);
  const [draft, setDraft] = useState<Interval[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setData(await api.get<FormatAvailability>(`/api/availability/format/${formatId}`));
    } catch {
      setError("Не удалось загрузить расписание");
    }
  }, [formatId]);

  useEffect(() => {
    void load();
  }, [load]);

  // Which set of rules is actually in force: the format's own week once it has one, the
  // account's default until then. The editor always shows what a client would really see.
  const effectiveRules = data ? (data.hasOverride ? data.own.rules : data.account.rules) : [];
  const byWeekday = useMemo(() => groupIntervalsByWeekday(effectiveRules), [effectiveRules]);

  // Account-level exceptions are shown too: a closed day set for the whole account closes it
  // here as well, and hiding that would make the strip lie about what is bookable.
  const exceptionsByDate = useMemo(() => {
    const map: Record<string, ExceptionRow[]> = {};
    for (const row of [...(data?.account.exceptions ?? []), ...(data?.own.exceptions ?? [])]) {
      const key = row.date.slice(0, 10);
      (map[key] ??= []).push(row);
    }
    return map;
  }, [data]);

  const days = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const date = addDays(weekStart, i);
        const key = isoDate(date);
        const rows = exceptionsByDate[key];
        const closedByException = rows?.some((r) => !r.isAvailable) ?? false;
        const customIntervals = rows?.filter((r) => r.isAvailable && r.startTime && r.endTime) ?? [];
        const intervals: Interval[] = customIntervals.length
          ? customIntervals.map((r) => ({ startTime: r.startTime!, endTime: r.endTime! }))
          : (byWeekday[date.getDay()] ?? []);
        return {
          key,
          date,
          weekday: date.getDay(),
          hasException: (rows?.length ?? 0) > 0,
          intervals: closedByException ? [] : intervals,
          closed: closedByException || intervals.length === 0,
        };
      }),
    [weekStart, byWeekday, exceptionsByDate],
  );

  const selectedDay = days.find((d) => d.key === selected) ?? null;

  function openDay(key: string) {
    const day = days.find((d) => d.key === key);
    setSelected(key);
    setDraft(day && day.intervals.length ? day.intervals.map((i) => ({ ...i })) : [{ ...DEFAULT_INTERVAL }]);
    setError(null);
  }

  function flash(message: string) {
    setToast(message);
    setTimeout(() => setToast(null), 2600);
  }

  /** Rebuilds the whole week and PUTs it: the API replaces the rule set wholesale, so a
   * partial write would silently drop the days we did not send. */
  async function saveWeekly(weekdays: number[]) {
    if (!selectedDay) return;
    const next: Record<number, Interval[]> = { ...byWeekday };
    for (const wd of weekdays) next[wd] = draft.map((i) => ({ ...i }));

    const rules: Rule[] = [];
    for (const [wd, intervals] of Object.entries(next)) {
      for (const i of intervals) rules.push({ weekday: Number(wd), ...i, timezone });
    }

    setSaving(true);
    setError(null);
    try {
      await api.put(`/api/availability/format/${formatId}`, { rules });
      await load();
      flash(weekdays.length > 1 ? "Сохранено для всех дней недели" : `Сохранено для всех ${WEEKDAY_LABELS[weekdays[0]]}ов`);
    } catch {
      setError("Не удалось сохранить расписание");
    } finally {
      setSaving(false);
    }
  }

  async function saveThisDateOnly(isAvailable: boolean) {
    if (!selectedDay) return;
    setSaving(true);
    setError(null);
    try {
      await api.post(`/api/availability/format/${formatId}/day`, {
        date: selectedDay.key,
        isAvailable,
        intervals: isAvailable ? draft : [],
        timezone,
      });
      await load();
      flash(isAvailable ? "Сохранено на эту дату" : "День закрыт для записи");
    } catch {
      setError("Не удалось сохранить день");
    } finally {
      setSaving(false);
    }
  }

  async function resetToAccount() {
    setSaving(true);
    try {
      await api.delete(`/api/availability/format/${formatId}`);
      setSelected(null);
      await load();
      flash("Формат снова использует общее расписание");
    } catch {
      setError("Не удалось сбросить расписание");
    } finally {
      setSaving(false);
    }
  }

  if (!data) {
    return <div className="fe-hint">{error ?? "Загружаем расписание…"}</div>;
  }

  return (
    <div>
      <div className="fe-hint" style={{ marginTop: 0, marginBottom: 12 }}>
        {data.hasOverride
          ? "У формата своё расписание. Общее расписание аккаунта на него не влияет."
          : "Формат использует общее расписание аккаунта. Измените любой день, чтобы задать своё."}
        {data.hasOverride && (
          <>
            {" "}
            <button
              type="button"
              onClick={resetToAccount}
              disabled={saving}
              style={{ color: "var(--color-link)", fontWeight: 600, background: "none", border: 0, padding: 0, cursor: "pointer" }}
            >
              вернуть общее
            </button>
          </>
        )}
      </div>

      <div className="mb-3 flex items-center gap-3">
        <button type="button" className="fe-chip" onClick={() => setWeekStart(addDays(weekStart, -7))} aria-label="Предыдущая неделя">
          ←
        </button>
        <div className="text-[13px] font-semibold" style={{ color: "var(--color-ink)" }}>
          {days[0].date.toLocaleDateString("ru-RU", { day: "numeric", month: "long" })} —{" "}
          {days[6].date.toLocaleDateString("ru-RU", { day: "numeric", month: "long" })}
        </div>
        <button type="button" className="fe-chip" onClick={() => setWeekStart(addDays(weekStart, 7))} aria-label="Следующая неделя">
          →
        </button>
      </div>

      <div style={{ overflowX: "auto" }}>
        <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(7, minmax(84px, 1fr))", minWidth: 560 }}>
          {days.map((d) => (
            <button
              type="button"
              key={d.key}
              onClick={() => openDay(d.key)}
              className="rounded-xl p-2.5 text-center"
              style={{
                border: `1px solid ${d.key === selected ? "var(--color-link)" : d.closed ? "#E3E9EF" : "rgba(80,148,240,.2)"}`,
                background: d.closed ? "rgba(255,255,255,.4)" : "rgba(80,148,240,.05)",
                cursor: "pointer",
              }}
            >
              <div className="text-xs font-semibold" style={{ color: "var(--color-ink)" }}>
                {WEEKDAY_SHORT[d.weekday]}
              </div>
              <div className="mb-2 text-[11px]" style={{ color: "var(--color-muted)" }}>
                {d.date.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" })}
                {d.hasException && " •"}
              </div>
              {d.closed ? (
                <div className="text-[11px]" style={{ color: "var(--color-faint-2)" }}>
                  Недоступно
                </div>
              ) : (
                d.intervals.map((i, idx) => (
                  <div
                    key={idx}
                    className="mb-1 rounded-md px-1 py-1 text-[11px] font-semibold"
                    style={{ color: "var(--color-link)", background: "rgba(80,148,240,.1)" }}
                  >
                    {i.startTime}–{i.endTime}
                  </div>
                ))
              )}
            </button>
          ))}
        </div>
      </div>

      {selectedDay && (
        <div className="mt-4 rounded-2xl p-4" style={{ border: "1px solid rgba(20,30,45,.08)", background: "rgba(255,255,255,.6)" }}>
          <div className="mb-1 text-[15px] font-bold" style={{ color: "var(--color-ink)" }}>
            {WEEKDAY_LABELS[selectedDay.weekday]}
          </div>
          <div className="mb-3 text-[13px]" style={{ color: "var(--color-muted)" }}>
            {selectedDay.date.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" })} · {timezone}
          </div>

          <div className="fe-lbl">Доступное время</div>
          <div className="fe-hint" style={{ marginTop: 0, marginBottom: 10 }}>
            Укажите один или несколько промежутков времени
          </div>

          {draft.map((interval, idx) => (
            <div key={idx} className="mb-2 flex items-center gap-2">
              <input
                type="time"
                className="fe-inp"
                style={{ width: 120, padding: "8px 10px" }}
                value={interval.startTime}
                onChange={(e) => setDraft(draft.map((v, i) => (i === idx ? { ...v, startTime: e.target.value } : v)))}
              />
              <span style={{ color: "var(--color-muted)" }}>—</span>
              <input
                type="time"
                className="fe-inp"
                style={{ width: 120, padding: "8px 10px" }}
                value={interval.endTime}
                onChange={(e) => setDraft(draft.map((v, i) => (i === idx ? { ...v, endTime: e.target.value } : v)))}
              />
              {draft.length > 1 && (
                <button
                  type="button"
                  onClick={() => setDraft(draft.filter((_, i) => i !== idx))}
                  aria-label="Удалить интервал"
                  style={{ color: "var(--color-faint-2)", background: "none", border: 0, cursor: "pointer", fontSize: 18 }}
                >
                  ×
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            className="fe-chip mb-4"
            onClick={() => setDraft([...draft, { ...DEFAULT_INTERVAL }])}
            style={{ cursor: "pointer" }}
          >
            + Добавить интервал
          </button>

          {error && (
            <div className="mb-3 text-[13px]" style={{ color: "#C2413B" }}>
              {error}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <button type="button" className="fe-btn-primary" disabled={saving} onClick={() => saveWeekly([selectedDay.weekday])}>
              Сохранить для всех {WEEKDAY_LABELS[selectedDay.weekday]}ов
            </button>
            <button type="button" className="fe-btn-primary" disabled={saving} onClick={() => saveWeekly([0, 1, 2, 3, 4, 5, 6])}>
              Сохранить для всех дней недели
            </button>
            <button type="button" className="fe-chip" disabled={saving} onClick={() => saveThisDateOnly(true)} style={{ cursor: "pointer" }}>
              Только на эту дату
            </button>
            <button type="button" className="fe-chip" disabled={saving} onClick={() => saveThisDateOnly(false)} style={{ cursor: "pointer" }}>
              Закрыть день
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div className="mt-3 text-[13px] font-semibold" style={{ color: "#2E8A73" }}>
          {toast}
        </div>
      )}

      {/* styled-jsx scopes styles to the component that renders the markup, so the editor's
          fe-* classes do not reach here — they are repeated rather than imported. */}
      <style jsx>{`
        .fe-lbl {
          font: 600 13px "Golos Text", sans-serif;
          color: var(--color-ink);
          margin-bottom: 9px;
        }
        .fe-inp {
          box-sizing: border-box;
          border-radius: 12px;
          border: 1px solid #d1d9e6;
          background: rgba(255, 255, 255, 0.7);
          font: 400 15px "Golos Text", sans-serif;
          color: var(--color-ink);
          outline: none;
        }
        .fe-inp:focus {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px rgba(80, 148, 240, 0.15);
        }
        .fe-hint {
          font: 400 12.5px "Golos Text", sans-serif;
          color: var(--color-muted);
          margin-top: 7px;
        }
        .fe-chip {
          padding: 9px 14px;
          border-radius: 11px;
          border: 1px solid #d1d9e6;
          background: rgba(255, 255, 255, 0.6);
          font: 600 13px "Golos Text", sans-serif;
          color: var(--color-link);
        }
        .fe-chip:disabled,
        .fe-btn-primary:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }
        .fe-btn-primary {
          padding: 11px 18px;
          border-radius: 12px;
          border: 0;
          background: linear-gradient(135deg, #66a6ff, #5094f0);
          font: 600 14px "Golos Text", sans-serif;
          color: #fff;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
