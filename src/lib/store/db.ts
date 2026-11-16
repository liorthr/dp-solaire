"use client";
// Dépôt de données « navigateur » (mode démo / V1 sans serveur).
// Interface Repository : un driver Supabase implémentera les mêmes méthodes (supabase/migrations/0001_init.sql).
// Multi-tenant logique : chaque lecture est filtrée par le tenant de la session (équivalent applicatif de la RLS).
import { del, get, set } from "idb-keyval";
import type { Client, InverterModel, Membership, PanelModel, Project, Role, Tenant, User } from "@/lib/types";
import { defaultInverters, defaultPanels } from "@/data/catalog";
import { uid } from "@/lib/project/factory";
import { sha256Hex } from "@/lib/providers/signature";

export interface AuditEntry {
  id: string;
  tenantId: string;
  userId: string;
  action: string;
  entity?: string;
  entityId?: string;
  at: string;
  meta?: Record<string, unknown>;
}

export interface Notification {
  id: string;
  tenantId: string;
  projectId?: string;
  date: string;
  title: string;
  read: boolean;
}

interface UserRecord extends User {
  passwordHash: string;
}

interface DB {
  schema: 1;
  tenants: Tenant[];
  users: UserRecord[];
  memberships: Membership[];
  clients: Client[];
  projects: Project[];
  panels: (PanelModel & { tenantId?: string })[];
  inverters: (InverterModel & { tenantId?: string })[];
  audit: AuditEntry[];
  notifications: Notification[];
  subscriptions: Record<string, { plan: string; status: "trialing" | "active" | "canceled"; dossiersUsed: number; periodEnd: string }>;
}

const KEY = "dp:db:v1";
const SESSION = "dp:session";
export const SALT = "dp-solaire-demo";

export const DEMO_ACCOUNTS = {
  installateur: { email: "demo@permizy.com", password: "Demo-2026!" },
  admin: { email: "admin@permizy.com", password: "Admin-2026!" },
};

const empty = (): DB => ({ schema: 1, tenants: [], users: [], memberships: [], clients: [], projects: [], panels: [], inverters: [], audit: [], notifications: [], subscriptions: {} });

/** synchronisation serveur (Supabase) : branchée par src/lib/cloud quand la session est un compte en ligne */
export interface CloudHooks {
  projectSaved(p: Project): void;
  projectDeleted(id: string): void;
  clientSaved(c: Client): void;
  clientDeleted(id: string): void;
  tenantUpdated(t: Tenant): void;
  photoPut(key: string, blob: Blob): void;
  photoFetch(key: string): Promise<Blob | undefined>;
  photoDeleted(key: string): void;
}
let hooks: CloudHooks | null = null;
export const setCloudHooks = (h: CloudHooks | null) => {
  hooks = h;
};

let cache: DB | null = null;
const listeners = new Set<() => void>();
export const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

function load(): DB {
  if (cache) return cache;
  try {
    const raw = typeof window !== "undefined" ? window.localStorage.getItem(KEY) : null;
    cache = raw ? (JSON.parse(raw) as DB) : empty();
  } catch {
    cache = empty();
  }
  return cache;
}
function save() {
  if (!cache) return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(cache));
  } catch (e) {
    console.warn("Stockage local plein", e);
  }
  listeners.forEach((l) => l());
}

export const hashPassword = (pwd: string) => sha256Hex(`${SALT}:${pwd}`);

// ----------------------------------------------------------------- session / auth
export interface Session {
  user: User;
  tenant: Tenant;
  role: Role;
}

export function currentSession(): Session | null {
  const db = load();
  let s: { userId: string; tenantId: string } | null = null;
  try {
    s = JSON.parse(window.localStorage.getItem(SESSION) || "null");
  } catch {
    s = null;
  }
  if (!s) return null;
  const u = db.users.find((x) => x.id === s!.userId);
  const m = db.memberships.find((x) => x.userId === s!.userId && x.tenantId === s!.tenantId);
  const t = db.tenants.find((x) => x.id === s!.tenantId);
  if (!u || !m || !t) return null;
  const { passwordHash: _ignored, ...user } = u;
  void _ignored;
  return { user, tenant: t, role: m.role };
}

