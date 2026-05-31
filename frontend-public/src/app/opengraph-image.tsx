import { ImageResponse } from "next/og";

export const alt = "Reqst — Crypto Payment Gateway";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "#050505",
          backgroundImage:
            "radial-gradient(circle at 20% 20%, rgba(124,58,237,0.35), transparent 45%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 40,
            letterSpacing: 8,
            textTransform: "uppercase",
            color: "#a78bfa",
            marginBottom: 24,
          }}
        >
          reqst.xyz
        </div>
        <div style={{ fontSize: 84, fontWeight: 800, lineHeight: 1.05 }}>
          Crypto Payment Gateway
        </div>
        <div style={{ fontSize: 36, color: "rgba(255,255,255,0.7)", marginTop: 28 }}>
          Non-custodial checkout & API for USDT, TON, TRON, Solana & EVM
        </div>
      </div>
    ),
    { ...size },
  );
}
