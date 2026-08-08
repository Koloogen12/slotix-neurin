import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { api, ApiError, type TeamPage } from "@/lib/api";
import { TeamBookingView } from "./TeamBookingView";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function fetchTeamPage(slug: string): Promise<TeamPage> {
  try {
    return await api.get<TeamPage>(`/api/public/team/${encodeURIComponent(slug)}`);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }
}

// Same reasoning as the personal page: this is the link a studio actually circulates, so it
// needs its own title/preview instead of falling back to the generic site metadata.
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  let page: TeamPage;
  try {
    page = await api.get<TeamPage>(`/api/public/team/${encodeURIComponent(slug)}`);
  } catch {
    return { title: "Страница не найдена" };
  }
  const name = page.org.name;
  const title = `Записаться — ${name}`;
  const description = `Выберите специалиста и удобное время в ${name} — онлайн, без переписки. Работает на Slotix.`;
  return {
    title,
    description,
    alternates: { canonical: `/t/${slug}` },
    openGraph: { title, description, url: `/t/${slug}`, siteName: "Slotix", locale: "ru_RU", type: "website" },
    twitter: { card: "summary", title, description },
  };
}

export default async function TeamPublicPage({ params }: PageProps) {
  const { slug } = await params;
  const page = await fetchTeamPage(slug);
  return (
    <div className="flex flex-1 items-start justify-center px-4 py-10 sm:py-16">
      <TeamBookingView page={page} slug={slug} />
    </div>
  );
}
