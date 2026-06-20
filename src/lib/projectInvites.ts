import {
  GenerateInviteRecipientsInput,
  ProjectInviteRecipient,
  ProjectInviteRecipientConfidence,
  ProjectInviteRecipientSource,
  ProjectInviteRecipientStatus,
} from "@/types/Invite";
import { BidPackageSubcontractorMatch } from "@/types/SubcontractorMatching";

export const projectInviteRecipientsStorageKey = "projectInviteRecipients";

const inviteRecipientSources: ProjectInviteRecipientSource[] = [
  "MATCHED",
  "MANUAL",
];
const inviteRecipientStatuses: ProjectInviteRecipientStatus[] = [
  "DRAFT",
  "QUEUED",
  "SENT",
  "FAILED",
  "REMOVED",
];
const inviteRecipientConfidenceValues: ProjectInviteRecipientConfidence[] = [
  "LOW",
  "MEDIUM",
  "HIGH",
];

export function getProjectInviteRecipients(
  projectId: string
): ProjectInviteRecipient[] {
  return getAllProjectInviteRecipients().filter(
    (recipient) => recipient.projectId === projectId
  );
}

export function getAllProjectInviteRecipients(): ProjectInviteRecipient[] {
  if (typeof window === "undefined") return [];

  return parseProjectInviteRecipients(
    window.localStorage.getItem(projectInviteRecipientsStorageKey) || "[]"
  );
}

export function saveProjectInviteRecipient(recipient: ProjectInviteRecipient) {
  if (typeof window === "undefined") return;

  const recipients = getAllProjectInviteRecipients();
  const nextRecipients = upsertRecipient(recipients, recipient);

  window.localStorage.setItem(
    projectInviteRecipientsStorageKey,
    JSON.stringify(nextRecipients)
  );
}

export function saveProjectInviteRecipients(
  projectId: string,
  recipients: ProjectInviteRecipient[]
) {
  if (typeof window === "undefined") return;

  const unrelatedRecipients = getAllProjectInviteRecipients().filter(
    (recipient) => recipient.projectId !== projectId
  );
  const nextProjectRecipients = recipients.reduce<ProjectInviteRecipient[]>(
    upsertRecipient,
    []
  );

  window.localStorage.setItem(
    projectInviteRecipientsStorageKey,
    JSON.stringify([...unrelatedRecipients, ...nextProjectRecipients])
  );
}

export function deleteProjectInviteRecipient(
  projectId: string,
  recipientId: string
) {
  if (typeof window === "undefined") return;

  const nextRecipients = getAllProjectInviteRecipients().filter(
    (recipient) =>
      recipient.projectId !== projectId || recipient.id !== recipientId
  );

  window.localStorage.setItem(
    projectInviteRecipientsStorageKey,
    JSON.stringify(nextRecipients)
  );
}

export function deleteProjectInviteRecipientsForPackage(
  projectId: string,
  bidPackageId: string
) {
  if (typeof window === "undefined") return;

  const nextRecipients = getAllProjectInviteRecipients().filter(
    (recipient) =>
      recipient.projectId !== projectId ||
      recipient.bidPackageId !== bidPackageId
  );

  window.localStorage.setItem(
    projectInviteRecipientsStorageKey,
    JSON.stringify(nextRecipients)
  );
}

export function deleteProjectInviteRecipientsForProject(projectId: string) {
  if (typeof window === "undefined") return;

  const nextRecipients = getAllProjectInviteRecipients().filter(
    (recipient) => recipient.projectId !== projectId
  );

  window.localStorage.setItem(
    projectInviteRecipientsStorageKey,
    JSON.stringify(nextRecipients)
  );
}

export function markInviteRecipientSent(
  projectId: string,
  recipientId: string,
  email?: string
) {
  const now = new Date().toISOString();

  return updateProjectInviteRecipient(projectId, recipientId, (recipient) => ({
    ...recipient,
    email: email?.trim() || recipient.email,
    status: "SENT",
    sentAt: recipient.sentAt ?? now,
    lastSentAt: now,
    sendCount: (recipient.sendCount ?? 0) + 1,
    lastError: undefined,
    updatedAt: now,
  }));
}

