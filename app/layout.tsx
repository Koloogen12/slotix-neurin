import type { Metadata } from "next";
import { Golos_Text } from "next/font/google";
import { AuthProvider } from "@/lib/auth-context";
import "./globals.css";

const golosText = Golos_Text({
  variable: "--font-golos",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700", "800"],
});

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
  icons: { icon: "/slotix/slotix-icon.png" },
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={`${golosText.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
