import type { Metadata } from "next";
import { LegalDocument } from "@/lib/legal/legal-document";
import { OFERTA_BLOCKS, OFERTA_EFFECTIVE_DATE, OFERTA_INTRO, OFERTA_REQUISITES, OFERTA_TITLE } from "@/lib/legal/oferta-content";

export const metadata: Metadata = {
  // Полное юридическое название документа — заголовок H1 на самой странице;
  // в title оно не помещается и обрезается в выдаче на полуслове.
  title: "Публичная оферта",
  description:
    "Лицензионный договор (публичная оферта) на предоставление права использования программы для ЭВМ «SLOTIX»: предмет, тарифы, порядок оплаты и ответственность сторон.",
  keywords: ["оферта slotix", "лицензионный договор slotix", "условия использования сервиса записи"],
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
