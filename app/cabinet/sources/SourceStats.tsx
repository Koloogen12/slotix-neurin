"use client";

import { useMemo } from "react";
import type { BookingSourceStats, BookingSourceRow } from "@/lib/api";

export function formatRubles(kopecks: number): string {
  return `${Math.round(kopecks / 100).toLocaleString("ru-RU")} ₽`;
}

function sourceLabel(row: BookingSourceRow): string {
  if (!row.source && !row.medium && !row.campaign) return "Прямые переходы";
  return row.source || "—";
}

/** A muted color per source name so rows are visually distinguishable at a glance. */
function barColor(row: BookingSourceRow): string {
  if (!row.source && !row.medium && !row.campaign) return "rgba(92,110,125,.35)";
  const palette = ["#5094f0", "#3fcb6e", "#f5b93d", "#a879f0", "#f07aa0", "#4fc3d6", "#f0844f"];
  let hash = 0;
  for (const ch of row.source || row.campaign) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffff;
  return palette[hash % palette.length];
}

/** Summary cards + per-source breakdown. Shared by the personal «Источники» page and the
 * team's aggregate sources tab — same data shape, same rendering. */
export function SourceStats({ stats, revenueLabel = "Доход по записям" }: { stats: BookingSourceStats; revenueLabel?: string }) {
  const maxBookings = useMemo(() => Math.max(1, ...stats.rows.map((r) => r.bookings)), [stats]);

  return (
    <>
      <div className="mb-6 grid grid-cols-2 gap-4 sm:max-w-[440px]">
        <div className="glass-card p-5">
          <div className="text-xs font-medium text-(--color-muted)">Всего записей</div>
          <div className="mt-1 text-[26px] font-bold text-(--color-ink)">{stats.totalBookings}</div>
        </div>
        <div className="glass-card p-5">
          <div className="text-xs font-medium text-(--color-muted)">{revenueLabel}</div>
          <div className="mt-1 text-[26px] font-bold" style={{ color: "var(--color-success)" }}>
            {formatRubles(stats.totalRevenueKopecks)}
          </div>
        </div>
      </div>

      {stats.rows.length === 0 ? (
        <div className="glass-card p-9 text-center text-sm text-(--color-muted)">
          Пока нет записей. Как только клиенты начнут записываться по вашей ссылке, здесь появится разбивка по источникам.
        </div>
      ) : (
        <div className="glass-card overflow-hidden p-0">
          <div className="grid grid-cols-[1fr_auto_auto] gap-4 border-b border-white/60 px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-(--color-muted)">
            <div>Источник</div>
            <div className="text-right">Записей</div>
            <div className="text-right">Доход</div>
          </div>
          {stats.rows.map((row, i) => (
            <div
              key={`${row.source}|${row.medium}|${row.campaign}|${i}`}
              className="grid grid-cols-[1fr_auto_auto] items-center gap-4 px-5 py-3.5"
              style={{ borderTop: i === 0 ? "none" : "1px solid rgba(20,30,45,.05)" }}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 flex-none rounded-full" style={{ background: barColor(row) }} />
                  <span className="truncate text-sm font-semibold text-(--color-ink)">{sourceLabel(row)}</span>
                </div>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 pl-4.5 text-xs text-(--color-muted)">
                  {row.campaign && <span>кампания: {row.campaign}</span>}
                  {row.medium && <span>канал: {row.medium}</span>}
                </div>
                <div className="mt-2 h-1.5 w-full max-w-[280px] overflow-hidden rounded-full bg-black/5">
                  <div className="h-full rounded-full" style={{ width: `${(row.bookings / maxBookings) * 100}%`, background: barColor(row) }} />
                </div>
              </div>
              <div className="text-right text-sm font-bold text-(--color-ink)">{row.bookings}</div>
              <div className="text-right text-sm font-semibold" style={{ color: row.revenueKopecks > 0 ? "var(--color-success)" : "var(--color-faint)" }}>
                {row.revenueKopecks > 0 ? formatRubles(row.revenueKopecks) : "—"}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
