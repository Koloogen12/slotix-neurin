/**
 * Макеты интерфейса для лендинга. Собраны из тех же токенов, что реальный кабинет,
 * поэтому человек видит на лендинге ровно то, что получит внутри.
 *
 * Плоская карточка на плоском фоне читается как заглушка, поэтому каждый макет —
 * это композиция: подсветка под стеклом, основная карточка и «спутники» —
 * мелкие плашки, вынесенные за её край. Именно перекрытие краёв и разная глубина
 * теней дают ощущение объёма; без них любое количество деталей внутри карточки
 * остаётся плоским.
 *
 * Движение — только transform/opacity, и целиком отключается при
 * prefers-reduced-motion (см. globals.css).
 */

import { BRANDS } from "@/components/brand-logos";

/** Знак сервиса на круглой белой подложке — «наклейка» поверх макета. */
function BrandBubble({
  brand,
  className,
  style,
}: {
  brand: keyof typeof BRANDS;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span
      className={`flex h-[46px] w-[46px] items-center justify-center rounded-2xl bg-white ${className ?? ""}`}
      style={{
        boxShadow: "inset 0 1px 0 rgba(255,255,255,.9), 0 2px 4px rgba(20,40,70,.06), 0 14px 28px -10px rgba(20,40,70,.32)",
        ...style,
      }}
    >
      {BRANDS[brand].node}
    </span>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 text-[11.5px] font-bold tracking-[0.09em] text-[var(--color-muted)] uppercase">{children}</div>
  );
}

function Avatar({ initials, size = 28 }: { initials: string; size?: number }) {
  return (
    <span
      className="flex flex-none items-center justify-center rounded-full font-bold text-white"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        background: "var(--color-primary-gradient)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,.45), 0 4px 10px rgba(80,148,240,.35)",
      }}
    >
      {initials}
    </span>
  );
}

