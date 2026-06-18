"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getMergedProjects, projectsStorageKey } from "@/lib/projects";
import { Project } from "@/types/Project";
import AppShell from "@/components/layout/AppShell";
import Panel from "@/components/ui/Panel";

export default function ProjectCommandCenterPage() {
  const params = useParams();
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

  return (
    <AppShell title="Project Command Center">
      <div className="command-center">
        <Link href="/">{"<-"} Back to Main Dashboard</Link>

        <Panel>
          <div className="command-header">
            <div>
              <h1 className="command-header-title">{project.name}</h1>
              <p className="command-meta">
                {project.client} | {project.status} | Bid Due{" "}
                {project.bidDueDate}
              </p>
            </div>
            <span className="command-status">{project.status}</span>
          </div>
        </Panel>

        <Panel title="Project Navigation">
          <nav className="command-nav">
            <Link
              href={`/projects/${project.id}/overview`}
              className="command-nav-link"
            >
              Overview
            </Link>
            <Link
              href={`/projects/${project.id}/setup`}
              className="command-nav-link"
            >
              Setup
            </Link>
            <Link
              href={`/projects/${project.id}/budget`}
              className="command-nav-link"
            >
              Budget
            </Link>
            <Link
              href={`/projects/${project.id}/invite`}
              className="command-nav-link"
            >
              Invite Preview
            </Link>
            <Link
              href={`/projects/${project.id}/proposal`}
              className="command-nav-link"
            >
              Proposal
            </Link>
            <Link
              href={`/projects/${project.id}/setup`}
              className="command-nav-link"
            >
              Project Setup
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
