import { CsiMasterFormatVersion } from "./Csi";

export type ProjectBidSubmissionStatus =
  | "DRAFT"
  | "RECEIVED"
  | "REVIEWED"
  | "LEVELED"
  | "SELECTED"
  | "REJECTED";

export type ProjectBidSourceDocumentType =
  | "PDF"
  | "WORD"
  | "EXCEL"
  | "EMAIL"
  | "OTHER";

export type ProjectBidPackageStatus = "DRAFT" | "ACTIVE" | "CLOSED";

export type ProjectBidPackageSource =
  | "MANUAL"
  | "GENERATED"
  | "COMPANY_DEFAULT";

export type ProjectBidPackage = {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  csiVersion: string;
  scopeItemIds: string[];
  sortOrder?: number;
  status?: ProjectBidPackageStatus;
  source?: ProjectBidPackageSource;
  createdAt: string;
  updatedAt: string;
};

export type BidPackageTemplate = {
  id: string;
  name: string;
  description?: string;
  csiVersion: string;
  codePatterns?: string[];
  titleKeywords?: string[];
  priority?: number;
};

export type BidPricingItemCategory =
  | "ALTERNATE"
  | "LEVELING_ADJUSTMENT"
  | "ALLOWANCE"
  | "UNIT_PRICE"
  | "CONTINGENCY"
  | "TAX"
  | "BOND"
  | "FEE"
  | "OTHER";

export type BidPricingItemDirection =
  | "ADD"
  | "DEDUCT"
  | "INCLUDED"
  | "EXCLUDED"
  | "INFORMATIONAL";

export type BidPricingItemSource =
  | "SUBMITTED"
  | "ESTIMATOR_ADJUSTMENT"
  | "OWNER_REQUEST"
  | "SYSTEM";

export type BidPricingItem = {
  id: string;
  category: BidPricingItemCategory;
  direction: BidPricingItemDirection;
  label: string;
  amount?: number;
  quantity?: number;
  unit?: string;
  unitRate?: number;
  notes?: string;
  isAccepted?: boolean;
  source?: BidPricingItemSource;
};

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
  baseBidAmount?: number;
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
  sourceDocumentName?: string;
  sourceDocumentType?: ProjectBidSourceDocumentType;
  sourceDocumentNotes?: string;
  pricingItems?: BidPricingItem[];
  alternates?: ProjectBidLineItem[];
  allowances?: ProjectBidLineItem[];
  unitPrices?: ProjectBidUnitPrice[];
  attachments?: ProjectBidAttachment[];
  createdAt: string;
  updatedAt: string;
};

export type ProjectBidLevelingAdjustmentType = "ADD" | "DEDUCT";

export type ProjectBidLevelingAdjustment = BidPricingItem & {
  id: string;
  label: string;
  amount: number;
  type?: ProjectBidLevelingAdjustmentType;
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
  adjustments?: BidPricingItem[];
  acceptedPricingItemIds?: string[];
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
