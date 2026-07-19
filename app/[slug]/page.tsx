import { notFound } from "next/navigation";
import Link from "next/link";
import { api, ApiError, type PublicProfile } from "@/lib/api";
import { Avatar } from "./avatar";
import { ChevronRightIcon } from "./icons";
import { formatMeta } from "./format-utils";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function fetchProfile(slug: string): Promise<PublicProfile> {
  try {
    return await api.get<PublicProfile>(`/api/public/${encodeURIComponent(slug)}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { slug } = await params;
  const profile = await fetchProfile(slug);
  const displayName = profile.name ?? profile.slug;

  return (
    <div className="flex flex-1 items-start justify-center px-4 py-16 sm:py-24">
      <div className="w-full max-w-[540px]">
        <div className="mb-8 flex flex-col items-center text-center">
          <Avatar name={profile.name} avatarUrl={profile.avatarUrl} size={88} />
          <div className="mt-4 text-2xl font-bold text-[var(--color-ink)]">{displayName}</div>
        </div>

        {!profile.acceptingBookings ? (
          <ClosedNotice name={profile.name} />
        ) : profile.formats.length === 0 ? (
          <div className="glass-card p-10 text-center text-sm text-[var(--color-muted)]">
            Пока нет форматов, доступных для записи.
          </div>
        ) : (
          <div className="flex flex-col gap-3.5">
            {profile.formats.map((format) => (
              <Link
                key={format.id}
                href={`/${encodeURIComponent(slug)}/${format.id}`}
                className="glass-card flex items-stretch overflow-hidden !rounded-[18px] !p-0 transition-shadow hover:shadow-[0_24px_56px_rgba(20,40,70,0.14)]"
              >
                <div className="w-1.5 flex-none" style={{ background: format.color }} />
                <div className="flex flex-1 items-center gap-3.5 px-5 py-4">
                  <div className="flex-1">
                    <div className="text-base font-semibold text-[var(--color-ink)]">{format.name}</div>
                    <div className="mt-0.5 text-[13px] text-[var(--color-muted)]">{formatMeta(format)}</div>
                  </div>
                  <ChevronRightIcon className="flex-none text-[var(--color-faint-2)]" />
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-8 text-center text-xs font-medium tracking-wide text-[var(--color-faint)]">
          Работает на SLOTIX
        </div>
      </div>
    </div>
  );
}

function ClosedNotice({ name }: { name: string | null }) {
  return (
    <div className="glass-card p-10 text-center">
      <div className="mb-2 text-xl font-bold text-[var(--color-ink)]">Запись закрыта</div>
      <p className="text-sm leading-relaxed text-[var(--color-muted)]">
        {name ?? "Специалист"} сейчас не принимает записи по этой ссылке.
      </p>
    </div>
  );
}
