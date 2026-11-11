// Lecture assistée par IA du règlement de zone du PLU : sortie JSON validée par Zod, citations obligatoires.
// Prompt versionné ; journalisation des appels (sans données personnelles : seule l'URL publique du règlement est transmise).
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

export const PROMPT_VERSION = "plu-solaire-2026.11.1";
const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5";

const Output = z.object({
  zone: z.string(),
  constraints: z
    .array(
      z.object({
        text: z.string().describe("contrainte reformulée en une phrase"),
        quote: z.string().describe("citation exacte du règlement"),
        page: z.number().int().optional(),
        topic: z.enum(["panneaux_solaires", "aspect_toiture", "couleurs_materiaux", "hauteur", "autre"]),
      }),
    )
    .max(15),
  uncertain: z.boolean(),
});

const ALLOWED_HOST = "data.geopf.fr";

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ error: "ANTHROPIC_API_KEY non configurée" }, { status: 501 });
  const { reglementUrl, zone } = (await req.json()) as { reglementUrl?: string; zone?: string };
  if (!reglementUrl || new URL(reglementUrl).hostname !== ALLOWED_HOST) return NextResponse.json({ error: "URL de règlement invalide (Géoplateforme attendue)" }, { status: 400 });
  const pdf = await fetch(reglementUrl);
  if (!pdf.ok) return NextResponse.json({ error: `Règlement inaccessible (${pdf.status})` }, { status: 502 });
  const data = Buffer.from(await pdf.arrayBuffer()).toString("base64");
  const client = new Anthropic();
  const t0 = Date.now();
  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: 4000,
    messages: [
      {
        role: "user",
        content: [
          { type: "document", source: { type: "base64", media_type: "application/pdf", data } },
          {
            type: "text",
            text: `[${PROMPT_VERSION}] Tu analyses le règlement écrit d'un PLU français. Zone concernée : « ${zone} » (et ses sous-secteurs, ainsi que les dispositions communes applicables à toutes les zones). Extrais UNIQUEMENT les règles pertinentes pour la pose de panneaux photovoltaïques en toiture d'une maison existante (panneaux solaires, énergies renouvelables, aspect des toitures, couleurs et matériaux de couverture). Chaque contrainte doit comporter une citation EXACTE du texte et le numéro de page. N'invente rien ; si rien n'est trouvé, renvoie une liste vide et uncertain=true. Réponds par un JSON strict : {"zone":string,"constraints":[{"text":string,"quote":string,"page":number,"topic":"panneaux_solaires"|"aspect_toiture"|"couleurs_materiaux"|"hauteur"|"autre"}],"uncertain":boolean}`,
          },
        ],
      },
    ],
  });
  const text = msg.content.map((c) => (c.type === "text" ? c.text : "")).join("");
  const json = text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
  const parsed = Output.safeParse(JSON.parse(json || "{}"));
  console.info(JSON.stringify({ event: "ai_call", prompt: PROMPT_VERSION, model: MODEL, ms: Date.now() - t0, ok: parsed.success, input_tokens: msg.usage.input_tokens, output_tokens: msg.usage.output_tokens }));
  if (!parsed.success) return NextResponse.json({ error: "Sortie IA non conforme au schéma", issues: parsed.error.issues }, { status: 502 });
  return NextResponse.json({ ...parsed.data, model: MODEL, promptVersion: PROMPT_VERSION, source: reglementUrl, label: "Extraction IA : à valider" });
}
