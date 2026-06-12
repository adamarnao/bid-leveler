"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import { mockProjects } from "@/data/mockProjects";
import { mockCsiDivisions } from "@/data/mockCsiDivisions";
import { mockCsiSections } from "@/data/mockCsiSections";
import {
  StoredProjectCsiSelection,
  StoredProjectCsiSelections,
} from "@/types/Csi";

const selectionStorageKey = "projectCsiSelections";
const selectionChangeEvent = "projectCsiSelectionsChange";
const EMPTY_PROJECT_CSI_SELECTIONS: StoredProjectCsiSelections = {};
let cachedSelectionsStorageValue: string | undefined;
let cachedSelections: StoredProjectCsiSelections = EMPTY_PROJECT_CSI_SELECTIONS;

export default function ProjectSetupPage() {
  const params = useParams();
  const rawProjectId = params.projectId;
  const projectId = Array.isArray(rawProjectId) ? rawProjectId[0] : rawProjectId;
  const project = mockProjects.find((p) => p.id === projectId);
  const storedSelections = useProjectCsiSelectionsSnapshot();
  const [openedDivisionIds, setOpenedDivisionIds] = useState<string[]>([]);

  const divisions = useMemo(
    () =>
      project
        ? mockCsiDivisions.filter(
            (division) => division.version === project.csiVersion
          )
        : [],
    [project]
  );
  const sections = useMemo(
    () =>
      project
        ? mockCsiSections.filter(
            (section) => section.version === project.csiVersion
          )
        : [],
    [project]
  );

  const csiSelection = project
    ? validateSelection(storedSelections[project.id], project.csiVersion)
    : undefined;
  const selectedDivisionIds = csiSelection?.divisionIds ?? [];
  const selectedSectionIds = csiSelection?.sectionIds ?? [];

  function saveSelection(divisionIds: string[], sectionIds: string[]) {
    if (!project) return;

    const storedSelections = readStoredSelections();
    const selection = validateSelection(
      {
        version: project.csiVersion,
        divisionIds,
        sectionIds,
        updatedAt: new Date().toISOString(),
      },
      project.csiVersion
    );

    storedSelections[project.id] = selection;
    localStorage.setItem(selectionStorageKey, JSON.stringify(storedSelections));
    window.dispatchEvent(new Event(selectionChangeEvent));
  }

  function toggleDivision(divisionId: string, checked: boolean) {
    if (checked) {
      setOpenedDivisionIds((currentDivisionIds) =>
        addUnique(currentDivisionIds, divisionId)
      );
    } else {
      setOpenedDivisionIds((currentDivisionIds) =>
        currentDivisionIds.filter((id) => id !== divisionId)
      );
    }

    const divisionSectionIds = sections
      .filter((section) => section.divisionId === divisionId)
      .map((section) => section.id);
    const divisionIds = checked
      ? addUnique(selectedDivisionIds, divisionId)
      : selectedDivisionIds.filter((id) => id !== divisionId);
    const sectionIds = checked
      ? selectedSectionIds
      : selectedSectionIds.filter((id) => !divisionSectionIds.includes(id));

    saveSelection(divisionIds, sectionIds);
  }

  function toggleSection(
    sectionId: string,
    divisionId: string,
    checked: boolean
  ) {
    if (checked) {
      setOpenedDivisionIds((currentDivisionIds) =>
        addUnique(currentDivisionIds, divisionId)
      );
    }

    const divisionIds = checked
      ? addUnique(selectedDivisionIds, divisionId)
      : selectedDivisionIds;
    const sectionIds = checked
      ? addUnique(selectedSectionIds, sectionId)
      : selectedSectionIds.filter((id) => id !== sectionId);

    saveSelection(divisionIds, sectionIds);
  }

  function toggleExpandedDivision(divisionId: string) {
    setOpenedDivisionIds((currentDivisionIds) =>
      currentDivisionIds.includes(divisionId)
        ? currentDivisionIds.filter((id) => id !== divisionId)
        : addUnique(currentDivisionIds, divisionId)
    );
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
    <AppShell title={`${project.name} - Setup`}>
      <p>
        Select the CSI divisions and sections that apply to this project. Later,
        these selections will control budgeting, bid invites, bid leveling, and
        proposal generation.
      </p>

      <section style={panel}>
        <h2>Project</h2>
        <p>
          <strong>Client:</strong> {project.client}
        </p>
        <p>
          <strong>CSI Version:</strong> {project.csiVersion}
        </p>
      </section>

      <section style={panel}>
        <h2>CSI Divisions / Sections</h2>

        {divisions.map((division) => {
          const divisionSections = sections.filter(
            (section) => section.divisionId === division.id
          );
          const isExpanded = openedDivisionIds.includes(division.id);

          return (
            <div key={division.id} style={divisionBlock}>
              <div style={divisionRow}>
                <button
                  type="button"
                  aria-label={`${isExpanded ? "Collapse" : "Expand"} Division ${
                    division.number
                  }`}
                  aria-expanded={isExpanded}
                  onClick={() => toggleExpandedDivision(division.id)}
                  style={expandButton}
                >
                  {isExpanded ? "-" : "+"}
                </button>

                <label>
                  <input
                    type="checkbox"
                    checked={selectedDivisionIds.includes(division.id)}
                    onChange={(event) =>
                      toggleDivision(division.id, event.target.checked)
                    }
                  />{" "}
                  Division {division.number} - {division.name}
                </label>
              </div>

              {isExpanded && (
                <div style={sectionRows}>
                {divisionSections.length === 0 ? (
                  <p>No sections added yet.</p>
                ) : (
                  divisionSections.map((section) => (
                    <div key={section.id} style={{ marginBottom: 8 }}>
                      <label>
                        <input
                          type="checkbox"
                          checked={selectedSectionIds.includes(section.id)}
                          onChange={(event) =>
                            toggleSection(
                              section.id,
                              division.id,
                              event.target.checked
                            )
                          }
                        />{" "}
                        {section.number} - {section.name}
                      </label>
                    </div>
                  ))
                )}
                </div>
              )}
            </div>
          );
        })}
      </section>
    </AppShell>
  );
}

