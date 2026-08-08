"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  CalendarIcon,
  CancelledIcon,
  ClockIcon,
  MovedIcon,
  VideoIcon,
} from "./icons";
import { CancelPanel } from "./CancelPanel";
import { ReschedulePanel } from "./ReschedulePanel";
import { formatDateLong, formatTime, providerLabel, tzOffsetLabel } from "./format-utils";
import type { BookingWithOwner } from "./types";

type Mode = "details" | "cancel" | "reschedule";

export function BookingManageView({ booking, token }: { booking: BookingWithOwner; token: string }) {
  // A booking returning from a hosted checkout is still `pending` until the payment is
  // confirmed. Sync it once on load so the client sees "оплачено" immediately, without
  // waiting for the provider's async webhook.
  const [status, setStatus] = useState<BookingWithOwner["status"]>(booking.status);
  const [justPaid, setJustPaid] = useState(false);
  const [syncing, setSyncing] = useState(booking.status === "pending");

  useEffect(() => {
    if (booking.status !== "pending") return;
    let cancelled = false;
    api
      .post<{ status: string }>(`/api/public/booking/${token}/sync-payment`)
      .then((r) => {
        if (cancelled) return;
        if (r.status === "confirmed" || r.status === "paid_awaiting_owner_confirmation") {
          setStatus("confirmed");
          setJustPaid(true);
        }
      })
      .catch(() => undefined)
      .finally(() => !cancelled && setSyncing(false));
    return () => {
      cancelled = true;
    };
  }, [booking.status, token]);

  const effective = { ...booking, status };
  if (effective.status === "cancelled") return <CancelledView booking={effective} />;
  if (effective.status === "moved") return <MovedView booking={effective} />;
  if (justPaid) return <PaidView booking={effective} />;
  return <ActiveBookingView booking={effective} token={token} syncing={syncing} />;
}

function PaidView({ booking }: { booking: BookingWithOwner }) {
  return (
    <div className="mx-auto w-full max-w-[480px]">
      <div className="glass-card p-9 text-center">
        <div className="mx-auto mb-5 flex h-[66px] w-[66px] items-center justify-center rounded-full" style={{ background: "rgba(63,203,110,.15)", color: "var(--color-success)" }}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
        </div>
        <div className="mb-2 text-[22px] font-bold text-[var(--color-ink)]">Оплата прошла!</div>
        <div className="mb-6 text-sm text-[var(--color-muted)]">
          Встреча с {booking.user.name ?? "специалистом"} подтверждена. Детали и ссылку мы отправили на вашу почту.
        </div>
      </div>
      <div className="mt-6 text-center text-xs text-[var(--color-faint)]">Работает на SLOTIX</div>
    </div>
  );
}

function ActiveBookingView({ booking, token, syncing }: { booking: BookingWithOwner; token: string; syncing?: boolean }) {
  // Reminder/confirmation emails link straight to a step ("Перенести", "Отменить"); without
  // this they'd all land on the details card and the two links would be indistinguishable.
  const requestedAction = useSearchParams().get("action");
  const [mode, setMode] = useState<Mode>(
    requestedAction === "cancel" || requestedAction === "reschedule" ? requestedAction : "details",
  );

  if (syncing && booking.status === "pending") {
    return (
      <div className="mx-auto w-full max-w-[480px]">
        <div className="glass-card p-9 text-center text-sm text-[var(--color-muted)]">Проверяем оплату…</div>
      </div>
    );
  }

  if (mode === "cancel") {
    return <CancelPanel booking={booking} token={token} onBack={() => setMode("details")} />;
  }

  if (mode === "reschedule") {
    return <ReschedulePanel booking={booking} token={token} onBack={() => setMode("details")} />;
  }

  return <DetailsCard booking={booking} onCancel={() => setMode("cancel")} onReschedule={() => setMode("reschedule")} />;
}

function PendingNote({ booking }: { booking: BookingWithOwner }) {
  if (booking.status !== "pending") return null;

  const message =
    booking.format.priceKopecks > 0
      ? "Ожидает оплаты — как только оплата пройдёт, встреча будет подтверждена."
      : `Ждём подтверждения от ${booking.user.name ?? "специалиста"}.`;

  return (
    <div
      className="mb-5 flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold"
      style={{ background: "var(--color-warning-bg)", borderColor: "rgba(245,185,61,.3)", color: "var(--color-warning)" }}
    >
      {message}
    </div>
  );
}

