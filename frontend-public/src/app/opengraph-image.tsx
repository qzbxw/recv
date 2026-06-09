import { ImageResponse } from "next/og";
import fs from "fs";
import path from "path";

export const alt = "recv — Crypto Payment Gateway";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const logoData = await fs.promises.readFile(
    path.join(process.cwd(), "public", "logo-transparent.png"),
  );
  const logoSrc = `data:image/png;base64,${logoData.toString("base64")}`;

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
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} width={80} height={80} alt="" style={{ marginBottom: 32 }} />
        <div
          style={{
            fontSize: 40,
            letterSpacing: 8,
            textTransform: "uppercase",
            color: "#a78bfa",
            marginBottom: 20,
          }}
        >
          recv.money
        </div>
        <div style={{ fontSize: 84, fontWeight: 800, lineHeight: 1.05 }}>
          Crypto Payment Gateway
        </div>
        <div style={{ fontSize: 36, color: "rgba(255,255,255,0.7)", marginTop: 28 }}>
          Non-custodial checkout & API for USDT, TON, TRON, TON_USDT & EVM
        </div>
      </div>
    ),
    { ...size },
  );
}
