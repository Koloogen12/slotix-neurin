import type { Metadata } from "next";

// Бренд дописывает шаблон в layout — иначе выходит «… | Slotix | Slotix».
const TITLE = "ИИ-конспект встреч онлайн — автопротокол звонка";
const DESCRIPTION =
  "Slotix присылает готовый конспект встречи с задачами и договорённостями сразу после звонка — вам и клиенту, на почту и в Telegram. Без записей и ручных заметок.";
const URL = "/ai-seo";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "ИИ конспект встреч",
    "автоматический протокол совещания",
    "ИИ-бот для созвонов",
    "конспект звонка нейросетью",
    "расшифровка встречи в текст",
    "сервис для протоколирования совещаний",
    "ассистент для записи задач с созвона",
  ],
  alternates: { canonical: URL },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: URL,
    siteName: "Slotix",
    locale: "ru_RU",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

const FAQ = [
  {
    q: "Как ИИ понимает, о чём была встреча?",
    a: "Бот подключается к звонку как обычный участник (Google Meet, Zoom или Яндекс Телемост), слушает разговор в реальном времени и выделяет ключевые договорённости, задачи, даты и имена ответственных.",
  },
  {
    q: "Конспект получит только я или клиент тоже?",
    a: "Готовый протокол приходит обеим сторонам сразу после встречи — вам и клиенту, на почту и в Telegram. Никто не остаётся без списка договорённостей.",
  },
  {
    q: "На каких языках работает ИИ-конспект?",
    a: "Конспект строится на русском языке и корректно распознаёт деловую терминологию, имена и названия — рассчитан на встречи, которые проходят на русском.",
  },
  {
    q: "Нужно ли устанавливать дополнительные приложения?",
    a: "Нет. Бот сам подключается к звонку по ссылке встречи — устанавливать плагины, боты в календарь или отдельные приложения не требуется.",
  },
  {
    q: "Что если на встрече обсудили следующий созвон?",
    a: "Если в разговоре прозвучало «созвонимся через две недели» — в конспекте появится кнопка записи на следующую встречу, и клиент сможет забронировать слот в один клик прямо из письма.",
  },
  {
    q: "Это безопасно — данные звонка никуда не попадут?",
    a: "Конспект формируется только для встречи и её участников и отправляется исключительно им — стороннего доступа к записи или содержанию звонка нет.",
  },
];

function faqJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

