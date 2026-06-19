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
  saveProjectInviteRecipient,
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
import { Subcontractor, SubcontractorContact } from "@/types/Subcontractor";

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
              onRecipientChanged={(nextMessage) => {
                window.dispatchEvent(new Event(projectInviteRecipientsChangeEvent));
                setMessage(nextMessage);
              }}
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
  onRecipientChanged,
}: {
  project: Project;
  bidPackage: ProjectBidPackage;
  subcontractors: Subcontractor[];
  recipients: ProjectInviteRecipient[];
  onRecipientChanged: (message: string) => void;
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

  function saveRecipient(recipient: ProjectInviteRecipient) {
    saveProjectInviteRecipient({
      ...recipient,
      status: "DRAFT",
      updatedAt: new Date().toISOString(),
    });
    onRecipientChanged("Recipient updated.");
  }

  function removeRecipient(recipient: ProjectInviteRecipient) {
    saveProjectInviteRecipient({
      ...recipient,
      status: "REMOVED",
      updatedAt: new Date().toISOString(),
    });
    onRecipientChanged("Recipient removed from this bid package.");
  }

  function addManualRecipient(recipient: ProjectInviteRecipient) {
    saveProjectInviteRecipient(recipient);
    onRecipientChanged("Manual recipient added.");
  }

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

      <ManualRecipientForm
        project={project}
        bidPackage={bidPackage}
        subcontractors={subcontractors}
        onAddRecipient={addManualRecipient}
      />

      <RecipientGroup
        title="Selected / Draft Recipients"
        recipients={draftRecipients}
        subcontractors={subcontractors}
        onSaveRecipient={saveRecipient}
        onRemoveRecipient={removeRecipient}
      />
      <RecipientGroup
        title="Possible Matches"
        recipients={possibleRecipients}
        subcontractors={subcontractors}
        onSaveRecipient={saveRecipient}
        onRemoveRecipient={removeRecipient}
      />
    </Panel>
  );
}

function RecipientGroup({
  title,
  recipients,
  subcontractors,
  onSaveRecipient,
  onRemoveRecipient,
}: {
  title: string;
  recipients: ProjectInviteRecipient[];
  subcontractors: Subcontractor[];
  onSaveRecipient: (recipient: ProjectInviteRecipient) => void;
  onRemoveRecipient: (recipient: ProjectInviteRecipient) => void;
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
                <RecipientRow
                  key={recipient.id}
                  recipient={recipient}
                  subcontractor={subcontractors.find(
                    (item) => item.id === recipient.subcontractorId
                  )}
                  onSaveRecipient={onSaveRecipient}
                  onRemoveRecipient={onRemoveRecipient}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ManualRecipientForm({
  project,
  bidPackage,
  subcontractors,
  onAddRecipient,
}: {
  project: Project;
  bidPackage: ProjectBidPackage;
  subcontractors: Subcontractor[];
  onAddRecipient: (recipient: ProjectInviteRecipient) => void;
}) {
  const sortedSubcontractors = [...subcontractors].sort((a, b) =>
    a.companyName.localeCompare(b.companyName)
  );
  const [subcontractorId, setSubcontractorId] = useState("");
  const [contactId, setContactId] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const subcontractor = sortedSubcontractors.find(
    (item) => item.id === subcontractorId
  );
  const contacts = getInviteEligibleContacts(subcontractor);
  const selectedContact = contacts.find((contact) => contact.id === contactId);
  const hasContactOrEmail = Boolean(selectedContact?.email || email.trim());

  function handleSubcontractorChange(nextSubcontractorId: string) {
    const nextSubcontractor = sortedSubcontractors.find(
      (item) => item.id === nextSubcontractorId
    );
    const defaultContact = getInviteEligibleContacts(nextSubcontractor)[0];

    setSubcontractorId(nextSubcontractorId);
    setContactId(defaultContact?.id ?? "");
    setEmail(defaultContact?.email ?? "");
    setError("");
  }

  function handleContactChange(nextContactId: string) {
    const nextContact = contacts.find((contact) => contact.id === nextContactId);

    setContactId(nextContactId);
    setEmail(nextContact?.email ?? "");
    setError("");
  }

  function handleAddRecipient() {
    if (!subcontractor) {
      setError("Select a subcontractor.");
      return;
    }

    if (!hasContactOrEmail) {
      setError("Select a contact with email or enter a manual email.");
      return;
    }

    const now = new Date().toISOString();

    onAddRecipient({
      id: createInviteRecipientId(project.id, bidPackage.id),
      projectId: project.id,
      bidPackageId: bidPackage.id,
      subcontractorId: subcontractor.id,
      contactId: contactId || undefined,
      email: email.trim() || selectedContact?.email,
      selectedScopeItemIds: bidPackage.scopeItemIds,
      source: "MANUAL",
      status: "DRAFT",
      addedAt: now,
      updatedAt: now,
    });
    setError("");
  }

  return (
    <div className="project-setup-form-card" style={{ marginTop: 18 }}>
      <div className="project-setup-card-header">
        <div>
          <p className="label-text">Add Recipient</p>
          <p className="muted-text">
            Add a subcontractor/contact to this Bid Package only.
          </p>
        </div>
      </div>
      <div className="project-setup-form-grid">
        <label className="form-field">
          Subcontractor
          <select
            value={subcontractorId}
            onChange={(event) => handleSubcontractorChange(event.target.value)}
          >
            <option value="">Select subcontractor</option>
            {sortedSubcontractors.map((item) => (
              <option key={item.id} value={item.id}>
                {item.companyName}
              </option>
            ))}
          </select>
        </label>
        <label className="form-field">
          Contact
          <select
            value={contactId}
            onChange={(event) => handleContactChange(event.target.value)}
            disabled={!subcontractor}
          >
            <option value="">Manual email / company default</option>
            {contacts.map((contact) => (
              <option key={contact.id} value={contact.id}>
                {contact.name} {contact.email ? `- ${contact.email}` : "- no email"}
              </option>
            ))}
          </select>
        </label>
        <label className="form-field">
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setError("");
            }}
          />
        </label>
      </div>
      {subcontractor && contacts.length === 0 ? (
        <p className="muted-text">No active contacts with email are available.</p>
      ) : null}
      {error ? <p className="form-error">{error}</p> : null}
      <div className="settings-actions">
        <button type="button" className="button-secondary" onClick={handleAddRecipient}>
          Add Recipient
        </button>
      </div>
    </div>
  );
}

