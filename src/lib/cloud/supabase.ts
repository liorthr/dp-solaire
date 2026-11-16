"use client";
// Comptes en ligne et sauvegarde des dossiers (Supabase : Postgres + Auth + Storage).
// Le navigateur garde une copie locale (travail hors ligne, rapidité) ; chaque modification est envoyée au serveur.
// Sécurité : clé publique « publishable » uniquement ; chaque compte ne lit et n'écrit que ses lignes (RLS côté base).
import { createClient, type SupabaseClient, type User as SbUser } from "@supabase/supabase-js";
import type { Client, Project, Tenant } from "@/lib/types";
import { adoptCloudAccount, currentSession, forgetLocalTenant, mergeCloudData, setCloudHooks, type Session } from "@/lib/store/db";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
/** comptes en ligne disponibles (build de production avec les variables d'environnement) */
export const cloudEnabled = Boolean(URL && KEY);

let sb: SupabaseClient | null = null;
export function supabase(): SupabaseClient {
  if (!cloudEnabled) throw new Error("Comptes en ligne non configurés");
  sb ??= createClient(URL, KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: "pkce" } });
  return sb;
}

const base = () => `${window.location.origin}${process.env.NEXT_PUBLIC_BASE_PATH || ""}`;
const isCloudTenant = (tenantId?: string) => Boolean(tenantId?.startsWith("ten_") && tenantId.length > 30);

// ----------------------------------------------------------------- état de synchronisation (affiché dans l'en-tête)
export type SyncState = "ok" | "pending" | "offline" | "error";
let state: SyncState = "ok";
const subs = new Set<(s: SyncState) => void>();
const setState = (s: SyncState) => {
  state = s;
  subs.forEach((f) => f(s));
};
export const syncState = () => state;
export const onSyncState = (f: (s: SyncState) => void) => {
  subs.add(f);
  return () => subs.delete(f);
};

// ----------------------------------------------------------------- file d'envoi avec nouvelles tentatives
type Job = { key: string; run: () => Promise<void> };
const queue = new Map<string, Job>();
let flushing = false;
let retryTimer: ReturnType<typeof setTimeout> | undefined;
function enqueue(key: string, run: () => Promise<void>) {
  // garde-fou : jamais d'envoi depuis la démo locale ou un autre compte
  if (!isCloudTenant(currentSession()?.tenant.id)) return;
  queue.set(key, { key, run }); // la dernière version d'un même objet remplace la précédente
  setState("pending");
  void flush();
}
async function flush() {
  if (flushing) return;
  flushing = true;
  try {
    for (const job of [...queue.values()]) {
      try {
        await job.run();
        if (queue.get(job.key) === job) queue.delete(job.key);
      } catch (e) {
        console.warn("Synchronisation différée", job.key, e);
        setState(navigator.onLine ? "error" : "offline");
        clearTimeout(retryTimer);
        retryTimer = setTimeout(() => void flush(), 15_000);
        return;
      }
    }
    setState(queue.size ? "pending" : "ok");
  } finally {
    flushing = false;
    if (queue.size && state === "pending") void flush();
  }
}
if (typeof window !== "undefined") window.addEventListener("online", () => void flush());

const check = <T,>(r: { error: { message: string } | null; data?: unknown }) => {
  if (r.error) throw new Error(r.error.message);
  return r.data as T;
};

async function uid(): Promise<string> {
  const { data } = await supabase().auth.getUser();
  if (!data.user) throw new Error("Session en ligne expirée");
  return data.user.id;
}

// ----------------------------------------------------------------- crochets branchés sur le dépôt local
function installHooks() {
  setCloudHooks({
    projectSaved: (p) =>
      enqueue(`p:${p.id}`, async () => {
        const owner = await uid();
        check(await supabase().from("projects").upsert({ owner, local_id: p.id, reference: p.reference, works: p.works ?? "pv", status: p.status, data: p, updated_at: p.updatedAt }));
      }),
    projectDeleted: (id) =>
      enqueue(`p:${id}`, async () => {
        check(await supabase().from("projects").delete().eq("local_id", id));
      }),
    clientSaved: (c) =>
      enqueue(`c:${c.id}`, async () => {
        const owner = await uid();
        check(await supabase().from("clients").upsert({ owner, local_id: c.id, data: c, updated_at: new Date().toISOString() }));
      }),
    clientDeleted: (id) =>
      enqueue(`c:${id}`, async () => {
        check(await supabase().from("clients").delete().eq("local_id", id));
      }),
    tenantUpdated: (t) =>
      enqueue("tenant", async () => {
        const id = await uid();
        check(await supabase().from("profiles").update({ tenant: t, company: t.name, updated_at: new Date().toISOString() }).eq("id", id));
      }),
    photoPut: (key, blob) =>
      enqueue(`f:${key}`, async () => {
        const id = await uid();
        check(await supabase().storage.from("photos").upload(`${id}/${key}`, blob, { upsert: true, contentType: blob.type || "image/jpeg" }));
      }),
    photoFetch: async (key) => {
      try {
        const id = await uid();
        const r = await supabase().storage.from("photos").download(`${id}/${key}`);
        return r.data ?? undefined;
      } catch {
        return undefined;
      }
    },
    photoDeleted: (key) =>
      enqueue(`f:${key}`, async () => {
        const id = await uid();
        check(await supabase().storage.from("photos").remove([`${id}/${key}`]));
      }),
  });
}

