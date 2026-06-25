import {
  getCsiAncestors,
  getNearestLevel2Ancestor,
  resolveCsiCatalogItem,
} from "@/lib/csiCatalog";
import { bidPackageTemplates } from "@/data/bidPackageTemplates";
import {
  BidPackageTemplate,
  BidPricingItem,
  BidPricingItemDirection,
  ProjectBidLevelingDecision,
  ProjectBidPackage,
  ProjectBidPackageSource,
  ProjectBidPackageStatus,
  ProjectBidReviewStatus,
  ProjectBidSubmission,
  ProjectBidSubmissionStatus,
} from "@/types/Bid";
import { CsiCatalogItem, CsiMasterFormatVersion, StoredProjectCsiSelection } from "@/types/Csi";

export const projectBidSubmissionsStorageKey = "projectBidSubmissions";
export const projectBidLevelingDecisionsStorageKey =
  "projectBidLevelingDecisions";
export const projectBidPackagesStorageKey = "projectBidPackages";
const bidSubmissionStatuses: ProjectBidSubmissionStatus[] = [
  "DRAFT",
  "RECEIVED",
  "REVIEWED",
  "LEVELED",
  "SELECTED",
  "REJECTED",
];
const bidReviewStatuses: ProjectBidReviewStatus[] = [
  "UNREVIEWED",
  "IN_REVIEW",
  "REVIEWED",
  "APPROVED",
  "REJECTED",
];
const bidPackageStatuses: ProjectBidPackageStatus[] = [
  "DRAFT",
  "ACTIVE",
  "CLOSED",
];
const bidPackageSources: ProjectBidPackageSource[] = [
  "MANUAL",
  "GENERATED",
  "COMPANY_DEFAULT",
];
const csiMasterFormatVersions: CsiMasterFormatVersion[] = [
  "MASTERFORMAT_1995",
  "MASTERFORMAT_2004_PLUS",
];
const pricingItemDirections: BidPricingItemDirection[] = [
  "ADD",
  "DEDUCT",
  "INCLUDED",
  "EXCLUDED",
  "INFORMATIONAL",
];

export type ProjectBidSummary = {
  submissionCount: number;
  selectedBidCount: number;
  selectedBidTotal: number;
  unreviewedBidCount: number;
  missingCoverageCount: number;
};

export type ProjectScopeBidCoverage = {
  scopeItemId: string;
  bidCount: number;
  selectedBidCount: number;
  hasCoverage: boolean;
  missingCoverage: boolean;
};

export function getProjectBidSubmissions(
  projectId: string
): ProjectBidSubmission[] {
  return getAllProjectBidSubmissions().filter(
    (submission) => submission.projectId === projectId
  );
}

export function getAllProjectBidSubmissions(): ProjectBidSubmission[] {
  if (typeof window === "undefined") return [];

  return parseProjectBidSubmissions(
    window.localStorage.getItem(projectBidSubmissionsStorageKey) || "[]"
  );
}

export function saveProjectBidSubmission(submission: ProjectBidSubmission) {
  if (typeof window === "undefined") return;

  const submissions = getAllProjectBidSubmissions();
  const nextSubmissions = [
    ...submissions.filter((item) => item.id !== submission.id),
    submission,
  ];

  window.localStorage.setItem(
    projectBidSubmissionsStorageKey,
    JSON.stringify(nextSubmissions)
  );
}

export function getProjectBidPackages(projectId: string): ProjectBidPackage[] {
  return getAllProjectBidPackages()
    .filter((packageRecord) => packageRecord.projectId === projectId)
    .sort(compareBidPackages);
}

export function getAllProjectBidPackages(): ProjectBidPackage[] {
  if (typeof window === "undefined") return [];

  return parseProjectBidPackages(
    window.localStorage.getItem(projectBidPackagesStorageKey) || "[]"
  );
}

