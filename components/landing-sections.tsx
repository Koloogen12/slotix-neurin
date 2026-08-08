"use client";

import { IntegrationStickers } from "@/components/landing-bits";

/**
 * Секции лендинга, общие для главной и тестового варианта. Держим в одном месте,
 * чтобы правка текста не приходилась дважды и страницы не разъезжались.
 */

const SEGMENTS = [
  {
    href: "/dlya/konsultantov",
    tag: "Консультант, ментор, эксперт",
    quote:
      "Провёл созвон, сказал «сейчас скину итоги» — и не скинул. К вечеру половину договорённостей уже не помню, а следующий клиент через десять минут. Плачу за календарь и отдельно за расшифровку, а письмо всё равно пишу руками.",
    job: "После встречи не делать ничего: итог с решениями и задачами уходит клиенту сам, и остаётся в его карточке.",
  },
  {
    href: "/dlya/psihologov",
    tag: "Психолог, психотерапевт, коуч",
    quote:
      "Десять сообщений ради одной сессии. Потом ещё отдельно напоминать про оплату — а клиенту сейчас тяжело, и просить неловко. И записывать сессии я не готова ни при каких условиях.",
    job: "Клиент записывается и оплачивает сам, буфер между сессиями соблюдается, сессии не записываются.",
  },
  {
    href: "/dlya/komand",
    tag: "Студия, центр, команда специалистов",
    quote:
      "У каждого своя ссылка, клиент путается, к кому идти. Кто сколько принёс — узнаю раз в квартал, когда кто-нибудь сведёт таблицу. Администратор вручную смотрит, у кого свободнее.",
    job: "Одна страница на студию, поток распределяется сам, загрузка и деньги по каждому видны в любой момент.",
  },
  {
    href: "/dlya/hr",
    tag: "Рекрутер, HR-команда",
    quote:
      "На согласование одного слота уходит день переписки в трёх чатах. После интервью нанимающий менеджер просит пересказ — пересказываю по памяти. К пятнице все кандидаты сливаются в одного.",
    job: "Кандидат занимает слот сам, а нанимающий менеджер получает выжимку вместо часа записи.",
  },
];

const STOP_DOING = [
  "Отвечать «а когда вам удобно?» по десять раз на клиента",
  "Просить оплату отдельным сообщением после встречи",
  "Садиться писать итоги, когда следующий созвон уже начался",
  "Платить за календарь и расшифровку двумя подписками",
  "Перечитывать переписку, чтобы вспомнить, на чём остановились",
  "Терять слот, потому что клиент забыл про встречу",
];

const START_DOING = [
  "Отдавать одну ссылку и забывать про согласование",
  "Получать деньги до встречи, а не после",
  "Заканчивать созвон — и видеть готовый итог у клиента",
  "Держать всю историю клиента в одном месте",
  "Видеть, какой канал приносит оплаты, а какой просмотры",
  "Приходить на встречу, где всё уже создано за вас",
];

const ALTERNATIVES = [
  {
    title: "«Останусь в переписке»",
    text: "Переписка кажется бесплатной, пока не посчитаешь. Шесть-десять сообщений на встречу, двадцать встреч в месяц — это два-три часа в мессенджере ежемесячно, плюс забытые оплаты и неявки. Бесплатный тариф Slotix стоит ноль и забирает это целиком.",
  },
  {
    title: "«Возьму обычный сервис записи»",
    text: "Он назначит встречу и на этом остановится. Всё, что происходит после созвона — итог, договорённости, задачи, следующий шаг — останется на вас. У нас встреча заканчивается отправленным клиенту итогом, а не строкой в календаре.",
  },
  {
    title: "«Возьму сервис конспектов»",
    text: "Он сделает итог, но ничего не знает о том, кто к вам пришёл, оплатил ли и когда следующая встреча. Сшивать его с календарём придётся руками. У нас бронь, оплата, созвон и конспект — одна запись.",
  },
  {
    title: "«Найму ассистента»",
    text: "Ассистент справится, но это 40–80 тысяч в месяц, отпуск, обучение и человек, который однажды уволится. Slotix делает ту же диспетчерскую работу за 690–1 490 ₽ и не уходит.",
  },
  {
    title: "«Останусь на зарубежном сервисе»",
    text: "Оплату российской картой он не примет, Телемоста не знает, письма попадают в спам на mail.ru, а доступ может отвалиться. Slotix написан под рунет с самого начала, данные — на серверах в России.",
  },
  {
    title: "«Попробую потом»",
    text: "Настройка занимает минут десять, карта не нужна, бесплатный тариф без ограничения по времени. Проверить на двух ближайших встречах дешевле, чем ещё квартал жить в переписке.",
  },
];

const H2 = "800 clamp(26px,3.4vw,42px)/1.13 var(--font-golos)";

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-center gap-2.5">
      <span className="h-px w-6" style={{ background: "linear-gradient(90deg,transparent,rgba(80,148,240,.5))" }} />
      <span className="text-[11.5px] font-bold tracking-[0.12em] text-[var(--color-link)] uppercase">{children}</span>
      <span className="h-px w-6" style={{ background: "linear-gradient(90deg,rgba(80,148,240,.5),transparent)" }} />
    </div>
  );
}

