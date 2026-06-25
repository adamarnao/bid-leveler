/**
 * Bid-Leveler Database-Ready Domain Model Source
 *
 * Planning/source types only. Do not import this file into live app code until
 * an explicit database implementation phase.
 */

export type EntityId = string;
export type IsoDateString = string;

export type MasterFormatVersionId =
  | "MASTERFORMAT_1995"
  | "MASTERFORMAT_2004_PLUS";

export type VisibilityDecision =
  | "CORE"
  | "SUGGESTED"
  | "CONTEXTUAL"
  | "HIDDEN_AVAILABLE"
  | "EXCLUDED";

export type BidPackageCsiTagRole =
  | "CORE"
  | "OPTIONAL"
  | "POSSIBLE"
  | "EXCLUDED";

export type CsiCoverageSource =
  | "USER_SELECTED"
  | "SYSTEM_DERIVED"
  | "COMPANY_DEFAULT"
  | "MANUAL_OVERRIDE";

export type MappingConfidence =
  | "HIGH"
  | "MEDIUM"
  | "LOW";

export type PricingItemCategory =
  | "BASE_BID"
  | "ALTERNATE"
  | "LEVELING_ADJUSTMENT"
  | "ALLOWANCE"
  | "UNIT_PRICE"
  | "CONTINGENCY"
  | "TAX"
  | "BOND"
  | "FEE"
  | "OTHER";

export type PricingItemDirection =
  | "ADD"
  | "DEDUCT"
  | "INCLUDED"
  | "EXCLUDED"
  | "INFORMATIONAL";

export type Company = {
  id: EntityId;
  name: string;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
};

export type User = {
  id: EntityId;
  companyId: EntityId;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
};

export type UserRole = {
  id: EntityId;
  companyId: EntityId;
  userId: EntityId;
  role:
    | "ADMIN"
    | "ESTIMATOR"
    | "ESTIMATING_COORDINATOR"
    | "PROJECT_MANAGER"
    | "VIEWER";
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
};

export type CompanySettings = {
  id: EntityId;
  companyId: EntityId;
  defaultCsiVersion: MasterFormatVersionId;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
};

export type CompanyDefaultCsiVersion = {
  id: EntityId;
  companyId: EntityId;
  csiVersion: MasterFormatVersionId;
  reason?: string;
  updatedByUserId?: EntityId;
  updatedAt: IsoDateString;
};

export type CompanyTradeVisibilityOverride = {
  id: EntityId;
  companyId: EntityId;
  tradeId: string;
  specializationId?: string;
  decision: VisibilityDecision;
  sectorTags?: string[];
  facilityTypeTags?: string[];
  workTypeTags?: string[];
  contextTags?: string[];
  reason: string;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
};

export type CompanyCsiToTradeOverride = {
  id: EntityId;
  companyId: EntityId;
  csiVersion: MasterFormatVersionId;
  csiItemId?: string;
  csiNumber?: string;
  tradeId: string;
  specializationId?: string;
  confidence?: MappingConfidence;
  reason: string;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
};

export type CompanyBidPackageTemplate = {
  id: EntityId;
  companyId: EntityId;
  name: string;
  tradeId: string;
  specializationIds?: string[];
  defaultCsiTagIds?: string[];
  defaultScopeSummary?: string;
  isActive: boolean;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
};

export type CompanyTerminologyPreference = {
  id: EntityId;
  companyId: EntityId;
  canonicalTerm: string;
  preferredLabel: string;
  notes?: string;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
};

export type SubcontractorCompany = {
  id: EntityId;
  companyId: EntityId;
  name: string;
  website?: string;
  status?: "ACTIVE" | "INACTIVE" | "DO_NOT_USE";
  notes?: string;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
};

export type SubcontractorLocation = {
  id: EntityId;
  subcontractorCompanyId: EntityId;
  label?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  serviceAreaNotes?: string;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
};

export type SubcontractorContact = {
  id: EntityId;
  subcontractorCompanyId: EntityId;
  locationId?: EntityId;
  name: string;
  email?: string;
  phone?: string;
  title?: string;
  isActive: boolean;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
};

export type SubcontractorContactRole = {
  id: EntityId;
  contactId: EntityId;
  role:
    | "ESTIMATING"
    | "PROJECT_MANAGEMENT"
    | "ACCOUNTING"
    | "CONTRACTS"
    | "INSURANCE"
    | "DIVISION_SPECIFIC"
    | "PACKAGE_SPECIFIC";
  tradeId?: string;
  specializationId?: string;
  bidPackageTemplateId?: EntityId;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
};