export function saveProjectBidPackage(packageRecord: ProjectBidPackage) {
  if (typeof window === "undefined") return;

  const packageRecords = getAllProjectBidPackages();
  const nextPackageRecords = [
    ...packageRecords.filter((item) => item.id !== packageRecord.id),
    packageRecord,
  ];

  window.localStorage.setItem(
    projectBidPackagesStorageKey,
    JSON.stringify(nextPackageRecords)
  );
}

export function deleteProjectBidPackage(
  projectId: string,
  packageId: string
) {
  if (typeof window === "undefined") return;

  const nextPackageRecords = getAllProjectBidPackages().filter(
    (packageRecord) =>
      packageRecord.projectId !== projectId || packageRecord.id !== packageId
  );

  window.localStorage.setItem(
    projectBidPackagesStorageKey,
    JSON.stringify(nextPackageRecords)
  );
}

export function deleteProjectBidPackages(projectId: string) {
  if (typeof window === "undefined") return;

  const nextPackageRecords = getAllProjectBidPackages().filter(
    (packageRecord) => packageRecord.projectId !== projectId
  );

  window.localStorage.setItem(
    projectBidPackagesStorageKey,
    JSON.stringify(nextPackageRecords)
  );
}

export function getBidPackageById(
  projectId: string,
  packageId: string
): ProjectBidPackage | undefined {
  return getProjectBidPackages(projectId).find(
    (packageRecord) => packageRecord.id === packageId
  );
}

export function generateBidPackagesFromProjectScopes(
  projectId: string,
  csiVersion: string,
  selectedScopeItemIds: string[]
): ProjectBidPackage[] {
  const version = getSupportedCsiVersion(csiVersion);
  if (!version) return [];

  const packageGroups = new Map<
    string,
    {
      name: string;
      description?: string;
      sortReferenceItem: CsiCatalogItem;
      scopeItemIds: Set<string>;
    }
  >();

  selectedScopeItemIds.forEach((scopeItemId) => {
    const item = resolveCsiCatalogItem(version, scopeItemId);
    if (!item) return;

    const matchingTemplate = getBestBidPackageTemplate(version, item);
    const groupingItem = getNearestLevel2Ancestor(version, item.id) ?? item;
    const groupKey = matchingTemplate
      ? `template-${matchingTemplate.id}`
      : `fallback-${groupingItem.id}`;
    const group =
      packageGroups.get(groupKey) ?? {
        name: matchingTemplate?.name ?? groupingItem.name,
        description:
          matchingTemplate?.description ??
          "Generated fallback package grouped by nearest CSI subdivision.",
        sortReferenceItem: groupingItem,
        scopeItemIds: new Set<string>(),
      };

    group.scopeItemIds.add(item.id);
    packageGroups.set(groupKey, group);
  });

  const now = new Date().toISOString();

  return Array.from(packageGroups.entries())
    .sort((left, right) =>
      compareCsiCatalogItems(
        left[1].sortReferenceItem,
        right[1].sortReferenceItem
      )
    )
    .map(([groupKey, group], index) => ({
      id: createGeneratedBidPackageId(projectId, groupKey),
      projectId,
      name: group.name,
      description: group.description,
      csiVersion,
      scopeItemIds: Array.from(group.scopeItemIds).sort((leftId, rightId) => {
        const leftItem = resolveCsiCatalogItem(version, leftId);
        const rightItem = resolveCsiCatalogItem(version, rightId);

        if (!leftItem || !rightItem) return leftId.localeCompare(rightId);

        return compareCsiCatalogItems(leftItem, rightItem);
      }),
      sortOrder: index,
      status: "DRAFT",
      source: "GENERATED",
      createdAt: now,
      updatedAt: now,
    }));
}

export function deleteProjectBidSubmission(submissionId: string) {
  if (typeof window === "undefined") return;

  const nextSubmissions = getAllProjectBidSubmissions().filter(
    (submission) => submission.id !== submissionId
  );

  window.localStorage.setItem(
    projectBidSubmissionsStorageKey,
    JSON.stringify(nextSubmissions)
  );
}

