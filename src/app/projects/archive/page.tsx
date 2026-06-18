"use client";

import { useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import {
  deleteProjectPermanently,
  getArchivedProjects,
  getMergedProjects,
  projectsStorageKey,
  restoreProject,
} from "@/lib/projects";
import { Project } from "@/types/Project";

export default function ProjectArchivePage() {
  const projects = useProjectsSnapshot();
  const archivedProjects = useMemo(
    () =>
      getArchivedProjects(projects).sort((a, b) =>
        (b.archivedAt ?? "").localeCompare(a.archivedAt ?? "")
      ),
    [projects]
  );

  function handleRestoreProject(project: Project) {
    const confirmed = window.confirm(
      `Restore ${project.name}? It will return to the active project dashboard.`
    );

    if (!confirmed) return;

    restoreProject(project.id);
    window.dispatchEvent(new Event("storage"));
  }

  function handleDeleteProject(project: Project) {
    const confirmed = window.confirm(
      `Permanently delete ${project.name}? This cannot be undone.`
    );

    if (!confirmed) return;

    const typedConfirmation = window.prompt(
      `Type DELETE to permanently delete ${project.name}.`
    );

    if (typedConfirmation !== "DELETE") return;

    deleteProjectPermanently(project.id);
    window.dispatchEvent(new Event("storage"));
  }

  return (
    <AppShell title="Project Archive">
      <div className="archive-page-shell">
        <section className="dashboard-hero">
          <div>
            <p className="label-text">Workspace</p>
            <h1>Project Archive</h1>
            <p className="dashboard-subtitle">
              Restore archived pursuits or permanently remove records no longer
              needed.
            </p>
          </div>
          <Link href="/" className="button-secondary">
            Dashboard
          </Link>
        </section>

        <section className="dashboard-panel">
          {archivedProjects.length === 0 ? (
            <div className="dashboard-empty-state">
              <p className="muted-text">No archived projects.</p>
              <Link href="/" className="button-primary">
                Back to Dashboard
              </Link>
            </div>
          ) : (
            <div className="table-shell">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Project</th>
                    <th>Client</th>
                    <th>Status</th>
                    <th>Archived</th>
                    <th>GC Bid Due</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {archivedProjects.map((project) => (
                    <tr key={project.id}>
                      <td>
                        <strong>{project.name}</strong>
                      </td>
                      <td>{project.client}</td>
                      <td>
                        <span className="badge badge-muted">
                          {formatStatus(project.status)}
                        </span>
                      </td>
                      <td>{formatDate(project.archivedAt)}</td>
                      <td>{formatDate(project.bidDueDate)}</td>
                      <td>
                        <div className="archive-actions">
                          <button
                            type="button"
                            className="button-secondary"
                            onClick={() => handleRestoreProject(project)}
                          >
                            Restore
                          </button>
                          <button
                            type="button"
                            className="button-danger"
                            onClick={() => handleDeleteProject(project)}
                          >
                            Delete Permanently
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}

let cachedProjectsStorageValue: string | undefined;
let cachedProjects: Project[] = getMergedProjects();

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

function formatDate(value: string | undefined) {
  if (!value) return "Not set";

  const dateOnlyMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const date = dateOnlyMatch
    ? new Date(
        Number(dateOnlyMatch[1]),
        Number(dateOnlyMatch[2]) - 1,
        Number(dateOnlyMatch[3])
      )
    : new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatStatus(status: string) {
  return status.replace(/_/g, " ");
}
