/**
 * Мелкие декоративные детали лендинга: рукописные подписи со стрелками и «стикеры»
 * интеграций. Именно они дают глазу зацепку между крупными блоками — без них
 * страница читается как ровная простыня одинаковых карточек.
 */

import { BRANDS, type BrandKey } from "@/components/brand-logos";

/** Рукописная подпись со стрелкой. Живёт в потоке через absolute у родителя. */
export function HandNote({
  text,
  direction = "right",
  className = "",
}: {
  text: string;
  direction?: "right" | "left";
  className?: string;
}) {
  const flip = direction === "left";
  return (
    <div aria-hidden="true" className={`pointer-events-none hidden select-none lg:flex items-center gap-2 ${className}`}>
      {flip ? null : (
        <span
          className="whitespace-pre-line text-[19px] leading-[1.15] text-[var(--color-muted)]"
          style={{ fontFamily: "var(--font-hand)", transform: "rotate(-4deg)" }}
        >
          {text}
        </span>
      )}
      <svg
        width="66"
        height="40"
        viewBox="0 0 66 40"
        fill="none"
        style={{ transform: flip ? "scaleX(-1)" : undefined, color: "var(--color-faint)" }}
      >
        <path
          d="M2 6c14 0 34 3 46 20"
          stroke="currentColor"
          strokeWidth="2.1"
          strokeLinecap="round"
          fill="none"
        />
        <path d="M40 26l9 1-3-8" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
      {flip ? (
        <span
          className="whitespace-pre-line text-[19px] leading-[1.15] text-[var(--color-muted)]"
          style={{ fontFamily: "var(--font-hand)", transform: "rotate(3deg)" }}
        >
          {text}
        </span>
      ) : null}
    </div>
  );
}

/**
 * Стикеры интеграций: белые плашки с настоящими знаками сервисов, разложенные
 * с лёгким поворотом. Список с маркерами на этом месте выглядел мёртвым — узнаваемый
 * логотип считывается мгновенно, название текстом приходится читать.
 */
const STICKERS: { key: BrandKey; tilt: number }[] = [
  { key: "telemost", tilt: -3.5 },
  { key: "zoom", tilt: 2 },
  { key: "meet", tilt: -1.5 },
  { key: "gcal", tilt: 3 },
  { key: "ycal", tilt: -2.5 },
  { key: "apple", tilt: 1.8 },
  { key: "telegram", tilt: -2 },
  { key: "mail", tilt: 2.6 },
  { key: "yookassa", tilt: -1.8 },
  { key: "sber", tilt: 2.2 },
  { key: "whatsapp", tilt: -3 },
  { key: "metrika", tilt: 1.4 },
];

export function IntegrationStickers() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-3.5 sm:gap-x-4 sm:gap-y-4">
      {STICKERS.map(({ key, tilt }) => {
        const b = BRANDS[key];
        return (
          <div
            key={key}
            className="flex items-center gap-2.5 rounded-2xl bg-white px-3.5 py-2.5 sm:px-4 sm:py-3"
            style={{
              rotate: `${tilt}deg`,
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,.9), 0 1px 2px rgba(20,40,70,.06), 0 10px 24px -10px rgba(20,40,70,.28)",
            }}
          >
            {b.node}
            <span className="text-[14px] font-bold whitespace-nowrap text-[var(--color-ink)] sm:text-[15px]">{b.name}</span>
          </div>
        );
      })}
    </div>
  );
}
