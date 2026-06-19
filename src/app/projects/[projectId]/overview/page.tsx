"use client";

import { Fragment, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CsiCodeLabel, CsiHierarchyPath, CsiLevelBadge } from "@/components/csi";
import AppShell from "@/components/layout/AppShell";
import { mockSectionCosts } from "@/data/mockSectionCosts";
import ProjectCostSummaryTable from "@/components/projects/ProjectCostSummaryTable";
import { mockProjectCosts } from "@/data/mockProjectCosts";
import { getNearestLevel2Ancestor } from "@/lib/csiCatalog";
import { getMergedProjects, projectsStorageKey } from "@/lib/projects";
import {
  getProjectCsiDivisions,
  getProjectCsiSectionsByDivision,
  projectCsiIdsReferToSameItem,
  resolveProjectCsiItem,
  validateProjectCsiSelection,
} from "@/lib/projectCsiSelections";
import { Project } from "@/types/Project";
import {
  CsiCatalogItem,
  CsiDivision,
  CsiSection,
  StoredProjectCsiSelections,
} from "@/types/Csi";

const selectionStorageKey = "projectCsiSelections";
const EMPTY_PROJECT_CSI_SELECTIONS: StoredProjectCsiSelections = {};

export default function ProjectOverviewPage() {
  const params = useParams();
  const rawProjectId = params.projectId;
  const projectId = Array.isArray(rawProjectId) ? rawProjectId[0] : rawProjectId;
  const projects = useProjectsSnapshot();
  const csiSelections = useProjectCsiSelectionsSnapshot();
  const [expandedDivisionIds, setExpandedDivisionIds] = useState<string[]>([]);
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

  const csiSelection = projectId
    ? validateProjectCsiSelection(csiSelections[projectId], project.csiVersion)
    : undefined;
  const hasSavedCsiSelection =
    projectId !== undefined && csiSelections[projectId] !== undefined;
  const allDivisions = getProjectCsiDivisions(project.csiVersion);
  const divisions = hasSavedCsiSelection
    ? allDivisions.filter((division) =>
        csiSelection?.divisionIds.includes(division.id)
      )
    : allDivisions;

  const getSectionCost = (sectionId: string) =>
    mockSectionCosts.find((cost) =>
      projectCsiIdsReferToSameItem(
        project.csiVersion,
        cost.sectionId,
        sectionId
      )
    );

  const totalSelectedCost = mockSectionCosts.reduce(
    (sum, item) => sum + item.selectedCost,
    0
  );

  const mockGcCosts = 68500;
  const projectTotal = totalSelectedCost + mockGcCosts;

  return (
    <AppShell title="Overview">
      <Link href={`/projects/${project.id}`}>{"<-"} Back to Command Center</Link>

      <h1>{project.name} Overview</h1>
      <Link href={`/projects/${project.id}/setup`}>Project Setup</Link>

      <section style={panel}>
        <h2>Project Details</h2>
        <p>
          <strong>Client:</strong> {project.client}
        </p>
        <p>
          <strong>Status:</strong> {project.status}
        </p>
        <p>
          <strong>Bid Due:</strong> {project.bidDueDate}
        </p>
        <p>
          <strong>Type:</strong> {project.marketSector} /{" "}
          {project.projectCategory} / {project.projectSubtype}
        </p>
        <p>
          <strong>Address:</strong> {project.address}, {project.city},{" "}
          {project.state} {project.zip}
        </p>
        <p>
          <strong>CSI Version:</strong> {project.csiVersion}
        </p>
      </section>

      <section style={panel}>
        <h2>Project Cost Summary</h2>

        <ProjectCostSummaryTable
          rows={[
            {
              label: "General Conditions",
              amount: mockGcCosts,
              squareFootage: project.squareFootage ?? 0,
              totalProjectCost: projectTotal,
              constructionCost: totalSelectedCost,
              durationMonths: project.projectDurationMonths ?? 0,
            },
            {
              label: "Fee",
              amount:
                mockProjectCosts.find((c) => c.category === "GC_FEE")
                  ?.amount ?? 0,
              squareFootage: project.squareFootage ?? 0,
              totalProjectCost: projectTotal,
              constructionCost: totalSelectedCost,
              durationMonths: project.projectDurationMonths ?? 0,
            },
            {
              label: "Insurance",
              amount:
                mockProjectCosts.find((c) => c.category === "INSURANCE")
                  ?.amount ?? 0,
              squareFootage: project.squareFootage ?? 0,
              totalProjectCost: projectTotal,
              constructionCost: totalSelectedCost,
              durationMonths: project.projectDurationMonths ?? 0,
            },
            {
              label: "Construction Total",
              amount: totalSelectedCost,
              squareFootage: project.squareFootage ?? 0,
              totalProjectCost: projectTotal,
              constructionCost: totalSelectedCost,
              durationMonths: project.projectDurationMonths ?? 0,
            },
            {
              label: "TOTAL",
              amount: projectTotal,
              squareFootage: project.squareFootage ?? 0,
              totalProjectCost: projectTotal,
              constructionCost: totalSelectedCost,
              durationMonths: project.projectDurationMonths ?? 0,
              bold: true,
            },
          ]}
        />
      </section>

      <section style={panel}>
        <h2>CSI Scope Summary</h2>

        <table style={{ borderCollapse: "collapse", minWidth: 1000 }}>
          <thead>
            <tr>
              <th style={cell}></th>
              <th style={cell}>Division</th>
              <th style={cell}>CSI scopes</th>
              <th style={cell}>Budget</th>
              <th style={cell}>Low Bid</th>
              <th style={cell}>Selected Cost</th>
              <th style={cell}>Variance</th>
              <th style={cell}>Action</th>
            </tr>
          </thead>

          <tbody>
            {divisions.map((division) => {
              const allSections = getProjectCsiSectionsByDivision(
                project.csiVersion,
                division.id,
                csiSelection?.sectionIds ?? []
              );
              const sections = hasSavedCsiSelection
                ? allSections.filter((section) =>
                    csiSelection?.sectionIds.some((sectionId) =>
                      projectCsiIdsReferToSameItem(
                        project.csiVersion,
                        sectionId,
                        section.id
                      )
                    )
                  )
                : allSections;
              const divisionItem = divisionToCatalogItem(division);
              const broadDivisionSelected = Boolean(
                csiSelection?.divisionIds.includes(division.id)
              );
              const subdivisionGroups = groupCsiScopesBySubdivision(sections);

              const divisionBudget = sections.reduce((sum, section) => {
                const cost = getSectionCost(section.id);
                return sum + (cost?.budget ?? 0);
              }, 0);

              const divisionLowBid = sections.reduce((sum, section) => {
                const cost = getSectionCost(section.id);
                return sum + (cost?.lowBid ?? 0);
              }, 0);

              const divisionSelected = sections.reduce((sum, section) => {
                const cost = getSectionCost(section.id);
                return sum + (cost?.selectedCost ?? 0);
              }, 0);

              const divisionVariance = divisionSelected - divisionBudget;
              const isExpanded = expandedDivisionIds.includes(division.id);

              return (
                <Fragment key={division.id}>
                  <tr>
                    <td style={cell}>
                      <button
                        type="button"
                        aria-label={`${
                          isExpanded ? "Collapse" : "Expand"
                        } Division ${division.number}`}
                        aria-expanded={isExpanded}
                        onClick={() =>
                          toggleExpandedDivision(
                            division.id,
                            setExpandedDivisionIds
                          )
                        }
                        style={expandButton}
                      >
                        {isExpanded ? "-" : "+"}
                      </button>
                    </td>
                    <td style={cell}>
                      <CsiCodeLabel item={divisionItem} showLevelBadge />
                    </td>
                    <td style={cell}>
                      <div style={scopeSummary}>
                        {broadDivisionSelected ? (
                          <span className="badge badge-primary">
                            Division Selected
                          </span>
                        ) : null}
                        <span className="muted-text">
                          {subdivisionGroups.length} subdivision
                          {subdivisionGroups.length === 1 ? "" : "s"}
                          {sections.length > 0
                            ? `, ${sections.length} selected CSI scope${
                                sections.length === 1 ? "" : "s"
                              }`
                            : ""}
                        </span>
                      </div>
                    </td>
                    <td style={cell}>${divisionBudget.toLocaleString()}</td>
                    <td style={cell}>${divisionLowBid.toLocaleString()}</td>
                    <td style={cell}>${divisionSelected.toLocaleString()}</td>
                    <td style={cell}>${divisionVariance.toLocaleString()}</td>
                    <td style={cell}>
                      <Link
                        href={`/projects/${project.id}/csi-divisions/${division.number}`}
                      >
                        Level Bids
                      </Link>
                    </td>
                  </tr>
                  {isExpanded && sections.length === 0 && (
                    <tr>
                      <td style={childCell} />
                      <td style={childCell} colSpan={7}>
                        <span className="muted-text">
                          No subdivision, section, or subsection CSI scopes
                          selected.
                        </span>
                      </td>
                    </tr>
                  )}
                  {isExpanded &&
                    subdivisionGroups.map((group) => (
                      <tr key={group.subdivision?.id ?? group.key}>
                        <td style={childCell} />
                        <td style={childCell} colSpan={7}>
                          <SubdivisionScopeGroup
                            group={group}
                            getSectionCost={getSectionCost}
                          />
                        </td>
                      </tr>
                    ))}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </section>

      <section style={panel}>
        <h2>Proposal</h2>
        <p>
          Proposal generation will compile project details, selected costs,
          alternates, clarifications, exclusions, and notes.
        </p>
        <Link href={`/projects/${project.id}/proposal`}>
          Open Proposal Draft
        </Link>
      </section>
    </AppShell>
  );
}

const panel: React.CSSProperties = {
  border: "1px solid #555",
  padding: "16px",
  marginTop: "24px",
  borderRadius: "8px",
};

const cell: React.CSSProperties = {
  border: "1px solid #555",
  padding: "8px",
  verticalAlign: "top",
};

const childCell: React.CSSProperties = {
  border: "1px solid #777",
  padding: "6px",
  verticalAlign: "top",
};

const expandButton: React.CSSProperties = {
  width: 24,
  height: 24,
  lineHeight: "20px",
  padding: 0,
};

const scopeSummary: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: "6px 10px",
};

const subdivisionCard: React.CSSProperties = {
  display: "grid",
  gap: 8,
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-control)",
  padding: 10,
  background: "var(--color-surface-muted)",
};

const subdivisionHeader: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "space-between",
  gap: 10,
  alignItems: "flex-start",
};

const detailTagContent: React.CSSProperties = {
  display: "grid",
  gap: 2,
  minWidth: 0,
};

type SectionCost = {
  budget: number;
  lowBid: number;
  selectedCost: number;
};

type SubdivisionScopeGroupData = {
  key: string;
  subdivision?: CsiCatalogItem;
  detailItems: CsiCatalogItem[];
};

function SubdivisionScopeGroup({
  group,
  getSectionCost,
}: {
  group: SubdivisionScopeGroupData;
  getSectionCost: (sectionId: string) => SectionCost | undefined;
}) {
  const subdivisionItems = group.subdivision ? [group.subdivision] : [];
  const costItems = [...subdivisionItems, ...group.detailItems];
  const budget = costItems.reduce(
    (sum, item) => sum + (getSectionCost(item.id)?.budget ?? 0),
    0
  );
  const lowBid = costItems.reduce(
    (sum, item) => sum + (getSectionCost(item.id)?.lowBid ?? 0),
    0
  );
  const selectedCost = costItems.reduce(
    (sum, item) => sum + (getSectionCost(item.id)?.selectedCost ?? 0),
    0
  );
  const variance = selectedCost - budget;

  return (
    <article style={subdivisionCard}>
      <div style={subdivisionHeader}>
        <div>
          {group.subdivision ? (
            <CsiCodeLabel item={group.subdivision} showLevelBadge />
          ) : (
            <span className="muted-text">Ungrouped CSI scopes</span>
          )}
        </div>
        <div className="badge-list">
          <span className="badge badge-muted">Budget ${budget.toLocaleString()}</span>
          <span className="badge badge-muted">Low Bid ${lowBid.toLocaleString()}</span>
          <span className="badge badge-muted">
            Selected ${selectedCost.toLocaleString()}
          </span>
          <span className="badge badge-muted">Variance ${variance.toLocaleString()}</span>
        </div>
      </div>

      {group.detailItems.length > 0 ? (
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
      ) : (
        <span className="muted-text">
          No section or subsection detail scopes selected.
        </span>
      )}
    </article>
  );
}

function groupCsiScopesBySubdivision(
  selectedSections: CsiSection[]
): SubdivisionScopeGroupData[] {
  const groupsByKey = new Map<string, SubdivisionScopeGroupData>();

  selectedSections.forEach((section) => {
    const item = resolveProjectCsiItem(section.version, section.id);
    if (!item || item.level === 1) return;

    const subdivision =
      item.level === 2 ? item : getNearestLevel2Ancestor(item.version, item.id);
    const key = subdivision?.id ?? `ungrouped-${item.divisionId}`;
    const group =
      groupsByKey.get(key) ??
      {
        key,
        subdivision,
        detailItems: [],
      };

    if (item.level > 2) {
      group.detailItems.push(item);
    }

    groupsByKey.set(key, group);
  });

  groupsByKey.forEach((group) => {
    group.detailItems.sort(compareCsiCatalogItems);
  });

  return Array.from(groupsByKey.values()).sort((groupA, groupB) =>
    compareOptionalSubdivisionGroups(groupA, groupB)
  );
}

function compareOptionalSubdivisionGroups(
  groupA: SubdivisionScopeGroupData,
  groupB: SubdivisionScopeGroupData
) {
  const subdivisionA = groupA.subdivision;
  const subdivisionB = groupB.subdivision;

  if (!subdivisionA && !subdivisionB) return groupA.key.localeCompare(groupB.key);
  if (!subdivisionA) return 1;
  if (!subdivisionB) return -1;

  return compareCsiCatalogItems(subdivisionA, subdivisionB);
}

function compareCsiCatalogItems(itemA: CsiCatalogItem, itemB: CsiCatalogItem) {
  return (
    itemA.sortOrder - itemB.sortOrder ||
    itemA.number.localeCompare(itemB.number, undefined, { numeric: true })
  );
}

function divisionToCatalogItem(division: CsiDivision): CsiCatalogItem {
  return {
    id: division.id,
    version: division.version,
    number: division.number,
    name: division.name,
    level: division.level ?? 1,
    divisionId: division.id,
    parentId: division.parentId,
    sortOrder: division.sortOrder ?? 0,
  };
}

let cachedProjectsStorageValue: string | undefined;
let cachedProjects: Project[] = getMergedProjects();
let cachedProjectCsiSelectionsStorageValue: string | undefined;
let cachedProjectCsiSelections: StoredProjectCsiSelections =
  EMPTY_PROJECT_CSI_SELECTIONS;

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

  return () => {
    window.removeEventListener("storage", onStoreChange);
  };
}

