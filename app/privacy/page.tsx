import type { Metadata } from "next";
import { LegalDocument } from "@/lib/legal/legal-document";
import { PRIVACY_BLOCKS, PRIVACY_EFFECTIVE_DATE, PRIVACY_REQUISITES, PRIVACY_TITLE } from "@/lib/legal/privacy-content";

export const metadata: Metadata = {
  title: "Политика обработки персональных данных",
  description:
    "Какие персональные данные обрабатывает Slotix, на каком основании, где они хранятся и как реализуются права субъекта. Данные размещены на серверах в Российской Федерации.",
  keywords: ["политика конфиденциальности slotix", "обработка персональных данных 152-фз", "где хранятся данные slotix"],
  alternates: { canonical: "/privacy" },
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return (
    <LegalDocument
      title={PRIVACY_TITLE}
      effectiveDate={PRIVACY_EFFECTIVE_DATE}
      blocks={PRIVACY_BLOCKS}
      requisites={PRIVACY_REQUISITES}
    />
  );
}