export function markInviteRecipientFailed(
  projectId: string,
  recipientId: string,
  error: string
) {
  const now = new Date().toISOString();

  return updateProjectInviteRecipient(projectId, recipientId, (recipient) => ({
    ...recipient,
    status: "FAILED",
    lastError: error,
    updatedAt: now,
  }));
}

export function simulateSendInviteRecipient(
  projectId: string,
  recipientId: string,
  email?: string
) {
  const recipient = getProjectInviteRecipients(projectId).find(
    (item) => item.id === recipientId
  );
  const resolvedEmail = email?.trim() || recipient?.email?.trim();

  if (!recipient) return undefined;

  return resolvedEmail
    ? markInviteRecipientSent(projectId, recipientId, resolvedEmail)
    : markInviteRecipientFailed(
        projectId,
        recipientId,
        "Missing recipient email"
      );
}

export function simulateSendBidPackageInvites(
  projectId: string,
  bidPackageId: string
) {
  const recipients = getProjectInviteRecipients(projectId).filter(
    (recipient) =>
      recipient.bidPackageId === bidPackageId &&
      recipient.status !== "REMOVED" &&
      (recipient.status === "DRAFT" || recipient.status === "FAILED")
  );

  return recipients.reduce(
    (summary, recipient) => {
      const result = simulateSendInviteRecipient(projectId, recipient.id);

      if (result?.status === "SENT") {
        return { ...summary, sent: summary.sent + 1 };
      }

      return { ...summary, failed: summary.failed + 1 };
    },
    { sent: 0, failed: 0 }
  );
}

export function generateInviteRecipientsFromBidPackageMatches({
  projectId,
  bidPackages,
  packageMatches,
}: GenerateInviteRecipientsInput): ProjectInviteRecipient[] {
  const existingRecipients = getProjectInviteRecipients(projectId);
  const manualRecipients = existingRecipients.filter(
    (recipient) => recipient.source === "MANUAL"
  );
  const existingRecipientsByKey = new Map(
    existingRecipients.map((recipient) => [getRecipientDedupeKey(recipient), recipient])
  );
  const bidPackageIds = new Set(bidPackages.map((bidPackage) => bidPackage.id));
  const generatedRecipients = packageMatches.flatMap((packageMatchSummary) =>
    packageMatchSummary.matches.flatMap((match) =>
      createMatchedRecipients(match, existingRecipientsByKey)
    )
  );

  return [...manualRecipients.filter((recipient) => bidPackageIds.has(recipient.bidPackageId))]
    .concat(generatedRecipients)
    .reduce<ProjectInviteRecipient[]>(upsertRecipient, []);
}

