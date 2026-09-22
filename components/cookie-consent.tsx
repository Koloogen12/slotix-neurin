"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { EMBED_PATH_PREFIX } from "@/lib/embed";
import Link from "next/link";

const STORAGE_KEY = "slotix-cookie-consent";
/** Номер счётчика Яндекс Метрики. Захардкожен намеренно: NEXT_PUBLIC_* встраивается на
 * сборке, так что переменная окружения не даёт здесь никакой гибкости, зато молча ломает
 * аналитику, если её забыть прописать на сервере. Переопределить всё ещё можно. */
export const YM_COUNTER_ID = Number(process.env.NEXT_PUBLIC_YM_ID ?? 111035421);
const CONSENT_TTL_MS = 365 * 24 * 60 * 60 * 1000; // re-ask once a year

type Decision = "accepted" | "declined";
interface StoredConsent {
  decision: Decision;
  at: number;
}

function readConsent(): StoredConsent | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredConsent;
    if (!parsed?.decision || Date.now() - parsed.at > CONSENT_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Loads Yandex Metrica, but only ever after an explicit "accept" — the counter script is not
 * fetched at all beforehand, so declining means no analytics request is made rather than one
 * that is merely ignored.
 */
function loadMetrica(counterId: number): void {
  if (document.getElementById("ym-script")) return;

  // Очередь до загрузки скрипта: hit при смене роута может случиться раньше, чем tag.js
  // догрузится — стандартная заглушка Метрики копит вызовы и проигрывает их после.
  const w = window as unknown as { ym?: ((...args: unknown[]) => void) & { a?: unknown[]; l?: number } };
  if (!w.ym) {
    const stub = ((...args: unknown[]) => {
      (stub.a = stub.a || []).push(args);
    }) as ((...args: unknown[]) => void) & { a?: unknown[]; l?: number };
    stub.l = Date.now();
    w.ym = stub;
  }

  const script = document.createElement("script");
  script.id = "ym-script";
  script.async = true;
  script.src = `https://mc.yandex.ru/metrika/tag.js?id=${counterId}`;
  document.head.appendChild(script);

  w.ym(counterId, "init", {
    ssr: true,
    webvisor: true,
    clickmap: true,
    ecommerce: "dataLayer",
    referrer: document.referrer,
    url: location.href,
    accurateTrackBounce: true,
    trackLinks: true,
  });
}

/** Метрика сама считает только первую загрузку. В Next переходы между экранами — это
 * клиентский роутинг без перезагрузки, поэтому каждый такой переход надо отправлять руками. */
export function trackPageView(url: string): void {
  const ym = (window as unknown as { ym?: (...args: unknown[]) => void }).ym;
  ym?.(YM_COUNTER_ID, "hit", url);
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  // Inside an embedded widget there is nothing to consent to and nobody to ask: the banner
  // would cover the booking form on someone else's page, and firing our counter there would
  // track their visitors under our ID, outside their own consent flow. Both are off.
  const isEmbedded = usePathname()?.startsWith(EMBED_PATH_PREFIX) ?? false;

  useEffect(() => {
    if (isEmbedded) return;
    const stored = readConsent();
    if (!stored) {
      setVisible(true);
      return;
    }
    if (stored.decision === "accepted") loadMetrica(YM_COUNTER_ID);
  }, [isEmbedded]);

  const decide = (decision: Decision) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ decision, at: Date.now() } satisfies StoredConsent));
    } catch {
      // private mode can block storage — the banner simply reappears next visit
    }
    setVisible(false);
    if (decision === "accepted") loadMetrica(YM_COUNTER_ID);
  };

  if (isEmbedded || !visible) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[110] flex justify-center p-3 sm:p-4"
      role="dialog"
      aria-live="polite"
      aria-label="Согласие на использование файлов cookie"
    >
      {/* Компактно: длинный абзац на телефоне занимал треть экрана и закрывал кнопку
          в первом экране. Подробности живут по ссылке, а не в баннере. */}
      <div className="glass-elevated flex w-full max-w-[640px] flex-col gap-3 p-3.5 sm:flex-row sm:items-center sm:gap-4 sm:p-4">
        <p className="m-0 flex-1 text-[13px] leading-[1.5] text-(--color-text-secondary)">
          Мы используем файлы cookie, чтобы сайт работал и становился удобнее. Аналитику включаем, только если вы не против.{" "}
          <Link href="/cookies" className="font-medium text-(--color-link) underline underline-offset-2">
            Подробнее
          </Link>
        </p>
        <div className="flex flex-none gap-2">
          <button
            type="button"
            onClick={() => decide("declined")}
            className="btn-secondary min-h-[44px] flex-1 px-4 py-2 text-sm sm:flex-none"
          >
            Только необходимые
          </button>
          <button
            type="button"
            onClick={() => decide("accepted")}
            className="btn-primary min-h-[44px] flex-1 px-5 py-2 text-sm sm:flex-none"
          >
            Хорошо
          </button>
        </div>
      </div>
    </div>
  );
}
