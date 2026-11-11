"use client";
import { useEffect, useRef, useState } from "react";
import { Crosshair, MapPin } from "lucide-react";
import type { AddressResult } from "@/lib/types";
import { addressFromCoords, searchAddress, searchCommunes, type Commune } from "@/lib/providers/ban";
import { parseCoords } from "@/lib/geo/coords";
import { Button, Input, Select } from "./ui";

export function AddressAutocomplete({ value, onSelect }: { value?: AddressResult; onSelect: (a: AddressResult) => void }) {
  const [q, setQ] = useState(value?.label ?? "");
  const [results, setResults] = useState<AddressResult[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [error, setError] = useState("");
  const [manual, setManual] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (q.trim().length < 4 || q === value?.label) {
      setResults([]);
      return;
    }
    timer.current = setTimeout(async () => {
      try {
        setError("");
        const r = await searchAddress(q);
        setResults(r.results);
        setOpen(true);
        setActive(0);
      } catch {
        setError("Recherche d'adresse indisponible (Base Adresse Nationale). Réessayez dans un instant.");
      }
    }, 250);
  }, [q, value?.label]);

  const choose = (a: AddressResult) => {
    setQ(a.label);
    setOpen(false);
    onSelect(a);
  };

  return (
    <div className="relative">
      <Input
        id="address"
        role="combobox"
        aria-expanded={open}
        aria-controls="address-list"
        aria-autocomplete="list"
        placeholder="Ex. : 12 rue des Lilas 80000 Amiens"
        value={q}
        autoComplete="off"
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => results.length && setOpen(true)}
        onKeyDown={(e) => {
          if (!open || !results.length) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((i) => Math.min(i + 1, results.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((i) => Math.max(i - 1, 0));
          } else if (e.key === "Enter") {
            e.preventDefault();
            choose(results[active]);
          } else if (e.key === "Escape") setOpen(false);
        }}
      />
      {error && (
        <p className="mt-1 text-xs text-red-700">
          {error}{" "}
          <button type="button" className="font-medium underline" onClick={() => setManual(true)} data-testid="manual-address">
            Saisir l&apos;adresse manuellement
          </button>
        </p>
      )}
      {!error && !manual && (
        <button type="button" className="mt-1 text-xs text-stone-500 underline" onClick={() => setManual(true)}>
          Adresse introuvable ? Saisie manuelle
        </button>
      )}
      <GpsPicker onDone={(a) => { setManual(false); setError(""); choose(a); }} />
      {manual && <ManualAddress street={q} onDone={(a) => { setManual(false); choose(a); }} />}
      {open && results.length > 0 && (
        <ul id="address-list" role="listbox" className="absolute z-[600] mt-1 max-h-72 w-full overflow-y-auto rounded-lg border border-stone-200 bg-white shadow-lg">
          {results.map((r, i) => (
            <li key={`${r.label}${i}`} role="option" aria-selected={i === active}>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => choose(r)} className={`flex w-full items-start gap-2 px-3 py-2.5 text-left text-sm ${i === active ? "bg-brand-50" : "hover:bg-stone-50"}`}>
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" />
                <span>
                  {r.label}
                  <span className="block text-xs text-stone-500">
                    INSEE {r.insee} · {r.type === "housenumber" ? "numéro" : r.type === "street" ? "voie" : r.type}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** repli manuel : voie libre + commune officielle (code INSEE) ; la maison est ensuite désignée sur la carte */
function ManualAddress({ street, onDone }: { street: string; onDone: (a: AddressResult) => void }) {
  const [voie, setVoie] = useState(street);
  const [cq, setCq] = useState("");
  const [communes, setCommunes] = useState<Commune[]>([]);
  const [sel, setSel] = useState("");
  const [err, setErr] = useState("");
  useEffect(() => {
    const t = setTimeout(() => {
      searchCommunes(cq)
        .then((c) => {
          setCommunes(c);
          const norm = (x: string) => x.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
          setSel((c.find((x) => norm(voie).includes(norm(x.nom))) ?? c[0])?.code ?? "");
          setErr("");
        })
        .catch(() => setErr("Service des communes indisponible."));
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cq]);
  const c = communes.find((x) => x.code === sel);
  return (
    <div className="mt-2 space-y-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm" data-testid="manual-panel">
      <p className="font-medium">Saisie manuelle de l&apos;adresse</p>
      <Input placeholder="Numéro et voie (ex. 12 allée des Tilleuls)" value={voie} onChange={(e) => setVoie(e.target.value)} aria-label="Numéro et voie" />
      <Input placeholder="Code postal ou commune" value={cq} onChange={(e) => setCq(e.target.value)} aria-label="Code postal ou commune" data-testid="manual-commune" />
      {communes.length > 0 && (
        <Select value={sel} onChange={(e) => setSel(e.target.value)} aria-label="Commune">
          {communes.map((x) => (
            <option key={x.code} value={x.code}>
              {x.nom} ({x.codesPostaux[0]}) : INSEE {x.code}
            </option>
          ))}
        </Select>
      )}
      {err && <p className="text-xs text-red-700">{err}</p>}
      <Button
        type="button"
        size="sm"
        disabled={!c || !voie.trim()}
        onClick={() => {
          if (!c) return;
          const pc = /\b\d{5}\b/.test(cq) ? cq.trim() : c.codesPostaux[0];
          onDone({ label: `${voie.trim()} ${pc} ${c.nom}`, street: voie.trim(), postcode: pc, city: c.nom, insee: c.code, lon: c.centre.coordinates[0], lat: c.centre.coordinates[1], score: 0, type: "manual" });
        }}
      >
        Utiliser cette adresse
      </Button>
      <p className="text-xs text-stone-600">Position provisoire au centre de la commune : vous désignerez la maison sur la carte (onglet Plans) pour lancer l&apos;analyse cadastre/PLU au bon endroit.</p>
    </div>
  );
}

/** position GPS du téléphone (sur le chantier) ou coordonnées collées (Google Maps, Géoportail…) */
function GpsPicker({ onDone }: { onDone: (a: AddressResult) => void }) {
  const [txt, setTxt] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const resolve = async (lat: number, lon: number, accuracy?: number) => {
    setBusy(true);
    setMsg("");
    try {
      const a = await addressFromCoords(lon, lat);
      if (accuracy && accuracy > 30) setMsg(`Précision GPS ≈ ${Math.round(accuracy)} m : vérifiez la maison sur la carte (onglet Plans).`);
      onDone(a);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };
  const useDevice = () => {
    if (!("geolocation" in navigator)) return setMsg("Géolocalisation non disponible sur cet appareil.");
    setBusy(true);
    setMsg("Localisation en cours…");
    navigator.geolocation.getCurrentPosition(
      (p) => resolve(p.coords.latitude, p.coords.longitude, p.coords.accuracy),
      (e) => {
        setBusy(false);
        setMsg(e.code === e.PERMISSION_DENIED ? "Autorisez la localisation pour ce site dans votre navigateur, ou collez des coordonnées." : "Position introuvable : réessayez à l'extérieur ou collez des coordonnées.");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  };
  const parsed = parseCoords(txt);
  return (
    <div className="mt-2 rounded-lg border border-stone-200 bg-stone-50 p-2.5 text-sm">
      <p className="mb-1.5 text-xs font-medium text-stone-600">Ou par coordonnées GPS (pratique sur le chantier)</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="button" variant="outline" size="sm" onClick={useDevice} disabled={busy} data-testid="gps-device">
          <Crosshair className="h-4 w-4" /> Ma position GPS
        </Button>
        <Input className="h-9 sm:flex-1" placeholder="ou collez : 49.88045, 2.23853" value={txt} onChange={(e) => setTxt(e.target.value)} aria-label="Coordonnées GPS" data-testid="gps-input" />
        <Button type="button" size="sm" disabled={!parsed || busy} onClick={() => parsed && resolve(parsed.lat, parsed.lon)} data-testid="gps-validate">
          Valider
        </Button>
      </div>
      {txt && !parsed && <p className="mt-1 text-xs text-amber-800">Format attendu : latitude, longitude (ex. 49.88045, 2.23853) ou {`49°52'49"N 2°14'18"E`}.</p>}
      {msg && <p className="mt-1 text-xs text-stone-700">{msg}</p>}
      <p className="mt-1 text-xs text-stone-500">Placez-vous devant la maison : l&apos;analyse se rattache au bâtiment le plus proche du point.</p>
    </div>
  );
}
