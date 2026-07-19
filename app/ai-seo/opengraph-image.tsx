import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Slotix — ИИ-конспект встреч: автоматический протокол созвона";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Satori (what ImageResponse renders through) only parses ttf/otf, not woff2 — and which
// format Google Fonts serves is UA-sniffed on their end, not something a fixed "old
// browser" User-Agent string can reliably guarantee over time. Rather than depend on that,
// validate the actual bytes and just skip the font (falling back to system-ui) if Google
// handed back something Satori can't read, instead of letting ImageResponse throw.
function isTtfOrOtf(buf: ArrayBuffer): boolean {
  if (buf.byteLength < 4) return false;
  const sig = new Uint8Array(buf, 0, 4);
  const tag = String.fromCharCode(...sig);
  return tag === "OTTO" || tag === "true" || (sig[0] === 0 && sig[1] === 1 && sig[2] === 0 && sig[3] === 0);
}

async function loadGolosText(weight: number): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(`https://fonts.googleapis.com/css2?family=Golos+Text:wght@${weight}&display=swap`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.2661.102 Safari/537.36",
      },
    }).then((res) => res.text());
    const match = css.match(/url\(([^)]+)\)/);
    if (!match) return null;
    const buf = await fetch(match[1]).then((res) => res.arrayBuffer());
    return isTtfOrOtf(buf) ? buf : null;
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
  const fontFamily = fonts.length > 0 ? "Golos Text" : "system-ui, sans-serif";

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
