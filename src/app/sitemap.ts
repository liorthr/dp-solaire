import type { MetadataRoute } from "next";
import { GUIDES } from "@/data/seo/guides";
import { videoForGuide } from "@/data/seo/videos";
import { CITIES, LOCAL_FETCHED_AT } from "@/data/seo/local";

export const dynamic = "force-static";
const BASE = "https://permizy.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const today = process.env.NEXT_PUBLIC_BUILD_DATE ?? new Date().toISOString().slice(0, 10);
  return [
    { url: `${BASE}/`, lastModified: today, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/verifier/`, lastModified: today, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/tarifs/`, lastModified: today, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/guides/`, lastModified: today, changeFrequency: "weekly", priority: 0.8 },
    ...GUIDES.map((g) => {
      const v = videoForGuide(g.slug);
      return {
        url: `${BASE}/${g.slug}/`,
        lastModified: g.updated,
        changeFrequency: "monthly" as const,
        priority: 0.9,
        ...(v ? { videos: [{ title: v.title, description: v.description, thumbnail_loc: `${BASE}/videos/${v.slug}/poster.jpg`, content_loc: `${BASE}/videos/${v.slug}/video.mp4`, duration: v.durationSec, publication_date: v.uploadDate, family_friendly: "yes" as const }] } : {}),
      };
    }),
    ...CITIES.map((c) => ({ url: `${BASE}/declaration-prealable/${c.slug}/`, lastModified: LOCAL_FETCHED_AT, changeFrequency: "monthly" as const, priority: 0.7 })),
    { url: `${BASE}/a-propos/`, lastModified: today, changeFrequency: "yearly", priority: 0.4 },
    { url: `${BASE}/mentions-legales/`, lastModified: today, changeFrequency: "yearly", priority: 0.2 },
    { url: `${BASE}/cgu/`, lastModified: today, changeFrequency: "yearly", priority: 0.2 },
  ];
}
