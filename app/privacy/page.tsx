import type { Metadata } from "next";
import { LegalDocument } from "@/lib/legal/legal-document";
import { PRIVACY_BLOCKS, PRIVACY_EFFECTIVE_DATE, PRIVACY_REQUISITES, PRIVACY_TITLE } from "@/lib/legal/privacy-content";

export const metadata: Metadata = {
  title: PRIVACY_TITLE,
  description: PRIVACY_TITLE,
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
