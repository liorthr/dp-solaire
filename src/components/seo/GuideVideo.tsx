// Vidéo pédagogique : aucun octet chargé avant le clic (preload="none"), sous-titres, transcription HTML, VideoObject.
import type { VideoMeta } from "@/data/seo/videos";
import { abs } from "@/lib/seo/site";
import { JsonLd } from "./JsonLd";

export function GuideVideo({ v }: { v: VideoMeta }) {
  const base = `/videos/${v.slug}`;
  const ld = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: v.title,
    description: v.description,
    thumbnailUrl: abs(`${base}/poster.jpg`),
    uploadDate: v.uploadDate,
    duration: `PT${Math.floor(v.durationSec / 60)}M${v.durationSec % 60}S`,
    contentUrl: abs(`${base}/video.mp4`),
    inLanguage: "fr-FR",
    transcript: v.transcript.join(" "),
    publisher: { "@id": "https://permizy.com/#organization" },
  };
  return (
    <figure className="mt-8">
      <JsonLd data={ld} />
      <video controls preload="none" poster={`${base}/poster.jpg`} width={1280} height={720} className="h-auto w-full rounded-2xl border border-line bg-white" data-testid="guide-video">
        <source src={`${base}/video.mp4`} type="video/mp4" />
        <track kind="captions" src={`${base}/captions.vtt`} srcLang="fr" label="Français" default />
      </video>
      <figcaption className="mt-1.5 text-xs text-muted">
        Vidéo : {v.title} ({Math.round(v.durationSec)} s). Schémas explicatifs, non officiels.
      </figcaption>
      <details className="mt-2 rounded-2xl border border-line bg-white p-4 text-sm">
        <summary className="cursor-pointer font-semibold">Transcription de la vidéo</summary>
        <div className="mt-2 space-y-2 text-muted">
          {v.transcript.map((t) => <p key={t}>{t}</p>)}
          <p className="text-xs">Sources : {v.sources.join(" ; ")}.</p>
        </div>
      </details>
    </figure>
  );
}