function DetailsCard({
  booking,
  onCancel,
  onReschedule,
}: {
  booking: BookingWithOwner;
  onCancel: () => void;
  onReschedule: () => void;
}) {
  const { format, user } = booking;
  const dateLabel = formatDateLong(booking.startAt, booking.clientTimezone);
  const timeLabel = `${formatTime(booking.startAt, booking.clientTimezone)} – ${formatTime(booking.endAt, booking.clientTimezone)}`;
  const tzLabel = `${booking.clientTimezone} (${tzOffsetLabel(booking.clientTimezone, new Date(booking.startAt))})`;

  return (
    <div className="mx-auto w-full max-w-[560px]">
      <div className="glass-card p-9">
        <div className="mb-7 flex items-center gap-4">
          <div className="h-14 w-14 flex-none overflow-hidden rounded-full bg-white/80" style={{ boxShadow: "0 0 0 1.5px var(--color-primary)" }}>
            {user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatarUrl} alt={user.name ?? ""} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-lg font-bold text-[var(--color-primary)]">
                {(user.name ?? "?").charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <div className="text-[17px] font-bold text-[var(--color-ink)]">{user.name ?? "Специалист"}</div>
            <div className="text-sm text-[var(--color-muted)]">Ваша предстоящая встреча</div>
          </div>
        </div>

        <PendingNote booking={booking} />

        <div className="rounded-2xl border border-white/70 bg-white/60 p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="h-2 w-2 rounded-full" style={{ background: format.color }} />
            <div className="text-[17px] font-bold text-[var(--color-ink)]">{format.name}</div>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 text-sm font-medium text-[var(--color-text-secondary)]">
              <CalendarIcon className="flex-none text-[var(--color-muted)]" />
              {dateLabel} · {timeLabel}
            </div>
            <div className="flex items-center gap-3 text-sm font-medium text-[var(--color-text-secondary)]">
              <ClockIcon className="flex-none text-[var(--color-muted)]" />
              {format.durationMin} минут · {tzLabel}
            </div>
            <div className="flex items-center gap-3 text-sm font-medium text-[var(--color-text-secondary)]">
              <VideoIcon className="flex-none text-[var(--color-muted)]" />
              {booking.provider === "phone" ? (
                <span>
                  {providerLabel("phone")}
                  {booking.clientPhone ? ` · ${booking.clientPhone}` : ""}
                </span>
              ) : booking.channelLink ? (
                <a href={booking.channelLink} target="_blank" rel="noopener noreferrer">
                  {providerLabel(booking.provider ?? format.providers[0])} · ссылка на встречу
                </a>
              ) : (
                <span>
                  {providerLabel(booking.provider ?? format.providers[0])} — ссылка появится после подтверждения
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button type="button" className="btn-secondary flex-1" onClick={onReschedule}>
            Перенести
          </button>
          <button
            type="button"
            className="flex-1 cursor-pointer rounded-xl border px-5 py-3 text-sm font-semibold"
            style={{ borderColor: "rgba(232,86,86,.35)", color: "var(--color-danger)", background: "rgba(255,255,255,.7)" }}
            onClick={onCancel}
          >
            Отменить
          </button>
        </div>
      </div>
    </div>
  );
}

function CancelledView({ booking }: { booking: BookingWithOwner }) {
  return (
    <div className="mx-auto w-full max-w-[480px]">
      <div className="glass-card p-9 text-center">
        <div
          className="mx-auto mb-5 flex h-[66px] w-[66px] items-center justify-center rounded-full"
          style={{ background: "rgba(92,110,125,.12)", color: "#5C6E7D" }}
        >
          <CancelledIcon />
        </div>
        <div className="mb-2 text-[22px] font-bold text-[var(--color-ink)]">Встреча отменена</div>
        <div className="mb-6 text-sm text-[var(--color-muted)]">
          Мы сообщили {booking.user.name ?? "специалисту"}. Хотите записаться на другое время?
        </div>
        {booking.cancelReason && (
          <div className="mb-6 rounded-xl border border-white/70 bg-white/60 p-4 text-left text-sm text-[var(--color-text-secondary)]">
            <span className="font-semibold text-[var(--color-ink)]">Причина: </span>
            {booking.cancelReason}
          </div>
        )}
        <Link href={`/${booking.user.slug}`} className="btn-primary">
          Записаться заново
        </Link>
      </div>
    </div>
  );
}

function MovedView({ booking }: { booking: BookingWithOwner }) {
  return (
    <div className="mx-auto w-full max-w-[480px]">
      <div className="glass-card p-9 text-center">
        <div
          className="mx-auto mb-5 flex h-[66px] w-[66px] items-center justify-center rounded-full"
          style={{ background: "var(--color-info-bg)", color: "var(--color-info)" }}
        >
          <MovedIcon />
        </div>
        <div className="mb-2 text-[22px] font-bold text-[var(--color-ink)]">Встреча перенесена</div>
        <div className="mb-6 text-sm text-[var(--color-muted)]">
          Эта встреча была перенесена на новое время. Проверьте почту — туда пришло письмо с новым подтверждением.
        </div>
        <Link href={`/${booking.user.slug}`} className="btn-secondary">
          На страницу {booking.user.name ?? "специалиста"}
        </Link>
      </div>
    </div>
  );
}
