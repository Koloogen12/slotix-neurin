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
const SECURITY_HEADERS = [
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
      "connect-src 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'",
      "base-uri 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  // Silences Turbopack's workspace-root inference warning — a stray package-lock.json in
  // the parent Downloads folder was otherwise getting picked as the root.
  turbopack: {
    root: path.resolve(__dirname),
  },
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
