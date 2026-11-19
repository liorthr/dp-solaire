import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/app/", "/api/", "/connexion/"] }],
    sitemap: "https://permizy.com/sitemap.xml",
    host: "https://permizy.com",
  };
}