export type SubcontractorCsiCoverage = {
  id: EntityId;
  subcontractorCompanyId: EntityId;
  sourceVersion: MasterFormatVersionId;
  sourceCsiItemId: string;
  sourceCsiNumber?: string;
  sourceCsiTitle?: string;
  source: CsiCoverageSource;
  confidence: MappingConfidence;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
};

export type SubcontractorEquivalentCsiCoverage = {
  id: EntityId;
  subcontractorCsiCoverageId: EntityId;
  equivalentVersion: MasterFormatVersionId;
  equivalentCsiItemId: string;
  equivalentCsiNumber?: string;
  equivalentCsiTitle?: string;
  confidence: MappingConfidence;
  source: "CSI_CROSSWALK" | "MANUAL" | "SYSTEM";
  notes?: string;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
};

export type SubcontractorTradeSpecialization = {
  id: EntityId;
  subcontractorCompanyId: EntityId;
  tradeId: string;
  specializationId?: string;
  confidence?: MappingConfidence;
  source: "CSI_MAPPING" | "USER_SELECTED" | "COMPANY_DEFAULT" | "MANUAL_OVERRIDE";
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
};

export type SubcontractorPrequalification = {
  id: EntityId;
  subcontractorCompanyId: EntityId;
  status: "NOT_STARTED" | "IN_REVIEW" | "APPROVED" | "EXPIRED" | "REJECTED";
  approvedLimit?: number;
  expiresAt?: IsoDateString;
  notes?: string;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
};

export type SubcontractorInsuranceDocument = {
  id: EntityId;
  subcontractorCompanyId: EntityId;
  filename: string;
  documentUrl?: string;
  expiresAt?: IsoDateString;
  status?: "CURRENT" | "EXPIRING" | "EXPIRED" | "MISSING";
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
};

export type SubcontractorTaxDocument = {
  id: EntityId;
  subcontractorCompanyId: EntityId;
  documentType: "W9" | "OTHER";
  filename: string;
  documentUrl?: string;
  status?: "CURRENT" | "MISSING" | "NEEDS_REVIEW";
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
};

export type Project = {
  id: EntityId;
  companyId: EntityId;
  name: string;
  clientName?: string;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED" | "DELETED";
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
};

export type ProjectProfile = {
  id: EntityId;
  projectId: EntityId;
  classificationId?: EntityId;
  globalAttributesId?: EntityId;
  logisticsId?: EntityId;
  procurementId?: EntityId;
  packageDefaultAssumptions?: ProjectPackageDefaultAssumptions;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
};

export type ProjectClassification = {
  id: EntityId;
  projectProfileId: EntityId;
  sector: string;
  facilityType?: string;
  workType: string;
  contextTags: string[];
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
};

export type ProjectGlobalAttributes = {
  id: EntityId;
  projectProfileId: EntityId;
  squareFeet?: number;
  floors?: number;
  buildingCondition?: string;
  structureType?: string;
  occupancyCondition?: string;
  siteScope?: "NONE" | "LIMITED" | "SIGNIFICANT" | "UNKNOWN";
  envelopeScope?: "NONE" | "LIMITED" | "SIGNIFICANT" | "UNKNOWN";
  projectCsiVersion: MasterFormatVersionId;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
};

export type ProjectLogistics = {
  id: EntityId;
  projectProfileId: EntityId;
  siteWalkStatus?: "SCHEDULED" | "TBD" | "NOT_APPLICABLE";
  siteWalkDate?: IsoDateString;
  occupiedSite?: boolean;
  phasedWork?: boolean;
  nightWork?: boolean;
  restrictedAccess?: boolean;
  secureFacility?: boolean;
  highRise?: boolean;
  limitedLaydown?: boolean;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
};

export type ProjectProcurement = {
  id: EntityId;
  projectProfileId: EntityId;
  publicPrivate?: "PUBLIC" | "PRIVATE" | "UNKNOWN";
  prevailingWage?: boolean;
  bondRequired?: boolean;
  taxStatus?: string;
  contractType?: string;
  ownerVendorScope?: "OFCI" | "OFOI" | "CFCI" | "NIC" | "MIXED" | "UNKNOWN";
  alternatesRequired?: boolean;
  allowancesRequired?: boolean;
  unitPricesRequired?: boolean;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
};

export type ProjectPackageDefaultAssumptions = {
  defaultFinishLevel?: string;
  defaultDemoIntensity?: string;
  defaultMepIntensity?: string;
  defaultLowVoltageIntensity?: string;
};

