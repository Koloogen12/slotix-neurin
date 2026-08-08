import type { MetadataRoute } from "next";

// Without this file, /robots.txt fell through to the [slug] public-profile catch-all
// route, which returned a "Профиль не найден" HTML page (with a stray noindex tag)
// instead of a real robots.txt — well-behaved crawlers (including link-preview bots)
// that check robots.txt before fetching anything else were refusing to scrape the site.

const PRIVATE = ["/cabinet", "/auth", "/onboarding", "/booking"];

// Краулеры ИИ-поисковиков. По умолчанию правило "*" их и так пускает, но часть из них
// (прежде всего Google-Extended) проверяет именно своё имя и без явной строки считает
// контент недоступным для ответов ассистента. Нам показ в ИИ-выдаче нужен, поэтому
// разрешаем поимённо.
const AI_AGENTS = [
  "Google-Extended", // ответы Gemini и AI Overviews
  "GPTBot", // обучение OpenAI
  "OAI-SearchBot", // поиск ChatGPT
  "ChatGPT-User", // переходы по ссылке из чата
  "ClaudeBot",
  "Claude-User",
  "PerplexityBot",
  "Perplexity-User",
  "Applebot-Extended",
  "YandexAdditional", // нейроответы Яндекса
  "Bingbot", // Copilot берёт индекс Bing
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVATE },
      ...AI_AGENTS.map((userAgent) => ({ userAgent, allow: "/", disallow: PRIVATE })),
    ],
    host: "https://slotix.neurin.tech",
    sitemap: "https://slotix.neurin.tech/sitemap.xml",
  };
}
