import type { Project } from "@/lib/types";
import { defaultExtension, EXTENSION_KINDS, defaultIte, defaultJoinery, defaultPac, defaultPacUnits, defaultVelux, ITE_FINISHES, JOINERY_MATERIALS, ROOF_WINDOW_MODELS } from "@/data/works";

/** résumé d'une ligne du projet (en-tête de dossier, tableau de bord) */
export function worksSummary(p: Project): string {
  if (p.works === "extension") {
    const x = p.extension ?? defaultExtension();
    return `${EXTENSION_KINDS[x.kind].split(" (")[0]} de ${String(Math.round(x.widthM * x.depthM * 10) / 10).replace(".", ",")} m²`;
  }
  if (p.works === "menuiserie") {
    const m = p.menuiserie ?? defaultJoinery();
    return `${m.items.length} menuiserie(s) ${JOINERY_MATERIALS[m.materialAfter].toLowerCase()}, ${m.colorName}`;
  }
  if (p.works === "velux") {
    const v = p.velux ?? defaultVelux();
    return `${v.items.length} fenêtre(s) de toit ${(ROOF_WINDOW_MODELS.find((x) => x.id === v.modelId) ?? ROOF_WINDOW_MODELS[0]).label}`;
  }
  if (p.works === "pac") {
    const pac = p.pac ?? defaultPac();
    const u = defaultPacUnits.find((x) => x.id === pac.unitId) ?? defaultPacUnits[0];
    return `Pompe à chaleur, ${u.kind === "air_air" ? "air/air" : "air/eau"} (${u.soundPowerDb} dB(A))`;
  }
  if (p.works === "ite") {
    const ite = p.ite ?? defaultIte();
    return `Isolation extérieure ${ite.thicknessCm} cm, ${ITE_FINISHES[ite.finish].toLowerCase()} (${ite.facadeIndexes.length} façade${ite.facadeIndexes.length > 1 ? "s" : ""})`;
  }
  return `${p.pv.panelCount} panneaux, ${String(p.pv.powerKwc).replace(".", ",")} kWc`;
}
