import { ImageResponse } from "next/og";
import { PUBLIC_MARKETING_COPY } from "@/i18n";
import fs from "fs";
import path from "path";

export const alt = "recv | Crypto Payments Infrastructure";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function Image({ params }: { params: { locale: string } }) {
  const { locale } = params;
  const copy = PUBLIC_MARKETING_COPY[locale === "ru" ? "ru" : "en"];

  const logoData = await fs.promises.readFile(
    path.join(process.cwd(), "public", "logo-transparent.png"),
  );
  const logoSrc = `data:image/png;base64,${logoData.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          background: "#050505",
          backgroundImage: "radial-gradient(circle at 15% 50%, rgba(124,58,237,0.4), transparent 50%)",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "80px 100px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoSrc} width={90} height={90} alt="" style={{ marginBottom: 36 }} />
          <div
            style={{
              fontSize: "72px",
              color: "white",
              fontWeight: 800,
              lineHeight: 1,
              marginBottom: "16px",
            }}
          >
            recv
          </div>
          <div
            style={{
              fontSize: "28px",
              color: "rgba(255, 255, 255, 0.6)",
              maxWidth: "620px",
              lineHeight: 1.4,
            }}
          >
            {copy.ogSubtitle}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
