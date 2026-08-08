/**
 * Разметка Schema.org для поисковиков. Серверные компоненты — скрипт попадает в HTML
 * при сборке, поэтому его видит и Яндекс, и краулеры без выполнения JS.
 *
 * FAQPage даёт самый заметный эффект в выдаче: вопросы разворачиваются прямо в сниппете
 * и занимают больше места, чем обычная строка. Работает только если те же вопросы и
 * ответы реально видны на странице — иначе это нарушение и разметку снимают.
 */

const SITE = "https://slotix.neurin.tech";

function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // Значения свои, не пользовательские, но кавычки всё равно экранируем:
      // одна закрывающая скобка скрипта в тексте вопроса сломала бы страницу целиком.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

export function FaqJsonLd({ items }: { items: { q: string; a: string }[] }) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: items.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: item.a },
        })),
      }}
    />
  );
}

export function BreadcrumbJsonLd({ items }: { items: { name: string; path: string }[] }) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: item.name,
          item: `${SITE}${item.path}`,
        })),
      }}
    />
  );
}

/** Профиль организации — связывает домен, бренд и юрлицо. Ставится один раз, на главной. */
export function OrganizationJsonLd() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "Slotix",
        url: SITE,
        logo: `${SITE}/slotix/slotix-logo.webp`,
        description: "Сервис онлайн-записи на встречи и консультации с автоматическими конспектами созвонов.",
        founder: { "@type": "Person", name: "Кочнев Данил Сергеевич" },
        address: {
          "@type": "PostalAddress",
          addressCountry: "RU",
          addressLocality: "Москва",
          streetAddress: "ул. Годовикова, д. 11, к. 5, 373",
        },
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "customer support",
          email: "support@slotix.neurin.tech",
          availableLanguage: ["Russian"],
        },
      }}
    />
  );
}

/**
 * Карточка продукта с ценой. Даёт в выдаче строку «от 0 ₽» и метку «есть бесплатная версия» —
 * для сервиса, который конкурирует с платным «вечным» тарифом, это заметное преимущество в сниппете.
 */
export function SoftwareApplicationJsonLd() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: "Slotix",
        applicationCategory: "BusinessApplication",
        applicationSubCategory: "Scheduling",
        operatingSystem: "Web",
        url: SITE,
        inLanguage: "ru-RU",
        description:
          "Онлайн-запись на встречи и консультации: клиент сам выбирает слот, платит вперёд, а после созвона получает автоматический конспект с задачами.",
        featureList: [
          "Онлайн-запись клиентов по одной ссылке",
          "Приём оплаты при бронировании",
          "Синхронизация с Яндекс и Google Календарём",
          "Автоматические ссылки на Яндекс Телемост, Zoom и Google Meet",
          "AI-конспекты встреч с решениями и задачами",
          "Напоминания на email и в Телеграм",
          "Командная запись и распределение потока между специалистами",
        ],
        offers: [
          {
            "@type": "Offer",
            name: "Бесплатный",
            price: "0",
            priceCurrency: "RUB",
            description: "Бессрочно бесплатный тариф без привязки карты",
          },
          {
            "@type": "Offer",
            name: "Стандарт",
            price: "690",
            priceCurrency: "RUB",
            description: "Безлимитные форматы, приём оплат, 3 часа AI-конспектов в месяц",
          },
          {
            "@type": "Offer",
            name: "Pro",
            price: "1490",
            priceCurrency: "RUB",
            description: "Всё из Стандарта и 10 часов AI-конспектов в месяц",
          },
          {
            "@type": "Offer",
            name: "Команда",
            price: "4990",
            priceCurrency: "RUB",
            description: "До 5 участников, общий пул 30 часов AI-конспектов, командные встречи",
          },
        ],
      }}
    />
  );
}
