"use client";

import { useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "../icons";
import { MONTH_NOMINATIVE, WEEKDAY_SHORT, ownerTodayParts } from "../format-utils";

interface CalendarPickerProps {
  timezone: string;
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function CalendarPicker({ timezone, selectedDate, onSelectDate }: CalendarPickerProps) {
  const today = ownerTodayParts(timezone);
  const [view, setView] = useState({ year: today.year, month: today.month });

  const firstWeekday = (new Date(Date.UTC(view.year, view.month, 1)).getUTCDay() + 6) % 7; // Monday-first
  const daysInMonth = new Date(Date.UTC(view.year, view.month + 1, 0)).getUTCDate();

  const cells: { key: string; dateStr: string | null; label: string; isPast: boolean; isToday: boolean }[] = [];
  for (let i = 0; i < firstWeekday; i++) {
    cells.push({ key: `pad-${i}`, dateStr: null, label: "", isPast: false, isToday: false });
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${view.year}-${pad(view.month + 1)}-${pad(day)}`;
    cells.push({
      key: dateStr,
      dateStr,
      label: String(day),
      isPast: dateStr < today.dateStr,
      isToday: dateStr === today.dateStr,
    });
  }

  const isAtCurrentMonth = view.year === today.year && view.month === today.month;

  function goPrevMonth() {
    setView((v) => (v.month === 0 ? { year: v.year - 1, month: 11 } : { year: v.year, month: v.month - 1 }));
  }
  function goNextMonth() {
    setView((v) => (v.month === 11 ? { year: v.year + 1, month: 0 } : { year: v.year, month: v.month + 1 }));
  }

  return (
    <div className="flex flex-col">
      <div className="mb-6 flex items-center justify-between">
        <button
          type="button"
          onClick={goPrevMonth}
          disabled={isAtCurrentMonth}
          aria-label="Предыдущий месяц"
          className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-white/85 text-[var(--color-text-secondary)] shadow-[0_2px_6px_rgba(20,40,70,0.06)] disabled:opacity-30"
        >
          <ChevronLeftIcon />
        </button>
        <div className="text-lg font-semibold text-[var(--color-ink)]">
          {MONTH_NOMINATIVE[view.month]} {view.year}
        </div>
        <button
          type="button"
          onClick={goNextMonth}
          aria-label="Следующий месяц"
          className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-white/85 text-[var(--color-text-secondary)] shadow-[0_2px_6px_rgba(20,40,70,0.06)]"
        >
          <ChevronRightIcon />
        </button>
      </div>

      <div className="grid grid-cols-7">
        {WEEKDAY_SHORT.map((w) => (
          <div key={w} className="pb-2.5 text-center text-xs tracking-wide text-[var(--color-muted)]">
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 justify-items-center gap-y-2">
        {cells.map((cell) => {
          if (!cell.dateStr) return <div key={cell.key} className="h-10 w-10" />;

          const isSelected = cell.dateStr === selectedDate;
          const baseClasses = "flex h-10 w-10 items-center justify-center rounded-full text-[15px] font-medium";
          const style: React.CSSProperties = isSelected
            ? { background: "var(--color-primary-gradient)", color: "#fff", boxShadow: "0 8px 18px rgba(80,148,240,.35)" }
            : cell.isToday
              ? { boxShadow: "inset 0 0 0 1.5px var(--color-primary)", color: "var(--color-ink)" }
              : { color: cell.isPast ? "var(--color-faint)" : "var(--color-ink)" };

          return (
            <button
              key={cell.key}
              type="button"
              disabled={cell.isPast}
              onClick={() => onSelectDate(cell.dateStr!)}
              className={`${baseClasses} ${cell.isPast ? "cursor-not-allowed" : "cursor-pointer hover:bg-white/60"}`}
              style={style}
            >
              {cell.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
