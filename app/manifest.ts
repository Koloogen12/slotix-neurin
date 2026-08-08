import type { MetadataRoute } from "next";

// Манифест нужен, чтобы сайт корректно сохранялся на домашний экран телефона:
// без него Android берёт скриншот вкладки вместо иконки и показывает голый URL.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Slotix — онлайн-запись на встречи",
    short_name: "Slotix",
    description:
      "Клиент сам выбирает свободный слот по вашей ссылке, платит вперёд и получает конспект после созвона.",
    start_url: "/cabinet/formats",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#EAF2FB",
    theme_color: "#5094F0",
    lang: "ru-RU",
    categories: ["business", "productivity"],
    icons: [
      { src: "/slotix/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/slotix/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      // Android обрезает иконку под форму лаунчера — для этого нужен отдельный файл
      // с запасом по краям, иначе знак срежется.
      { src: "/slotix/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
