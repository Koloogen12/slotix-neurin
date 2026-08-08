import type { Metadata, Viewport } from "next";
import { Caveat, Golos_Text } from "next/font/google";
import { AuthProvider } from "@/lib/auth-context";
import { AttributionCapture } from "./attribution-capture";
import { CookieConsent } from "@/components/cookie-consent";
import { MetricaRouteTracker } from "@/components/metrica-route-tracker";
import "./globals.css";

const golosText = Golos_Text({
  variable: "--font-golos",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700", "800"],
});

// Рукописный — только для коротких подписей-стрелок на лендинге. Кириллица у Caveat есть.
const caveat = Caveat({ variable: "--font-hand", subsets: ["latin", "cyrillic"], weight: ["600", "700"] });

const TITLE = "Slotix — планирование встреч без переписок";
const DESCRIPTION =
  "Slotix — сервис онлайн-записи на встречи, консультации и созвоны. Клиент сам выбирает свободный слот по вашей ссылке — без «когда вам удобно?» в переписке. Google Meet, Zoom, Яндекс Телемост и ЮKassa из коробки.";

export const metadata: Metadata = {
  metadataBase: new URL("https://slotix.neurin.tech"),
  title: { default: TITLE, template: "%s | Slotix" },
  description: DESCRIPTION,
  keywords: [
    "запись на встречи онлайн",
    "сервис бронирования встреч",
    "планирование созвонов",
    "аналог Calendly на русском",
    "онлайн-запись на консультацию",
    "автоматическая запись клиентов",
    "ссылка для записи на встречу",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/",
    siteName: "Slotix",
    locale: "ru_RU",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
  manifest: "/manifest.webmanifest",
  applicationName: "Slotix",
  appleWebApp: { capable: true, title: "Slotix", statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#5094F0",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={`${golosText.variable} ${caveat.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <AuthProvider>{children}</AuthProvider>
        <AttributionCapture />
        <CookieConsent />
        <MetricaRouteTracker />
        {/* Пиксель для браузеров без JS. Не гейтится согласием: это единственный запрос,
            он не ставит cookie и не собирает поведение — иначе в такой среде мы бы вообще
            не видели, что страница открывалась. */}
        <noscript>
          <div>
            <img src="https://mc.yandex.ru/watch/111035421" style={{ position: "absolute", left: "-9999px" }} alt="" />
          </div>
        </noscript>
      </body>
    </html>
  );
}
