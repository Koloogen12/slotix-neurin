import type { Metadata } from "next";
import { Golos_Text } from "next/font/google";
import { AuthProvider } from "@/lib/auth-context";
import "./globals.css";

const golosText = Golos_Text({
  variable: "--font-golos",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://slotix.neurin.tech"),
  title: "Slotix — планирование встреч без переписок",
  description: "Slotix помогает планировать встречи без долгих переписок",
  icons: { icon: "/slotix/slotix-icon.png" },
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
