import type { Metadata } from "next";
import { LegalDocument } from "@/lib/legal/legal-document";
import { SUPPORT_BLOCKS, SUPPORT_EFFECTIVE_DATE, SUPPORT_TITLE } from "@/lib/legal/support-content";

export const metadata: Metadata = {
  title: "Поддержка и контакты",
  description:
    "Как связаться с поддержкой Slotix, сроки ответа и разбор частых вопросов: подключение календаря, приём оплат, площадки для созвонов и AI-конспекты.",
  keywords: ["поддержка slotix", "связаться со slotix", "помощь по онлайн-записи", "техподдержка сервиса записи"],
  alternates: { canonical: "/support" },
  robots: { index: true, follow: true },
};

export default function SupportPage() {
  return (
    <LegalDocument title={SUPPORT_TITLE} effectiveDate={SUPPORT_EFFECTIVE_DATE} blocks={SUPPORT_BLOCKS} requisites={[]} />
  );
}
