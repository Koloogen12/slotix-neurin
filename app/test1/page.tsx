import type { Metadata } from "next";
import { Test1View } from "./Test1View";

export const metadata: Metadata = {
  title: "Тестовый вариант главной",
  // Черновик под проверку: без noindex он бы конкурировал с настоящей главной
  // за те же запросы и растащил её вес.
  robots: { index: false, follow: false },
  alternates: { canonical: "/" },
};

export default function Test1Page() {
  return <Test1View />;
}
