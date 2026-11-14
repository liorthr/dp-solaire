// Rendu des photomontages à éléments multiples (menuiseries, fenêtres de toit).
import type { Project } from "@/lib/types";
import { ROOF_WINDOW_COLORS } from "@/data/works";
import { renderJoinery, renderRoofWindow, type Pt } from "./homography";

/** éléments multiples (menuiseries, fenêtres de toit) : un quadrilatère par élément */
export function renderInsertionElements(c2d: CanvasRenderingContext2D, project: Project, ins: { quad: [number, number][]; extraQuads?: [number, number][][] }) {
  const quads = [ins.quad, ...(ins.extraQuads ?? [])].filter((q) => q.length === 4) as Pt[][];
  quads.forEach((q, i) => {
    if (project.works === "velux") renderRoofWindow(c2d, q, ROOF_WINDOW_COLORS[project.velux?.frameColor ?? "gris_anthracite"].hex, Boolean(project.velux?.shutters));
    else {
      const items = project.menuiserie?.items ?? [];
      renderJoinery(c2d, q, items[i]?.kind ?? items[0]?.kind ?? "fenetre", project.menuiserie?.colorHex ?? "#383e42");
    }
  });
}

