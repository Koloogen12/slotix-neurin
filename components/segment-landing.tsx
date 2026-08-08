"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthModal } from "@/components/auth-modal";
import { useAuth } from "@/lib/auth-context";

/**
 * Общий каркас отраслевой посадочной. Блоки те же, что на главной, — меняется только текст,
 * поэтому правка дизайна в одном месте расходится на все сегменты сразу.
 *
 * Иконки заданы именем, а не JSX: конфиг лежит в серверном файле страницы рядом с metadata,
 * а JSX через границу сервер→клиент не передать.
 */

export type IconName = "link" | "calendar" | "notes" | "money" | "shield" | "users" | "bolt" | "chart";

export type SegmentLandingConfig = {
  eyebrow: string;
  h1: string;
  sub: string;
  heroBullets: string[];
  painsTitle: string;
  pains: { title: string; text: string }[];
  stepsTitle: string;
  steps: { title: string; text: string }[];
  featuresTitle: string;
  features: { icon: IconName; title: string; text: string; badge?: string }[];
  beforeAfterTitle: string;
  beforeAfter: { label: string; before: string; after: string }[];
  faq: { q: string; a: string }[];
  ctaTitle: string;
  ctaText: string;
  note?: { title: string; text: string };
};

const ICONS: Record<IconName, React.ReactNode> = {
  link: (
    <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1.5 1.5M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1.5-1.5" />
  ),
  calendar: <path d="M3 9h18M8 2.5v4M16 2.5v4M4.5 4.5h15a1.5 1.5 0 0 1 1.5 1.5v13a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 19V6a1.5 1.5 0 0 1 1.5-1.5z" />,
  notes: <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h5" />,
  money: <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />,
  shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM9 12l2 2 4-4" />,
  users: <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />,
  bolt: <path d="M13 2L3 14h9l-1 8 10-12h-9z" />,
  chart: <path d="M3 3v18h18M7 15v3M12 9v9M17 5v13" />,
};

const ACCENTS = [
  { bg: "rgba(80,148,240,.14)", fg: "#3B7FD9" },
  { bg: "rgba(63,203,110,.15)", fg: "#2FA85A" },
  { bg: "rgba(147,120,236,.15)", fg: "#7B5CE0" },
  { bg: "rgba(240,168,80,.16)", fg: "#D98A26" },
];

type ModalState = { open: boolean; mode: "login" | "signup"; email: string };

