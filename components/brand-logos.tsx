/**
 * Упрощённые знаки сервисов для блока интеграций. Рисуем сами, а не тянем картинки:
 * логотипы правообладателей меняются, файлы весят, а половина из них ещё и в PNG
 * с белым фоном. Здесь — узнаваемая форма в фирменном цвете, векторно и без запросов.
 */

export type BrandKey =
  | "telemost"
  | "zoom"
  | "meet"
  | "gcal"
  | "ycal"
  | "telegram"
  | "yookassa"
  | "mail"
  | "sber"
  | "apple"
  | "metrika"
  | "whatsapp";

export const BRANDS: Record<BrandKey, { name: string; node: React.ReactNode }> = {
  telemost: {
    name: "Яндекс Телемост",
    node: (
      <svg width="26" height="26" viewBox="0 0 32 32" role="img" aria-hidden="true">
        <rect width="32" height="32" rx="9" fill="#1A1C1E" />
        <circle cx="16" cy="16" r="7" fill="#fff" />
        <circle cx="18.5" cy="13.5" r="2.6" fill="#FC3F1D" />
      </svg>
    ),
  },
  zoom: {
    name: "Zoom",
    node: (
      <svg width="26" height="26" viewBox="0 0 32 32" role="img" aria-hidden="true">
        <rect width="32" height="32" rx="9" fill="#2D8CFF" />
        <path d="M8 12.5A1.5 1.5 0 0 1 9.5 11h8a1.5 1.5 0 0 1 1.5 1.5v7A1.5 1.5 0 0 1 17.5 21h-8A1.5 1.5 0 0 1 8 19.5z" fill="#fff" />
        <path d="M20.5 14.6l3.1-2.2a.6.6 0 0 1 .9.5v6.2a.6.6 0 0 1-.9.5l-3.1-2.2z" fill="#fff" />
      </svg>
    ),
  },
  meet: {
    name: "Google Meet",
    node: (
      <svg width="26" height="26" viewBox="0 0 32 32" role="img" aria-hidden="true">
        <rect width="32" height="32" rx="9" fill="#fff" stroke="#E6EBF2" />
        <path d="M6 13.2A1.2 1.2 0 0 1 7.2 12h8.3v8H7.2A1.2 1.2 0 0 1 6 18.8z" fill="#00832D" />
        <path d="M15.5 12h4.9v3.4l-4.9 2.6z" fill="#0066DA" />
        <path d="M15.5 20h4.9v-3.4l-4.9-2.6z" fill="#FFBA00" />
        <path d="M20.4 14.8l4.3-2.7a.5.5 0 0 1 .8.4v7a.5.5 0 0 1-.8.4l-4.3-2.7z" fill="#E94235" />
      </svg>
    ),
  },
  gcal: {
    name: "Google Календарь",
    node: (
      <svg width="26" height="26" viewBox="0 0 32 32" role="img" aria-hidden="true">
        <rect x="1" y="1" width="30" height="30" rx="7" fill="#fff" stroke="#E6EBF2" />
        <rect x="5" y="5" width="22" height="6" rx="2" fill="#4285F4" />
        <rect x="5" y="21" width="22" height="6" rx="2" fill="#34A853" />
        <rect x="21" y="5" width="6" height="22" rx="2" fill="#FBBC04" />
        <rect x="5" y="5" width="6" height="22" rx="2" fill="#EA4335" />
        <rect x="8" y="8" width="16" height="16" rx="2" fill="#fff" />
        <text x="16" y="21" textAnchor="middle" fontSize="11" fontWeight="700" fill="#4285F4" fontFamily="system-ui">
          31
        </text>
      </svg>
    ),
  },
  ycal: {
    name: "Яндекс Календарь",
    node: (
      <svg width="26" height="26" viewBox="0 0 32 32" role="img" aria-hidden="true">
        <rect width="32" height="32" rx="9" fill="#FC3F1D" />
        <rect x="7" y="9" width="18" height="15" rx="3" fill="#fff" />
        <path d="M7 13h18" stroke="#FC3F1D" strokeWidth="1.6" />
        <path d="M11.5 7v4M20.5 7v4" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="16" cy="18.5" r="2.2" fill="#FC3F1D" />
      </svg>
    ),
  },
  telegram: {
    name: "Телеграм",
    node: (
      <svg width="26" height="26" viewBox="0 0 32 32" role="img" aria-hidden="true">
        <circle cx="16" cy="16" r="16" fill="#2AABEE" />
        <path d="M7.5 15.8l14-5.4c.7-.25 1.3.16 1.07 1.2l-2.38 11.2c-.2.9-.74 1.12-1.5.7l-4.15-3.06-2 1.93c-.22.22-.4.4-.83.4l.3-4.23 7.7-6.96c.34-.3-.07-.46-.52-.17l-9.52 6-4.1-1.28c-.9-.28-.9-.9.2-1.33z" fill="#fff" />
      </svg>
    ),
  },
  yookassa: {
    name: "ЮKassa",
    node: (
      <svg width="26" height="26" viewBox="0 0 32 32" role="img" aria-hidden="true">
        <rect width="32" height="32" rx="9" fill="#0A0A0A" />
        <path d="M13.6 9h2.5v5.1h.1L18.7 9h2.8l-3.2 6.2 3.4 7.3h-2.9l-2.6-5.9h-.1V22.5h-2.5z" fill="#fff" />
        <circle cx="10" cy="16" r="2.6" fill="#8B3FFD" />
      </svg>
    ),
  },
  mail: {
    name: "Email",
    node: (
      <svg width="26" height="26" viewBox="0 0 32 32" role="img" aria-hidden="true">
        <rect width="32" height="32" rx="9" fill="#5094F0" />
        <rect x="7" y="10.5" width="18" height="12" rx="2.6" fill="#fff" />
        <path d="M7.8 12l8.2 5.6L24.2 12" stroke="#5094F0" strokeWidth="1.9" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  sber: {
    name: "SberJazz",
    node: (
      <svg width="26" height="26" viewBox="0 0 32 32" role="img" aria-hidden="true">
        <rect width="32" height="32" rx="9" fill="#fff" stroke="#E6EBF2" />
        <path d="M16 7a9 9 0 1 0 9 9h-2.6A6.4 6.4 0 1 1 16 9.6z" fill="#21A038" />
        <path d="M12 15.4l3.4 3 8-7.2" stroke="#21A038" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  apple: {
    name: "Apple Календарь",
    node: (
      <svg width="26" height="26" viewBox="0 0 32 32" role="img" aria-hidden="true">
        <rect x="1" y="1" width="30" height="30" rx="7" fill="#fff" stroke="#E6EBF2" />
        <rect x="5" y="5" width="22" height="6" rx="2" fill="#FF3B30" />
        <text x="16" y="16" textAnchor="middle" fontSize="6" fontWeight="700" fill="#FF3B30" fontFamily="system-ui">
          АВГ
        </text>
        <text x="16" y="25" textAnchor="middle" fontSize="9" fontWeight="700" fill="#1A1C1E" fontFamily="system-ui">
          19
        </text>
      </svg>
    ),
  },
  metrika: {
    name: "Яндекс Метрика",
    node: (
      <svg width="26" height="26" viewBox="0 0 32 32" role="img" aria-hidden="true">
        <rect width="32" height="32" rx="9" fill="#fff" stroke="#E6EBF2" />
        <rect x="7" y="17" width="4.5" height="8" rx="1.4" fill="#FC3F1D" />
        <rect x="13.8" y="12" width="4.5" height="13" rx="1.4" fill="#FFCC00" />
        <rect x="20.5" y="7" width="4.5" height="18" rx="1.4" fill="#5094F0" />
      </svg>
    ),
  },
  whatsapp: {
    name: "WhatsApp",
    node: (
      <svg width="26" height="26" viewBox="0 0 32 32" role="img" aria-hidden="true">
        <circle cx="16" cy="16" r="16" fill="#25D366" />
        <path
          d="M16 7.4a8.6 8.6 0 0 0-7.4 12.9L7.4 24.6l4.4-1.15A8.6 8.6 0 1 0 16 7.4zm4.9 12.1c-.2.58-1.2 1.13-1.66 1.17-.44.05-.85.22-2.87-.6-2.42-.98-3.95-3.47-4.07-3.63-.12-.16-.98-1.3-.98-2.48s.62-1.76.84-2c.22-.24.48-.3.64-.3h.46c.15 0 .35-.06.54.41l.74 1.8c.06.13.1.28.02.44l-.3.46-.44.48c-.14.14-.29.3-.12.58.16.28.72 1.19 1.55 1.93 1.06.95 1.96 1.24 2.24 1.38.28.14.44.12.6-.07l.9-1.05c.2-.24.37-.18.62-.09l1.77.84c.26.12.43.19.5.29.06.1.06.58-.14 1.16z"
          fill="#fff"
        />
      </svg>
    ),
  },
};
