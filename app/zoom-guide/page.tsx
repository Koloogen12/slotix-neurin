import type { Metadata } from "next";
import { LegalDocument } from "@/lib/legal/legal-document";
import { ZOOM_GUIDE_BLOCKS, ZOOM_GUIDE_EFFECTIVE_DATE, ZOOM_GUIDE_INTRO, ZOOM_GUIDE_TITLE } from "@/lib/legal/zoom-guide-content";

export const metadata: Metadata = {
  title: ZOOM_GUIDE_TITLE,
  description: "Пошаговая инструкция: как подключить, использовать и отключить интеграцию Zoom в Slotix.",
  alternates: { canonical: "/zoom-guide" },
  robots: { index: true, follow: true },
};

export default function ZoomGuidePage() {
  return (
    <LegalDocument
      title={ZOOM_GUIDE_TITLE}
      effectiveDate={ZOOM_GUIDE_EFFECTIVE_DATE}
      intro={ZOOM_GUIDE_INTRO}
      blocks={ZOOM_GUIDE_BLOCKS}
      requisites={[]}
    />
  );
}
