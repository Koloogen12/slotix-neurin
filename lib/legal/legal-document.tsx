import Link from "next/link";

export type LegalBlock =
  | { type: "h2"; text: string }
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  /** Врезка — для оговорок, которые должны быть заметны при беглом чтении (например,
   * статус переноса обработки на российские решения). */
  | { type: "note"; text: string }
  | { type: "table"; head: string[]; rows: string[][] };

/** Якорь для оглавления: заголовки нумерованные, поэтому берём номер раздела. */
function anchorFor(text: string): string {
  const num = text.match(/^(\d+)\./);
  return num ? `section-${num[1]}` : text.toLowerCase().replace(/[^a-zа-я0-9]+/gi, "-").slice(0, 40);
}

function Block({ block }: { block: LegalBlock }) {
  if (block.type === "h2") {
    return (
      <h2
        id={anchorFor(block.text)}
        className="mt-10 mb-3.5 scroll-mt-6 border-t pt-7 text-xl font-bold tracking-[-.01em] text-[var(--color-ink)]"
        style={{ borderColor: "rgba(140,150,165,.16)" }}
      >
        {block.text}
      </h2>
    );
  }
  if (block.type === "note") {
    return (
      <div
        className="mb-4 rounded-xl px-4 py-3 text-[14px] leading-[1.6]"
        style={{ background: "rgba(80,148,240,.09)", color: "var(--color-text-secondary-2)", borderLeft: "3px solid var(--color-primary)" }}
      >
        {block.text}
      </div>
    );
  }
  if (block.type === "table") {
    return (
      <div className="mb-5 overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-[14px]">
          <thead>
            <tr>
              {block.head.map((h) => (
                <th
                  key={h}
                  className="border-b px-3 py-2.5 text-left align-bottom font-semibold text-[var(--color-ink)]"
                  style={{ borderColor: "rgba(140,150,165,.35)" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row) => (
              <tr key={row.join("|")}>
                {row.map((cell, ci) => (
                  <td
                    // biome-ignore lint/suspicious/noArrayIndexKey: fixed-width legal table, columns never reorder
                    key={ci}
                    className="border-b px-3 py-2.5 align-top leading-[1.55] text-[var(--color-text-secondary-2)]"
                    style={{ borderColor: "rgba(140,150,165,.16)" }}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  if (block.type === "ul") {
    return (
      <ul className="mb-3.5 list-disc pl-5.5">
        {block.items.map((item) => (
          <li key={item} className="mb-1.5 text-[15px] leading-[1.65] text-[var(--color-text-secondary-2)]">
            {item}
          </li>
        ))}
      </ul>
    );
  }
  return <p className="mb-3.5 text-[15px] leading-[1.65] text-[var(--color-text-secondary-2)]">{block.text}</p>;
}

export function LegalDocument({
  title,
  effectiveDate,
  intro,
  blocks,
  requisites,
}: {
  title: string;
  effectiveDate: string;
  intro?: string;
  blocks: LegalBlock[];
  requisites: string[];
}) {
  return (
    <div className="flex-1 px-[clamp(20px,5vw,40px)] py-[clamp(24px,4vw,56px)]">
      <div className="mx-auto max-w-[900px]">
        <Link
          href="/"
          className="mb-7 inline-flex items-center gap-2 text-[14px] font-semibold text-[var(--color-link)] no-underline"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Slotix
        </Link>

        <div className="glass-card p-[clamp(28px,5vw,52px)]">
          <h1 className="m-0 mb-2 font-extrabold text-[var(--color-ink)]" style={{ font: "800 clamp(24px,3vw,34px)/1.2 var(--font-golos)", letterSpacing: "-.02em" }}>
            {title}
          </h1>
          <div className="mb-7 text-[14px] font-medium text-[var(--color-muted)]">Редакция от {effectiveDate}</div>

          {intro && <p className="mb-3.5 text-[15px] leading-[1.65] text-[var(--color-text-secondary-2)]">{intro}</p>}

          {/* Оглавление: документы длинные, без него найти нужный раздел тяжело. */}
          <nav className="mt-7 rounded-2xl px-5 py-4" style={{ background: "rgba(255,255,255,.55)" }} aria-label="Содержание">
            <div className="mb-2.5 text-[13px] font-bold uppercase tracking-wide text-[var(--color-muted)]">Содержание</div>
            <ol className="m-0 flex list-none flex-col gap-1.5 p-0">
              {blocks
                .filter((b): b is Extract<LegalBlock, { type: "h2" }> => b.type === "h2")
                .map((b) => (
                  <li key={b.text}>
                    <a href={`#${anchorFor(b.text)}`} className="text-[14px] text-[var(--color-link)] no-underline hover:underline">
                      {b.text}
                    </a>
                  </li>
                ))}
            </ol>
          </nav>

          {blocks.map((block, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static legal-document content, blocks never reorder
            <Block key={i} block={block} />
          ))}

          <div className="mt-9 border-t pt-6 text-[13.5px] leading-[1.7] text-[var(--color-muted)]" style={{ borderColor: "rgba(140,150,165,.18)" }}>
            {requisites.map((line) => (
              <div key={line}>{line}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
