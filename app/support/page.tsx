import type { Metadata } from "next";
import { LegalDocument } from "@/lib/legal/legal-document";
import { SUPPORT_BLOCKS, SUPPORT_EFFECTIVE_DATE, SUPPORT_TITLE } from "@/lib/legal/support-content";

export const metadata: Metadata = {
  title: SUPPORT_TITLE,
  description: "Как связаться с поддержкой Slotix — email и ответы на частые вопросы.",
  alternates: { canonical: "/support" },
  robots: { index: true, follow: true },
};

export default function SupportPage() {
  return (
    <LegalDocument title={SUPPORT_TITLE} effectiveDate={SUPPORT_EFFECTIVE_DATE} blocks={SUPPORT_BLOCKS} requisites={[]} />
  );
}