export function deleteProjectBidSubmissionAndDependencies(
  projectId: string,
  submissionId: string
) {
  if (typeof window === "undefined") return;

  const nextSubmissions = getAllProjectBidSubmissions().filter(
    (submission) => submission.id !== submissionId
  );
  const nextDecisions = getAllProjectBidLevelingDecisions().filter(
    (decision) =>
      decision.projectId !== projectId ||
      decision.bidSubmissionId !== submissionId
  );

  window.localStorage.setItem(
    projectBidSubmissionsStorageKey,
    JSON.stringify(nextSubmissions)
  );
  window.localStorage.setItem(
    projectBidLevelingDecisionsStorageKey,
    JSON.stringify(nextDecisions)
  );
}

export function getProjectBidLevelingDecisions(
  projectId: string
): ProjectBidLevelingDecision[] {
  return getAllProjectBidLevelingDecisions().filter(
    (decision) => decision.projectId === projectId
  );
}

export function getAllProjectBidLevelingDecisions(): ProjectBidLevelingDecision[] {
  if (typeof window === "undefined") return [];

  return parseProjectBidLevelingDecisions(
    window.localStorage.getItem(projectBidLevelingDecisionsStorageKey) || "[]"
  );
}

export function saveProjectBidLevelingDecision(
  decision: ProjectBidLevelingDecision
) {
  if (typeof window === "undefined") return;

  const decisions = getAllProjectBidLevelingDecisions();
  const nextDecisions = [
    ...decisions.filter((item) => item.id !== decision.id),
    decision,
  ];

  window.localStorage.setItem(
    projectBidLevelingDecisionsStorageKey,
    JSON.stringify(nextDecisions)
  );
}

export function deleteProjectBidLevelingDecision(decisionId: string) {
  if (typeof window === "undefined") return;

  const nextDecisions = getAllProjectBidLevelingDecisions().filter(
    (decision) => decision.id !== decisionId
  );

  window.localStorage.setItem(
    projectBidLevelingDecisionsStorageKey,
    JSON.stringify(nextDecisions)
  );
}

export function deleteProjectBidData(projectId: string) {
  if (typeof window === "undefined") return;

  const nextSubmissions = getAllProjectBidSubmissions().filter(
    (submission) => submission.projectId !== projectId
  );
  const nextDecisions = getAllProjectBidLevelingDecisions().filter(
    (decision) => decision.projectId !== projectId
  );

  window.localStorage.setItem(
    projectBidSubmissionsStorageKey,
    JSON.stringify(nextSubmissions)
  );
  window.localStorage.setItem(
    projectBidLevelingDecisionsStorageKey,
    JSON.stringify(nextDecisions)
  );
  deleteProjectBidPackages(projectId);
}

export function getProjectBidSummary(
  projectId: string,
  csiSelection?: StoredProjectCsiSelection
): ProjectBidSummary {
  const submissions = getProjectBidSubmissions(projectId);
  const selectedBidCount = submissions.filter(isSelectedSubmission).length;

  return {
    submissionCount: submissions.length,
    selectedBidCount,
    selectedBidTotal: getSelectedBidTotal(projectId),
    unreviewedBidCount: getUnreviewedBidCount(projectId),
    missingCoverageCount: getMissingBidCoverage(
      projectId,
      getSelectedScopeItemIds(csiSelection)
    ).length,
  };
}

export function getProjectScopeBidCoverage(
  projectId: string,
  csiSelection?: StoredProjectCsiSelection
): ProjectScopeBidCoverage[] {
  const submissions = getProjectBidSubmissions(projectId);

  return getSelectedScopeItemIds(csiSelection).map((scopeItemId) => {
    const bids = submissions.filter((submission) =>
      bidCoversScopeItem(submission, scopeItemId)
    );
    const selectedBidCount = bids.filter(isSelectedSubmission).length;

    return {
      scopeItemId,
      bidCount: bids.length,
      selectedBidCount,
      hasCoverage: bids.length > 0,
      missingCoverage: bids.length === 0,
    };
  });
}

