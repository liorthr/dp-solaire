// Schéma unifilaire simplifié (SVG vectoriel, page A4 avec cartouche) pour Consuel et Enedis.
import type { ElecInfo, InverterModel, PanelModel, Project } from "@/lib/types";
import { DRAW, n, page, text, type Cartouche } from "@/lib/plans/svg";
import type { ElecResult } from "./calc";

const box = (x: number, y: number, w: number, h: number, title: string, lines: string[], fill = "#fff") =>
  `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="1.5" fill="${fill}" stroke="#111" stroke-width="0.45"/>` +
  text(x + w / 2, y + 5, title, 2.9, { anchor: "middle", weight: "bold" }) +
  lines.map((l, i) => text(x + w / 2, y + 9.5 + i * 3.6, l, 2.3, { anchor: "middle" })).join("");

const wire = (x1: number, y1: number, x2: number, y2: number, label?: string, color = "#111", dash = "") =>
  `<line x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}" stroke="${color}" stroke-width="0.6"${dash ? ` stroke-dasharray="${dash}"` : ""}/>` +
  (label ? text((x1 + x2) / 2, Math.min(y1, y2) - 1.5, label, 2.4, { anchor: "middle", fill: color, weight: "bold" }) : "");

const earth = (x: number, y: number) =>
  `<line x1="${n(x)}" y1="${n(y)}" x2="${n(x)}" y2="${n(y + 5)}" stroke="#15803d" stroke-width="0.5"/>` +
  [0, 1, 2].map((i) => `<line x1="${n(x - 3 + i)}" y1="${n(y + 5 + i * 1.2)}" x2="${n(x + 3 - i)}" y2="${n(y + 5 + i * 1.2)}" stroke="#15803d" stroke-width="0.5"/>`).join("");

