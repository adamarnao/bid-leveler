import {
  ProjectBidLevelingDecision,
  ProjectBidReviewStatus,
  ProjectBidSubmission,
  ProjectBidSubmissionStatus,
} from "@/types/Bid";

export const projectBidSubmissionsStorageKey = "projectBidSubmissions";
export const projectBidLevelingDecisionsStorageKey =
  "projectBidLevelingDecisions";
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

function parseProjectBidLevelingDecisions(
  storageValue: string
): ProjectBidLevelingDecision[] {
  try {
    const parsedValue = JSON.parse(storageValue);

    return Array.isArray(parsedValue)
      ? parsedValue.filter(isProjectBidLevelingDecision)
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

function isProjectBidLevelingDecision(
  value: unknown
): value is ProjectBidLevelingDecision {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.projectId === "string" &&
    typeof value.scopeGroupId === "string" &&
    typeof value.bidSubmissionId === "string" &&
    isOptionalStringArray(value.scopeItemIds) &&
    isOptionalReviewStatus(value.reviewStatus) &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string"
  );
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