export function getScopeGroupBidSubmissions(
  projectId: string,
  scopeGroupIdOrScopeItemId: string
): ProjectBidSubmission[] {
  return getProjectBidSubmissions(projectId).filter(
    (submission) =>
      submission.scopeItemIds.includes(scopeGroupIdOrScopeItemId) ||
      submission.primaryScopeItemId === scopeGroupIdOrScopeItemId ||
      submission.subdivisionId === scopeGroupIdOrScopeItemId ||
      submission.divisionId === scopeGroupIdOrScopeItemId
  );
}

export function getSelectedBidTotal(projectId: string): number {
  const submissions = getProjectBidSubmissions(projectId);
  const submissionsById = new Map(
    submissions.map((submission) => [submission.id, submission])
  );
  const selectedDecisions = getProjectBidLevelingDecisions(projectId).filter(
    (decision) => decision.isSelected
  );

  if (selectedDecisions.length > 0) {
    return selectedDecisions.reduce((total, decision) => {
      const submission = submissionsById.get(decision.bidSubmissionId);
      if (!submission) return total;

      return total + getLeveledBidAmount(submission, decision);
    }, 0);
  }

  return submissions
    .filter(isSelectedSubmission)
    .reduce(
      (total, submission) => total + getSubmittedBidAmount(submission),
      0
    );
}

export function getUnreviewedBidCount(projectId: string): number {
  const decisionsBySubmissionId = new Map(
    getProjectBidLevelingDecisions(projectId).map((decision) => [
      decision.bidSubmissionId,
      decision,
    ])
  );

  return getProjectBidSubmissions(projectId).filter((submission) => {
    const decision = decisionsBySubmissionId.get(submission.id);

    if (decision?.reviewStatus) {
      return decision.reviewStatus === "UNREVIEWED";
    }

    return submission.status === "DRAFT" || submission.status === "RECEIVED";
  }).length;
}

export function getMissingBidCoverage(
  projectId: string,
  selectedScopeItemIds: string[]
): string[] {
  const submissions = getProjectBidSubmissions(projectId);

  return selectedScopeItemIds.filter(
    (scopeItemId) =>
      !submissions.some((submission) =>
        bidCoversScopeItem(submission, scopeItemId)
      )
  );
}

function parseProjectBidSubmissions(
  storageValue: string
): ProjectBidSubmission[] {
  try {
    const parsedValue = JSON.parse(storageValue);

    return Array.isArray(parsedValue)
      ? parsedValue.filter(isProjectBidSubmission)
      : [];
  } catch {
    return [];
  }
}

function parseProjectBidPackages(storageValue: string): ProjectBidPackage[] {
  try {
    const parsedValue = JSON.parse(storageValue);

    return Array.isArray(parsedValue)
      ? parsedValue.filter(isProjectBidPackage)
      : [];
  } catch {
    return [];
  }
}

function parseProjectBidLevelingDecisions(
  storageValue: string
): ProjectBidLevelingDecision[] {
  try {
    const parsedValue = JSON.parse(storageValue);

    return Array.isArray(parsedValue)
      ? parsedValue
          .map(normalizeProjectBidLevelingDecision)
          .filter(isDefined)
      : [];
  } catch {
    return [];
  }
}

function isProjectBidSubmission(
  value: unknown
): value is ProjectBidSubmission {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.projectId === "string" &&
    typeof value.csiVersion === "string" &&
    Array.isArray(value.scopeItemIds) &&
    value.scopeItemIds.every((scopeItemId) => typeof scopeItemId === "string") &&
    typeof value.status === "string" &&
    bidSubmissionStatuses.includes(value.status as ProjectBidSubmissionStatus) &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string"
  );
}

function isProjectBidPackage(value: unknown): value is ProjectBidPackage {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.projectId === "string" &&
    typeof value.name === "string" &&
    typeof value.csiVersion === "string" &&
    Array.isArray(value.scopeItemIds) &&
    value.scopeItemIds.every((scopeItemId) => typeof scopeItemId === "string") &&
    isOptionalBidPackageStatus(value.status) &&
    isOptionalBidPackageSource(value.source) &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string"
  );
}

