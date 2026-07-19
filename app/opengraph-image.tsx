import { ImageResponse } from "next/og";
import { loadOgFonts } from "@/lib/og-font";

export const runtime = "edge";
export const alt = "Slotix — планируй встречи в 1 клик";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const { fonts, fontFamily } = await loadOgFonts();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "row",
          padding: 76,
          background: "linear-gradient(135deg, #EAF2FB 0%, #DCE9FA 45%, #E4ECFB 100%)",
          fontFamily,
        }}
      >
        {/* Left: brand + headline */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", width: "50%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 48 }}>
            <div
              style={{
                display: "flex",
                width: 44,
                height: 44,
                borderRadius: 13,
                background: "linear-gradient(135deg,#66A6FF,#5094F0)",
              }}
            />
            <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: -0.5, color: "#1A1C1E" }}>SLOTIX</div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: 62,
              fontWeight: 800,
              lineHeight: 1.08,
              letterSpacing: -1.4,
              color: "#1A1C1E",
              marginBottom: 26,
            }}
          >
            <span>Планируй</span>
            <span>встречи</span>
            <span style={{ background: "linear-gradient(135deg,#66A6FF,#2F6FD0)", backgroundClip: "text", color: "transparent" }}>
              в 1 клик
            </span>
          </div>

          <div style={{ display: "flex", fontSize: 26, lineHeight: 1.45, color: "#5C6672", maxWidth: 460 }}>
            Клиент сам выбирает свободный слот по вашей ссылке — без «когда вам удобно?» в переписке.
          </div>
        </div>

        {/* Right: mini booking-flow mockup */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 22, width: "50%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 52,
                height: 52,
                borderRadius: 999,
                background: "linear-gradient(135deg,#66A6FF,#5094F0)",
                color: "#fff",
                fontSize: 22,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              А
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
              Давайте найдём время для встречи 🙂
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              background: "#fff",
              borderRadius: 22,
              padding: "26px 28px",
              boxShadow: "0 20px 50px rgba(20,40,70,.14)",
              marginLeft: 66,
              gap: 16,
            }}
          >
            <div style={{ display: "flex", fontSize: 20, fontWeight: 700, color: "#1A1C1E" }}>Среда, 18 августа</div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "2px solid #5094F0",
                borderRadius: 14,
                padding: "14px 0",
                fontSize: 22,
                fontWeight: 700,
                color: "#2F6FD0",
              }}
            >
              10:00
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <div
                style={{
                  display: "flex",
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#1A2733",
                  borderRadius: 14,
                  padding: "14px 0",
                  fontSize: 20,
                  fontWeight: 700,
                  color: "#fff",
                }}
              >
                11:00
              </div>
              <div
                style={{
                  display: "flex",
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center",
                  background: "linear-gradient(135deg,#66A6FF,#5094F0)",
                  borderRadius: 14,
                  padding: "14px 0",
                  fontSize: 20,
                  fontWeight: 700,
                  color: "#fff",
                }}
              >
                Подтвердить
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 8 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 52,
                height: 52,
                borderRadius: 999,
                background: "linear-gradient(135deg,#8E6FE8,#7B5CE0)",
                color: "#fff",
                fontSize: 22,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              К
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: "rgba(255,255,255,.92)",
                borderRadius: 18,
                padding: "16px 22px",
                fontSize: 21,
                fontWeight: 600,
                color: "#1A1C1E",
                boxShadow: "0 12px 30px rgba(20,40,70,.12)",
              }}
            >
              Отлично, жду встречи!
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
