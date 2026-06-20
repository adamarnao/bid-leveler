"use client";

import { useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CsiCodeLabel } from "@/components/csi";
import AppShell from "@/components/layout/AppShell";
import Panel from "@/components/ui/Panel";
import {
  deleteProjectBidSubmissionAndDependencies,
  getProjectBidSubmissions,
  getSubmittedBidAmount,
  projectBidSubmissionsStorageKey,
} from "@/lib/projectBids";
import { getMergedProjects, projectsStorageKey } from "@/lib/projects";
import { resolveProjectCsiItem } from "@/lib/projectCsiSelections";
import { ProjectBidSubmission } from "@/types/Bid";
import { Project } from "@/types/Project";

export default function ProjectBidsPage() {
  const params = useParams();
  const rawProjectId = params.projectId;
  const projectId = Array.isArray(rawProjectId) ? rawProjectId[0] : rawProjectId;
  const projects = useProjectsSnapshot();
  const bidSubmissions = useBidSubmissionsSnapshot(projectId ?? "");
  const project = projects.find((item) => item.id === projectId);
  const sortedBids = useMemo(
    () =>
      [...bidSubmissions].sort(
        (bidA, bidB) =>
          (bidB.submittedAt ?? "").localeCompare(bidA.submittedAt ?? "") ||
          (bidA.subcontractorName ?? "").localeCompare(
            bidB.subcontractorName ?? ""
          )
      ),
    [bidSubmissions]
  );

  if (!project) {
    return (
      <AppShell title="Project Not Found">
        <h1>Project Not Found</h1>
        <p>Requested project ID: {projectId}</p>
        <Link href="/">Back to Dashboard</Link>
      </AppShell>
    );
  }

  function handleDeleteBid(bid: ProjectBidSubmission) {
    const confirmed = window.confirm(
      `Delete bid from ${
        bid.subcontractorName ?? "this subcontractor"
      }? This will also remove leveling decisions tied to this bid.`
    );

    if (!confirmed) return;

    deleteProjectBidSubmissionAndDependencies(bid.projectId, bid.id);
    window.dispatchEvent(new Event("storage"));
  }

  return (
    <AppShell title="Bids">
      <div className="command-center">
        <div className="page-header">
          <div>
            <Link href={`/projects/${project.id}`}>
              {"<-"} Back to Command Center
            </Link>
            <h1>{project.name}</h1>
            <p className="muted-text">
              {project.client} | {formatStatus(project.status)}
            </p>
          </div>
          <div className="page-header-actions">
            <Link href={`/projects/${project.id}/bids/new`} className="button-primary">
              Add Manual Bid
            </Link>
            <Link href={`/projects/${project.id}`} className="button-secondary">
              Command Center
            </Link>
            <Link
              href={`/projects/${project.id}/scope`}
              className="button-secondary"
            >
              Project Scope
            </Link>
          </div>
        </div>

        {sortedBids.length === 0 ? (
          <Panel title="No Bids">
            <p className="muted-text">No bids have been entered yet.</p>
            <div className="settings-actions">
              <Link
                href={`/projects/${project.id}/bids/new`}
                className="button-primary"
              >
                Add Manual Bid
              </Link>
            </div>
          </Panel>
        ) : (
          <Panel title="Saved Bids">
            <div className="table-shell">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Subcontractor</th>
                    <th>Base Bid</th>
                    <th>Submitted</th>
                    <th>Status</th>
                    <th>Primary Scope</th>
                    <th>Scopes</th>
                    <th>Pricing Items</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedBids.map((bid) => {
                    const primaryScope = bid.primaryScopeItemId
                      ? resolveProjectCsiItem(project.csiVersion, bid.primaryScopeItemId)
                      : undefined;

                    return (
                      <tr key={bid.id}>
                        <td>{bid.subcontractorName ?? "Unassigned"}</td>
                        <td>{formatCurrency(getSubmittedBidAmount(bid))}</td>
                        <td>{bid.submittedAt ?? "Not set"}</td>
                        <td>
                          <span className="badge badge-muted">
                            {formatStatus(bid.status)}
                          </span>
                        </td>
                        <td>
                          {primaryScope ? (
                            <CsiCodeLabel item={primaryScope} showLevelBadge />
                          ) : (
                            "Unassigned"
                          )}
                        </td>
                        <td>{bid.scopeItemIds.length}</td>
                        <td>{bid.pricingItems?.length ?? 0}</td>
                        <td>
                          <div className="archive-actions">
                            <Link
                              href={`/projects/${project.id}/bids/${bid.id}`}
                              className="button-secondary"
                            >
                              Review
                            </Link>
                            <button
                              type="button"
                              className="button-danger"
                              onClick={() => handleDeleteBid(bid)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Panel>
        )}
      </div>
    </AppShell>
  );
}

let cachedProjectsStorageValue: string | undefined;
let cachedProjects: Project[] = getMergedProjects();
let cachedBidSubmissionsStorageValue: string | undefined;
let cachedBidSubmissions: ProjectBidSubmission[] = [];

function useProjectsSnapshot(): Project[] {
  return useSyncExternalStore(
    subscribeToStorage,
    getProjectsSnapshot,
    getServerProjectsSnapshot
  );
}

function useBidSubmissionsSnapshot(projectId: string): ProjectBidSubmission[] {
  return useSyncExternalStore(
    subscribeToStorage,
    () => getBidSubmissionsSnapshot(projectId),
    getServerBidSubmissionsSnapshot
  );
}

function subscribeToStorage(onStoreChange: () => void) {
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

function getServerBidSubmissionsSnapshot(): ProjectBidSubmission[] {
  return [];
}

function getBidSubmissionsSnapshot(projectId: string): ProjectBidSubmission[] {
  const storageValue =
    localStorage.getItem(projectBidSubmissionsStorageKey) || "[]";

  if (storageValue !== cachedBidSubmissionsStorageValue) {
    cachedBidSubmissionsStorageValue = storageValue;
    cachedBidSubmissions = getProjectBidSubmissions(projectId);
  }

  return cachedBidSubmissions.filter((bid) => bid.projectId === projectId);
}

function formatCurrency(value: number | undefined) {
  return value === undefined ? "Not priced" : `$${value.toLocaleString()}`;
}

function formatStatus(status: string) {
  return status
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}
