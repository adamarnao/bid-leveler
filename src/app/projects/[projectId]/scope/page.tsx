"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CsiCodeLabel, CsiHierarchyPath, CsiLevelBadge } from "@/components/csi";
import AppShell from "@/components/layout/AppShell";
import { getCsiAncestors, getNearestLevel2Ancestor } from "@/lib/csiCatalog";
import {
  deleteProjectBidPackage,
  generateBidPackagesFromProjectScopes,
  getProjectBidPackages,
  projectBidPackagesStorageKey,
  saveProjectBidPackage,
} from "@/lib/projectBids";
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
import { ProjectBidPackage, ProjectBidPackageStatus } from "@/types/Bid";
import { Project } from "@/types/Project";

const selectionStorageKey = "projectCsiSelections";
const selectionChangeEvent = "projectCsiSelectionsChange";
const bidPackagesChangeEvent = "projectBidPackagesChange";
const EMPTY_PROJECT_CSI_SELECTIONS: StoredProjectCsiSelections = {};
const bidPackageStatuses: ProjectBidPackageStatus[] = [
  "DRAFT",
  "ACTIVE",
  "CLOSED",
];
const EMPTY_PROJECT_BID_PACKAGES: ProjectBidPackage[] = [];
let cachedProjectsStorageValue: string | undefined;
let cachedProjects: Project[] = getMergedProjects();
let cachedSelectionsStorageValue: string | undefined;
let cachedSelections: StoredProjectCsiSelections = EMPTY_PROJECT_CSI_SELECTIONS;
let cachedBidPackagesStorageValue: string | undefined;
let cachedBidPackagesProjectId: string | undefined;
let cachedBidPackages: ProjectBidPackage[] = [];