export default function AiSeoPage() {
  return (
    <div className="flex-1 overflow-x-hidden">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd()) }}
      />

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
          <a href="/" className="flex items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/slotix/slotix-logo.webp" alt="Slotix" className="block h-[30px] w-auto" />
          </a>
          <div className="flex items-center gap-[clamp(14px,2.4vw,34px)]">
            <a href="/#features" className="hidden md:inline text-[15px] font-semibold text-[var(--color-text-secondary)]">
              Возможности
            </a>
            <a href="/#pricing" className="hidden md:inline text-[15px] font-semibold text-[var(--color-text-secondary)]">
              Тарифы
            </a>
            <a href="/" className="btn-primary text-[14px] px-5 py-[10px]">
              Начать бесплатно
            </a>
          </div>
        </div>
      </div>

      {/* HERO */}
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-[clamp(36px,5vw,64px)] px-[clamp(20px,5vw,40px)] py-[clamp(48px,7vw,88px)]">
        <div className="min-w-[320px] flex-1 basis-[420px]">
          <div
            className="mb-[22px] inline-flex items-center gap-2 rounded-full px-[14px] py-[7px] text-[13px] font-bold"
            style={{ background: "rgba(123,92,224,.13)", color: "#7B5CE0" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3l1.9 4.6L18.5 9.5 13.9 11.4 12 16l-1.9-4.6L5.5 9.5l4.6-1.9z" />
              <path d="M19 15l.7 1.8 1.8.7-1.8.7L19 20l-.7-1.8-1.8-.7 1.8-.7z" />
            </svg>
            ИИ для встреч
          </div>
          <h1
            className="mb-5 font-extrabold text-[var(--color-ink)]"
            style={{ font: "800 clamp(32px,4.2vw,52px)/1.08 var(--font-golos)", letterSpacing: "-.02em", textWrap: "balance" }}
          >
            ИИ-конспект встреч без единой заметки
          </h1>
          <p
            className="mb-7 max-w-[520px] text-[var(--color-text-secondary-2)]"
            style={{ font: "400 clamp(16px,1.6vw,19px)/1.6 var(--font-golos)" }}
          >
            Бот подключается к звонку, слушает разговор и через пару минут после встречи присылает готовый протокол —
            договорённости, задачи и следующие шаги. Вам и клиенту, сразу на почту и в Telegram.
          </p>
          <a href="/" className="btn-primary inline-flex px-7 py-[15px] text-[15px]">
            Попробовать бесплатно
          </a>
        </div>
        <div className="flex min-w-[300px] flex-1 basis-[380px] justify-center">
          <div
            className="glass-card w-full max-w-[420px] rounded-[24px] p-6"
            style={{ background: "rgba(255,255,255,.72)" }}
          >
            <div className="mb-4 text-[13px] font-bold text-[var(--color-muted)]">Конспект встречи</div>
            <div className="mb-1 text-[15px] font-semibold text-[var(--color-ink)]">Консультация · сегодня, 14:00</div>
            <div className="mt-4 mb-2 text-[12px] font-bold tracking-wide text-[var(--color-muted)]">ДОГОВОРЁННОСТИ</div>
            <ul className="flex flex-col gap-2 text-[14px] text-[var(--color-text-secondary)]">
              <li>Клиент присылает бриф до пятницы</li>
              <li>Готовим смету на 3 варианта</li>
              <li>Созвониться через 2 недели</li>
            </ul>
          </div>
        </div>
      </div>

      {/* PAIN POINTS */}
      <section className="mx-auto max-w-[1200px] px-[clamp(20px,5vw,40px)] py-[clamp(40px,5vw,64px)]">
        <h2
          className="mb-8 font-extrabold text-[var(--color-ink)]"
          style={{ font: "800 clamp(24px,2.6vw,34px)/1.15 var(--font-golos)", letterSpacing: "-.015em" }}
        >
          Знакомая ситуация после каждого созвона?
        </h2>
        <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
          {[
            "Через день никто не помнит, о чём именно договорились",
            "Клиент так и не получил список задач — и переписка зависла",
            "Час записи ради пяти минут сути, которую нужно найти",
            "«Созвонимся через две недели» потерялось в чате и забылось",
          ].map((text) => (
            <div key={text} className="glass-card p-5 text-[15px] font-medium text-[var(--color-text-secondary)]">
              {text}
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mx-auto max-w-[1200px] px-[clamp(20px,5vw,40px)] py-[clamp(40px,5vw,64px)]">
        <h2
          className="mb-8 font-extrabold text-[var(--color-ink)]"
          style={{ font: "800 clamp(24px,2.6vw,34px)/1.15 var(--font-golos)", letterSpacing: "-.015em" }}
        >
          Как работает ИИ-конспект
        </h2>
        <div className="grid gap-6" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
          {[
            {
              n: "1",
              title: "Бот подключается к звонку",
              text: "Google Meet, Zoom или Яндекс Телемост — по ссылке встречи, без установки приложений.",
            },
            {
              n: "2",
              title: "Слушает и выделяет суть",
              text: "Договорённости, задачи, даты и ответственных — без ручных заметок во время разговора.",
            },
            {
              n: "3",
              title: "Присылает готовый протокол",
              text: "Вам и клиенту, сразу после встречи — на почту и в Telegram, с кнопкой записи на следующий созвон.",
            },
          ].map((step) => (
            <div key={step.n} className="glass-card p-6">
              <div
                className="mb-4 flex h-11 w-11 items-center justify-center rounded-full text-[17px] font-extrabold text-white"
                style={{ background: "linear-gradient(135deg,#8E6FE8,#7B5CE0)" }}
              >
                {step.n}
              </div>
              <div className="mb-2 text-[17px] font-bold text-[var(--color-ink)]">{step.title}</div>
              <div className="text-[14.5px] leading-relaxed text-[var(--color-text-secondary)]">{step.text}</div>
            </div>
          ))}
        </div>
      </section>

      {/* USE CASES */}
      <section className="mx-auto max-w-[1200px] px-[clamp(20px,5vw,40px)] py-[clamp(40px,5vw,64px)]">
        <h2
          className="mb-8 font-extrabold text-[var(--color-ink)]"
          style={{ font: "800 clamp(24px,2.6vw,34px)/1.15 var(--font-golos)", letterSpacing: "-.015em" }}
        >
          Для кого автоматический протокол встреч
        </h2>
        <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          {[
            ["Консультанты и коучи", "Договорённости с клиентом фиксируются сами — не нужно вести конспект во время сессии."],
            ["Менеджеры по продажам", "Возражения, договорённости и следующий шаг сделки — в одном письме сразу после звонка."],
            ["HR и рекрутеры", "Ключевые ответы кандидата и договорённости по офферу — без ручных заметок на интервью."],
            ["Преподаватели и репетиторы", "Домашние задания и темы следующего занятия фиксируются автоматически."],
          ].map(([title, text]) => (
            <div key={title} className="glass-card p-5">
              <div className="mb-2 text-[15.5px] font-bold text-[var(--color-ink)]">{title}</div>
              <div className="text-[13.5px] leading-relaxed text-[var(--color-text-secondary)]">{text}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-[880px] px-[clamp(20px,5vw,40px)] py-[clamp(40px,5vw,64px)]">
        <h2
          className="mb-8 font-extrabold text-[var(--color-ink)]"
          style={{ font: "800 clamp(24px,2.6vw,34px)/1.15 var(--font-golos)", letterSpacing: "-.015em" }}
        >
          Вопросы про ИИ-конспект
        </h2>
        <div className="flex flex-col gap-4">
          {FAQ.map((item) => (
            <div key={item.q} className="glass-card p-5">
              <div className="mb-2 text-[15.5px] font-bold text-[var(--color-ink)]">{item.q}</div>
              <div className="text-[14px] leading-relaxed text-[var(--color-text-secondary)]">{item.a}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="mx-auto max-w-[1200px] px-[clamp(20px,5vw,40px)] py-[clamp(48px,6vw,80px)]">
        <div
          className="glass-card flex flex-col items-center gap-5 p-[clamp(32px,5vw,56px)] text-center"
          style={{ background: "linear-gradient(120deg, rgba(123,92,224,.1), rgba(255,255,255,.6))" }}
        >
          <h2
            className="font-extrabold text-[var(--color-ink)]"
            style={{ font: "800 clamp(24px,2.8vw,32px)/1.2 var(--font-golos)", letterSpacing: "-.015em" }}
          >
            Первая встреча с готовым конспектом — сегодня
          </h2>
          <p className="max-w-[480px] text-[15px] text-[var(--color-text-secondary-2)]">
            7 дней тарифа Premium бесплатно. Без привязки карты, отмена в любой момент.
          </p>
          <a href="/" className="btn-primary px-8 py-[15px] text-[15px]">
            Начать бесплатно
          </a>
        </div>
      </section>

      <footer className="border-t px-[clamp(20px,5vw,40px)] py-8" style={{ borderColor: "rgba(20,30,45,.06)" }}>
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-4 text-[13px] text-[var(--color-faint)]">
          <div>© 2026 Slotix</div>
          <a href="/" className="font-semibold text-[var(--color-link)]">
            slotix.neurin.tech
          </a>
        </div>
      </footer>
    </div>
  );
}
