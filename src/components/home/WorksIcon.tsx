// Pictogrammes des types de travaux (identité Permizy)
import type { WorksType } from "@/lib/types";
import { cn } from "@/lib/cn";

export const WORKS_STYLE: Record<WorksType, { bg: string; stroke: string; path: React.ReactNode; sub: string }> = {
  pv: { bg: "bg-sun-soft", stroke: "#b36b00", sub: "sur le toit de la maison", path: <><rect x="3" y="7" width="18" height="11" rx="1" /><path d="M3 12.5h18M9 7v11M15 7v11" /></> },
  pac: { bg: "bg-sky", stroke: "#2b5d8a", sub: "unité extérieure", path: <><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="10" cy="12" r="4" /><path d="M16 9h3M16 12h3M16 15h3" /></> },
  menuiserie: { bg: "bg-mint", stroke: "#1f6b4a", sub: "changer ou créer", path: <><rect x="5" y="3" width="14" height="18" rx="1" /><path d="M12 3v18M5 12h14" /></> },
  velux: { bg: "bg-[#ece5f7]", stroke: "#5b3f8f", sub: "avec ou sans combles", path: <><path d="M3 15L12 5l9 10" /><rect x="9.5" y="9.5" width="5" height="5" /></> },
  ite: { bg: "bg-[#fde3dc]", stroke: "#c4472f", sub: "enduit ou bardage", path: <><path d="M4 20V8l8-5 8 5v12" /><path d="M4 12h16M4 16h16" /></> },
};

export function WorksIcon({ works, className, size = 28 }: { works: WorksType; className?: string; size?: number }) {
  const s = WORKS_STYLE[works];
  return (
    <span className={cn("inline-grid flex-none place-items-center rounded-2xl", s.bg, className)} aria-hidden>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={s.stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {s.path}
      </svg>
    </span>
  );
}
