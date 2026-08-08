import type { MetadataRoute } from "next";

const BASE = "https://slotix.neurin.tech";

// Отраслевые страницы — основной SEO-вход: общие запросы про онлайн-запись давно заняты,
// а «запись для психолога» или «конспект интервью» ещё берутся.
const ROUTES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "", priority: 1, changeFrequency: "weekly" },
  { path: "/pricing", priority: 0.9, changeFrequency: "weekly" },
  { path: "/dlya/konsultantov", priority: 0.9, changeFrequency: "weekly" },
  { path: "/dlya/psihologov", priority: 0.9, changeFrequency: "weekly" },
  { path: "/dlya/komand", priority: 0.8, changeFrequency: "weekly" },
  { path: "/dlya/hr", priority: 0.8, changeFrequency: "weekly" },
  { path: "/ai-seo", priority: 0.8, changeFrequency: "weekly" },
  { path: "/support", priority: 0.5, changeFrequency: "monthly" },
  { path: "/oferta", priority: 0.3, changeFrequency: "monthly" },
  { path: "/privacy", priority: 0.3, changeFrequency: "monthly" },
  { path: "/cookies", priority: 0.3, changeFrequency: "monthly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return ROUTES.map((route) => ({
    url: `${BASE}${route.path}`,
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