export type ProjectDocument = {
  id: EntityId;
  projectId: EntityId;
  documentType: "PLANS" | "SPECS" | "ADDENDUM" | "BID_FORM" | "INSTRUCTIONS" | "OTHER";
  name: string;
  url?: string;
  notes?: string;
  issuedAt?: IsoDateString;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
};

export type ProjectEvent = {
  id: EntityId;
  projectId: EntityId;
  eventType: "SITE_WALK" | "PRE_BID" | "RFI_DEADLINE" | "SUB_BID_DUE" | "GC_BID_DUE" | "ADDENDUM" | "OTHER";
  title: string;
  startsAt?: IsoDateString;
  endsAt?: IsoDateString;
  location?: string;
  notes?: string;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
};

export type ProjectTradeVisibilityOverride = {
  id: EntityId;
  projectId: EntityId;
  tradeId: string;
  specializationId?: string;
  decision: VisibilityDecision;
  reason: string;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
};

export type ProjectCsiVersionSettings = {
  id: EntityId;
  projectId: EntityId;
  companyDefaultCsiVersion: MasterFormatVersionId;
  projectCsiVersion: MasterFormatVersionId;
  wasProjectOverride: boolean;
  reason?: string;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
};

export type ProjectBidPackage = {
  id: EntityId;
  projectId: EntityId;
  name: string;
  description?: string;
  tradeId: string;
  status: "DRAFT" | "ACTIVE" | "CLOSED" | "EXCLUDED";
  sortOrder?: number;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
};

export type BidPackageCsiTag = {
  id: EntityId;
  bidPackageId: EntityId;
  csiVersion: MasterFormatVersionId;
  csiItemId: string;
  role: BidPackageCsiTagRole;
  source: "TAXONOMY" | "CSI_CROSSWALK" | "ESTIMATOR" | "MANUAL" | "COMPANY_DEFAULT";
  tradeId?: string;
  specializationId?: string;
  confidence?: MappingConfidence;
  notes?: string;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
};

export type BidPackageTradeSpecialization = {
  id: EntityId;
  bidPackageId: EntityId;
  tradeId: string;
  specializationId?: string;
  isPrimary: boolean;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
};

export type BidPackageReview = {
  id: EntityId;
  bidPackageId: EntityId;
  includeDecision: "INCLUDE" | "EXCLUDE" | "NEEDS_REVIEW";
  splitCombineDecision?: "KEEP" | "SPLIT" | "COMBINE" | "NEEDS_REVIEW";
  scopeSummary?: string;
  finishLevel?: string;
  workIntensity?: string;
  demoIntensity?: string;
  mepCoordinationIntensity?: string;
  lowVoltageIntensity?: string;
  specialtySystemIntensity?: string;
  recipientReviewStatus?: "NOT_STARTED" | "IN_REVIEW" | "REVIEWED";
  reviewedByUserId?: EntityId;
  reviewedAt?: IsoDateString;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
};

export type BidPackageClarification = TextRecordWithPackage;
export type BidPackageExclusion = TextRecordWithPackage;
export type BidPackageRequestedAlternate = PricingRequestRecordWithPackage;
export type BidPackageRequestedAllowance = PricingRequestRecordWithPackage;
export type BidPackageRequestedUnitPrice = PricingRequestRecordWithPackage & {
  unit?: string;
};

export type TextRecordWithPackage = {
  id: EntityId;
  bidPackageId: EntityId;
  text: string;
  sortOrder?: number;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
};

export type PricingRequestRecordWithPackage = {
  id: EntityId;
  bidPackageId: EntityId;
  label: string;
  description?: string;
  requestedAmount?: number;
  sortOrder?: number;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
};

export type ProjectInviteRecipient = {
  id: EntityId;
  projectId: EntityId;
  bidPackageId: EntityId;
  subcontractorCompanyId: EntityId;
  subcontractorContactId?: EntityId;
  email?: string;
  status: "DRAFT" | "QUEUED" | "SENT" | "FAILED" | "REMOVED";
  source: "MATCHED" | "MANUAL";
  sendCount?: number;
  lastSentAt?: IsoDateString;
  lastError?: string;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
};

export type ProjectInviteSendBatch = {
  id: EntityId;
  projectId: EntityId;
  bidPackageIds: EntityId[];
  status: "DRAFT" | "QUEUED" | "SENT" | "PARTIAL_FAILURE" | "FAILED";
  createdByUserId?: EntityId;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
};

