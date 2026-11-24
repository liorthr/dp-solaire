"use client";
// Mesure d'audience sans cookie : aucun identifiant, aucune IP stockée, aucune adresse ni paramètre d'URL.
// Événements d'une liste fermée (vérifiée aussi côté base), envoyés à Supabase en insertion seule.
const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

export type AnalyticsEvent = "pageview" | "verify_start" | "verify_verdict" | "verify_prepare" | "signup" | "project_created" | "pay_click" | "paid" | "guide_cta" | "lead";

const clean = (s: string, max: number) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, max);

/** chemin sans paramètres ni ancre ; les pages applicatives sont regroupées (aucun identifiant de dossier) */
export function cleanPath(pathname: string) {
  const p = pathname.toLowerCase().split(/[?#]/)[0].replace(/[^a-z0-9/_-]/g, "");
  return (p.startsWith("/") ? p : `/${p}`).slice(0, 120) || "/";
}

function optedOut() {
  const n = navigator as Navigator & { globalPrivacyControl?: boolean };
  return n.doNotTrack === "1" || n.globalPrivacyControl === true;
}

export function track(event: AnalyticsEvent, label?: string) {
  if (typeof window === "undefined" || !URL_ || !KEY || optedOut()) return;
  if (/^(localhost|127\.)/.test(window.location.hostname)) return;
  let ref: string | null = null;
  try {
    const h = document.referrer ? new URL(document.referrer).hostname.replace(/^www\./, "") : "";
    ref = h && h !== window.location.hostname.replace(/^www\./, "") ? h.slice(0, 60) : null;
  } catch {
    ref = null;
  }
  const utm = new URLSearchParams(window.location.search).get("utm_source");
  const body = {
    event,
    path: cleanPath(window.location.pathname),
    ref,
    source: utm ? clean(utm, 40) || null : null,
    device: window.matchMedia("(max-width: 768px)").matches ? "mobile" : "desktop",
    label: label ? clean(label, 40) || null : null,
  };
  void fetch(`${URL_}/rest/v1/analytics_events`, {
    method: "POST",
    keepalive: true,
    headers: { apikey: KEY, "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify(body),
  }).catch(() => undefined);
}
