import { notFound } from "next/navigation";
import Link from "next/link";
import { api, ApiError, type PublicProfile } from "@/lib/api";
import { Avatar } from "../avatar";
import { BookingFlow } from "./booking-flow";
import { BrandingBadge } from "../branding-badge";

interface PageProps {
  params: Promise<{ slug: string; formatId: string }>;
}

async function fetchProfile(slug: string): Promise<PublicProfile> {
  try {
    return await api.get<PublicProfile>(`/api/public/${encodeURIComponent(slug)}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
}

/** The booking screen is a single card on a flat surface. `body` paints the site-wide aurora
 * image, which shows straight through the translucent .glass-card and reads as a second layer
 * of artwork sitting on top of the calendar and slot list — so this screen covers it with the
 * plain page colour. Fixed + negative z-index keeps it behind all content while scrolling. */
function FlatBackdrop() {
  return <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 bg-[var(--color-page-bg)]" />;
}

export default async function BookingFormatPage({ params }: PageProps) {
  const { slug, formatId } = await params;
  const profile = await fetchProfile(slug);
  const format = profile.formats.find((f) => f.id === formatId);
  if (!format) notFound();

  if (!profile.acceptingBookings) {
    return (
      <div className="flex flex-1 items-start justify-center px-4 py-16 sm:py-24">
        <div className="glass-card w-full max-w-[440px] p-10 text-center">
          <Avatar
            name={profile.name}
            avatarUrl={profile.avatarUrl}
            size={80}
            ringColor="#C9D4DE"
            className="mx-auto mb-4.5"
          />
          <div className="mb-2 text-xl font-bold text-[var(--color-ink)]">Запись закрыта</div>
          <p className="mb-6 text-sm leading-relaxed text-[var(--color-muted)]">
            {profile.name ?? "Специалист"} сейчас не принимает записи по этой ссылке. Загляните на страницу —
            возможно, есть другие форматы.
          </p>
          <Link href={`/${encodeURIComponent(slug)}`} className="btn-secondary inline-flex">
            На страницу профиля
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-start justify-center px-4 py-10 sm:py-16 min-[1080px]:py-24">
      <FlatBackdrop />
      <BookingFlow slug={slug} profile={profile} format={format} />
      <BrandingBadge show={profile.showBranding} />
    </div>
  );
}
