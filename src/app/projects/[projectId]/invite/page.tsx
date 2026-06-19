"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CsiCodeLabel } from "@/components/csi";
import AppShell from "@/components/layout/AppShell";
import Panel from "@/components/ui/Panel";
import {
  getProjectBidPackages,
  projectBidPackagesStorageKey,
} from "@/lib/projectBids";
import {
  generateInviteRecipientsFromBidPackageMatches,
  getProjectInviteRecipients,
  projectInviteRecipientsStorageKey,
  saveProjectInviteRecipients,
} from "@/lib/projectInvites";
import { getMergedProjects, projectsStorageKey } from "@/lib/projects";
import { resolveProjectCsiItem } from "@/lib/projectCsiSelections";
import {
  getMergedSubcontractors,
  subcontractorsStorageKey,
} from "@/lib/subcontractors";
import { matchSubcontractorsToBidPackages } from "@/lib/subcontractorMatching";
import { ProjectBidPackage } from "@/types/Bid";
import { ProjectInviteRecipient } from "@/types/Invite";
import { Project } from "@/types/Project";
import { Subcontractor } from "@/types/Subcontractor";

const projectDraftInviteSelectionsStorageKey = "projectDraftInviteSelections";
const projectInviteRecipientsChangeEvent = "projectInviteRecipientsChange";

type LegacyDraftInviteSelection = {
  projectId: string;
  updatedAt: string;
  candidates?: unknown[];
};

type LegacyDraftInviteSelections = Record<string, LegacyDraftInviteSelection>;

let cachedProjectsStorageValue: string | undefined;
let cachedProjects: Project[] = getMergedProjects();
let cachedSubcontractorsStorageValue: string | undefined;
let cachedSubcontractors: Subcontractor[] = getMergedSubcontractors();
let cachedBidPackagesStorageValue: string | undefined;
let cachedBidPackagesProjectId: string | undefined;
let cachedBidPackages: ProjectBidPackage[] = [];
let cachedInviteRecipientsStorageValue: string | undefined;
let cachedInviteRecipientsProjectId: string | undefined;
let cachedInviteRecipients: ProjectInviteRecipient[] = [];
let cachedLegacyDraftStorageValue: string | undefined;
let cachedLegacyDrafts: LegacyDraftInviteSelections = {};

export default function ProjectInvitesPage() {
  const params = useParams();
  const rawProjectId = params.projectId;
  const projectId = Array.isArray(rawProjectId) ? rawProjectId[0] : rawProjectId;
  const projects = useProjectsSnapshot();
  const project = projects.find((item) => item.id === projectId);
  const subcontractors = useSubcontractorsSnapshot().filter(
    (subcontractor) => !subcontractor.archived
  );
  const bidPackages = useBidPackagesSnapshot(projectId ?? "");
  const inviteRecipients = useInviteRecipientsSnapshot(projectId ?? "");
  const legacyDrafts = useLegacyDraftSnapshot();
  const [message, setMessage] = useState("");
  const activeBidPackages = useMemo(
    () =>
      bidPackages.filter(
        (bidPackage) =>
          bidPackage.status !== "CLOSED" && bidPackage.scopeItemIds.length > 0
      ),
    [bidPackages]
  );
  const legacyDraft = projectId ? legacyDrafts[projectId] : undefined;

  if (!project) {
    return (
      <AppShell title="Project Not Found">
        <p>Requested project ID: {projectId}</p>
        <Link href="/">Back to Dashboard</Link>
      </AppShell>
    );
  }

  function generateInviteList() {
    if (!project) return;

    if (activeBidPackages.length === 0) {
      setMessage("Create active Bid Packages before generating an invite list.");
      return;
    }

    const packageMatches = matchSubcontractorsToBidPackages({
      projectId: project.id,
      csiVersion: project.csiVersion,
      bidPackages: activeBidPackages,
      subcontractors,
      includePossibleMatches: true,
      options: {
        projectLocation: {
          city: project.city,
          state: project.state,
        },
      },
    });
    const recipients = generateInviteRecipientsFromBidPackageMatches({
      projectId: project.id,
      bidPackages: activeBidPackages,
      packageMatches,
    });

    saveProjectInviteRecipients(project.id, recipients);
    window.dispatchEvent(new Event(projectInviteRecipientsChangeEvent));
    setMessage(`Generated ${recipients.length} draft ITB recipient(s).`);
  }

  return (
    <AppShell title={`${project.name} - Invites`}>
      <div className="command-center">
        <Link href={`/projects/${project.id}`}>{"<-"} Back to Command Center</Link>

        <Panel title="Invites">
          <p className="muted-text">
            Review and manage ITB recipients by bid package.
          </p>
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
            <button
              type="button"
              className="button-primary"
              onClick={generateInviteList}
            >
              Generate Invite List
            </button>
            {message ? <span className="save-confirmation">{message}</span> : null}
          </div>
        </Panel>

        {legacyDraft && (legacyDraft.candidates?.length ?? 0) > 0 ? (
          <Panel title="Legacy Draft Invite Data">
            <p className="muted-text">
              This project has {legacyDraft.candidates?.length ?? 0} legacy
              scope-based draft invite candidate(s). They were preserved for
              compatibility, but this page now manages package/contact
              recipients.
            </p>
          </Panel>
        ) : null}

        {activeBidPackages.length === 0 ? (
          <Panel title="No Bid Packages">
            <p className="muted-text">No bid packages have been created yet.</p>
            <Link
              href={`/projects/${project.id}/scope`}
              className="button-primary"
            >
              Open Project Scope
            </Link>
          </Panel>
        ) : (
          activeBidPackages.map((bidPackage) => (
            <BidPackageInviteSection
              key={bidPackage.id}
              project={project}
              bidPackage={bidPackage}
              subcontractors={subcontractors}
              recipients={inviteRecipients.filter(
                (recipient) => recipient.bidPackageId === bidPackage.id
              )}
            />
          ))
        )}
      </div>
    </AppShell>
  );
}

