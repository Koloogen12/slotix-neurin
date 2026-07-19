import Link from "next/link";

/**
 * Next.js App Router renders a single global not-found.tsx for every notFound() call in the
 * app — this covers both an invalid booking-management token (app/booking/[token]/page.tsx)
 * and an invalid specialist slug (app/[slug]/page.tsx). Matches the 404 state in
 * "Slotix - Публичные экраны.dc.html".
 */
export default function NotFound() {
  return (
    <div className="mx-auto mt-16 w-full max-w-[440px] px-4">
      <div className="glass-card p-11 text-center">
        <div
          className="mb-2 bg-clip-text text-[64px] font-extrabold text-transparent"
          style={{ backgroundImage: "var(--color-primary-gradient)" }}
        >
          404
        </div>
        <div className="mb-2 text-xl font-bold text-[var(--color-ink)]">Страница не найдена</div>
        <div className="mb-6 text-sm leading-relaxed text-[var(--color-muted)]">
          Возможно, ссылка устарела или её ввели с ошибкой.
        </div>
        <Link href="/" className="btn-primary">
          На главную Slotix
        </Link>
      </div>
    </div>
  );
}
