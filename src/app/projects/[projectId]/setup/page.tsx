"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import Panel from "@/components/ui/Panel";
import { getMergedProjects, projectsStorageKey } from "@/lib/projects";
import { Project } from "@/types/Project";

let cachedProjectsStorageValue: string | undefined;
let cachedProjects: Project[] = getMergedProjects();

export default function ProjectSetupPage() {
  const params = useParams();
  const rawProjectId = params.projectId;
  const projectId = Array.isArray(rawProjectId) ? rawProjectId[0] : rawProjectId;
  const projects = useProjectsSnapshot();
  const project = projects.find((item) => item.id === projectId);

  if (!project) {
    return (
      <AppShell title="Project Not Found">
        <p>Requested project ID: {projectId}</p>
        <Link href="/">Back to Dashboard</Link>
      </AppShell>
    );
  }

  return (
    <AppShell title="Project Setup">
      <div className="form-section-stack">
        <Panel>
          <p className="label-text">Project Setup</p>
          <h1>{project.name}</h1>
          <p className="muted-text">
            This area will become the staged project onboarding workflow for
            project details, documents, estimate setup, scope setup, and bid
            preparation.
          </p>
        </Panel>

        <Panel title="Setup Shortcuts">
          <p className="muted-text">
            Project scope selection has moved to its own workspace while the
            full setup workflow is built.
          </p>
          <div className="settings-actions">
            <Link href={`/projects/${project.id}/scope`} className="button-primary">
              Project Scope
            </Link>
            <Link
              href={`/projects/${project.id}/overview`}
              className="button-secondary"
            >
              Project Overview
            </Link>
            <Link
              href={`/projects/${project.id}/edit`}
              className="button-secondary"
            >
              Edit Project
            </Link>
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}

function useProjectsSnapshot(): Project[] {
  return useSyncExternalStore(
    subscribeToProjectStorage,
    getProjectsSnapshot,
    getServerProjectsSnapshot
  );
}

function subscribeToProjectStorage(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
  };
}

function getServerProjectsSnapshot(): Project[] {
  return cachedProjects;
}

function getProjectsSnapshot(): Project[] {
  const storageValue = localStorage.getItem(projectsStorageKey) || "[]";

  if (storageValue !== cachedProjectsStorageValue) {
    cachedProjectsStorageValue = storageValue;
    cachedProjects = getMergedProjects(storageValue);
  }

  return cachedProjects;
}