function BidPackageInviteSection({
  project,
  bidPackage,
  subcontractors,
  recipients,
}: {
  project: Project;
  bidPackage: ProjectBidPackage;
  subcontractors: Subcontractor[];
  recipients: ProjectInviteRecipient[];
}) {
  const draftRecipients = recipients.filter((recipient) =>
    isDraftRecipient(recipient)
  );
  const possibleRecipients = recipients.filter(isPossibleRecipient);
  const sentCount = recipients.filter((recipient) => recipient.status === "SENT").length;
  const failedCount = recipients.filter(
    (recipient) => recipient.status === "FAILED"
  ).length;
  const packageScopeItems = bidPackage.scopeItemIds
    .map((scopeItemId) => resolveProjectCsiItem(project.csiVersion, scopeItemId))
    .filter(isDefined);

  return (
    <Panel title={bidPackage.name}>
      <div className="project-csi-section-header">
        <div>
          <p className="muted-text">
            {bidPackage.scopeItemIds.length} mapped CSI scope(s) |{" "}
            {recipients.length} recipient(s)
          </p>
          <div className="badge-list">
            <span className="badge badge-muted">
              Draft {recipients.filter((recipient) => recipient.status === "DRAFT").length}
            </span>
            <span className="badge badge-muted">Sent {sentCount}</span>
            <span className="badge badge-muted">Failed {failedCount}</span>
          </div>
        </div>
        <div className="settings-actions">
          <button type="button" className="button-secondary" disabled>
            Send Package ITB
          </button>
          <button type="button" className="button-secondary" disabled>
            Add Recipient
          </button>
          <span className="muted-text">Sending will be wired in a later phase.</span>
        </div>
      </div>

      {packageScopeItems.length > 0 ? (
        <div className="badge-list" style={{ marginTop: 12 }}>
          {packageScopeItems.map((item) => (
            <span key={item.id} className="badge badge-muted">
              <CsiCodeLabel item={item} showLevelBadge />
            </span>
          ))}
        </div>
      ) : null}

      <RecipientGroup
        title="Selected / Draft Recipients"
        recipients={draftRecipients}
        subcontractors={subcontractors}
      />
      <RecipientGroup
        title="Possible Matches"
        recipients={possibleRecipients}
        subcontractors={subcontractors}
      />
    </Panel>
  );
}

