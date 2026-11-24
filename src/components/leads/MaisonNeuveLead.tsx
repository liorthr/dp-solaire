"use client";
import { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { LEAD_CONSENT_TEXT, submitLead, validateLead, type LeadInput } from "@/lib/cloud/leads";
import { track } from "@/lib/analytics";

const field = "mt-1 block w-full rounded-2xl border-2 border-line bg-white px-4 py-3 text-base focus:border-brand-600 focus:outline-none";

/** Demande de mise en relation avec un architecte partenaire (maison neuve). Rien n'est envoyé sans clic + case cochée. */
export function MaisonNeuveLead({ postcode, city }: { postcode?: string; city?: string }) {
  const [l, setL] = useState<LeadInput>({ fullName: "", email: "", phone: "", postcode: postcode ?? "", city: city ?? "", consent: false });
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [err, setErr] = useState("");
  const set = <K extends keyof LeadInput>(k: K, v: LeadInput[K]) => setL((x) => ({ ...x, [k]: v }));

  if (state === "sent")
    return (
      <div className="mt-6 rounded-3xl border-2 border-brand-600 bg-mint p-5" data-testid="lead-sent" role="status">
        <p className="text-lg font-extrabold">Demande envoyée, merci !</p>
        <p className="mt-1 text-sm">Nous transmettons votre projet à un architecte partenaire, qui vous recontactera directement. Vous pouvez retirer votre accord à tout moment (voir les <Link href="/mentions-legales/#mise-en-relation" className="underline">mentions légales</Link>).</p>
      </div>
    );

  return (
    <form
      className="mt-6 rounded-3xl border-2 border-line bg-white p-5"
      data-testid="lead-form"
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        const v = validateLead(l);
        if (v) return setErr(v);
        setErr("");
        setState("sending");
        try {
          await submitLead(l);
          track("lead", "maison_neuve");
          setState("sent");
        } catch (x) {
          setErr(x instanceof Error ? x.message : String(x));
          setState("idle");
        }
      }}
    >
      <p className="text-lg font-extrabold">Être mis en relation avec un architecte partenaire</p>
      <p className="mt-1 text-sm text-muted">Gratuit et sans engagement. Vos coordonnées sont <b>transmises à un architecte partenaire</b> de Permizy, qui vous recontacte pour étudier votre projet (conception, plans, dossier de permis).</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-semibold sm:col-span-2">Nom et prénom *<input className={field} autoComplete="name" value={l.fullName} onChange={(e) => set("fullName", e.target.value)} data-testid="lead-name" /></label>
        <label className="text-sm font-semibold">Email *<input className={field} type="email" autoComplete="email" value={l.email} onChange={(e) => set("email", e.target.value)} data-testid="lead-email" /></label>
        <label className="text-sm font-semibold">Téléphone<input className={field} type="tel" autoComplete="tel" value={l.phone} onChange={(e) => set("phone", e.target.value)} data-testid="lead-phone" /></label>
        <label className="text-sm font-semibold">Code postal du terrain<input className={field} inputMode="numeric" maxLength={5} value={l.postcode} onChange={(e) => set("postcode", e.target.value)} /></label>
        <label className="text-sm font-semibold">Commune<input className={field} value={l.city} onChange={(e) => set("city", e.target.value)} /></label>
        <label className="text-sm font-semibold">Surface envisagée (m²)<input className={field} type="number" min={10} max={2000} value={l.surfaceM2 ?? ""} onChange={(e) => set("surfaceM2", e.target.value ? Number(e.target.value) : undefined)} /></label>
        <label className="text-sm font-semibold">Terrain
          <select className={field} value={l.land ?? ""} onChange={(e) => set("land", (e.target.value || undefined) as LeadInput["land"])}>
            <option value="">Choisir</option>
            <option value="oui">J&apos;ai déjà le terrain</option>
            <option value="en_cours">Achat en cours</option>
            <option value="non">Je cherche encore</option>
          </select>
        </label>
        <label className="text-sm font-semibold sm:col-span-2">Démarrage souhaité
          <select className={field} value={l.timing ?? ""} onChange={(e) => set("timing", (e.target.value || undefined) as LeadInput["timing"])}>
            <option value="">Choisir</option>
            <option value="moins_6_mois">Dans moins de 6 mois</option>
            <option value="6_12_mois">Dans 6 à 12 mois</option>
            <option value="plus_12_mois">Dans plus d&apos;un an</option>
          </select>
        </label>
        <label className="text-sm font-semibold sm:col-span-2">Votre projet en quelques mots<textarea className={`${field} h-24`} maxLength={1000} value={l.message} onChange={(e) => set("message", e.target.value)} /></label>
      </div>
      <label className="mt-4 flex items-start gap-3 text-sm">
        <input type="checkbox" className="mt-1 h-5 w-5 shrink-0 accent-brand-600" checked={l.consent} onChange={(e) => set("consent", e.target.checked)} data-testid="lead-consent" />
        <span>{LEAD_CONSENT_TEXT} *</span>
      </label>
      {err && <p className="mt-3 rounded-2xl bg-red-50 p-3 text-sm text-red-800" role="alert">{err}</p>}
      <button type="submit" disabled={state === "sending"} className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-ink py-4 text-lg font-bold text-white disabled:opacity-50" data-testid="lead-submit">
        {state === "sending" && <Loader2 className="h-5 w-5 animate-spin" />} Envoyer ma demande
      </button>
      <p className="mt-2 text-xs text-muted">Données utilisées uniquement pour cette mise en relation, conservées 12 mois au plus. Détails : <Link href="/mentions-legales/#mise-en-relation" className="underline">mentions légales</Link>.</p>
    </form>
  );
}
