"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api, ApiError, type Booking, type BookingStatus, type TimeSlot } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { CalendarPicker } from "@/app/[slug]/[formatId]/calendar-picker";

type Tab = "upcoming" | "action" | "past" | "cancelled";

const TAB_LABELS: Record<Tab, string> = {
  upcoming: "Предстоящие",
  action: "Требуют действия",
  past: "Прошедшие",
  cancelled: "Отменённые",
};

const STATUS_BADGE: Record<BookingStatus, { label: string; color: string; bg: string; border?: boolean }> = {
  confirmed: { label: "Подтверждена", color: "var(--color-success)", bg: "var(--color-success-bg)" },
  pending: { label: "Ждёт подтверждения", color: "var(--color-warning)", bg: "var(--color-warning-bg)" },
  cancelled: { label: "Отменена", color: "var(--color-danger)", bg: "var(--color-danger-bg)", border: true },
  moved: { label: "Перенесена", color: "var(--color-info)", bg: "var(--color-info-bg)" },
};

function ymdInTz(date: Date, tz: string): string {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(
      date,
    );
  } catch {
    return new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
  }
}

function dayLabel(startAt: string, tz: string): string {
  const start = new Date(startAt);
  const startYmd = ymdInTz(start, tz);
  const todayYmd = ymdInTz(new Date(), tz);
  const diffDays = Math.round((Date.parse(startYmd) - Date.parse(todayYmd)) / 86_400_000);
  if (diffDays === 0) return "Сегодня";
  if (diffDays === 1) return "Завтра";
  if (diffDays === -1) return "Вчера";
  const formatted = new Intl.DateTimeFormat("ru-RU", { timeZone: tz, weekday: "long", day: "numeric", month: "long" }).format(
    start,
  );
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function timeRange(startAt: string, endAt: string, tz: string): string {
  const fmt = new Intl.DateTimeFormat("ru-RU", { timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: false });
  return `${fmt.format(new Date(startAt))} – ${fmt.format(new Date(endAt))}`;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0] + parts[1]![0]).toUpperCase();
}

function categorize(booking: Booking): Exclude<Tab, "action"> {
  if (booking.status === "cancelled") return "cancelled";
  if (booking.status === "moved") return "past";
  const isPast = new Date(booking.endAt).getTime() < Date.now();
  return isPast ? "past" : "upcoming";
}

const PROVIDER_LABEL: Record<string, string> = {
  google_meet: "Google Meet",
  zoom: "Zoom",
  yandex_telemost: "Яндекс Телемост",
};