function RecipientGroup({
  title,
  recipients,
  subcontractors,
}: {
  title: string;
  recipients: ProjectInviteRecipient[];
  subcontractors: Subcontractor[];
}) {
  return (
    <div style={{ marginTop: 20 }}>
      <h3>{title}</h3>
      {recipients.length === 0 ? (
        <p className="muted-text">No recipients in this group.</p>
      ) : (
        <div className="table-shell">
          <table className="data-table">
            <thead>
              <tr>
                <th>Subcontractor</th>
                <th>Contact / Email</th>
                <th>Match</th>
                <th>Confidence</th>
                <th>Coverage</th>
                <th>Status</th>
                <th>Source</th>
                <th>Scopes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {recipients.map((recipient) => (
                <tr key={recipient.id}>
                  <td>{getRecipientSubcontractorName(recipient, subcontractors)}</td>
                  <td>{recipient.contactId ?? recipient.email ?? "Company default"}</td>
                  <td>{recipient.matchLabel ?? recipient.matchType ?? "Manual"}</td>
                  <td>
                    <span className="badge badge-muted">
                      {recipient.confidence ?? "LOW"}
                    </span>
                  </td>
                  <td>{formatCoverageRatio(recipient.coverageRatio)}</td>
                  <td>
                    <span className={getStatusBadgeClassName(recipient.status)}>
                      {formatStatus(recipient.status)}
                    </span>
                  </td>
                  <td>{recipient.source}</td>
                  <td>{recipient.selectedScopeItemIds.length}</td>
                  <td>
                    <button type="button" className="button-secondary" disabled>
                      Send / Resend Recipient
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function isDraftRecipient(recipient: ProjectInviteRecipient) {
  return recipient.status !== "REMOVED" && !isPossibleRecipient(recipient);
}

function isPossibleRecipient(recipient: ProjectInviteRecipient) {
  return recipient.confidence === "LOW" || (recipient.coverageRatio ?? 1) < 0.5;
}

function formatCoverageRatio(value: number | undefined) {
  if (value === undefined) return "Unknown";

  return `${Math.round(value * 100)}%`;
}

function getStatusBadgeClassName(status: ProjectInviteRecipient["status"]) {
  if (status === "SENT") return "badge badge-success";
  if (status === "FAILED") return "badge badge-danger";
  if (status === "QUEUED") return "badge badge-warning";

  return "badge badge-muted";
}

function getRecipientSubcontractorName(
  recipient: ProjectInviteRecipient,
  subcontractors: Subcontractor[]
) {
  return (
    subcontractors.find((subcontractor) => subcontractor.id === recipient.subcontractorId)
      ?.companyName ?? recipient.subcontractorId
  );
}

function useProjectsSnapshot(): Project[] {
  return useSyncExternalStore(
    subscribeToStorage,
    getProjectsSnapshot,
    getServerProjectsSnapshot
  );
}

function useSubcontractorsSnapshot(): Subcontractor[] {
  return useSyncExternalStore(
    subscribeToStorage,
    getSubcontractorsSnapshot,
    getServerSubcontractorsSnapshot
  );
}

function useBidPackagesSnapshot(projectId: string): ProjectBidPackage[] {
  return useSyncExternalStore(
    subscribeToStorage,
    () => getBidPackagesSnapshot(projectId),
    getServerBidPackagesSnapshot
  );
}

function useInviteRecipientsSnapshot(projectId: string): ProjectInviteRecipient[] {
  return useSyncExternalStore(
    subscribeToInviteRecipientStorage,
    () => getInviteRecipientsSnapshot(projectId),
    getServerInviteRecipientsSnapshot
  );
}

function useLegacyDraftSnapshot(): LegacyDraftInviteSelections {
  return useSyncExternalStore(
    subscribeToStorage,
    getLegacyDraftSnapshot,
    getServerLegacyDraftSnapshot
  );
}

function subscribeToStorage(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
  };
}

function subscribeToInviteRecipientStorage(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(projectInviteRecipientsChangeEvent, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(projectInviteRecipientsChangeEvent, onStoreChange);
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

function getServerSubcontractorsSnapshot(): Subcontractor[] {
  return cachedSubcontractors;
}

function getSubcontractorsSnapshot(): Subcontractor[] {
  const storageValue = localStorage.getItem(subcontractorsStorageKey) || "[]";

  if (storageValue !== cachedSubcontractorsStorageValue) {
    cachedSubcontractorsStorageValue = storageValue;
    cachedSubcontractors = getMergedSubcontractors(storageValue);
  }

  return cachedSubcontractors;
}

function getServerBidPackagesSnapshot(): ProjectBidPackage[] {
  return [];
}

function getBidPackagesSnapshot(projectId: string): ProjectBidPackage[] {
  const storageValue = localStorage.getItem(projectBidPackagesStorageKey) || "[]";

  if (
    storageValue !== cachedBidPackagesStorageValue ||
    projectId !== cachedBidPackagesProjectId
  ) {
    cachedBidPackagesStorageValue = storageValue;
    cachedBidPackagesProjectId = projectId;
    cachedBidPackages = getProjectBidPackages(projectId);
  }

  return cachedBidPackages;
}

function getServerInviteRecipientsSnapshot(): ProjectInviteRecipient[] {
  return [];
}

function getInviteRecipientsSnapshot(projectId: string): ProjectInviteRecipient[] {
  const storageValue =
    localStorage.getItem(projectInviteRecipientsStorageKey) || "[]";

  if (
    storageValue !== cachedInviteRecipientsStorageValue ||
    projectId !== cachedInviteRecipientsProjectId
  ) {
    cachedInviteRecipientsStorageValue = storageValue;
    cachedInviteRecipientsProjectId = projectId;
    cachedInviteRecipients = getProjectInviteRecipients(projectId);
  }

  return cachedInviteRecipients;
}

function getServerLegacyDraftSnapshot(): LegacyDraftInviteSelections {
  return cachedLegacyDrafts;
}

function getLegacyDraftSnapshot(): LegacyDraftInviteSelections {
  const storageValue =
    localStorage.getItem(projectDraftInviteSelectionsStorageKey) || "{}";

  if (storageValue !== cachedLegacyDraftStorageValue) {
    cachedLegacyDraftStorageValue = storageValue;
    cachedLegacyDrafts = parseLegacyDrafts(storageValue);
  }

  return cachedLegacyDrafts;
}

function parseLegacyDrafts(storageValue: string): LegacyDraftInviteSelections {
  try {
    const parsed = JSON.parse(storageValue);

    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed
      : {};
  } catch {
    return {};
  }
}

function formatStatus(value: string) {
  return value
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}