function Chip({
  label,
  bg,
  color,
  dot,
  pulse,
}: {
  label: string;
  bg: string;
  color: string;
  dot: string;
  pulse?: boolean;
}) {
  return (
    <span
      className="inline-flex flex-none items-center gap-2 rounded-full px-3 py-[5px] text-[12px] font-semibold whitespace-nowrap"
      style={{ background: bg, color, boxShadow: "inset 0 1px 0 rgba(255,255,255,.7)" }}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${pulse ? "pulse-dot" : ""}`} style={{ background: dot }} />
      {label}
    </span>
  );
}

/** Хром браузера вокруг публичной страницы — сразу читается как настоящий продукт. */
function BrowserFrame({ url, children }: { url: string; children: React.ReactNode }) {
  return (
    <div className="glass-elevated grain relative overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 py-3">
        <div className="flex flex-none gap-1.5">
          {["#F0A8A8", "#F2D08A", "#A8DDB5"].map((c) => (
            <span key={c} className="h-[9px] w-[9px] rounded-full" style={{ background: c }} />
          ))}
        </div>
        <div
          className="flex min-w-0 flex-1 items-center gap-1.5 rounded-lg px-2.5 py-[5px]"
          style={{ background: "rgba(255,255,255,.7)", border: "1px solid rgba(20,40,70,.07)" }}
        >
          <svg className="flex-none text-[var(--color-success)]" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6">
            <rect x="4" y="10" width="16" height="11" rx="2" />
            <path d="M8 10V7a4 4 0 0 1 8 0v3" />
          </svg>
          <span className="truncate text-[12.5px] font-medium text-[var(--color-text-secondary)]">{url}</span>
        </div>
      </div>
      <hr className="hairline" />
      <div className="p-[clamp(18px,2.2vw,24px)]">{children}</div>
    </div>
  );
}

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const AVAILABLE = [11, 12, 14, 18, 19, 20, 25, 26];
const SELECTED = 19;

/** Публичная страница записи глазами клиента. */
export function BookingPageMockup() {
  return (
    <div className="relative w-full max-w-[430px] sm:max-w-[506px] sm:px-[38px]" aria-hidden="true">
      <div className="aura aura-blue" style={{ inset: "12% -18% 28% -22%" }} />
      <div className="aura aura-green" style={{ inset: "56% 8% -8% 34%" }} />

      <BrowserFrame url="slotix.neurin.tech/marina">
        <div className="mb-5 flex items-center gap-3">
          <Avatar initials="МК" size={44} />
          <div className="min-w-0">
            <div className="truncate text-[15.5px] font-bold text-[var(--color-ink)]">Марина Ковалёва</div>
            <div className="truncate text-[13px] text-[var(--color-text-secondary)]">Продуктовый консультант</div>
          </div>
        </div>

        <div className="glass-inset mb-5 flex flex-wrap items-center gap-x-2 gap-y-1 px-4 py-3">
          <span className="text-[14px] font-semibold text-[var(--color-ink)]">Разбор продукта</span>
          <span className="text-[13px] text-[var(--color-muted)]">· 60 мин</span>
          <span className="tnum ml-auto text-[15px] font-bold text-[var(--color-ink)]">5 000 ₽</span>
        </div>

        <div className="mb-2.5 flex items-center justify-between">
          <span className="text-[13.5px] font-bold text-[var(--color-ink)]">Август 2026</span>
          <span className="text-[12.5px] font-medium text-[var(--color-text-secondary)]">Europe/Moscow</span>
        </div>
        <div className="mb-1 grid grid-cols-7 gap-1">
          {WEEKDAYS.map((w) => (
            <div key={w} className="py-1 text-center text-[10.5px] font-bold tracking-wide text-[var(--color-faint)] uppercase">
              {w}
            </div>
          ))}
        </div>
        <div className="mb-5 grid grid-cols-7 gap-1">
          {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
            const free = AVAILABLE.includes(day);
            const active = day === SELECTED;
            return (
              <div
                key={day}
                className="tnum flex h-[30px] items-center justify-center rounded-[10px] text-[12.5px] font-semibold"
                style={
                  active
                    ? {
                        background: "var(--color-primary-gradient)",
                        color: "#fff",
                        boxShadow: "inset 0 1px 0 rgba(255,255,255,.45), 0 8px 18px -4px rgba(80,148,240,.55)",
                      }
                    : free
                      ? {
                          background: "rgba(80,148,240,.13)",
                          color: "#2F6FD0",
                          boxShadow: "inset 0 1px 0 rgba(255,255,255,.6)",
                        }
                      : { color: "var(--color-faint)" }
                }
              >
                {day}
              </div>
            );
          })}
        </div>

        <Eyebrow>Свободное время</Eyebrow>
        <div className="grid grid-cols-3 gap-2">
          {["11:00", "13:30", "16:00"].map((slot, i) => (
            <div
              key={slot}
              className="tnum rounded-xl py-2.5 text-center text-[13.5px] font-semibold"
              style={
                i === 1
                  ? {
                      background: "var(--color-primary-gradient)",
                      color: "#fff",
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,.45), 0 10px 22px -6px rgba(80,148,240,.5)",
                    }
                  : {
                      border: "1px solid rgba(20,40,70,.08)",
                      background: "rgba(255,255,255,.6)",
                      color: "var(--color-text-secondary)",
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,.85)",
                    }
              }
            >
              {slot}
            </div>
          ))}
        </div>
      </BrowserFrame>

      <BrandBubble brand="telemost" className="float-fast absolute top-[3%] right-[6%] hidden sm:flex" style={{ rotate: "-7deg" }} />
      <BrandBubble brand="telegram" className="float-slow absolute bottom-[2%] left-[9%] hidden sm:flex" style={{ rotate: "8deg" }} />

      {/* спутник: оплата прошла */}
      <div
        className="glass-elevated float-mid absolute right-0 bottom-[11%] hidden items-center gap-2.5 px-3.5 py-2.5 sm:flex"
        style={{ borderRadius: 16, translate: "44% 0" }}
      >
        <span
          className="flex h-8 w-8 flex-none items-center justify-center rounded-xl"
          style={{ background: "linear-gradient(135deg,#4FD6A0,#3FCB6E)", boxShadow: "0 6px 14px rgba(63,203,110,.4)" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </span>
        <div>
          <div className="text-[12.5px] font-bold text-[var(--color-ink)]">Оплата прошла</div>
          <div className="tnum text-[11.5px] text-[var(--color-muted)]">5 000 ₽ · до встречи</div>
        </div>
      </div>

      {/* спутник: ноль сообщений */}
      <div
        className="glass-elevated float-slow absolute left-0 top-[11%] hidden px-3.5 py-2.5 sm:block"
        style={{ borderRadius: 16, translate: "-44% 0" }}
      >
        <div className="tnum text-[20px] leading-none font-extrabold text-[var(--color-ink)]">0</div>
        <div className="mt-1 text-[11px] font-semibold tracking-wide text-[var(--color-muted)] uppercase">сообщений</div>
      </div>
    </div>
  );
}

/** Карточка готового конспекта — экран «Конспекты» в кабинете. */
export function NoteCardMockup() {
  return (
    <div className="relative w-full max-w-[430px] sm:max-w-[506px] sm:px-[38px]" aria-hidden="true">
      <div className="aura aura-violet" style={{ inset: "-8% -20% 40% 10%" }} />
      <div className="aura aura-blue" style={{ inset: "40% 12% -10% -18%" }} />

      <div className="glass-elevated grain relative p-[clamp(20px,2.4vw,26px)]">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[16.5px] leading-tight font-bold text-[var(--color-ink)]">Стратегия запуска, 2-я сессия</div>
            <div className="tnum mt-1 text-[12.5px] text-[var(--color-text-secondary)]">14 августа, 15:00 · Яндекс&nbsp;Телемост</div>
          </div>
          <Chip label="Готово" bg="rgba(63,203,110,.16)" color="#2FA85A" dot="#3FCB6E" />
        </div>

        <div className="glass-inset mb-5 p-4 text-[14px] leading-relaxed text-[var(--color-text-secondary)]">
          Разобрали воронку: основная потеря на шаге оплаты. Договорились сузить оффер до одного сегмента и переписать
          страницу тарифов до следующей встречи.
        </div>

        <Eyebrow>Договорённости</Eyebrow>
        <div className="mb-5 flex flex-col gap-2.5">
          {["Сужаем оффер до консультантов", "Тарифы переписываем под один сценарий"].map((d) => (
            <div key={d} className="flex items-start gap-3">
              <span
                className="mt-[1px] flex h-[19px] w-[19px] flex-none items-center justify-center rounded-full"
                style={{ background: "rgba(63,203,110,.18)" }}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#2FA85A" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </span>
              <span className="text-[14px] leading-snug text-[var(--color-text-secondary)]">{d}</span>
            </div>
          ))}
        </div>

        <Eyebrow>Задачи</Eyebrow>
        <div className="flex flex-col gap-2.5">
          {[
            { who: "МК", name: "Марина", task: "Переписать страницу тарифов", due: "до 20 августа" },
            { who: "АЛ", name: "Алексей", task: "Собрать данные по отвалам на оплате", due: "до 18 августа" },
          ].map((t) => (
            <div key={t.name} className="glass-inset p-3.5">
              <div className="mb-2 flex items-center gap-2.5">
                <Avatar initials={t.who} size={26} />
                <span className="text-[13.5px] font-semibold text-[var(--color-ink)]">{t.name}</span>
              </div>
              <div className="pl-[36px] text-[13.5px] leading-snug text-[var(--color-text-secondary)]">
                {t.task}
                <span className="tnum ml-2 text-[12px] font-medium text-[var(--color-muted)]">· {t.due}</span>
              </div>
            </div>
          ))}
        </div>

        <div
          className="mt-5 flex items-center gap-3 rounded-2xl p-3.5"
          style={{
            background: "linear-gradient(135deg,rgba(80,148,240,.11),rgba(80,148,240,.05))",
            border: "1px solid rgba(80,148,240,.24)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,.7)",
          }}
        >
          <svg className="flex-none text-[var(--color-link)]" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 1 1-3-6.7L21 8" />
            <path d="M21 3v5h-5" />
          </svg>
          <div className="text-[13.5px] leading-snug text-[var(--color-text-secondary)]">
            Предложить следующую встречу через 2&nbsp;недели
          </div>
        </div>
      </div>

      <BrandBubble brand="mail" className="float-mid absolute bottom-[3%] right-[8%] hidden sm:flex" style={{ rotate: "6deg" }} />

      {/* спутник: доставка итога */}
      <div
        className="glass-elevated float-fast absolute right-0 top-[4%] hidden items-center gap-2.5 px-3.5 py-2.5 sm:flex"
        style={{ borderRadius: 16, translate: "44% 0" }}
      >
        <span
          className="flex h-8 w-8 flex-none items-center justify-center rounded-xl"
          style={{ background: "var(--color-primary-gradient)", boxShadow: "0 6px 14px rgba(80,148,240,.4)" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4z" />
          </svg>
        </span>
        <div>
          <div className="text-[12.5px] font-bold text-[var(--color-ink)]">Итог отправлен</div>
          <div className="text-[11.5px] text-[var(--color-muted)]">клиенту и вам</div>
        </div>
      </div>

      {/* спутник: время до готовности */}
      <div
        className="glass-elevated float-slow absolute left-0 bottom-[18%] hidden px-3.5 py-2.5 sm:block"
        style={{ borderRadius: 16, translate: "-44% 0" }}
      >
        <div className="tnum text-[20px] leading-none font-extrabold text-[var(--color-ink)]">
          3<span className="ml-0.5 text-[12px] font-bold text-[var(--color-muted)]">мин</span>
        </div>
        <div className="mt-1 text-[11px] font-semibold tracking-wide text-[var(--color-muted)] uppercase">после звонка</div>
      </div>
    </div>
  );
}

/** Как поток распределяется между специалистами студии. */
export function TeamRoutingMockup() {
  const people = [
    { initials: "АЛ", name: "Алексей", load: 82, meetings: 14 },
    { initials: "МК", name: "Марина", load: 45, meetings: 8 },
    { initials: "ДС", name: "Дарья", load: 28, meetings: 5, next: true },
  ];
  return (
    <div className="relative w-full max-w-[430px] sm:max-w-[506px] sm:px-[38px]" aria-hidden="true">
      <div className="aura aura-blue" style={{ inset: "-6% 6% 34% -20%" }} />
      <div className="aura aura-green" style={{ inset: "48% -16% -6% 20%" }} />

      <div className="glass-elevated grain relative p-[clamp(20px,2.4vw,26px)]">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <div className="text-[16.5px] font-bold text-[var(--color-ink)]">Студия «Ясность»</div>
            <div className="mt-0.5 text-[12.5px] text-[var(--color-text-secondary)]">Загрузка на этой неделе</div>
          </div>
          <Chip label="Идёт запись" bg="rgba(80,148,240,.13)" color="#2F6FD0" dot="#5094F0" pulse />
        </div>

        <div className="flex flex-col gap-2.5">
          {people.map((p, i) => (
            <div key={p.name} className="glass-inset p-3.5">
              <div className="mb-2.5 flex items-center gap-2.5">
                <Avatar initials={p.initials} size={26} />
                <span className="text-[13.5px] font-semibold text-[var(--color-ink)]">{p.name}</span>
                <span className="tnum text-[12.5px] text-[var(--color-muted)]">{p.meetings} встреч</span>
                <span className="tnum ml-auto text-[12.5px] font-bold text-[var(--color-ink)]">{p.load}%</span>
              </div>
              <div className="h-[7px] w-full overflow-hidden rounded-full" style={{ background: "rgba(20,40,70,.07)" }}>
                <div
                  className="bar-fill h-full rounded-full"
                  style={{
                    width: `${p.load}%`,
                    animationDelay: `${0.15 * i}s`,
                    background: p.next ? "linear-gradient(90deg,#4FD6A0,#3FCB6E)" : "var(--color-primary-gradient)",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,.4)",
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        <div
          className="mt-4 flex items-center gap-3 rounded-2xl p-3.5"
          style={{
            background: "linear-gradient(135deg,rgba(63,203,110,.14),rgba(63,203,110,.05))",
            border: "1px solid rgba(63,203,110,.28)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,.7)",
          }}
        >
          <svg className="flex-none" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#2FA85A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 2L3 14h9l-1 8 10-12h-9z" />
          </svg>
          <div className="text-[13.5px] leading-snug text-[var(--color-text-secondary)]">
            Запись «к любому свободному» — слот ушёл Дарье
          </div>
        </div>
      </div>

      {/* спутник: очередь на неделю */}
      <div
        className="glass-elevated float-mid absolute right-0 top-[8%] hidden px-3.5 py-2.5 sm:block"
        style={{ borderRadius: 16, translate: "44% 0" }}
      >
        <div className="tnum text-[20px] leading-none font-extrabold text-[var(--color-ink)]">27</div>
        <div className="mt-1 text-[11px] font-semibold tracking-wide text-[var(--color-muted)] uppercase">встреч в неделю</div>
      </div>

      {/* спутник: стопка аватаров */}
      <div
        className="glass-elevated float-slow absolute left-0 bottom-[14%] hidden items-center gap-2.5 px-3.5 py-2.5 sm:flex"
        style={{ borderRadius: 16, translate: "-44% 0" }}
      >
        <div className="flex -space-x-2">
          {["АЛ", "МК", "ДС"].map((a) => (
            <span key={a} className="ring-2 ring-white/90 rounded-full">
              <Avatar initials={a} size={24} />
            </span>
          ))}
        </div>
        <div className="text-[11px] font-semibold tracking-wide text-[var(--color-muted)] uppercase">одна ссылка</div>
      </div>
    </div>
  );
}

/** Идущий созвон: бот виден участникам отдельной строкой — так это и работает. */
export function LiveCallMockup() {
  const people = [
    { initials: "МК", name: "Марина Ковалёва", role: "организатор" },
    { initials: "АЛ", name: "Алексей Литвин", role: "клиент" },
  ];
  return (
    <div className="relative w-full max-w-[430px] sm:max-w-[506px] sm:px-[38px]" aria-hidden="true">
      <div className="aura aura-blue" style={{ inset: "-4% -16% 36% 8%" }} />
      <div className="aura aura-violet" style={{ inset: "44% 10% -8% -16%" }} />

      <div className="glass-elevated grain relative overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-[26px] w-[26px] items-center justify-center rounded-lg bg-[#1A1C1E]">
              <span className="h-2 w-2 rounded-full bg-white" />
            </span>
            <span className="text-[12.5px] font-bold text-[var(--color-ink)]">Яндекс&nbsp;Телемост</span>
          </div>
          <span className="tnum flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--color-danger)]">
            <span className="pulse-dot h-1.5 w-1.5 rounded-full" style={{ background: "var(--color-danger)" }} />
            32:14
          </span>
        </div>
        <hr className="hairline" />

        <div className="p-[clamp(18px,2.2vw,24px)]">
          {/* окно видео */}
          <div
            className="relative mb-4 flex h-[128px] items-center justify-center overflow-hidden rounded-2xl"
            style={{ background: "linear-gradient(140deg,#243B55,#3A5B7D)" }}
          >
            <div className="flex gap-4">
              {people.map((p) => (
                <span
                  key={p.initials}
                  className="flex h-14 w-14 items-center justify-center rounded-full text-[16px] font-bold text-white"
                  style={{ background: "var(--color-primary-gradient)", boxShadow: "0 8px 20px rgba(0,0,0,.28)" }}
                >
                  {p.initials}
                </span>
              ))}
            </div>
            <span className="absolute bottom-2.5 left-3 rounded-lg bg-black/45 px-2 py-1 text-[11px] font-semibold text-white">
              Разбор продукта
            </span>
          </div>

          <Eyebrow>Участники · 3</Eyebrow>
          <div className="flex flex-col gap-2">
            {people.map((p) => (
              <div key={p.initials} className="glass-inset flex items-center gap-2.5 px-3.5 py-2.5">
                <Avatar initials={p.initials} size={26} />
                <span className="text-[13.5px] font-semibold text-[var(--color-ink)]">{p.name}</span>
                <span className="ml-auto text-[12px] text-[var(--color-muted)]">{p.role}</span>
              </div>
            ))}
            {/* строка бота — главное, что должен увидеть человек */}
            <div
              className="flex items-center gap-2.5 rounded-2xl px-3.5 py-2.5"
              style={{
                background: "linear-gradient(135deg,rgba(80,148,240,.13),rgba(80,148,240,.06))",
                border: "1px solid rgba(80,148,240,.3)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,.7)",
              }}
            >
              <span
                className="flex h-[26px] w-[26px] flex-none items-center justify-center rounded-full"
                style={{ background: "var(--color-primary-gradient)" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" />
                  <path d="M19 10v1a7 7 0 0 1-14 0v-1M12 18v4" />
                </svg>
              </span>
              <span className="text-[13.5px] font-semibold text-[var(--color-ink)]">Slotix · конспект</span>
              <Chip label="слушает" bg="rgba(80,148,240,.16)" color="#2F6FD0" dot="#5094F0" pulse />
            </div>
          </div>
        </div>
      </div>

      <div
        className="glass-elevated float-slow absolute left-0 bottom-[16%] hidden px-3.5 py-2.5 sm:block"
        style={{ borderRadius: 16, translate: "-44% 0" }}
      >
        <div className="text-[12.5px] font-bold text-[var(--color-ink)]">Вы ничего</div>
        <div className="text-[12.5px] font-bold text-[var(--color-ink)]">не нажимаете</div>
      </div>
    </div>
  );
}

/**
 * Та же страница записи, но в телефоне: в герое она уже показана в браузере, и второй
 * раз тем же кадром читалась бы как недоделка. Заодно честно: большинство клиентов
 * открывают ссылку именно с телефона.
 */
export function PhoneBookingMockup() {
  return (
    <div className="relative flex w-full max-w-[430px] justify-center sm:max-w-[506px] sm:px-[38px]" aria-hidden="true">
      <div className="aura aura-blue" style={{ inset: "8% 4% 30% 4%" }} />
      <div className="aura aura-green" style={{ inset: "52% 14% -4% 18%" }} />

      <div
        className="relative w-[268px] rounded-[38px] p-[9px]"
        style={{
          background: "linear-gradient(160deg,#2A3340,#131920)",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,.22), 0 2px 6px rgba(20,40,70,.1), 0 26px 54px -14px rgba(20,40,70,.4)",
        }}
      >
        <div className="relative overflow-hidden rounded-[30px] bg-white">
          {/* вырез камеры */}
          <div className="absolute top-2 left-1/2 z-10 h-[18px] w-[68px] -translate-x-1/2 rounded-full bg-[#131920]" />
          <div className="px-4 pt-9 pb-4">
            <div className="mb-4 flex items-center gap-2.5">
              <Avatar initials="МК" size={36} />
              <div className="min-w-0">
                <div className="truncate text-[13px] font-bold text-[var(--color-ink)]">Марина Ковалёва</div>
                <div className="truncate text-[11px] text-[var(--color-muted)]">Продуктовый консультант</div>
              </div>
            </div>

            <div className="glass-inset mb-3.5 px-3 py-2.5">
              <div className="text-[12.5px] font-semibold text-[var(--color-ink)]">Разбор продукта</div>
              <div className="tnum mt-0.5 flex items-center gap-2 text-[11.5px] text-[var(--color-muted)]">
                60 мин <span className="ml-auto text-[12.5px] font-bold text-[var(--color-ink)]">5 000 ₽</span>
              </div>
            </div>

            <div className="mb-1 grid grid-cols-7 gap-[3px]">
              {WEEKDAYS.map((w) => (
                <div key={w} className="text-center text-[8.5px] font-bold text-[var(--color-faint)] uppercase">
                  {w}
                </div>
              ))}
            </div>
            <div className="mb-3.5 grid grid-cols-7 gap-[3px]">
              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
                const free = AVAILABLE.includes(day);
                const active = day === SELECTED;
                return (
                  <div
                    key={day}
                    className="tnum flex h-[22px] items-center justify-center rounded-[7px] text-[10px] font-semibold"
                    style={
                      active
                        ? { background: "var(--color-primary-gradient)", color: "#fff" }
                        : free
                          ? { background: "rgba(80,148,240,.13)", color: "#2F6FD0" }
                          : { color: "var(--color-faint)" }
                    }
                  >
                    {day}
                  </div>
                );
              })}
            </div>

            <div className="mb-3 grid grid-cols-3 gap-1.5">
              {["11:00", "13:30", "16:00"].map((slot, i) => (
                <div
                  key={slot}
                  className="tnum rounded-lg py-1.5 text-center text-[11px] font-semibold"
                  style={
                    i === 1
                      ? { background: "var(--color-primary-gradient)", color: "#fff" }
                      : { border: "1px solid rgba(20,40,70,.08)", background: "rgba(255,255,255,.6)", color: "var(--color-text-secondary)" }
                  }
                >
                  {slot}
                </div>
              ))}
            </div>

            <div
              className="rounded-xl py-2.5 text-center text-[12.5px] font-bold text-white"
              style={{ background: "var(--color-primary-gradient)", boxShadow: "0 8px 18px -6px rgba(80,148,240,.6)" }}
            >
              Забронировать
            </div>
          </div>
        </div>
      </div>

      <div
        className="glass-elevated float-mid absolute top-[14%] right-0 hidden items-center gap-2.5 px-3.5 py-2.5 sm:flex"
        style={{ borderRadius: 16, translate: "34% 0" }}
      >
        <span
          className="flex h-8 w-8 flex-none items-center justify-center rounded-xl"
          style={{ background: "linear-gradient(135deg,#4FD6A0,#3FCB6E)", boxShadow: "0 6px 14px rgba(63,203,110,.4)" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </span>
        <div>
          <div className="text-[12.5px] font-bold text-[var(--color-ink)]">Слот занят</div>
          <div className="text-[11.5px] text-[var(--color-muted)]">оплата прошла</div>
        </div>
      </div>

      <BrandBubble brand="telemost" className="float-slow absolute bottom-[9%] left-0 hidden sm:flex" style={{ rotate: "-8deg", translate: "26% 0" }} />
    </div>
  );
}