const panel: React.CSSProperties = {
  border: "1px solid #555",
  padding: 16,
  marginTop: 24,
  borderRadius: 8,
};

const divisionBlock: React.CSSProperties = {
  borderBottom: "1px solid #444",
  padding: "12px 0",
};

const divisionRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const expandButton: React.CSSProperties = {
  width: 24,
  height: 24,
  lineHeight: "20px",
  padding: 0,
};

const sectionRows: React.CSSProperties = {
  marginLeft: 32,
  marginTop: 12,
};

function readStoredSelections(): StoredProjectCsiSelections {
  try {
    const value = localStorage.getItem(selectionStorageKey);
    const parsed = value ? JSON.parse(value) : EMPTY_PROJECT_CSI_SELECTIONS;

    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed
      : EMPTY_PROJECT_CSI_SELECTIONS;
  } catch {
    return EMPTY_PROJECT_CSI_SELECTIONS;
  }
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

function validateSelection(
  selection: StoredProjectCsiSelection | undefined,
  version: StoredProjectCsiSelection["version"]
): StoredProjectCsiSelection {
  const availableDivisions = mockCsiDivisions.filter(
    (division) => division.version === version
  );
  const availableDivisionIds = new Set(
    availableDivisions.map((division) => division.id)
  );
  const availableSections = mockCsiSections.filter(
    (section) =>
      section.version === version && availableDivisionIds.has(section.divisionId)
  );
  const availableSectionIds = new Set(
    availableSections.map((section) => section.id)
  );
  const selectedSectionIds = Array.isArray(selection?.sectionIds)
    ? selection.sectionIds.filter((sectionId) =>
        availableSectionIds.has(sectionId)
      )
    : [];
  const sectionParentDivisionIds = availableSections
    .filter((section) => selectedSectionIds.includes(section.id))
    .map((section) => section.divisionId);
  const selectedDivisionIds = Array.isArray(selection?.divisionIds)
    ? selection.divisionIds.filter((divisionId) =>
        availableDivisionIds.has(divisionId)
      )
    : [];

  return {
    version,
    divisionIds: addUnique(selectedDivisionIds, ...sectionParentDivisionIds),
    sectionIds: selectedSectionIds,
    updatedAt: selection?.updatedAt ?? new Date().toISOString(),
  };
}

function addUnique(values: string[], ...newValues: string[]) {
  return Array.from(new Set([...values, ...newValues]));
}
