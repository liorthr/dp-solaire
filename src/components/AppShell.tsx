"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Bell, FileText, Home, LogOut, Menu, Package, Plus, Settings, Shield, Users, CreditCard, Activity } from "lucide-react";
import { logout, repo } from "@/lib/store/db";
import { useDbVersion, useSeed, useSession } from "@/lib/store/hooks";
import { cn } from "./ui";

const NAV = [
  { href: "/app/", label: "Tableau de bord", icon: Home },
  { href: "/app/nouveau/", label: "Nouveau dossier", icon: Plus },
  { href: "/app/clients/", label: "Clients", icon: Users },
  { href: "/app/catalogue/", label: "Catalogue", icon: Package },
  { href: "/app/parametres/", label: "Entreprise & RGPD", icon: Settings },
  { href: "/app/abonnement/", label: "Abonnement", icon: CreditCard },
  { href: "/sante/", label: "Santé des sources", icon: Activity },
];

export function AppShell({ children, title }: { children: ReactNode; title?: string }) {
  const seeded = useSeed();
  const { session, loading } = useSession();
  const router = useRouter();
  const path = usePathname();
  const [menu, setMenu] = useState(false);
  useDbVersion();
  useEffect(() => {
    if (seeded && !loading && !session) router.replace("/connexion/");
  }, [seeded, loading, session, router]);
  if (!seeded || loading || !session) return <div className="flex min-h-screen items-center justify-center text-stone-500">Chargement…</div>;
  const unread = repo.notifications().filter((n) => !n.read).length;
  const nav = session.user.isSuperAdmin ? [...NAV, { href: "/app/admin/", label: "Back-office", icon: Shield }] : NAV;
  const active = (h: string) => (h === "/app/" ? path === "/app" || path === "/app/" : path?.startsWith(h.replace(/\/$/, "")));
  return (
    <div className="min-h-screen pb-20 sm:pb-0">
      <header className="sticky top-0 z-[500] border-b border-stone-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
          <button className="sm:hidden" aria-label="Menu" onClick={() => setMenu((m) => !m)}>
            <Menu className="h-6 w-6" />
          </button>
          <Link href="/app/" className="flex items-center gap-2 font-bold text-brand-800">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-amber-400 text-stone-900">☀</span>
            <span>DP Solaire</span>
          </Link>
          <span className="hidden truncate text-sm text-stone-500 sm:inline">{session.tenant.name}</span>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/app/" aria-label={`${unread} notifications`} className="relative rounded-lg p-2 hover:bg-stone-100">
              <Bell className="h-5 w-5" />
              {unread > 0 && <span className="absolute right-1 top-1 h-4 min-w-4 rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">{unread}</span>}
            </Link>
            <span className="hidden text-sm sm:inline">{session.user.fullName}</span>
            <button
              onClick={() => {
                logout();
                router.replace("/connexion/");
              }}
              className="rounded-lg p-2 hover:bg-stone-100"
              aria-label="Se déconnecter"
              title="Se déconnecter"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>
      <div className="mx-auto flex max-w-6xl gap-6 px-4 py-4 sm:py-6">
        <nav aria-label="Navigation principale" className={cn("fixed inset-x-0 top-14 z-[400] border-b bg-white p-3 sm:static sm:block sm:w-52 sm:shrink-0 sm:border-0 sm:bg-transparent sm:p-0", menu ? "block" : "hidden")}>
          <ul className="space-y-1">
            {nav.map((n) => (
              <li key={n.href}>
                <Link href={n.href} onClick={() => setMenu(false)} className={cn("flex items-center gap-2 rounded-lg px-3 py-2 text-sm", active(n.href) ? "bg-brand-50 font-semibold text-brand-800" : "text-stone-700 hover:bg-stone-100")}>
                  <n.icon className="h-4 w-4" /> {n.label}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-6 hidden px-3 text-xs text-stone-500 sm:block">
            Mode démo : données stockées dans ce navigateur.
            <br />
            <Link className="underline" href="/cgu/">CGU & responsabilité</Link>
          </p>
        </nav>
        <main className="min-w-0 flex-1">
          {title && <h1 className="mb-4 text-xl font-bold sm:text-2xl">{title}</h1>}
          {children}
        </main>
      </div>
      <nav aria-label="Navigation mobile" className="fixed inset-x-0 bottom-0 z-[450] flex justify-around border-t border-stone-200 bg-white py-1.5 sm:hidden">
        {[NAV[0], NAV[1], NAV[2]].map((n) => (
          <Link key={n.href} href={n.href} className={cn("flex flex-col items-center px-3 text-[11px]", active(n.href) ? "text-brand-700" : "text-stone-500")}>
            <n.icon className="h-5 w-5" />
            {n.label.split(" ")[0]}
          </Link>
        ))}
        <Link href="/app/" className="flex flex-col items-center px-3 text-[11px] text-stone-500">
          <FileText className="h-5 w-5" />
          Dossiers
        </Link>
      </nav>
    </div>
  );
}
