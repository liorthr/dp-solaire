"use client";
import { useCallback, useMemo } from "react";
import type { Project } from "@/lib/types";
import { repo } from "@/lib/store/db";
import { useDbVersion } from "@/lib/store/hooks";
import { analyze } from "@/lib/project/status";

export function useProject(id: string | null) {
  const v = useDbVersion();
  return useMemo(() => {
    void v;
    if (!id) return null;
    const project = repo.project(id);
    if (!project) return null;
    const client = repo.client(project.clientId);
    const panel = repo.panels().find((p) => p.id === project.pv.panelId);
    const inverter = repo.inverters().find((p) => p.id === project.pv.inverterId);
    const analysis = analyze(project, client, panel);
    return { project, client, panel, inverter, analysis, tenant: repo.tenant() };
  }, [id, v]);
}

export function useSaveProject() {
  return useCallback((p: Project, action?: string) => repo.saveProject(p, action), []);
}

export type ProjectBundle = NonNullable<ReturnType<typeof useProject>>;
