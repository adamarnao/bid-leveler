"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CsiCodeLabel, CsiHierarchyPath, CsiLevelBadge } from "@/components/csi";
import AppShell from "@/components/layout/AppShell";
import { mockBidSubmissions } from "@/data/mockBidSubmissions";
import { mockSectionCosts } from "@/data/mockSectionCosts";
import { getNearestLevel2Ancestor } from "@/lib/csiCatalog";
import { getMergedProjects, projectsStorageKey } from "@/lib/projects";
import {
  getProjectCsiSectionsByDivision,
  projectCsiIdsReferToSameItem,
  resolveProjectCsiDivision,
  resolveProjectCsiItem,
  validateProjectCsiSelection,
} from "@/lib/projectCsiSelections";
import { BidSubmission } from "@/types/BidSubmission";
import {
  CsiCatalogItem,
  CsiSection,
  StoredProjectCsiSelections,
} from "@/types/Csi";
import { Project } from "@/types/Project";

const selectionStorageKey = "projectCsiSelections";
const selectionChangeEvent = "projectCsiSelectionsChange";
const EMPTY_PROJECT_CSI_SELECTIONS: StoredProjectCsiSelections = {};

export default function DivisionPage() {
  const params = useParams();
  const rawProjectId = params.projectId;
  const rawDivisionId = params.divisionId;
  const projectId = Array.isArray(rawProjectId) ? rawProjectId[0] : rawProjectId;
  const divisionId = Array.isArray(rawDivisionId)
    ? rawDivisionId[0]
    : rawDivisionId;
  const projects = useProjectsSnapshot();
  const csiSelections = useProjectCsiSelectionsSnapshot();
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

  const division = divisionId
    ? resolveProjectCsiDivision(project.csiVersion, divisionId)
    : undefined;

  if (!division) {
    return (
      <AppShell title="CSI Scope Detail">
        <h1>Division Not Found</h1>
        <p>Requested Division ID: {divisionId}</p>
        <Link href={`/projects/${project.id}`}>Back to Project Dashboard</Link>
      </AppShell>
    );
  }

  const csiSelection = validateProjectCsiSelection(
    csiSelections[project.id],
    project.csiVersion
  );
  const hasSavedCsiSelection = csiSelections[project.id] !== undefined;
  const allScopes = getProjectCsiSectionsByDivision(
    project.csiVersion,
    division.id,
    csiSelection.sectionIds
  );
  const scopes = hasSavedCsiSelection
    ? allScopes.filter((scope) =>
        csiSelection.sectionIds.some((sectionId) =>
          projectCsiIdsReferToSameItem(project.csiVersion, sectionId, scope.id)
        )
      )
    : allScopes;
  const broadDivisionSelected = csiSelection.divisionIds.includes(division.id);
  const divisionItem = resolveProjectCsiItem(project.csiVersion, division.id);
  const groups = groupDivisionScopes(project.id, project.csiVersion, scopes);

  return (
    <AppShell title="Project CSI Scope Detail">
      <Link href={`/projects/${project.id}`}>{"<-"} Back to Project Dashboard</Link>

      <section style={panel}>
        <div style={pageHeader}>
          <div>
            <p className="muted-text">Division</p>
            <h1 style={{ marginTop: 4 }}>
              {divisionItem ? (
                <CsiCodeLabel item={divisionItem} showLevelBadge />
              ) : (
                `${division.number} - ${division.name}`
              )}
            </h1>
          </div>
          {broadDivisionSelected ? (
            <span className="badge badge-primary">Division Selected</span>
          ) : null}
        </div>
      </section>

      {groups.length === 0 ? (
        <section style={panel}>
          <p className="muted-text">No CSI scopes or bid rows for this Division.</p>
        </section>
      ) : (
        groups.map((group) => (
          <SubdivisionBidGroup key={group.key} group={group} />
        ))
      )}
    </AppShell>
  );
}

