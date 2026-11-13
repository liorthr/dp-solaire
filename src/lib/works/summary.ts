import type { Project } from "@/lib/types";
import { defaultIte, defaultPac, defaultPacUnits, ITE_FINISHES } from "@/data/works";

/** résumé d'une ligne du projet (en-tête de dossier, tableau de bord) */
export function worksSummary(p: Project): string {
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
