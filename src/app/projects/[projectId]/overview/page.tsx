"use client";

import { Fragment, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { mockSectionCosts } from "@/data/mockSectionCosts";
import ProjectCostSummaryTable from "@/components/projects/ProjectCostSummaryTable";
import { mockProjectCosts } from "@/data/mockProjectCosts";
import { getMergedProjects, projectsStorageKey } from "@/lib/projects";
import {
  getProjectCsiDivisions,
  getProjectCsiSectionsByDivision,
  projectCsiIdsReferToSameItem,
  validateProjectCsiSelection,
} from "@/lib/projectCsiSelections";
import { Project } from "@/types/Project";
import {
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
      <main style={{ padding: 24 }}>
        <h1>Project Not Found</h1>
        <p>Requested project ID: {projectId}</p>
        <Link href="/">Back to Dashboard</Link>
      </main>
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
    <main style={{ padding: 24 }}>
      <Link href={`/projects/${project.id}`}>{"<-"} Back to Command Center</Link>

      <h1>{project.name} Overview</h1>
      <Link href={`/projects/${project.id}/edit`}>Edit Project</Link>

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
        <h2>CSI Division / Section Summary</h2>

        <table style={{ borderCollapse: "collapse", minWidth: 1000 }}>
          <thead>
            <tr>
              <th style={cell}></th>
              <th style={cell}>Division</th>
              <th style={cell}>Division / Section</th>
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
                    <td style={cell}>{division.number}</td>
                    <td style={cell}>
                      <strong>{division.name}</strong>
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
                      <td style={childCell} />
                      <td style={childCell}>No sections added yet.</td>
                      <td style={childCell} />
                      <td style={childCell} />
                      <td style={childCell} />
                      <td style={childCell} />
                      <td style={childCell} />
                    </tr>
                  )}
                  {isExpanded &&
                    sections.map((section) => {
                      const cost = getSectionCost(section.id);
                      const variance =
                        (cost?.selectedCost ?? 0) - (cost?.budget ?? 0);

                      return (
                        <tr key={section.id}>
                          <td style={childCell} />
                          <td style={childCell}>{section.number}</td>
                          <td style={childCell}>{section.name}</td>
                          <td style={childCell}>
                            ${(cost?.budget ?? 0).toLocaleString()}
                          </td>
                          <td style={childCell}>
                            ${(cost?.lowBid ?? 0).toLocaleString()}
                          </td>
                          <td style={childCell}>
                            ${(cost?.selectedCost ?? 0).toLocaleString()}
                          </td>
                          <td style={childCell}>
                            ${variance.toLocaleString()}
                          </td>
                          <td style={childCell} />
                        </tr>
                      );
                    })}
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
    </main>
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