export function singleLineSvg(p: Project, e: ElecInfo, r: ElecResult, panel: PanelModel | undefined, inv: InverterModel | undefined, cart: Omit<Cartouche, "code" | "title" | "scale" | "legend" | "notes">) {
  const y = DRAW.y + 40;
  const h = 34;
  const parts: string[] = [];
  const links: string[] = [];
  const L = (desc: string) => {
    links.push(desc);
    return `L${links.length}`;
  };
  const x0 = DRAW.x + 2;
  const W = 24;
  const gap = (DRAW.w - 4 - W * 7) / 6;
  const X = (i: number) => x0 + i * (W + gap);
  const pv = `${p.pv.panelCount} modules`;
  // 1 champ PV
  parts.push(box(X(0), y, W, h, "Champ PV", [pv, `${String(p.pv.powerKwc).replace(".", ",")} kWc`, panel ? `${panel.powerWc} Wc` : "", r.iscMaxA ? `Iscmax ${r.iscMaxA} A` : "", r.uocMaxV ? `Uocmax ${r.uocMaxV} V` : ""], "#e0f2fe"));
  // 2 conversion
  if (r.isMicro) {
    parts.push(box(X(1), y, W, h, "Micro-onduleurs", [`${r.microCount} × ${inv?.powerVa ?? "?"} VA`, inv ? inv.model.replace(/\s*\(exemple\)/, "").slice(0, 20) : "", "NF EN 62109", inv?.integratedDecoupling !== false ? "Découplage intégré" : "Découplage externe", "EN 50549-1"], "#fef9c3"));
    parts.push(box(X(2), y, W, h, "Boîte AC", ["Coffret de", "jonction AC", "(+ parafoudre", "si requis)"]));
    parts.push(wire(X(0) + W, y + h / 2, X(1), y + h / 2, L(`DC : modules vers micro-onduleurs, câble solaire ${e.dcCableSectionMm2} mm², âme 90 °C`), "#b91c1c"));
  } else {
    parts.push(box(X(1), y, W, h, "Sect. DC", ["Interrupteur-", "sectionneur DC", e.dcSwitchUn ? `Un ${e.dcSwitchUn} Vdc` : "Un > Uocmax", e.dcSwitchIn ? `In ${e.dcSwitchIn} A` : "In > Iscmax", "Coupure urgence"]));
    parts.push(box(X(2), y, W, h, "Onduleur", [inv ? inv.model.replace(/\s*\(exemple\)/, "").slice(0, 20) : "Onduleur", `${r.acPowerVa} VA`, "NF EN 62109", inv?.integratedDecoupling !== false ? "Découplage intégré" : "Découplage externe", "EN 50549-1"], "#fef9c3"));
    parts.push(wire(X(0) + W, y + h / 2, X(1), y + h / 2, L(`DC : ${e.strings ?? 1} chaîne(s) de ${r.modulesInSeries} modules en série, câble solaire ${e.dcCableSectionMm2} mm²`), "#b91c1c"));
    parts.push(wire(X(1) + W, y + h / 2, X(2), y + h / 2, L(`DC : sectionneur vers onduleur, ${e.dcCableSectionMm2} mm²`), "#b91c1c"));
  }
  if (r.isMicro) parts.push(wire(X(1) + W, y + h / 2, X(2), y + h / 2, L("AC : câble de liaison des micro-onduleurs (fourni par le fabricant)"), "#1d4ed8"));
  // 3 protection AC
  parts.push(box(X(3), y, W, h, "Protection AC", [`Disjoncteur ${r.breakerA} A`, `Différentiel 30 mA`, "(type selon notice", "onduleur)", `Cas ${e.connectionCase} (SC 144)`], "#ede9fe"));
  parts.push(wire(X(2) + W, y + h / 2, X(3), y + h / 2, L(`AC : câble cuivre ${r.sectionMm2} mm², longueur ${e.acCableLengthM} m, courant ${String(r.iAcA).replace(".", ",")} A, chute de tension ${String(r.dropPct).replace(".", ",")} %`), "#1d4ed8"));
  // 4 tableau
  parts.push(box(X(4), y, W, h, "Tableau", [e.board === "principal" ? "principal" : "divisionnaire", "Installation de", "consommation", "NF C 15-100-1", "§ 551.7"]));
  parts.push(wire(X(3) + W, y + h / 2, X(4), y + h / 2, "", "#1d4ed8"));
  // 5 AGCP
  parts.push(box(X(5), y, W, h, "AGCP", ["Disjoncteur de", "branchement", e.agcpA ? `réglé à ${e.agcpA} A` : "réglage ?", e.subscribedKva ? `${e.subscribedKva} kVA souscrits` : "", e.phase === "tri" ? "Triphasé" : "Monophasé"]));
  parts.push(wire(X(4) + W, y + h / 2, X(5), y + h / 2, "", "#1d4ed8"));
  // 6 compteur + réseau
  parts.push(box(X(6), y, W, h, "Compteur", ["Linky (Enedis)", e.pdl ? `PDL ${e.pdl}` : "PDL à compléter", e.injection === "sans" ? "Sans injection" : e.injection === "surplus" ? "Injection surplus" : "Injection totale", "", "vers réseau public"], "#dcfce7"));
  parts.push(wire(X(5) + W, y + h / 2, X(6), y + h / 2, "", "#1d4ed8"));
  // batterie
  if (e.battery) {
    parts.push(box(X(2), y + h + 18, W, 24, "Batterie", [e.batteryRef ?? "Stockage", e.batteryKwh ? `${e.batteryKwh} kWh` : "", "NF EN 62619"], "#fce7f3"));
    parts.push(wire(X(2) + W / 2, y + h, X(2) + W / 2, y + h + 18, "", "#be185d", "1.5 1"));
  }
  // terre
  parts.push(wire(X(0) + W / 2, y + h, X(0) + W / 2, y + h + 6, "", "#15803d"), earth(X(0) + W / 2, y + h + 6), text(X(0) + W / 2 + 4, y + h + 10, "Équipotentialité des masses (cadres, structures)", 2.2, { fill: "#15803d" }));
  parts.push(text(DRAW.x + 2, y + h + 26, "Liaisons", 3, { weight: "bold" }));
  links.forEach((l, i) => parts.push(text(DRAW.x + 2, y + h + 31 + i * 4.2, `L${i + 1} : ${l}`, 2.6, { fill: l.startsWith("DC") ? "#b91c1c" : "#1d4ed8" })));
  parts.push(text(DRAW.x + 2, DRAW.y + 8, "Schéma unifilaire simplifié de l'installation de production photovoltaïque", 3.6, { weight: "bold" }));
  parts.push(text(DRAW.x + 2, DRAW.y + 14, `${r.isMicro ? "Micro-onduleurs" : "Onduleur central"} : ${r.acPowerKva} kVA ${e.phase === "tri" ? "triphasé" : "monophasé"} : raccordement ${e.injection === "sans" ? "en autoconsommation totale (sans injection)" : e.injection === "surplus" ? "en autoconsommation avec injection du surplus" : "en vente de la totalité"}`, 2.8));
  parts.push(text(DRAW.x + 2, DRAW.y + 19, "Courant continu en rouge, courant alternatif en bleu. Valeurs calculées à vérifier par l'installateur (note de calcul jointe).", 2.4, { fill: "#555" }));
  return page(parts.join(""), {
    ...cart,
    code: "ELEC",
    title: "Schéma unifilaire",
    legend: [
      { kind: "line", color: "#b91c1c", label: "Courant continu (DC)" },
      { kind: "line", color: "#1d4ed8", label: "Courant alternatif (AC)" },
      { kind: "line", color: "#15803d", label: "Liaison à la terre" },
    ],
    notes: [`Dossier technique Consuel : ${r.consuelForm}${r.extraForms.length ? " + " + r.extraForms.join(" + ") : ""} : attestation ${r.attestation} (${r.attestationCerfa}).`, "Protection de découplage conforme EN 50549-1 (certificat traduit en français à joindre)."],
  });
}
