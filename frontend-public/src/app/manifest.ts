import type { MetadataRoute } from "next";
import { BRAND_ICON_PATH, BRAND_LOGO_PATH } from "@/lib/seo";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "recv",
    short_name: "recv",
    description: "Non-custodial crypto payments infrastructure for merchants and developers.",
    start_url: "/en",
    scope: "/",
    display: "standalone",
    background_color: "#050505",
    theme_color: "#7c3aed",
    icons: [
      { src: "/favicon.ico", sizes: "any", type: "image/x-icon" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: BRAND_ICON_PATH, sizes: "512x512", type: "image/png", purpose: "any" },
      { src: BRAND_LOGO_PATH, sizes: "500x500", type: "image/png", purpose: "any" },
    ],
  };
}
