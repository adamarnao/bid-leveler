"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import Panel from "@/components/ui/Panel";
import {
  getMergedProjects,
  getProjectSetupStatus,
  projectsStorageKey,
} from "@/lib/projects";
import { Project } from "@/types/Project";

let cachedProjectsStorageValue: string | undefined;
let cachedProjects: Project[] = getMergedProjects();

export default function ProjectBudgetPage() {
  const params = useParams();
  const rawProjectId = params.projectId;
  const projectId = Array.isArray(rawProjectId) ? rawProjectId[0] : rawProjectId;
  const projects = useProjectsSnapshot();
  const project = projects.find((item) => item.id === projectId);

  if (!project) {
    return (
      <AppShell title="Project Not Found">
        <h1>Project Not Found</h1>
        <p>Requested project ID: {projectId}</p>
        <Link href="/">Back to Dashboard</Link>
      </AppShell>
    );
  }

  return (
    <AppShell title={`${project.name} - Budget`}>
      <div className="command-center">
        <Link href={`/projects/${project.id}`}>{"<-"} Back to Command Center</Link>

        <Panel title="Budget">
          <p className="muted-text">
            Budgeting will connect to takeoffs, historical pricing, allowances,
            and bid totals later.
          </p>

          <table className="compact-table" style={{ marginTop: 12 }}>
            <tbody>
              <tr>
                <th className="compact-cell">Client</th>
                <td className="compact-cell">{project.client}</td>
              </tr>
              <tr>
                <th className="compact-cell">Status</th>
                <td className="compact-cell">{formatStatus(project.status)}</td>
              </tr>
              <tr>
                <th className="compact-cell">Bid Due Date</th>
                <td className="compact-cell">{project.bidDueDate || "Not set"}</td>
              </tr>
              <tr>
                <th className="compact-cell">Setup Status</th>
                <td className="compact-cell">
                  {formatStatus(getProjectSetupStatus(project))}
                </td>
              </tr>
            </tbody>
          </table>

          <div className="settings-actions">
            <Link href={`/projects/${project.id}`} className="button-secondary">
              Command Center
            </Link>
            <Link
              href={`/projects/${project.id}/setup`}
              className="button-secondary"
            >
              Project Setup
            </Link>
            <Link
              href={`/projects/${project.id}/scope`}
              className="button-secondary"
            >
              Project Scope
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

function formatStatus(status: string) {
  return status.replace(/_/g, " ");
}
