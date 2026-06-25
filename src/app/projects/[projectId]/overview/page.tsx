"use client";

import { Fragment, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CsiCodeLabel, CsiHierarchyPath, CsiLevelBadge } from "@/components/csi";
import AppShell from "@/components/layout/AppShell";
import ProjectCostSummaryTable from "@/components/projects/ProjectCostSummaryTable";
import { getNearestLevel2Ancestor } from "@/lib/csiCatalog";
import {
  getLeveledBidAmount,
  getMissingBidCoverage,
  getProjectBidLevelingDecisions,
  getProjectBidSubmissions,
  getProjectBidSummary,
  getProjectScopeBidCoverage,
  getSubmittedBidAmount,
} from "@/lib/projectBids";
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
import {
  BidPricingItem,
  ProjectBidLevelingDecision,
  ProjectBidSubmission,
} from "@/types/Bid";

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
  const bidSummary = getProjectBidSummary(project.id, csiSelection);
  const bidSubmissions = getProjectBidSubmissions(project.id);
  const levelingDecisions = getProjectBidLevelingDecisions(project.id);
  const estimateReview = buildEstimateReview(
    project,
    bidSubmissions,
    levelingDecisions
  );

  return (
    <AppShell title="Estimate Review">
      <div className="page-header">
        <div>
          <Link href={`/projects/${project.id}`}>
            {"<-"} Back to Command Center
          </Link>
          <h1>{project.name}</h1>
          <p className="muted-text">
            Compile selected bids, financial markups, clarifications,
            exclusions, and proposal-ready notes before client proposal output.
          </p>
        </div>
        <div className="page-header-actions">
          <Link
            href={`/projects/${project.id}/leveling`}
            className="button-primary"
          >
            Bid Leveling
          </Link>
          <Link href={`/projects/${project.id}/bids`} className="button-secondary">
            Bids
          </Link>
          <Link
            href={`/projects/${project.id}/proposal`}
            className="button-secondary"
          >
            Proposal
          </Link>
          <Link
            href={`/projects/${project.id}/scope`}
            className="button-secondary"
          >
            Project Scope
          </Link>
          <Link
            href={`/projects/${project.id}/setup`}
            className="button-secondary"
          >
            Project Setup
          </Link>
        </div>
      </div>

      <section style={panel}>
        <h2>Project Context</h2>
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
        <h2>Financial Review Sheet</h2>
        {estimateReview.selectedBids.length === 0 ? (
          <div style={pendingState}>
            <strong>No selected bids loaded into the review sheet yet.</strong>
            <p className="muted-text">
              Select winning bids in Bid Leveling or mark bid submissions as
              selected before compiling the project financial review.
            </p>
            <div className="settings-actions">
              <Link
                href={`/projects/${project.id}/leveling`}
                className="button-primary"
              >
                Open Bid Leveling
              </Link>
              <Link
                href={`/projects/${project.id}/bids`}
                className="button-secondary"
              >
                View Bids
              </Link>
            </div>
          </div>
        ) : (
          <div className="estimate-review-stack">
            <div className="badge-list">
              <span className="badge badge-muted">
                Bids Received {bidSummary.submissionCount}
              </span>
              <span className="badge badge-muted">
                Selected Bids {estimateReview.selectedBids.length}
              </span>
              <span className="badge badge-muted">
                Subcontractor Subtotal{" "}
                {formatCurrency(estimateReview.selectedBidTotal)}
              </span>
              <span className="badge badge-muted">
                Missing Coverage {bidSummary.missingCoverageCount}
              </span>
            </div>

            <div className="table-shell">
              <ProjectCostSummaryTable rows={estimateReview.costRows} />
            </div>
          </div>
        )}
      </section>

      <section style={panel}>
        <h2>Selected Bid Breakdown</h2>
        {estimateReview.selectedBids.length === 0 ? (
          <p className="muted-text">
            Selected subcontractor bids will appear here after leveling.
          </p>
        ) : (
          <div className="table-shell">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Subcontractor</th>
                  <th>Status</th>
                  <th>Base Bid</th>
                  <th>Accepted Pricing</th>
                  <th>Leveling Adjustments</th>
                  <th>Selected Amount</th>
                  <th>Proposal Context</th>
                </tr>
              </thead>
              <tbody>
                {estimateReview.selectedBids.map((selectedBid) => (
                  <tr key={selectedBid.submission.id}>
                    <td>{selectedBid.submission.subcontractorName ?? "Unassigned"}</td>
                    <td>
                      <span className="badge badge-primary">
                        {formatStatus(selectedBid.submission.status)}
                      </span>
                    </td>
                    <td>{formatCurrency(selectedBid.baseAmount)}</td>
                    <td>{formatCurrency(selectedBid.acceptedPricingTotal)}</td>
                    <td>{formatCurrency(selectedBid.levelingAdjustmentTotal)}</td>
                    <td>{formatCurrency(selectedBid.selectedAmount)}</td>
                    <td>
                      <span className="muted-text">
                        {selectedBid.proposalNoteCount} notes / clarifications
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section style={panel}>
        <h2>Financial Inputs Pending</h2>
        <div className="estimate-review-input-grid">
          <ReviewInputStatus
            label="General Conditions"
            value="Not modeled yet"
          />
          <ReviewInputStatus label="GC Fee" value="Not modeled yet" />
          <ReviewInputStatus label="Insurance" value="Not modeled yet" />
          <ReviewInputStatus label="Taxes / Bonds" value="Not modeled yet" />
          <ReviewInputStatus
            label="Allowances"
            value={
              estimateReview.allowanceTotal
                ? formatCurrency(estimateReview.allowanceTotal)
                : "No selected allowances"
            }
          />
          <ReviewInputStatus
            label="Alternates"
            value={
              estimateReview.alternateTotal
                ? formatCurrency(estimateReview.alternateTotal)
                : "No accepted alternates"
            }
          />
        </div>
        <p className="muted-text">
          These financial review rows are preserved as estimate review concepts,
          but only selected bid data is totaled until real markup, tax, bond,
          and general condition inputs are implemented.
        </p>
      </section>

      <section style={panel}>
        <h2>Proposal / Clarifications Output</h2>
        <p className="muted-text">
          The estimate review compiles selected bids, financial markups,
          clarifications, exclusions, alternates, allowances, and proposal-ready
          notes before generating the client proposal.
        </p>
        <ProposalNoteList title="Inclusions" values={estimateReview.inclusions} />
        <ProposalNoteList title="Clarifications" values={estimateReview.clarifications} />
        <ProposalNoteList title="Exclusions" values={estimateReview.exclusions} />
        <ProposalNoteList
          title="Qualifications / Notes"
          values={estimateReview.proposalNotes}
        />
        <Link href={`/projects/${project.id}/proposal`} className="button-secondary">
          Open Proposal Draft
        </Link>
      </section>

      <section style={panel}>
        <h2>CSI Coverage Reference</h2>
        <p className="muted-text">
          Secondary CSI drilldown for scope coverage. Financial review and bid
          comparison should flow through Bid Leveling and selected bids.
        </p>

        <table style={{ borderCollapse: "collapse", minWidth: 1000 }}>
          <thead>
            <tr>
              <th style={cell}></th>
              <th style={cell}>Division</th>
              <th style={cell}>CSI scopes</th>
              <th style={cell}>Bids Received</th>
              <th style={cell}>Selected Bids</th>
              <th style={cell}>Missing Coverage</th>
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
              const selectedScopeItemIds = sections.map((section) => section.id);
              const coverage = getProjectScopeBidCoverage(project.id, {
                version: project.csiVersion,
                divisionIds: [division.id],
                sectionIds: selectedScopeItemIds,
                updatedAt: csiSelection?.updatedAt ?? "",
              });
              const bidsReceived = coverage.reduce(
                (count, scopeCoverage) => count + scopeCoverage.bidCount,
                0
              );
              const selectedBids = coverage.reduce(
                (count, scopeCoverage) => count + scopeCoverage.selectedBidCount,
                0
              );
              const missingCoverage = getMissingBidCoverage(
                project.id,
                selectedScopeItemIds
              ).length;
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
                    <td style={cell}>{bidsReceived}</td>
                    <td style={cell}>{selectedBids}</td>
                    <td style={cell}>{missingCoverage}</td>
                    <td style={cell}>
                      <Link
                        href={`/projects/${project.id}/csi-divisions/${division.number}`}
                        className="button-secondary"
                      >
                        CSI Detail
                      </Link>
                    </td>
                  </tr>
                  {isExpanded && sections.length === 0 && (
                    <tr>
                      <td style={childCell} />
                      <td style={childCell} colSpan={6}>
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
                        <td style={childCell} colSpan={6}>
                          <SubdivisionScopeGroup
                            group={group}
                            projectId={project.id}
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
    </AppShell>
  );
}

type EstimateReview = {
  selectedBids: SelectedBidReview[];
  selectedBidTotal: number;
  baseBidSubtotal: number;
  alternateTotal: number;
  allowanceTotal: number;
  levelingAddTotal: number;
  levelingDeductTotal: number;
  costRows: Array<{
    label: string;
    amount: number;
    squareFootage: number;
    totalProjectCost: number;
    constructionCost: number;
    durationMonths: number;
    bold?: boolean;
  }>;
  inclusions: string[];
  clarifications: string[];
  exclusions: string[];
  proposalNotes: string[];
};

type SelectedBidReview = {
  submission: ProjectBidSubmission;
  decision?: ProjectBidLevelingDecision;
  baseAmount: number;
  acceptedPricingTotal: number;
  levelingAdjustmentTotal: number;
  selectedAmount: number;
  proposalNoteCount: number;
};

function ReviewInputStatus({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="estimate-review-input-card">
      <span className="label-text">{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ProposalNoteList({
  title,
  values,
}: {
  title: string;
  values: string[];
}) {
  return (
    <div className="estimate-review-note-group">
      <h3>{title}</h3>
      {values.length === 0 ? (
        <p className="muted-text">No {title.toLowerCase()} captured yet.</p>
      ) : (
        <ul>
          {values.map((value, index) => (
            <li key={`${title}-${index}`}>{value}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function buildEstimateReview(
  project: Project,
  submissions: ProjectBidSubmission[],
  decisions: ProjectBidLevelingDecision[]
): EstimateReview {
  const selectedBids = getSelectedBidReviews(submissions, decisions);
  const selectedBidTotal = selectedBids.reduce(
    (sum, bid) => sum + bid.selectedAmount,
    0
  );
  const baseBidSubtotal = selectedBids.reduce(
    (sum, bid) => sum + bid.baseAmount,
    0
  );
  const alternateTotal = selectedBids.reduce(
    (sum, bid) =>
      sum +
      getAcceptedSubmittedPricingItems(bid.submission, bid.decision)
        .filter((item) => item.category === "ALTERNATE")
        .reduce((itemSum, item) => itemSum + getPricingItemSignedAmount(item), 0),
    0
  );
  const allowanceTotal = selectedBids.reduce(
    (sum, bid) =>
      sum +
      getAcceptedSubmittedPricingItems(bid.submission, bid.decision)
        .filter((item) => item.category === "ALLOWANCE")
        .reduce((itemSum, item) => itemSum + getPricingItemSignedAmount(item), 0),
    0
  );
  const levelingAddTotal = selectedBids.reduce(
    (sum, bid) =>
      sum +
      (bid.decision?.adjustments ?? [])
        .filter((item) => item.direction === "ADD")
        .reduce((itemSum, item) => itemSum + getPricingItemAmount(item), 0),
    0
  );
  const levelingDeductTotal = selectedBids.reduce(
    (sum, bid) =>
      sum +
      (bid.decision?.adjustments ?? [])
        .filter((item) => item.direction === "DEDUCT")
        .reduce((itemSum, item) => itemSum + getPricingItemAmount(item), 0),
    0
  );
  const squareFootage =
    project.projectCharacteristics?.squareFootage ?? project.squareFootage ?? 0;
  const durationMonths = project.projectDurationMonths ?? 0;
  const costRows = [
    {
      label: "Selected Base Bids",
      amount: baseBidSubtotal,
      squareFootage,
      totalProjectCost: selectedBidTotal,
      constructionCost: selectedBidTotal,
      durationMonths,
    },
    {
      label: "Accepted Alternates",
      amount: alternateTotal,
      squareFootage,
      totalProjectCost: selectedBidTotal,
      constructionCost: selectedBidTotal,
      durationMonths,
    },
    {
      label: "Allowances",
      amount: allowanceTotal,
      squareFootage,
      totalProjectCost: selectedBidTotal,
      constructionCost: selectedBidTotal,
      durationMonths,
    },
    {
      label: "Leveling Adds",
      amount: levelingAddTotal,
      squareFootage,
      totalProjectCost: selectedBidTotal,
      constructionCost: selectedBidTotal,
      durationMonths,
    },
    {
      label: "Leveling Deducts",
      amount: -levelingDeductTotal,
      squareFootage,
      totalProjectCost: selectedBidTotal,
      constructionCost: selectedBidTotal,
      durationMonths,
    },
    {
      label: "Subcontractor Subtotal",
      amount: selectedBidTotal,
      squareFootage,
      totalProjectCost: selectedBidTotal,
      constructionCost: selectedBidTotal,
      durationMonths,
      bold: true,
    },
    {
      label: "General Conditions",
      amount: 0,
      squareFootage,
      totalProjectCost: selectedBidTotal,
      constructionCost: selectedBidTotal,
      durationMonths,
    },
    {
      label: "GC Fee",
      amount: 0,
      squareFootage,
      totalProjectCost: selectedBidTotal,
      constructionCost: selectedBidTotal,
      durationMonths,
    },
    {
      label: "Insurance",
      amount: 0,
      squareFootage,
      totalProjectCost: selectedBidTotal,
      constructionCost: selectedBidTotal,
      durationMonths,
    },
    {
      label: "Taxes / Bonds",
      amount: 0,
      squareFootage,
      totalProjectCost: selectedBidTotal,
      constructionCost: selectedBidTotal,
      durationMonths,
    },
    {
      label: "Project Total",
      amount: selectedBidTotal,
      squareFootage,
      totalProjectCost: selectedBidTotal,
      constructionCost: selectedBidTotal,
      durationMonths,
      bold: true,
    },
  ];

  return {
    selectedBids,
    selectedBidTotal,
    baseBidSubtotal,
    alternateTotal,
    allowanceTotal,
    levelingAddTotal,
    levelingDeductTotal,
    costRows,
    inclusions: uniqueStrings(
      selectedBids.flatMap((bid) => [
        ...(bid.submission.inclusions ?? []),
        ...(bid.decision?.normalizedInclusions ?? []),
      ])
    ),
    clarifications: uniqueStrings(
      selectedBids.flatMap((bid) => bid.submission.clarifications ?? [])
    ),
    exclusions: uniqueStrings(
      selectedBids.flatMap((bid) => [
        ...(bid.submission.exclusions ?? []),
        ...(bid.decision?.normalizedExclusions ?? []),
      ])
    ),
    proposalNotes: uniqueStrings(
      selectedBids.flatMap((bid) => [
        ...(bid.submission.qualifications ?? []),
        ...(bid.submission.notes ? [bid.submission.notes] : []),
        ...(bid.decision?.scopeGapNotes ? [bid.decision.scopeGapNotes] : []),
      ])
    ),
  };
}

function getSelectedBidReviews(
  submissions: ProjectBidSubmission[],
  decisions: ProjectBidLevelingDecision[]
): SelectedBidReview[] {
  const submissionsById = new Map(
    submissions.map((submission) => [submission.id, submission])
  );
  const selectedDecisionReviews = decisions
    .filter((decision) => decision.isSelected)
    .map((decision) => {
      const submission = submissionsById.get(decision.bidSubmissionId);
      if (!submission) return undefined;

      return buildSelectedBidReview(submission, decision);
    })
    .filter(isDefined);
  const selectedDecisionSubmissionIds = new Set(
    selectedDecisionReviews.map((review) => review.submission.id)
  );
  const selectedSubmissionReviews = submissions
    .filter(
      (submission) =>
        submission.status === "SELECTED" &&
        !selectedDecisionSubmissionIds.has(submission.id)
    )
    .map((submission) => buildSelectedBidReview(submission));

  return [...selectedDecisionReviews, ...selectedSubmissionReviews].sort(
    (left, right) =>
      (left.submission.subcontractorName ?? "").localeCompare(
        right.submission.subcontractorName ?? ""
      )
  );
}

function buildSelectedBidReview(
  submission: ProjectBidSubmission,
  decision?: ProjectBidLevelingDecision
): SelectedBidReview {
  const baseAmount = submission.baseBidAmount ?? submission.amount ?? 0;
  const acceptedPricingTotal = getAcceptedSubmittedPricingItems(
    submission,
    decision
  ).reduce((sum, item) => sum + getPricingItemSignedAmount(item), 0);
  const levelingAdjustmentTotal = (decision?.adjustments ?? []).reduce(
    (sum, item) => sum + getPricingItemSignedAmount(item),
    0
  );
  const selectedAmount = decision
    ? getLeveledBidAmount(submission, decision)
    : getSubmittedBidAmount(submission);
  const proposalNoteCount =
    (submission.inclusions?.length ?? 0) +
    (submission.exclusions?.length ?? 0) +
    (submission.clarifications?.length ?? 0) +
    (submission.qualifications?.length ?? 0) +
    (submission.notes ? 1 : 0) +
    (decision?.scopeGapNotes ? 1 : 0);

  return {
    submission,
    decision,
    baseAmount,
    acceptedPricingTotal,
    levelingAdjustmentTotal,
    selectedAmount,
    proposalNoteCount,
  };
}

function getAcceptedSubmittedPricingItems(
  submission: ProjectBidSubmission,
  decision?: ProjectBidLevelingDecision
): BidPricingItem[] {
  const acceptedPricingItemIds = new Set(decision?.acceptedPricingItemIds ?? []);

  return (submission.pricingItems ?? []).filter((item) => {
    if (item.source && item.source !== "SUBMITTED") return false;
    if (acceptedPricingItemIds.size > 0) return acceptedPricingItemIds.has(item.id);

    return item.isAccepted === true;
  });
}

function getPricingItemSignedAmount(item: BidPricingItem) {
  const amount = getPricingItemAmount(item);

  if (item.direction === "DEDUCT") return -amount;
  if (item.direction === "ADD" || item.direction === "INCLUDED") return amount;

  return 0;
}

function getPricingItemAmount(item: BidPricingItem) {
  if (item.amount !== undefined) return item.amount;
  if (item.quantity !== undefined && item.unitRate !== undefined) {
    return item.quantity * item.unitRate;
  }

  return 0;
}

function uniqueStrings(values: string[]) {
  return Array.from(
    new Set(values.map((value) => value.trim()).filter(Boolean))
  );
}

function formatCurrency(value: number) {
  if (!value) return "$ -";

  return `$${value.toLocaleString(undefined, {
    maximumFractionDigits: 2,
  })}`;
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

const pendingState: React.CSSProperties = {
  display: "grid",
  gap: 8,
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

type SubdivisionScopeGroupData = {
  key: string;
  subdivision?: CsiCatalogItem;
  detailItems: CsiCatalogItem[];
};

function SubdivisionScopeGroup({
  group,
  projectId,
}: {
  group: SubdivisionScopeGroupData;
  projectId: string;
}) {
  const subdivisionItems = group.subdivision ? [group.subdivision] : [];
  const scopeItems = [...subdivisionItems, ...group.detailItems];
  const coverage = getProjectScopeBidCoverage(projectId, {
    version: scopeItems[0]?.version ?? "MASTERFORMAT_2004_PLUS",
    divisionIds: group.subdivision ? [group.subdivision.divisionId] : [],
    sectionIds: scopeItems.map((item) => item.id),
    updatedAt: "",
  });
  const bidsReceived = coverage.reduce(
    (count, scopeCoverage) => count + scopeCoverage.bidCount,
    0
  );
  const selectedBids = coverage.reduce(
    (count, scopeCoverage) => count + scopeCoverage.selectedBidCount,
    0
  );
  const missingCoverage = coverage.filter(
    (scopeCoverage) => scopeCoverage.missingCoverage
  ).length;

  const displayBidsReceived =
    scopeItems.length === 0 ? "Pending" : bidsReceived.toLocaleString();
  const displaySelectedBids =
    scopeItems.length === 0 ? "Pending" : selectedBids.toLocaleString();
  const displayMissingCoverage =
    scopeItems.length === 0 ? "Pending" : missingCoverage.toLocaleString();

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
          <span className="badge badge-muted">Bids {displayBidsReceived}</span>
          <span className="badge badge-muted">
            Selected {displaySelectedBids}
          </span>
          <span className="badge badge-muted">
            Missing {displayMissingCoverage}
          </span>
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
