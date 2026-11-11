"use client";
import { useState } from "react";
import { Badge, Button } from "./ui";
import { providers } from "@/lib/providers/registry";

interface Row {
  status: "ok" | "ko" | "cors" | "pending";
  ms?: number;
  detail?: string;
}

/** test en direct depuis le navigateur de l'utilisateur (reflète CORS et disponibilité réelle) */
export function HealthTable() {
  const [rows, setRows] = useState<Record<string, Row>>({});
  const run = async () => {
    for (const p of providers) {
      setRows((r) => ({ ...r, [p.id]: { status: "pending" } }));
      const t0 = performance.now();
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 12_000);
        const res = await fetch(p.healthUrl, { signal: ctrl.signal });
        clearTimeout(timer);
        setRows((r) => ({ ...r, [p.id]: { status: res.ok ? "ok" : "ko", ms: Math.round(performance.now() - t0), detail: `HTTP ${res.status}` } }));
      } catch (e) {
        setRows((r) => ({ ...r, [p.id]: { status: p.cors ? "ko" : "cors", ms: Math.round(performance.now() - t0), detail: p.cors ? String(e) : "Bloqué par CORS dans le navigateur : proxy serveur ou instantané utilisé" } }));
      }
    }
  };
  return (
    <div>
      <Button onClick={run} data-testid="health-run">Tester les sources maintenant</Button>
      <table className="mt-3 w-full text-left text-sm">
        <thead>
          <tr className="border-b text-xs text-stone-500">
            <th className="py-2">Source</th>
            <th>Rôle</th>
            <th>Licence</th>
            <th>État</th>
          </tr>
        </thead>
        <tbody>
          {providers.map((p) => {
            const r = rows[p.id];
            return (
              <tr key={p.id} className="border-b align-top">
                <td className="py-2 pr-2 font-medium">
                  <a className="underline" href={p.docs} target="_blank" rel="noreferrer">{p.name}</a>
                </td>
                <td className="pr-2">{p.role}</td>
                <td className="pr-2 text-xs">{p.license}</td>
                <td>
                  {!r ? <Badge>non testé</Badge> : r.status === "pending" ? <Badge>…</Badge> : r.status === "ok" ? <Badge tone="ok">OK {r.ms} ms</Badge> : r.status === "cors" ? <Badge tone="alerte">mode dégradé</Badge> : <Badge tone="bloquant">indisponible</Badge>}
                  {r?.detail && r.status !== "ok" && <p className="text-xs text-stone-500">{r.detail}</p>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