export async function login(email: string, password: string): Promise<Session> {
  const db = load();
  const u = db.users.find((x) => x.email.toLowerCase() === email.trim().toLowerCase());
  if (!u || u.passwordHash !== (await hashPassword(password))) throw new Error("Email ou mot de passe incorrect.");
  const m = db.memberships.find((x) => x.userId === u.id);
  if (!m) throw new Error("Aucune entreprise associée à ce compte.");
  window.localStorage.setItem(SESSION, JSON.stringify({ userId: u.id, tenantId: m.tenantId }));
  audit(m.tenantId, u.id, "connexion");
  return currentSession()!;
}

export function logout() {
  window.localStorage.removeItem(SESSION);
  listeners.forEach((l) => l());
}

export async function signup(input: { company: string; fullName: string; email: string; password: string; kind?: "particulier" | "professionnel" }): Promise<Session> {
  const db = load();
  if (db.users.some((u) => u.email.toLowerCase() === input.email.toLowerCase())) throw new Error("Un compte existe déjà avec cet email.");
  if (input.password.length < 8) throw new Error("Mot de passe : 8 caractères minimum.");
  const t: Tenant = { id: uid("ten"), name: input.company, retentionMonths: 60, plan: "decouverte", kind: input.kind ?? "professionnel" };
  const u: UserRecord = { id: uid("usr"), email: input.email.trim(), fullName: input.fullName, passwordHash: await hashPassword(input.password) };
  db.tenants.push(t);
  db.users.push(u);
  db.memberships.push({ tenantId: t.id, userId: u.id, role: "admin" });
  db.subscriptions[t.id] = { plan: "decouverte", status: "trialing", dossiersUsed: 0, periodEnd: addDaysIso(30) };
  save();
  return login(input.email, input.password);
}

const addDaysIso = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);

function requireSession(): Session {
  const s = currentSession();
  if (!s) throw new Error("Session expirée : reconnectez-vous.");
  return s;
}

// ----------------------------------------------------------------- audit
export function audit(tenantId: string, userId: string, action: string, entity?: string, entityId?: string, meta?: Record<string, unknown>) {
  const db = load();
  db.audit.unshift({ id: uid("aud"), tenantId, userId, action, entity, entityId, at: new Date().toISOString(), meta });
  db.audit = db.audit.slice(0, 2000);
  save();
}

