import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Slotix — ИИ-конспект встреч: автоматический протокол созвона";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Satori (what ImageResponse renders through) only parses ttf/otf/woff — not woff2, which
// is what Google serves to any modern User-Agent. An old-enough UA (pre-2013 Chrome, no
// woff2 support) gets woff back instead. Still validate the actual magic bytes rather than
// trust that forever, since ImageResponse has no fallback of its own if a font fails to
// parse — it throws (no fonts at all isn't allowed either, so a bad font can't just be
// dropped; the caller falls back to a bundled local font instead, see below).
function isSupportedFont(buf: ArrayBuffer): boolean {
  if (buf.byteLength < 4) return false;
  const tag = String.fromCharCode(...new Uint8Array(buf, 0, 4));
  return tag === "OTTO" || tag === "true" || tag === "wOFF" || tag === "\x00\x01\x00\x00";
}

async function loadGolosText(weight: number): Promise<ArrayBuffer | null> {
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

export default async function Image() {
  const [bold, extrabold] = await Promise.all([loadGolosText(700), loadGolosText(800)]);
  const fonts = [
    ...(extrabold ? [{ name: "Golos Text", data: extrabold, weight: 800 as const, style: "normal" as const }] : []),
    ...(bold ? [{ name: "Golos Text", data: bold, weight: 700 as const, style: "normal" as const }] : []),
  ];

  // Satori requires at least one font to lay text out at all — it has no system-font
  // fallback of its own. If the Google Fonts fetch above didn't yield anything usable
  // (network hiccup, Google changes their UA-sniffing again), fall back to this bundled
  // copy so the image still renders instead of 502ing.
  if (fonts.length === 0) {
    const bundled = await fetch(new URL("./fonts/golos-text-extrabold.woff", import.meta.url)).then((res) =>
      res.arrayBuffer(),
    );
    fonts.push({ name: "Golos Text", data: bundled, weight: 800 as const, style: "normal" as const });
  }
  const fontFamily = "Golos Text";

  const bubble = (label: string, color: string, text: string) => (
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 52,
          height: 52,
          borderRadius: 999,
          background: color,
          color: "#fff",
          fontSize: 22,
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {label}
      </div>
      <div
        style={{
          display: "flex",
          background: "rgba(255,255,255,.92)",
          borderRadius: 18,
          padding: "16px 22px",
          fontSize: 21,
          fontWeight: 600,
          color: "#1A1C1E",
          boxShadow: "0 12px 30px rgba(20,40,70,.12)",
        }}
      >
        {text}
      </div>
    </div>
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "row",
          padding: 72,
          background: "linear-gradient(135deg, #EAF2FB 0%, #DCE9FA 45%, #E4ECFB 100%)",
          fontFamily,
        }}
      >
        {/* Left: brand + headline */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", width: "52%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 40 }}>
            <div
              style={{
                display: "flex",
                width: 42,
                height: 42,
                borderRadius: 12,
                background: "linear-gradient(135deg,#66A6FF,#5094F0)",
              }}
            />
            <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: -0.5, color: "#1A1C1E" }}>SLOTIX</div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(123,92,224,.14)",
              color: "#7B5CE0",
              borderRadius: 999,
              padding: "8px 18px",
              fontSize: 20,
              fontWeight: 700,
              width: "fit-content",
              marginBottom: 26,
            }}
          >
            ИИ для встреч
          </div>

          <div
            style={{
              display: "flex",
              fontSize: 56,
              fontWeight: 800,
              lineHeight: 1.08,
              letterSpacing: -1.2,
              color: "#1A1C1E",
              marginBottom: 22,
            }}
          >
            ИИ-конспект встреч без единой заметки
          </div>

          <div style={{ display: "flex", fontSize: 25, lineHeight: 1.45, color: "#5C6672", maxWidth: 500 }}>
            Slotix слушает звонок и присылает готовый протокол с задачами — вам и клиенту, сразу после встречи.
          </div>
        </div>

        {/* Right: chat mockup, same visual language as the landing page's AI block */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 26, width: "48%" }}>
          {bubble("К", "linear-gradient(135deg,#66A6FF,#5094F0)", "Конспект готов — задачи и сроки внутри")}
          {bubble("Т", "linear-gradient(135deg,#8E6FE8,#7B5CE0)", "Договорились созвониться через 2 недели")}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginLeft: 66 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: "linear-gradient(135deg,#66A6FF,#5094F0)",
                color: "#fff",
                borderRadius: 14,
                padding: "13px 24px",
                fontSize: 20,
                fontWeight: 700,
                boxShadow: "0 12px 30px rgba(80,148,240,.35)",
              }}
            >
              Записаться автоматически
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
