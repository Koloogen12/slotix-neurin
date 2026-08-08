// Booking-source attribution. UTM tags usually sit on the first landing URL (the profile
// link) and are gone by the time the visitor reaches the booking form on a clean URL, so we
// capture them into sessionStorage on the first page that carries them (first-touch wins) and
// read them back when the booking is submitted.

export interface Attribution {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
  referrer?: string;
}

const STORAGE_KEY = "slotix_attribution";

const UTM_KEYS: Array<[keyof Attribution, string]> = [
  ["source", "utm_source"],
  ["medium", "utm_medium"],
  ["campaign", "utm_campaign"],
  ["content", "utm_content"],
  ["term", "utm_term"],
];

function referrerHost(): string | undefined {
  if (!document.referrer) return undefined;
  try {
    const host = new URL(document.referrer).host;
    // Ignore in-site navigation — only an external referrer is a real "source".
    if (host && host !== window.location.host) return host;
  } catch {
    /* malformed referrer — ignore */
  }
  return undefined;
}

/** Persist the current URL's UTM tags (and external referrer) if we haven't already stored an
 * attribution this session. Safe to call on every page mount. */
export function captureAttribution(): void {
  if (typeof window === "undefined") return;
  try {
    if (sessionStorage.getItem(STORAGE_KEY)) return;

    const params = new URLSearchParams(window.location.search);
    const attribution: Attribution = {};
    for (const [key, param] of UTM_KEYS) {
      const value = params.get(param)?.trim();
      if (value) attribution[key] = value.slice(0, 200);
    }
    const ref = referrerHost();
    if (ref) attribution.referrer = ref.slice(0, 200);

    if (Object.keys(attribution).length > 0) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(attribution));
    }
  } catch {
    /* private-mode / storage disabled — attribution is best-effort */
  }
}

/** The attribution captured earlier this session, or undefined when there was none. */
export function getAttribution(): Attribution | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as Attribution;
    return Object.keys(parsed).length > 0 ? parsed : undefined;
  } catch {
    return undefined;
  }
}
