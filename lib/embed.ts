// Protocol between a booking page rendered inside an <iframe> and the embed.js snippet
// running on the host site. `source` is what lets the snippet ignore postMessages from
// anything else sharing the page (ad scripts, chat widgets, other iframes).

export const EMBED_SOURCE = "slotix-embed";

/** Booking pages are embeddable only under this prefix, so a single pathname test tells a
 * client component whether it is running inside a customer's site. */
export const EMBED_PATH_PREFIX = "/embed/";

export type EmbedMessage =
  | { source: typeof EMBED_SOURCE; type: "ready" }
  | { source: typeof EMBED_SOURCE; type: "resize"; height: number }
  | { source: typeof EMBED_SOURCE; type: "booked"; formatId: string; startAt: string };

/** True when this document is framed. Reading window.parent across origins throws in some
 * browsers, and that throw is itself proof of a cross-origin parent — hence the catch. */
export function isFramed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.parent !== window;
  } catch {
    return true;
  }
}

/** `Omit` over a union keeps only the keys every member shares, so Omit<EmbedMessage,
 * "source"> would collapse to `{ type }` and reject height/formatId. Distributing over the
 * union first omits from each member separately, which is what callers expect. */
type WithoutSource<T> = T extends unknown ? Omit<T, "source"> : never;

/** targetOrigin is "*" on purpose: the host page's origin is unknown at build time (any
 * customer may embed), and every message above carries only data the visitor themselves
 * just entered or can see. The manage-booking token is deliberately NOT in the payload —
 * that one would let its holder cancel or reschedule the meeting. */
export function postToHost(message: WithoutSource<EmbedMessage>): void {
  if (typeof window === "undefined" || !isFramed()) return;
  try {
    window.parent.postMessage({ source: EMBED_SOURCE, ...message }, "*");
  } catch {
    /* framed by a parent that refuses messages — nothing to do */
  }
}

/** Streams content height to the host so an inline embed can grow instead of scrolling in a
 * fixed box. Returns a cleanup function. */
export function reportHeightToHost(): () => void {
  if (typeof window === "undefined" || !isFramed()) return () => {};

  let last = 0;
  const send = () => {
    const height = Math.ceil(document.documentElement.getBoundingClientRect().height);
    // Sub-pixel layout jitter would otherwise emit a message on every animation frame.
    if (height > 0 && Math.abs(height - last) > 1) {
      last = height;
      postToHost({ type: "resize", height });
    }
  };

  send();
  const observer = new ResizeObserver(send);
  observer.observe(document.documentElement);
  window.addEventListener("load", send);
  return () => {
    observer.disconnect();
    window.removeEventListener("load", send);
  };
}