// ----------------------------------------------------------------- repository
export const repo = {
  ready: () => load().users.length > 0,

  tenant(): Tenant {
    return requireSession().tenant;
  },
  updateTenant(patch: Partial<Tenant>) {
    const s = requireSession();
    if (s.role !== "admin") throw new Error("Réservé aux administrateurs de l'entreprise.");
    const db = load();
    const t = db.tenants.find((x) => x.id === s.tenant.id)!;
    Object.assign(t, patch);
    audit(t.id, s.user.id, "modification_entreprise", "tenant", t.id, { fields: Object.keys(patch) });
    save();
    hooks?.tenantUpdated(t);
  },
  members() {
    const s = requireSession();
    const db = load();
    return db.memberships.filter((m) => m.tenantId === s.tenant.id).map((m) => ({ ...m, user: db.users.find((u) => u.id === m.userId)! }));
  },
  async addMember(email: string, fullName: string, role: Role, password: string) {
    const s = requireSession();
    if (s.role !== "admin") throw new Error("Réservé aux administrateurs.");
    const db = load();
    if (db.users.some((u) => u.email === email)) throw new Error("Email déjà utilisé.");
    const u: UserRecord = { id: uid("usr"), email, fullName, passwordHash: await hashPassword(password) };
    db.users.push(u);
    db.memberships.push({ tenantId: s.tenant.id, userId: u.id, role });
    audit(s.tenant.id, s.user.id, "ajout_utilisateur", "user", u.id);
    save();
  },

  // clients
  clients(): Client[] {
    const s = requireSession();
    return load().clients.filter((c) => c.tenantId === s.tenant.id);
  },
  client(id?: string) {
    if (!id) return undefined;
    return this.clients().find((c) => c.id === id);
  },
  saveClient(c: Omit<Client, "tenantId" | "id" | "createdAt"> & { id?: string }): Client {
    const s = requireSession();
    const db = load();
    const existing = c.id ? db.clients.find((x) => x.id === c.id && x.tenantId === s.tenant.id) : undefined;
    if (existing) {
      Object.assign(existing, c);
      save();
      hooks?.clientSaved(existing);
      return existing;
    }
    const created: Client = { ...c, id: uid("cli"), tenantId: s.tenant.id, createdAt: new Date().toISOString() };
    db.clients.push(created);
    audit(s.tenant.id, s.user.id, "creation_client", "client", created.id);
    save();
    hooks?.clientSaved(created);
    return created;
  },
  deleteClient(id: string) {
    const s = requireSession();
    const db = load();
    db.clients = db.clients.filter((c) => !(c.id === id && c.tenantId === s.tenant.id));
    audit(s.tenant.id, s.user.id, "suppression_client", "client", id);
    save();
    hooks?.clientDeleted(id);
  },

  // projets
  projects(): Project[] {
    const s = requireSession();
    return load().projects.filter((p) => p.tenantId === s.tenant.id).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },
  project(id: string): Project | undefined {
    const s = requireSession();
    return load().projects.find((p) => p.id === id && p.tenantId === s.tenant.id);
  },
  saveProject(p: Project, action = "modification_dossier") {
    const s = requireSession();
    if (p.tenantId !== s.tenant.id) throw new Error("Accès refusé (autre entreprise).");
    const db = load();
    const i = db.projects.findIndex((x) => x.id === p.id);
    const next = { ...p, updatedAt: new Date().toISOString() };
    if (i >= 0) db.projects[i] = next;
    else {
      db.projects.push(next);
      action = "creation_dossier";
      const sub = db.subscriptions[s.tenant.id];
      if (sub) sub.dossiersUsed += 1;
    }
    audit(s.tenant.id, s.user.id, action, "project", p.id);
    save();
    hooks?.projectSaved(next);
    return next;
  },
  async deleteProject(id: string) {
    const s = requireSession();
    const db = load();
    const p = db.projects.find((x) => x.id === id && x.tenantId === s.tenant.id);
    if (!p) return;
    await Promise.all(p.photos.map((ph) => del(ph.blobKey)));
    for (const ph of p.photos) hooks?.photoDeleted(ph.blobKey);
    db.projects = db.projects.filter((x) => x.id !== id);
    audit(s.tenant.id, s.user.id, "suppression_dossier", "project", id);
    save();
    hooks?.projectDeleted(id);
  },

  // catalogue
  panels(): PanelModel[] {
    const s = requireSession();
    return load().panels.filter((p) => !p.tenantId || p.tenantId === s.tenant.id);
  },
  inverters(): InverterModel[] {
    const s = requireSession();
    return load().inverters.filter((p) => !p.tenantId || p.tenantId === s.tenant.id);
  },
  savePanel(p: Omit<PanelModel, "id"> & { id?: string }) {
    const s = requireSession();
    const db = load();
    const ex = p.id ? db.panels.find((x) => x.id === p.id && x.tenantId === s.tenant.id) : undefined;
    if (ex) Object.assign(ex, p);
    else db.panels.push({ ...p, id: uid("pan"), tenantId: s.tenant.id });
    save();
  },

  // audit, notifications, abonnement
  audit(): AuditEntry[] {
    const s = requireSession();
    return load().audit.filter((a) => a.tenantId === s.tenant.id);
  },
  notifications(): Notification[] {
    const s = requireSession();
    return load().notifications.filter((n) => n.tenantId === s.tenant.id);
  },
  upsertNotification(n: Omit<Notification, "id" | "tenantId" | "read"> & { id: string }) {
    const s = requireSession();
    const db = load();
    if (!db.notifications.some((x) => x.id === n.id)) {
      db.notifications.push({ ...n, tenantId: s.tenant.id, read: false });
      save();
    }
  },
  markNotificationRead(id: string) {
    const s = requireSession();
    const n = load().notifications.find((x) => x.id === id && x.tenantId === s.tenant.id);
    if (n) {
      n.read = true;
      save();
    }
  },
  subscription() {
    const s = requireSession();
    return load().subscriptions[s.tenant.id];
  },
  setPlan(plan: string) {
    const s = requireSession();
    const db = load();
    db.subscriptions[s.tenant.id] = { ...(db.subscriptions[s.tenant.id] ?? { dossiersUsed: 0 }), plan, status: "active", periodEnd: addDaysIso(30) };
    const t = db.tenants.find((x) => x.id === s.tenant.id)!;
    t.plan = plan as Tenant["plan"];
    audit(s.tenant.id, s.user.id, "changement_abonnement_test", "subscription", s.tenant.id, { plan });
    save();
  },

  // RGPD
  async exportTenantData() {
    const s = requireSession();
    const db = load();
    audit(s.tenant.id, s.user.id, "export_rgpd");
    return {
      exportedAt: new Date().toISOString(),
      tenant: s.tenant,
      members: this.members().map((m) => ({ email: m.user.email, fullName: m.user.fullName, role: m.role })),
      clients: this.clients(),
      projects: this.projects().map((p) => ({ ...p, photos: p.photos.map((ph) => ({ ...ph, blob: "(fichier image non inclus)" })) })),
      audit: db.audit.filter((a) => a.tenantId === s.tenant.id),
    };
  },
  async purgeClientData(clientId: string) {
    const s = requireSession();
    const db = load();
    for (const p of db.projects.filter((x) => x.clientId === clientId && x.tenantId === s.tenant.id)) await this.deleteProject(p.id);
    this.deleteClient(clientId);
  },
  /** purge automatique selon la durée de conservation configurée */
  async applyRetention() {
    const s = requireSession();
    const limit = new Date();
    limit.setMonth(limit.getMonth() - s.tenant.retentionMonths);
    const old = this.projects().filter((p) => p.updatedAt < limit.toISOString() && ["accord", "refus", "retire"].includes(p.status));
    for (const p of old) await this.deleteProject(p.id);
    return old.length;
  },
};

