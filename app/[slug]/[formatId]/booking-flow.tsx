"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { api, ApiError, type Booking, type PublicProfile, type TimeSlot, type VideoProvider } from "@/lib/api";
import { getAttribution } from "@/lib/attribution";
import { postToHost } from "@/lib/embed";
import { Avatar } from "../avatar";
import {
  AlertIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  GlobeIcon,
  RubleIcon,
  VideoIcon,
} from "../icons";
import {
  PROVIDER_LABELS,
  type PublicFormat,
  formatDuration,
  formatFullDateInTimezone,
  formatOwnerDateLabel,
  formatPrice,
  formatTimeInTimezone,
  formatTimezoneLabel,
  ownerTodayParts,
} from "../format-utils";
import { CalendarPicker } from "./calendar-picker";
import { FormatQuestions } from "./format-questions";
import { TimezonePicker } from "./timezone-picker";

type Step = "pick" | "form" | "payment" | "done";

interface BookingFlowProps {
  slug: string;
  profile: Pick<PublicProfile, "name" | "avatarUrl" | "timezone">;
  format: PublicFormat;
}

/** Every IANA zone the runtime knows, so a visitor anywhere can pick their own. The static
 * tail is a fallback for runtimes without Intl.supportedValuesOf, and the visitor's detected
 * zone is force-included so the select always has its own value to show. */
const TIMEZONE_OPTIONS: string[] = (() => {
  const intl = Intl as unknown as { supportedValuesOf?: (key: string) => string[] };
  const zones = intl.supportedValuesOf?.("timeZone") ?? [
    "Europe/Kaliningrad",
    "Europe/Moscow",
    "Europe/Samara",
    "Asia/Yekaterinburg",
    "Asia/Omsk",
    "Asia/Krasnoyarsk",
    "Asia/Irkutsk",
    "Asia/Yakutsk",
    "Asia/Vladivostok",
    "Asia/Magadan",
    "Asia/Kamchatka",
    "UTC",
  ];
  const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return detected && !zones.includes(detected) ? [detected, ...zones] : zones;
})();

const DIVIDER_CLASSES =
  "h-px w-full flex-none bg-[linear-gradient(90deg,transparent,rgba(20,30,45,.08)_16%,rgba(20,30,45,.08)_84%,transparent)] " +
  "min-[1080px]:h-auto min-[1080px]:w-px min-[1080px]:self-stretch min-[1080px]:bg-[linear-gradient(180deg,transparent,rgba(20,30,45,.08)_16%,rgba(20,30,45,.08)_84%,transparent)]";

