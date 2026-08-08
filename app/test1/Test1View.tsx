"use client";

import { useEffect, useState } from "react";
import { AuthModal } from "@/components/auth-modal";
import { BookingPageMockup, LiveCallMockup, NoteCardMockup, PhoneBookingMockup } from "@/components/ui-mockups";
import { HandNote } from "@/components/landing-bits";
import {
  AlternativesSection,
  BeforeAfterSection,
  IntegrationsPanel,
  SegmentsSection,
} from "@/components/landing-sections";

/**
 * Черновик новой главной: структура собрана вокруг сегментов и их задач, а не вокруг
 * перечня функций. Живая главная не тронута — сравниваем и решаем.
 */

type ModalState = { open: boolean; mode: "login" | "signup"; email: string };





const FEATURES = [
  {
    accent: { bg: "rgba(80,148,240,.14)", fg: "#3B7FD9" },
    title: "Одна ссылка вместо переписок",
    text: "Клиент видит только свободные слоты и бронирует сам. Регистрироваться ему не нужно — достаточно email. Слоты считаются по вашему календарю, с буферами между встречами.",
    icon: <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1.5 1.5M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1.5-1.5" />,
  },
  {
    accent: { bg: "rgba(63,203,110,.15)", fg: "#2FA85A" },
    title: "Оплата до встречи",
    text: "Российскими картами, в момент записи. Не пришла оплата — слот не занялся. Комиссию с ваших клиентов мы не берём: деньги идут напрямую вам.",
    icon: <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />,
  },
  {
    accent: { bg: "rgba(147,120,236,.15)", fg: "#7B5CE0" },
    title: "Всё создаётся само",
    text: "Ссылка на Телемост, Zoom или Meet, событие в календаре, напоминания вам и клиенту на почту и в Телеграм. Вы не нажимаете ничего.",
    icon: <path d="M13 2L3 14h9l-1 8 10-12h-9z" />,
  },
];

const STEPS = [
  {
    title: "Отдаёте одну ссылку",
    text: "Клиент открывает вашу страницу, выбирает время из реально свободных слотов, оставляет email и платит — до встречи.",
    mockup: <PhoneBookingMockup />,
  },
  {
    title: "Проводите встречу",
    text: "Ссылка на созвон уже создана, напоминания ушли обоим, встреча в календаре. Бот заходит в звонок и слушает — вы ничего не нажимаете.",
    mockup: <LiveCallMockup />,
  },
  {
    title: "Получаете готовый итог",
    text: "Через несколько минут у вас и у клиента конспект: суть, принятые решения, задачи с ответственными и предложение следующей встречи.",
    mockup: <NoteCardMockup />,
  },
];

const INTEGRATIONS = [
  { group: "Календари", items: ["Яндекс Календарь", "Google Календарь"] },
  { group: "Созвоны", items: ["Яндекс Телемост", "Zoom", "Google Meet"] },
  { group: "Оплаты", items: ["ЮKassa", "Российские карты"] },
  { group: "Уведомления", items: ["Email", "Телеграм"] },
];

const FAQ = [
  {
    q: "Сколько это стоит?",
    a: "Бесплатный тариф без ограничения по времени и без привязки карты — в нём есть запись, календари, напоминания и пробный час AI-конспектов. Платные: Стандарт 690 ₽, Pro 1 490 ₽, Команда 4 990 ₽ в месяц. Комиссию с оплат ваших клиентов мы не берём.",
  },
  {
    q: "Клиенту нужно регистрироваться?",
    a: "Нет. Для записи достаточно указать имя и email — никаких аккаунтов и паролей. Лишний барьер на этом шаге стоит записей.",
  },
  {
    q: "С какими календарями и площадками работает?",
    a: "Календари — Яндекс и Google. Созвоны — Яндекс Телемост, Zoom и Google Meet. Встреча в Телемосте расходует вдвое меньше минут вашего тарифа: российская площадка обходится нам дешевле, и мы отдаём эту разницу вам.",
  },
  {
    q: "Что такое AI-конспект и обязателен ли он?",
    a: "Бот заходит в созвон, слушает и после встречи присылает итог с решениями и задачами — вам и клиенту. Он виден участникам как отдельный участник. Функцию можно выключить для любого формата встреч, а для практик психолога и психотерапевта она выключена по умолчанию.",
  },
  {
    q: "Где хранятся данные?",
    a: "На серверах в России. Оставшиеся привлекаемые сервисы мы последовательно переносим на российские и собственные решения — актуальный статус по каждому раскрыт в политике конфиденциальности.",
  },
  {
    q: "Сколько занимает настройка?",
    a: "Около десяти минут: подключить календарь, задать рабочие часы и создать первый формат встречи. Дальше можно отдавать ссылку.",
  },
];

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-center gap-2.5">
      <span className="h-px w-6" style={{ background: "linear-gradient(90deg,transparent,rgba(80,148,240,.5))" }} />
      <span className="text-[11.5px] font-bold tracking-[0.12em] text-[var(--color-link)] uppercase">{children}</span>
      <span className="h-px w-6" style={{ background: "linear-gradient(90deg,rgba(80,148,240,.5),transparent)" }} />
    </div>
  );
}