export default function MeetingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [tab, setTab] = useState<Tab>("upcoming");
  const [search, setSearch] = useState("");
  const [formatFilter, setFormatFilter] = useState<string>("all");
  const [filterOpen, setFilterOpen] = useState(false);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [menuForId, setMenuForId] = useState<string | null>(null);
  const [rejectFor, setRejectFor] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [cancelFor, setCancelFor] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [rescheduleFor, setRescheduleFor] = useState<Booking | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState<string | null>(null);
  const [rescheduleSlots, setRescheduleSlots] = useState<TimeSlot[]>([]);
  const [rescheduleSlotsLoading, setRescheduleSlotsLoading] = useState(false);
  const [rescheduleSelectedSlot, setRescheduleSelectedSlot] = useState<TimeSlot | null>(null);
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);

  const loadBookings = useCallback(() => {
    return api
      .get<Booking[]>("/api/bookings")
      .then((data) => setBookings(data))
      .catch((err) => setLoadError(err instanceof ApiError ? err.message : "Не удалось загрузить встречи"));
  }, []);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast((current) => (current === message ? null : current)), 2600);
  }

  function setBusy(id: string, value: boolean) {
    setBusyIds((prev) => {
      const next = new Set(prev);
      if (value) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  async function handleConfirm(id: string) {
    setBusy(id, true);
    try {
      const updated = await api.post<Booking>(`/api/bookings/${id}/confirm`);
      setBookings((prev) => prev?.map((b) => (b.id === id ? { ...b, status: updated.status } : b)) ?? prev);
      showToast("Встреча подтверждена — клиент уведомлён");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Не удалось подтвердить встречу");
    } finally {
      setBusy(id, false);
      setMenuForId(null);
    }
  }

  async function handleReject(id: string, reason: string) {
    setBusy(id, true);
    try {
      const updated = await api.post<Booking>(`/api/bookings/${id}/reject`, reason ? { reason } : undefined);
      setBookings(
        (prev) =>
          prev?.map((b) => (b.id === id ? { ...b, status: updated.status, cancelReason: updated.cancelReason } : b)) ??
          prev,
      );
      showToast("Встреча отклонена — клиент уведомлён");
      setRejectFor(null);
      setRejectReason("");
      if (selectedId === id) setSelectedId(null);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Не удалось отклонить встречу");
    } finally {
      setBusy(id, false);
      setMenuForId(null);
    }
  }

  async function handleCancel(booking: Booking, reason: string) {
    setBusy(booking.id, true);
    try {
      const updated = await api.post<Booking>(`/api/bookings/${booking.id}/cancel`, reason ? { reason } : undefined);
      setBookings(
        (prev) =>
          prev?.map((b) => (b.id === booking.id ? { ...b, status: updated.status, cancelReason: updated.cancelReason } : b)) ??
          prev,
      );
      showToast("Встреча отменена — клиент уведомлён");
      setCancelFor(null);
      setCancelReason("");
      if (selectedId === booking.id) setSelectedId(null);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Не удалось отменить встречу");
    } finally {
      setBusy(booking.id, false);
      setMenuForId(null);
    }
  }

  function openReschedule(booking: Booking) {
    setMenuForId(null);
    setRescheduleFor(booking);
    setRescheduleDate(null);
    setRescheduleSlots([]);
    setRescheduleSelectedSlot(null);
  }

  const fetchRescheduleSlots = useCallback(
    async (booking: Booking, date: string) => {
      if (!user) return;
      setRescheduleSlotsLoading(true);
      setRescheduleSelectedSlot(null);
      try {
        const slots = await api.get<TimeSlot[]>(
          `/api/public/${encodeURIComponent(user.slug)}/${booking.formatId}/slots?date=${date}`,
        );
        setRescheduleSlots(slots);
      } catch {
        setRescheduleSlots([]);
      } finally {
        setRescheduleSlotsLoading(false);
      }
    },
    [user],
  );

  function handleSelectRescheduleDate(date: string) {
    setRescheduleDate(date);
    if (rescheduleFor) fetchRescheduleSlots(rescheduleFor, date);
  }

  async function handleConfirmReschedule() {
    if (!rescheduleFor || !rescheduleSelectedSlot) return;
    setBusy(rescheduleFor.id, true);
    try {
      await api.post(`/api/bookings/${rescheduleFor.id}/reschedule`, { startAt: rescheduleSelectedSlot.start });
      showToast("Встреча перенесена — клиент уведомлён");
      setRescheduleFor(null);
      if (selectedId === rescheduleFor.id) setSelectedId(null);
      await loadBookings();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Не удалось перенести встречу");
    } finally {
      setBusy(rescheduleFor.id, false);
    }
  }

  async function copyChannelLink(link: string) {
    try {
      await navigator.clipboard.writeText(link);
      showToast("Ссылка на встречу скопирована");
    } catch {
      showToast("Не удалось скопировать ссылку");
    }
    setMenuForId(null);
  }

  const formatOptions = useMemo(() => {
    if (!bookings) return [];
    const seen = new Map<string, string>();
    for (const b of bookings) {
      if (b.format && !seen.has(b.format.name)) seen.set(b.format.name, b.format.color);
    }
    return [...seen.entries()];
  }, [bookings]);

  const actionCount = useMemo(
    () => (bookings ?? []).filter((b) => categorize(b) === "upcoming" && b.status === "pending").length,
    [bookings],
  );

  const filteredItems = useMemo(() => {
    if (!bookings) return [];
    let items = bookings.filter((b) => (tab === "action" ? categorize(b) === "upcoming" && b.status === "pending" : categorize(b) === tab));
    if (formatFilter !== "all") items = items.filter((b) => b.format?.name === formatFilter);
    const q = search.trim().toLowerCase();
    if (q) items = items.filter((b) => `${b.clientName} ${b.clientEmail}`.toLowerCase().includes(q));
    const ascending = tab === "upcoming" || tab === "action";
    return [...items].sort((a, b) =>
      ascending
        ? new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
        : new Date(b.startAt).getTime() - new Date(a.startAt).getTime(),
    );
  }, [bookings, tab, formatFilter, search]);

  const groups = useMemo(() => {
    const map = new Map<string, Booking[]>();
    for (const b of filteredItems) {
      const label = dayLabel(b.startAt, b.ownerTimezoneAtBooking);
      const list = map.get(label) ?? [];
      list.push(b);
      map.set(label, list);
    }
    return [...map.entries()].map(([title, items]) => ({ title, items }));
  }, [filteredItems]);

  const isFiltering = formatFilter !== "all" || search.trim().length > 0;
  const anyUpcomingAtAll = (bookings ?? []).some((b) => categorize(b) === "upcoming");
  const anyPopoverOpen = filterOpen || menuForId !== null;
  const selected = bookings?.find((b) => b.id === selectedId) ?? null;

  // Closes the filter/context popovers on an outside click via a mousedown listener that
  // checks whether the click landed inside a `[data-menu-root]` — replaces a previous
  // full-screen `position:fixed` overlay, which sat in the same stacking context as the
  // popovers' ancestors and silently ate every click meant for a menu item (including
  // "Подтвердить"/"Отклонить" on pending bookings), regardless of the popover's own
  // z-index. See the identical fix + longer explanation in app/cabinet/formats/page.tsx.
  useEffect(() => {
    if (!anyPopoverOpen) return;
    const handlePointerDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-menu-root]")) {
        setFilterOpen(false);
        setMenuForId(null);
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [anyPopoverOpen]);

  const emptyCopy: Record<Tab, [string, string]> = {
    upcoming: ["Пока пусто", "Поделитесь ссылкой на профиль — здесь появятся брони"],
    action: ["Всё разобрано", "Нет встреч, ожидающих вашего решения"],
    past: ["Прошедших встреч нет", "Здесь появятся завершённые встречи"],
    cancelled: ["Отменённых нет", "Здесь появятся отменённые встречи"],
  };

  return (
    <div className="pb-10">
      <h1 className="mb-5 text-[28px] font-bold tracking-tight text-(--color-ink)">Все встречи</h1>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {(Object.keys(TAB_LABELS) as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => {
              setTab(t);
              setMenuForId(null);
            }}
            className="flex items-center gap-2 whitespace-nowrap rounded-[11px] px-4 py-2.5 text-sm font-semibold"
            style={
              tab === t
                ? { background: "var(--color-primary-gradient)", color: "#fff", boxShadow: "0 6px 16px rgba(80,148,240,.3)" }
                : { background: "rgba(255,255,255,.55)", color: "var(--color-text-secondary)", border: "1px solid rgba(255,255,255,.7)" }
            }
          >
            {TAB_LABELS[t]}
            {t === "action" && actionCount > 0 && (
              <span
                className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1.5 text-[11px] font-semibold text-white"
                style={{ background: tab === "action" ? "rgba(255,255,255,.35)" : "var(--color-danger)" }}
              >
                {actionCount}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="relative mb-5 flex gap-2.5">
        <div className="relative max-w-[340px] flex-1">
          <span className="absolute top-3 left-3.5 text-(--color-muted)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4-4" />
            </svg>
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по имени или почте"
            className="input-field pl-10.5"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              aria-label="Очистить поиск"
              className="absolute top-2.5 right-3 text-(--color-muted)"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          )}
        </div>
        <div className="relative" data-menu-root>
          <button
            onClick={() => setFilterOpen((v) => !v)}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium whitespace-nowrap text-(--color-text-secondary)"
            style={{
              border: `1px solid ${formatFilter !== "all" ? "var(--color-primary)" : "#D1D9E6"}`,
              background: formatFilter !== "all" ? "rgba(80,148,240,.08)" : "rgba(255,255,255,.6)",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 5h18M6 12h12M10 19h4" />
            </svg>
            {formatFilter === "all" ? "Все форматы" : formatFilter}
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--color-muted)" strokeWidth="2" strokeLinecap="round">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          {filterOpen && (
            <div className="absolute top-[calc(100%+6px)] left-0 z-30 min-w-[220px] rounded-[14px] border border-[#E3E9EF] bg-white p-1.5 shadow-[0_16px_40px_rgba(20,40,70,.16)]">
              <div
                onClick={() => {
                  setFormatFilter("all");
                  setFilterOpen(false);
                }}
                className="flex cursor-pointer items-center gap-2.5 rounded-[9px] px-3 py-2.5 text-sm font-medium text-(--color-text-secondary) hover:bg-[rgba(80,148,240,.08)]"
                style={formatFilter === "all" ? { background: "rgba(80,148,240,.08)", color: "var(--color-ink)" } : undefined}
              >
                <span className="h-2.5 w-2.5 flex-none rounded-full" style={{ background: "var(--color-faint-2)" }} />
                Все форматы
              </div>
              {formatOptions.map(([name, color]) => (
                <div
                  key={name}
                  onClick={() => {
                    setFormatFilter(name);
                    setFilterOpen(false);
                  }}
                  className="flex cursor-pointer items-center gap-2.5 rounded-[9px] px-3 py-2.5 text-sm font-medium text-(--color-text-secondary) hover:bg-[rgba(80,148,240,.08)]"
                  style={formatFilter === name ? { background: "rgba(80,148,240,.08)", color: "var(--color-ink)" } : undefined}
                >
                  <span className="h-2.5 w-2.5 flex-none rounded-full" style={{ background: color }} />
                  {name}
                  {formatFilter === name && (
                    <span className="ml-auto text-(--color-link)">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {loadError && (
        <div className="glass-card mb-5 p-5 text-sm text-(--color-danger)">{loadError}</div>
      )}

      {bookings === null && !loadError && (
        <div className="glass-card p-8 text-center text-sm text-(--color-muted)">Загружаем встречи…</div>
      )}

      {bookings !== null && groups.length > 0 && (
        <div>
          {groups.map((g) => (
            <div key={g.title} className="mb-5.5">
              <div className="mb-2 ml-1.5 text-[13px] font-semibold text-(--color-muted)">{g.title}</div>
              <div
                className="rounded-[18px] p-1.5"
                style={{
                  background: "rgba(255,255,255,.55)",
                  backdropFilter: "blur(24px) saturate(1.4)",
                  border: "1px solid rgba(255,255,255,.55)",
                  boxShadow: "0 12px 34px rgba(20,40,70,.06)",
                }}
              >
                {g.items.map((m) => {
                  const badge = STATUS_BADGE[m.status];
                  const pending = m.status === "pending";
                  return (
                    <div
                      key={m.id}
                      onClick={() => {
                        setSelectedId(m.id);
                        setMenuForId(null);
                      }}
                      className="relative flex cursor-pointer flex-wrap items-center gap-3.5 rounded-[14px] p-3.5 transition-colors hover:bg-[rgba(80,148,240,.06)]"
                      style={pending ? { boxShadow: "inset 3px 0 0 var(--color-warning)" } : undefined}
                    >
                      <div className="h-2.5 w-2.5 flex-none rounded-full" style={{ background: m.format?.color ?? "var(--color-faint-2)" }} />
                      <div className="w-28 flex-none text-sm font-semibold tabular-nums text-(--color-ink)">
                        {timeRange(m.startAt, m.endAt, m.ownerTimezoneAtBooking)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-(--color-ink)">{m.format?.name ?? "Формат"}</div>
                        <div className="text-[12.5px] text-(--color-muted)">{m.clientName}</div>
                      </div>
                      {pending ? (
                        <div className="flex flex-none gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            disabled={busyIds.has(m.id)}
                            onClick={() => handleConfirm(m.id)}
                            className="btn-primary !px-3.5 !py-2 !text-[13px] !shadow-none"
                          >
                            Подтвердить
                          </button>
                          <button
                            disabled={busyIds.has(m.id)}
                            onClick={() => setRejectFor(m.id)}
                            className="btn-secondary !px-3.5 !py-2 !text-[13px]"
                          >
                            Отклонить
                          </button>
                        </div>
                      ) : (
                        <div
                          className="rounded-lg px-2.5 py-1 text-xs font-semibold whitespace-nowrap"
                          style={{
                            color: badge.color,
                            background: badge.bg,
                            border: badge.border ? `1px solid rgba(232,86,86,.35)` : undefined,
                          }}
                        >
                          {badge.label}
                        </div>
                      )}
                      {m.channelLink && (
                        <span className="flex-none text-(--color-faint-2)">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="6" width="13" height="12" rx="2.5" />
                            <path d="M15 10l6-3.5v11L15 14" />
                          </svg>
                        </span>
                      )}
                      <div className="relative flex-none" data-menu-root onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setMenuForId((cur) => (cur === m.id ? null : m.id))}
                          className="flex cursor-pointer rounded-md p-0.5 text-(--color-faint-2)"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                            <circle cx="5" cy="12" r="1.6" />
                            <circle cx="12" cy="12" r="1.6" />
                            <circle cx="19" cy="12" r="1.6" />
                          </svg>
                        </button>
                        {menuForId === m.id && (
                          <div className="absolute top-[calc(100%+4px)] right-0 z-25 min-w-[196px] rounded-[13px] border border-[#E3E9EF] bg-white p-1.5 shadow-[0_16px_40px_rgba(20,40,70,.18)]">
                            <div
                              onClick={() => {
                                setSelectedId(m.id);
                                setMenuForId(null);
                              }}
                              className="flex cursor-pointer items-center gap-2.5 rounded-[9px] px-3 py-2.5 text-sm font-medium text-(--color-text-secondary) hover:bg-[rgba(80,148,240,.08)]"
                            >
                              Открыть детали
                            </div>
                            {pending && (
                              <div
                                onClick={() => handleConfirm(m.id)}
                                className="flex cursor-pointer items-center gap-2.5 rounded-[9px] px-3 py-2.5 text-sm font-medium hover:bg-[rgba(80,148,240,.08)]"
                                style={{ color: "var(--color-success)" }}
                              >
                                Подтвердить
                              </div>
                            )}
                            {m.channelLink && (
                              <div
                                onClick={() => copyChannelLink(m.channelLink!)}
                                className="flex cursor-pointer items-center gap-2.5 rounded-[9px] px-3 py-2.5 text-sm font-medium text-(--color-text-secondary) hover:bg-[rgba(80,148,240,.08)]"
                              >
                                Скопировать ссылку
                              </div>
                            )}
                            {(pending || m.status === "confirmed") && (
                              <div
                                onClick={() => openReschedule(m)}
                                className="flex cursor-pointer items-center gap-2.5 rounded-[9px] px-3 py-2.5 text-sm font-medium text-(--color-text-secondary) hover:bg-[rgba(80,148,240,.08)]"
                              >
                                Перенести
                              </div>
                            )}
                            {pending && (
                              <div
                                onClick={() => {
                                  setMenuForId(null);
                                  setRejectFor(m.id);
                                }}
                                className="flex cursor-pointer items-center gap-2.5 rounded-[9px] px-3 py-2.5 text-sm font-medium"
                                style={{ color: "var(--color-danger)" }}
                              >
                                Отклонить
                              </div>
                            )}
                            {m.status === "confirmed" && (
                              <div
                                onClick={() => {
                                  setMenuForId(null);
                                  setCancelFor(m);
                                }}
                                className="flex cursor-pointer items-center gap-2.5 rounded-[9px] px-3 py-2.5 text-sm font-medium"
                                style={{ color: "var(--color-danger)" }}
                              >
                                Отменить
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {bookings !== null && !loadError && groups.length === 0 && (
        <div className="flex flex-col items-center px-5 py-16 text-center">
          <div
            className="mb-5 flex h-[70px] w-[70px] items-center justify-center rounded-[20px]"
            style={{ background: "rgba(255,255,255,.6)", border: "1px solid rgba(255,255,255,.6)", color: "var(--color-primary)" }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4.5" width="18" height="16.5" rx="2.5" />
              <path d="M3 9h18M8 2.5v4M16 2.5v4" />
            </svg>
          </div>
          <div className="mb-1.5 text-lg font-bold text-(--color-ink)">
            {isFiltering ? "Ничего не найдено" : emptyCopy[tab][0]}
          </div>
          <div className="mb-4.5 max-w-[320px] text-sm text-(--color-muted)">
            {isFiltering ? "Попробуйте изменить поиск или фильтр" : emptyCopy[tab][1]}
          </div>
          {isFiltering && (
            <button
              onClick={() => {
                setSearch("");
                setFormatFilter("all");
              }}
              className="btn-secondary"
            >
              Сбросить фильтры
            </button>
          )}
          {!isFiltering && tab === "upcoming" && !anyUpcomingAtAll && (
            <p className="text-sm text-(--color-muted)">Поделитесь ссылкой на ваш профиль с клиентами, чтобы получить первую бронь.</p>
          )}
        </div>
      )}

      {selected && (
        <div>
          <div onClick={() => setSelectedId(null)} className="fixed inset-0 z-40" style={{ background: "rgba(26,40,60,.28)", backdropFilter: "blur(2px)" }} />
          <div
            className="fixed top-0 right-0 z-41 box-border h-screen w-[428px] max-w-[92vw] overflow-y-auto p-7"
            style={{
              background: "rgba(255,255,255,.82)",
              backdropFilter: "blur(30px) saturate(1.4)",
              borderLeft: "1px solid rgba(255,255,255,.6)",
              boxShadow: "-20px 0 50px rgba(20,40,70,.14)",
            }}
          >
            <div className="mb-5.5 flex items-center">
              <div
                className="rounded-lg px-2.5 py-1 text-xs font-semibold"
                style={{
                  color: STATUS_BADGE[selected.status].color,
                  background: STATUS_BADGE[selected.status].bg,
                }}
              >
                {STATUS_BADGE[selected.status].label}
              </div>
              <button
                onClick={() => setSelectedId(null)}
                aria-label="Закрыть"
                className="ml-auto flex h-8.5 w-8.5 items-center justify-center rounded-[10px] text-(--color-text-secondary-3)"
                style={{ background: "rgba(255,255,255,.7)" }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            <div className="mb-1.5 flex items-center gap-2.5">
              <div className="h-2.5 w-2.5 rounded-full" style={{ background: selected.format?.color ?? "var(--color-faint-2)" }} />
              <div className="text-xl font-bold text-(--color-ink)">{selected.format?.name ?? "Формат"}</div>
            </div>
            <div className="mb-6 text-sm font-medium text-(--color-muted)">
              {dayLabel(selected.startAt, selected.ownerTimezoneAtBooking)} · {timeRange(selected.startAt, selected.endAt, selected.ownerTimezoneAtBooking)}
            </div>

            <div className="mb-4 rounded-2xl p-4.5" style={{ background: "rgba(255,255,255,.6)", border: "1px solid rgba(255,255,255,.7)" }}>
              <div className="mb-4 flex items-center gap-3.5">
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-full text-[15px] font-bold text-white"
                  style={{ background: "var(--color-primary-gradient)" }}
                >
                  {initials(selected.clientName)}
                </div>
                <div>
                  <div className="text-[15px] font-semibold text-(--color-ink)">{selected.clientName}</div>
                  <div className="text-[13px] text-(--color-muted)">{selected.clientEmail}</div>
                </div>
              </div>
              {selected.clientComment && (
                <div className="rounded-[11px] p-3.5 text-[13.5px] text-(--color-text-secondary)" style={{ background: "rgba(255,255,255,.6)" }}>
                  «{selected.clientComment}»
                </div>
              )}
            </div>

            <div className="mb-5.5 flex flex-col gap-3.5 px-1">
              <div className="flex gap-3 text-sm text-(--color-text-secondary)">
                <span className="flex-none text-(--color-muted)">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5l3 2" />
                  </svg>
                </span>
                <div>
                  {timeRange(selected.startAt, selected.endAt, selected.ownerTimezoneAtBooking)}{" "}
                  <span className="text-(--color-muted)">· ваша зона ({selected.ownerTimezoneAtBooking})</span>
                  <br />
                  <span className="text-(--color-muted)">
                    {timeRange(selected.startAt, selected.endAt, selected.clientTimezone)} · клиент ({selected.clientTimezone})
                  </span>
                </div>
              </div>
              {selected.format && (
                <div className="flex gap-3 text-sm text-(--color-text-secondary)">
                  <span className="flex-none text-(--color-muted)">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="6" width="13" height="12" rx="2.5" />
                      <path d="M15 10l6-3.5v11L15 14" />
                    </svg>
                  </span>
                  <div>
                    {PROVIDER_LABEL[selected.provider ?? selected.format.providers[0]] ?? ""}
                    {selected.channelLink && (
                      <>
                        {" "}
                        <span onClick={() => copyChannelLink(selected.channelLink!)} className="cursor-pointer font-semibold text-(--color-link)">
                          · ссылка
                        </span>
                      </>
                    )}
                  </div>
                </div>
              )}
              {selected.status === "cancelled" && selected.cancelReason && (
                <div className="flex gap-3 text-sm text-(--color-text-secondary)">
                  <span className="flex-none text-(--color-muted)">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 9v4M12 17h.01M10.3 3.9L2 18a2 2 0 0 0 1.7 3h16.6A2 2 0 0 0 22 18L13.7 3.9a2 2 0 0 0-3.4 0z" />
                    </svg>
                  </span>
                  <div>{selected.cancelReason}</div>
                </div>
              )}
            </div>

            {selected.status === "pending" && (
              <div className="mb-2.5 flex gap-2.5">
                <button
                  disabled={busyIds.has(selected.id)}
                  onClick={() => handleConfirm(selected.id)}
                  className="dact"
                  style={{ background: "var(--color-primary-gradient)", color: "#fff", boxShadow: "0 8px 20px rgba(80,148,240,.3)" }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  Подтвердить
                </button>
                <button
                  disabled={busyIds.has(selected.id)}
                  onClick={() => setRejectFor(selected.id)}
                  className="dact"
                  style={{ border: "1px solid #D1D9E6", background: "rgba(255,255,255,.6)", color: "var(--color-text-secondary)" }}
                >
                  Отклонить
                </button>
              </div>
            )}

            {(selected.status === "pending" || selected.status === "confirmed") && (
              <div className="mb-2.5 flex gap-2.5">
                <button
                  disabled={busyIds.has(selected.id)}
                  onClick={() => openReschedule(selected)}
                  className="dact"
                  style={{ border: "1px solid #D1D9E6", background: "rgba(255,255,255,.6)", color: "var(--color-text-secondary)" }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4.5" width="18" height="16.5" rx="2.5" />
                    <path d="M3 9h18M8 2.5v4M16 2.5v4" />
                  </svg>
                  Перенести
                </button>
                {selected.status === "confirmed" && (
                  <button
                    disabled={busyIds.has(selected.id)}
                    onClick={() => setCancelFor(selected)}
                    className="dact"
                    style={{ border: "1px solid rgba(232,86,86,.35)", background: "var(--color-danger-bg)", color: "var(--color-danger)" }}
                  >
                    Отменить
                  </button>
                )}
              </div>
            )}

            <a
              href={`mailto:${selected.clientEmail}`}
              className="dact"
              style={{ border: "1px solid #D1D9E6", background: "rgba(255,255,255,.6)", color: "var(--color-text-secondary)" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
                <path d="M4 8h16M9 3v3M15 3v3" />
              </svg>
              Написать
            </a>
          </div>
        </div>
      )}

      {rescheduleFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5">
          <div onClick={() => setRescheduleFor(null)} className="absolute inset-0" style={{ background: "rgba(26,40,60,.4)", backdropFilter: "blur(3px)" }} />
          <div className="relative max-h-[86vh] w-[480px] max-w-full overflow-y-auto rounded-[22px] bg-white p-7 shadow-[0_30px_70px_rgba(20,40,70,.28)]">
            <div className="mb-1 text-xl font-bold text-(--color-ink)">Перенести встречу</div>
            <div className="mb-4.5 text-sm text-(--color-text-secondary-3)">
              {rescheduleFor.clientName} · {rescheduleFor.format?.name ?? "Формат"}. Клиент получит письмо с новым временем.
            </div>
            <CalendarPicker
              timezone={rescheduleFor.ownerTimezoneAtBooking}
              selectedDate={rescheduleDate}
              onSelectDate={handleSelectRescheduleDate}
            />
            {rescheduleDate && (
              <div className="mt-4">
                {rescheduleSlotsLoading ? (
                  <div className="py-4 text-center text-sm text-(--color-muted)">Загружаем свободное время…</div>
                ) : rescheduleSlots.length === 0 ? (
                  <div className="py-4 text-center text-sm text-(--color-muted)">Нет свободного времени на эту дату</div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {rescheduleSlots.map((slot) => {
                      const active = rescheduleSelectedSlot?.start === slot.start;
                      const time = new Intl.DateTimeFormat("ru-RU", {
                        timeZone: rescheduleFor.ownerTimezoneAtBooking,
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                      }).format(new Date(slot.start));
                      return (
                        <button
                          key={slot.start}
                          type="button"
                          onClick={() => setRescheduleSelectedSlot(slot)}
                          className="rounded-xl px-3 py-2.5 text-sm font-semibold"
                          style={
                            active
                              ? { background: "var(--color-primary-gradient)", color: "#fff" }
                              : { border: "1px solid #D1D9E6", background: "rgba(255,255,255,.6)", color: "var(--color-text-secondary)" }
                          }
                        >
                          {time}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            <div className="mt-5.5 flex gap-2.5">
              <button onClick={() => setRescheduleFor(null)} className="btn-secondary flex-1">
                Отмена
              </button>
              <button
                disabled={!rescheduleSelectedSlot || busyIds.has(rescheduleFor.id)}
                onClick={handleConfirmReschedule}
                className="btn-primary flex-1 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Перенести встречу
              </button>
            </div>
          </div>
        </div>
      )}

      {cancelFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5">
          <div onClick={() => setCancelFor(null)} className="absolute inset-0" style={{ background: "rgba(26,40,60,.4)", backdropFilter: "blur(3px)" }} />
          <div className="relative w-[440px] max-w-full rounded-[22px] bg-white p-7 shadow-[0_30px_70px_rgba(20,40,70,.28)]">
            <div
              className="mb-4.5 flex h-13 w-13 items-center justify-center rounded-2xl"
              style={{ background: "rgba(242,106,106,.12)", color: "#E15656" }}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 9v4M12 17h.01M10.3 3.9L2 18a2 2 0 0 0 1.7 3h16.6A2 2 0 0 0 22 18L13.7 3.9a2 2 0 0 0-3.4 0z" />
              </svg>
            </div>
            <div className="mb-2 text-xl font-bold text-(--color-ink)">Отменить встречу?</div>
            <div className="mb-4.5 text-sm text-(--color-text-secondary-3)">
              Клиент получит письмо об отмене. Это действие нельзя отменить.
            </div>
            <div className="mb-2 text-[13px] font-semibold text-(--color-ink)">Причина (увидит клиент, необязательно)</div>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Например: заболел, перенесём в другой раз"
              className="input-field mb-5 min-h-[80px] resize-y"
            />
            <div className="flex gap-2.5">
              <button
                onClick={() => {
                  setCancelFor(null);
                  setCancelReason("");
                }}
                className="btn-secondary flex-1"
              >
                Не отменять
              </button>
              <button
                disabled={busyIds.has(cancelFor.id)}
                onClick={() => handleCancel(cancelFor, cancelReason.trim())}
                className="flex-1 rounded-xl border-none px-4 py-3.5 text-sm font-semibold text-white"
                style={{ background: "#E15656", boxShadow: "0 8px 20px rgba(225,86,86,.3)" }}
              >
                Отменить встречу
              </button>
            </div>
          </div>
        </div>
      )}

      {rejectFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5">
          <div onClick={() => setRejectFor(null)} className="absolute inset-0" style={{ background: "rgba(26,40,60,.4)", backdropFilter: "blur(3px)" }} />
          <div className="relative w-[440px] max-w-full rounded-[22px] bg-white p-7 shadow-[0_30px_70px_rgba(20,40,70,.28)]">
            <div
              className="mb-4.5 flex h-13 w-13 items-center justify-center rounded-2xl"
              style={{ background: "rgba(242,106,106,.12)", color: "#E15656" }}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 9v4M12 17h.01M10.3 3.9L2 18a2 2 0 0 0 1.7 3h16.6A2 2 0 0 0 22 18L13.7 3.9a2 2 0 0 0-3.4 0z" />
              </svg>
            </div>
            <div className="mb-2 text-xl font-bold text-(--color-ink)">Отклонить встречу?</div>
            <div className="mb-4.5 text-sm text-(--color-text-secondary-3)">
              Клиент получит письмо об отклонении. Это действие нельзя отменить.
            </div>
            <div className="mb-2 text-[13px] font-semibold text-(--color-ink)">Причина (увидит клиент, необязательно)</div>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Например: не могу в это время, предложите другой слот"
              className="input-field mb-5 min-h-[80px] resize-y"
            />
            <div className="flex gap-2.5">
              <button
                onClick={() => {
                  setRejectFor(null);
                  setRejectReason("");
                }}
                className="btn-secondary flex-1"
              >
                Не отклонять
              </button>
              <button
                disabled={busyIds.has(rejectFor)}
                onClick={() => handleReject(rejectFor, rejectReason.trim())}
                className="flex-1 rounded-xl border-none px-4 py-3.5 text-sm font-semibold text-white"
                style={{ background: "#E15656", boxShadow: "0 8px 20px rgba(225,86,86,.3)" }}
              >
                Отклонить встречу
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div
          className="fixed bottom-6.5 left-1/2 z-60 flex -translate-x-1/2 items-center gap-2.5 rounded-2xl px-5 py-3.5 text-sm font-semibold text-white shadow-[0_16px_40px_rgba(20,40,70,.3)]"
          style={{ background: "#1A2733" }}
        >
          <span
            className="flex h-5 w-5 flex-none items-center justify-center rounded-full text-white"
            style={{ background: "var(--color-success-2)" }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </span>
          {toast}
        </div>
      )}
    </div>
  );
}
