import { ImageResponse } from "next/og";

export const alt = "Rera Scanner — check any RERA project before you pay a rupee";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "linear-gradient(135deg, #0b0f17 0%, #16203a 100%)", color: "#e9edf3", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: "#6b8cff", display: "flex", alignItems: "center", justifyContent: "center", color: "#0b0f17", fontSize: 30, fontWeight: 800 }}>R</div>
          <div style={{ display: "flex", fontSize: 36, fontWeight: 700 }}>
            <span>Rera</span>
            <span style={{ color: "#6b8cff" }}>Scanner</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 72, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2 }}>Check any RERA project before you pay a rupee.</div>
          <div style={{ fontSize: 28, color: "#a6afbd" }}>Possession delays · complaints · filings · a transparent 0–100 Trust Score, built only from official records.</div>
        </div>
        <div style={{ display: "flex", gap: 14 }}>
          {[
            ["Strong 75+", "#35c48f"],
            ["Watch 50–74", "#f0a93a"],
            ["Caution 0–49", "#ff6b61"],
          ].map(([t, c]) => (
            <div key={t} style={{ padding: "10px 20px", borderRadius: 999, background: "rgba(255,255,255,0.06)", border: `2px solid ${c}`, color: c, fontSize: 22, fontWeight: 700 }}>{t}</div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
