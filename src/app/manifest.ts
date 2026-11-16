import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
  return {
    name: "Permizy : le oui de la mairie, sans la paperasse",
    short_name: "Permizy",
    start_url: `${base}/`,
    display: "standalone",
    background_color: "#fbf6ee",
    theme_color: "#1f6b4a",
    icons: [
      { src: `${base}/icon-512.png`, sizes: "512x512", type: "image/png" },
      { src: `${base}/apple-icon.png`, sizes: "180x180", type: "image/png" },
    ],
  };
}
