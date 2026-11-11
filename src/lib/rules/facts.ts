// Construction des faits évalués par le moteur à partir du projet (une seule source de vérité).
import type { Client, EnrichmentResult, PanelModel, Project } from "@/lib/types";
import { evaluate, ruleset, type Facts } from "./engine";
import { layoutCapacity } from "@/lib/geo/calepinage";

export interface FactsContext {
  project: Project;
  client?: Client;
  panel?: PanelModel;
  /** pièces effectivement générées (codes DP1…) */
  generatedPieces?: string[];
  /** pour la règle « personne morale » */
  filingByLegalEntity?: boolean;
}

export function heritageLabel(e?: EnrichmentResult) {
  const h = e?.heritage;
  if (!h) return "";
  const parts = [];
  if (h.inAbordsMH) parts.push("abords de monument historique");
  if (h.inSPR) parts.push("site patrimonial remarquable");
  if (h.inSiteClasseOuInscrit) parts.push("site inscrit ou classé");
  return parts.join(", ");
}

export function buildFacts(ctx: FactsContext): Facts {
  const { project: p, client, panel } = ctx;
  const e = p.enrichment;
  const ov = p.overrides ?? {};
  const h = e?.heritage;

  const protectedOverride = ov["heritage.protected"];
  const isProtected = typeof protectedOverride === "boolean" ? protectedOverride : Boolean(h && (h.inAbordsMH || h.inSPR || h.inSiteClasseOuInscrit));

  const panelWc = panel?.powerWc ?? 0;
  const computedKwc = (p.pv.panelCount * panelWc) / 1000;
  const mismatch = p.pv.powerKwc > 0 && computedKwc > 0 ? (Math.abs(computedKwc - p.pv.powerKwc) / p.pv.powerKwc) * 100 : 0;

  const placed = p.pv.layouts.reduce((s, l) => s + l.panels.length, 0);
  const capacity = panel ? p.pv.roofPlanes.reduce((s, rp) => {
    const l = p.pv.layouts.find((x) => x.roofPlaneId === rp.id);
    return s + layoutCapacity(rp, panel, l).count;
  }, 0) : 0;

  const zone = e?.zones?.[0];
  const pm1 = e?.servitudes?.find((s) => s.suptype === "pm1");

  const photoFacade = p.photos.find((x) => x.kind === "facade");
  const qualityIssues = p.photos.flatMap((ph) => (ph.quality?.issues ?? []).map((i) => `${ph.kind === "facade" ? "Photo façade" : ph.kind === "proche" ? "Photo proche" : "Photo lointaine"} : ${i.message}`));

  const worstSouthDev = p.pv.roofPlanes.reduce((m, rp) => Math.max(m, Math.abs(((rp.azimuthDeg - 180 + 540) % 360) - 180)), 0);

  const clientComplete = Boolean(client && client.lastName && client.firstName && (client.email || client.phone));

  const facts: Facts = {
    "commune.insee": p.address?.insee ?? "",
    "address.ok": Boolean(p.address?.label),
    "parcels.count": e?.parcels?.length ?? 0,
    "building.found": Boolean(e?.mainBuildingId) || Boolean(ov["building.manual"]),
    "client.complete": clientComplete,
    "mandate.signed": Boolean(p.mandate),

    "pv.powerKwc": p.pv.powerKwc,
    "pv.panelCount": p.pv.panelCount,
    "pv.panelWc": panelWc,
    "pv.computedKwc": Math.round(computedKwc * 100) / 100,
    "pv.powerMismatchPct": Math.round(mismatch * 10) / 10,
    "pv.isGround": p.pv.mounting === "sol" || p.pv.mounting === "ombriere",
    "pv.groundHeightM": p.pv.groundHeightM ?? 0,
    "pv.fullBlack": Boolean(panel?.fullBlack),
    "pv.mounting": p.pv.mounting,

    "layout.placed": placed,
    "layout.mismatch": placed !== p.pv.panelCount,
    "layout.capacityShortfall": Math.max(0, p.pv.panelCount - capacity),

    "roof.worstSouthDeviation": worstSouthDev,

    "photos.facade": Boolean(photoFacade),
    "photos.proche": p.photos.some((x) => x.kind === "proche"),
    "photos.lointain": p.photos.some((x) => x.kind === "lointain"),
    "photos.qualityIssues": qualityIssues.length,
    "photos.qualityList": qualityIssues.join(" ; "),
    "insertion.done": p.insertions.some((i) => i.quad.length === 4),

    "heritage.protected": isProtected,
    "heritage.abordsMH": Boolean(h?.inAbordsMH),
    "heritage.label": heritageLabel(e) || (isProtected ? "secteur protégé déclaré" : ""),
    "heritage.divergence": Boolean(h?.divergences?.length) && typeof protectedOverride !== "boolean",
    "heritage.divergenceText": h?.divergences?.join(" ") ?? "",

    "plu.hasZone": Boolean(zone),
    "plu.rnu": Boolean(e?.rnu),
    "plu.typezone": zone?.typezone ?? "",
    "plu.libelle": zone?.libelle ?? "",
    "plu.libelong": zone?.libelong ?? "",
    "plu.docName": zone ? `${zone.docType} ${zone.docName}` : "",

    "sup.pm1": Boolean(pm1),
    "sup.pm1Name": pm1?.name ?? "",

    "answers.visibleFromPublicSpace": p.answers.visibleFromPublicSpace,
    "answers.inLotissement": p.answers.inLotissement ?? "nsp",
    "answers.copropriete": Boolean(p.answers.copropriete),
    "answers.buildingIsListedMH": Boolean(p.answers.buildingIsListedMH),
    "answers.modifiesVolume": Boolean(p.answers.modifiesVolume),

    "mairie.hasEmail": Boolean(e?.mairie?.email || ov["mairie.email"]),
    "filing.byLegalEntity": Boolean(ctx.filingByLegalEntity),
    "filing.paper": p.filingMode === "lrar" || p.filingMode === "main_propre",
  };

  // pièces requises / manquantes
  const generated = new Set(ctx.generatedPieces ?? availablePieces(p));
  const missing = ruleset.pieces.filter((pc) => !pc.optional && evaluate(pc.required, facts) && !generated.has(pc.code));
  facts["pieces.missingCount"] = missing.length;
  facts["pieces.missingList"] = missing.map((m) => `${m.code} (${m.label})`).join(", ");
  return facts;
}

/** pièces que l'application est en mesure de produire avec les données actuelles */
export function availablePieces(p: Project): string[] {
  const out = ["DP1", "DP2", "DP3", "DP4", "DP11"];
  const hasFacade = p.photos.some((x) => x.kind === "facade");
  const hasInsertion = p.insertions.some((i) => i.quad.length === 4);
  if (hasFacade && hasInsertion) out.push("DP5", "DP6");
  if (p.photos.some((x) => x.kind === "proche")) out.push("DP7");
  if (p.photos.some((x) => x.kind === "lointain")) out.push("DP8");
  return out;
}