function getServerProjectCsiSelectionsSnapshot(): StoredProjectCsiSelections {
  return EMPTY_PROJECT_CSI_SELECTIONS;
}

function getProjectCsiSelectionsSnapshot(): StoredProjectCsiSelections {
  const storageValue = localStorage.getItem(selectionStorageKey) || "{}";

  if (storageValue !== cachedProjectCsiSelectionsStorageValue) {
    cachedProjectCsiSelectionsStorageValue = storageValue;
    cachedProjectCsiSelections = parseProjectCsiSelections(storageValue);
  }

  return cachedProjectCsiSelections;
}

function parseProjectCsiSelections(
  storageValue: string
): StoredProjectCsiSelections {
  try {
    const parsed = JSON.parse(storageValue);

    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed
      : EMPTY_PROJECT_CSI_SELECTIONS;
  } catch {
    return EMPTY_PROJECT_CSI_SELECTIONS;
  }
}

function addUnique(values: string[], ...newValues: string[]) {
  return Array.from(new Set([...values, ...newValues]));
}

function toggleExpandedDivision(
  divisionId: string,
  setExpandedDivisionIds: React.Dispatch<React.SetStateAction<string[]>>
) {
  setExpandedDivisionIds((currentDivisionIds) =>
    currentDivisionIds.includes(divisionId)
      ? currentDivisionIds.filter((id) => id !== divisionId)
      : addUnique(currentDivisionIds, divisionId)
  );
}