function createMatchedRecipients(
  match: BidPackageSubcontractorMatch,
  existingRecipientsByKey: Map<string, ProjectInviteRecipient>
) {
  const contactIds =
    match.defaultContactIds.length > 0 ? match.defaultContactIds : [undefined];

  return contactIds.map((contactId) => {
    const draftRecipient: ProjectInviteRecipient = {
      id: createInviteRecipientId(match.projectId, match.bidPackageId),
      projectId: match.projectId,
      bidPackageId: match.bidPackageId,
      subcontractorId: match.subcontractorId,
      contactId,
      selectedScopeItemIds: match.matchedScopeItemIds,
      matchType: match.matchType,
      matchLabel: match.matchLabel,
      confidence: getRecipientConfidence(match),
      coverageRatio: match.coverageRatio,
      source: "MATCHED",
      status: "DRAFT",
      addedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const existingRecipient = existingRecipientsByKey.get(
      getRecipientDedupeKey(draftRecipient)
    );

    return existingRecipient
      ? {
          ...existingRecipient,
          selectedScopeItemIds: draftRecipient.selectedScopeItemIds,
          matchType: draftRecipient.matchType,
          matchLabel: draftRecipient.matchLabel,
          confidence: draftRecipient.confidence,
          coverageRatio: draftRecipient.coverageRatio,
          source: "MATCHED" as const,
          updatedAt: draftRecipient.updatedAt,
        }
      : draftRecipient;
  });
}

function upsertRecipient(
  recipients: ProjectInviteRecipient[],
  recipient: ProjectInviteRecipient
) {
  const recipientKey = getRecipientDedupeKey(recipient);
  const existingRecipientIndex = recipients.findIndex(
    (item) => item.id === recipient.id || getRecipientDedupeKey(item) === recipientKey
  );

  if (existingRecipientIndex === -1) return [...recipients, recipient];

  return recipients.map((item, index) =>
    index === existingRecipientIndex ? recipient : item
  );
}

function updateProjectInviteRecipient(
  projectId: string,
  recipientId: string,
  updateRecipient: (
    recipient: ProjectInviteRecipient
  ) => ProjectInviteRecipient
) {
  if (typeof window === "undefined") return undefined;

  let updatedRecipient: ProjectInviteRecipient | undefined;
  const nextRecipients = getAllProjectInviteRecipients().map((recipient) => {
    if (recipient.projectId !== projectId || recipient.id !== recipientId) {
      return recipient;
    }

    updatedRecipient = updateRecipient(recipient);
    return updatedRecipient;
  });

  if (!updatedRecipient) return undefined;

  window.localStorage.setItem(
    projectInviteRecipientsStorageKey,
    JSON.stringify(nextRecipients)
  );

  return updatedRecipient;
}

function getRecipientDedupeKey(recipient: ProjectInviteRecipient) {
  return [
    recipient.projectId,
    recipient.bidPackageId,
    recipient.subcontractorId,
    recipient.contactId ?? recipient.email ?? "company",
  ].join(":");
}

function getRecipientConfidence(
  match: BidPackageSubcontractorMatch
): ProjectInviteRecipientConfidence {
  if (match.coverageRatio >= 0.75 && !match.isPossibleMatch) return "HIGH";
  if (match.coverageRatio >= 0.5) return "MEDIUM";

  return "LOW";
}

function parseProjectInviteRecipients(
  storageValue: string
): ProjectInviteRecipient[] {
  try {
    const parsedValue = JSON.parse(storageValue);

    return Array.isArray(parsedValue)
      ? parsedValue.filter(isProjectInviteRecipient)
      : [];
  } catch {
    return [];
  }
}

function isProjectInviteRecipient(
  value: unknown
): value is ProjectInviteRecipient {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.projectId === "string" &&
    typeof value.bidPackageId === "string" &&
    typeof value.subcontractorId === "string" &&
    isOptionalString(value.contactId) &&
    isOptionalString(value.email) &&
    Array.isArray(value.selectedScopeItemIds) &&
    value.selectedScopeItemIds.every((scopeItemId) => typeof scopeItemId === "string") &&
    isOptionalString(value.matchType) &&
    isOptionalString(value.matchLabel) &&
    isOptionalInviteRecipientConfidence(value.confidence) &&
    isOptionalNumber(value.coverageRatio) &&
    typeof value.source === "string" &&
    inviteRecipientSources.includes(value.source as ProjectInviteRecipientSource) &&
    typeof value.status === "string" &&
    inviteRecipientStatuses.includes(value.status as ProjectInviteRecipientStatus) &&
    isOptionalString(value.sentAt) &&
    isOptionalString(value.lastSentAt) &&
    isOptionalNumber(value.sendCount) &&
    isOptionalString(value.lastError) &&
    typeof value.addedAt === "string" &&
    typeof value.updatedAt === "string"
  );
}

function isOptionalInviteRecipientConfidence(value: unknown) {
  return (
    value === undefined ||
    (typeof value === "string" &&
      inviteRecipientConfidenceValues.includes(
        value as ProjectInviteRecipientConfidence
      ))
  );
}

function isOptionalString(value: unknown) {
  return value === undefined || typeof value === "string";
}

function isOptionalNumber(value: unknown) {
  return value === undefined || typeof value === "number";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function createInviteRecipientId(projectId: string, bidPackageId: string) {
  const randomPart =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Date.now().toString();

  return `invite-recipient-${sanitizeIdPart(projectId)}-${sanitizeIdPart(
    bidPackageId
  )}-${randomPart}`;
}

function sanitizeIdPart(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "-");
}
