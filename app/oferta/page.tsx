import type { Metadata } from "next";
import { LegalDocument } from "@/lib/legal/legal-document";
import { OFERTA_BLOCKS, OFERTA_EFFECTIVE_DATE, OFERTA_INTRO, OFERTA_REQUISITES, OFERTA_TITLE } from "@/lib/legal/oferta-content";

export const metadata: Metadata = {
  title: OFERTA_TITLE,
  description: OFERTA_TITLE,
  alternates: { canonical: "/oferta" },
  robots: { index: true, follow: true },
};

export default function OfertaPage() {
  return (
    <LegalDocument
      title={OFERTA_TITLE}
      effectiveDate={OFERTA_EFFECTIVE_DATE}
      intro={OFERTA_INTRO}
      blocks={OFERTA_BLOCKS}
      requisites={OFERTA_REQUISITES}
    />
  );
}
