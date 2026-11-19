import type { MetadataRoute } from "next";
import { GUIDES } from "@/data/seo/guides";

export const dynamic = "force-static";
const BASE = "https://permizy.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const today = process.env.NEXT_PUBLIC_BUILD_DATE ?? new Date().toISOString().slice(0, 10);
  return [
    { url: `${BASE}/`, lastModified: today, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/verifier/`, lastModified: today, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/tarifs/`, lastModified: today, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/guides/`, lastModified: today, changeFrequency: "weekly", priority: 0.8 },
    ...GUIDES.map((g) => ({ url: `${BASE}/${g.slug}/`, lastModified: g.updated, changeFrequency: "monthly" as const, priority: 0.9 })),
    { url: `${BASE}/cgu/`, lastModified: today, changeFrequency: "yearly", priority: 0.2 },
  ];
}
