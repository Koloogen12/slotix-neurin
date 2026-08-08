import type { Metadata } from "next";
import { LegalDocument } from "@/lib/legal/legal-document";
import { COOKIES_BLOCKS, COOKIES_EFFECTIVE_DATE, COOKIES_TITLE } from "@/lib/legal/cookies-content";
import { PRIVACY_REQUISITES } from "@/lib/legal/privacy-content";

export const metadata: Metadata = {
  title: "Политика в отношении файлов cookie",
  description:
    "Какие файлы cookie использует Slotix, зачем нужны технически необходимые и аналитические cookie и как отозвать согласие на аналитику.",
  keywords: ["политика cookie slotix", "файлы cookie согласие", "яндекс метрика согласие"],
  alternates: { canonical: "/cookies" },
  robots: { index: true, follow: true },
};

export default function CookiesPage() {
  return <LegalDocument title={COOKIES_TITLE} effectiveDate={COOKIES_EFFECTIVE_DATE} blocks={COOKIES_BLOCKS} requisites={PRIVACY_REQUISITES} />;
}
