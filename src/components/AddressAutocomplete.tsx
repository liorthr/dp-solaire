"use client";
import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import type { AddressResult } from "@/lib/types";
import { searchAddress } from "@/lib/providers/ban";
import { Input } from "./ui";

export function AddressAutocomplete({ value, onSelect }: { value?: AddressResult; onSelect: (a: AddressResult) => void }) {
  const [q, setQ] = useState(value?.label ?? "");
  const [results, setResults] = useState<AddressResult[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [error, setError] = useState("");
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
        const r = await searchAddress(q, 6);
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
      {error && <p className="mt-1 text-xs text-red-700">{error}</p>}
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