export type ProjectInviteSendLog = {
  id: EntityId;
  inviteBatchId: EntityId;
  inviteRecipientId: EntityId;
  status: "SENT" | "FAILED" | "SKIPPED";
  sentAt?: IsoDateString;
  error?: string;
  createdAt: IsoDateString;
};

export type ProjectRfi = {
  id: EntityId;
  projectId: EntityId;
  bidPackageId?: EntityId;
  subcontractorCompanyId?: EntityId;
  subcontractorContactId?: EntityId;
  subject: string;
  question: string;
  response?: string;
  status: "DRAFT" | "OPEN" | "ANSWERED" | "CLOSED";
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
};

export type ProjectRfiDistribution = {
  id: EntityId;
  rfiId: EntityId;
  contactId?: EntityId;
  email?: string;
  sentAt?: IsoDateString;
  createdAt: IsoDateString;
};

export type ProjectAddendum = {
  id: EntityId;
  projectId: EntityId;
  addendumNumber: string;
  title?: string;
  issuedAt?: IsoDateString;
  documentId?: EntityId;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
};

export type ProjectMessageThread = {
  id: EntityId;
  projectId: EntityId;
  bidPackageId?: EntityId;
  subject: string;
  participantContactIds?: EntityId[];
  participantEmails?: string[];
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
};

export type BidSubmission = {
  id: EntityId;
  projectId: EntityId;
  bidPackageIds: EntityId[];
  subcontractorCompanyId: EntityId;
  subcontractorContactId?: EntityId;
  status: "DRAFT" | "RECEIVED" | "REVIEWED" | "LEVELED" | "SELECTED" | "REJECTED";
  baseBidAmount?: number;
  submittedAt?: IsoDateString;
  receivedByUserId?: EntityId;
  notes?: string;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
};

export type BidSubmissionAttachment = {
  id: EntityId;
  bidSubmissionId: EntityId;
  filename: string;
  url?: string;
  sourceDocumentType?: "PDF" | "WORD" | "EXCEL" | "EMAIL" | "OTHER";
  notes?: string;
  uploadedAt?: IsoDateString;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
};

export type BidPricingItem = {
  id: EntityId;
  bidSubmissionId: EntityId;
  category: PricingItemCategory;
  direction: PricingItemDirection;
  label: string;
  amount?: number;
  quantity?: number;
  unit?: string;
  unitRate?: number;
  notes?: string;
  isAccepted?: boolean;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
};

export type BidClarification = TextRecordWithBid;
export type BidExclusion = TextRecordWithBid;

export type TextRecordWithBid = {
  id: EntityId;
  bidSubmissionId: EntityId;
  text: string;
  sortOrder?: number;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
};

export type BidScopeCoverage = {
  id: EntityId;
  bidSubmissionId: EntityId;
  bidPackageId: EntityId;
  bidPackageCsiTagId?: EntityId;
  coverageStatus: "INCLUDED" | "EXCLUDED" | "UNKNOWN" | "CLARIFY";
  notes?: string;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
};

export type BidPackageCoverageComparison = {
  id: EntityId;
  projectId: EntityId;
  bidPackageId: EntityId;
  bidSubmissionIds: EntityId[];
  generatedAt: IsoDateString;
};

export type BidLevelingDecision = {
  id: EntityId;
  projectId: EntityId;
  bidPackageId: EntityId;
  bidSubmissionId: EntityId;
  reviewStatus: "UNREVIEWED" | "IN_REVIEW" | "REVIEWED" | "APPROVED" | "REJECTED";
  leveledAmount?: number;
  selectedBidId?: EntityId;
  reviewedByUserId?: EntityId;
  reviewedAt?: IsoDateString;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
};

export type SelectedBid = {
  id: EntityId;
  projectId: EntityId;
  bidPackageId: EntityId;
  bidSubmissionId: EntityId;
  selectedAmount?: number;
  selectedByUserId?: EntityId;
  selectedAt: IsoDateString;
  notes?: string;
};

export type LevelingAdjustment = {
  id: EntityId;
  bidLevelingDecisionId: EntityId;
  category: "LEVELING_ADJUSTMENT";
  direction: "ADD" | "DEDUCT";
  label: string;
  amount: number;
  notes?: string;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
};

export type EstimateReview = {
  id: EntityId;
  projectId: EntityId;
  status: "DRAFT" | "IN_REVIEW" | "APPROVED" | "LOCKED";
  subtotal?: number;
  projectTotal?: number;
  costPerSquareFoot?: number;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
};

