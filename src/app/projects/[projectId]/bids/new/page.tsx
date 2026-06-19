"use client";

import {
  FormEvent,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { CsiCodeLabel } from "@/components/csi";
import AppShell from "@/components/layout/AppShell";
import Panel from "@/components/ui/Panel";
import { saveProjectBidSubmission } from "@/lib/projectBids";
import { getMergedProjects, projectsStorageKey } from "@/lib/projects";
import {
  getProjectSelectedCsiItems,
  validateProjectCsiSelection,
} from "@/lib/projectCsiSelections";
import {
  getMergedSubcontractors,
  subcontractorsStorageKey,
} from "@/lib/subcontractors";
import {
  BidPricingItem,
  BidPricingItemCategory,
  BidPricingItemDirection,
  BidPricingItemSource,
  ProjectBidSubmissionStatus,
} from "@/types/Bid";
import {
  CsiCatalogItem,
  StoredProjectCsiSelections,
} from "@/types/Csi";
import { Project } from "@/types/Project";
import { Subcontractor } from "@/types/Subcontractor";

const projectCsiSelectionsStorageKey = "projectCsiSelections";
const EMPTY_PROJECT_CSI_SELECTIONS: StoredProjectCsiSelections = {};
const bidStatuses: ProjectBidSubmissionStatus[] = [
  "DRAFT",
  "RECEIVED",
  "REVIEWED",
  "LEVELED",
  "SELECTED",
  "REJECTED",
];
const pricingItemCategories: BidPricingItemCategory[] = [
  "ALTERNATE",
  "LEVELING_ADJUSTMENT",
  "ALLOWANCE",
  "UNIT_PRICE",
  "CONTINGENCY",
  "TAX",
  "BOND",
  "FEE",
  "OTHER",
];
const pricingItemDirections: BidPricingItemDirection[] = [
  "ADD",
  "DEDUCT",
  "INCLUDED",
  "EXCLUDED",
  "INFORMATIONAL",
];
const submittedPricingItemSource: BidPricingItemSource = "SUBMITTED";
const sourceDocumentTypes = ["PDF", "WORD", "EXCEL", "EMAIL", "OTHER"] as const;

type SourceDocumentType = (typeof sourceDocumentTypes)[number];

type PricingItemDraft = {
  id: string;
  category: BidPricingItemCategory;
  direction: BidPricingItemDirection;
  label: string;
  amount: string;
  quantity: string;
  unit: string;
  unitRate: string;
  notes: string;
  isAccepted: boolean;
};

export default function ManualBidEntryPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawProjectId = params.projectId;
  const requestedScopeItemId = searchParams.get("scopeItemId") ?? "";
  const projectId = Array.isArray(rawProjectId) ? rawProjectId[0] : rawProjectId;
  const projects = useProjectsSnapshot();
  const subcontractors = useSubcontractorsSnapshot();
  const projectCsiSelections = useProjectCsiSelectionsSnapshot();
  const project = projects.find((item) => item.id === projectId);
  const [subcontractorId, setSubcontractorId] = useState("");
  const [subcontractorName, setSubcontractorName] = useState("");
  const [receivedBy, setReceivedBy] = useState("");
  const [submittedAt, setSubmittedAt] = useState(getTodayDateValue());
  const [selectedScopeItemIds, setSelectedScopeItemIds] = useState<string[]>(
    () => (requestedScopeItemId ? [requestedScopeItemId] : [])
  );
  const [primaryScopeItemId, setPrimaryScopeItemId] =
    useState(requestedScopeItemId);
  const [baseBidAmount, setBaseBidAmount] = useState("");
  const [status, setStatus] = useState<ProjectBidSubmissionStatus>("RECEIVED");
  const [inclusions, setInclusions] = useState("");
  const [exclusions, setExclusions] = useState("");
  const [clarifications, setClarifications] = useState("");
  const [qualifications, setQualifications] = useState("");
  const [notes, setNotes] = useState("");
  const [sourceDocumentName, setSourceDocumentName] = useState("");
  const [sourceDocumentType, setSourceDocumentType] =
    useState<SourceDocumentType>("PDF");
  const [sourceDocumentNotes, setSourceDocumentNotes] = useState("");
  const [pricingItemDrafts, setPricingItemDrafts] = useState<
    PricingItemDraft[]
  >([]);
  const [errors, setErrors] = useState<string[]>([]);

  const activeSubcontractors = useMemo(
    () =>
      subcontractors
        .filter((subcontractor) => !subcontractor.archived)
        .sort((a, b) => a.companyName.localeCompare(b.companyName)),
    [subcontractors]
  );
  const selectedSubcontractor = activeSubcontractors.find(
    (subcontractor) => subcontractor.id === subcontractorId
  );
  const selectedCsiItems = useMemo(() => {
    if (!project) return [];

    return getProjectSelectedCsiItems(
      project.csiVersion,
      projectCsiSelections[project.id]
    );
  }, [project, projectCsiSelections]);

  if (!project) {
    return (
      <AppShell title="Project Not Found">
        <h1>Project Not Found</h1>
        <p>Requested project ID: {projectId}</p>
        <Link href="/">Back to Dashboard</Link>
      </AppShell>
    );
  }

  function handleSubcontractorChange(nextSubcontractorId: string) {
    setSubcontractorId(nextSubcontractorId);

    const subcontractor = activeSubcontractors.find(
      (item) => item.id === nextSubcontractorId
    );

    if (subcontractor) setSubcontractorName(subcontractor.companyName);
  }

  function toggleScopeItem(scopeItemId: string, checked: boolean) {
    setSelectedScopeItemIds((currentScopeItemIds) => {
      const nextScopeItemIds = checked
        ? addUnique(currentScopeItemIds, scopeItemId)
        : currentScopeItemIds.filter((itemId) => itemId !== scopeItemId);

      if (!nextScopeItemIds.includes(primaryScopeItemId)) {
        setPrimaryScopeItemId(nextScopeItemIds[0] ?? "");
      }

      return nextScopeItemIds;
    });
  }

  function addPricingItemDraft(
    category: BidPricingItemCategory = "OTHER",
    direction: BidPricingItemDirection = "ADD",
    label = ""
  ) {
    setPricingItemDrafts((currentDrafts) => [
      ...currentDrafts,
      createPricingItemDraft(category, direction, label),
    ]);
  }

  function updatePricingItemDraft(
    itemDraftId: string,
    updates: Partial<PricingItemDraft>
  ) {
    setPricingItemDrafts((currentDrafts) =>
      currentDrafts.map((itemDraft) =>
        itemDraft.id === itemDraftId ? { ...itemDraft, ...updates } : itemDraft
      )
    );
  }

  function removePricingItemDraft(itemDraftId: string) {
    setPricingItemDrafts((currentDrafts) =>
      currentDrafts.filter((itemDraft) => itemDraft.id !== itemDraftId)
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!project) {
      setErrors(["Project not found."]);
      return;
    }

    const trimmedSubcontractorName = subcontractorName.trim();
    const parsedBaseBidAmount = parseCurrencyValue(baseBidAmount);
    const validSelectedScopeItemIds = selectedScopeItemIds.filter((scopeItemId) =>
      selectedCsiItems.some((item) => item.id === scopeItemId)
    );
    const nextErrors: string[] = [];

    if (!subcontractorId && !trimmedSubcontractorName) {
      nextErrors.push("Select a subcontractor or enter a subcontractor name.");
    }

    if (selectedCsiItems.length > 0 && validSelectedScopeItemIds.length === 0) {
      nextErrors.push("Select at least one project CSI scope.");
    }

    if (parsedBaseBidAmount === undefined) {
      nextErrors.push("Enter a base bid amount.");
    }

    const pricingItems = buildPricingItems(pricingItemDrafts);
    if (pricingItems === undefined && pricingItemDrafts.length > 0) {
      nextErrors.push("Complete pricing item labels before saving.");
    }

    if (nextErrors.length > 0) {
      setErrors(nextErrors);
      return;
    }

    const now = new Date().toISOString();
    const sourceDocumentNote = getSourceDocumentNote(
      sourceDocumentName,
      sourceDocumentType,
      sourceDocumentNotes
    );
    const validSelection = validateProjectCsiSelection(
      projectCsiSelections[project.id],
      project.csiVersion
    );
    const primaryScope =
      selectedCsiItems.find((item) => item.id === primaryScopeItemId) ??
      selectedCsiItems.find((item) => validSelectedScopeItemIds.includes(item.id));

    saveProjectBidSubmission({
      id: createBidSubmissionId(project.id),
      projectId: project.id,
      subcontractorId: subcontractorId || undefined,
      subcontractorName:
        selectedSubcontractor?.companyName ?? trimmedSubcontractorName,
      csiVersion: validSelection.version,
      scopeItemIds: validSelectedScopeItemIds,
      primaryScopeItemId: primaryScope?.id,
      divisionId: primaryScope?.divisionId,
      subdivisionId: primaryScope?.level === 2 ? primaryScope.id : undefined,
      baseBidAmount: parsedBaseBidAmount,
      status,
      submittedAt: submittedAt || undefined,
      receivedBy: emptyToUndefined(receivedBy),
      pricingItems,
      inclusions: parseListTextarea(inclusions),
      exclusions: parseListTextarea(exclusions),
      clarifications: parseListTextarea(clarifications),
      qualifications: parseListTextarea(qualifications),
      notes: combineNotes(notes, sourceDocumentNote),
      attachments: buildSourceDocumentAttachments(sourceDocumentName, now),
      createdAt: now,
      updatedAt: now,
    });

    router.push(`/projects/${project.id}`);
  }

  return (
    <AppShell title="Manual Bid Entry">
      <div className="command-center">
        <Link href={`/projects/${project.id}`}>{"<-"} Command Center</Link>

        <Panel title="Manual Bid Entry">
          <p className="muted-text">
            {project.name} | {project.client} | {formatStatus(project.status)}
          </p>
          <div className="settings-actions">
            <Link href={`/projects/${project.id}`} className="button-secondary">
              Command Center
            </Link>
            <Link
              href={`/projects/${project.id}/scope`}
              className="button-secondary"
            >
              Project Scope
            </Link>
            <Link
              href={`/projects/${project.id}/invite`}
              className="button-secondary"
            >
              Invites
            </Link>
          </div>
        </Panel>

        <form onSubmit={handleSubmit} className="project-setup-shell">
          {errors.length > 0 ? (
            <Panel title="Check Required Fields">
              <ul>
                {errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </Panel>
          ) : null}

          <Panel title="Subcontractor">
            <div style={formGrid}>
              <label className="form-field">
                <span className="label-text">Existing Subcontractor</span>
                <select
                  className="form-input"
                  value={subcontractorId}
                  onChange={(event) =>
                    handleSubcontractorChange(event.target.value)
                  }
                >
                  <option value="">Manual entry</option>
                  {activeSubcontractors.map((subcontractor) => (
                    <option key={subcontractor.id} value={subcontractor.id}>
                      {subcontractor.companyName}
                    </option>
                  ))}
                </select>
              </label>
              <label className="form-field">
                <span className="label-text">Subcontractor Name</span>
                <input
                  className="form-input"
                  value={subcontractorName}
                  onChange={(event) => setSubcontractorName(event.target.value)}
                />
              </label>
              <label className="form-field">
                <span className="label-text">Received By</span>
                <input
                  className="form-input"
                  value={receivedBy}
                  onChange={(event) => setReceivedBy(event.target.value)}
                />
              </label>
              <label className="form-field">
                <span className="label-text">Submitted At</span>
                <input
                  type="date"
                  className="form-input"
                  value={submittedAt}
                  onChange={(event) => setSubmittedAt(event.target.value)}
                />
              </label>
            </div>
          </Panel>

          <Panel title="Scope">
            {selectedCsiItems.length === 0 ? (
              <p className="muted-text">
                No project CSI scopes selected yet.{" "}
                <Link href={`/projects/${project.id}/scope`}>Project Scope</Link>
              </p>
            ) : (
              <div style={scopeList}>
                {selectedCsiItems.map((item) => (
                  <ScopeCheckbox
                    key={item.id}
                    item={item}
                    checked={selectedScopeItemIds.includes(item.id)}
                    primaryScopeItemId={primaryScopeItemId}
                    onCheckedChange={toggleScopeItem}
                    onPrimaryChange={setPrimaryScopeItemId}
                  />
                ))}
              </div>
            )}
          </Panel>

          <Panel title="Pricing">
            <div style={formGrid}>
              <label className="form-field">
                <span className="label-text">Base Bid Amount</span>
                <input
                  className="form-input"
                  inputMode="decimal"
                  value={baseBidAmount}
                  onChange={(event) => setBaseBidAmount(event.target.value)}
                  placeholder="$0"
                />
              </label>
              <label className="form-field">
                <span className="label-text">Status</span>
                <select
                  className="form-input"
                  value={status}
                  onChange={(event) =>
                    setStatus(event.target.value as ProjectBidSubmissionStatus)
                  }
                >
                  {bidStatuses.map((bidStatus) => (
                    <option key={bidStatus} value={bidStatus}>
                      {formatStatus(bidStatus)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </Panel>

          <Panel title="Pricing Items">
            <div className="settings-actions">
              <button
                type="button"
                className="button-secondary"
                onClick={() =>
                  addPricingItemDraft("ALTERNATE", "ADD", "Alternate Add")
                }
              >
                Alternate Add
              </button>
              <button
                type="button"
                className="button-secondary"
                onClick={() =>
                  addPricingItemDraft("ALTERNATE", "DEDUCT", "Alternate Deduct")
                }
              >
                Alternate Deduct
              </button>
              <button
                type="button"
                className="button-secondary"
                onClick={() =>
                  addPricingItemDraft("ALLOWANCE", "INCLUDED", "Allowance")
                }
              >
                Allowance
              </button>
              <button
                type="button"
                className="button-secondary"
                onClick={() =>
                  addPricingItemDraft("UNIT_PRICE", "INFORMATIONAL", "Unit Price")
                }
              >
                Unit Price
              </button>
            </div>

            {pricingItemDrafts.length === 0 ? (
              <p className="muted-text" style={{ marginTop: 12 }}>
                Add alternates, allowances, unit prices, or other submitted
                pricing items as needed.
              </p>
            ) : (
              <div style={pricingItemList}>
                {pricingItemDrafts.map((itemDraft) => (
                  <PricingItemRow
                    key={itemDraft.id}
                    itemDraft={itemDraft}
                    onChange={updatePricingItemDraft}
                    onRemove={removePricingItemDraft}
                  />
                ))}
              </div>
            )}
          </Panel>

          <Panel title="Source Document">
            <p className="muted-text">
              Capture source metadata now. File upload can connect here later.
            </p>
            <div style={formGrid}>
              <label className="form-field">
                <span className="label-text">Source Document Name</span>
                <input
                  className="form-input"
                  value={sourceDocumentName}
                  onChange={(event) =>
                    setSourceDocumentName(event.target.value)
                  }
                />
              </label>
              <label className="form-field">
                <span className="label-text">Source Document Type</span>
                <select
                  className="form-input"
                  value={sourceDocumentType}
                  onChange={(event) =>
                    setSourceDocumentType(event.target.value as SourceDocumentType)
                  }
                >
                  {sourceDocumentTypes.map((documentType) => (
                    <option key={documentType} value={documentType}>
                      {formatStatus(documentType)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="form-field" style={{ marginTop: 12 }}>
              <span className="label-text">Source Document Notes</span>
              <textarea
                className="form-input"
                value={sourceDocumentNotes}
                onChange={(event) => setSourceDocumentNotes(event.target.value)}
                rows={3}
              />
            </label>
          </Panel>

          <Panel title="Notes">
            <div style={notesGrid}>
              <BidTextarea
                label="Inclusions"
                value={inclusions}
                onChange={setInclusions}
              />
              <BidTextarea
                label="Exclusions"
                value={exclusions}
                onChange={setExclusions}
              />
              <BidTextarea
                label="Clarifications"
                value={clarifications}
                onChange={setClarifications}
              />
              <BidTextarea
                label="Qualifications"
                value={qualifications}
                onChange={setQualifications}
              />
              <label className="form-field">
                <span className="label-text">Notes</span>
                <textarea
                  className="form-input"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={4}
                />
              </label>
            </div>
          </Panel>

          <div className="settings-actions">
            <button type="submit" className="button-primary">
              Save Bid
            </button>
            <Link href={`/projects/${project.id}`} className="button-secondary">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </AppShell>
  );
}

function ScopeCheckbox({
  item,
  checked,
  primaryScopeItemId,
  onCheckedChange,
  onPrimaryChange,
}: {
  item: CsiCatalogItem;
  checked: boolean;
  primaryScopeItemId: string;
  onCheckedChange: (scopeItemId: string, checked: boolean) => void;
  onPrimaryChange: (scopeItemId: string) => void;
}) {
  return (
    <div style={scopeRow}>
      <label className="radio-option">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onCheckedChange(item.id, event.target.checked)}
        />
        <span>
          <CsiCodeLabel item={item} showLevelBadge />
        </span>
      </label>
      <label className="radio-option">
        <input
          type="radio"
          name="primaryScopeItemId"
          value={item.id}
          checked={checked && primaryScopeItemId === item.id}
          disabled={!checked}
          onChange={() => onPrimaryChange(item.id)}
        />
        <span>Primary</span>
      </label>
    </div>
  );
}

function BidTextarea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="form-field">
      <span className="label-text">{label}</span>
      <textarea
        className="form-input"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={4}
        placeholder="One item per line"
      />
    </label>
  );
}

function PricingItemRow({
  itemDraft,
  onChange,
  onRemove,
}: {
  itemDraft: PricingItemDraft;
  onChange: (itemDraftId: string, updates: Partial<PricingItemDraft>) => void;
  onRemove: (itemDraftId: string) => void;
}) {
  return (
    <div style={pricingItemRow}>
      <div style={pricingItemGrid}>
        <label className="form-field">
          <span className="label-text">Category</span>
          <select
            className="form-input"
            value={itemDraft.category}
            onChange={(event) =>
              onChange(itemDraft.id, {
                category: event.target.value as BidPricingItemCategory,
              })
            }
          >
            {pricingItemCategories.map((category) => (
              <option key={category} value={category}>
                {formatStatus(category)}
              </option>
            ))}
          </select>
        </label>
        <label className="form-field">
          <span className="label-text">Direction</span>
          <select
            className="form-input"
            value={itemDraft.direction}
            onChange={(event) =>
              onChange(itemDraft.id, {
                direction: event.target.value as BidPricingItemDirection,
              })
            }
          >
            {pricingItemDirections.map((direction) => (
              <option key={direction} value={direction}>
                {formatStatus(direction)}
              </option>
            ))}
          </select>
        </label>
        <label className="form-field">
          <span className="label-text">Label</span>
          <input
            className="form-input"
            value={itemDraft.label}
            onChange={(event) =>
              onChange(itemDraft.id, { label: event.target.value })
            }
          />
        </label>
        <label className="form-field">
          <span className="label-text">Amount</span>
          <input
            className="form-input"
            inputMode="decimal"
            value={itemDraft.amount}
            onChange={(event) =>
              onChange(itemDraft.id, { amount: event.target.value })
            }
          />
        </label>
        <label className="form-field">
          <span className="label-text">Quantity</span>
          <input
            className="form-input"
            inputMode="decimal"
            value={itemDraft.quantity}
            onChange={(event) =>
              onChange(itemDraft.id, { quantity: event.target.value })
            }
          />
        </label>
        <label className="form-field">
          <span className="label-text">Unit</span>
          <input
            className="form-input"
            value={itemDraft.unit}
            onChange={(event) =>
              onChange(itemDraft.id, { unit: event.target.value })
            }
          />
        </label>
        <label className="form-field">
          <span className="label-text">Unit Rate</span>
          <input
            className="form-input"
            inputMode="decimal"
            value={itemDraft.unitRate}
            onChange={(event) =>
              onChange(itemDraft.id, { unitRate: event.target.value })
            }
          />
        </label>
        <label className="form-field">
          <span className="label-text">Notes</span>
          <input
            className="form-input"
            value={itemDraft.notes}
            onChange={(event) =>
              onChange(itemDraft.id, { notes: event.target.value })
            }
          />
        </label>
      </div>
      <div className="settings-actions">
        <label className="radio-option">
          <input
            type="checkbox"
            checked={itemDraft.isAccepted}
            onChange={(event) =>
              onChange(itemDraft.id, { isAccepted: event.target.checked })
            }
          />
          <span>Accepted</span>
        </label>
        <span className="badge badge-muted">{submittedPricingItemSource}</span>
        <button
          type="button"
          className="button-danger"
          onClick={() => onRemove(itemDraft.id)}
        >
          Remove
        </button>
      </div>
    </div>
  );
}

let cachedProjectsStorageValue: string | undefined;
let cachedProjects: Project[] = getMergedProjects();
let cachedSubcontractorsStorageValue: string | undefined;
let cachedSubcontractors: Subcontractor[] = getMergedSubcontractors();
let cachedProjectCsiSelectionsStorageValue: string | undefined;
let cachedProjectCsiSelections: StoredProjectCsiSelections =
  EMPTY_PROJECT_CSI_SELECTIONS;

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

function useProjectCsiSelectionsSnapshot(): StoredProjectCsiSelections {
  return useSyncExternalStore(
    subscribeToStorage,
    getProjectCsiSelectionsSnapshot,
    getServerProjectCsiSelectionsSnapshot
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

function getServerProjectCsiSelectionsSnapshot(): StoredProjectCsiSelections {
  return EMPTY_PROJECT_CSI_SELECTIONS;
}

function getProjectCsiSelectionsSnapshot(): StoredProjectCsiSelections {
  const storageValue =
    localStorage.getItem(projectCsiSelectionsStorageKey) || "{}";

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
    const parsedValue = JSON.parse(storageValue);

    return parsedValue &&
      typeof parsedValue === "object" &&
      !Array.isArray(parsedValue)
      ? parsedValue
      : EMPTY_PROJECT_CSI_SELECTIONS;
  } catch {
    return EMPTY_PROJECT_CSI_SELECTIONS;
  }
}

function parseListTextarea(value: string): string[] | undefined {
  const values = value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);

  return values.length > 0 ? values : undefined;
}

function parseCurrencyValue(value: string): number | undefined {
  const normalizedValue = value.replace(/[$,\s]/g, "");
  if (!normalizedValue) return undefined;

  const parsedValue = Number(normalizedValue);
  return Number.isFinite(parsedValue) ? parsedValue : undefined;
}

function buildPricingItems(
  itemDrafts: PricingItemDraft[]
): BidPricingItem[] | undefined {
  const meaningfulDrafts = itemDrafts.filter(isMeaningfulPricingItemDraft);

  if (
    meaningfulDrafts.some((itemDraft) => itemDraft.label.trim().length === 0)
  ) {
    return undefined;
  }

  const pricingItems = meaningfulDrafts.map((itemDraft) => ({
    id: itemDraft.id,
    category: itemDraft.category,
    direction: itemDraft.direction,
    label: itemDraft.label.trim(),
    amount: parseCurrencyValue(itemDraft.amount),
    quantity: parseOptionalNumber(itemDraft.quantity),
    unit: emptyToUndefined(itemDraft.unit),
    unitRate: parseCurrencyValue(itemDraft.unitRate),
    notes: emptyToUndefined(itemDraft.notes),
    isAccepted: itemDraft.isAccepted,
    source: submittedPricingItemSource,
  }));

  return pricingItems.length > 0 ? pricingItems : undefined;
}

function buildSourceDocumentAttachments(
  sourceDocumentName: string,
  uploadedAt: string
) {
  const filename = sourceDocumentName.trim();

  return filename
    ? [
        {
          id: `attachment-${Date.now()}`,
          filename,
          uploadedAt,
        },
      ]
    : undefined;
}

function getSourceDocumentNote(
  sourceDocumentName: string,
  sourceDocumentType: SourceDocumentType,
  sourceDocumentNotes: string
) {
  const filename = sourceDocumentName.trim();
  const notes = sourceDocumentNotes.trim();

  if (!filename && !notes) return undefined;

  return [
    "Source Document",
    filename ? `Name: ${filename}` : undefined,
    `Type: ${sourceDocumentType}`,
    notes ? `Notes: ${notes}` : undefined,
  ]
    .filter(Boolean)
    .join("\n");
}

function combineNotes(notes: string, sourceDocumentNote: string | undefined) {
  const bidNotes = notes.trim();

  if (bidNotes && sourceDocumentNote) {
    return `${bidNotes}\n\n${sourceDocumentNote}`;
  }

  return bidNotes || sourceDocumentNote || undefined;
}

function isMeaningfulPricingItemDraft(itemDraft: PricingItemDraft) {
  return Boolean(
    itemDraft.label.trim() ||
      itemDraft.amount.trim() ||
      itemDraft.quantity.trim() ||
      itemDraft.unit.trim() ||
      itemDraft.unitRate.trim() ||
      itemDraft.notes.trim()
  );
}

function createPricingItemDraft(
  category: BidPricingItemCategory,
  direction: BidPricingItemDirection,
  label: string
): PricingItemDraft {
  return {
    id: `pricing-item-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    category,
    direction,
    label,
    amount: "",
    quantity: "",
    unit: "",
    unitRate: "",
    notes: "",
    isAccepted: false,
  };
}

function parseOptionalNumber(value: string): number | undefined {
  const normalizedValue = value.trim();
  if (!normalizedValue) return undefined;

  const parsedValue = Number(normalizedValue);
  return Number.isFinite(parsedValue) ? parsedValue : undefined;
}

function emptyToUndefined(value: string) {
  const trimmedValue = value.trim();
  return trimmedValue ? trimmedValue : undefined;
}

function addUnique(values: string[], nextValue: string) {
  return values.includes(nextValue) ? values : [...values, nextValue];
}

function createBidSubmissionId(projectId: string) {
  return `bid-${projectId}-${Date.now()}`;
}

function getTodayDateValue() {
  return new Date().toISOString().slice(0, 10);
}

function formatStatus(status: string) {
  return status
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

const formGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 12,
};

const notesGrid: React.CSSProperties = {
  display: "grid",
  gap: 12,
};

const pricingItemList: React.CSSProperties = {
  display: "grid",
  gap: 12,
  marginTop: 12,
};

const pricingItemRow: React.CSSProperties = {
  display: "grid",
  gap: 12,
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-control)",
  padding: 12,
};

const pricingItemGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
  gap: 12,
};

const scopeList: React.CSSProperties = {
  display: "grid",
  gap: 8,
};

const scopeRow: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "space-between",
  gap: 12,
  alignItems: "center",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-control)",
  padding: 10,
};