export function SegmentLanding({ config }: { config: SegmentLandingConfig }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [modal, setModal] = useState<ModalState>({ open: false, mode: "login", email: "" });
  const [heroEmail, setHeroEmail] = useState("");
  const [ctaEmail, setCtaEmail] = useState("");

  // Тот же переход, что на главной: у вошедшего человека маркетинговая страница не нужна.
  useEffect(() => {
    if (isLoading || !user) return;
    router.replace(user.slug.startsWith("tmp-") ? "/onboarding" : "/cabinet/formats");
  }, [isLoading, user, router]);

  if (!isLoading && user) {
    return (
      <div className="flex min-h-screen flex-1 items-center justify-center">
        <div className="glass-card px-6 py-4 text-sm" style={{ color: "var(--color-muted)" }}>
          Открываем кабинет…
        </div>
      </div>
    );
  }

  const openLogin = () => setModal({ open: true, mode: "login", email: "" });
  const openSignup = (email: string) => setModal({ open: true, mode: "signup", email });

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
        <nav aria-label="Основная навигация" className="mx-auto flex max-w-[1200px] items-center justify-between gap-5 px-[clamp(20px,5vw,40px)] py-4">
          <a href="/" className="flex items-center" aria-label="Slotix — на главную">
            <img src="/slotix/slotix-logo.webp" alt="Slotix — сервис онлайн-записи на встречи" width={120} height={30} className="block h-[30px] w-auto" />
          </a>
          <div className="flex items-center gap-[clamp(14px,2.4vw,34px)]">
            <a href="/#features" className="hidden md:inline text-[15px] font-semibold text-[var(--color-text-secondary)]">
              Возможности
            </a>
            <a href="/pricing" className="hidden md:inline text-[15px] font-semibold text-[var(--color-text-secondary)]">
              Тарифы
            </a>
            <button type="button" onClick={openLogin} className="text-[15px] font-semibold text-[var(--color-ink)] cursor-pointer">
              Вход
            </button>
            <button type="button" onClick={() => openSignup("")} className="btn-primary text-[14px] px-5 py-[10px]">
              Регистрация
            </button>
          </div>
        </nav>
      </div>

      <main>

      {/* HERO */}
      <section id="top" aria-label="Кратко о сервисе" className="mx-auto max-w-[1200px] px-[clamp(20px,5vw,40px)] py-[clamp(48px,7vw,88px)]">
        <div className="mx-auto max-w-[820px] text-center">
          <div
            className="mb-5 inline-block rounded-full px-4 py-[7px] text-[13px] font-bold"
            style={{ background: "rgba(80,148,240,.13)", color: "#3B7FD9" }}
          >
            {config.eyebrow}
          </div>
          <h1
            className="m-0 mb-5 font-extrabold text-[var(--color-ink)]"
            style={{ font: "800 clamp(32px,4.6vw,56px)/1.08 var(--font-golos)", letterSpacing: "-.025em" }}
          >
            {config.h1}
          </h1>
          <p
            className="mx-auto m-0 mb-8 max-w-[640px] text-[var(--color-text-secondary)]"
            style={{ font: "400 clamp(16px,1.4vw,19px)/1.55 var(--font-golos)" }}
          >
            {config.sub}
          </p>
          <form
            className="mx-auto mb-5 flex max-w-[500px] flex-wrap gap-[10px]"
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
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[14px] font-medium text-[var(--color-muted)]">
            {config.heroBullets.map((b) => (
              <span key={b} className="flex items-center gap-[6px]">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2FA85A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                {b}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* БОЛИ */}
      <section aria-labelledby="pains-heading" className="mx-auto max-w-[1200px] px-[clamp(20px,5vw,40px)] py-[clamp(32px,5vw,64px)]">
        <h2
          id="pains-heading"
          className="m-0 mb-[clamp(24px,3vw,40px)] text-center font-extrabold text-[var(--color-ink)]"
          style={{ font: "800 clamp(26px,3.2vw,40px)/1.15 var(--font-golos)", letterSpacing: "-.02em" }}
        >
          {config.painsTitle}
        </h2>
        <div className="grid gap-[clamp(14px,2vw,22px)] md:grid-cols-2">
          {config.pains.map((p) => (
            <article key={p.title} className="glass-card p-[clamp(20px,2.4vw,28px)]">
              <div className="mb-[10px] flex items-start gap-3">
                <span
                  className="mt-[2px] flex h-[22px] w-[22px] flex-none items-center justify-center rounded-full text-[14px] font-bold"
                  style={{ background: "rgba(230,90,90,.14)", color: "#D45B5B" }}
                >
                  ×
                </span>
                <h3 className="m-0 text-[17px] font-bold leading-[1.3] text-[var(--color-ink)]">{p.title}</h3>
              </div>
              <p className="m-0 pl-[34px] text-[15px] leading-[1.55] text-[var(--color-text-secondary)]">{p.text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* КАК ЭТО РАБОТАЕТ */}
      <section aria-labelledby="steps-heading" className="mx-auto max-w-[1200px] px-[clamp(20px,5vw,40px)] py-[clamp(32px,5vw,64px)]">
        <h2
          id="steps-heading"
          className="m-0 mb-[clamp(24px,3vw,40px)] text-center font-extrabold text-[var(--color-ink)]"
          style={{ font: "800 clamp(26px,3.2vw,40px)/1.15 var(--font-golos)", letterSpacing: "-.02em" }}
        >
          {config.stepsTitle}
        </h2>
        <div className="grid gap-[clamp(16px,2vw,24px)] md:grid-cols-3">
          {config.steps.map((s, i) => (
            <article key={s.title} className="glass-card p-[clamp(22px,2.6vw,30px)]">
              <div
                className="mb-4 flex h-[38px] w-[38px] items-center justify-center rounded-2xl text-[17px] font-extrabold text-white"
                style={{ background: "linear-gradient(135deg,#66A6FF,#5094F0)" }}
              >
                {i + 1}
              </div>
              <h3 className="m-0 mb-2 text-[18px] font-bold leading-[1.25] text-[var(--color-ink)]">{s.title}</h3>
              <p className="m-0 text-[15px] leading-[1.55] text-[var(--color-text-secondary)]">{s.text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ВОЗМОЖНОСТИ */}
      <section id="features" aria-labelledby="features-heading" className="mx-auto max-w-[1200px] px-[clamp(20px,5vw,40px)] py-[clamp(32px,5vw,64px)]">
        <h2
          id="features-heading"
          className="m-0 mb-[clamp(24px,3vw,40px)] text-center font-extrabold text-[var(--color-ink)]"
          style={{ font: "800 clamp(26px,3.2vw,40px)/1.15 var(--font-golos)", letterSpacing: "-.02em" }}
        >
          {config.featuresTitle}
        </h2>
        <div className="grid gap-[clamp(14px,2vw,22px)] md:grid-cols-2 lg:grid-cols-3">
          {config.features.map((f, i) => {
            const accent = ACCENTS[i % ACCENTS.length];
            return (
              <article key={f.title} className="glass-card p-[clamp(20px,2.4vw,28px)]">
                <div className="mb-4 flex items-center gap-3">
                  <span
                    className="flex h-[44px] w-[44px] flex-none items-center justify-center rounded-2xl"
                    style={{ background: accent.bg, color: accent.fg }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      {ICONS[f.icon]}
                    </svg>
                  </span>
                  {f.badge ? (
                    <span
                      className="rounded-full px-[10px] py-[4px] text-[12px] font-bold"
                      style={{ background: "rgba(63,203,110,.15)", color: "#2FA85A" }}
                    >
                      {f.badge}
                    </span>
                  ) : null}
                </div>
                <h3 className="m-0 mb-2 text-[17px] font-bold leading-[1.3] text-[var(--color-ink)]">{f.title}</h3>
                <p className="m-0 text-[15px] leading-[1.55] text-[var(--color-text-secondary)]">{f.text}</p>
              </article>
            );
          })}
        </div>
      </section>

      {/* БЫЛО → СТАЛО */}
      <section aria-labelledby="compare-heading" className="mx-auto max-w-[1200px] px-[clamp(20px,5vw,40px)] py-[clamp(32px,5vw,64px)]">
        <h2
          id="compare-heading"
          className="m-0 mb-[clamp(24px,3vw,40px)] text-center font-extrabold text-[var(--color-ink)]"
          style={{ font: "800 clamp(26px,3.2vw,40px)/1.15 var(--font-golos)", letterSpacing: "-.02em" }}
        >
          {config.beforeAfterTitle}
        </h2>
        <div className="glass-card overflow-hidden p-0">
          <div
            role="table"
            aria-label={config.beforeAfterTitle}
            className="grid grid-cols-[1fr_1fr] gap-px md:grid-cols-[minmax(120px,1fr)_1.4fr_1.4fr]"
            style={{ background: "rgba(255,255,255,.45)" }}
          >
            <div role="row" className="contents">
              <div role="columnheader" className="hidden px-[clamp(16px,2vw,24px)] py-4 text-[13px] font-bold uppercase tracking-wide text-[var(--color-faint)] md:block" style={{ background: "rgba(255,255,255,.55)" }}>
                &nbsp;
              </div>
              <div role="columnheader" className="px-[clamp(16px,2vw,24px)] py-4 text-[13px] font-bold uppercase tracking-wide text-[var(--color-faint)]" style={{ background: "rgba(255,255,255,.55)" }}>
                Как сейчас
              </div>
              <div role="columnheader" className="px-[clamp(16px,2vw,24px)] py-4 text-[13px] font-bold uppercase tracking-wide" style={{ background: "rgba(63,203,110,.1)", color: "#2FA85A" }}>
                Со Slotix
              </div>
            </div>
            {config.beforeAfter.map((row) => (
              <div key={row.label} role="row" className="contents">
                <div
                  role="rowheader"
                  className="col-span-2 px-[clamp(16px,2vw,24px)] pt-4 text-[13px] font-bold text-[var(--color-muted)] md:col-span-1 md:py-[clamp(16px,2vw,20px)] md:text-[15px] md:text-[var(--color-ink)]"
                  style={{ background: "rgba(255,255,255,.35)" }}
                >
                  {row.label}
                </div>
                <div
                  role="cell"
                  className="px-[clamp(16px,2vw,24px)] py-[clamp(14px,2vw,20px)] text-[15px] leading-[1.5] text-[var(--color-text-secondary)]"
                  style={{ background: "rgba(255,255,255,.35)" }}
                >
                  {row.before}
                </div>
                <div
                  role="cell"
                  className="px-[clamp(16px,2vw,24px)] py-[clamp(14px,2vw,20px)] text-[15px] font-medium leading-[1.5] text-[var(--color-ink)]"
                  style={{ background: "rgba(63,203,110,.07)" }}
                >
                  {row.after}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ОТДЕЛЬНОЕ ОБЕЩАНИЕ (например, про конфиденциальность) */}
      {config.note ? (
        <section aria-labelledby="note-heading" className="mx-auto max-w-[1200px] px-[clamp(20px,5vw,40px)] py-[clamp(16px,3vw,32px)]">
          <div
            className="rounded-[24px] px-[clamp(22px,3vw,40px)] py-[clamp(24px,3vw,36px)]"
            style={{ background: "rgba(255,255,255,.55)", border: "1px solid rgba(255,255,255,.8)" }}
          >
            <div className="flex flex-wrap items-start gap-4">
              <span
                className="flex h-[44px] w-[44px] flex-none items-center justify-center rounded-2xl"
                style={{ background: "rgba(63,203,110,.15)", color: "#2FA85A" }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {ICONS.shield}
                </svg>
              </span>
              <div className="min-w-[260px] flex-1">
                <h2 id="note-heading" className="m-0 mb-2 text-[18px] font-bold text-[var(--color-ink)]">
                  {config.note.title}
                </h2>
                <p className="m-0 text-[15px] leading-[1.6] text-[var(--color-text-secondary)]">{config.note.text}</p>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* ВОПРОСЫ */}
      <section aria-labelledby="faq-heading" className="mx-auto max-w-[820px] px-[clamp(20px,5vw,40px)] py-[clamp(32px,5vw,64px)]">
        <h2
          id="faq-heading"
          className="m-0 mb-[clamp(20px,3vw,32px)] text-center font-extrabold text-[var(--color-ink)]"
          style={{ font: "800 clamp(26px,3.2vw,40px)/1.15 var(--font-golos)", letterSpacing: "-.02em" }}
        >
          Частые вопросы
        </h2>
        <div className="flex flex-col gap-3">
          {config.faq.map((item) => (
            <details key={item.q} className="glass-card group p-[clamp(18px,2.2vw,24px)]">
              <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-4">
                <h3 className="m-0 text-[16px] font-bold text-[var(--color-ink)]">{item.q}</h3>
                <span aria-hidden="true" className="flex-none text-[20px] font-normal text-[var(--color-faint)] transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="m-0 mt-3 text-[15px] leading-[1.6] text-[var(--color-text-secondary)]">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section aria-labelledby="cta-heading" className="mx-auto max-w-[1200px] px-[clamp(20px,5vw,40px)] pb-[clamp(48px,7vw,96px)] pt-[clamp(20px,3vw,40px)]">
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
            id="cta-heading"
            className="mx-auto m-0 mb-[14px] max-w-[600px] font-extrabold text-[var(--color-ink)]"
            style={{ font: "800 clamp(30px,3.8vw,46px)/1.1 var(--font-golos)", letterSpacing: "-.02em" }}
          >
            {config.ctaTitle}
          </h2>
          <p className="mx-auto m-0 mb-8 max-w-[560px] text-[var(--color-text-secondary)]" style={{ font: "400 clamp(15px,1.3vw,18px)/1.5 var(--font-golos)" }}>
            {config.ctaText}
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
      </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t" style={{ borderColor: "rgba(255,255,255,.5)", background: "rgba(234,242,251,.4)" }}>
        <div className="mx-auto flex max-w-[1200px] flex-wrap gap-[clamp(32px,5vw,64px)] px-[clamp(20px,5vw,40px)] py-[clamp(40px,5vw,60px)]">
          <div className="min-w-[240px] flex-1 basis-[260px]">
            <img src="/slotix/slotix-logo.webp" alt="Slotix" width={104} height={26} className="mb-4 block h-[26px] w-auto" />
            <div className="mb-4 max-w-[280px] text-[14px] leading-[1.55] text-[var(--color-muted)]">
              Онлайн-сервис записи на встречи, консультации и занятия.
            </div>
            <div className="mb-3 text-[13px] text-[var(--color-faint)]">© 2026 Slotix</div>
            <div className="max-w-[280px] text-[13px] leading-[1.6] text-[var(--color-faint)]">
              <div className="font-semibold text-[var(--color-muted)]">ИП Кочнев Данил Сергеевич</div>
              <div>ИНН 420549679716</div>
              <div>ОГРНИП 326420500091032</div>
            </div>
          </div>
          <div className="min-w-[150px] flex-none">
            <h3 className="m-0 mb-[14px] text-[14px] font-bold text-[var(--color-ink)]">Кому подходит</h3>
            <div className="flex flex-col gap-[11px] text-[14px]">
              <a href="/dlya/konsultantov" style={{ color: "var(--color-link)" }}>
                Консультантам
              </a>
              <a href="/dlya/psihologov" style={{ color: "var(--color-link)" }}>
                Психологам и коучам
              </a>
              <a href="/dlya/komand" style={{ color: "var(--color-link)" }}>
                Командам и студиям
              </a>
              <a href="/dlya/hr" style={{ color: "var(--color-link)" }}>
                HR и рекрутингу
              </a>
            </div>
          </div>
          <div className="min-w-[150px] flex-none">
            <h3 className="m-0 mb-[14px] text-[14px] font-bold text-[var(--color-ink)]">Продукт</h3>
            <div className="flex flex-col gap-[11px] text-[14px]">
              <a href="/#features" style={{ color: "var(--color-link)" }}>
                Возможности
              </a>
              <a href="/pricing" style={{ color: "var(--color-link)" }}>
                Тарифы
              </a>
              <a href="/support" style={{ color: "var(--color-link)" }}>
                Справочный центр
              </a>
            </div>
          </div>
          <div className="min-w-[150px] flex-none">
            <h3 className="m-0 mb-[14px] text-[14px] font-bold text-[var(--color-ink)]">Документы</h3>
            <div className="flex flex-col gap-[11px] text-[14px]">
              <a href="/privacy" style={{ color: "var(--color-link)" }}>
                Конфиденциальность
              </a>
              <a href="/oferta" style={{ color: "var(--color-link)" }}>
                Условия использования
              </a>
              <a href="/cookies" style={{ color: "var(--color-link)" }}>
                Политика cookie
              </a>
            </div>
          </div>
        </div>
      </footer>

      <AuthModal
        isOpen={modal.open}
        onClose={() => setModal((m) => ({ ...m, open: false }))}
        initialMode={modal.mode}
        initialEmail={modal.email}
      />
    </div>
  );
}