/** «Узнаёте себя?» — сегменты прямой речью, каждый ведёт на свою посадочную. */
export function SegmentsSection() {
  return (
    <section
      id="audiences"
      aria-labelledby="segments-h"
      className="reveal mx-auto max-w-[1200px] px-[clamp(20px,5vw,40px)] py-[clamp(36px,5vw,72px)]"
    >
      <SectionEyebrow>Сегменты</SectionEyebrow>
      <h2
        id="segments-h"
        className="m-0 mb-3 text-center font-extrabold text-[var(--color-ink)]"
        style={{ font: H2, letterSpacing: "-.02em" }}
      >
        Узнаёте себя?
      </h2>
      <p className="mx-auto m-0 mb-[clamp(24px,3vw,40px)] max-w-[560px] text-center text-[16px] leading-[1.55] text-[var(--color-text-secondary)]">
        Мы собрали Slotix вокруг четырёх ситуаций. Найдите свою — на странице сегмента разобрано, что именно меняется.
      </p>
      <div className="grid gap-[clamp(14px,2vw,22px)] md:grid-cols-2">
        {SEGMENTS.map((s, i) => (
          <article
            key={s.href}
            className="glass-elevated rim-hover grain relative flex flex-col overflow-hidden p-[clamp(24px,2.8vw,34px)]"
          >
            <span
              aria-hidden="true"
              className="tnum pointer-events-none absolute -top-3 right-4 text-[76px] leading-none font-extrabold select-none"
              style={{ color: "rgba(80,148,240,.07)" }}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className="mb-4 flex items-center gap-3">
              <span
                className="flex h-9 w-9 flex-none items-center justify-center rounded-xl text-[13px] font-extrabold text-white"
                style={{
                  background: "var(--color-primary-gradient)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,.45), 0 8px 18px -6px rgba(80,148,240,.55)",
                }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="m-0 text-[15px] font-bold text-[var(--color-ink)]">{s.tag}</h3>
            </div>
            <blockquote className="relative m-0 mb-5 pl-9 text-[16px] leading-[1.62] text-[var(--color-text-secondary)] italic">
              <span
                aria-hidden="true"
                className="absolute top-[-6px] left-0 text-[40px] leading-none font-extrabold select-none"
                style={{ color: "rgba(80,148,240,.28)" }}
              >
                &laquo;
              </span>
              {s.quote}
            </blockquote>
            <hr className="hairline mb-4" />
            <div className="mt-auto">
              <div className="mb-2 text-[11px] font-bold tracking-[0.09em] text-[var(--color-faint)] uppercase">
                Какую задачу решите
              </div>
              <p className="m-0 mb-4 text-[15px] leading-[1.55] text-[var(--color-ink)]">{s.job}</p>
              <a
                href={s.href}
                className="-mx-2 inline-flex min-h-[44px] items-center gap-[6px] px-2 text-[14px] font-bold"
                style={{ color: "var(--color-link)" }}
              >
                Подробнее для этой ситуации
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

/** «Что изменится» — перестанете / начнёте. */
export function BeforeAfterSection() {
  return (
    <section
      aria-labelledby="change-h"
      className="reveal mx-auto max-w-[1200px] px-[clamp(20px,5vw,40px)] py-[clamp(36px,5vw,72px)]"
    >
      <SectionEyebrow>До и после</SectionEyebrow>
      <h2
        id="change-h"
        className="m-0 mb-[clamp(24px,3vw,44px)] text-center font-extrabold text-[var(--color-ink)]"
        style={{ font: H2, letterSpacing: "-.02em" }}
      >
        Что изменится в вашей неделе
      </h2>
      <div className="grid gap-[clamp(14px,2vw,22px)] md:grid-cols-2">
        <div className="glass-elevated grain relative p-[clamp(24px,3vw,38px)]">
          <h3 className="m-0 mb-5 text-[20px] font-extrabold text-[var(--color-ink)]">Перестанете</h3>
          <ul className="m-0 flex list-none flex-col gap-3.5 p-0">
            {STOP_DOING.map((t) => (
              <li key={t} className="flex items-start gap-3">
                <span
                  className="mt-[3px] flex h-[22px] w-[22px] flex-none items-center justify-center rounded-full text-[13px] font-bold"
                  style={{ background: "rgba(232,86,86,.13)", color: "#D14343" }}
                >
                  ×
                </span>
                <span className="text-[15.5px] leading-[1.5] text-[var(--color-text-secondary)]">{t}</span>
              </li>
            ))}
          </ul>
        </div>
        <div
          className="grain relative overflow-hidden rounded-[26px] p-[clamp(24px,3vw,38px)]"
          style={{
            background: "linear-gradient(150deg,#12A66B,#0E8F5C 60%,#0B7A4E)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,.28), 0 28px 60px -20px rgba(11,122,78,.5)",
          }}
        >
          <h3 className="m-0 mb-5 text-[20px] font-extrabold text-white">Начнёте</h3>
          <ul className="m-0 flex list-none flex-col gap-3.5 p-0">
            {START_DOING.map((t) => (
              <li key={t} className="flex items-start gap-3">
                <span
                  className="mt-[3px] flex h-[22px] w-[22px] flex-none items-center justify-center rounded-full"
                  style={{ background: "rgba(255,255,255,.24)" }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </span>
                <span className="text-[15.5px] leading-[1.5] font-medium text-white">{t}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/** «Почему мы, а не…» — разбор альтернатив, включая «ничего не делать». */
export function AlternativesSection() {
  return (
    <section
      aria-labelledby="alt-h"
      className="reveal mx-auto max-w-[1200px] px-[clamp(20px,5vw,40px)] py-[clamp(36px,5vw,72px)]"
    >
      <SectionEyebrow>Альтернативы</SectionEyebrow>
      <h2
        id="alt-h"
        className="m-0 mb-3 text-center font-extrabold text-[var(--color-ink)]"
        style={{ font: H2, letterSpacing: "-.02em" }}
      >
        Почему мы, а не…
      </h2>
      <p className="mx-auto m-0 mb-[clamp(24px,3vw,40px)] max-w-[560px] text-center text-[16px] leading-[1.55] text-[var(--color-text-secondary)]">
        Честно про варианты, которые вы рассматриваете вместо нас.
      </p>
      <div className="grid gap-[clamp(14px,2vw,22px)] md:grid-cols-2 lg:grid-cols-3">
        {ALTERNATIVES.map((a) => (
          <article key={a.title} className="glass-elevated rim-hover relative overflow-hidden p-[clamp(22px,2.6vw,30px)]">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -top-6 -right-1 text-[92px] leading-none font-extrabold select-none"
              style={{ color: "rgba(20,40,70,.045)" }}
            >
              ?
            </span>
            <h3 className="relative m-0 mb-2.5 text-[16.5px] leading-[1.3] font-bold text-[var(--color-ink)]">{a.title}</h3>
            <p className="relative m-0 text-[15px] leading-[1.58] text-[var(--color-text-secondary)]">{a.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

/**
 * Тёмная панель со «стикерами» сервисов.
 *
 * `compact` — когда панель идёт сразу под другим блоком про интеграции: два заголовка
 * об одном и том же подряд читаются как ошибка вёрстки, поэтому там панель работает
 * визуальным доказательством, а не отдельной секцией.
 */
export function IntegrationsPanel({ compact = false }: { compact?: boolean }) {
  return (
    <section
      aria-labelledby={compact ? undefined : "int-h"}
      aria-label={compact ? "Логотипы поддерживаемых сервисов" : undefined}
      className="reveal mx-auto max-w-[1200px] px-[clamp(20px,5vw,40px)] pb-[clamp(36px,5vw,72px)]"
    >
      <div
        className="grain relative overflow-hidden rounded-[32px] px-[clamp(24px,4vw,64px)] py-[clamp(36px,5vw,64px)]"
        style={{
          background: "linear-gradient(150deg,#1B3A63,#2B5C99 55%,#3D77BF)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,.22), 0 30px 70px -24px rgba(20,40,70,.42)",
        }}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-[35%] -right-[18%] h-[70%] w-[55%] rounded-full"
          style={{ background: "radial-gradient(circle,rgba(102,166,255,.55),transparent 70%)", filter: "blur(48px)" }}
        />
        <div className="relative">
          <div className="mb-3 flex items-center justify-center gap-2.5">
            <span className="h-px w-6" style={{ background: "linear-gradient(90deg,transparent,rgba(255,255,255,.55))" }} />
            <span className="text-[11.5px] font-bold tracking-[0.12em] text-white/70 uppercase">
              {compact ? "Уже подключается" : "Интеграции"}
            </span>
            <span className="h-px w-6" style={{ background: "linear-gradient(90deg,rgba(255,255,255,.55),transparent)" }} />
          </div>
          {compact ? (
            <p className="mx-auto m-0 mb-[clamp(24px,3vw,40px)] max-w-[520px] text-center text-[16px] leading-[1.55] text-white/80">
              Подключается в пару кликов и работает дальше само.
            </p>
          ) : (
            <>
              <h2
                id="int-h"
                className="m-0 mb-3 text-center font-extrabold text-white"
                style={{ font: H2, letterSpacing: "-.02em" }}
              >
                Работает с вашими сервисами
              </h2>
              <p className="mx-auto m-0 mb-[clamp(28px,3.5vw,48px)] max-w-[520px] text-center text-[16px] leading-[1.55] text-white/80">
                Календари, созвоны, оплаты и уведомления — то, чем вы уже пользуетесь, менять не нужно.
              </p>
            </>
          )}
          <IntegrationStickers />
        </div>
      </div>
    </section>
  );
}