function RecipientRow({
  recipient,
  subcontractor,
  onSaveRecipient,
  onRemoveRecipient,
}: {
  recipient: ProjectInviteRecipient;
  subcontractor?: Subcontractor;
  onSaveRecipient: (recipient: ProjectInviteRecipient) => void;
  onRemoveRecipient: (recipient: ProjectInviteRecipient) => void;
}) {
  const contacts = getInviteEligibleContacts(subcontractor);
  const [contactId, setContactId] = useState(recipient.contactId ?? "");
  const [email, setEmail] = useState(recipient.email ?? "");
  const selectedContact = contacts.find((contact) => contact.id === contactId);

  function saveRecipient() {
    onSaveRecipient({
      ...recipient,
      contactId: contactId || undefined,
      email: email.trim() || selectedContact?.email,
    });
  }

  return (
    <tr>
      <td>{subcontractor?.companyName ?? recipient.subcontractorId}</td>
      <td>
        <div style={{ display: "grid", gap: 8 }}>
          <select
            value={contactId}
            onChange={(event) => {
              const nextContact = contacts.find(
                (contact) => contact.id === event.target.value
              );

              setContactId(event.target.value);
              if (nextContact?.email) setEmail(nextContact.email);
            }}
          >
            <option value="">Manual email / company default</option>
            {contacts.map((contact) => (
              <option key={contact.id} value={contact.id}>
                {contact.name} {contact.email ? `- ${contact.email}` : "- no email"}
              </option>
            ))}
          </select>
          <input
            type="email"
            value={email}
            placeholder="email@example.com"
            onChange={(event) => setEmail(event.target.value)}
          />
          {!selectedContact?.email && !email.trim() ? (
            <span className="badge badge-warning">No email</span>
          ) : null}
        </div>
      </td>
      <td>{recipient.matchLabel ?? recipient.matchType ?? "Manual"}</td>
      <td>
        <span className="badge badge-muted">{recipient.confidence ?? "LOW"}</span>
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
        <div className="settings-actions">
          <button type="button" className="button-secondary" onClick={saveRecipient}>
            Save
          </button>
          <button type="button" className="button-secondary" disabled>
            Send / Resend Recipient
          </button>
          <button
            type="button"
            className="button-danger"
            onClick={() => onRemoveRecipient(recipient)}
          >
            Remove
          </button>
        </div>
      </td>
    </tr>
  );
}

function isDraftRecipient(recipient: ProjectInviteRecipient) {
  return recipient.status !== "REMOVED" && !isPossibleRecipient(recipient);
}

function isPossibleRecipient(recipient: ProjectInviteRecipient) {
  return (
    recipient.status !== "REMOVED" &&
    (recipient.confidence === "LOW" || (recipient.coverageRatio ?? 1) < 0.5)
  );
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

function getInviteEligibleContacts(
  subcontractor: Subcontractor | undefined
): SubcontractorContact[] {
  if (!subcontractor) return [];

  return subcontractor.contacts.filter(
    (contact) => contact.active !== false && Boolean(contact.email?.trim())
  );
}

function createInviteRecipientId(projectId: string, bidPackageId: string) {
  const randomPart =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Date.now().toString();

  return `invite-recipient-${sanitizeIdPart(projectId)}-${sanitizeIdPart(
    bidPackageId
  )}-${randomPart}`;
}

function sanitizeIdPart(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "-");
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
