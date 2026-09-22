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

// ---------------------------------------------------------------------------
// CTA tag — which button on the embedding site opened the widget (`?cta=hero`).
//
// Kept out of `Attribution` on purpose: that object is posted to the backend as `utm`, whose
// DTO has no cta field, so it would be silently dropped by the validation whitelist and look
// stored when it is not. Until the Booking model gains a column, the tag lives client-side
// and travels to the host page in the `booked` postMessage, where the site's own analytics
// records it alongside the click that started the session.

const CTA_STORAGE_KEY = "slotix_cta";
const CTA_MAX_LENGTH = 64;

/** Reads `?cta=` from the current URL and remembers it for this session. First value wins,
 * matching UTM first-touch semantics. Safe to call on every page mount. */
export function captureCta(): void {
  if (typeof window === "undefined") return;
  try {
    if (sessionStorage.getItem(CTA_STORAGE_KEY)) return;
    const value = new URLSearchParams(window.location.search).get("cta")?.trim();
    if (value) sessionStorage.setItem(CTA_STORAGE_KEY, value.slice(0, CTA_MAX_LENGTH));
  } catch {
    /* private-mode / storage disabled — attribution is best-effort */
  }
}

/** The cta tag captured earlier this session, or undefined when the widget was opened from a
 * link that carried none. */
export function getCta(): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    return sessionStorage.getItem(CTA_STORAGE_KEY) ?? undefined;
  } catch {
    return undefined;
  }
}
