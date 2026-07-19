"use client";

import { useState } from "react";
import { AuthModal } from "@/components/auth-modal";

type ModalState = { open: boolean; mode: "login" | "signup"; email: string };

const FEATURES = [
  {
    color: "rgba(80,148,240,.14)",
    iconColor: "#3B7FD9",
    title: "Одна ссылка вместо переписок",
    text: "Отправьте ссылку в мессенджер, соцсеть или подпись письма. Клиент видит только свободные слоты и бронирует сам.",
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1.5 1.5" />
        <path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1.5-1.5" />
      </svg>
    ),
  },
  {
    color: "rgba(63,203,110,.15)",
    iconColor: "#2FA85A",
    title: "Вы управляете расписанием",
    text: "Рабочие часы, перерывы между встречами и правила отмены — всё под вашим контролем.",
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4.5" width="18" height="16.5" rx="2.5" />
        <path d="M3 9h18M8 2.5v4M16 2.5v4" />
        <path d="M8 14h3M8 17.5h6" />
      </svg>
    ),
  },
  {
    color: "rgba(147,120,236,.15)",
    iconColor: "#7B5CE0",
    title: "Без накладок в календаре",
    text: "Свободные слоты рассчитываются по вашему Google Календарю — двойных броней не будет.",
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <path d="M22 4L12 14.01l-3-3" />
      </svg>
    ),
  },
];

const BULLETS = [
  { title: "Клиенту не нужна регистрация", text: "Для записи достаточно указать email — никаких аккаунтов и паролей." },
  { title: "Уведомления и напоминания", text: "Вам и клиенту приходит подтверждение, а встреча сразу добавляется в календари." },
  { title: "Оплата сразу при бронировании", text: "Подключите приём платежей и получайте оплату онлайн в момент записи." },
];

const CAL_WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const CAL_AVAILABLE = [10, 11, 17, 18, 22, 23, 24, 29, 30, 31];
const CAL_SELECTED = 17;

const INTEGRATIONS = [
  {
    tags: ["Zoom", "Google Meet", "Телемост"],
    title: "Встречи в Zoom, Meet и Телемост",
    text: "После брони конференция создаётся автоматически, а клиент получает напоминание, где связаться с вами.",
  },
  {
    tags: ["Google Календарь"],
    title: "Подключите Google Календарь",
    text: "Встречи автоматически появляются в вашем календаре и в календаре клиента.",
  },
  {
    tags: ["ЮKassa", "Stripe"],
    title: "Принимайте оплату сразу",
    text: "Подключите платёжный сервис и получайте оплату от клиентов онлайн при бронировании.",
  },
];

const WHY_CARDS = [
  {
    color: "rgba(63,203,110,.15)",
    iconColor: "#2FA85A",
    badge: "Ноль потерянных клиентов",
    badgeColor: "#2FA85A",
    title: "Следующая встреча назначается сама",
    text: "Если в конспекте есть «созвониться через две недели» — там же появляется кнопка записи. Клиент бронирует в один тап, вы не пишете «ну что, когда удобно?».",
    footer: "Каждая встреча приводит следующую.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 2l4 4-4 4" />
        <path d="M3 11V9a4 4 0 0 1 4-4h14" />
        <path d="M7 22l-4-4 4-4" />
        <path d="M21 13v2a4 4 0 0 1-4 4H3" />
      </svg>
    ),
  },
  {
    color: "rgba(80,148,240,.14)",
    iconColor: "#3B7FD9",
    badge: "Там, где ваши клиенты",
    badgeColor: "#2F6FD0",
    title: "Напоминания в Telegram, а не в спаме",
    text: "Подтверждения, напоминания и конспекты приходят туда, где человек их точно увидит. С кнопками «Перенести» и «Записаться снова» прямо в сообщении.",
    footer: "Меньше неявок — клиенту не нужно открывать почту.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 2L11 13" />
        <path d="M22 2l-7 20-4-9-9-4z" />
      </svg>
    ),
  },
  {
    color: "rgba(123,92,224,.14)",
    iconColor: "#7B5CE0",
    badge: "Для тех, кто работает курсом",
    badgeColor: "#7B5CE0",
    title: "Продавайте встречи сразу пакетом",
    text: "Клиент оплачивает пакет и сам записывается на удобные слоты — остаток списывается автоматически. Для репетиторов, коучей и всех, кто ведёт клиента вдолгую.",
    footer: "Предоплаченный клиент возвращается, а не «подумает».",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l9 5-9 5-9-5z" />
        <path d="M3 12l9 5 9-5" />
        <path d="M3 17l9 5 9-5" />
      </svg>
    ),
  },
  {
    color: "rgba(63,203,110,.15)",
    iconColor: "#2FA85A",
    badge: "Сделано для рунета",
    badgeColor: "#2FA85A",
    title: "Телемост, ЮKassa и письма, которые доходят",
    text: "Автоссылка на Яндекс Телемост, Google Meet или Zoom при записи. Оплата российскими картами через ЮKassa. Уведомления, которые не улетают в спам на mail.ru и Яндексе.",
    footer: "То, что зарубежные Calendly не сделают.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1.5 1.5" />
        <path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1.5-1.5" />
      </svg>
    ),
  },
];

