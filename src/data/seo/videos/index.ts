// Vidéos pédagogiques générées par scripts/video/make-video.mjs (métadonnées écrites par le script).
import piecesDp1Dp8 from "./pieces-dp1-dp8.json";

export interface VideoMeta {
  slug: string;
  title: string;
  description: string;
  guide: string;
  durationSec: number;
  uploadDate: string;
  voice: string;
  transcript: string[];
  sources: string[];
}
export const VIDEOS: VideoMeta[] = [piecesDp1Dp8];
export const videoForGuide = (slug: string) => VIDEOS.find((v) => v.guide === slug);
