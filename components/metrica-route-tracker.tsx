"use client";

import { Suspense, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackPageView } from "./cookie-consent";

/**
 * Метрика засчитывает только первую загрузку страницы. В Next переходы между экранами —
 * это клиентский роутинг без перезагрузки документа, поэтому без этого счётчик показывал бы
 * один просмотр на всю сессию, а Вебвизор обрывался бы на первом же переходе.
 *
 * Вызов идёт через ту же заглушку, что и init: если человек ещё не принял cookie, `ym`
 * не определён и hit просто не уходит — никакой аналитики без согласия.
 */
function Tracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastUrl = useRef<string | null>(null);

  useEffect(() => {
    const query = searchParams.toString();
    const url = `${location.origin}${pathname}${query ? `?${query}` : ""}`;
    // Первый рендер уже посчитан параметром `url` в init — иначе первый экран задвоится.
    if (lastUrl.current === null) {
      lastUrl.current = url;
      return;
    }
    if (lastUrl.current === url) return;
    lastUrl.current = url;
    trackPageView(url);
  }, [pathname, searchParams]);

  return null;
}

export function MetricaRouteTracker() {
  // useSearchParams требует Suspense — без него любая страница, где он используется,
  // выпадает из статической генерации целиком.
  return (
    <Suspense fallback={null}>
      <Tracker />
    </Suspense>
  );
}
