/**
 * Shared font loader for next/og opengraph-image routes (app/opengraph-image.tsx,
 * app/ai-seo/opengraph-image.tsx). Satori (what ImageResponse renders through) only
 * parses ttf/otf/woff — not woff2, which is what Google Fonts serves to any modern
 * User-Agent. A genuinely pre-woff2-era UA gets woff (v1) back instead, which Satori does
 * support. Still validates the actual magic bytes rather than trust that forever — and
 * falls back to a bundled local copy if the network fetch comes back empty, since
 * ImageResponse has no system-font fallback of its own (at least one font is required or
 * it throws).
 */

function isSupportedFont(buf: ArrayBuffer): boolean {
  if (buf.byteLength < 4) return false;
  const tag = String.fromCharCode(...new Uint8Array(buf, 0, 4));
  return tag === "OTTO" || tag === "true" || tag === "wOFF" || tag === "\x00\x01\x00\x00";
}

async function fetchGolosText(weight: number): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(`https://fonts.googleapis.com/css2?family=Golos+Text:wght@${weight}&display=swap`, {
      headers: {
        // Deliberately ancient — anything from the woff2-support era (~2013+) gets woff2
        // back, which Satori can't read.
        "User-Agent": "Mozilla/5.0 (Windows NT 5.1) AppleWebKit/535.11 (KHTML, like Gecko) Chrome/17.0.963.56 Safari/535.11",
      },
    }).then((res) => res.text());
    const match = css.match(/url\(([^)]+)\)/);
    if (!match) return null;
    const buf = await fetch(match[1]).then((res) => res.arrayBuffer());
    return isSupportedFont(buf) ? buf : null;
  } catch {
    return null;
  }
}

export interface OgFont {
  name: string;
  data: ArrayBuffer;
  weight: 700 | 800;
  style: "normal";
}

export async function loadOgFonts(): Promise<{ fonts: OgFont[]; fontFamily: string }> {
  const [bold, extrabold] = await Promise.all([fetchGolosText(700), fetchGolosText(800)]);
  const fonts: OgFont[] = [
    ...(extrabold ? [{ name: "Golos Text", data: extrabold, weight: 800 as const, style: "normal" as const }] : []),
    ...(bold ? [{ name: "Golos Text", data: bold, weight: 700 as const, style: "normal" as const }] : []),
  ];

  if (fonts.length === 0) {
    const bundled = await fetch(new URL("./fonts/golos-text-extrabold.woff", import.meta.url)).then((res) =>
      res.arrayBuffer(),
    );
    fonts.push({ name: "Golos Text", data: bundled, weight: 800, style: "normal" });
  }

  return { fonts, fontFamily: "Golos Text" };
}
