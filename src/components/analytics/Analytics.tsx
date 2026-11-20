"use client";
// Pages vues et clics marqués data-track="evenement:libelle" (liens d'appel à l'action des pages serveur).
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { track, type AnalyticsEvent } from "@/lib/analytics";

export function Analytics() {
  const pathname = usePathname();
  useEffect(() => {
    if (pathname) track("pageview");
  }, [pathname]);
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest<HTMLElement>("[data-track]");
      if (!el) return;
      const [ev, label] = (el.dataset.track ?? "").split(":");
      if (ev) track(ev as AnalyticsEvent, label);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);
  return null;
}
