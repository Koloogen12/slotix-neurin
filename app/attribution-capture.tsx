"use client";

import { useEffect } from "react";
import { captureAttribution, captureCta } from "@/lib/attribution";

/** Records booking-source attribution (UTM tags + referrer, plus the `cta` tag naming the
 * button that opened an embedded widget) on first page load. Renders nothing; mounted once in
 * the root layout so it runs regardless of the entry page. */
export function AttributionCapture() {
  useEffect(() => {
    captureAttribution();
    captureCta();
  }, []);
  return null;
}
