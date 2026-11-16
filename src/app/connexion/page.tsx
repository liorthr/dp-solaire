"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { cloudEnabled, cloudGoogle, cloudLogin, cloudResetPassword, cloudSignup, resumeCloud, supabase } from "@/lib/cloud/supabase";
import { Logo } from "@/components/Logo";
import { Button, Card, Field, Input } from "@/components/ui";
import { DEMO_ACCOUNTS, login, resetAll, signup } from "@/lib/store/db";
import { useSeed } from "@/lib/store/hooks";

function Connexion() {
  const ready = useSeed();
  const router = useRouter();
  const sp = useSearchParams();
  const fromDraft = sp.get("next") === "draft" || sp.get("next") === "/app/nouveau/?draft=1";
  const target = fromDraft ? "/app/nouveau/?draft=1" : "/app/";
  const [mode, setMode] = useState<"login" | "signup" | "reset" | "newpassword">(sp.get("reset") ? "newpassword" : sp.get("mode") === "signup" ? "signup" : "login");
  const [info, setInfo] = useState("");
  const [pro, setPro] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [company, setCompany] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // retour d'un lien email (confirmation) ou de Google : la session est reprise puis on continue
  useEffect(() => {
    if (!cloudEnabled || !(sp.get("oauth") || sp.get("confirme") || sp.get("code"))) return;
    resumeCloud()
      .then((s) => {
        if (s) router.replace(target);
      })
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, [sp, router, target]);

  const isDemo = (m: string) => [DEMO_ACCOUNTS.installateur.email, DEMO_ACCOUNTS.admin.email].includes(m.trim().toLowerCase());

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setBusy(true);
    try {
      if (mode === "reset") {
        await cloudResetPassword(email);
        setInfo("Si un compte existe pour cette adresse, un email de réinitialisation vient d'être envoyé.");
        return;
      }
      if (mode === "newpassword") {
        const r = await supabase().auth.updateUser({ password });
        if (r.error) throw new Error(r.error.message);
        await resumeCloud();
        router.push("/app/");
        return;
      }
      if (cloudEnabled && !isDemo(email)) {
        if (mode === "login") await cloudLogin(email, password);
        else {
          const r = await cloudSignup({ company: pro ? company : "", fullName, email, password, kind: pro ? "professionnel" : "particulier" });
          if (r.confirmEmail) {
            setInfo("Compte créé ! Cliquez sur le lien reçu par email pour l'activer, puis revenez vous connecter.");
            return;
          }
        }
      } else if (mode === "login") await login(email, password);
      else await signup({ company: pro ? company : fullName, fullName, email, password, kind: pro ? "professionnel" : "particulier" });
      router.push(target);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream p-4">
      <div className="w-full max-w-md space-y-4">
        <Link href="/" className="flex justify-center" aria-label="Permizy : accueil">
          <Logo size="lg" />
        </Link>
        {fromDraft && <p className="rounded-2xl bg-mint p-3 text-center text-sm font-medium text-brand-700">Votre projet est gardé de côté : créez votre espace pour préparer le dossier.</p>}
        <Card>
          <form onSubmit={submit} className="space-y-4">
            <h1 className="text-2xl font-extrabold">{{ login: "Connexion", signup: "Créer mon espace", reset: "Mot de passe oublié", newpassword: "Nouveau mot de passe" }[mode]}</h1>
            {cloudEnabled && (mode === "login" || mode === "signup") && (
              <>
                <button
                  type="button"
                  onClick={() => cloudGoogle(target).catch((e) => setError(e instanceof Error ? e.message : String(e)))}
                  className="flex h-12 w-full items-center justify-center gap-3 rounded-full border-2 border-line bg-white font-semibold hover:border-ink"
                  data-testid="google-login"
                >
                  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
                    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
                    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
                    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
                    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
                  </svg>
                  Continuer avec Google
                </button>
                <p className="text-center text-xs text-muted">ou avec votre email</p>
              </>
            )}
            {mode === "signup" && (
              <>
                <div className="grid grid-cols-2 gap-2 text-sm" role="radiogroup" aria-label="Type de compte">
                  <button type="button" role="radio" aria-checked={!pro} onClick={() => setPro(false)} className={`rounded-2xl border-2 p-3 font-semibold ${!pro ? "border-brand-600 bg-mint" : "border-line"}`}>
                    Je suis un particulier
                  </button>
                  <button type="button" role="radio" aria-checked={pro} onClick={() => setPro(true)} className={`rounded-2xl border-2 p-3 font-semibold ${pro ? "border-brand-600 bg-mint" : "border-line"}`}>
                    Je suis un professionnel
                  </button>
                </div>
                {pro && (
                  <Field label="Entreprise" htmlFor="company">
                    <Input id="company" required value={company} onChange={(e) => setCompany(e.target.value)} />
                  </Field>
                )}
                <Field label="Nom et prénom" htmlFor="fullname">
                  <Input id="fullname" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </Field>
              </>
            )}
            {mode !== "newpassword" && (
              <Field label="Email" htmlFor="email">
                <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </Field>
            )}
            {mode !== "reset" && (
              <Field label={mode === "newpassword" ? "Nouveau mot de passe (8 caractères minimum)" : "Mot de passe"} htmlFor="password">
                <Input id="password" type="password" minLength={mode === "login" ? undefined : 8} autoComplete={mode === "login" ? "current-password" : "new-password"} required value={password} onChange={(e) => setPassword(e.target.value)} />
              </Field>
            )}
            {error && <p role="alert" className="text-sm font-medium text-red-700">{error}</p>}
            {info && <p role="status" className="rounded-xl bg-mint p-3 text-sm font-medium text-brand-700" data-testid="auth-info">{info}</p>}
            <Button type="submit" className="w-full" size="lg" disabled={busy || !ready}>
              {!ready ? "Préparation…" : { login: "Se connecter", signup: "Créer mon espace", reset: "Recevoir le lien", newpassword: "Enregistrer" }[mode]}
            </Button>
            {mode !== "newpassword" && (
              <button type="button" className="w-full text-sm text-brand-700 underline" onClick={() => setMode(mode === "login" ? "signup" : "login")}>
                {mode === "login" ? "Pas encore de compte ? Créer un compte" : "J'ai déjà un compte"}
              </button>
            )}
            {cloudEnabled && mode === "login" && (
              <button type="button" className="w-full text-xs text-muted underline" onClick={() => setMode("reset")}>
                Mot de passe oublié ?
              </button>
            )}
          </form>
        </Card>
        <Card className="bg-sun-soft">
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
          <p className="mt-3 text-xs text-stone-600">{cloudEnabled ? "Les comptes de démonstration restent dans ce navigateur, séparés des vrais comptes (qui sont sauvegardés en ligne)." : "Mode démo : comptes et dossiers sont stockés uniquement dans ce navigateur (aucun serveur)."} 8 dossiers de démonstration sont pré-créés (solaire, pompe à chaleur, isolation, menuiseries, fenêtres de toit, agrandissement en permis de construire).</p>
          <button className="mt-2 text-xs text-red-700 underline" onClick={() => { if (window.confirm("Effacer toutes les données de démo de ce navigateur ?")) { resetAll(); window.location.reload(); } }}>Réinitialiser la démo</button>
        </Card>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="p-8">Chargement…</div>}>
      <Connexion />
    </Suspense>
  );
}
