import Link from "next/link";

/** "Работает на Slotix" badge in the corner of public booking pages — the same growth loop
 * Calendly runs: every link an owner shares carries it, and removing it is a reason to upgrade.
 * Rendered only when the owner is on the free plan (see PublicService.getProfile).
 *
 * Fixed rather than in-flow so it stays in the corner on the short "you're booked" screens
 * too, and pointer-events are off on the wrapper so it can never sit on top of a slot button. */
export function BrandingBadge({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-20 hidden sm:block">
      <Link
        href="https://slotix.neurin.tech"
        target="_blank"
        rel="noopener"
        className="pointer-events-auto flex items-center gap-2 rounded-full border border-white/70 bg-white/85 px-3.5 py-2 text-[12.5px] font-semibold text-[var(--color-text-secondary)] shadow-[0_6px_20px_rgba(20,40,70,0.12)] backdrop-blur-sm"
      >
        <span className="text-[var(--color-muted)]">Работает на</span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/slotix/slotix-logo.webp" alt="Slotix" width={62} className="block h-[13px] w-auto" />
      </Link>
    </div>
  );
}
