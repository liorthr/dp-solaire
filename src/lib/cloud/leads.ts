"use client";
// Demandes de mise en relation (maison neuve → architecte partenaire). Envoi direct, sans bibliothèque :
// la base n'accepte qu'une insertion avec consentement explicite et n'autorise aucune lecture publique.
const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

export const LEAD_CONSENT_TEXT =
  "J'accepte que Permizy transmette ces informations à un architecte partenaire, qui pourra me recontacter au sujet de mon projet de maison. Je peux retirer mon accord à tout moment.";

export interface LeadInput {
  fullName: string;
  email: string;
  phone?: string;
  postcode?: string;
  city?: string;
  surfaceM2?: number;
  land?: "oui" | "en_cours" | "non";
  timing?: "moins_6_mois" | "6_12_mois" | "plus_12_mois";
  message?: string;
  consent: boolean;
}

export const leadsEnabled = () => Boolean(URL_ && KEY);

export function validateLead(l: LeadInput): string | null {
  if (l.fullName.trim().length < 2) return "Indiquez votre nom.";
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(l.email.trim())) return "Adresse email invalide.";
  if (l.phone && !/^[0-9 +().-]{6,25}$/.test(l.phone.trim())) return "Numéro de téléphone invalide.";
  if (l.postcode && !/^[0-9]{5}$/.test(l.postcode.trim())) return "Code postal invalide (5 chiffres).";
  if (!l.consent) return "Cochez la case d'accord pour que nous puissions transmettre votre demande.";
  return null;
}

export async function submitLead(l: LeadInput) {
  const err = validateLead(l);
  if (err) throw new Error(err);
  if (!leadsEnabled()) throw new Error("Envoi indisponible pour le moment : réessayez plus tard.");
  const r = await fetch(`${URL_}/rest/v1/leads`, {
    method: "POST",
    headers: { apikey: KEY, "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({
      kind: "maison_neuve",
      full_name: l.fullName.trim(),
      email: l.email.trim(),
      phone: l.phone?.trim() || null,
      postcode: l.postcode?.trim() || null,
      city: l.city?.trim() || null,
      surface_m2: l.surfaceM2 || null,
      land: l.land ?? null,
      timing: l.timing ?? null,
      message: l.message?.trim().slice(0, 1000) || null,
      consent: l.consent,
      consent_text: LEAD_CONSENT_TEXT,
    }),
  });
  if (!r.ok) throw new Error("L'envoi n'a pas abouti : vérifiez les champs puis réessayez.");
}