export default function Home() {
  const [modal, setModal] = useState<ModalState>({ open: false, mode: "login", email: "" });
  const [heroEmail, setHeroEmail] = useState("");
  const [ctaEmail, setCtaEmail] = useState("");

  const openLogin = () => setModal({ open: true, mode: "login", email: "" });
  const openSignup = (email: string) => setModal({ open: true, mode: "signup", email });
  const closeModal = () => setModal((m) => ({ ...m, open: false }));

  return (
    <div className="flex-1 overflow-x-hidden">
      {/* NAV */}
      <div
        className="sticky top-0 z-50 border-b"
        style={{
          background: "rgba(234,242,251,.55)",
          backdropFilter: "blur(20px) saturate(1.3)",
          WebkitBackdropFilter: "blur(20px) saturate(1.3)",
          borderColor: "rgba(255,255,255,.5)",
        }}
      >
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-5 px-[clamp(20px,5vw,40px)] py-4">
          <a href="#top" className="flex items-center">
            <img src="/slotix/slotix-logo.png" alt="Slotix" className="block h-[30px] w-auto" />
          </a>
          <div className="flex items-center gap-[clamp(14px,2.4vw,34px)]">
            <a href="#features" className="hidden md:inline text-[15px] font-semibold text-[var(--color-text-secondary)]">
              Возможности
            </a>
            <a href="#integrations" className="hidden md:inline text-[15px] font-semibold text-[var(--color-text-secondary)]">
              Интеграции
            </a>
            <a href="#pricing" className="hidden md:inline text-[15px] font-semibold text-[var(--color-text-secondary)]">
              Тарифы
            </a>
            <button type="button" onClick={openLogin} className="text-[15px] font-semibold text-[var(--color-ink)] cursor-pointer">
              Вход
            </button>
            <button type="button" onClick={() => openSignup("")} className="btn-primary text-[14px] px-5 py-[10px]">
              Регистрация
            </button>
          </div>
        </div>
      </div>

      {/* HERO */}
      <div id="top" className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-[clamp(36px,5vw,64px)] px-[clamp(20px,5vw,40px)] py-[clamp(48px,7vw,96px)]">
        <div className="min-w-[320px] flex-1 basis-[420px]">
          <div
            className="mb-[26px] inline-flex items-center gap-2 rounded-full px-[14px] py-[7px] text-[13px] font-semibold"
            style={{
              background: "rgba(255,255,255,.6)",
              border: "1px solid rgba(255,255,255,.7)",
              boxShadow: "0 4px 14px rgba(20,40,70,.05)",
              color: "var(--color-link)",
            }}
          >
            <span
              className="h-[7px] w-[7px] rounded-full"
              style={{ background: "var(--color-success-2)", boxShadow: "0 0 0 3px rgba(63,203,110,.2)" }}
            />
            Планирование встреч без переписок
          </div>
          <h1
            className="m-0 mb-[22px] font-extrabold text-[var(--color-ink)]"
            style={{ font: "800 clamp(34px,4.6vw,56px)/1.06 var(--font-golos)", letterSpacing: "-.02em", textWrap: "balance" }}
          >
            Slotix помогает
            <br />
            планировать встречи
            <br />
            без долгих переписок
          </h1>
          <p
            className="m-0 mb-8 max-w-[480px] text-[var(--color-text-secondary-2)]"
            style={{ font: "400 clamp(16px,1.4vw,19px)/1.55 var(--font-golos)" }}
          >
            Клиент открывает вашу ссылку, сам выбирает свободный слот и бронирует встречу. Никаких «а когда тебе
            удобно?» в мессенджерах.
          </p>

          <form
            className="flex max-w-[520px] flex-wrap gap-[10px]"
            onSubmit={(e) => {
              e.preventDefault();
              openSignup(heroEmail);
            }}
          >
            <input
              type="email"
              required
              placeholder="Введите ваш e-mail"
              value={heroEmail}
              onChange={(e) => setHeroEmail(e.target.value)}
              className="input-field min-w-0 flex-1 basis-[220px]"
              style={{ padding: "16px 18px", border: "1px solid rgba(255,255,255,.75)", background: "rgba(255,255,255,.7)" }}
            />
            <button type="submit" className="btn-primary flex-none px-[26px] py-4 text-[16px]">
              Начать бесплатно
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>
          </form>
          <div className="mt-4 flex items-center gap-2 text-[14px] font-medium text-[var(--color-muted)]">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--color-success-2)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
            Бесплатно. Привязка карты не требуется.
          </div>
        </div>

        {/* Hero visual — chat mockup */}
        <div className="relative flex min-w-[320px] flex-1 basis-[400px] justify-center">
          <div className="relative w-full max-w-[440px]">
            <div className="glass-card relative" style={{ padding: "26px 22px 30px" }}>
              <div
                className="mb-5 flex items-center gap-[11px] border-b pb-[18px]"
                style={{ borderColor: "rgba(20,30,45,.07)" }}
              >
                <div
                  className="flex h-10 w-10 flex-none items-center justify-center rounded-full font-bold text-white"
                  style={{ background: "linear-gradient(135deg,#CBD8EA,#9BB4D6)" }}
                >
                  М
                </div>
                <div>
                  <div className="text-[15px] font-bold text-[var(--color-ink)]">Марина</div>
                  <div className="text-[12px] text-[var(--color-muted)]">в сети</div>
                </div>
              </div>
              <div className="flex flex-col gap-[9px]">
                <ChatBubble>Привет! Давай встретимся на этой неделе, ты когда свободен?</ChatBubble>
                <ChatBubble mine>Привет! Есть время завтра :)</ChatBubble>
                <ChatBubble>А в котором часу?</ChatBubble>
                <ChatBubble mine>14:00 и 15:00, тебе когда удобно?</ChatBubble>
                <ChatBubble>Не смогу, обедаю с коллегами(</ChatBubble>
                <ChatBubble mine>Тогда среда с 17 до 20, подойдёт?</ChatBubble>
                <ChatBubble>Нет… В среду работаю допоздна :(</ChatBubble>
                <div
                  className="flex w-fit items-center gap-[5px] rounded-[18px] rounded-bl-[5px] px-4 py-[14px]"
                  style={{ background: "rgba(120,132,148,.14)" }}
                >
                  <span className="h-[7px] w-[7px] animate-pulse rounded-full" style={{ background: "var(--color-muted)" }} />
                  <span className="h-[7px] w-[7px] animate-pulse rounded-full" style={{ background: "var(--color-muted)" }} />
                  <span className="h-[7px] w-[7px] animate-pulse rounded-full" style={{ background: "var(--color-muted)" }} />
                </div>
              </div>
            </div>

            <div
              className="absolute -bottom-[38px] left-[-6%] flex w-[88%] items-center gap-[14px] rounded-[20px] px-[18px] py-4"
              style={{
                background: "rgba(255,255,255,.82)",
                backdropFilter: "blur(26px) saturate(1.5)",
                WebkitBackdropFilter: "blur(26px) saturate(1.5)",
                border: "1px solid rgba(255,255,255,.8)",
                boxShadow: "0 20px 46px rgba(20,40,70,.16)",
              }}
            >
              <div
                className="flex h-11 w-11 flex-none items-center justify-center rounded-xl"
                style={{ background: "var(--color-primary-gradient)", boxShadow: "0 8px 18px rgba(80,148,240,.35)" }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4.5" width="18" height="16.5" rx="2.5" />
                  <path d="M3 9h18M8 2.5v4M16 2.5v4M9 14l2 2 4-4" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="text-[15px] font-bold text-[var(--color-ink)]">С Slotix — 1 клик</div>
                <div className="text-[13px] text-[var(--color-muted)]">Клиент сам выбрал слот. Встреча в календаре.</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FEATURES */}
      <div id="features" className="mx-auto max-w-[1200px] px-[clamp(20px,5vw,40px)] py-[clamp(40px,6vw,80px)]">
        <div className="mx-auto mb-[clamp(36px,4vw,52px)] max-w-[640px] text-center">
          <div className="mb-3 text-[13px] font-bold uppercase tracking-[.08em]" style={{ color: "var(--color-primary)" }}>
            Как это работает
          </div>
          <h2
            className="m-0 font-extrabold text-[var(--color-ink)]"
            style={{ font: "800 clamp(28px,3.4vw,40px)/1.12 var(--font-golos)", letterSpacing: "-.015em" }}
          >
            Клиенту нужна только ссылка, чтобы записаться
          </h2>
        </div>
        <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))" }}>
          {FEATURES.map((f) => (
            <div key={f.title} className="glass-card" style={{ padding: "30px 28px" }}>
              <div
                className="mb-[22px] flex h-[52px] w-[52px] items-center justify-center rounded-[15px]"
                style={{ background: f.color, color: f.iconColor }}
              >
                {f.icon}
              </div>
              <div className="mb-[10px] text-[19px] font-bold text-[var(--color-ink)]">{f.title}</div>
              <div className="text-[15px] leading-[1.55] text-[var(--color-text-secondary-2)]">{f.text}</div>
            </div>
          ))}
        </div>
      </div>

      {/* PRODUCT PREVIEW */}
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-[clamp(36px,5vw,64px)] px-[clamp(20px,5vw,40px)] py-[clamp(20px,3vw,40px)] pb-[clamp(40px,6vw,80px)]">
        <div className="min-w-[300px] flex-1 basis-[340px]">
          <h2
            className="m-0 mb-6 font-extrabold text-[var(--color-ink)]"
            style={{ font: "800 clamp(26px,3vw,36px)/1.14 var(--font-golos)", letterSpacing: "-.015em" }}
          >
            Вы управляете расписанием — Slotix делает остальное
          </h2>
          <div className="flex flex-col gap-5">
            {BULLETS.map((b) => (
              <div key={b.title} className="flex gap-[14px]">
                <span
                  className="mt-[2px] flex h-[26px] w-[26px] flex-none items-center justify-center rounded-full"
                  style={{ background: "var(--color-success-bg)" }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </span>
                <div>
                  <div className="mb-1 text-[16px] font-bold text-[var(--color-ink)]">{b.title}</div>
                  <div className="text-[15px] leading-[1.5] text-[var(--color-text-secondary-2)]">{b.text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex min-w-[300px] flex-1 basis-[380px] justify-center">
          <div className="glass-card w-full max-w-[440px]" style={{ padding: 28 }}>
            <div className="mb-5 flex items-center justify-between">
              <div className="text-[17px] font-bold text-[var(--color-ink)]">Июль 2026</div>
              <div className="flex gap-2">
                <CalArrow direction="left" />
                <CalArrow direction="right" />
              </div>
            </div>
            <div className="grid gap-[6px]" style={{ gridTemplateColumns: "repeat(7,1fr)" }}>
              {CAL_WEEKDAYS.map((w) => (
                <div key={w} className="pb-1 text-center text-[11px] text-[var(--color-muted)]">
                  {w}
                </div>
              ))}
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={`blank-${i}`} className="h-[38px]" />
              ))}
              {Array.from({ length: 31 }).map((_, i) => {
                const n = i + 1;
                const isSelected = n === CAL_SELECTED;
                const isAvailable = CAL_AVAILABLE.includes(n);
                return (
                  <div
                    key={n}
                    className="flex h-[38px] items-center justify-center rounded-full text-[14px] font-medium"
                    style={
                      isSelected
                        ? { background: "var(--color-primary-gradient)", color: "#fff", boxShadow: "0 6px 16px rgba(80,148,240,.35)" }
                        : isAvailable
                          ? { background: "var(--color-info-bg)", color: "var(--color-link)", cursor: "pointer" }
                          : { color: "var(--color-faint-2)" }
                    }
                  >
                    {n}
                  </div>
                );
              })}
            </div>
            <div
              className="mt-5 flex items-center gap-[10px] rounded-xl px-[15px] py-[13px]"
              style={{ background: "rgba(255,255,255,.72)", border: "1px solid rgba(255,255,255,.7)", boxShadow: "0 2px 8px rgba(20,40,70,.05)" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-muted)" strokeWidth="2">
                <circle cx="12" cy="12" r="9" />
                <path d="M3 12h18" />
                <path d="M12 3a15 15 0 0 1 0 18a15 15 0 0 1 0-18" />
              </svg>
              <span className="text-[14px] font-medium text-[var(--color-ink)]">Москва (GMT+3)</span>
            </div>
          </div>
        </div>
      </div>

      {/* WHY SLOTIX */}
      <div id="why" className="mx-auto max-w-[1200px] px-[clamp(20px,5vw,40px)] py-[clamp(40px,6vw,80px)]">
        <div className="mx-auto mb-[clamp(36px,4vw,52px)] max-w-[680px] text-center">
          <div className="mb-3 text-[13px] font-bold uppercase tracking-[.08em]" style={{ color: "var(--color-primary)" }}>
            Почему Slotix, а не просто календарь
          </div>
          <h2
            className="m-0 mb-4 font-extrabold text-[var(--color-ink)]"
            style={{ font: "800 clamp(28px,3.4vw,42px)/1.1 var(--font-golos)", letterSpacing: "-.02em", textWrap: "balance" }}
          >
            Встреча не заканчивается, когда вы кладёте трубку
          </h2>
          <p
            className="mx-auto m-0 max-w-[560px] text-[var(--color-text-secondary-2)]"
            style={{ font: "400 clamp(16px,1.4vw,19px)/1.55 var(--font-golos)" }}
          >
            Slotix ведёт клиента от записи до результата — и возвращает его на следующую встречу.
          </p>
        </div>

        {/* Hero card — AI summary */}
        <div
          className="glass-card mb-5 flex flex-wrap items-center gap-[clamp(32px,4vw,56px)] overflow-hidden"
          style={{ padding: "clamp(30px,4vw,48px)", borderRadius: 30 }}
        >
          <div className="min-w-[300px] flex-1 basis-[380px]">
            <div
              className="mb-5 inline-flex items-center gap-[9px] rounded-full px-[15px] py-2 text-[13px] font-bold"
              style={{ background: "rgba(123,92,224,.13)", color: "#7B5CE0" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3l1.9 4.6L18.5 9.5 13.9 11.4 12 16l-1.9-4.6L5.5 9.5l4.6-1.9z" />
                <path d="M19 15l.7 1.8 1.8.7-1.8.7L19 20l-.7-1.8-1.8-.7 1.8-.7z" />
              </svg>
              AI-конспект
            </div>
            <h3
              className="m-0 mb-4 font-extrabold text-[var(--color-ink)]"
              style={{ font: "800 clamp(24px,2.8vw,34px)/1.12 var(--font-golos)", letterSpacing: "-.015em", textWrap: "balance" }}
            >
              Не ведите заметки — просто проведите встречу
            </h3>
            <p
              className="m-0 mb-5 max-w-[480px] text-[var(--color-text-secondary-2)]"
              style={{ font: "400 clamp(15px,1.3vw,17px)/1.6 var(--font-golos)", textWrap: "pretty" }}
            >
              Бот подключается к звонку, слушает и присылает готовый конспект с задачами и договорённостями. Вам и
              клиенту — сразу после встречи, на почту и в Telegram.
            </p>
            <div
              className="mb-[26px] flex items-start gap-[9px] border-t pt-[18px]"
              style={{ borderColor: "rgba(20,30,45,.08)" }}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#7B5CE0" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="mt-[1px] flex-none">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
              <span className="text-[14px] font-semibold leading-[1.4]" style={{ color: "#4A5560" }}>
                Вы вспоминаете, о чём договорились, не пересматривая часовую запись.
              </span>
            </div>
            <button
              type="button"
              onClick={() => openSignup("")}
              className="inline-flex cursor-pointer items-center gap-[9px] rounded-2xl px-6 py-[14px] text-[15px] font-bold text-white"
              style={{ background: "linear-gradient(135deg,#8E6FE8,#7B5CE0)", boxShadow: "0 12px 28px rgba(123,92,224,.34)" }}
            >
              Зарегистрироваться
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>
          </div>

          <div className="flex min-w-[300px] flex-1 basis-[360px] justify-center">
            <div
              className="w-full max-w-[400px] rounded-[24px] px-[22px] py-6"
              style={{
                background: "rgba(255,255,255,.72)",
                backdropFilter: "blur(24px) saturate(1.4)",
                WebkitBackdropFilter: "blur(24px) saturate(1.4)",
                border: "1px solid rgba(255,255,255,.75)",
                boxShadow: "0 20px 48px rgba(20,40,70,.13)",
              }}
            >
              <div className="mb-4 flex items-center gap-[11px] border-b pb-4" style={{ borderColor: "rgba(20,30,45,.07)" }}>
                <div
                  className="flex h-10 w-10 flex-none items-center justify-center rounded-xl"
                  style={{ background: "linear-gradient(135deg,#8E6FE8,#7B5CE0)", boxShadow: "0 8px 18px rgba(123,92,224,.32)" }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 3l1.9 4.6L18.5 9.5 13.9 11.4 12 16l-1.9-4.6L5.5 9.5l4.6-1.9z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="text-[15px] font-bold text-[var(--color-ink)]">Конспект встречи</div>
                  <div className="text-[12px] text-[var(--color-muted)]">Консультация · сегодня, 14:00</div>
                </div>
              </div>
              <div className="mb-[9px] text-[11px] font-bold uppercase tracking-[.06em] text-[var(--color-muted)]">
                Договорённости
              </div>
              <div className="mb-[18px] flex flex-col gap-2">
                <SummaryPoint>Клиент присылает бриф до пятницы</SummaryPoint>
                <SummaryPoint>Готовлю смету на 3 варианта</SummaryPoint>
              </div>
              <div
                className="flex items-center gap-3 rounded-2xl px-[15px] py-[14px]"
                style={{ background: "var(--color-info-bg)", border: "1px solid rgba(80,148,240,.2)" }}
              >
                <div className="flex-1">
                  <div className="mb-[2px] text-[13px] font-bold" style={{ color: "var(--color-link)" }}>
                    Созвониться через 2 недели
                  </div>
                  <div className="text-[12px] text-[var(--color-text-secondary-2)]">Slotix предложит слот автоматически</div>
                </div>
                <span
                  className="flex-none rounded-[10px] px-[15px] py-[9px] text-[13px] font-bold text-white"
                  style={{ background: "var(--color-primary-gradient)", boxShadow: "0 6px 16px rgba(80,148,240,.34)" }}
                >
                  Записаться
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 4 equal cards */}
        <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))" }}>
          {WHY_CARDS.map((c) => (
            <div key={c.title} className="glass-card flex flex-col" style={{ padding: "28px 26px" }}>
              <div
                className="mb-[18px] flex h-12 w-12 items-center justify-center rounded-2xl"
                style={{ background: c.color, color: c.iconColor }}
              >
                {c.icon}
              </div>
              <span
                className="mb-[14px] self-start rounded-full px-[13px] py-[6px] text-[12px] font-bold"
                style={{ background: c.color, color: c.badgeColor }}
              >
                {c.badge}
              </span>
              <div className="mb-[10px] text-[19px] font-bold text-[var(--color-ink)]">{c.title}</div>
              <div className="flex-1 text-[14.5px] leading-[1.55] text-[var(--color-text-secondary-2)]">{c.text}</div>
              <div
                className="mt-[18px] flex items-center gap-2 border-t pt-[15px] text-[13px] font-semibold"
                style={{ borderColor: "rgba(20,30,45,.07)", color: c.badgeColor }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className="flex-none">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
                {c.footer}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* INTEGRATIONS */}
      <div id="integrations" className="mx-auto max-w-[1200px] px-[clamp(20px,5vw,40px)] py-[clamp(40px,6vw,80px)]">
        <h2
          className="m-0 mb-[clamp(32px,4vw,48px)] max-w-[640px] font-extrabold text-[var(--color-ink)]"
          style={{ font: "800 clamp(28px,3.4vw,42px)/1.1 var(--font-golos)", letterSpacing: "-.02em" }}
        >
          Работает с календарём, видеосвязью и другими сервисами
        </h2>
        <div className="grid gap-[clamp(20px,3vw,40px)]" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))" }}>
          {INTEGRATIONS.map((g) => (
            <div key={g.title}>
              <div className="mb-5 flex flex-wrap gap-2">
                {g.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full px-[15px] py-2 text-[14px] font-semibold text-[var(--color-text-secondary)]"
                    style={{ background: "rgba(255,255,255,.62)", border: "1px solid rgba(255,255,255,.75)", boxShadow: "0 3px 10px rgba(20,40,70,.05)" }}
                  >
                    {t}
                  </span>
                ))}
              </div>
              <div className="mb-[9px] text-[19px] font-bold text-[var(--color-ink)]">{g.title}</div>
              <div className="text-[15px] leading-[1.55] text-[var(--color-text-secondary-2)]">{g.text}</div>
            </div>
          ))}
        </div>
      </div>

      {/* FINAL CTA */}
      <div id="pricing" className="mx-auto max-w-[1200px] px-[clamp(20px,5vw,40px)] pb-[clamp(48px,7vw,96px)] pt-[clamp(20px,3vw,40px)]">
        <div
          className="rounded-[32px] px-[clamp(28px,5vw,64px)] py-[clamp(40px,6vw,72px)] text-center"
          style={{
            background: "linear-gradient(135deg,rgba(223,242,233,.85),rgba(224,238,252,.85))",
            backdropFilter: "blur(30px) saturate(1.4)",
            WebkitBackdropFilter: "blur(30px) saturate(1.4)",
            border: "1px solid rgba(255,255,255,.7)",
            boxShadow: "0 24px 60px rgba(20,40,70,.09)",
          }}
        >
          <h2
            className="mx-auto m-0 mb-[14px] max-w-[600px] font-extrabold text-[var(--color-ink)]"
            style={{ font: "800 clamp(30px,3.8vw,46px)/1.1 var(--font-golos)", letterSpacing: "-.02em" }}
          >
            Для регистрации нужен только email
          </h2>
          <p className="m-0 mb-8 text-[var(--color-text-secondary)]" style={{ font: "400 clamp(15px,1.3vw,18px)/1.5 var(--font-golos)" }}>
            7 дней тарифа Premium бесплатно. Дальше — выбираете подходящий тариф.
          </p>
          <form
            className="mx-auto mb-4 flex max-w-[520px] flex-wrap gap-[10px]"
            onSubmit={(e) => {
              e.preventDefault();
              openSignup(ctaEmail);
            }}
          >
            <input
              type="email"
              required
              placeholder="Введите ваш e-mail"
              value={ctaEmail}
              onChange={(e) => setCtaEmail(e.target.value)}
              className="input-field min-w-0 flex-1 basis-[220px]"
              style={{ padding: "16px 18px", border: "1px solid rgba(255,255,255,.85)", background: "rgba(255,255,255,.8)" }}
            />
            <button
              type="submit"
              className="flex flex-none items-center justify-center gap-[9px] rounded-2xl px-[26px] py-4 text-[16px] font-bold text-white"
              style={{ background: "#1A1C1E", boxShadow: "0 12px 28px rgba(20,30,45,.2)" }}
            >
              Начать бесплатно
            </button>
          </form>
          <div className="text-[14px] font-medium text-[var(--color-muted)]">Без привязки карты · Отмена в любой момент</div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="border-t" style={{ borderColor: "rgba(255,255,255,.5)", background: "rgba(234,242,251,.4)" }}>
        <div className="mx-auto flex max-w-[1200px] flex-wrap gap-[clamp(32px,5vw,64px)] px-[clamp(20px,5vw,40px)] py-[clamp(40px,5vw,60px)]">
          <div className="min-w-[240px] flex-1 basis-[260px]">
            <img src="/slotix/slotix-logo.png" alt="Slotix" className="mb-4 block h-[26px] w-auto" />
            <div className="mb-4 max-w-[280px] text-[14px] leading-[1.55] text-[var(--color-muted)]">
              Онлайн-сервис записи на встречи, консультации и занятия.
            </div>
            <div className="text-[13px] text-[var(--color-faint)]">© 2026 Slotix</div>
          </div>
          <div className="min-w-[150px] flex-none">
            <div className="mb-[14px] text-[14px] font-bold text-[var(--color-ink)]">Продукт</div>
            <div className="flex flex-col gap-[11px] text-[14px]">
              <a href="#features" style={{ color: "var(--color-link)" }}>
                Возможности
              </a>
              <a href="#integrations" style={{ color: "var(--color-link)" }}>
                Интеграции
              </a>
              <button type="button" onClick={openLogin} className="cursor-pointer text-left" style={{ color: "var(--color-link)" }}>
                Войти
              </button>
            </div>
          </div>
          <div className="min-w-[150px] flex-none">
            <div className="mb-[14px] text-[14px] font-bold text-[var(--color-ink)]">Поддержка</div>
            <div className="flex flex-col gap-[11px] text-[14px]">
              <a href="#" style={{ color: "var(--color-link)" }}>
                Справочный центр
              </a>
              <a href="#" style={{ color: "var(--color-link)" }}>
                Политика конфиденциальности
              </a>
              <a href="#" style={{ color: "var(--color-link)" }}>
                Условия использования
              </a>
            </div>
          </div>
        </div>
      </div>

      <AuthModal isOpen={modal.open} onClose={closeModal} initialMode={modal.mode} initialEmail={modal.email} />
    </div>
  );
}

