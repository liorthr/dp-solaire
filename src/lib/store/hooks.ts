"use client";
import { useEffect, useState, useSyncExternalStore } from "react";
import { currentSession, ensureSeed, repo, subscribe, type Session } from "./db";

let version = 0;
const sub = (fn: () => void) =>
  subscribe(() => {
    version++;
    fn();
  });
const getVersion = () => version;

/** re-rendu à chaque écriture dans le dépôt local */
export function useDbVersion() {
  return useSyncExternalStore(sub, getVersion, () => 0);
}

export function useSession(): { session: Session | null; loading: boolean } {
  const v = useDbVersion();
  const [state, setState] = useState<{ session: Session | null; loading: boolean }>({ session: null, loading: true });
  useEffect(() => {
    setState({ session: currentSession(), loading: false });
  }, [v]);
  return state;
}

let seeding: Promise<void> | null = null;
export function useSeed() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (repo.ready()) {
      setReady(true);
      return;
    }
    seeding ??= (async () => {
      const { seedDemoProjects } = await import("./seed");
      await ensureSeed(seedDemoProjects);
    })();
    seeding.then(() => setReady(true)).catch((e) => {
      console.error(e);
      setReady(true);
    });
  }, []);
  return ready;
}