// ----------------------------------------------------------------- photos (IndexedDB)
export const photoStore = {
  put: async (key: string, blob: Blob) => {
    await set(key, blob);
    hooks?.photoPut(key, blob);
  },
  /** photo locale, sinon récupérée sur le serveur (autre appareil) puis mise en cache */
  get: async (key: string) => {
    const local = await get<Blob>(key);
    if (local || !hooks) return local;
    const remote = await hooks.photoFetch(key);
    if (remote) await set(key, remote);
    return remote;
  },
  del: (key: string) => del(key),
};

// ----------------------------------------------------------------- comptes en ligne (Supabase)
/** miroir local d'un compte en ligne : une entreprise (ou un particulier) = un utilisateur */
export function adoptCloudAccount(a: { uid: string; email: string; fullName: string; company: string; kind?: "particulier" | "professionnel"; tenant?: Partial<Tenant> }): Session {
  const db = load();
  const tenantId = `ten_${a.uid}`, userId = `usr_${a.uid}`;
  let t = db.tenants.find((x) => x.id === tenantId);
  if (!t) {
    t = { id: tenantId, name: a.company || a.fullName || a.email, retentionMonths: 60, plan: "decouverte", kind: a.kind ?? "particulier", ...a.tenant };
    db.tenants.push(t);
    db.subscriptions[tenantId] = { plan: "decouverte", status: "trialing", dossiersUsed: 0, periodEnd: addDaysIso(30) };
  } else if (a.tenant) Object.assign(t, a.tenant, { id: tenantId });
  if (!db.users.some((u) => u.id === userId)) db.users.push({ id: userId, email: a.email, fullName: a.fullName || a.email, passwordHash: "compte-en-ligne" });
  if (!db.memberships.some((m) => m.userId === userId && m.tenantId === tenantId)) db.memberships.push({ tenantId, userId, role: "admin" });
  if (!db.panels.length) db.panels.push(...defaultPanels);
  if (!db.inverters.length) db.inverters.push(...defaultInverters);
  window.localStorage.setItem(SESSION, JSON.stringify({ userId, tenantId }));
  save();
  return currentSession()!;
}