export function BookingFlow({ slug, profile, format }: BookingFlowProps) {
  const [step, setStep] = useState<Step>("pick");
  const [selectedDate, setSelectedDate] = useState<string>(
    () => ownerTodayParts(Intl.DateTimeFormat().resolvedOptions().timeZone || profile.timezone).dateStr,
  );
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(true);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [conflictNotice, setConflictNotice] = useState(false);

  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientComment, setClientComment] = useState("");
  // Ответы на свои вопросы владельца, по ключу вопроса.
  const [answers, setAnswers] = useState<Record<string, string>>({});
  // The owner may offer several platforms; the API has already filtered the list down to the
  // ones they can actually deliver, so anything here is bookable. One entry = no choice to make.
  const [provider, setProvider] = useState<VideoProvider | null>(() => format.providers[0] ?? null);
  const [clientPhone, setClientPhone] = useState("");
  const offersPackage = !!(format.packageSize && format.packagePriceKopecks);
  const [purchase, setPurchase] = useState<"single" | "package">("single");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [booking, setBooking] = useState<Booking | null>(null);

  // Slot times are rendered in this zone (see formatTimeInTimezone calls below). It defaults
  // to the visitor's own zone and is theirs to change — the caption here used to print the
  // *owner's* zone while the times were already converted to the visitor's, so a client in
  // Vladivostok read Vladivostok times labelled "Moscow (GMT+3)".
  const [clientTimezone, setClientTimezone] = useState<string>(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Moscow",
  );
  const isPaid = format.priceKopecks > 0;

  // Prefill from the opening link (`?name=&email=&comment=`). An embedding site knows who
  // clicked — a landing page can pass the segment the visitor picked straight into the
  // comment, so nobody retypes it. Applied in an effect rather than in the useState
  // initialisers because those also run during SSR, where `window` does not exist and a
  // server-rendered "" would hydrate against a filled input.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const take = (key: string, max: number) => params.get(key)?.trim().slice(0, max) || undefined;

    const name = take("name", 120);
    const email = take("email", 200);
    const comment = take("comment", 2000);

    // Only ever fills an untouched field: a visitor who already typed must not have it
    // overwritten if this effect re-runs.
    if (name) setClientName((current) => current || name);
    if (email) setClientEmail((current) => current || email);
    if (comment) setClientComment((current) => current || comment);

    // Ответы предзаполняются как `?q_<key>=значение`. Карточка сегмента на лендинге тем самым
    // заранее отвечает за посетителя на вопрос, ответ на который она и так знает.
    const prefilled: Record<string, string> = {};
    params.forEach((value, name) => {
      if (!name.startsWith("q_")) return;
      const key = name.slice(2);
      const trimmed = value.trim().slice(0, 5000);
      if (key && trimmed) prefilled[key] = trimmed;
    });
    if (Object.keys(prefilled).length > 0) {
      setAnswers((current) => ({ ...prefilled, ...current }));
    }
  }, []);

  const fetchSlots = useCallback(
    async (date: string, tz: string) => {
      setSlotsLoading(true);
      setSlotsError(null);
      try {
        const data = await api.get<TimeSlot[]>(
          `/api/public/${encodeURIComponent(slug)}/${format.id}/slots?date=${date}&timezone=${encodeURIComponent(tz)}`,
        );
        setSlots(data);
      } catch {
        setSlotsError("Не удалось загрузить свободное время. Попробуйте ещё раз.");
      } finally {
        setSlotsLoading(false);
      }
    },
    [slug, format.id],
  );

  useEffect(() => {
    // Only the initial mount load goes through an effect — subsequent date changes call
    // fetchSlots directly from the click handler below, so this doesn't need `selectedDate`
    // in its dependency list.
    fetchSlots(selectedDate, clientTimezone);
    // Re-runs when the visitor switches zone: the same calendar date covers a different span
    // of real time, so the slot list has to be re-fetched, not just re-labelled.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientTimezone]);

  function handleSelectDate(date: string) {
    setConflictNotice(false);
    setSelectedSlot(null);
    setSelectedDate(date);
    fetchSlots(date, clientTimezone);
  }

  function handleGoToForm() {
    if (!selectedSlot) return;
    setStep("form");
  }

  function handleBackToPick() {
    setStep("pick");
    setSubmitError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!selectedSlot) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const created = await api.post<Booking>(`/api/public/${encodeURIComponent(slug)}/${format.id}/book`, {
        clientName,
        clientEmail,
        clientComment: clientComment.trim() ? clientComment.trim() : undefined,
        startAt: selectedSlot.start,
        clientTimezone,
        provider,
        clientPhone: provider === "phone" ? clientPhone.trim() : undefined,
        purchase: offersPackage ? purchase : undefined,
        utm: getAttribution(),
        answers: format.questions.length
          ? format.questions.map((q) => ({ key: q.key, value: answers[q.key] ?? "" }))
          : undefined,
      });
      setBooking(created);
      // Fired at creation, not at the "done" screen: a paid format redirects to the payment
      // provider on the next line and would otherwise never report anything to the host page.
      // So this means "a booking row now exists", which is exactly the funnel step the
      // embedding site counts — payment is a separate state it can read from the webhook.
      postToHost({ type: "booked", formatId: format.id, startAt: selectedSlot.start });
      // Paid booking → redirect to the provider's hosted checkout. After paying, the provider
      // returns the client to the booking page, which reflects the confirmed status.
      if (created.paymentUrl) {
        window.location.href = created.paymentUrl;
        return;
      }
      setStep(created.status !== "confirmed" && isPaid ? "payment" : "done");
    } catch (error) {
      // The backend closes the GET-slots/POST-book race two ways: a 409 from the narrow
      // window inside its advisory-locked transaction, or (far more often in practice) a
      // 400 "slot is no longer available" from its own up-front re-validation — both mean
      // the same thing to the visitor, so both re-open the picker instead of showing a
      // raw error.
      const isSlotGoneError =
        error instanceof ApiError && (error.status === 409 || (error.status === 400 && /больше недоступно/i.test(error.message)));
      if (isSlotGoneError) {
        setConflictNotice(true);
        setSelectedSlot(null);
        setStep("pick");
        fetchSlots(selectedDate, clientTimezone);
        return;
      }
      setSubmitError(
        error instanceof ApiError ? error.message : "Не удалось создать запись. Попробуйте ещё раз.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (step === "done" || step === "payment") {
    return (
      <div className="relative w-full max-w-[560px]">
        {step === "payment" ? (
          <PaymentGapCard format={format} booking={booking} clientTimezone={clientTimezone} />
        ) : (
          <DoneCard format={format} booking={booking} ownerName={profile.name} clientTimezone={clientTimezone} />
        )}
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-[1240px]">
      {/* The decorative hero-glass overlay that used to sit here was removed: the card is
          translucent, so it showed through the calendar and slot list as a second layer of
          swirls on top of the page's own aurora background. The booking screen keeps a flat
          background and one card. */}
      <div className="glass-card relative flex flex-col overflow-hidden !rounded-[32px] min-[1080px]:flex-row">
        <InfoColumn profile={profile} format={format} />
        <div className={DIVIDER_CLASSES} />

        {step === "pick" && (
          <>
            <div className="flex flex-1 flex-col p-6 min-[1080px]:p-10">
              <CalendarPicker
                timezone={clientTimezone}
                selectedDate={selectedDate}
                onSelectDate={handleSelectDate}
              />
              <div className="mt-8 min-[1080px]:mt-10">
                <TimezonePicker value={clientTimezone} onChange={setClientTimezone} />
              </div>
            </div>

            <div className={DIVIDER_CLASSES} />

            <div className="flex flex-col p-6 pt-0 min-[1080px]:w-[326px] min-[1080px]:flex-none min-[1080px]:p-10">
              <div className="mb-4 text-base font-semibold text-[var(--color-ink)] min-[1080px]:mb-5">
                {formatOwnerDateLabel(selectedDate)}
              </div>

              {conflictNotice && (
                <div className="mb-3 flex items-start gap-2.5 rounded-xl border px-3.5 py-3" style={{ background: "var(--color-danger-bg)", borderColor: "rgba(232,86,86,.28)" }}>
                  <AlertIcon className="mt-0.5 flex-none text-[var(--color-danger)]" />
                  <span className="text-[12.5px] leading-snug font-medium text-[var(--color-danger)]">
                    Это время только что заняли. Выберите другое.
                  </span>
                </div>
              )}

              <div className="flex flex-col gap-2">
                {slotsLoading ? (
                  <div className="py-6 text-center text-sm text-[var(--color-muted)]">Загрузка…</div>
                ) : slotsError ? (
                  <div className="py-6 text-center text-sm text-[var(--color-danger)]">{slotsError}</div>
                ) : slots.length === 0 ? (
                  <div className="py-6 text-center text-sm text-[var(--color-muted)]">
                    Нет свободного времени на эту дату
                  </div>
                ) : (
                  slots.map((slot) => {
                    const isSelected = selectedSlot?.start === slot.start;
                    return (
                      <button
                        key={slot.start}
                        type="button"
                        onClick={() => setSelectedSlot(slot)}
                        className="rounded-xl p-3.5 text-center text-[15px] font-semibold transition"
                        style={
                          isSelected
                            ? { background: "var(--color-primary-gradient)", color: "#fff", boxShadow: "0 6px 20px rgba(80,148,240,.35)" }
                            : { border: "1px solid rgba(255,255,255,.7)", background: "rgba(255,255,255,.5)", color: "var(--color-text-secondary)" }
                        }
                      >
                        {formatTimeInTimezone(slot.start, clientTimezone)}
                      </button>
                    );
                  })
                )}
              </div>

              <button
                type="button"
                onClick={handleGoToForm}
                disabled={!selectedSlot}
                className="btn-primary mt-6 w-full disabled:opacity-40"
              >
                Далее
                <ArrowRightIcon />
              </button>
            </div>
          </>
        )}

        {step === "form" && selectedSlot && (
          <div className="flex flex-1 flex-col p-6 min-[1080px]:p-10">
            <button
              type="button"
              onClick={handleBackToPick}
              className="mb-4 inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-[var(--color-link)]"
            >
              <ArrowLeftIcon />
              Изменить
            </button>

            <div className="mb-6 flex max-w-[520px] items-center gap-3 rounded-2xl px-4.5 py-3.5" style={{ background: "rgba(80,148,240,.08)", border: "1px solid rgba(80,148,240,.2)" }}>
              <CalendarIcon className="flex-none text-[var(--color-link)]" />
              <span className="text-[15px] font-semibold text-[var(--color-ink)]">
                {formatOwnerDateLabel(selectedDate)} · {formatTimeInTimezone(selectedSlot.start, clientTimezone)}
              </span>
            </div>

            <form onSubmit={handleSubmit} className="flex max-w-[520px] flex-col gap-4.5">
              <div>
                <label className="mb-2 block text-[13px] font-semibold text-[var(--color-ink)]" htmlFor="clientName">
                  Имя *
                </label>
                <input
                  id="clientName"
                  className="input-field"
                  placeholder="Как к вам обращаться"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-2 block text-[13px] font-semibold text-[var(--color-ink)]" htmlFor="clientEmail">
                  Email *
                </label>
                <input
                  id="clientEmail"
                  type="email"
                  className="input-field"
                  placeholder="you@example.com"
                  required
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-2 block text-[13px] font-semibold text-[var(--color-ink)]" htmlFor="clientComment">
                  Комментарий
                </label>
                <textarea
                  id="clientComment"
                  className="input-field min-h-[88px] resize-y leading-relaxed"
                  placeholder="Расскажите, что хотите обсудить — необязательно"
                  value={clientComment}
                  onChange={(e) => setClientComment(e.target.value)}
                />
              </div>

              <FormatQuestions
                questions={format.questions}
                values={answers}
                onChange={(key, value) => setAnswers((current) => ({ ...current, [key]: value }))}
              />

              {format.providers.length > 1 && (
                <div>
                  <label className="mb-2 block text-[13px] font-semibold text-[var(--color-ink)]" htmlFor="provider">
                    Где встречаемся
                  </label>
                  <select
                    id="provider"
                    className="input-field cursor-pointer"
                    value={provider ?? ""}
                    onChange={(e) => setProvider(e.target.value as VideoProvider)}
                  >
                    {format.providers.map((p) => (
                      <option key={p} value={p}>
                        {PROVIDER_LABELS[p]}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {provider === "phone" && (
                <div>
                  <label className="mb-2 block text-[13px] font-semibold text-[var(--color-ink)]" htmlFor="clientPhone">
                    Номер для звонка
                  </label>
                  <input
                    id="clientPhone"
                    type="tel"
                    className="input-field"
                    placeholder="+7 900 000-00-00"
                    required
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                  />
                </div>
              )}

              {offersPackage && (
                <div className="flex flex-col gap-2.5">
                  <button
                    type="button"
                    onClick={() => setPurchase("single")}
                    className="flex items-center justify-between rounded-xl px-4 py-3 text-left"
                    style={purchase === "single"
                      ? { background: "rgba(80,148,240,.1)", border: "1px solid rgba(80,148,240,.35)" }
                      : { background: "rgba(255,255,255,.6)", border: "1px solid #E3E9EF" }}
                  >
                    <span className="text-[14px] font-semibold text-[var(--color-ink)]">Одна встреча</span>
                    <span className="text-[14px] font-semibold text-[var(--color-ink)]">{formatPrice(format.priceKopecks)}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPurchase("package")}
                    className="flex items-center justify-between rounded-xl px-4 py-3 text-left"
                    style={purchase === "package"
                      ? { background: "rgba(80,148,240,.1)", border: "1px solid rgba(80,148,240,.35)" }
                      : { background: "rgba(255,255,255,.6)", border: "1px solid #E3E9EF" }}
                  >
                    <span>
                      <span className="block text-[14px] font-semibold text-[var(--color-ink)]">Пакет {format.packageSize} встреч</span>
                      <span className="block text-[12.5px] text-[var(--color-muted)]">Записывайтесь на удобные слоты, остаток спишется сам</span>
                    </span>
                    <span className="text-[14px] font-semibold text-[var(--color-ink)]">{formatPrice(format.packagePriceKopecks!)}</span>
                  </button>
                </div>
              )}

              {submitError && <div className="text-sm font-medium text-[var(--color-danger)]">{submitError}</div>}

              <button type="submit" disabled={submitting} className="btn-primary w-full">
                {submitting
                  ? "Отправляем…"
                  : offersPackage && purchase === "package"
                    ? `Купить пакет • ${formatPrice(format.packagePriceKopecks!)}`
                    : isPaid
                      ? `Перейти к оплате • ${formatPrice(format.priceKopecks)}`
                      : "Записаться"}
              </button>
              <div className="text-center text-[13px] text-[var(--color-muted)]">Подтверждение придёт на почту</div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoColumn({
  profile,
  format,
}: {
  profile: Pick<PublicProfile, "name" | "avatarUrl">;
  format: PublicFormat;
}) {
  return (
    <div className="flex-none p-7 min-[1080px]:w-[372px] min-[1080px]:p-10">
      <div className="mb-8 flex items-center gap-4">
        <Avatar name={profile.name} avatarUrl={profile.avatarUrl} size={56} />
        <div className="text-base font-bold text-[var(--color-ink)]">{profile.name ?? "Специалист"}</div>
      </div>
      <div className="mb-7 text-2xl leading-tight font-bold tracking-tight text-[var(--color-ink)]">{format.name}</div>
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-3.5 text-[15px] font-medium text-[var(--color-text-secondary)]">
          <ClockIcon className="text-[var(--color-muted)]" />
          {formatDuration(format.durationMin)}
        </div>
        <div className="flex items-center gap-3.5 text-[15px] font-medium text-[var(--color-text-secondary)]">
          <VideoIcon className="text-[var(--color-muted)]" />
          {format.providers.map((p) => PROVIDER_LABELS[p]).join(" · ") || "Площадка не указана"}
        </div>
        <div className="flex items-center gap-3.5 text-[15px] font-medium text-[var(--color-text-secondary)]">
          <RubleIcon className="text-[var(--color-muted)]" />
          {formatPrice(format.priceKopecks)}
        </div>
        {format.type === "group" && format.seats && (
          <div className="text-[13px] text-[var(--color-muted)]">Мест: до {format.seats}</div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  format,
  booking,
  clientTimezone,
}: {
  format: PublicFormat;
  booking: Booking;
  clientTimezone: string;
}) {
  return (
    <div className="mb-6 rounded-[18px] p-5.5 text-left" style={{ background: "rgba(255,255,255,.6)", border: "1px solid rgba(255,255,255,.7)" }}>
      <div className="mb-4.5 flex items-center gap-2.5">
        <div className="h-2 w-2 flex-none rounded-full" style={{ background: format.color }} />
        <div className="text-[17px] font-bold text-[var(--color-ink)]">{format.name}</div>
      </div>
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3 text-sm font-medium text-[var(--color-text-secondary)]">
          <CalendarIcon size={18} className="flex-none text-[var(--color-muted)]" />
          {formatFullDateInTimezone(booking.startAt, clientTimezone)} ·{" "}
          {formatTimeInTimezone(booking.startAt, clientTimezone)} — {formatTimeInTimezone(booking.endAt, clientTimezone)}
        </div>
        <div className="flex items-center gap-3 text-sm font-medium text-[var(--color-text-secondary)]">
          <ClockIcon size={18} className="flex-none text-[var(--color-muted)]" />
          {formatDuration(format.durationMin)} · {clientTimezone}
        </div>
        {booking.channelLink && (
          <div className="flex items-center gap-3 text-sm font-medium text-[var(--color-text-secondary)]">
            <VideoIcon size={18} className="flex-none text-[var(--color-muted)]" />
            <a href={booking.channelLink} target="_blank" rel="noopener noreferrer">
              Ссылка на встречу
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

function DoneCard({
  format,
  booking,
  ownerName,
  clientTimezone,
}: {
  format: PublicFormat;
  booking: Booking | null;
  ownerName: string | null;
  clientTimezone: string;
}) {
  if (!booking) return null;
  const isPendingConfirmation = booking.status === "pending";

  return (
    <div className="glass-card p-10 text-center">
      <div
        className="mx-auto mb-5.5 flex h-[76px] w-[76px] items-center justify-center rounded-full"
        style={{
          background: isPendingConfirmation ? "var(--color-warning-bg)" : "linear-gradient(135deg,#4FD6A0,#3FCB6E)",
          boxShadow: isPendingConfirmation ? undefined : "0 12px 28px rgba(63,203,110,.4)",
        }}
      >
        {isPendingConfirmation ? (
          <ClockIcon size={34} className="text-[var(--color-warning)]" />
        ) : (
          <CheckCircleIcon />
        )}
      </div>
      <div className="mb-2 text-[26px] font-bold text-[var(--color-ink)]">
        {isPendingConfirmation ? "Заявка отправлена" : "Вы записаны!"}
      </div>
      <div className="mb-7 text-[15px] text-[var(--color-muted)]">
        {isPendingConfirmation
          ? `Ждём подтверждения от ${ownerName ?? "специалиста"}. Мы напишем на почту, как только он подтвердит.`
          : "Подтверждение отправлено на почту"}
      </div>

      <SummaryCard format={format} booking={booking} clientTimezone={clientTimezone} />

      <div className="text-[13.5px] font-medium text-[var(--color-muted)]">
        Планы изменились?{" "}
        <Link href={`/booking/${booking.publicToken}`} className="font-semibold">
          Управление записью
        </Link>
      </div>

      <SignupCta defaultEmail={booking.clientEmail} />
    </div>
  );
}

/** The booking page's only ask of the client: they have just seen the product work end to end,
 * which is the one moment they are most likely to want it themselves. The email is prefilled
 * from the booking so the offer is one click, and it is carried to the landing's signup modal
 * rather than posted here — account creation belongs to one flow, not two. */
function SignupCta({ defaultEmail }: { defaultEmail: string }) {
  const [email, setEmail] = useState(defaultEmail);

  return (
    <div
      className="mt-8 rounded-2xl p-6 text-left"
      style={{ background: "rgba(80,148,240,.06)", border: "1px solid rgba(80,148,240,.16)" }}
    >
      <div className="mb-4 text-[19px] font-bold leading-snug text-[var(--color-ink)]">
        Зарегистрируйтесь в Slotix, чтобы получить такой же сервис для бронирования встреч. Это бесплатно.
      </div>
      <form
        className="flex flex-col gap-2.5 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          window.location.href = `/?signup=${encodeURIComponent(email.trim())}`;
        }}
      >
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Ваша почта"
          aria-label="Электронная почта"
          className="input-field flex-1"
        />
        <button type="submit" className="btn-primary whitespace-nowrap">
          Попробовать бесплатно
        </button>
      </form>
    </div>
  );
}

function PaymentGapCard({
  format,
  booking,
  clientTimezone,
}: {
  format: PublicFormat;
  booking: Booking | null;
  clientTimezone: string;
}) {
  if (!booking) return null;

  return (
    <div className="glass-card p-10 text-center">
      <div
        className="mx-auto mb-5.5 flex h-[76px] w-[76px] items-center justify-center rounded-full"
        style={{ background: "var(--color-warning-bg)" }}
      >
        <RubleIcon size={34} className="text-[var(--color-warning)]" />
      </div>
      <div className="mb-2 text-[26px] font-bold text-[var(--color-ink)]">Ждём оплату</div>
      <p className="mb-7 text-sm leading-relaxed text-[var(--color-muted)]">
        Тестовый платёж — в реальной версии здесь будет ЮKassa. Время удержано, но эта демо-сборка
        пока не может завершить оплату онлайн — итоговый статус брони уточните у специалиста.
      </p>

      <SummaryCard format={format} booking={booking} clientTimezone={clientTimezone} />

      <Link href={`/booking/${booking.publicToken}`} className="btn-secondary inline-flex w-full justify-center">
        Управление записью
      </Link>
    </div>
  );
}
