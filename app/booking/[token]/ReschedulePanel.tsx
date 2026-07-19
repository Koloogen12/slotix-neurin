"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError, type Booking, type TimeSlot } from "@/lib/api";
import { ArrowLeftIcon, ChevronLeftIcon, ChevronRightIcon } from "./icons";
import { formatDateKeyLabel, formatDateLong, formatTime, toOwnerLocalDateKey } from "./format-utils";
import type { BookingWithOwner } from "./types";

const WEEKDAY_LABELS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const MONTH_LABELS = [
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

interface DateKey {
  year: number;
  month: number; // 0-indexed
  day: number;
}

function parseDateKey(key: string): DateKey {
  const [year, month, day] = key.split("-").map(Number);
  return { year, month: month - 1, day };
}

function toDateKey({ year, month, day }: DateKey): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function buildMonthCells(year: number, month: number): Array<{ dateKey: string; day: number } | null> {
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7; // Monday = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Array<{ dateKey: string; day: number } | null> = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ dateKey: toDateKey({ year, month, day }), day });
  }
  return cells;
}

export function ReschedulePanel({
  booking,
  token,
  onBack,
}: {
  booking: BookingWithOwner;
  token: string;
  onBack: () => void;
}) {
  const router = useRouter();
  const ownerTimezone = booking.user.timezone;
  const todayKey = useMemo(() => toOwnerLocalDateKey(new Date(), ownerTimezone), [ownerTimezone]);
  const today = useMemo(() => parseDateKey(todayKey), [todayKey]);

  const [viewYear, setViewYear] = useState(today.year);
  const [viewMonth, setViewMonth] = useState(today.month);
  const [selectedDateKey, setSelectedDateKey] = useState(todayKey);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Keyed by dateKey (rather than reset via separate setState calls at the top of the
  // effect) so "is this the result for the currently selected day" is derived, not
  // imperatively tracked — avoids synchronous setState-in-effect renders.
  const [slotsResult, setSlotsResult] = useState<{
    dateKey: string;
    slots: TimeSlot[] | null;
    error: string | null;
  }>({ dateKey: selectedDateKey, slots: null, error: null });

  useEffect(() => {
    let cancelled = false;

    api
      .get<TimeSlot[]>(`/api/public/${booking.user.slug}/${booking.formatId}/slots?date=${selectedDateKey}`)
      .then((result) => {
        if (!cancelled) setSlotsResult({ dateKey: selectedDateKey, slots: result, error: null });
      })
      .catch((err) => {
        if (!cancelled) {
          setSlotsResult({
            dateKey: selectedDateKey,
            slots: null,
            error: err instanceof ApiError ? err.message : "Не удалось загрузить свободное время.",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [booking.user.slug, booking.formatId, selectedDateKey]);

  const isLoadingSlots = slotsResult.dateKey !== selectedDateKey;
  const slots = isLoadingSlots ? null : slotsResult.slots;
  const slotsError = isLoadingSlots ? null : slotsResult.error;

  function selectDate(dateKey: string) {
    setSelectedDateKey(dateKey);
    setSelectedSlot(null);
  }

  async function handleConfirm() {
    if (!selectedSlot) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const newBooking = await api.post<Booking>(`/api/public/booking/${token}/reschedule`, {
        startAt: selectedSlot.start,
      });
      router.push(`/booking/${newBooking.publicToken}`);
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : "Не удалось перенести встречу. Попробуйте ещё раз.");
      setIsSubmitting(false);
    }
  }

  const cells = buildMonthCells(viewYear, viewMonth);
  const isCurrentMonthOrEarlier = viewYear < today.year || (viewYear === today.year && viewMonth <= today.month);

  function goToMonth(delta: number) {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  }

  const selectedDateLabel = formatDateKeyLabel(selectedDateKey);

  return (
    <div className="mx-auto w-full max-w-[720px]">
      <button
        type="button"
        className="mb-4 inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-[var(--color-link)]"
        onClick={onBack}
      >
        <ArrowLeftIcon />
        Назад
      </button>

      <div
        className="mb-5 inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold"
        style={{ background: "var(--color-warning-bg)", borderColor: "rgba(245,185,61,.3)", color: "var(--color-warning)" }}
      >
        Перенос встречи с {formatDateLong(booking.startAt, booking.clientTimezone)}, {formatTime(booking.startAt, booking.clientTimezone)}
      </div>

      <div className="glass-card flex flex-wrap gap-8 p-8">
        <div className="min-w-[280px] flex-1">
          <div className="mb-5 flex items-center justify-between">
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/85 text-[var(--color-text-secondary)] disabled:cursor-not-allowed disabled:opacity-40"
              onClick={() => goToMonth(-1)}
              disabled={isCurrentMonthOrEarlier}
              aria-label="Предыдущий месяц"
            >
              <ChevronLeftIcon />
            </button>
            <div className="text-[17px] font-semibold text-[var(--color-ink)]">
              {MONTH_LABELS[viewMonth]} {viewYear}
            </div>
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/85 text-[var(--color-text-secondary)]"
              onClick={() => goToMonth(1)}
              aria-label="Следующий месяц"
            >
              <ChevronRightIcon />
            </button>
          </div>
          <div className="grid grid-cols-7">
            {WEEKDAY_LABELS.map((label) => (
              <div key={label} className="pb-2 text-center text-xs text-[var(--color-muted)]">
                {label}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 justify-items-center gap-y-1.5">
            {cells.map((cell, idx) => {
              if (!cell) return <div key={`blank-${idx}`} className="h-10 w-10" />;
              const isPast = cell.dateKey < todayKey;
              const isSelected = cell.dateKey === selectedDateKey;
              const isToday = cell.dateKey === todayKey;
              return (
                <button
                  key={cell.dateKey}
                  type="button"
                  disabled={isPast}
                  onClick={() => selectDate(cell.dateKey)}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-[15px] font-medium disabled:cursor-not-allowed disabled:text-[var(--color-faint)]"
                  style={
                    isSelected
                      ? { background: "var(--color-primary-gradient)", color: "#fff", boxShadow: "0 8px 18px rgba(80,148,240,.35)" }
                      : isToday
                        ? { boxShadow: "inset 0 0 0 1.5px var(--color-primary)", color: "var(--color-ink)" }
                        : { color: isPast ? undefined : "var(--color-ink)", cursor: isPast ? undefined : "pointer" }
                  }
                >
                  {cell.day}
                </button>
              );
            })}
          </div>
        </div>

        <div className="w-full flex-none sm:w-[240px]">
          <div className="mb-4 text-[15px] font-semibold text-[var(--color-ink)]">{selectedDateLabel}</div>
          <div className="flex flex-col gap-2">
            {isLoadingSlots && <div className="text-sm text-[var(--color-muted)]">Загрузка…</div>}
            {!isLoadingSlots && slotsError && <div className="text-sm font-medium text-[var(--color-danger)]">{slotsError}</div>}
            {!isLoadingSlots && !slotsError && slots?.length === 0 && (
              <div className="text-sm text-[var(--color-muted)]">На этот день нет свободного времени.</div>
            )}
            {!isLoadingSlots &&
              !slotsError &&
              slots?.map((slot) => {
                const isSelected = selectedSlot?.start === slot.start;
                return (
                  <button
                    key={slot.start}
                    type="button"
                    onClick={() => setSelectedSlot(slot)}
                    className="cursor-pointer rounded-xl p-3 text-center text-[15px] font-semibold"
                    style={
                      isSelected
                        ? { background: "var(--color-primary-gradient)", color: "#fff", boxShadow: "0 6px 16px rgba(80,148,240,.35)" }
                        : { border: "1px solid rgba(255,255,255,.7)", background: "rgba(255,255,255,.5)", color: "var(--color-text-secondary)" }
                    }
                  >
                    {formatTime(slot.start, booking.clientTimezone)}
                  </button>
                );
              })}
          </div>

          {submitError && <div className="mt-3 text-sm font-medium text-[var(--color-danger)]">{submitError}</div>}

          <button
            type="button"
            className="btn-primary mt-4 w-full"
            disabled={!selectedSlot || isSubmitting}
            onClick={handleConfirm}
          >
            {isSubmitting
              ? "Переносим…"
              : selectedSlot
                ? `Перенести на ${formatTime(selectedSlot.start, booking.clientTimezone)}`
                : "Выберите время"}
          </button>
        </div>
      </div>
      <div className="mt-6 text-center text-xs text-[var(--color-faint)]">Работает на SLOTIX</div>
    </div>
  );
}
