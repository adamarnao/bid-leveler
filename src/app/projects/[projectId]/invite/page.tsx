"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import Panel from "@/components/ui/Panel";
import {
  resolveCsiCatalogItem,
  resolveCsiSection,
} from "@/lib/csiCatalog";
import { getMergedProjects, projectsStorageKey } from "@/lib/projects";
import {
  getBadgeClassName,
  getComplianceAlerts,
  formatVendorStatus,
  getMergedSubcontractors,
  getVendorStatusTone,
  getPrimaryPhone,
  isPreferredVendor,
  subcontractorsStorageKey,
} from "@/lib/subcontractors";
import { matchSubcontractorsToProjectSections } from "@/lib/subcontractorMatching";
import {
  StoredProjectCsiSelection,
  StoredProjectCsiSelections,
} from "@/types/Csi";
import { Project } from "@/types/Project";
import { Subcontractor, SubcontractorContact } from "@/types/Subcontractor";
import { ProjectSectionSubcontractorMatch } from "@/types/SubcontractorMatching";

const projectCsiSelectionsStorageKey = "projectCsiSelections";
const projectDraftInviteSelectionsStorageKey = "projectDraftInviteSelections";
const EMPTY_PROJECT_CSI_SELECTIONS: StoredProjectCsiSelections = {};

type StoredProjectDraftInviteCandidate = {
  projectId: string;
  subcontractorId: string;
  projectSectionId?: string;
  projectSectionNumber: string;
  matchType: ProjectSectionSubcontractorMatch["matchType"];
  confidence: ProjectSectionSubcontractorMatch["confidence"];
  selectedAt: string;
};

type StoredProjectDraftInviteSelection = {
  projectId: string;
  updatedAt: string;
  candidates: StoredProjectDraftInviteCandidate[];
};

type StoredProjectDraftInviteSelections = Record<
  string,
  StoredProjectDraftInviteSelection
>;

type InviteStatusLabel =
  | "Prequalified"
  | "Not Started"
  | "In Progress"
  | "Conditional"
  | "Expired"
  | "Rejected"
  | "Do Not Use";

type InviteSortKey = "company" | "vpi" | "serviceArea";
type SortDirection = "asc" | "desc";

