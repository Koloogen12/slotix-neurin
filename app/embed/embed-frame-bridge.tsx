"use client";

import { useEffect } from "react";
import { postToHost, reportHeightToHost } from "@/lib/embed";

/** Announces the framed booking page to the host snippet and keeps it informed of content
 * height. The "ready" signal doubles as the snippet's liveness check: a host whose CSP or
 * X-Frame-Options blocked the iframe never receives it and falls back to a new tab. */
export function EmbedFrameBridge() {
  useEffect(() => {
    postToHost({ type: "ready" });
    const stopHeight = reportHeightToHost();

    // Esc внутри рамки до хозяина страницы не долетает: событие достаётся документу iframe.
    // Без этого окно закрывалось бы только крестиком, стоит один раз кликнуть в форму.
    const onKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") postToHost({ type: "close" });
    };
    document.addEventListener("keydown", onKeydown);

    return () => {
      stopHeight();
      document.removeEventListener("keydown", onKeydown);
    };
  }, []);

  return null;
}