// ----------------------------------------------------------------- session
async function adopt(user: SbUser): Promise<Session> {
  const prof = check<{ full_name: string; company: string; kind: "particulier" | "professionnel"; tenant: Partial<Tenant> } | null>(await supabase().from("profiles").select("full_name, company, kind, tenant").eq("id", user.id).maybeSingle());
  const meta = user.user_metadata ?? {};
  const fullName = prof?.full_name || meta.full_name || meta.name || "";
  const session = adoptCloudAccount({ uid: user.id, email: user.email ?? "", fullName, company: prof?.company || meta.company || "", kind: prof?.kind ?? (meta.kind === "professionnel" ? "professionnel" : "particulier"), tenant: prof?.tenant && Object.keys(prof.tenant).length ? prof.tenant : undefined });
  installHooks();
  await pull(session.tenant.id);
  return session;
}

/** récupère les dossiers du compte (autre appareil) et envoie ce qui n'est que local */
export async function pull(tenantId: string) {
  setState("pending");
  const [projects, clients] = await Promise.all([supabase().from("projects").select("data"), supabase().from("clients").select("data")]);
  const rp = check<{ data: Project }[]>(projects).map((r) => r.data);
  const rc = check<{ data: Client }[]>(clients).map((r) => r.data);
  const { pushProjects, pushClients } = mergeCloudData(tenantId, { projects: rp, clients: rc });
  // seules les versions locales plus récentes repartent au serveur
  installHooks();
  const sbHooks = { pushProjects, pushClients };
  for (const p of sbHooks.pushProjects)
    enqueue(`p:${p.id}`, async () => {
      check(await supabase().from("projects").upsert({ owner: await uid(), local_id: p.id, reference: p.reference, works: p.works ?? "pv", status: p.status, data: p, updated_at: p.updatedAt }));
    });
  for (const c of sbHooks.pushClients)
    enqueue(`c:${c.id}`, async () => {
      check(await supabase().from("clients").upsert({ owner: await uid(), local_id: c.id, data: c }));
    });
  if (!queue.size) setState("ok");
}

/** à l'ouverture de l'application : reprend une session en ligne (après lien email ou Google) */
export async function resumeCloud(): Promise<Session | null> {
  if (!cloudEnabled) return null;
  const { data } = await supabase().auth.getSession();
  const user = data.session?.user;
  const local = currentSession();
  if (!user) {
    // session en ligne expirée : on ne garde pas un accès local orphelin
    if (local && isCloudTenant(local.tenant.id)) await forgetLocalTenant(local.tenant.id);
    return null;
  }
  if (local && local.tenant.id === `ten_${user.id}`) {
    installHooks();
    void pull(local.tenant.id).catch(() => setState("offline"));
    return local;
  }
  return adopt(user);
}

export async function cloudSignup(input: { fullName: string; email: string; password: string; company: string; kind: "particulier" | "professionnel" }): Promise<{ session: Session | null; confirmEmail: boolean }> {
  if (input.password.length < 8) throw new Error("Mot de passe : 8 caractères minimum.");
  const r = await supabase().auth.signUp({ email: input.email.trim(), password: input.password, options: { data: { full_name: input.fullName, company: input.company, kind: input.kind }, emailRedirectTo: `${base()}/connexion/?confirme=1` } });
  if (r.error) throw new Error(translate(r.error.message));
  if (!r.data.session || !r.data.user) return { session: null, confirmEmail: true };
  return { session: await adopt(r.data.user), confirmEmail: false };
}

export async function cloudLogin(email: string, password: string): Promise<Session> {
  const r = await supabase().auth.signInWithPassword({ email: email.trim(), password });
  if (r.error || !r.data.user) throw new Error(translate(r.error?.message ?? "Connexion impossible"));
  return adopt(r.data.user);
}

export async function cloudGoogle(next = "/app/") {
  const r = await supabase().auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${base()}/connexion/?oauth=1&next=${encodeURIComponent(next)}` } });
  if (r.error) throw new Error(translate(r.error.message));
}

export async function cloudResetPassword(email: string) {
  const r = await supabase().auth.resetPasswordForEmail(email.trim(), { redirectTo: `${base()}/connexion/?reset=1` });
  if (r.error) throw new Error(translate(r.error.message));
}

export async function cloudLogout() {
  const s = currentSession();
  setCloudHooks(null);
  queue.clear();
  if (s && isCloudTenant(s.tenant.id)) await forgetLocalTenant(s.tenant.id);
  await supabase().auth.signOut();
}

export const isCloudSession = (s: Session | null) => Boolean(s && isCloudTenant(s.tenant.id));

function translate(m: string): string {
  if (/invalid login credentials/i.test(m)) return "Email ou mot de passe incorrect.";
  if (/email not confirmed/i.test(m)) return "Confirmez d'abord votre adresse email (lien reçu par email).";
  if (/already registered|already been registered/i.test(m)) return "Un compte existe déjà avec cet email : connectez-vous.";
  if (/email address .* is invalid|invalid email/i.test(m)) return "Adresse email invalide : vérifiez-la.";
  if (/not authorized/i.test(m)) return "L'envoi d'emails n'est pas encore activé pour cette adresse : réessayez plus tard.";
  if (/rate limit/i.test(m)) return "Trop de tentatives : réessayez dans quelques minutes.";
  if (/provider is not enabled|unsupported provider/i.test(m)) return "La connexion Google n'est pas encore activée.";
  if (/password/i.test(m) && /least|short|weak/i.test(m)) return "Mot de passe trop faible : 8 caractères minimum, mélangez lettres et chiffres.";
  return m;
}

/** la connexion Google n'est proposée que si elle est réellement activée côté Supabase */
let googleCache: Promise<boolean> | null = null;
export function googleAvailable(): Promise<boolean> {
  if (!cloudEnabled) return Promise.resolve(false);
  googleCache ??= fetch(`${URL}/auth/v1/settings`, { headers: { apikey: KEY } })
    .then((r) => (r.ok ? r.json() : null))
    .then((j) => Boolean(j?.external?.google))
    .catch(() => false);
  return googleCache;
}
