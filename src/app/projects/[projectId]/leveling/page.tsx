"use client";

import { CSSProperties, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CsiCodeLabel } from "@/components/csi";
import AppShell from "@/components/layout/AppShell";
import Panel from "@/components/ui/Panel";
import {
  getLeveledBidAmount,
  getProjectBidLevelingDecisions,
  getProjectBidPackages,
  getProjectBidSubmissions,
  getSubmittedBidAmount,
  projectBidLevelingDecisionsStorageKey,
  projectBidPackagesStorageKey,
  projectBidSubmissionsStorageKey,
} from "@/lib/projectBids";
import { getMergedProjects, projectsStorageKey } from "@/lib/projects";
import { resolveProjectCsiItem } from "@/lib/projectCsiSelections";
import {
  BidPricingItem,
  ProjectBidLevelingDecision,
  ProjectBidPackage,
  ProjectBidSubmission,
} from "@/types/Bid";
import { Project } from "@/types/Project";

type PricingRow =
  | {
      id: "base-bid" | "leveled-total";
      label: string;
      type: "amount";
    }
  | {
      id:
        | "alternate-add"
        | "alternate-deduct"
        | "allowance"
        | "unit-price"
        | "other"
        | "leveling-add"
        | "leveling-deduct";
      label: string;
      type: "items";
    };

const pricingRows: PricingRow[] = [
  { id: "base-bid", label: "Base Bid", type: "amount" },
  { id: "alternate-add", label: "Alternate Add", type: "items" },
  { id: "alternate-deduct", label: "Alternate Deduct", type: "items" },
  { id: "allowance", label: "Allowance", type: "items" },
  { id: "unit-price", label: "Unit Price", type: "items" },
  { id: "other", label: "Other", type: "items" },
  { id: "leveling-add", label: "Leveling Add", type: "items" },
  { id: "leveling-deduct", label: "Leveling Deduct", type: "items" },
  { id: "leveled-total", label: "Leveled Total", type: "amount" },
];

let cachedProjectsStorageValue: string | undefined;
let cachedProjects: Project[] = getMergedProjects();
let cachedBidPackagesStorageValue: string | undefined;
let cachedBidPackagesProjectId: string | undefined;
let cachedBidPackages: ProjectBidPackage[] = [];
let cachedBidSubmissionsStorageValue: string | undefined;
let cachedBidSubmissionsProjectId: string | undefined;
let cachedBidSubmissions: ProjectBidSubmission[] = [];
let cachedLevelingDecisionsStorageValue: string | undefined;
let cachedLevelingDecisionsProjectId: string | undefined;
let cachedLevelingDecisions: ProjectBidLevelingDecision[] = [];

