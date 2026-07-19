"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { formatDateLong, formatTime, providerLabel } from "./format-utils";
import type { BookingWithOwner } from "./types";

export function CancelPanel({
  booking,
  token,
  onBack,
}: {
  booking: BookingWithOwner;
  token: string;
  onBack: () => void;
}) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dateLabel = formatDateLong(booking.startAt, booking.clientTimezone);
  const timeLabel = `${formatTime(booking.startAt, booking.clientTimezone)} – ${formatTime(booking.endAt, booking.clientTimezone)}`;

  async function handleCancel() {
    setIsSubmitting(true);
    setError(null);
    try {
      await api.post(`/api/public/booking/${token}/cancel`, reason.trim() ? { reason: reason.trim() } : {});
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Не удалось отменить встречу. Попробуйте ещё раз.");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[480px]">
      <div className="glass-card p-8">
        <div className="mb-5 text-[22px] font-bold text-[var(--color-ink)]">Отменить встречу?</div>
        <div className="mb-6 rounded-2xl border border-white/70 bg-white/60 p-5">
          <div className="mb-3 flex items-center gap-3">
            <div className="h-2 w-2 rounded-full" style={{ background: booking.format.color }} />
            <div className="text-[16px] font-bold text-[var(--color-ink)]">{booking.format.name}</div>
          </div>
          <div className="text-sm font-medium text-[var(--color-text-secondary)]">
            {dateLabel} · {timeLabel}
          </div>
          <div className="mt-1 text-[13px] text-[var(--color-muted)]">
            с {booking.user.name ?? "специалистом"} · {providerLabel(booking.format.provider)}
          </div>
        </div>

        <label htmlFor="cancel-reason" className="mb-2 block text-[13px] font-semibold text-[var(--color-ink)]">
          Причина (необязательно)
        </label>
        <textarea
          id="cancel-reason"
          className="input-field mb-5 min-h-[76px] resize-y"
          placeholder="Например: изменились планы"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />

        {error && <div className="mb-4 text-sm font-medium text-[var(--color-danger)]">{error}</div>}

        <button
          type="button"
          className="w-full cursor-pointer rounded-xl px-5 py-3.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          style={{ background: "var(--color-danger)", boxShadow: "0 8px 20px rgba(225,86,86,.3)" }}
          onClick={handleCancel}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Отменяем…" : "Отменить встречу"}
        </button>
        <button
          type="button"
          className="mt-3 w-full cursor-pointer text-center text-sm font-semibold text-[var(--color-muted)]"
          onClick={onBack}
          disabled={isSubmitting}
        >
          Не отменять
        </button>
      </div>
      <div className="mt-6 text-center text-xs text-[var(--color-faint)]">Работает на SLOTIX</div>
    </div>
  );
}