function normalizeProjectBidLevelingDecision(
  value: unknown
): ProjectBidLevelingDecision | undefined {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    typeof value.projectId !== "string" ||
    typeof value.scopeGroupId !== "string" ||
    typeof value.bidSubmissionId !== "string" ||
    !isOptionalStringArray(value.scopeItemIds) ||
    !isOptionalStringArray(value.acceptedPricingItemIds) ||
    !isOptionalReviewStatus(value.reviewStatus) ||
    typeof value.createdAt !== "string" ||
    typeof value.updatedAt !== "string"
  ) {
    return undefined;
  }

  return {
    ...(value as ProjectBidLevelingDecision),
    adjustments: normalizeBidPricingItems(value.adjustments),
    acceptedPricingItemIds: value.acceptedPricingItemIds,
  };
}

function isOptionalStringArray(value: unknown) {
  return (
    value === undefined ||
    (Array.isArray(value) && value.every((item) => typeof item === "string"))
  );
}

function isOptionalReviewStatus(value: unknown) {
  return (
    value === undefined ||
    (typeof value === "string" &&
      bidReviewStatuses.includes(value as ProjectBidReviewStatus))
  );
}

function isOptionalBidPackageStatus(value: unknown) {
  return (
    value === undefined ||
    (typeof value === "string" &&
      bidPackageStatuses.includes(value as ProjectBidPackageStatus))
  );
}

function isOptionalBidPackageSource(value: unknown) {
  return (
    value === undefined ||
    (typeof value === "string" &&
      bidPackageSources.includes(value as ProjectBidPackageSource))
  );
}

function getSupportedCsiVersion(
  csiVersion: string
): CsiMasterFormatVersion | undefined {
  return csiMasterFormatVersions.includes(csiVersion as CsiMasterFormatVersion)
    ? (csiVersion as CsiMasterFormatVersion)
    : undefined;
}

function getSelectedScopeItemIds(csiSelection: StoredProjectCsiSelection | undefined) {
  return csiSelection?.sectionIds ?? [];
}

export function getSubmittedBidAmount(submission: ProjectBidSubmission): number {
  return (
    getBaseBidAmount(submission) +
    getAcceptedSubmittedPricingItems(submission).reduce(
      (total, item) => total + getPricingItemSignedAmount(item),
      0
    )
  );
}

export function getLeveledBidAmount(
  submission: ProjectBidSubmission,
  decision: ProjectBidLevelingDecision
): number {
  if (decision.leveledAmount !== undefined) return decision.leveledAmount;

  return (
    getBaseBidAmount(submission) +
    getAcceptedSubmittedPricingItems(submission, decision).reduce(
      (total, item) => total + getPricingItemSignedAmount(item),
      0
    ) +
    (decision.adjustments ?? []).reduce(
      (total, item) => total + getPricingItemSignedAmount(item),
      0
    )
  );
}

function getBaseBidAmount(submission: ProjectBidSubmission): number {
  return submission.baseBidAmount ?? submission.amount ?? 0;
}

function getAcceptedSubmittedPricingItems(
  submission: ProjectBidSubmission,
  decision?: ProjectBidLevelingDecision
) {
  const acceptedPricingItemIds = new Set(decision?.acceptedPricingItemIds ?? []);

  return (submission.pricingItems ?? []).filter((item) => {
    if (item.source && item.source !== "SUBMITTED") return false;
    if (acceptedPricingItemIds.size > 0) return acceptedPricingItemIds.has(item.id);

    return item.isAccepted === true;
  });
}

function getPricingItemSignedAmount(item: BidPricingItem): number {
  const amount = getPricingItemAmount(item);

  if (item.direction === "DEDUCT") return -amount;
  if (item.direction === "ADD" || item.direction === "INCLUDED") return amount;

  return 0;
}

function getPricingItemAmount(item: BidPricingItem): number {
  if (item.amount !== undefined) return item.amount;
  if (item.quantity !== undefined && item.unitRate !== undefined) {
    return item.quantity * item.unitRate;
  }

  return 0;
}

function bidCoversScopeItem(
  submission: ProjectBidSubmission,
  scopeItemId: string
) {
  return (
    submission.scopeItemIds.includes(scopeItemId) ||
    submission.primaryScopeItemId === scopeItemId
  );
}