export default function ProjectInvitePreviewPage() {
  const params = useParams();
  const rawProjectId = params.projectId;
  const projectId = Array.isArray(rawProjectId) ? rawProjectId[0] : rawProjectId;
  const projects = useProjectsSnapshot();
  const project = projects.find((item) => item.id === projectId);
  const storedSelections = useProjectCsiSelectionsSnapshot();
  const subcontractorsSnapshot = useSubcontractorsSnapshot();
  const subcontractors = useMemo(
    () =>
      subcontractorsSnapshot.filter((subcontractor) => !subcontractor.archived),
    [subcontractorsSnapshot]
  );
  const selectedSectionIds = useMemo(
    () =>
      project ? validateProjectSelection(storedSelections[project.id], project) : [],
    [project, storedSelections]
  );
  const matchGroups = useMemo(
    () =>
      project
        ? matchSubcontractorsToProjectSections({
            projectId: project.id,
            projectCsiVersion: project.csiVersion,
            selectedProjectSections: selectedSectionIds,
            subcontractors,
            options: {
              projectLocation: {
                city: project.city,
                state: project.state,
              },
            },
          })
        : [],
    [project, selectedSectionIds, subcontractors]
  );
  const visibleCandidatesByKey = useMemo(
    () => buildVisibleCandidateMap(matchGroups),
    [matchGroups]
  );
  const [selectedCandidatesByKey, setSelectedCandidatesByKey] = useState<
    Record<string, StoredProjectDraftInviteCandidate>
  >({});
  const [sortKey, setSortKey] = useState<InviteSortKey>("company");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [saveMessage, setSaveMessage] = useState("");
  const selectedCandidateCount = Object.keys(selectedCandidatesByKey).length;

  useEffect(() => {
    let isActive = true;

    if (!project) {
      queueMicrotask(() => {
        if (isActive) setSelectedCandidatesByKey({});
      });

      return () => {
        isActive = false;
      };
    }

    queueMicrotask(() => {
      if (!isActive) return;

      setSelectedCandidatesByKey(
        validateStoredDraftCandidates(project.id, visibleCandidatesByKey)
      );
    });

    return () => {
      isActive = false;
    };
  }, [project, visibleCandidatesByKey]);

  function toggleCandidate(
    match: ProjectSectionSubcontractorMatch,
    checked: boolean
  ) {
    const candidate = matchToStoredCandidate(match);
    const candidateKey = getCandidateKey(candidate);

    setSaveMessage("");
    setSelectedCandidatesByKey((currentCandidates) => {
      if (!checked) {
        const nextCandidates = { ...currentCandidates };
        delete nextCandidates[candidateKey];
        return nextCandidates;
      }

      return {
        ...currentCandidates,
        [candidateKey]: currentCandidates[candidateKey] ?? candidate,
      };
    });
  }

  function saveDraftInviteList() {
    if (!project) return;

    saveProjectDraftInviteSelection(project.id, {
      projectId: project.id,
      updatedAt: new Date().toISOString(),
      candidates: Object.values(selectedCandidatesByKey),
    });
    setSaveMessage("Draft invite list saved.");
  }

  function clearSelections() {
    if (!project) return;

    setSelectedCandidatesByKey({});
    removeProjectDraftInviteSelection(project.id);
    setSaveMessage("Draft invite selections cleared.");
  }

  function updateSort(nextSortKey: InviteSortKey) {
    if (nextSortKey === sortKey) {
      setSortDirection((currentDirection) =>
        currentDirection === "asc" ? "desc" : "asc"
      );
      return;
    }

    setSortKey(nextSortKey);
    setSortDirection(getDefaultSortDirection(nextSortKey));
  }

  if (!project) {
    return (
      <AppShell title="Project Not Found">
        <p>Requested project ID: {projectId}</p>
        <Link href="/">Back to Dashboard</Link>
      </AppShell>
    );
  }

  return (
    <AppShell title={`${project.name} - Invite Preview`}>
      <div className="command-center">
        <Link href={`/projects/${project.id}`}>{"<-"} Back to Command Center</Link>

        <Panel title="Invite Preview">
          <p className="muted-text">
            This is a read-only preview of matching subcontractors. No invites
            have been sent and no invite records have been created.
          </p>
          <table className="compact-table" style={{ marginTop: 12 }}>
            <tbody>
              <tr>
                <th className="compact-cell">Project</th>
                <td className="compact-cell">{project.name}</td>
              </tr>
              <tr>
                <th className="compact-cell">Location</th>
                <td className="compact-cell">
                  {[project.city, project.state].filter(Boolean).join(", ")}
                </td>
              </tr>
              <tr>
                <th className="compact-cell">CSI Version</th>
                <td className="compact-cell">{project.csiVersion}</td>
              </tr>
              <tr>
                <th className="compact-cell">Selected Sections</th>
                <td className="compact-cell">{selectedSectionIds.length}</td>
              </tr>
              <tr>
                <th className="compact-cell">Draft Invite Candidates</th>
                <td className="compact-cell">{selectedCandidateCount}</td>
              </tr>
            </tbody>
          </table>
          <div className="settings-actions">
            <button
              type="button"
              className="button-primary"
              onClick={saveDraftInviteList}
            >
              Save Draft Invite List
            </button>
            <button
              type="button"
              className="button-secondary"
              onClick={clearSelections}
            >
              Clear Selections
            </button>
            {saveMessage && (
              <span className="save-confirmation">{saveMessage}</span>
            )}
          </div>
        </Panel>

        {selectedSectionIds.length === 0 ? (
          <Panel title="No CSI Sections Selected">
            <p className="muted-text">
              Select project CSI sections before previewing invite candidates.
            </p>
            <p style={{ marginTop: 12 }}>
              <Link href={`/projects/${project.id}/setup`}>
                Go to Project Setup
              </Link>
            </p>
          </Panel>
        ) : (
          matchGroups.map((group) => {
            const exactMatches = group.matches.filter(
              (match) => match.matchType !== "DIVISION_ONLY"
            );

            return (
              <Panel
                key={group.projectSectionId ?? group.projectSectionNumber}
                title={`${group.projectSectionNumber} - ${
                  group.projectSectionName ?? "Selected Section"
                }`}
              >
                <p className="muted-text">
                  {exactMatches.length} exact section matches found.
                </p>

                {exactMatches.length === 0 ? (
                  <p style={{ marginTop: 12 }}>No exact section matches.</p>
                ) : (
                  <MatchTable
                    matches={exactMatches}
                    sectionNumber={group.projectSectionNumber}
                    sortKey={sortKey}
                    sortDirection={sortDirection}
                    onSortChange={updateSort}
                    selectedCandidatesByKey={selectedCandidatesByKey}
                    onToggleCandidate={toggleCandidate}
                  />
                )}
              </Panel>
            );
          })
        )}
      </div>
    </AppShell>
  );
}