export default function ProjectScopePage() {
  const params = useParams();
  const rawProjectId = params.projectId;
  const projectId = Array.isArray(rawProjectId) ? rawProjectId[0] : rawProjectId;
  const projects = useProjectsSnapshot();
  const project = projects.find((p) => p.id === projectId);
  const storedSelections = useProjectCsiSelectionsSnapshot();
  const bidPackages = useProjectBidPackagesSnapshot(projectId ?? "");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingDivisionId, setEditingDivisionId] = useState<string | undefined>();
  const [editingBidPackage, setEditingBidPackage] =
    useState<ProjectBidPackage | null>();
  const [stagedSelection, setStagedSelection] =
    useState<StoredProjectCsiSelection | undefined>();
  const [modalOpenedItemIds, setModalOpenedItemIds] = useState<string[]>([]);
  const [csiSearchQuery, setCsiSearchQuery] = useState("");

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
  const selectedPackageScopeItems = selectedSummary.flatMap(
    (summary) => summary.items
  );
  const selectedSummaryByDivisionId = new Map(
    selectedSummary.map((summary) => [summary.division.divisionId, summary])
  );
  const editingDivisionNode = editingDivisionId
    ? divisionNodes.find((node) => node.item.divisionId === editingDivisionId)
    : undefined;
  const filteredDivisionNodes = csiSearchQuery.trim()
    ? divisionNodes.filter((divisionNode) =>
        doesCsiTreeNodeMatchSearch(divisionNode, csiSearchQuery)
      )
    : divisionNodes;
  const visibleEditingDivisionChildren = editingDivisionNode
    ? getVisibleCsiTreeNodes(editingDivisionNode.children, csiSearchQuery)
    : [];
  const visibleModalOpenedItemIds = csiSearchQuery.trim()
    ? getExpandableTreeNodeIds(visibleEditingDivisionChildren)
    : modalOpenedItemIds;

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

  function saveBidPackage(packageRecord: ProjectBidPackage) {
    saveProjectBidPackage(packageRecord);
    window.dispatchEvent(new Event(bidPackagesChangeEvent));
  }

  function generateBidPackages() {
    if (!project || !csiSelection) return;

    const selectedScopeItemIds = [
      ...csiSelection.divisionIds,
      ...csiSelection.sectionIds,
    ];

    if (selectedScopeItemIds.length === 0) {
      window.alert("Select CSI tags before generating bid packages.");
      return;
    }

    const generatedPackages = generateBidPackagesFromProjectScopes(
      project.id,
      project.csiVersion,
      selectedScopeItemIds
    );

    generatedPackages.forEach(saveProjectBidPackage);
    window.dispatchEvent(new Event(bidPackagesChangeEvent));
  }

  function deleteBidPackage(packageRecord: ProjectBidPackage) {
    if (!project) return;

    const shouldDelete = window.confirm(
      `Delete bid package ${packageRecord.name}? This will not delete CSI selections or bids.`
    );

    if (!shouldDelete) return;

    deleteProjectBidPackage(project.id, packageRecord.id);
    window.dispatchEvent(new Event(bidPackagesChangeEvent));
  }

  function pruneBidPackageScopes(packageRecord: ProjectBidPackage) {
    if (!project) return;

    const nextScopeItemIds = packageRecord.scopeItemIds.filter((scopeItemId) =>
      isScopeItemCurrentlySelected(
        project.csiVersion,
        scopeItemId,
        selectedPackageScopeItems
      )
    );
    const staleScopeCount = packageRecord.scopeItemIds.length - nextScopeItemIds.length;

    if (staleScopeCount === 0) return;

    const shouldPrune = window.confirm(
      `Prune ${staleScopeCount} removed CSI tag${
        staleScopeCount === 1 ? "" : "s"
      } from ${packageRecord.name}? This will not delete bids or CSI selections.`
    );

    if (!shouldPrune) return;

    saveBidPackage({
      ...packageRecord,
      scopeItemIds: nextScopeItemIds,
      updatedAt: new Date().toISOString(),
    });
  }

  function openAddScopeModal() {
    setCsiSearchQuery("");
    setAddModalOpen(true);
  }

  function closeAddScopeModal() {
    setCsiSearchQuery("");
    setAddModalOpen(false);
  }

  function openDivisionEditor(
    divisionNode: CsiCatalogTreeNode,
    initialSearchQuery = ""
  ) {
    if (!project || !csiSelection) return;

    setAddModalOpen(false);
    setEditingDivisionId(divisionNode.item.divisionId);
    setStagedSelection({ ...csiSelection });
    setCsiSearchQuery(initialSearchQuery);
    setModalOpenedItemIds(getInitiallyExpandedIds(divisionNode, csiSelection));
  }

  function closeDivisionEditor() {
    setEditingDivisionId(undefined);
    setStagedSelection(undefined);
    setCsiSearchQuery("");
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
      `Remove ${division.number} - ${division.name} and all selected CSI tags under this division?`
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
    <AppShell title="Project Scope / Bid Packages">
      <div className="page-header">
        <div>
          <Link href={`/projects/${project.id}/setup`}>
            {"<-"} Back to Project Setup
          </Link>
          <p className="muted-text">
            {project.name} | {project.client} |{" "}
            {formatCsiMasterFormatVersion(project.csiVersion)}
          </p>
          <p className="project-scope-subtitle">
            Bid Packages are what subcontractors bid. CSI codes are tags used
            for scope clarity, matching, and leveling.
          </p>
        </div>
        <div className="page-header-actions">
          <Link
            href={`/projects/${project.id}/leveling`}
            className="button-secondary"
          >
            Bid Leveling
          </Link>
          <Link href={`/projects/${project.id}`} className="button-secondary">
            Command Center
          </Link>
        </div>
      </div>

      <section className="project-scope-primary-section">
        <div className="project-csi-section-header">
          <div>
            <p className="label-text">Primary Scope Builder</p>
            <h2>Bid Packages</h2>
            <p className="muted-text">
              Generate trade-based packages where rules exist, then use CSI
              hierarchy fallback for scope that needs review.
            </p>
          </div>
          <div className="settings-actions">
            <button
              type="button"
              className="button-secondary"
              onClick={generateBidPackages}
            >
              Generate Bid Packages
            </button>
            <button
              type="button"
              className="button-primary"
              onClick={() => setEditingBidPackage(null)}
            >
              Add Bid Package
            </button>
          </div>
        </div>

        <div className="project-scope-metrics">
          <span className="badge badge-muted">
            {bidPackages.length} bid package{bidPackages.length === 1 ? "" : "s"}
          </span>
          <span className="badge badge-muted">
            {selectedItemCount} selected CSI tag{selectedItemCount === 1 ? "" : "s"}
          </span>
          <span className="badge badge-muted">
            {selectedSummary.length} division{selectedSummary.length === 1 ? "" : "s"}
          </span>
        </div>

        {selectedPackageScopeItems.length === 0 ? (
          <div className="project-scope-empty-state">
            <strong>Select CSI tags before generating packages.</strong>
            <p className="muted-text">
              CSI tags feed trade-package generation and give each package the
              scope context used for matching and leveling.
            </p>
            <button
              type="button"
              className="button-secondary"
              onClick={openAddScopeModal}
            >
              Add CSI Tags
            </button>
          </div>
        ) : null}

        {bidPackages.length === 0 ? (
          <div className="project-scope-empty-state">
            <strong>No bid packages created yet.</strong>
            <p className="muted-text">
              Generate initial packages from selected CSI tags, then adjust the
              package list to match how subcontractors will bid the project.
            </p>
            <button
              type="button"
              className="button-secondary"
              onClick={generateBidPackages}
              disabled={selectedPackageScopeItems.length === 0}
            >
              Generate Bid Packages
            </button>
          </div>
        ) : (
          <div className="project-bid-package-grid">
            {bidPackages.map((packageRecord) => (
              <BidPackageCard
                key={packageRecord.id}
                packageRecord={packageRecord}
                csiVersion={project.csiVersion}
                selectedScopeItems={selectedPackageScopeItems}
                onEdit={() => setEditingBidPackage(packageRecord)}
                onDelete={() => deleteBidPackage(packageRecord)}
                onPruneRemovedScopes={() => pruneBidPackageScopes(packageRecord)}
              />
            ))}
          </div>
        )}
      </section>

      <section className="project-csi-support-section">
        <div className="project-csi-section-header">
          <div>
            <p className="label-text">Supporting Tags</p>
            <h2>CSI Tags</h2>
            <p className="muted-text">
              Add CSI tags to support package scope. Search by code, title,
              division, or parent context; selected child tags remain grouped
              under their Division and Subdivision.
            </p>
          </div>
          <button
            type="button"
            className="button-secondary"
            onClick={openAddScopeModal}
          >
            Add CSI Tags
          </button>
        </div>

        {selectedSummary.length === 0 ? (
          <p className="muted-text">No CSI tags selected yet.</p>
        ) : (
          <div className="project-csi-division-card-grid project-csi-support-grid">
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
                <h2 id="add-csi-scope-title">Add CSI Tags</h2>
                <p className="muted-text">
                  Search by CSI code, title, or parent text, then choose a
                  Division to add or edit project CSI tags.
                </p>
              </div>
            </div>
            <div className="modal-body project-csi-modal-body">
              <CsiScopeSearchField
                value={csiSearchQuery}
                resultCount={filteredDivisionNodes.length}
                onChange={setCsiSearchQuery}
                onClear={() => setCsiSearchQuery("")}
              />
              <div className="project-csi-division-picker">
                {filteredDivisionNodes.length === 0 ? (
                  <p className="muted-text">No CSI tags match this search.</p>
                ) : null}
                {filteredDivisionNodes.map((divisionNode) => {
                  const summary = selectedSummaryByDivisionId.get(
                    divisionNode.item.divisionId
                  );

                  return (
                    <button
                      type="button"
                      key={divisionNode.item.id}
                      className="project-csi-division-choice"
                      onClick={() =>
                        openDivisionEditor(divisionNode, csiSearchQuery)
                      }
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
                <h2 id="edit-csi-division-title">Edit Division CSI Tags</h2>
                <div className="project-csi-modal-heading">
                  <CsiCodeLabel item={editingDivisionNode.item} showLevelBadge />
                </div>
              </div>
            </div>
            <div className="modal-body project-csi-modal-body">
              <CsiScopeSearchField
                value={csiSearchQuery}
                resultCount={visibleEditingDivisionChildren.length}
                onChange={setCsiSearchQuery}
                onClear={() => setCsiSearchQuery("")}
              />
              <p className="muted-text">
                Selecting child tags keeps their parent division active for
                context. Clearing a parent row does not remove selected child
                tags.
              </p>
              <div className="project-csi-tree">
                <BroadDivisionRow
                  division={editingDivisionNode.item}
                  stagedSelection={stagedSelection}
                  onToggle={toggleStagedItem}
                />
                {visibleEditingDivisionChildren.length === 0 ? (
                  <p className="muted-text">
                    No CSI tags in this division match this search.
                  </p>
                ) : null}
                {visibleEditingDivisionChildren.map((childNode) => (
                  <ProjectCsiTreeNode
                    key={childNode.item.id}
                    node={childNode}
                    depth={0}
                    openedItemIds={visibleModalOpenedItemIds}
                    stagedSelection={stagedSelection}
                    showHierarchyPath={Boolean(csiSearchQuery.trim())}
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

      {editingBidPackage !== undefined && (
        <BidPackageEditorModal
          project={project}
          packageRecord={editingBidPackage}
          selectedSummary={selectedSummary}
          selectedScopeItems={selectedPackageScopeItems}
          onCancel={() => setEditingBidPackage(undefined)}
          onSave={(packageRecord) => {
            saveBidPackage(packageRecord);
            setEditingBidPackage(undefined);
          }}
        />
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
  const subdivisionGroups = groupPackageScopeItems(division.version, childItems);

  return (
    <article className="project-csi-division-card">
      <div className="project-csi-division-card-header">
        <div>
          <CsiCodeLabel item={division} showLevelBadge />
          <p className="muted-text">
            {getSelectedItemCount(selectedItems)} selected CSI tags
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
        <p className="muted-text">No subdivision, section, or subsection tags selected.</p>
      ) : (
        <div className="project-csi-selected-hierarchy">
          {subdivisionGroups.map((group) => (
            <div className="project-csi-selected-group" key={group.key}>
              <div className="project-csi-selected-group-heading">
                {group.subdivision ? (
                  <CsiCodeLabel item={group.subdivision} showLevelBadge />
                ) : (
                  <span>Ungrouped CSI tags</span>
                )}
              </div>
              <div className="badge-list">
                {group.items.map((item) => (
                  <span key={item.id} className="badge badge-muted">
                    <CsiCodeLabel item={item} showLevelBadge />
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}

function CsiScopeSearchField({
  value,
  resultCount,
  onChange,
  onClear,
}: {
  value: string;
  resultCount: number;
  onChange: (value: string) => void;
  onClear: () => void;
}) {
  return (
    <div className="project-csi-search">
      <label className="form-field">
        Search CSI tags
        <input
          value={value}
        placeholder="Search code, title, division, or parent..."
          onChange={(event) => onChange(event.target.value)}
        />
      </label>
      <div className="project-csi-search-actions">
        <span className="badge badge-muted">
          {value.trim() ? `${resultCount} result group(s)` : "All tags"}
        </span>
        {value.trim() ? (
          <button type="button" className="button-secondary" onClick={onClear}>
            Clear
          </button>
        ) : null}
      </div>
    </div>
  );
}

function BidPackageCard({
  packageRecord,
  csiVersion,
  selectedScopeItems,
  onEdit,
  onDelete,
  onPruneRemovedScopes,
}: {
  packageRecord: ProjectBidPackage;
  csiVersion: Project["csiVersion"];
  selectedScopeItems: CsiCatalogItem[];
  onEdit: () => void;
  onDelete: () => void;
  onPruneRemovedScopes: () => void;
}) {
  const mappedItems = packageRecord.scopeItemIds
    .map((scopeItemId) => resolveProjectCsiItem(csiVersion, scopeItemId))
    .filter(isDefined);
  const staleScopeItemIds = packageRecord.scopeItemIds.filter(
    (scopeItemId) =>
      !isScopeItemCurrentlySelected(csiVersion, scopeItemId, selectedScopeItems)
  );
  const staleItems = staleScopeItemIds.map((scopeItemId) => ({
    id: scopeItemId,
    item: resolveProjectCsiItem(csiVersion, scopeItemId),
  }));
  const packageNeedsAttention = packageRecord.scopeItemIds.length === 0;

  return (
    <article className="project-bid-package-card">
      <div className="project-csi-division-card-header">
        <div>
          <h3 style={{ marginTop: 0 }}>{packageRecord.name}</h3>
          {packageRecord.description ? (
            <p className="muted-text">{packageRecord.description}</p>
          ) : null}
          <div className="badge-list">
            <span className="badge badge-muted">
              {packageRecord.scopeItemIds.length} CSI tag
              {packageRecord.scopeItemIds.length === 1 ? "" : "s"}
            </span>
            <span className="badge badge-primary">
              {formatStatus(packageRecord.status ?? "DRAFT")}
            </span>
            {packageRecord.source ? (
              <span className="badge badge-muted">
                {formatStatus(packageRecord.source)}
              </span>
            ) : null}
            {staleScopeItemIds.length > 0 ? (
              <span className="badge badge-warning">
                {staleScopeItemIds.length} removed tag
                {staleScopeItemIds.length === 1 ? "" : "s"}
              </span>
            ) : null}
            {packageNeedsAttention ? (
              <span className="badge badge-warning">Needs Attention</span>
            ) : null}
          </div>
        </div>
        <div className="settings-actions">
          {staleScopeItemIds.length > 0 ? (
            <button
              type="button"
              className="button-secondary"
              onClick={onPruneRemovedScopes}
            >
              Prune Removed Tags
            </button>
          ) : null}
          <button type="button" className="button-secondary" onClick={onEdit}>
            Edit
          </button>
          <button type="button" className="button-secondary" onClick={onDelete}>
            Delete
          </button>
        </div>
      </div>

      {staleScopeItemIds.length > 0 ? (
        <div style={{ marginBottom: 12 }}>
          <p className="form-error">
            This package includes CSI tags that are no longer selected for the
            project.
          </p>
          <div className="badge-list">
            {staleItems.map(({ id, item }) => (
              <span key={id} className="badge badge-warning">
                {item ? <CsiCodeLabel item={item} showLevelBadge /> : id}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {mappedItems.length === 0 ? (
        <p className="muted-text">
          No mapped CSI tags. This package needs mapped tags before it can
          drive invites or leveling.
        </p>
      ) : (
        <div className="badge-list">
          {mappedItems.map((item) => (
            <span key={item.id} className="badge badge-muted">
              <CsiCodeLabel item={item} showLevelBadge />
            </span>
          ))}
        </div>
      )}
    </article>
  );
}

function BidPackageEditorModal({
  project,
  packageRecord,
  selectedSummary,
  selectedScopeItems,
  onCancel,
  onSave,
}: {
  project: Project;
  packageRecord: ProjectBidPackage | null;
  selectedSummary: Array<{ division: CsiCatalogItem; items: CsiCatalogItem[] }>;
  selectedScopeItems: CsiCatalogItem[];
  onCancel: () => void;
  onSave: (packageRecord: ProjectBidPackage) => void;
}) {
  const [name, setName] = useState(packageRecord?.name ?? "");
  const [description, setDescription] = useState(
    packageRecord?.description ?? ""
  );
  const [status, setStatus] = useState<ProjectBidPackageStatus>(
    packageRecord?.status ?? "DRAFT"
  );
  const [scopeItemIds, setScopeItemIds] = useState<string[]>(
    packageRecord?.scopeItemIds ?? []
  );
  const [error, setError] = useState<string | undefined>();
  const validSelectedScopeItemIds = new Set(
    selectedScopeItems.map((item) => item.id)
  );

  function toggleScope(scopeItemId: string, checked: boolean) {
    setScopeItemIds((currentIds) =>
      checked
        ? addUnique(currentIds, scopeItemId)
        : currentIds.filter((itemId) => itemId !== scopeItemId)
    );
  }

  function handleSave() {
    const trimmedName = name.trim();
    const validScopeItemIds = scopeItemIds.filter((scopeItemId) =>
      validSelectedScopeItemIds.has(scopeItemId)
    );

    if (!trimmedName) {
      setError("Enter a bid package name.");
      return;
    }

    const now = new Date().toISOString();

    onSave({
      id: packageRecord?.id ?? createBidPackageId(project.id),
      projectId: project.id,
      name: trimmedName,
      description: description.trim() || undefined,
      csiVersion: project.csiVersion,
      scopeItemIds: validScopeItemIds,
      sortOrder: packageRecord?.sortOrder,
      status,
      source: packageRecord?.source ?? "MANUAL",
      createdAt: packageRecord?.createdAt ?? now,
      updatedAt: now,
    });
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section
        className="modal-card project-csi-editor-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bid-package-editor-title"
      >
        <div className="modal-header">
          <div>
            <h2 id="bid-package-editor-title">
              {packageRecord ? "Edit Bid Package" : "Add Bid Package"}
            </h2>
            <p className="muted-text">
              Assign only CSI tags already selected for this project.
            </p>
          </div>
        </div>

        <div className="modal-body project-csi-modal-body">
          {error ? <p className="form-error">{error}</p> : null}

          <div className="project-setup-card-grid">
            <label>
              <span className="label-text">Package Name</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </label>
            <label>
              <span className="label-text">Status</span>
              <select
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as ProjectBidPackageStatus)
                }
              >
                {bidPackageStatuses.map((packageStatus) => (
                  <option key={packageStatus} value={packageStatus}>
                    {formatStatus(packageStatus)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label>
            <span className="label-text">Description</span>
            <textarea
              value={description}
              rows={3}
              onChange={(event) => setDescription(event.target.value)}
            />
          </label>

          <div style={{ marginTop: 16 }}>
            <h3>Mapped CSI Tags</h3>
            {selectedScopeItems.length === 0 ? (
              <p className="muted-text">
                No project CSI tags are selected yet.
              </p>
            ) : (
              <div className="project-csi-tree">
                {selectedSummary.map((summary) => (
                  <BidPackageScopeDivision
                    key={summary.division.id}
                    division={summary.division}
                    items={summary.items}
                    selectedScopeItemIds={scopeItemIds}
                    onToggleScope={toggleScope}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="button-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="button-primary" onClick={handleSave}>
            Save Bid Package
          </button>
        </div>
      </section>
    </div>
  );
}

function BidPackageScopeDivision({
  division,
  items,
  selectedScopeItemIds,
  onToggleScope,
}: {
  division: CsiCatalogItem;
  items: CsiCatalogItem[];
  selectedScopeItemIds: string[];
  onToggleScope: (scopeItemId: string, checked: boolean) => void;
}) {
  const divisionItem = items.find((item) => item.level === 1);
  const childItems = items.filter((item) => item.level > 1);
  const subdivisionGroups = groupPackageScopeItems(division.version, childItems);

  return (
    <div className="project-csi-tree-node">
      <div className="project-csi-tree-row" style={{ "--tree-depth": 0 } as React.CSSProperties}>
        <span className="project-csi-tree-toggle" />
        <div className="project-csi-tree-item">
          <span className="project-csi-tree-label">
            <CsiCodeLabel item={division} showLevelBadge />
          </span>
        </div>
      </div>

      {divisionItem ? (
        <BidPackageScopeCheckbox
          item={divisionItem}
          depth={1}
          checked={selectedScopeItemIds.includes(divisionItem.id)}
          onToggleScope={onToggleScope}
        />
      ) : null}

      {subdivisionGroups.map((group) => (
        <div key={group.key} className="project-csi-tree-node">
          <div
            className="project-csi-tree-row"
            style={{ "--tree-depth": 1 } as React.CSSProperties}
          >
            <span className="project-csi-tree-toggle" />
            <div className="project-csi-tree-item">
              <span className="project-csi-tree-label">
                {group.subdivision ? (
                  <CsiCodeLabel item={group.subdivision} showLevelBadge />
                ) : (
                  "Ungrouped CSI tags"
                )}
              </span>
            </div>
          </div>
          {group.items.map((item) => (
            <BidPackageScopeCheckbox
              key={item.id}
              item={item}
              depth={2}
              checked={selectedScopeItemIds.includes(item.id)}
              onToggleScope={onToggleScope}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function BidPackageScopeCheckbox({
  item,
  depth,
  checked,
  onToggleScope,
}: {
  item: CsiCatalogItem;
  depth: number;
  checked: boolean;
  onToggleScope: (scopeItemId: string, checked: boolean) => void;
}) {
  return (
    <div
      className="project-csi-tree-row"
      style={{ "--tree-depth": depth } as React.CSSProperties}
    >
      <span className="project-csi-tree-toggle" />
      <label className="project-csi-tree-item">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onToggleScope(item.id, event.target.checked)}
        />
        <span className="project-csi-tree-label">
          <CsiCodeLabel item={item} />
          {item.level > 1 ? <CsiHierarchyPath item={item} /> : null}
        </span>
        <CsiLevelBadge item={item} />
      </label>
    </div>
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
  const divisionSelected = stagedSelection.divisionIds.includes(
    division.divisionId
  );
  const hasSelectedChildScopes = stagedSelection.sectionIds.some((sectionId) => {
    const selectedItem = resolveProjectCsiItem(division.version, sectionId);

    return selectedItem?.divisionId === division.divisionId;
  });
  const isPartiallySelected = !divisionSelected && hasSelectedChildScopes;

  return (
    <label
      className={[
        "project-csi-tree-item",
        "project-csi-broad-row",
        isPartiallySelected ? "project-csi-tree-item-partial" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <input
        type="checkbox"
        checked={divisionSelected}
        onChange={(event) => onToggle(division, event.target.checked)}
      />
      <span className="project-csi-tree-label">
        <CsiCodeLabel item={division} />
      </span>
      <span className="project-csi-tree-meta">
        <span className="badge badge-primary">Division parent</span>
        {isPartiallySelected ? (
          <span className="badge badge-warning">Partial</span>
        ) : null}
      </span>
    </label>
  );
}

function ProjectCsiTreeNode({
  node,
  depth,
  openedItemIds,
  stagedSelection,
  showHierarchyPath,
  onToggleExpanded,
  onToggleItem,
}: {
  node: CsiCatalogTreeNode;
  depth: number;
  openedItemIds: string[];
  stagedSelection: StoredProjectCsiSelection;
  showHierarchyPath: boolean;
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
  const hasSelectedDescendants =
    getSelectedDescendantCount(node, stagedSelection) > 0;
  const isPartiallySelected = !isSelected && hasSelectedDescendants;

  return (
    <div className="project-csi-tree-node">
      <div
        className={[
          "project-csi-tree-row",
          isPartiallySelected ? "project-csi-tree-row-partial" : "",
        ]
          .filter(Boolean)
          .join(" ")}
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

        <label
          className={[
            "project-csi-tree-item",
            isPartiallySelected ? "project-csi-tree-item-partial" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(event) => onToggleItem(node.item, event.target.checked)}
          />
          <span className="project-csi-tree-label">
            <CsiCodeLabel item={node.item} />
            {showHierarchyPath && node.item.level > 1 ? (
              <CsiHierarchyPath item={node.item} />
            ) : null}
          </span>
          <span className="project-csi-tree-meta">
            <CsiLevelBadge item={node.item} />
            {isPartiallySelected ? (
              <span className="badge badge-warning">Partial</span>
            ) : null}
          </span>
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
            showHierarchyPath={showHierarchyPath}
            onToggleExpanded={onToggleExpanded}
            onToggleItem={onToggleItem}
          />
        ))}
    </div>
  );
}

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

function getVisibleCsiTreeNodes(
  nodes: CsiCatalogTreeNode[],
  searchQuery: string
): CsiCatalogTreeNode[] {
  const normalizedQuery = normalizeCsiSearchText(searchQuery);

  if (!normalizedQuery) return nodes;

  return nodes
    .map((node) => filterCsiTreeNodeBySearch(node, normalizedQuery))
    .filter(isDefined);
}

function filterCsiTreeNodeBySearch(
  node: CsiCatalogTreeNode,
  normalizedQuery: string
): CsiCatalogTreeNode | undefined {
  if (doesCsiItemMatchSearch(node.item, normalizedQuery)) return node;

  const children = node.children
    .map((childNode) => filterCsiTreeNodeBySearch(childNode, normalizedQuery))
    .filter(isDefined);

  return children.length > 0 ? { ...node, children } : undefined;
}

function doesCsiTreeNodeMatchSearch(
  node: CsiCatalogTreeNode,
  searchQuery: string
) {
  return Boolean(
    filterCsiTreeNodeBySearch(node, normalizeCsiSearchText(searchQuery))
  );
}

function doesCsiItemMatchSearch(
  item: CsiCatalogItem,
  normalizedQuery: string
) {
  if (!normalizedQuery) return true;

  const parentText = getCsiAncestors(item.version, item.id)
    .map((ancestor) => `${ancestor.number} ${ancestor.name}`)
    .join(" ");
  const searchableText = normalizeCsiSearchText(
    `${item.number} ${item.name} ${parentText}`
  );

  return searchableText.includes(normalizedQuery);
}

function normalizeCsiSearchText(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function getExpandableTreeNodeIds(nodes: CsiCatalogTreeNode[]) {
  const itemIds = new Set<string>();

  function walk(node: CsiCatalogTreeNode) {
    if (node.children.length > 0) itemIds.add(node.item.id);
    node.children.forEach(walk);
  }

  nodes.forEach(walk);

  return Array.from(itemIds);
}

function getSelectedDescendantCount(
  node: CsiCatalogTreeNode,
  selection: StoredProjectCsiSelection
): number {
  return node.children.reduce((count, childNode) => {
    const childSelected = isProjectCsiItemSelected(
      childNode.item.version,
      selection.sectionIds,
      childNode.item.id
    );

    return (
      count +
      (childSelected ? 1 : 0) +
      getSelectedDescendantCount(childNode, selection)
    );
  }, 0);
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

function useProjectBidPackagesSnapshot(projectId: string): ProjectBidPackage[] {
  return useSyncExternalStore(
    subscribeToProjectBidPackagesStorage,
    () => getProjectBidPackagesSnapshot(projectId),
    getServerProjectBidPackagesSnapshot
  );
}

function subscribeToProjectBidPackagesStorage(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(bidPackagesChangeEvent, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(bidPackagesChangeEvent, onStoreChange);
  };
}

function getServerProjectBidPackagesSnapshot(): ProjectBidPackage[] {
  return EMPTY_PROJECT_BID_PACKAGES;
}

function getProjectBidPackagesSnapshot(projectId: string): ProjectBidPackage[] {
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

function groupPackageScopeItems(
  csiVersion: Project["csiVersion"],
  items: CsiCatalogItem[]
) {
  const groups = new Map<
    string,
    {
      key: string;
      subdivision?: CsiCatalogItem;
      items: CsiCatalogItem[];
    }
  >();

  items.forEach((item) => {
    const subdivision =
      item.level === 2 ? item : getNearestLevel2Ancestor(csiVersion, item.id);
    const key = subdivision?.id ?? "ungrouped";
    const group =
      groups.get(key) ??
      {
        key,
        subdivision,
        items: [],
      };

    group.items.push(item);
    groups.set(key, group);
  });

  return Array.from(groups.values()).map((group) => ({
    ...group,
    items: group.items.sort(compareCsiItems),
  }));
}

function isScopeItemCurrentlySelected(
  csiVersion: Project["csiVersion"],
  scopeItemId: string,
  selectedScopeItems: CsiCatalogItem[]
) {
  return selectedScopeItems.some((item) =>
    projectCsiIdsReferToSameItem(csiVersion, scopeItemId, item.id)
  );
}

function compareCsiItems(itemA: CsiCatalogItem, itemB: CsiCatalogItem) {
  return itemA.number.localeCompare(itemB.number, undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

function createBidPackageId(projectId: string) {
  const randomPart =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Date.now().toString();

  return `bid-package-${projectId}-${randomPart}`;
}

function formatCsiMasterFormatVersion(value: string) {
  if (value === "MASTERFORMAT_1995") return "MasterFormat 1995 / 16-Division";

  return "MasterFormat 2004+ / 50-Division";
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
