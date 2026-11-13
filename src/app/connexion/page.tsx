"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Card, Field, Input } from "@/components/ui";
import { DEMO_ACCOUNTS, login, resetAll, signup } from "@/lib/store/db";
import { useSeed } from "@/lib/store/hooks";

export default function Connexion() {
  const ready = useSeed();
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [company, setCompany] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "login") await login(email, password);
      else await signup({ company, fullName, email, password });
      router.push("/app/");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-100 p-4">
      <div className="w-full max-w-md space-y-4">
        <Link href="/" className="flex items-center justify-center gap-2 text-xl font-bold text-brand-800">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-amber-400 text-stone-900">☀</span> DP Solaire
        </Link>
        <Card>
          <form onSubmit={submit} className="space-y-4">
            <h1 className="text-lg font-semibold">{mode === "login" ? "Connexion" : "Créer un compte entreprise"}</h1>
            {mode === "signup" && (
              <>
                <Field label="Entreprise" htmlFor="company">
                  <Input id="company" required value={company} onChange={(e) => setCompany(e.target.value)} />
                </Field>
                <Field label="Nom et prénom" htmlFor="fullname">
                  <Input id="fullname" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </Field>
              </>
            )}
            <Field label="Email" htmlFor="email">
              <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <Field label="Mot de passe" htmlFor="password">
              <Input id="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} required value={password} onChange={(e) => setPassword(e.target.value)} />
            </Field>
            {error && <p role="alert" className="text-sm font-medium text-red-700">{error}</p>}
            <Button type="submit" className="w-full" size="lg" disabled={busy || !ready}>
              {!ready ? "Préparation de la démo…" : mode === "login" ? "Se connecter" : "Créer le compte"}
            </Button>
            <button type="button" className="w-full text-sm text-brand-700 underline" onClick={() => setMode(mode === "login" ? "signup" : "login")}>
              {mode === "login" ? "Pas encore de compte ? Créer un compte" : "J'ai déjà un compte"}
            </button>
          </form>
        </Card>
        <Card className="bg-amber-50">
          <h2 className="font-semibold">Comptes de démonstration</h2>
          <ul className="mt-2 space-y-2 text-sm">
            <li>
              Installateur : <code>{DEMO_ACCOUNTS.installateur.email}</code> / <code>{DEMO_ACCOUNTS.installateur.password}</code>{" "}
              <button className="text-brand-700 underline" onClick={() => { setMode("login"); setEmail(DEMO_ACCOUNTS.installateur.email); setPassword(DEMO_ACCOUNTS.installateur.password); }}>remplir</button>
            </li>
            <li>
              Super-admin : <code>{DEMO_ACCOUNTS.admin.email}</code> / <code>{DEMO_ACCOUNTS.admin.password}</code>{" "}
              <button className="text-brand-700 underline" onClick={() => { setMode("login"); setEmail(DEMO_ACCOUNTS.admin.email); setPassword(DEMO_ACCOUNTS.admin.password); }}>remplir</button>
            </li>
          </ul>
          <p className="mt-3 text-xs text-stone-600">Mode démo : comptes et dossiers sont stockés uniquement dans ce navigateur (aucun serveur). 5 dossiers de démonstration sont pré-créés (solaire, pompe à chaleur, isolation).</p>
          <button className="mt-2 text-xs text-red-700 underline" onClick={() => { if (window.confirm("Effacer toutes les données de démo de ce navigateur ?")) { resetAll(); window.location.reload(); } }}>Réinitialiser la démo</button>
        </Card>
      </div>
    </div>
  );
}
