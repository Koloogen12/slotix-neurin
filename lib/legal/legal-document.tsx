import Link from "next/link";

export type LegalBlock = { type: "h2"; text: string } | { type: "p"; text: string } | { type: "ul"; items: string[] };

function Block({ block }: { block: LegalBlock }) {
  if (block.type === "h2") {
    return (
      <h2 className="mt-9 mb-3 text-xl font-bold tracking-[-.01em] text-[var(--color-ink)]">{block.text}</h2>
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
