import type { MetadataRoute } from "next";

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
    ],
  };
}