export default function ProjectBidLevelingPage() {
  const params = useParams();
  const rawProjectId = params.projectId;
  const projectId = Array.isArray(rawProjectId) ? rawProjectId[0] : rawProjectId;
  const projects = useProjectsSnapshot();
  const bidPackages = useBidPackagesSnapshot(projectId ?? "");
  const bidSubmissions = useBidSubmissionsSnapshot(projectId ?? "");
  const levelingDecisions = useLevelingDecisionsSnapshot(projectId ?? "");
  const project = projects.find((item) => item.id === projectId);
  const [activePackageId, setActivePackageId] = useState<string | undefined>();
  const [selectedBidId, setSelectedBidId] = useState<string | undefined>();
  const activePackage =
    bidPackages.find((packageRecord) => packageRecord.id === activePackageId) ??
    bidPackages[0];
  const packageBids = useMemo(
    () =>
      activePackage
        ? bidSubmissions.filter((bid) => bidIntersectsPackage(bid, activePackage))
        : [],
    [activePackage, bidSubmissions]
  );
  const selectedBid =
    packageBids.find((bid) => bid.id === selectedBidId) ?? packageBids[0];
  const packageScopeItems = useMemo(
    () =>
      project && activePackage
        ? activePackage.scopeItemIds.map((scopeItemId) => ({
            id: scopeItemId,
            item: resolveProjectCsiItem(project.csiVersion, scopeItemId),
          }))
        : [],
    [activePackage, project]
  );

  if (!project) {
    return (
      <AppShell title="Project Not Found">
        <h1>Project Not Found</h1>
        <p>Requested project ID: {projectId}</p>
        <Link href="/">Back to Dashboard</Link>
      </AppShell>
    );
  }

  return (
    <AppShell title="Bid Leveling">
      <div className="command-center">
        <Link href={`/projects/${project.id}`}>{"<-"} Back to Command Center</Link>

        <Panel title="Bid Leveling">
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
              href={`/projects/${project.id}/bids`}
              className="button-secondary"
            >
              Bids
            </Link>
            <Link
              href={`/projects/${project.id}/bids/new${
                activePackage ? `?bidPackageId=${activePackage.id}` : ""
              }`}
              className="button-primary"
            >
              Add Manual Bid
            </Link>
          </div>
        </Panel>

        {bidPackages.length === 0 ? (
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
          <>
            <Panel title="Bid Packages">
              <div style={tabListStyle} role="tablist" aria-label="Bid packages">
                {bidPackages.map((packageRecord) => {
                  const packageBidCount = bidSubmissions.filter((bid) =>
                    bidIntersectsPackage(bid, packageRecord)
                  ).length;
                  const missingScopeCount = getMissingScopeCount(
                    packageRecord,
                    bidSubmissions
                  );
                  const isActive = packageRecord.id === activePackage?.id;

                  return (
                    <button
                      key={packageRecord.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      className={isActive ? "button-primary" : "button-secondary"}
                      onClick={() => {
                        setActivePackageId(packageRecord.id);
                        setSelectedBidId(undefined);
                      }}
                    >
                      {packageRecord.name}
                      <span className="badge badge-muted" style={{ marginLeft: 8 }}>
                        {packageBidCount} bids
                      </span>
                      <span className="badge badge-muted" style={{ marginLeft: 6 }}>
                        {missingScopeCount} unknown
                      </span>
                    </button>
                  );
                })}
              </div>
            </Panel>

            {activePackage ? (
              <div style={levelingLayoutStyle}>
                <div style={{ minWidth: 0 }}>
                  <Panel title={`${activePackage.name} Matrix`}>
                    <div className="settings-actions">
                      <Link
                        href={`/projects/${project.id}/bids`}
                        className="button-secondary"
                      >
                        View All Bids
                      </Link>
                      <Link
                        href={`/projects/${project.id}/bids/new?bidPackageId=${activePackage.id}`}
                        className="button-secondary"
                      >
                        Add Manual Bid
                      </Link>
                    </div>
                    {packageBids.length === 0 ? (
                      <p className="muted-text">
                        No bids intersect this bid package yet.
                      </p>
                    ) : (
                      <div className="table-shell">
                        <table className="data-table" style={matrixTableStyle}>
                          <thead>
                            <tr>
                              <th style={stickyHeaderCellStyle}>Pricing Row</th>
                              {packageBids.map((bid) => (
                                <th key={bid.id}>
                                  <button
                                    type="button"
                                    className="glyph-button"
                                    onClick={() => setSelectedBidId(bid.id)}
                                  >
                                    {getBidName(bid)}
                                  </button>
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {pricingRows.map((row) => (
                              <tr key={row.id}>
                                <th style={stickyBodyCellStyle}>{row.label}</th>
                                {packageBids.map((bid) => {
                                  const decision = findLevelingDecision(
                                    activePackage,
                                    bid,
                                    levelingDecisions
                                  );

                                  return (
                                    <td key={`${row.id}-${bid.id}`}>
                                      {renderPricingCell(row, bid, decision)}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </Panel>

                  <Panel title="Scope Coverage">
                    {packageScopeItems.length === 0 ? (
                      <p className="muted-text">
                        This bid package has no mapped CSI scopes.
                      </p>
                    ) : packageBids.length === 0 ? (
                      <p className="muted-text">
                        Add bids to compare package scope coverage.
                      </p>
                    ) : (
                      <div className="table-shell">
                        <table className="data-table" style={matrixTableStyle}>
                          <thead>
                            <tr>
                              <th style={stickyHeaderCellStyle}>CSI Scope</th>
                              {packageBids.map((bid) => (
                                <th key={bid.id}>
                                  <button
                                    type="button"
                                    className="glyph-button"
                                    onClick={() => setSelectedBidId(bid.id)}
                                  >
                                    {getBidName(bid)}
                                  </button>
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {packageScopeItems.map(({ id, item }) => (
                              <tr key={id}>
                                <th style={stickyBodyCellStyle}>
                                  {item ? (
                                    <CsiCodeLabel item={item} showLevelBadge />
                                  ) : (
                                    id
                                  )}
                                </th>
                                {packageBids.map((bid) => (
                                  <td key={`${id}-${bid.id}`}>
                                    <CoverageChip
                                      label={
                                        bid.scopeItemIds.includes(id)
                                          ? "Included"
                                          : "Unknown"
                                      }
                                    />
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </Panel>
                </div>

                <BidDetailPanel
                  project={project}
                  bid={selectedBid}
                  decision={
                    selectedBid && activePackage
                      ? findLevelingDecision(
                          activePackage,
                          selectedBid,
                          levelingDecisions
                        )
                      : undefined
                  }
                />
              </div>
            ) : null}
          </>
        )}
      </div>
    </AppShell>
  );
}

function BidDetailPanel({
  project,
  bid,
  decision,
}: {
  project: Project;
  bid?: ProjectBidSubmission;
  decision?: ProjectBidLevelingDecision;
}) {
  if (!bid) {
    return (
      <Panel title="Bid Detail">
        <p className="muted-text">Select a bid column to review details.</p>
      </Panel>
    );
  }

  return (
    <Panel title="Bid Detail">
      <div style={detailPanelStyle}>
        <div>
          <h3 style={{ marginTop: 0 }}>{getBidName(bid)}</h3>
          <p className="muted-text">
            {formatCurrency(getSubmittedBidAmount(bid))} |{" "}
            {formatStatus(bid.status)}
          </p>
        </div>
        <div className="badge-list">
          <span className="badge badge-muted">
            Submitted {bid.submittedAt ?? "Not set"}
          </span>
          {bid.receivedBy ? (
            <span className="badge badge-muted">Received by {bid.receivedBy}</span>
          ) : null}
          {decision ? (
            <span className="badge badge-primary">
              Leveled {formatCurrency(getLeveledBidAmount(bid, decision))}
            </span>
          ) : null}
        </div>

        <DetailList title="Inclusions" values={bid.inclusions} />
        <DetailList title="Exclusions" values={bid.exclusions} />
        <DetailList title="Clarifications" values={bid.clarifications} />
        <DetailList title="Qualifications" values={bid.qualifications} />

        {bid.notes ? (
          <div>
            <h4>Notes</h4>
            <p className="muted-text">{bid.notes}</p>
          </div>
        ) : null}

        <div>
          <h4>Pricing Items</h4>
          {bid.pricingItems && bid.pricingItems.length > 0 ? (
            <ul>
              {bid.pricingItems.map((item) => (
                <li key={item.id}>
                  {item.label} | {formatStatus(item.category)} |{" "}
                  {formatStatus(item.direction)}
                  {getPricingItemAmount(item) !== undefined
                    ? ` | ${formatCurrency(getPricingItemAmount(item))}`
                    : ""}
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted-text">No pricing items.</p>
          )}
        </div>

        <Link
          href={`/projects/${project.id}/bids/${bid.id}`}
          className="button-primary"
        >
          Edit Bid
        </Link>
      </div>
    </Panel>
  );
}

function DetailList({ title, values }: { title: string; values?: string[] }) {
  return (
    <div>
      <h4>{title}</h4>
      {values && values.length > 0 ? (
        <ul>
          {values.map((value) => (
            <li key={value}>{value}</li>
          ))}
        </ul>
      ) : (
        <p className="muted-text">None listed.</p>
      )}
    </div>
  );
}

function CoverageChip({ label }: { label: "Included" | "Unknown" }) {
  return (
    <span className={label === "Included" ? "badge badge-primary" : "badge badge-muted"}>
      {label === "Included" ? "Included" : "Unknown"}
    </span>
  );
}

function renderPricingCell(
  row: PricingRow,
  bid: ProjectBidSubmission,
  decision?: ProjectBidLevelingDecision
) {
  if (row.id === "base-bid") return formatCurrency(bid.baseBidAmount ?? bid.amount);
  if (row.id === "leveled-total") {
    return formatCurrency(
      decision ? getLeveledBidAmount(bid, decision) : getSubmittedBidAmount(bid)
    );
  }

  const items =
    row.id === "leveling-add" || row.id === "leveling-deduct"
      ? getLevelingItems(row.id, decision)
      : getSubmittedPricingItems(row.id, bid);

  if (items.length === 0) return <span className="muted-text">-</span>;

  return (
    <div style={pricingItemStackStyle}>
      {items.map((item) => (
        <span key={item.id}>
          {item.label}
          {getPricingItemAmount(item) !== undefined
            ? ` ${formatCurrency(getPricingItemAmount(item))}`
            : ""}
        </span>
      ))}
    </div>
  );
}

function getSubmittedPricingItems(rowId: PricingRow["id"], bid: ProjectBidSubmission) {
  return (bid.pricingItems ?? []).filter((item) => {
    if (item.source && item.source !== "SUBMITTED") return false;

    if (rowId === "alternate-add") {
      return item.category === "ALTERNATE" && item.direction === "ADD";
    }

    if (rowId === "alternate-deduct") {
      return item.category === "ALTERNATE" && item.direction === "DEDUCT";
    }

    if (rowId === "allowance") return item.category === "ALLOWANCE";
    if (rowId === "unit-price") return item.category === "UNIT_PRICE";
    if (rowId === "other") {
      return (
        item.category !== "ALTERNATE" &&
        item.category !== "ALLOWANCE" &&
        item.category !== "UNIT_PRICE" &&
        item.category !== "LEVELING_ADJUSTMENT"
      );
    }

    return false;
  });
}

function getLevelingItems(
  rowId: "leveling-add" | "leveling-deduct",
  decision?: ProjectBidLevelingDecision
) {
  return (decision?.adjustments ?? []).filter((item) => {
    if (item.category !== "LEVELING_ADJUSTMENT") return false;
    return rowId === "leveling-add"
      ? item.direction === "ADD"
      : item.direction === "DEDUCT";
  });
}

function findLevelingDecision(
  packageRecord: ProjectBidPackage,
  bid: ProjectBidSubmission,
  decisions: ProjectBidLevelingDecision[]
) {
  return decisions.find((decision) => {
    if (decision.bidSubmissionId !== bid.id) return false;
    if (decision.scopeGroupId === packageRecord.id) return true;

    return (
      decision.scopeItemIds?.some((scopeItemId) =>
        packageRecord.scopeItemIds.includes(scopeItemId)
      ) ?? false
    );
  });
}

function bidIntersectsPackage(
  bid: ProjectBidSubmission,
  packageRecord: ProjectBidPackage
) {
  return packageRecord.scopeItemIds.some((scopeItemId) =>
    bid.scopeItemIds.includes(scopeItemId)
  );
}

function getMissingScopeCount(
  packageRecord: ProjectBidPackage,
  bids: ProjectBidSubmission[]
) {
  return packageRecord.scopeItemIds.filter(
    (scopeItemId) =>
      !bids.some(
        (bid) =>
          bidIntersectsPackage(bid, packageRecord) &&
          bid.scopeItemIds.includes(scopeItemId)
      )
  ).length;
}

function getPricingItemAmount(item: BidPricingItem): number | undefined {
  if (item.amount !== undefined) return item.amount;
  if (item.quantity !== undefined && item.unitRate !== undefined) {
    return item.quantity * item.unitRate;
  }

  return undefined;
}

function getBidName(bid: ProjectBidSubmission) {
  return bid.subcontractorName ?? "Unnamed Bid";
}

function useProjectsSnapshot(): Project[] {
  return useSyncExternalStore(
    subscribeToStorage,
    getProjectsSnapshot,
    getServerProjectsSnapshot
  );
}

function useBidPackagesSnapshot(projectId: string): ProjectBidPackage[] {
  return useSyncExternalStore(
    subscribeToStorage,
    () => getBidPackagesSnapshot(projectId),
    getServerBidPackagesSnapshot
  );
}

function useBidSubmissionsSnapshot(projectId: string): ProjectBidSubmission[] {
  return useSyncExternalStore(
    subscribeToStorage,
    () => getBidSubmissionsSnapshot(projectId),
    getServerBidSubmissionsSnapshot
  );
}

function useLevelingDecisionsSnapshot(
  projectId: string
): ProjectBidLevelingDecision[] {
  return useSyncExternalStore(
    subscribeToStorage,
    () => getLevelingDecisionsSnapshot(projectId),
    getServerLevelingDecisionsSnapshot
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

function getServerBidSubmissionsSnapshot(): ProjectBidSubmission[] {
  return [];
}

function getBidSubmissionsSnapshot(projectId: string): ProjectBidSubmission[] {
  const storageValue =
    localStorage.getItem(projectBidSubmissionsStorageKey) || "[]";

  if (
    storageValue !== cachedBidSubmissionsStorageValue ||
    projectId !== cachedBidSubmissionsProjectId
  ) {
    cachedBidSubmissionsStorageValue = storageValue;
    cachedBidSubmissionsProjectId = projectId;
    cachedBidSubmissions = getProjectBidSubmissions(projectId);
  }

  return cachedBidSubmissions;
}

function getServerLevelingDecisionsSnapshot(): ProjectBidLevelingDecision[] {
  return [];
}

function getLevelingDecisionsSnapshot(
  projectId: string
): ProjectBidLevelingDecision[] {
  const storageValue =
    localStorage.getItem(projectBidLevelingDecisionsStorageKey) || "[]";

  if (
    storageValue !== cachedLevelingDecisionsStorageValue ||
    projectId !== cachedLevelingDecisionsProjectId
  ) {
    cachedLevelingDecisionsStorageValue = storageValue;
    cachedLevelingDecisionsProjectId = projectId;
    cachedLevelingDecisions = getProjectBidLevelingDecisions(projectId);
  }

  return cachedLevelingDecisions;
}

function formatCurrency(value: number | undefined) {
  return value === undefined ? "-" : `$${value.toLocaleString()}`;
}

function formatStatus(status: string) {
  return status
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

const levelingLayoutStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) minmax(280px, 360px)",
  gap: 16,
  alignItems: "start",
};

const tabListStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
};

const matrixTableStyle: CSSProperties = {
  minWidth: 900,
};

const stickyHeaderCellStyle: CSSProperties = {
  position: "sticky",
  left: 0,
  zIndex: 2,
};

const stickyBodyCellStyle: CSSProperties = {
  ...stickyHeaderCellStyle,
  zIndex: 1,
};

const pricingItemStackStyle: CSSProperties = {
  display: "grid",
  gap: 4,
};

const detailPanelStyle: CSSProperties = {
  display: "grid",
  gap: 16,
};