function MatchTable({
  matches,
  sectionNumber,
  sortKey,
  sortDirection,
  onSortChange,
  selectedCandidatesByKey,
  onToggleCandidate,
}: {
  matches: ProjectSectionSubcontractorMatch[];
  sectionNumber: string;
  sortKey: InviteSortKey;
  sortDirection: SortDirection;
  onSortChange: (sortKey: InviteSortKey) => void;
  selectedCandidatesByKey: Record<string, StoredProjectDraftInviteCandidate>;
  onToggleCandidate: (
    match: ProjectSectionSubcontractorMatch,
    checked: boolean
  ) => void;
}) {
  const sortedMatches = useMemo(
    () => sortInviteMatches(matches, sortKey, sortDirection),
    [matches, sortDirection, sortKey]
  );

  return (
    <div className="invite-table-scroll">
      <table className="crm-vendor-table invite-preview-table">
        <colgroup>
          <col className="invite-col-select" />
          <col className="invite-col-subcontractor" />
          <col className="invite-col-status" />
          <col className="invite-col-vpi" />
          <col className="invite-col-contacts" />
          <col className="invite-col-scope" />
          <col className="invite-col-service-area" />
          <col className="invite-col-warnings" />
          <col className="invite-col-actions" />
        </colgroup>
        <thead>
          <tr>
            <th style={cell}>Select</th>
            <SortableHeaderCell
              label="Subcontractor"
              sortKey="company"
              activeSortKey={sortKey}
              sortDirection={sortDirection}
              onSortChange={onSortChange}
            />
            <th style={cell}>Status</th>
            <SortableHeaderCell
              label="VPI"
              sortKey="vpi"
              activeSortKey={sortKey}
              sortDirection={sortDirection}
              onSortChange={onSortChange}
            />
            <th style={cell}>Contacts</th>
            <th style={cell}>Scope Notes</th>
            <SortableHeaderCell
              label="Service Area"
              sortKey="serviceArea"
              activeSortKey={sortKey}
              sortDirection={sortDirection}
              onSortChange={onSortChange}
            />
            <th style={cell}>Warnings</th>
            <th style={cell}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedMatches.map((match) => (
            <MatchRow
              key={`${sectionNumber}-${match.matchType}-${match.subcontractor.id}`}
              match={match}
              selected={Boolean(
                selectedCandidatesByKey[getCandidateKeyFromMatch(match)]
              )}
              onToggleCandidate={onToggleCandidate}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SortableHeaderCell({
  label,
  sortKey,
  activeSortKey,
  sortDirection,
  onSortChange,
}: {
  label: string;
  sortKey: InviteSortKey;
  activeSortKey: InviteSortKey;
  sortDirection: SortDirection;
  onSortChange: (sortKey: InviteSortKey) => void;
}) {
  const isActive = activeSortKey === sortKey;

  return (
    <th
      style={cell}
      className="invite-sortable-header"
      role="button"
      tabIndex={0}
      aria-label={`Sort by ${label}`}
      aria-pressed={isActive}
      onClick={() => onSortChange(sortKey)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSortChange(sortKey);
        }
      }}
    >
      <span className="invite-sortable-header-content">
        <span>{label}</span>
        {isActive && (
          <span className="table-sort-label">
            {getSortDirectionLabel(sortKey, sortDirection)}
          </span>
        )}
      </span>
    </th>
  );
}

function MatchRow({
  match,
  selected,
  onToggleCandidate,
}: {
  match: ProjectSectionSubcontractorMatch;
  selected: boolean;
  onToggleCandidate: (
    match: ProjectSectionSubcontractorMatch,
    checked: boolean
  ) => void;
}) {
  const subcontractor = match.subcontractor;
  const inviteContacts = getInviteContacts(subcontractor);
  const inviteStatus = getInviteStatus(match);
  const warnings = getInviteWarnings(match);

  return (
    <tr
      data-subcontractor-id={subcontractor.id}
      data-section-number={match.projectSectionNumber}
    >
      <td style={cell}>
        <input
          type="checkbox"
          checked={selected}
          aria-label={`Select ${subcontractor.companyName} for ${match.projectSectionNumber}`}
          onChange={(event) => onToggleCandidate(match, event.target.checked)}
        />
      </td>
      <td style={cell}>
        <strong>{subcontractor.companyName}</strong>
        {isPreferredVendor(subcontractor) && (
          <span className="badge badge-primary">Preferred</span>
        )}
        {subcontractor.dba && (
          <div className="muted-text">DBA: {subcontractor.dba}</div>
        )}
      </td>
      <td style={cell}>
        <span className={getBadgeClassName(inviteStatus.tone)}>
          {inviteStatus.label}
        </span>
      </td>
      <td style={cell}>{formatVpi(subcontractor)}</td>
      <td style={cell}>
        {inviteContacts.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {inviteContacts.map((contact) => {
              const invitePhone = getPrimaryPhone(contact, subcontractor);

              return (
                <div key={contact.id} className="invite-contact-cell">
                  <div>
                    <strong>{contact.name}</strong>
                    <div className="muted-text">
                      {getContactDisplayLabel(contact)}
                    </div>
                  </div>
                  <div className="invite-contact-methods">
                    <span>{contact.email}</span>
                    <span className="muted-text">
                      {invitePhone
                        ? `${invitePhone.label}: ${invitePhone.value}`
                        : "No phone"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          "No invite contacts"
        )}
      </td>
      <td style={cell}>
        {subcontractor.csiCoverage.specialtyScopeNotes ||
          subcontractor.notes ||
          "No scope notes"}
      </td>
      <td style={cell}>
        <span className={getBadgeClassName(getServiceAreaTone(match.serviceAreaFit))}>
          {formatServiceAreaFit(match.serviceAreaFit)}
        </span>
      </td>
      <td style={cell}>
        <div className="invite-warning-list">
          {warnings.length === 0 ? (
            <span className="badge badge-success">No warnings</span>
          ) : (
            warnings.map((warning) => (
              <span key={warning} className="badge badge-warning">
                {warning}
              </span>
            ))
          )}
        </div>
      </td>
      <td style={cell}>
        <div className="badge-list">
          <Link href={`/subcontractors/${subcontractor.id}`}>View Profile</Link>
          <Link href={`/subcontractors/${subcontractor.id}/edit`}>Edit</Link>
        </div>
      </td>
    </tr>
  );
}

function getInviteContacts(subcontractor: Subcontractor): SubcontractorContact[] {
  const activeContactsWithEmail = subcontractor.contacts.filter(
    (contact) => contact.active !== false && Boolean(contact.email?.trim())
  );
  const defaultInviteContacts = activeContactsWithEmail.filter(
    (contact) => contact.isDefaultInviteRecipient
  );

  if (defaultInviteContacts.length > 0) return defaultInviteContacts;

  const primaryContact = activeContactsWithEmail.find((contact) => contact.isPrimary);
  if (primaryContact) return [primaryContact];

  const estimatorContacts = activeContactsWithEmail.filter(
    (contact) => contact.role === "ESTIMATOR"
  );
  if (estimatorContacts.length > 0) return estimatorContacts;

  return activeContactsWithEmail;
}

function getInviteStatus(match: ProjectSectionSubcontractorMatch): {
  label: InviteStatusLabel;
  tone: "primary" | "secondary" | "success" | "warning" | "danger" | "muted";
} {
  const subcontractor = match.subcontractor;

  if (subcontractor.relationshipStatus === "DO_NOT_USE") {
    return { label: "Do Not Use", tone: "danger" };
  }

  return {
    label: formatVendorStatus(subcontractor.prequalification.status) as InviteStatusLabel,
    tone: getVendorStatusTone(subcontractor.prequalification.status),
  };
}

function getInviteWarnings(match: ProjectSectionSubcontractorMatch) {
  const subcontractor = match.subcontractor;
  const warnings = new Set<string>(getComplianceAlerts(subcontractor));

  if (getInviteContacts(subcontractor).length === 0) {
    warnings.add("No invite email");
  }
  if (match.confidence === "AMBIGUOUS_CROSSWALK") {
    warnings.add("CSI crosswalk needs review");
  }
  if (match.confidence === "INCOMPLETE_CROSSWALK") {
    warnings.add("Incomplete CSI crosswalk");
  }

  return Array.from(warnings);
}

function sortInviteMatches(
  matches: ProjectSectionSubcontractorMatch[],
  sortKey: InviteSortKey,
  sortDirection: SortDirection
) {
  return [...matches].sort((matchA, matchB) => {
    const tierDifference = getInvitePriorityTier(matchA) - getInvitePriorityTier(matchB);
    if (tierDifference !== 0) return tierDifference;

    const sortDifference = compareWithinPriorityTier(
      matchA,
      matchB,
      sortKey,
      sortDirection
    );
    if (sortDifference !== 0) return sortDifference;

    return compareCompanyName(matchA, matchB);
  });
}

function getDefaultSortDirection(sortKey: InviteSortKey): SortDirection {
  if (sortKey === "vpi") return "desc";

  return "asc";
}

function getSortDirectionLabel(
  sortKey: InviteSortKey,
  sortDirection: SortDirection
) {
  if (sortKey === "company") {
    return sortDirection === "asc" ? "A-Z" : "Z-A";
  }

  if (sortKey === "vpi") {
    return sortDirection === "desc" ? "High" : "Low";
  }

  return sortDirection === "asc" ? "▲" : "▼";
}

function getInvitePriorityTier(match: ProjectSectionSubcontractorMatch) {
  if (isPreferredVendor(match.subcontractor)) return 0;
  if (match.subcontractor.prequalification.status === "QUALIFIED") return 1;

  return 2;
}

function compareWithinPriorityTier(
  matchA: ProjectSectionSubcontractorMatch,
  matchB: ProjectSectionSubcontractorMatch,
  sortKey: InviteSortKey,
  sortDirection: SortDirection
) {
  if (sortKey === "vpi") {
    return compareVpi(matchA, matchB, sortDirection);
  }

  if (sortKey === "serviceArea") {
    return compareServiceArea(matchA, matchB) * getSortDirectionMultiplier(sortDirection);
  }

  return compareCompanyName(matchA, matchB) * getSortDirectionMultiplier(sortDirection);
}

function getSortDirectionMultiplier(sortDirection: SortDirection) {
  return sortDirection === "asc" ? 1 : -1;
}

function compareCompanyName(
  matchA: ProjectSectionSubcontractorMatch,
  matchB: ProjectSectionSubcontractorMatch
) {
  return matchA.subcontractor.companyName.localeCompare(
    matchB.subcontractor.companyName
  );
}

function compareVpi(
  matchA: ProjectSectionSubcontractorMatch,
  matchB: ProjectSectionSubcontractorMatch,
  sortDirection: SortDirection
) {
  const vpiA = matchA.subcontractor.vpi.overall;
  const vpiB = matchB.subcontractor.vpi.overall;

  if (vpiA === undefined && vpiB === undefined) return 0;
  if (vpiA === undefined) return 1;
  if (vpiB === undefined) return -1;

  return sortDirection === "asc" ? vpiA - vpiB : vpiB - vpiA;
}

function compareServiceArea(
  matchA: ProjectSectionSubcontractorMatch,
  matchB: ProjectSectionSubcontractorMatch
) {
  return (
    getServiceAreaSortRank(matchA.serviceAreaFit) -
    getServiceAreaSortRank(matchB.serviceAreaFit)
  );
}

function getContactDisplayLabel(contact: SubcontractorContact) {
  return contact.title?.trim() || formatStatus(contact.role);
}

function getServiceAreaTone(
  serviceAreaFit: ProjectSectionSubcontractorMatch["serviceAreaFit"]
) {
  if (serviceAreaFit === "STRONG") return "success";
  if (serviceAreaFit === "PARTIAL") return "warning";
  if (serviceAreaFit === "OUTSIDE_AREA") return "danger";

  return "muted";
}

function formatServiceAreaFit(
  serviceAreaFit: ProjectSectionSubcontractorMatch["serviceAreaFit"]
) {
  if (serviceAreaFit === "STRONG") return "In Area";
  if (serviceAreaFit === "OUTSIDE_AREA") return "Outside Area";
  if (serviceAreaFit === "PARTIAL") return "Review";

  return "Unknown";
}

function getServiceAreaSortRank(
  serviceAreaFit: ProjectSectionSubcontractorMatch["serviceAreaFit"]
) {
  if (serviceAreaFit === "STRONG") return 0;
  if (serviceAreaFit === "PARTIAL") return 1;
  if (serviceAreaFit === "UNKNOWN") return 2;

  return 3;
}

function buildVisibleCandidateMap(
  matchGroups: ReturnType<typeof matchSubcontractorsToProjectSections>
) {
  const candidatesByKey = new Map<string, StoredProjectDraftInviteCandidate>();

  matchGroups.forEach((group) => {
    group.matches.forEach((match) => {
      if (match.matchType === "DIVISION_ONLY") return;

      const candidate = matchToStoredCandidate(match);
      candidatesByKey.set(getCandidateKey(candidate), candidate);
    });
  });

  return candidatesByKey;
}

function validateStoredDraftCandidates(
  projectId: string,
  visibleCandidatesByKey: Map<string, StoredProjectDraftInviteCandidate>
) {
  const storedDraftSelections = readStoredDraftInviteSelections();
  const storedProjectDraft = storedDraftSelections[projectId];
  const selectedCandidates: Record<string, StoredProjectDraftInviteCandidate> = {};

  storedProjectDraft?.candidates.forEach((candidate) => {
    const candidateKey = getCandidateKey(candidate);
    const visibleCandidate = visibleCandidatesByKey.get(candidateKey);

    if (!visibleCandidate) return;

    selectedCandidates[candidateKey] = {
      ...visibleCandidate,
      selectedAt: candidate.selectedAt,
    };
  });

  return selectedCandidates;
}

function matchToStoredCandidate(
  match: ProjectSectionSubcontractorMatch
): StoredProjectDraftInviteCandidate {
  return {
    projectId: match.projectId,
    subcontractorId: match.subcontractor.id,
    projectSectionId: match.projectSectionId,
    projectSectionNumber: match.projectSectionNumber,
    matchType: match.matchType,
    confidence: match.confidence,
    selectedAt: new Date().toISOString(),
  };
}

function getCandidateKeyFromMatch(match: ProjectSectionSubcontractorMatch) {
  return getCandidateKey(matchToStoredCandidate(match));
}

function getCandidateKey(candidate: StoredProjectDraftInviteCandidate) {
  return [
    candidate.projectId,
    candidate.projectSectionNumber,
    candidate.subcontractorId,
    candidate.matchType,
  ].join(":");
}

function readStoredDraftInviteSelections(): StoredProjectDraftInviteSelections {
  if (typeof window === "undefined") return {};

  try {
    const storedValue = localStorage.getItem(projectDraftInviteSelectionsStorageKey);
    const parsedValue = storedValue ? JSON.parse(storedValue) : {};

    return parsedValue && typeof parsedValue === "object" && !Array.isArray(parsedValue)
      ? parsedValue
      : {};
  } catch {
    return {};
  }
}

function saveProjectDraftInviteSelection(
  projectId: string,
  selection: StoredProjectDraftInviteSelection
) {
  const storedDraftSelections = readStoredDraftInviteSelections();

  localStorage.setItem(
    projectDraftInviteSelectionsStorageKey,
    JSON.stringify({
      ...storedDraftSelections,
      [projectId]: selection,
    })
  );
}

function removeProjectDraftInviteSelection(projectId: string) {
  const storedDraftSelections = readStoredDraftInviteSelections();
  delete storedDraftSelections[projectId];

  localStorage.setItem(
    projectDraftInviteSelectionsStorageKey,
    JSON.stringify(storedDraftSelections)
  );
}

function validateProjectSelection(
  selection: StoredProjectCsiSelection | undefined,
  project: Project
) {
  if (!selection || selection.version !== project.csiVersion) return [];

  return selection.sectionIds
    .filter((sectionId) => resolveProjectSelectionItem(sectionId, project))
    .sort((sectionIdA, sectionIdB) => {
      const sectionA = resolveProjectSelectionItem(sectionIdA, project);
      const sectionB = resolveProjectSelectionItem(sectionIdB, project);

      return (sectionA?.number ?? sectionIdA).localeCompare(
        sectionB?.number ?? sectionIdB,
        undefined,
        { numeric: true }
      );
    });
}

function resolveProjectSelectionItem(sectionId: string, project: Project) {
  return (
    resolveCsiSection(project.csiVersion, sectionId) ??
    resolveCsiCatalogItem(project.csiVersion, sectionId)
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

let cachedSubcontractorsStorageValue: string | undefined;
let cachedSubcontractors: Subcontractor[] = getMergedSubcontractors();

function useSubcontractorsSnapshot(): Subcontractor[] {
  return useSyncExternalStore(
    subscribeToSubcontractorStorage,
    getSubcontractorsSnapshot,
    getServerSubcontractorsSnapshot
  );
}

function subscribeToSubcontractorStorage(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
  };
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

let cachedSelectionsStorageValue: string | undefined;
let cachedSelections: StoredProjectCsiSelections = EMPTY_PROJECT_CSI_SELECTIONS;

function useProjectCsiSelectionsSnapshot(): StoredProjectCsiSelections {
  return useSyncExternalStore(
    subscribeToProjectCsiSelectionsStorage,
    getProjectCsiSelectionsSnapshot,
    getServerProjectCsiSelectionsSnapshot
  );
}

function subscribeToProjectCsiSelectionsStorage(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
  };
}

function getServerProjectCsiSelectionsSnapshot(): StoredProjectCsiSelections {
  return EMPTY_PROJECT_CSI_SELECTIONS;
}

function getProjectCsiSelectionsSnapshot(): StoredProjectCsiSelections {
  const storageValue =
    localStorage.getItem(projectCsiSelectionsStorageKey) || "{}";

  if (storageValue !== cachedSelectionsStorageValue) {
    cachedSelectionsStorageValue = storageValue;
    cachedSelections = parseStoredSelections(storageValue);
  }

  return cachedSelections;
}

function parseStoredSelections(storageValue: string): StoredProjectCsiSelections {
  try {
    const parsed = JSON.parse(storageValue);

    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed
      : EMPTY_PROJECT_CSI_SELECTIONS;
  } catch {
    return EMPTY_PROJECT_CSI_SELECTIONS;
  }
}

function formatVpi(subcontractor: Subcontractor) {
  const score = subcontractor.vpi.overall;
  const projectsText =
    subcontractor.vpi.projectsEvaluated === 1 ? "project" : "projects";

  return (
    <div className="invite-vpi">
      <strong>{score === undefined ? "Not rated" : `${score.toFixed(1)} / 5`}</strong>
      <span className="muted-text">
        {subcontractor.vpi.projectsEvaluated} {projectsText}
      </span>
    </div>
  );
}

function formatStatus(value: string) {
  return value
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

const cell: React.CSSProperties = {
  border: "1px solid var(--color-border)",
  padding: "8px",
  textAlign: "left",
  verticalAlign: "top",
};
