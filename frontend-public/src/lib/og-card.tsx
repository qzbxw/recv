import { ImageResponse } from "next/og";
import fs from "fs";
import path from "path";

export const OG_SIZE = { width: 1200, height: 630 };

export const OG_TITLE_MAX = 90;
export const OG_KICKER_MAX = 48;

// Satori cannot consume variable/woff2 fonts, so static Manrope instances
// (latin+cyrillic subsets) are bundled next to this module.
let assets: { regular: Buffer; bold: Buffer; logoSrc: string } | null = null;

function loadAssets() {
  if (!assets) {
    const fontsDir = path.join(process.cwd(), "src", "lib", "og-fonts");
    const logo = fs.readFileSync(path.join(process.cwd(), "public", "logo-transparent.png"));
    assets = {
      regular: fs.readFileSync(path.join(fontsDir, "manrope-regular.ttf")),
      bold: fs.readFileSync(path.join(fontsDir, "manrope-bold.ttf")),
      logoSrc: `data:image/png;base64,${logo.toString("base64")}`,
    };
  }
  return assets;
}

// Shared 1200×630 social card: kicker (page type), title, brand footer.
export function ogCardResponse({
  title,
  kicker,
  locale,
  coverSrc,
}: {
  title: string;
  kicker?: string;
  locale: "en" | "ru";
  coverSrc?: string;
}) {
  const { regular, bold, logoSrc } = loadAssets();
  const safeTitle = title.slice(0, OG_TITLE_MAX);
  const safeKicker = (kicker ?? "").slice(0, OG_KICKER_MAX);
  const titleSize = safeTitle.length > 60 ? 52 : safeTitle.length > 36 ? 62 : 72;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 88px",
          background: "#050505",
          backgroundImage:
            "radial-gradient(circle at 12% 20%, rgba(124,58,237,0.45), transparent 55%), radial-gradient(circle at 90% 90%, rgba(99,102,241,0.25), transparent 50%)",
          fontFamily: "Manrope",
        }}
      >
        {coverSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverSrc}
            alt=""
            width={520}
            height={630}
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: 520,
              height: 630,
              objectFit: "cover",
              opacity: 0.38,
              maskImage: "linear-gradient(to right, transparent, black 35%)",
            }}
          />
        ) : null}
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoSrc} width={64} height={64} alt="" />
          <div style={{ fontSize: 40, fontWeight: 700, color: "white", display: "flex" }}>
            recv<span style={{ color: "#a78bfa" }}>.</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: coverSrc ? 820 : 980 }}>
          {safeKicker ? (
            <div
              style={{
                fontSize: 24,
                fontWeight: 700,
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                color: "rgba(167,139,250,0.9)",
              }}
            >
              {safeKicker}
            </div>
          ) : null}
          <div
            style={{
              fontSize: titleSize,
              fontWeight: 700,
              color: "white",
              lineHeight: 1.12,
              letterSpacing: "-0.02em",
            }}
          >
            {safeTitle}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 24,
            color: "rgba(255,255,255,0.55)",
          }}
        >
          <div style={{ display: "flex" }}>recv.money</div>
          <div style={{ display: "flex" }}>
            {locale === "ru"
              ? "Криптоплатежи напрямую на ваш кошелёк"
              : "Crypto payments straight to your wallet"}
          </div>
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        { name: "Manrope", data: regular, weight: 400, style: "normal" },
        { name: "Manrope", data: bold, weight: 700, style: "normal" },
      ],
    },
  );
}
