"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CsiCodeLabel, CsiLevelBadge } from "@/components/csi";
import AppShell from "@/components/layout/AppShell";
import { getMergedProjects, projectsStorageKey } from "@/lib/projects";
import {
  getProjectCsiTree,
  getSelectedProjectCsiSummary,
  isProjectCsiItemSelected,
  projectCsiIdsReferToSameItem,
  resolveProjectCsiItem,
  toggleProjectCsiItemSelection,
  validateProjectCsiSelection,
} from "@/lib/projectCsiSelections";
import {
  CsiCatalogItem,
  CsiCatalogTreeNode,
  StoredProjectCsiSelection,
  StoredProjectCsiSelections,
} from "@/types/Csi";
import { Project } from "@/types/Project";

const selectionStorageKey = "projectCsiSelections";
const selectionChangeEvent = "projectCsiSelectionsChange";
const EMPTY_PROJECT_CSI_SELECTIONS: StoredProjectCsiSelections = {};
let cachedProjectsStorageValue: string | undefined;
let cachedProjects: Project[] = getMergedProjects();
let cachedSelectionsStorageValue: string | undefined;
let cachedSelections: StoredProjectCsiSelections = EMPTY_PROJECT_CSI_SELECTIONS;

export default function ProjectScopePage() {
  const params = useParams();
  const rawProjectId = params.projectId;
  const projectId = Array.isArray(rawProjectId) ? rawProjectId[0] : rawProjectId;
  const projects = useProjectsSnapshot();
  const project = projects.find((p) => p.id === projectId);
  const storedSelections = useProjectCsiSelectionsSnapshot();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingDivisionId, setEditingDivisionId] = useState<string | undefined>();
  const [stagedSelection, setStagedSelection] =
    useState<StoredProjectCsiSelection | undefined>();
  const [modalOpenedItemIds, setModalOpenedItemIds] = useState<string[]>([]);

  const csiTree = useMemo(
    () => (project ? getProjectCsiTree(project.csiVersion) : []),
    [project]
  );
  const divisionNodes = csiTree.filter((node) => node.item.level === 1);
  const csiSelection = project
    ? validateProjectCsiSelection(storedSelections[project.id], project.csiVersion)
    : undefined;
  const selectedSummary = project
    ? getSelectedProjectCsiSummary(project.csiVersion, csiSelection)
    : [];
  const selectedItemCount =
    (csiSelection?.divisionIds.length ?? 0) +
    (csiSelection?.sectionIds.length ?? 0);
  const selectedSummaryByDivisionId = new Map(
    selectedSummary.map((summary) => [summary.division.divisionId, summary])
  );
  const editingDivisionNode = editingDivisionId
    ? divisionNodes.find((node) => node.item.divisionId === editingDivisionId)
    : undefined;

  function saveSelection(selection: StoredProjectCsiSelection) {
    if (!project) return;

    const storedSelections = readStoredSelections();
    const nextSelection = validateProjectCsiSelection(
      selection,
      project.csiVersion
    );

    storedSelections[project.id] = nextSelection;
    localStorage.setItem(selectionStorageKey, JSON.stringify(storedSelections));
    window.dispatchEvent(new Event(selectionChangeEvent));
  }

  function openAddScopeModal() {
    setAddModalOpen(true);
  }

  function closeAddScopeModal() {
    setAddModalOpen(false);
  }

  function openDivisionEditor(divisionNode: CsiCatalogTreeNode) {
    if (!project || !csiSelection) return;

    setAddModalOpen(false);
    setEditingDivisionId(divisionNode.item.divisionId);
    setStagedSelection({ ...csiSelection });
    setModalOpenedItemIds(getInitiallyExpandedIds(divisionNode, csiSelection));
  }

  function closeDivisionEditor() {
    setEditingDivisionId(undefined);
    setStagedSelection(undefined);
    setModalOpenedItemIds([]);
  }

  function applyDivisionEditor() {
    if (!stagedSelection) return;

    saveSelection(stagedSelection);
    closeDivisionEditor();
  }

  function toggleStagedItem(item: CsiCatalogItem, checked: boolean) {
    if (!project) return;

    setStagedSelection((currentSelection) =>
      toggleProjectCsiItemSelection(
        currentSelection,
        project.csiVersion,
        item.id,
        checked
      )
    );
  }

  function toggleExpandedModalItem(itemId: string) {
    setModalOpenedItemIds((currentItemIds) =>
      currentItemIds.includes(itemId)
        ? currentItemIds.filter((id) => id !== itemId)
        : addUnique(currentItemIds, itemId)
    );
  }

  function removeDivision(division: CsiCatalogItem) {
    if (!project || !csiSelection) return;

    const shouldRemove = window.confirm(
      `Remove ${division.number} - ${division.name} and all selected CSI scopes under this division?`
    );

    if (!shouldRemove) return;

    saveSelection({
      ...csiSelection,
      divisionIds: csiSelection.divisionIds.filter(
        (divisionId) => divisionId !== division.divisionId
      ),
      sectionIds: csiSelection.sectionIds.filter((sectionId) => {
        const item = resolveProjectCsiItem(project.csiVersion, sectionId);

        return item?.divisionId !== division.divisionId;
      }),
      updatedAt: new Date().toISOString(),
    });
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
    <AppShell title={`${project.name} - Project Scope`}>
      <p>
        Select the MasterFormat CSI scopes that apply to this project. Later,
        these selections will control budgeting, bid invites, bid leveling, and
        proposal generation.
      </p>

      <section style={panel}>
        <h2>Project</h2>
        <p>
          <strong>Client:</strong> {project.client}
        </p>
        <p>
          <strong>CSI Version:</strong> {formatCsiMasterFormatVersion(project.csiVersion)}
        </p>
      </section>

      <section style={panel}>
        <div className="project-csi-section-header">
          <div>
            <h2>CSI Scope Selection</h2>
            <p className="muted-text">
              {selectedItemCount} selected CSI scopes across{" "}
              {selectedSummary.length} divisions.
            </p>
          </div>
          <button
            type="button"
            className="button-primary"
            onClick={openAddScopeModal}
          >
            Add CSI Scope
          </button>
        </div>

        {selectedSummary.length === 0 ? (
          <p className="muted-text">No CSI scopes selected yet.</p>
        ) : (
          <div className="project-csi-division-card-grid">
            {selectedSummary.map((summary) => (
              <DivisionScopeCard
                key={summary.division.id}
                division={summary.division}
                selectedItems={summary.items}
                onEdit={() => {
                  const divisionNode = divisionNodes.find(
                    (node) => node.item.divisionId === summary.division.divisionId
                  );

                  if (divisionNode) openDivisionEditor(divisionNode);
                }}
                onRemove={() => removeDivision(summary.division)}
              />
            ))}
          </div>
        )}
      </section>

      {addModalOpen && (
        <div className="modal-backdrop" role="presentation">
          <section
            className="modal-card project-csi-add-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-csi-scope-title"
          >
            <div className="modal-header">
              <div>
                <h2 id="add-csi-scope-title">Add CSI Scope</h2>
                <p className="muted-text">
                  Choose a Division to add or edit project CSI scopes.
                </p>
              </div>
            </div>
            <div className="modal-body project-csi-modal-body">
              <div className="project-csi-division-picker">
                {divisionNodes.map((divisionNode) => {
                  const summary = selectedSummaryByDivisionId.get(
                    divisionNode.item.divisionId
                  );

                  return (
                    <button
                      type="button"
                      key={divisionNode.item.id}
                      className="project-csi-division-choice"
                      onClick={() => openDivisionEditor(divisionNode)}
                    >
                      <span>
                        <CsiCodeLabel item={divisionNode.item} showLevelBadge />
                      </span>
                      <span className="badge badge-muted">
                        {summary ? getSelectedItemCount(summary.items) : 0} selected
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="button-secondary"
                onClick={closeAddScopeModal}
              >
                Cancel
              </button>
            </div>
          </section>
        </div>
      )}

      {editingDivisionNode && stagedSelection && (
        <div className="modal-backdrop" role="presentation">
          <section
            className="modal-card project-csi-editor-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-csi-division-title"
          >
            <div className="modal-header">
              <div>
                <h2 id="edit-csi-division-title">Edit Division CSI Scopes</h2>
                <div className="project-csi-modal-heading">
                  <CsiCodeLabel item={editingDivisionNode.item} showLevelBadge />
                </div>
              </div>
            </div>
            <div className="modal-body project-csi-modal-body">
              <div className="project-csi-tree">
                <BroadDivisionRow
                  division={editingDivisionNode.item}
                  stagedSelection={stagedSelection}
                  onToggle={toggleStagedItem}
                />
                {editingDivisionNode.children.map((childNode) => (
                  <ProjectCsiTreeNode
                    key={childNode.item.id}
                    node={childNode}
                    depth={0}
                    openedItemIds={modalOpenedItemIds}
                    stagedSelection={stagedSelection}
                    onToggleExpanded={toggleExpandedModalItem}
                    onToggleItem={toggleStagedItem}
                  />
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="button-secondary"
                onClick={closeDivisionEditor}
              >
                Cancel
              </button>
              <button
                type="button"
                className="button-primary"
                onClick={applyDivisionEditor}
              >
                Apply
              </button>
            </div>
          </section>
        </div>
      )}
    </AppShell>
  );
}

function DivisionScopeCard({
  division,
  selectedItems,
  onEdit,
  onRemove,
}: {
  division: CsiCatalogItem;
  selectedItems: CsiCatalogItem[];
  onEdit: () => void;
  onRemove: () => void;
}) {
  const childItems = selectedItems.filter((item) => item.level > 1);
  const divisionSelected = selectedItems.some((item) => item.level === 1);

  return (
    <article className="project-csi-division-card">
      <div className="project-csi-division-card-header">
        <div>
          <CsiCodeLabel item={division} showLevelBadge />
          <p className="muted-text">
            {getSelectedItemCount(selectedItems)} selected CSI scopes
          </p>
        </div>
        <div className="settings-actions">
          <button type="button" className="button-secondary" onClick={onEdit}>
            Edit
          </button>
          <button type="button" className="button-secondary" onClick={onRemove}>
            Remove Division
          </button>
        </div>
      </div>

      {divisionSelected && (
        <span className="badge badge-primary">Division Selected</span>
      )}

      {childItems.length === 0 ? (
        <p className="muted-text">No subdivision, section, or subsection scopes selected.</p>
      ) : (
        <div className="badge-list">
          {childItems.map((item) => (
            <span key={item.id} className="badge badge-muted">
              <CsiCodeLabel item={item} showLevelBadge />
            </span>
          ))}
        </div>
      )}
    </article>
  );
}

function BroadDivisionRow({
  division,
  stagedSelection,
  onToggle,
}: {
  division: CsiCatalogItem;
  stagedSelection: StoredProjectCsiSelection;
  onToggle: (item: CsiCatalogItem, checked: boolean) => void;
}) {
  return (
    <label className="project-csi-tree-item project-csi-broad-row">
      <input
        type="checkbox"
        checked={stagedSelection.divisionIds.includes(division.divisionId)}
        onChange={(event) => onToggle(division, event.target.checked)}
      />
      <span className="project-csi-tree-label">
        <CsiCodeLabel item={division} />
      </span>
      <span className="badge badge-primary">Division-wide scope</span>
    </label>
  );
}

function ProjectCsiTreeNode({
  node,
  depth,
  openedItemIds,
  stagedSelection,
  onToggleExpanded,
  onToggleItem,
}: {
  node: CsiCatalogTreeNode;
  depth: number;
  openedItemIds: string[];
  stagedSelection: StoredProjectCsiSelection;
  onToggleExpanded: (itemId: string) => void;
  onToggleItem: (item: CsiCatalogItem, checked: boolean) => void;
}) {
  const hasChildren = node.children.length > 0;
  const isExpanded = openedItemIds.includes(node.item.id);
  const isSelected = isProjectCsiItemSelected(
    node.item.version,
    stagedSelection.sectionIds,
    node.item.id
  );

  return (
    <div className="project-csi-tree-node">
      <div
        className="project-csi-tree-row"
        style={{ "--tree-depth": depth } as React.CSSProperties}
      >
        <button
          type="button"
          className="project-csi-tree-toggle"
          aria-label={
            hasChildren
              ? `${isExpanded ? "Collapse" : "Expand"} ${node.item.number}`
              : `${node.item.number} has no child rows`
          }
          aria-expanded={hasChildren ? isExpanded : undefined}
          disabled={!hasChildren}
          onClick={() => onToggleExpanded(node.item.id)}
        >
          {hasChildren ? (isExpanded ? "-" : "+") : ""}
        </button>

        <label className="project-csi-tree-item">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(event) => onToggleItem(node.item, event.target.checked)}
          />
          <span className="project-csi-tree-label">
            <CsiCodeLabel item={node.item} />
          </span>
          <CsiLevelBadge item={node.item} />
        </label>
      </div>

      {isExpanded &&
        node.children.map((childNode) => (
          <ProjectCsiTreeNode
            key={childNode.item.id}
            node={childNode}
            depth={depth + 1}
            openedItemIds={openedItemIds}
            stagedSelection={stagedSelection}
            onToggleExpanded={onToggleExpanded}
            onToggleItem={onToggleItem}
          />
        ))}
    </div>
  );
}

const panel: React.CSSProperties = {
  border: "1px solid #555",
  padding: 16,
  marginTop: 24,
  borderRadius: 8,
};

function getSelectedItemCount(items: CsiCatalogItem[]) {
  return items.length;
}

function getInitiallyExpandedIds(
  divisionNode: CsiCatalogTreeNode,
  selection: StoredProjectCsiSelection
) {
  const expandedIds = new Set<string>();

  function walk(node: CsiCatalogTreeNode): boolean {
    const hasSelectedSelf = selection.sectionIds.some((sectionId) =>
      projectCsiIdsReferToSameItem(node.item.version, sectionId, node.item.id)
    );
    const hasSelectedChild = node.children.some(walk);

    if (hasSelectedChild) expandedIds.add(node.item.id);

    return hasSelectedSelf || hasSelectedChild;
  }

  divisionNode.children.forEach(walk);

  return Array.from(expandedIds);
}

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

function addUnique(values: string[], ...newValues: string[]) {
  return Array.from(new Set([...values, ...newValues]));
}

function formatCsiMasterFormatVersion(value: string) {
  if (value === "MASTERFORMAT_1995") return "MasterFormat 1995";

  return "Current MasterFormat";
}
