import path from "node:path";
import type { NextConfig } from "next";

// Security headers required by Zoom's OWASP checklist for marketplace app review
// (https://developers.zoom.us/docs/zoom-apps/security/owasp/) — applied site-wide rather
// than only on /cabinet/formats (the page reviewers actually hit), since a global HSTS/
// nosniff/Referrer-Policy/CSP baseline is the same effort either way and leaves no other
// route unprotected.
//
// CSP is NOT the bare `default-src 'self'` from the checklist's example — that would break
// this app outright: every page relies on inline `style={{...}}` attributes (style-src
// needs 'unsafe-inline'), Next.js hydrates via an inline script tag (script-src needs it
// too), and user.avatarUrl on /cabinet/formats itself can point at an external Google/
// Yandex CDN photo with no fixed host to allowlist (img-src needs https: broadly) or a
// base64 data: URI from the avatar-upload flow.
// In production the API is same-origin (served under /api on the app domain), so 'self'
// covers it. In local dev the API runs on a separate port (e.g. http://localhost:4010),
// which is a different origin — without allowlisting it here, `connect-src 'self'` blocks
// every fetch to the backend before it leaves the browser. Add the configured API origin.
const API_ORIGIN = (() => {
  const raw = process.env.NEXT_PUBLIC_API_URL;
  if (!raw) return "";
  try {
    return new URL(raw).origin;
  } catch {
    return "";
  }
})();

const SECURITY_HEADERS = [
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Yandex Metrica is loaded only after cookie consent, but CSP is evaluated at request
      // time — without these origins the counter is silently blocked once someone accepts.
      "script-src 'self' 'unsafe-inline' https://mc.yandex.ru",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      `connect-src 'self' https://mc.yandex.ru https://mc.yandex.com${API_ORIGIN ? ` ${API_ORIGIN}` : ""}`,
      "form-action 'self'",
      "frame-src 'self' https://mc.yandex.ru",
      "frame-ancestors 'self'",
      "base-uri 'self'",
    ].join("; "),
  },
];

// Who may frame /embed/*. The booking widget is meant to be dropped onto customers' own
// sites, so the default has to be open — a fixed allowlist would mean a deploy per customer.
// The pages under this prefix are public and contain no authenticated action, so the usual
// framing risk (clickjacking a logged-in session) does not apply. Set the variable to a
// space-separated origin list to lock embedding down to known sites.
const EMBED_FRAME_ANCESTORS = process.env.EMBED_FRAME_ANCESTORS?.trim() || "*";

// Same baseline as the site, with framing opened up and the Metrica origins dropped: the
// counter never runs inside the widget (see CookieConsent), and a consent banner has no
// business appearing inside someone else's page.
const EMBED_HEADERS = [
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      `connect-src 'self'${API_ORIGIN ? ` ${API_ORIGIN}` : ""}`,
      "form-action 'self'",
      `frame-ancestors ${EMBED_FRAME_ANCESTORS}`,
      "base-uri 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  // The host this runs on has 1 GB of RAM shared with the notetaker worker, so `next start`
  // with the full node_modules tree is too heavy — standalone emits a self-contained server
  // with only the traced dependencies, roughly halving both image size and resident memory.
  output: "standalone",
  // Silences Turbopack's workspace-root inference warning — a stray package-lock.json in
  // the parent Downloads folder was otherwise getting picked as the root.
  turbopack: {
    root: path.resolve(__dirname),
  },
  async headers() {
    return [
      // Negative lookahead, not just ordering: Next emits every matching rule, and a browser
      // given two CSP headers enforces the strictest of each directive. Without excluding
      // /embed here its permissive frame-ancestors would be intersected back down to 'self'.
      { source: "/:path((?!embed/).*)", headers: SECURITY_HEADERS },
      { source: "/embed/:path*", headers: EMBED_HEADERS },
    ];
  },
};

export default nextConfig;
