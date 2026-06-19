import { CsiMasterFormatVersion } from "./Csi";

export type ProjectBidSubmissionStatus =
  | "DRAFT"
  | "RECEIVED"
  | "REVIEWED"
  | "LEVELED"
  | "SELECTED"
  | "REJECTED";

export type ProjectBidLineItem = {
  id: string;
  label: string;
  amount?: number;
  notes?: string;
};

export type ProjectBidUnitPrice = ProjectBidLineItem & {
  unit?: string;
};

export type ProjectBidAttachment = {
  id: string;
  filename: string;
  url?: string;
  uploadedAt?: string;
};

export type ProjectBidSubmission = {
  id: string;
  projectId: string;
  subcontractorId?: string;
  subcontractorName?: string;
  sourceInviteCandidateId?: string;
  csiVersion: CsiMasterFormatVersion;
  scopeItemIds: string[];
  primaryScopeItemId?: string;
  divisionId?: string;
  subdivisionId?: string;
  amount?: number;
  status: ProjectBidSubmissionStatus;
  submittedAt?: string;
  receivedBy?: string;
  contactId?: string;
  inclusions?: string[];
  exclusions?: string[];
  clarifications?: string[];
  qualifications?: string[];
  notes?: string;
  alternates?: ProjectBidLineItem[];
  allowances?: ProjectBidLineItem[];
  unitPrices?: ProjectBidUnitPrice[];
  attachments?: ProjectBidAttachment[];
  createdAt: string;
  updatedAt: string;
};

export type ProjectBidLevelingAdjustmentType = "ADD" | "DEDUCT";

export type ProjectBidLevelingAdjustment = {
  id: string;
  label: string;
  amount: number;
  type: ProjectBidLevelingAdjustmentType;
  notes?: string;
};

export type ProjectBidClarificationStatus =
  | "NOT_STARTED"
  | "REQUESTED"
  | "RECEIVED"
  | "RESOLVED"
  | "NOT_REQUIRED";

export type ProjectBidReviewStatus =
  | "UNREVIEWED"
  | "IN_REVIEW"
  | "REVIEWED"
  | "APPROVED"
  | "REJECTED";

export type ProjectBidLevelingDecision = {
  id: string;
  projectId: string;
  scopeGroupId: string;
  scopeItemIds?: string[];
  bidSubmissionId: string;
  isSelected?: boolean;
  leveledAmount?: number;
  adjustments?: ProjectBidLevelingAdjustment[];
  scopeGapNotes?: string;
  normalizedInclusions?: string[];
  normalizedExclusions?: string[];
  clarificationStatus?: ProjectBidClarificationStatus;
  reviewStatus?: ProjectBidReviewStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
};