function isSelectedSubmission(submission: ProjectBidSubmission) {
  return submission.status === "SELECTED";
}

function compareBidPackages(
  packageA: ProjectBidPackage,
  packageB: ProjectBidPackage
) {
  if (packageA.sortOrder !== undefined || packageB.sortOrder !== undefined) {
    return (packageA.sortOrder ?? 0) - (packageB.sortOrder ?? 0);
  }

  return packageA.name.localeCompare(packageB.name);
}

function compareCsiCatalogItems(
  itemA: CsiCatalogItem,
  itemB: CsiCatalogItem
) {
  return itemA.number.localeCompare(itemB.number, undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

function getBestBidPackageTemplate(
  version: CsiMasterFormatVersion,
  item: CsiCatalogItem
): BidPackageTemplate | undefined {
  return bidPackageTemplates
    .filter((template) => isTemplateAvailableForVersion(template, version))
    .filter((template) => doesBidPackageTemplateMatchItem(template, item))
    .sort((left, right) => (right.priority ?? 0) - (left.priority ?? 0))[0];
}

function isTemplateAvailableForVersion(
  template: BidPackageTemplate,
  version: CsiMasterFormatVersion
) {
  return template.csiVersion === "ALL" || template.csiVersion === version;
}

function doesBidPackageTemplateMatchItem(
  template: BidPackageTemplate,
  item: CsiCatalogItem
) {
  const normalizedItemCode = normalizeCsiCode(item.number);
  const searchableTitle = normalizeSearchText(
    [
      item.name,
      ...getCsiAncestors(item.version, item.id).map(
        (ancestor) => ancestor.name
      ),
    ].join(" ")
  );
  const matchesCode = (template.codePatterns ?? []).some((pattern) =>
    doesCodePatternMatch(normalizedItemCode, pattern)
  );
  const matchesTitle = (template.titleKeywords ?? []).some((keyword) =>
    searchableTitle.includes(normalizeSearchText(keyword))
  );

  return matchesCode || matchesTitle;
}

function doesCodePatternMatch(normalizedItemCode: string, pattern: string) {
  const normalizedPattern = normalizeCsiCode(pattern.replace(/\*$/, ""));

  if (!normalizedPattern) return false;

  return normalizedItemCode.startsWith(normalizedPattern);
}

function normalizeCsiCode(value: string) {
  return value.replace(/[^0-9]/g, "");
}

function normalizeSearchText(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function createGeneratedBidPackageId(projectId: string, groupingItemId: string) {
  return `generated-bid-package-${sanitizeIdPart(projectId)}-${sanitizeIdPart(
    groupingItemId
  )}`;
}

function sanitizeIdPart(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "-");
}

function isBidPricingItem(value: unknown): value is BidPricingItem {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.category === "string" &&
    typeof value.direction === "string" &&
    pricingItemDirections.includes(value.direction as BidPricingItemDirection) &&
    typeof value.label === "string"
  );
}

function normalizeBidPricingItems(value: unknown): BidPricingItem[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) return undefined;

  return value.map(normalizeBidPricingItem).filter(isDefined);
}

function normalizeBidPricingItem(value: unknown): BidPricingItem | undefined {
  if (isBidPricingItem(value)) return value;
  if (!isLegacyLevelingAdjustment(value)) return undefined;

  return {
    id: value.id,
    category: "LEVELING_ADJUSTMENT",
    direction: value.type,
    label: value.label,
    amount: value.amount,
    notes: value.notes,
    source: "ESTIMATOR_ADJUSTMENT",
  };
}

function isLegacyLevelingAdjustment(
  value: unknown
): value is {
  id: string;
  label: string;
  amount: number;
  type: "ADD" | "DEDUCT";
  notes?: string;
} {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.label === "string" &&
    typeof value.amount === "number" &&
    (value.type === "ADD" || value.type === "DEDUCT") &&
    (value.notes === undefined || typeof value.notes === "string")
  );
}

function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