export function Test1View() {
  const [modal, setModal] = useState<ModalState>({ open: false, mode: "login", email: "" });
  const [heroEmail, setHeroEmail] = useState("");
  const [ctaEmail, setCtaEmail] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  // С открытым меню страница под ним прокручиваться не должна — иначе на телефоне
  // человек листает фон и теряет само меню.
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const openLogin = () => setModal({ open: true, mode: "login", email: "" });
  const openSignup = (email: string) => setModal({ open: true, mode: "signup", email });

  const h2 = "800 clamp(26px,3.4vw,42px)/1.13 var(--font-golos)";

  return (
    <div className="flex-1 overflow-x-hidden">
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
          <a href="#top" className="flex min-h-[44px] items-center" aria-label="Slotix — наверх">
            <img src="/slotix/slotix-logo.webp" alt="Slotix" width={120} height={30} className="block h-[30px] w-auto" />
          </a>
          <div className="flex items-center gap-[clamp(14px,2.4vw,34px)]">
            <a href="#segments" className="hidden md:inline text-[15px] font-semibold text-[var(--color-text-secondary)]">
              Кому подходит
            </a>
            <a href="#features" className="hidden md:inline text-[15px] font-semibold text-[var(--color-text-secondary)]">
              Возможности
            </a>
            <a href="/pricing" className="hidden md:inline text-[15px] font-semibold text-[var(--color-text-secondary)]">
              Тарифы
            </a>
            <button
              type="button"
              onClick={openLogin}
              className="hidden cursor-pointer px-1 py-2 text-[15px] font-semibold text-[var(--color-ink)] md:inline"
            >
              Вход
            </button>
            <button type="button" onClick={() => openSignup("")} className="btn-primary px-5 py-[10px] text-[14px]">
              Регистрация
            </button>
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Открыть меню"
              aria-expanded={menuOpen}
              className="flex h-11 w-11 items-center justify-center rounded-xl md:hidden"
              style={{ background: "rgba(255,255,255,.7)", border: "1px solid rgba(255,255,255,.85)" }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-ink)" strokeWidth="2.2" strokeLinecap="round">
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </button>
          </div>
        </nav>
      </div>

      {menuOpen ? (
        <div className="fixed inset-0 z-[120] md:hidden">
          <button
            type="button"
            aria-label="Закрыть меню"
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 w-full cursor-default"
            style={{ background: "rgba(20,40,70,.35)", backdropFilter: "blur(4px)" }}
          />
          <div
            className="absolute top-0 right-0 flex h-full w-[82%] max-w-[330px] flex-col gap-1 p-5"
            style={{ background: "#EDF3FB", boxShadow: "-24px 0 60px rgba(20,40,70,.25)" }}
          >
            <div className="mb-4 flex items-center justify-between">
              <img src="/slotix/slotix-logo.webp" alt="Slotix" width={104} height={26} className="h-[26px] w-auto" />
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Закрыть меню"
                className="flex h-11 w-11 items-center justify-center rounded-xl"
                style={{ background: "rgba(255,255,255,.75)" }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-ink)" strokeWidth="2.4" strokeLinecap="round">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
            {[
              { href: "#segments", label: "Кому подходит" },
              { href: "#features", label: "Возможности" },
              { href: "/pricing", label: "Тарифы" },
              { href: "/support", label: "Поддержка" },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-2xl px-4 py-3.5 text-[17px] font-semibold text-[var(--color-ink)]"
                style={{ background: "rgba(255,255,255,.6)" }}
              >
                {item.label}
              </a>
            ))}
            <div className="mt-auto flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  openLogin();
                }}
                className="rounded-2xl px-4 py-3.5 text-[16px] font-semibold text-[var(--color-ink)]"
                style={{ background: "rgba(255,255,255,.6)" }}
              >
                Вход
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  openSignup("");
                }}
                className="btn-primary w-full py-4 text-[16px]"
              >
                Начать бесплатно
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <main>
        {/* HERO */}
        <section id="top" className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-[clamp(36px,5vw,64px)] px-[clamp(20px,5vw,40px)] py-[clamp(48px,7vw,88px)]">
          <div className="min-w-[320px] flex-1 basis-[440px]">
            <div
              className="mb-5 inline-flex items-center gap-2 rounded-full px-4 py-[7px] text-[13px] font-bold"
              style={{ background: "rgba(80,148,240,.13)", color: "#3B7FD9" }}
            >
              Планирование встреч без переписок
            </div>
            <h1
              className="m-0 mb-[22px] font-extrabold text-[var(--color-ink)]"
              style={{ font: "800 clamp(34px,4.6vw,56px)/1.06 var(--font-golos)", letterSpacing: "-.02em", textWrap: "balance" }}
            >
              Slotix помогает планировать встречи без долгих переписок
            </h1>
            <p className="m-0 mb-8 max-w-[500px] text-[var(--color-text-secondary)]" style={{ font: "400 clamp(16px,1.4vw,19px)/1.55 var(--font-golos)" }}>
              Клиент открывает вашу ссылку, сам выбирает свободный слот и платит. А после встречи получает конспект с
              договорённостями — без вашего участия.
            </p>
            <form
              className="flex max-w-[520px] flex-wrap gap-[10px]"
              onSubmit={(e) => {
                e.preventDefault();
                openSignup(heroEmail);
              }}
            >
              <label htmlFor="hero-email" className="sr-only-label">
                Ваш адрес электронной почты
              </label>
              <input
                id="hero-email"
                type="email"
                required
                autoComplete="email"
                placeholder="Введите ваш e-mail"
                value={heroEmail}
                onChange={(e) => setHeroEmail(e.target.value)}
                className="input-field min-w-0 flex-1 basis-[220px]"
                style={{ padding: "16px 18px", border: "1px solid rgba(255,255,255,.75)", background: "rgba(255,255,255,.7)" }}
              />
              <button type="submit" className="btn-primary flex-none px-[26px] py-4 text-[16px]">
                Начать бесплатно
              </button>
            </form>
            <div className="mt-4 text-[14px] text-[var(--color-muted)]">
              Бесплатный тариф без ограничения по времени. Платные —{" "}
              <a href="/pricing" className="font-semibold underline decoration-[rgba(47,111,208,.35)] underline-offset-2" style={{ color: "var(--color-link)" }}>
                от 690 ₽ в месяц
              </a>
              .
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[14px] font-medium text-[var(--color-muted)]">
              {["Карта не нужна", "Настройка за 10 минут", "Отмена в любой момент"].map((b) => (
                <span key={b} className="flex items-center gap-[6px]">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2FA85A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  {b}
                </span>
              ))}
            </div>
          </div>
          <div className="relative flex min-w-[320px] flex-1 basis-[420px] justify-center">
            <HandNote text={"Так это видит\nваш клиент"} className="absolute -top-2 left-[-6%] z-10" />
            <BookingPageMockup />
          </div>
        </section>

        <SegmentsSection />

        {/* КАК ЭТО РАБОТАЕТ */}
        <section aria-labelledby="how-h" className="reveal mx-auto max-w-[1200px] px-[clamp(20px,5vw,40px)] py-[clamp(36px,5vw,72px)]">
          <SectionEyebrow>Три шага</SectionEyebrow>
          <h2 id="how-h" className="m-0 mb-[clamp(28px,4vw,56px)] text-center font-extrabold text-[var(--color-ink)]" style={{ font: h2, letterSpacing: "-.02em" }}>
            Как это работает
          </h2>
          <div className="flex flex-col gap-[clamp(28px,4vw,56px)]">
            {STEPS.map((step, i) => (
              <div key={step.title} className={`flex flex-wrap items-center gap-[clamp(28px,4vw,64px)] ${i % 2 ? "md:flex-row-reverse" : ""}`}>
                <div className="relative min-w-[300px] flex-1 basis-[380px]">
                  <div className="mb-4 flex items-center gap-3">
                    <span
                      className="flex h-10 w-10 flex-none items-center justify-center rounded-2xl text-[17px] font-extrabold text-white"
                      style={{
                        background: "var(--color-primary-gradient)",
                        boxShadow: "inset 0 1px 0 rgba(255,255,255,.45), 0 8px 18px -6px rgba(80,148,240,.6)",
                      }}
                    >
                      {i + 1}
                    </span>
                    {/* пунктир к следующему шагу — иначе три блока читаются как три отдельные секции */}
                    {i < 2 ? (
                      <span
                        aria-hidden="true"
                        className="h-px flex-1"
                        style={{
                          background:
                            "repeating-linear-gradient(90deg,rgba(80,148,240,.45) 0 7px,transparent 7px 14px)",
                        }}
                      />
                    ) : null}
                  </div>
                  <h3 className="m-0 mb-3 text-[clamp(21px,2.3vw,27px)] font-extrabold leading-[1.2] text-[var(--color-ink)]">{step.title}</h3>
                  <p className="m-0 max-w-[440px] text-[16px] leading-[1.6] text-[var(--color-text-secondary)]">{step.text}</p>
                </div>
                <div className="relative flex min-w-[300px] flex-1 basis-[400px] justify-center">
                  {i === 2 ? (
                    <HandNote text={"Ничего не нажимая"} direction="left" className="absolute -top-1 right-[-4%] z-10" />
                  ) : null}
                  {step.mockup}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ФОКАЛЬНАЯ ТОЧКА */}
        <section aria-label="Главное" className="reveal mx-auto max-w-[1200px] px-[clamp(20px,5vw,40px)] py-[clamp(28px,4vw,56px)]">
          <div className="mx-auto max-w-[860px] text-center">
            <p
              className="m-0 font-extrabold text-[var(--color-ink)]"
              style={{ font: "800 clamp(30px,5.4vw,64px)/1.06 var(--font-golos)", letterSpacing: "-.03em", textWrap: "balance" }}
            >
              После встречи вам не нужно{" "}
              <span
                style={{
                  background: "linear-gradient(135deg,#66A6FF,#3FCB6E)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                }}
              >
                делать ничего
              </span>
            </p>
            <p className="mx-auto m-0 mt-5 max-w-[560px] text-[17px] leading-[1.6] text-[var(--color-text-secondary)]">
              Ни писать письмо с итогами, ни напоминать про оплату, ни искать, о чём договорились в прошлый раз.
            </p>
          </div>
        </section>

        {/* ВОЗМОЖНОСТИ */}
        <section id="features" aria-labelledby="features-h" className="reveal mx-auto max-w-[1200px] px-[clamp(20px,5vw,40px)] py-[clamp(36px,5vw,72px)]">
          <SectionEyebrow>Возможности</SectionEyebrow>
          <h2 id="features-h" className="m-0 mb-[clamp(24px,3vw,44px)] text-center font-extrabold text-[var(--color-ink)]" style={{ font: h2, letterSpacing: "-.02em" }}>
            Что внутри
          </h2>
          <div className="grid gap-[clamp(14px,2vw,22px)] md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <article key={f.title} className="glass-elevated rim-hover p-[clamp(22px,2.6vw,30px)]">
                <span
                  className="mb-5 flex h-[48px] w-[48px] items-center justify-center rounded-2xl"
                  style={{
                    background: f.accent.bg,
                    color: f.accent.fg,
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,.8), 0 8px 20px -8px " + f.accent.fg + "55",
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {f.icon}
                  </svg>
                </span>
                <h3 className="m-0 mb-2 text-[17.5px] font-bold leading-[1.3] text-[var(--color-ink)]">{f.title}</h3>
                <p className="m-0 text-[15px] leading-[1.55] text-[var(--color-text-secondary)]">{f.text}</p>
              </article>
            ))}
          </div>
        </section>

        <BeforeAfterSection />

        <AlternativesSection />

        <IntegrationsPanel />

        {/* FAQ */}
        <section aria-labelledby="faq-h" className="reveal mx-auto max-w-[820px] px-[clamp(20px,5vw,40px)] py-[clamp(36px,5vw,72px)]">
          <SectionEyebrow>Вопросы</SectionEyebrow>
          <h2 id="faq-h" className="m-0 mb-[clamp(20px,3vw,36px)] text-center font-extrabold text-[var(--color-ink)]" style={{ font: h2, letterSpacing: "-.02em" }}>
            Частые вопросы
          </h2>
          <div className="flex flex-col gap-3">
            {FAQ.map((item) => (
              <details key={item.q} className="glass-elevated group p-[clamp(20px,2.4vw,26px)]">
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
        <section aria-labelledby="cta-h" className="mx-auto max-w-[1200px] px-[clamp(20px,5vw,40px)] pb-[clamp(48px,7vw,96px)] pt-[clamp(20px,3vw,40px)]">
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
            <h2 id="cta-h" className="mx-auto m-0 mb-[14px] max-w-[620px] font-extrabold text-[var(--color-ink)]" style={{ font: "800 clamp(30px,3.8vw,46px)/1.1 var(--font-golos)", letterSpacing: "-.02em" }}>
              Проверьте на двух ближайших встречах
            </h2>
            <p className="mx-auto m-0 mb-8 max-w-[540px] text-[var(--color-text-secondary)]" style={{ font: "400 clamp(15px,1.3vw,18px)/1.5 var(--font-golos)" }}>
              Регистрация по email, карта не нужна. Бесплатный тариф без ограничения по времени — хватит, чтобы понять,
              подходит ли это вам.
            </p>
            <form
              className="mx-auto mb-4 flex max-w-[520px] flex-wrap gap-[10px]"
              onSubmit={(e) => {
                e.preventDefault();
                openSignup(ctaEmail);
              }}
            >
              <label htmlFor="cta-email" className="sr-only-label">
                Ваш адрес электронной почты
              </label>
              <input
                id="cta-email"
                type="email"
                required
                autoComplete="email"
                placeholder="Введите ваш e-mail"
                value={ctaEmail}
                onChange={(e) => setCtaEmail(e.target.value)}
                className="input-field min-w-0 flex-1 basis-[220px]"
                style={{ padding: "16px 18px", border: "1px solid rgba(255,255,255,.85)", background: "rgba(255,255,255,.8)" }}
              />
              <button
                type="submit"
                className="flex flex-none items-center justify-center rounded-2xl px-[26px] py-4 text-[16px] font-bold text-white"
                style={{ background: "#1A1C1E", boxShadow: "0 12px 28px rgba(20,30,45,.2)" }}
              >
                Начать бесплатно
              </button>
            </form>
            <div className="text-[14px] font-medium text-[var(--color-muted)]">Без привязки карты · Отмена в любой момент</div>
          </div>
        </section>
      </main>

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
            <div className="flex flex-col text-[14px]">
              {[
                { href: "/dlya/konsultantov", label: "Консультантам" },
                { href: "/dlya/psihologov", label: "Психологам и коучам" },
                { href: "/dlya/komand", label: "Командам и студиям" },
                { href: "/dlya/hr", label: "HR и рекрутингу" },
              ].map((item) => (
                <a key={item.href} href={item.href} className="-mx-1 flex min-h-[44px] items-center px-1" style={{ color: "var(--color-link)" }}>
                  {item.label}
                </a>
              ))}
            </div>
          </div>
          <div className="min-w-[150px] flex-none">
            <h3 className="m-0 mb-[14px] text-[14px] font-bold text-[var(--color-ink)]">Продукт</h3>
            <div className="flex flex-col text-[14px]">
              <a href="#features" className="-mx-1 flex min-h-[44px] items-center px-1" style={{ color: "var(--color-link)" }}>
                Возможности
              </a>
              <a href="/pricing" className="-mx-1 flex min-h-[44px] items-center px-1" style={{ color: "var(--color-link)" }}>
                Тарифы
              </a>
              <a href="/support" className="-mx-1 flex min-h-[44px] items-center px-1" style={{ color: "var(--color-link)" }}>
                Справочный центр
              </a>
            </div>
          </div>
          <div className="min-w-[150px] flex-none">
            <h3 className="m-0 mb-[14px] text-[14px] font-bold text-[var(--color-ink)]">Документы</h3>
            <div className="flex flex-col text-[14px]">
              <a href="/privacy" className="-mx-1 flex min-h-[44px] items-center px-1" style={{ color: "var(--color-link)" }}>
                Конфиденциальность
              </a>
              <a href="/oferta" className="-mx-1 flex min-h-[44px] items-center px-1" style={{ color: "var(--color-link)" }}>
                Условия использования
              </a>
              <a href="/cookies" className="-mx-1 flex min-h-[44px] items-center px-1" style={{ color: "var(--color-link)" }}>
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
