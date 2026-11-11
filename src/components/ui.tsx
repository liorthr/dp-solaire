"use client";
// Composants d'interface (style shadcn/ui, écrits à la main) : accessibles au clavier, contrastés.
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { HelpCircle } from "lucide-react";
import { useId, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from "react";

export const cn = (...a: Parameters<typeof clsx>) => twMerge(clsx(a));

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
export function Button({ variant = "primary", size = "md", className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: "sm" | "md" | "lg" }) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
        size === "sm" && "h-8 px-3 text-sm",
        size === "md" && "h-10 px-4 text-sm",
        size === "lg" && "h-12 px-6 text-base",
        variant === "primary" && "bg-brand-700 text-white hover:bg-brand-800",
        variant === "secondary" && "bg-amber-400 text-stone-900 hover:bg-amber-500",
        variant === "outline" && "border border-stone-300 bg-white hover:bg-stone-100",
        variant === "ghost" && "hover:bg-stone-100",
        variant === "danger" && "bg-red-700 text-white hover:bg-red-800",
        className,
      )}
    />
  );
}

export function Card({ className, children, title, actions }: { className?: string; children: ReactNode; title?: ReactNode; actions?: ReactNode }) {
  return (
    <section className={cn("rounded-xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5", className)}>
      {(title || actions) && (
        <div className="mb-3 flex items-center justify-between gap-2">
          {title && <h2 className="text-base font-semibold">{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

const badgeColors = {
  ok: "bg-emerald-100 text-emerald-900",
  info: "bg-sky-100 text-sky-900",
  alerte: "bg-amber-100 text-amber-900",
  bloquant: "bg-red-100 text-red-900",
  neutral: "bg-stone-100 text-stone-800",
  ia: "bg-violet-100 text-violet-900",
};
export function Badge({ tone = "neutral", children, className }: { tone?: keyof typeof badgeColors; children: ReactNode; className?: string }) {
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", badgeColors[tone], className)}>{children}</span>;
}

/** aide contextuelle : bulle au survol / focus / tap */
export function Help({ children, label = "Aide" }: { children: ReactNode; label?: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <span className="relative inline-flex align-middle">
      <button type="button" aria-label={label} aria-describedby={open ? id : undefined} onClick={() => setOpen((o) => !o)} onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)} onBlur={() => setOpen(false)} className="text-stone-400 hover:text-brand-700">
        <HelpCircle className="h-4 w-4" />
      </button>
      {open && (
        <span id={id} role="tooltip" className="absolute left-1/2 top-6 z-50 w-64 -translate-x-1/2 rounded-lg bg-stone-900 p-2.5 text-xs font-normal leading-relaxed text-white shadow-lg">
          {children}
        </span>
      )}
    </span>
  );
}

export function Field({ label, help, example, error, children, htmlFor }: { label: string; help?: ReactNode; example?: string; error?: string; children: ReactNode; htmlFor?: string }) {
  return (
    <div className="space-y-1">
      <label htmlFor={htmlFor} className="flex items-center gap-1.5 text-sm font-medium">
        {label} {help && <Help label={`Aide : ${label}`}>{help}</Help>}
      </label>
      {children}
      {example && !error && <p className="text-xs text-stone-500">Ex. : {example}</p>}
      {error && <p className="text-xs font-medium text-red-700">{error}</p>}
    </div>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn("h-11 w-full rounded-lg border border-stone-300 bg-white px-3 text-base sm:h-10 sm:text-sm", props.className)} />;
}
export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn("h-11 w-full rounded-lg border border-stone-300 bg-white px-3 text-base sm:h-10 sm:text-sm", props.className)} />;
}

export function Progress({ value, label }: { value: number; label?: string }) {
  return (
    <div role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100} aria-label={label} className="h-2 w-full overflow-hidden rounded-full bg-stone-200">
      <div className="h-full bg-brand-600 transition-all" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: { id: T; label: string; badge?: ReactNode }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div role="tablist" className="-mx-4 flex gap-1 overflow-x-auto border-b border-stone-200 px-4 sm:mx-0 sm:px-0">
      {tabs.map((t) => (
        <button key={t.id} role="tab" aria-selected={value === t.id} onClick={() => onChange(t.id)} className={cn("flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium", value === t.id ? "border-brand-700 text-brand-800" : "border-transparent text-stone-600 hover:text-stone-900")}>
          {t.label}
          {t.badge}
        </button>
      ))}
    </div>
  );
}

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={title} onClick={onClose}>
      <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 sm:max-w-2xl sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} aria-label="Fermer" className="rounded p-1 text-2xl leading-none hover:bg-stone-100">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export const severityTone = (s: string) => (s === "bloquant" ? "bloquant" : s === "alerte" ? "alerte" : s === "info" ? "info" : "ok") as keyof typeof badgeColors;
export const severityLabel = (s: string) => ({ ok: "OK", info: "Info", alerte: "Alerte", bloquant: "Bloquant" })[s] ?? s;

export function Disclaimer({ className }: { className?: string }) {
  return (
    <p className={cn("rounded-lg bg-stone-100 p-3 text-xs text-stone-600", className)}>
      Le dossier est préparé à partir de sources publiques citées. <strong>Le déclarant reste seul responsable</strong> de son exactitude et du respect des règles d&apos;urbanisme ; le score affiché est une aide, <strong>jamais une garantie</strong> d&apos;acceptation. Voir les <a className="underline" href={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/cgu/`}>conditions générales</a>.
    </p>
  );
}