function ChatBubble({ children, mine }: { children: React.ReactNode; mine?: boolean }) {
  return (
    <div
      className="max-w-[82%] self-start rounded-[18px] rounded-bl-[5px] px-[15px] py-[11px] text-[14.5px] leading-[1.35]"
      style={
        mine
          ? { alignSelf: "flex-end", background: "var(--color-primary-gradient)", color: "#fff", borderRadius: "18px 18px 5px 18px", boxShadow: "0 6px 16px rgba(80,148,240,.28)" }
          : { background: "rgba(120,132,148,.14)", color: "#22262B" }
      }
    >
      {children}
    </div>
  );
}

function SummaryPoint({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-[9px]">
      <span
        className="mt-[1px] flex h-[19px] w-[19px] flex-none items-center justify-center rounded-[6px]"
        style={{ background: "var(--color-success-bg)" }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6L9 17l-5-5" />
        </svg>
      </span>
      <span className="text-[13.5px] leading-[1.4] text-[var(--color-text-secondary)]">{children}</span>
    </div>
  );
}

function CalArrow({ direction }: { direction: "left" | "right" }) {
  return (
    <span
      className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-text-secondary)]"
      style={{ background: "rgba(255,255,255,.8)", boxShadow: "0 2px 6px rgba(20,40,70,.06)" }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {direction === "left" ? <path d="M15 6l-6 6 6 6" /> : <path d="M9 6l6 6-6 6" />}
      </svg>
    </span>
  );
}
