"use client";
import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import type { Project } from "@/lib/types";
import type { Map as LMap, LayerGroup } from "leaflet";
import { panelsGround } from "@/lib/plans/dp";
import { fromL93 } from "@/lib/geo/proj";
import { tileUrl } from "@/lib/plans/basemap";

/** carte : parcelle, bâtiments (cliquables), pans de toiture, panneaux ; fonds IGN */
export function MapView({ project, onPickBuilding, onPickPoint }: { project: Project; onPickBuilding?: (id: string) => void; onPickPoint?: (lon: number, lat: number) => void }) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<LMap | null>(null);
  const layer = useRef<LayerGroup | null>(null);
  const LRef = useRef<typeof import("leaflet") | null>(null);
  const cb = useRef({ onPickBuilding, onPickPoint });
  cb.current = { onPickBuilding, onPickPoint };

  useEffect(() => {
    let alive = true;
    (async () => {
      const L = (await import("leaflet")).default;
      if (!alive || !el.current || map.current) return;
      LRef.current = L;
      const site = (project.overrides?.site as { lon: number; lat: number }) ?? { lon: project.address!.lon, lat: project.address!.lat };
      const m = L.map(el.current, { zoomControl: true, maxZoom: 21 }).setView([site.lat, site.lon], 19);
      const t = (k: "plan" | "ortho" | "cadastre") => L.tileLayer(tileUrl(k, 0, 0, 0).replace("TILEMATRIX=0&TILEROW=0&TILECOL=0", "TILEMATRIX={z}&TILEROW={y}&TILECOL={x}"), { maxNativeZoom: k === "plan" ? 19 : k === "ortho" ? 20 : 20, maxZoom: 21, attribution: "© IGN, Géoplateforme" });
      const ortho = t("ortho").addTo(m);
      const plan = t("plan");
      const cad = t("cadastre").addTo(m);
      L.control.layers({ "Photo aérienne (IGN)": ortho, "Plan IGN": plan }, { Cadastre: cad }).addTo(m);
      m.on("click", (e) => cb.current.onPickPoint?.(e.latlng.lng, e.latlng.lat));
      layer.current = L.layerGroup().addTo(m);
      map.current = m;
      draw();
    })();
    return () => {
      alive = false;
      map.current?.remove();
      map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const draw = () => {
    const L = LRef.current;
    const g = layer.current;
    if (!L || !g) return;
    g.clearLayers();
    const e = project.enrichment;
    const toLL = (ring: number[][]) => ring.map((c) => [c[1], c[0]] as [number, number]);
    for (const pc of e?.parcels ?? []) {
      const rings = pc.geometry.type === "Polygon" ? [pc.geometry.coordinates[0]] : pc.geometry.coordinates.map((p) => p[0]);
      rings.forEach((r) => L.polygon(toLL(r), { color: "#ea580c", weight: 3, dashArray: "8 4", fill: false, interactive: false }).addTo(g));
    }
    for (const b of e?.buildings ?? []) {
      const rings = b.geometry.type === "Polygon" ? [b.geometry.coordinates[0]] : b.geometry.coordinates.map((p) => p[0]);
      const main = b.id === e?.mainBuildingId;
      rings.forEach((r) =>
        L.polygon(toLL(r), { color: main ? "#facc15" : "#a8a29e", weight: main ? 3 : 1, fillOpacity: main ? 0.15 : 0.05 })
          .on("click", (ev) => {
            L.DomEvent.stopPropagation(ev);
            cb.current.onPickBuilding?.(b.id);
          })
          .bindTooltip(main ? "Bâtiment du projet" : "Cliquer pour choisir ce bâtiment")
          .addTo(g),
      );
    }
    for (const rp of project.pv.roofPlanes) {
      if (rp.polygon) L.polygon(toLL(rp.polygon.coordinates[0]), { color: "#38bdf8", weight: 1, fill: false, interactive: false }).addTo(g);
      const l = project.pv.layouts.find((x) => x.roofPlaneId === rp.id);
      if (l) for (const poly of panelsGround(rp, l)) L.polygon(poly.map((c) => { const ll = fromL93(c); return [ll[1], ll[0]] as [number, number]; }), { color: "#0ea5e9", weight: 0.5, fillColor: "#0f172a", fillOpacity: 0.85, interactive: false }).addTo(g);
    }
  };

  useEffect(draw, [project]);

  return <div ref={el} className="h-80 w-full overflow-hidden rounded-lg border border-stone-200 sm:h-[28rem]" aria-label="Carte du terrain" />;
}