export type EstimateReviewLineItem = {
  id: EntityId;
  estimateReviewId: EntityId;
  selectedBidId?: EntityId;
  bidPackageId?: EntityId;
  label: string;
  amount?: number;
  sortOrder?: number;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
};

export type GeneralConditionsLineItem = EstimateCostLineItem & {
  category: "GENERAL_CONDITIONS";
};

export type FeeInsuranceTaxBondLineItem = EstimateCostLineItem & {
  category: "FEE" | "INSURANCE" | "TAX" | "BOND";
};

export type EstimateCostLineItem = {
  id: EntityId;
  estimateReviewId: EntityId;
  label: string;
  amount?: number;
  percentOfSubtotal?: number;
  notes?: string;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
};

export type EstimateClarification = {
  id: EntityId;
  estimateReviewId: EntityId;
  text: string;
  carryToProposal: boolean;
  sortOrder?: number;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
};

export type EstimateExclusion = {
  id: EntityId;
  estimateReviewId: EntityId;
  text: string;
  carryToProposal: boolean;
  sortOrder?: number;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
};

export type Proposal = {
  id: EntityId;
  projectId: EntityId;
  estimateReviewId: EntityId;
  status: "DRAFT" | "IN_REVIEW" | "ISSUED" | "VOID";
  title: string;
  issuedAt?: IsoDateString;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
};

export type ProposalSection = {
  id: EntityId;
  proposalId: EntityId;
  sectionType: "SCOPE" | "PRICING" | "CLARIFICATIONS" | "EXCLUSIONS" | "ALTERNATES" | "SCHEDULE" | "ASSUMPTIONS" | "OTHER";
  title: string;
  body?: string;
  sortOrder?: number;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
};

export type ProposalClarification = TextRecordWithProposal;
export type ProposalExclusion = TextRecordWithProposal;

export type TextRecordWithProposal = {
  id: EntityId;
  proposalId: EntityId;
  text: string;
  sortOrder?: number;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
};

export type ProposalAlternate = {
  id: EntityId;
  proposalId: EntityId;
  label: string;
  amount?: number;
  notes?: string;
  sortOrder?: number;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
};

export type ProposalAttachment = {
  id: EntityId;
  proposalId: EntityId;
  filename: string;
  url?: string;
  notes?: string;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
};

export type DatabaseModelRelationshipRule = {
  id: string;
  description: string;
  sourceEntity: string;
  targetEntity: string;
  cardinality: "ONE_TO_ONE" | "ONE_TO_MANY" | "MANY_TO_ONE" | "MANY_TO_MANY";
};

export const databaseModelRelationshipRules: DatabaseModelRelationshipRule[] = [
  {
    id: "company-has-subcontractors",
    description: "Company has many subcontractors.",
    sourceEntity: "Company",
    targetEntity: "SubcontractorCompany",
    cardinality: "ONE_TO_MANY",
  },
  {
    id: "subcontractor-has-contacts",
    description: "Subcontractor has many first-class contacts.",
    sourceEntity: "SubcontractorCompany",
    targetEntity: "SubcontractorContact",
    cardinality: "ONE_TO_MANY",
  },
  {
    id: "project-has-selected-csi-version",
    description: "Project has one selected CSI version through ProjectCsiVersionSettings.",
    sourceEntity: "Project",
    targetEntity: "ProjectCsiVersionSettings",
    cardinality: "ONE_TO_ONE",
  },
  {
    id: "project-has-bid-packages",
    description: "Project has many bid packages.",
    sourceEntity: "Project",
    targetEntity: "ProjectBidPackage",
    cardinality: "ONE_TO_MANY",
  },
  {
    id: "bid-package-has-csi-tags",
    description: "Bid package has many CSI tags.",
    sourceEntity: "ProjectBidPackage",
    targetEntity: "BidPackageCsiTag",
    cardinality: "ONE_TO_MANY",
  },
  {
    id: "invite-recipient-tied-to-contact",
    description: "Invite recipients are tied to bid packages and subcontractor contacts.",
    sourceEntity: "ProjectInviteRecipient",
    targetEntity: "SubcontractorContact",
    cardinality: "MANY_TO_ONE",
  },
  {
    id: "bids-feed-estimate-review",
    description: "Selected bids feed Estimate Review.",
    sourceEntity: "SelectedBid",
    targetEntity: "EstimateReview",
    cardinality: "MANY_TO_ONE",
  },
  {
    id: "estimate-review-feeds-proposal",
    description: "Estimate Review feeds Proposal.",
    sourceEntity: "EstimateReview",
    targetEntity: "Proposal",
    cardinality: "ONE_TO_MANY",
  },
];
