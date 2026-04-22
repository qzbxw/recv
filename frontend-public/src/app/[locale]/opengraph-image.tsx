import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Reqst | Crypto Payments Infrastructure";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function Image({ params }: { params: { locale: string } }) {
  const { locale } = params;

  return new ImageResponse(
    (
      <div
        style={{
          background: "#050505",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              width: "100px",
              height: "100px",
              background: "#0066FF",
              borderRadius: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "60px",
              color: "white",
              fontWeight: "bold",
            }}
          >
            R
          </div>
        </div>
        <div
          style={{
            fontSize: "60px",
            color: "white",
            fontWeight: "bold",
            marginBottom: "10px",
          }}
        >
          Reqst
        </div>
        <div
          style={{
            fontSize: "30px",
            color: "rgba(255, 255, 255, 0.6)",
            textAlign: "center",
            maxWidth: "800px",
          }}
        >
          {locale === "ru" 
            ? "Инфраструктура криптоплатежей нового поколения" 
            : "Next-generation crypto payments infrastructure"}
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
