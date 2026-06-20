"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  archiveProject,
  getMergedProjects,
  projectsStorageKey,
} from "@/lib/projects";
import { Project } from "@/types/Project";
import AppShell from "@/components/layout/AppShell";
import Panel from "@/components/ui/Panel";

export default function ProjectCommandCenterPage() {
  const params = useParams();
  const router = useRouter();
  const rawProjectId = params.projectId;
  const projectId = Array.isArray(rawProjectId) ? rawProjectId[0] : rawProjectId;
  const projects = useProjectsSnapshot();
  const project = projects.find((p) => p.id === projectId);

  if (!project) {
    return (
      <AppShell title="Project Not Found">
        <h1>Project Not Found</h1>
        <p>Requested project ID: {projectId}</p>
        <Link href="/">Back to Dashboard</Link>
      </AppShell>
    );
  }

  function handleArchiveProject() {
    if (!project) return;

    const confirmed = window.confirm(
      `Archive ${project.name}? It will be removed from active project views and can be restored from the project archive.`
    );

    if (!confirmed) return;

    archiveProject(project.id);
    window.dispatchEvent(new Event("storage"));
    router.push("/projects/archive");
  }

  return (
    <AppShell title="Project Command Center">
      <div className="command-center">
        <Link href="/">{"<-"} Back to Dashboard</Link>

        <Panel>
          <div className="command-header">
            <div>
              <h1 className="command-header-title">{project.name}</h1>
              <p className="command-meta">
                {project.client} | {project.status} | Bid Due{" "}
                {project.bidDueDate}
              </p>
            </div>
            <div className="command-header-actions">
              <span className="command-status">{project.status}</span>
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
              <Link
                href={`/projects/${project.id}/invite`}
                className="button-secondary"
              >
                Invites
              </Link>
              <button
                type="button"
                className="button-secondary"
                onClick={handleArchiveProject}
              >
                Archive Project
              </button>
            </div>
          </div>
        </Panel>

        <Panel title="Project Navigation">
          <nav className="command-nav">
            <Link
              href={`/projects/${project.id}/overview`}
              className="command-nav-link"
            >
              Estimate Review
            </Link>
            <Link
              href={`/projects/${project.id}/setup`}
              className="command-nav-link"
            >
              Project Setup
            </Link>
            <Link
              href={`/projects/${project.id}/scope`}
              className="command-nav-link"
            >
              Project Scope
            </Link>
            <Link
              href={`/projects/${project.id}/invite`}
              className="command-nav-link"
            >
              Invites
            </Link>
            <Link
              href={`/projects/${project.id}/bids`}
              className="command-nav-link"
            >
              Bids
            </Link>
            <Link
              href={`/projects/${project.id}/leveling`}
              className="command-nav-link"
            >
              Bid Leveling
            </Link>
            <Link
              href={`/projects/${project.id}/bids/new`}
              className="command-nav-link"
            >
              Add Manual Bid
            </Link>
          </nav>
        </Panel>

        <div className="command-grid">
          <Panel title="Critical Notifications">
            <p className="muted-text">No critical notifications yet.</p>
          </Panel>

          <Panel title="Bid Coverage Summary">
            <p className="muted-text">Bid coverage heatmap placeholder.</p>
          </Panel>

          <Panel title="Follow-Up Queue">
            <p className="muted-text">Follow-up queue placeholder.</p>
          </Panel>

          <Panel title="New Bids Awaiting Review">
            <p className="muted-text">New bids awaiting review placeholder.</p>
          </Panel>

          <Panel title="Upcoming Dates">
            <table className="compact-table">
              <tbody>
                {project.subcontractorBidDueDate && (
                  <tr>
                    <th className="compact-cell">Subcontractor Bid Due</th>
                    <td className="compact-cell">
                      {project.subcontractorBidDueDate}
                    </td>
                  </tr>
                )}
                {project.bidReviewDate && (
                  <tr>
                    <th className="compact-cell">Bid Review</th>
                    <td className="compact-cell">{project.bidReviewDate}</td>
                  </tr>
                )}
                <tr>
                  <th className="compact-cell">Bid Due</th>
                  <td className="compact-cell">{project.bidDueDate}</td>
                </tr>
              </tbody>
            </table>
          </Panel>

          <Panel title="Recent Activity">
            <p className="muted-text">Recent activity placeholder.</p>
          </Panel>
        </div>
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