function SubdivisionBidGroup({ group }: { group: SubdivisionGroup }) {
  const estimate = getEstimateTotals(group.scopeItems);
  const bidTotal = group.bids.reduce((sum, bid) => sum + bid.amount, 0);
  const selectedBidTotal = group.bids.reduce(
    (sum, bid) => sum + (bid.isSelected ? bid.amount : 0),
    0
  );

  return (
    <section style={panel}>
      <div style={groupHeader}>
        <div>
          {group.subdivision ? (
            <CsiCodeLabel item={group.subdivision} showLevelBadge />
          ) : (
            <h2 style={{ margin: 0 }}>Ungrouped CSI scopes</h2>
          )}
          {group.subdivision ? (
            <div style={{ marginTop: 6 }}>
              <CsiHierarchyPath item={group.subdivision} />
            </div>
          ) : null}
        </div>
        <div className="badge-list">
          <span className="badge badge-muted">
            Estimate ${estimate.selectedCost.toLocaleString()}
          </span>
          <span className="badge badge-muted">
            Low Bid ${estimate.lowBid.toLocaleString()}
          </span>
          <span className="badge badge-muted">
            Bid Total ${bidTotal.toLocaleString()}
          </span>
          <span className="badge badge-muted">
            Selected Bids ${selectedBidTotal.toLocaleString()}
          </span>
        </div>
      </div>

      {group.detailItems.length > 0 ? (
        <div style={detailSection}>
          <p className="muted-text">Section and Subsection detail</p>
          <div className="badge-list">
            {group.detailItems.map((item) => (
              <span key={item.id} className="badge badge-muted">
                <span style={detailTagContent}>
                  <CsiCodeLabel item={item} />
                  <CsiHierarchyPath item={item} />
                </span>
                <CsiLevelBadge item={item} />
              </span>
            ))}
          </div>
        </div>
      ) : (
        <p className="muted-text">
          No Section or Subsection detail CSI scopes selected.
        </p>
      )}

      {group.bids.length === 0 ? (
        <p>No bids received for this Subdivision.</p>
      ) : (
        <table style={{ borderCollapse: "collapse", minWidth: 1000 }}>
          <thead>
            <tr>
              <th style={cell}>Selected</th>
              <th style={cell}>Subcontractor</th>
              <th style={cell}>CSI scope</th>
              <th style={cell}>Amount</th>
              <th style={cell}>Inclusions</th>
              <th style={cell}>Exclusions</th>
              <th style={cell}>Clarifications</th>
            </tr>
          </thead>

          <tbody>
            {group.bids.map((bid) => {
              const bidScope = resolveProjectCsiItem(
                group.version,
                bid.sectionId
              );

              return (
                <tr key={bid.id}>
                  <td style={cell}>{bid.isSelected ? "Yes" : ""}</td>
                  <td style={cell}>{bid.subcontractorName}</td>
                  <td style={cell}>
                    {bidScope ? (
                      <div style={bidScopeCell}>
                        <CsiCodeLabel item={bidScope} showLevelBadge />
                        <CsiHierarchyPath item={bidScope} />
                      </div>
                    ) : (
                      bid.sectionId
                    )}
                  </td>
                  <td style={cell}>${bid.amount.toLocaleString()}</td>
                  <td style={cell}>{bid.inclusions}</td>
                  <td style={cell}>{bid.exclusions}</td>
                  <td style={cell}>{bid.clarifications}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </section>
  );
}

type SubdivisionGroup = {
  key: string;
  version: Project["csiVersion"];
  subdivision?: CsiCatalogItem;
  scopeItems: CsiCatalogItem[];
  detailItems: CsiCatalogItem[];
  bids: BidSubmission[];
};

function groupDivisionScopes(
  projectId: string,
  version: Project["csiVersion"],
  scopes: CsiSection[]
): SubdivisionGroup[] {
  const groupsByKey = new Map<string, SubdivisionGroup>();
  const scopeItems = scopes
    .map((scope) => resolveProjectCsiItem(version, scope.id))
    .filter(isDefined)
    .filter((item) => item.level > 1);

  scopeItems.forEach((item) => {
    const subdivision =
      item.level === 2 ? item : getNearestLevel2Ancestor(version, item.id);
    const key = subdivision?.id ?? `ungrouped-${item.divisionId}`;
    const group =
      groupsByKey.get(key) ??
      {
        key,
        version,
        subdivision,
        scopeItems: [],
        detailItems: [],
        bids: [],
      };

    group.scopeItems.push(item);
    if (item.level > 2) group.detailItems.push(item);
    groupsByKey.set(key, group);
  });

  mockBidSubmissions
    .filter((bid) => bid.projectId === projectId)
    .forEach((bid) => {
      const bidScope = resolveProjectCsiItem(version, bid.sectionId);
      if (!bidScope) return;

      const subdivision =
        bidScope.level === 2
          ? bidScope
          : getNearestLevel2Ancestor(version, bidScope.id);
      const key = subdivision?.id ?? `ungrouped-${bidScope.divisionId}`;
      const group = groupsByKey.get(key);

      if (group && bidBelongsToGroup(version, bid, group)) {
        group.bids.push(bid);
      }
    });

  groupsByKey.forEach((group) => {
    group.scopeItems = uniqueCsiItems(group.scopeItems).sort(compareCsiItems);
    group.detailItems = uniqueCsiItems(group.detailItems).sort(compareCsiItems);
    group.bids.sort(compareBids);
  });

  return Array.from(groupsByKey.values()).sort(compareGroups);
}

function bidBelongsToGroup(
  version: Project["csiVersion"],
  bid: BidSubmission,
  group: SubdivisionGroup
) {
  if (
    group.scopeItems.some((item) =>
      projectCsiIdsReferToSameItem(version, bid.sectionId, item.id)
    )
  ) {
    return true;
  }

  const bidScope = resolveProjectCsiItem(version, bid.sectionId);
  const bidSubdivision =
    bidScope &&
    (bidScope.level === 2
      ? bidScope
      : getNearestLevel2Ancestor(version, bidScope.id));

  return Boolean(
    bidSubdivision &&
      group.subdivision &&
      bidSubdivision.id === group.subdivision.id
  );
}

function getEstimateTotals(items: CsiCatalogItem[]) {
  return items.reduce(
    (totals, item) => {
      const cost = mockSectionCosts.find((sectionCost) =>
        projectCsiIdsReferToSameItem(item.version, sectionCost.sectionId, item.id)
      );

      return {
        budget: totals.budget + (cost?.budget ?? 0),
        lowBid: totals.lowBid + (cost?.lowBid ?? 0),
        selectedCost: totals.selectedCost + (cost?.selectedCost ?? 0),
      };
    },
    { budget: 0, lowBid: 0, selectedCost: 0 }
  );
}

function uniqueCsiItems(items: CsiCatalogItem[]) {
  return Array.from(new Map(items.map((item) => [item.id, item])).values());
}

function compareGroups(groupA: SubdivisionGroup, groupB: SubdivisionGroup) {
  const subdivisionA = groupA.subdivision;
  const subdivisionB = groupB.subdivision;

  if (!subdivisionA && !subdivisionB) return groupA.key.localeCompare(groupB.key);
  if (!subdivisionA) return 1;
  if (!subdivisionB) return -1;

  return compareCsiItems(subdivisionA, subdivisionB);
}

function compareCsiItems(itemA: CsiCatalogItem, itemB: CsiCatalogItem) {
  return (
    itemA.sortOrder - itemB.sortOrder ||
    itemA.number.localeCompare(itemB.number, undefined, { numeric: true })
  );
}

function compareBids(bidA: BidSubmission, bidB: BidSubmission) {
  return (
    bidA.sectionId.localeCompare(bidB.sectionId, undefined, { numeric: true }) ||
    bidA.amount - bidB.amount ||
    bidA.subcontractorName.localeCompare(bidB.subcontractorName)
  );
}

const panel: React.CSSProperties = {
  border: "1px solid #555",
  padding: 16,
  marginTop: 24,
  borderRadius: 8,
};

const cell: React.CSSProperties = {
  border: "1px solid #555",
  padding: "8px",
  verticalAlign: "top",
};

const pageHeader: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 16,
  alignItems: "flex-start",
};

const groupHeader: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 16,
  alignItems: "flex-start",
};

const detailSection: React.CSSProperties = {
  display: "grid",
  gap: 8,
  marginTop: 12,
};

const detailTagContent: React.CSSProperties = {
  display: "grid",
  gap: 2,
  minWidth: 0,
};

const bidScopeCell: React.CSSProperties = {
  display: "grid",
  gap: 4,
  minWidth: 0,
};

let cachedProjectsStorageValue: string | undefined;
let cachedProjects: Project[] = getMergedProjects();
let cachedSelectionsStorageValue: string | undefined;
let cachedSelections: StoredProjectCsiSelections = EMPTY_PROJECT_CSI_SELECTIONS;

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

function useProjectCsiSelectionsSnapshot(): StoredProjectCsiSelections {
  return useSyncExternalStore(
    subscribeToProjectCsiSelectionsStorage,
    getProjectCsiSelectionsSnapshot,
    getServerProjectCsiSelectionsSnapshot
  );
}

function subscribeToProjectCsiSelectionsStorage(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(selectionChangeEvent, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(selectionChangeEvent, onStoreChange);
  };
}

function getServerProjectCsiSelectionsSnapshot(): StoredProjectCsiSelections {
  return EMPTY_PROJECT_CSI_SELECTIONS;
}

function getProjectCsiSelectionsSnapshot(): StoredProjectCsiSelections {
  const storageValue = localStorage.getItem(selectionStorageKey) || "{}";

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

function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}