/** remplace les dossiers et clients locaux d'un compte en ligne par la version serveur la plus récente */
export function mergeCloudData(tenantId: string, remote: { projects: Project[]; clients: Client[] }): { pushProjects: Project[]; pushClients: Client[] } {
  const db = load();
  const pushProjects: Project[] = [], pushClients: Client[] = [];
  for (const rp of remote.projects) {
    const i = db.projects.findIndex((x) => x.id === rp.id);
    const fixed = { ...rp, tenantId };
    if (i < 0) db.projects.push(fixed);
    else if (db.projects[i].updatedAt <= rp.updatedAt) db.projects[i] = fixed;
  }
  for (const lp of db.projects.filter((x) => x.tenantId === tenantId)) {
    const r = remote.projects.find((x) => x.id === lp.id);
    if (!r || r.updatedAt < lp.updatedAt) pushProjects.push(lp);
  }
  for (const rc of remote.clients) {
    const i = db.clients.findIndex((x) => x.id === rc.id);
    if (i < 0) db.clients.push({ ...rc, tenantId });
    else db.clients[i] = { ...rc, tenantId };
  }
  for (const lc of db.clients.filter((x) => x.tenantId === tenantId)) if (!remote.clients.some((x) => x.id === lc.id)) pushClients.push(lc);
  save();
  return { pushProjects, pushClients };
}

/** déconnexion d'un compte en ligne : les données restent sur le serveur, on efface la copie locale (appareil partagé) */
export async function forgetLocalTenant(tenantId: string) {
  const db = load();
  for (const p of db.projects.filter((x) => x.tenantId === tenantId)) await Promise.all(p.photos.map((ph) => del(ph.blobKey)));
  db.projects = db.projects.filter((x) => x.tenantId !== tenantId);
  db.clients = db.clients.filter((x) => x.tenantId !== tenantId);
  db.notifications = db.notifications.filter((x) => x.tenantId !== tenantId);
  db.audit = db.audit.filter((x) => x.tenantId !== tenantId);
  window.localStorage.removeItem(SESSION);
  save();
}

// ----------------------------------------------------------------- seed
export async function ensureSeed(seedDemoProjects: (tenantId: string, userId: string) => Promise<Project[]>) {
  const db = load();
  if (db.users.length) return;
  const t: Tenant = { id: "ten_demo", kind: "professionnel", name: "Soleil Picard Énergie (démo)", siret: "000 000 000 00000", address: "1 rue de l'Exemple, 80000 Amiens", email: "contact@example.org", phone: "03 00 00 00 00", retentionMonths: 60, plan: "pro", legalMentions: "SAS fictive de démonstration. RGE n° EXEMPLE." };
  const demo: UserRecord = { id: "usr_demo", email: DEMO_ACCOUNTS.installateur.email, fullName: "Alex Démo", passwordHash: await hashPassword(DEMO_ACCOUNTS.installateur.password) };
  const admin: UserRecord = { id: "usr_admin", email: DEMO_ACCOUNTS.admin.email, fullName: "Super Admin", isSuperAdmin: true, passwordHash: await hashPassword(DEMO_ACCOUNTS.admin.password) };
  db.tenants.push(t);
  db.users.push(demo, admin);
  db.memberships.push({ tenantId: t.id, userId: demo.id, role: "admin" }, { tenantId: t.id, userId: admin.id, role: "admin" });
  db.panels.push(...defaultPanels);
  db.inverters.push(...defaultInverters);
  db.subscriptions[t.id] = { plan: "pro", status: "active", dossiersUsed: 0, periodEnd: addDaysIso(30) };
  save();
  // les dossiers de démo sont créés dans la session de l'utilisateur démo
  window.localStorage.setItem(SESSION, JSON.stringify({ userId: demo.id, tenantId: t.id }));
  try {
    const projects = await seedDemoProjects(t.id, demo.id);
    const fresh = load();
    fresh.projects.push(...projects);
    fresh.subscriptions[t.id].dossiersUsed = projects.length;
    save();
  } finally {
    window.localStorage.removeItem(SESSION);
  }
}

export function resetAll() {
  window.localStorage.removeItem(KEY);
  window.localStorage.removeItem(SESSION);
  cache = null;
  listeners.forEach((l) => l());
}

/** le compte est-il celui d'un particulier (qui fait sa propre démarche) ? */
export const isHomeowner = (s: Session | null) => s?.tenant.kind === "particulier";
