// Proxy serveur pour les API publiques sans CORS (Annuaire, PVGIS). Liste blanche stricte d'hôtes (anti-SSRF).
import { NextResponse } from "next/server";

const ALLOWED = new Set(["api-lannuaire.service-public.fr", "re.jrc.ec.europa.eu"]);

export async function GET(req: Request) {
  const target = new URL(req.url).searchParams.get("url");
  if (!target) return NextResponse.json({ error: "url manquante" }, { status: 400 });
  let u: URL;
  try {
    u = new URL(target);
  } catch {
    return NextResponse.json({ error: "url invalide" }, { status: 400 });
  }
  if (u.protocol !== "https:" || !ALLOWED.has(u.hostname)) return NextResponse.json({ error: "hôte non autorisé" }, { status: 403 });
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 20_000);
  try {
    const r = await fetch(u, { signal: ctrl.signal, headers: { Accept: "application/json", "User-Agent": "dp-solaire/0.1" } });
    const body = await r.text();
    return new NextResponse(body, { status: r.status, headers: { "content-type": r.headers.get("content-type") ?? "application/json", "cache-control": "public, max-age=86400" } });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 502 });
  } finally {
    clearTimeout(t);
  }
}
