import { cn } from "@/lib/cn";

/** logo Permizy : tampon « feu vert » + mot-symbole */
export function Logo({ className, size = "md" }: { className?: string; size?: "sm" | "md" | "lg" }) {
  const s = { sm: "h-6 w-6", md: "h-8 w-8", lg: "h-10 w-10" }[size];
  const t = { sm: "text-lg", md: "text-2xl", lg: "text-3xl" }[size];
  return (
    <span className={cn("inline-flex items-center gap-2 font-extrabold tracking-tight text-ink", t, className)}>
      <span className={cn("stamp text-brand-600", s)} aria-hidden>
        <svg viewBox="0 0 24 24" className="h-1/2 w-1/2" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      </span>
      <span>
        permiz<span className="text-brand-600">y</span>
      </span>
    </span>
  );
}

/** grand tampon « FEU VERT » */
export function GreenStamp({ className, label = "MAIRIE ✓" }: { className?: string; label?: string }) {
  return (
    <div className={cn("stamp border-[6px] bg-cream/90 text-center font-black leading-none text-brand-600 shadow-lg", className)}>
      <div>
        <div className="text-[1.9em]">
          FEU
          <br />
          VERT
        </div>
        <div className="mt-1 text-[0.55em] font-bold tracking-[0.2em]">{label}</div>
      </div>
    </div>
  );
}
