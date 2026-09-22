import { notFound } from "next/navigation";
import { api, ApiError, type PublicProfile } from "@/lib/api";
import { BookingFlow } from "@/app/[slug]/[formatId]/booking-flow";

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

/** Same booking flow as /<slug>/<formatId>, minus the full-page framing: no backdrop, no
 * branding badge, no outer padding — the host page supplies all of that around the iframe.
 * Keeping it on the same component means the embed can never drift from the hosted page. */
export default async function EmbedBookingPage({ params }: PageProps) {
  const { slug, formatId } = await params;
  const profile = await fetchProfile(slug);
  const format = profile.formats.find((f) => f.id === formatId);
  if (!format) notFound();

  if (!profile.acceptingBookings) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-center">
        <div>
          <div className="mb-2 text-lg font-bold text-[var(--color-ink)]">Запись закрыта</div>
          <p className="text-sm leading-relaxed text-[var(--color-muted)]">
            {profile.name ?? "Специалист"} сейчас не принимает записи по этой ссылке.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-start justify-center p-3 sm:p-4">
      <BookingFlow slug={slug} profile={profile} format={format} />
    </div>
  );
}
