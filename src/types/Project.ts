import { CsiMasterFormatVersion } from "./Csi";

export type ProjectStatus =
  | "PLAN_REVIEW"
  | "BIDDING"
  | "SUBMITTED"
  | "AWARDED"
  | "NOT_AWARDED"
  | "ARCHIVED";

export type MarketSector =
  | "Residential"
  | "Commercial"
  | "Medical"
  | "Industrial"
  | "Government"
  | "Education"
  | "Hospitality"
  | "Civil"
  | "Energy"
  | "Other";

export type ProjectSetupStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "READY_FOR_INVITES"
  | "COMPLETE";

export type ProjectInternalTeamRole =
  | "Preconstruction Manager"
  | "Chief Estimator"
  | "Senior Estimator"
  | "Estimator"
  | "Assistant Estimator"
  | "Estimating Coordinator"
  | "Project Manager"
  | "Assistant Project Manager"
  | "Project Executive"
  | "Operations Manager"
  | "Project Engineer"
  | "Administrative Support"
  | "Accounting Contact"
  | "Other";

export type ProjectTeamNotificationLevel =
  | "NONE"
  | "MENTIONS_ONLY"
  | "IMPORTANT"
  | "ALL";

export type ProjectExternalTeamDiscipline =
  | "Owner"
  | "Owner Rep"
  | "Client/Bid Solicitor"
  | "Architectural"
  | "Structural"
  | "Civil"
  | "Mechanical"
  | "Electrical"
  | "Plumbing"
  | "Fire Protection"
  | "Low Voltage/Technology"
  | "Security"
  | "Landscape"
  | "Geotechnical"
  | "Interior Design"
  | "Food Service"
  | "Medical Equipment"
  | "Other";

export type ProjectDocumentSource =
  | "OWNER"
  | "ARCHITECT"
  | "CLIENT_PORTAL"
  | "EMAIL"
  | "SHARED_DRIVE"
  | "OTHER";

export type ProjectPlanReviewStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "NEEDS_CLARIFICATION"
  | "REVIEWED";

export type ProjectComplexityLevel = "LOW" | "MODERATE" | "HIGH" | "VERY_HIGH";

export type ProjectFinishLevel =
  | "BASIC"
  | "STANDARD"
  | "HIGH_END"
  | "SPECIALTY";

export type ProjectTakeoffStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "NEEDS_REVIEW"
  | "COMPLETE";

export type ProjectBidType =
  | "HARD_BID"
  | "BUDGET"
  | "GMP"
  | "NEGOTIATED"
  | "DESIGN_BUILD"
  | "OTHER";

export type ProjectContractType =
  | "LUMP_SUM"
  | "COST_PLUS"
  | "GMP"
  | "UNIT_PRICE"
  | "TIME_AND_MATERIAL"
  | "OTHER";

export type ProjectBidSubmissionMethod =
  | "EMAIL"
  | "PORTAL"
  | "SEALED_BID"
  | "IN_PERSON"
  | "OTHER";

export type ProjectPricingConfidence = "LOW" | "MEDIUM" | "HIGH";

export type ProjectSetupProgress = {
  currentStepId?: string;
  completedStepIds?: string[];
  lastEditedAt?: string;
};

export type ProjectInternalTeamMember = {
  id: string;
  name?: string;
  role?: ProjectInternalTeamRole;
  email?: string;
  phone?: string;
  isPrimaryContact?: boolean;
  canReviewBids?: boolean;
  canSendInvites?: boolean;
  canEditSetup?: boolean;
  notificationLevel?: ProjectTeamNotificationLevel;
  notes?: string;
};

export type ProjectExternalTeamContact = {
  id: string;
  firmName?: string;
  contactName?: string;
  discipline?: ProjectExternalTeamDiscipline;
  email?: string;
  phone?: string;
  roleDescription?: string;
  isDefaultRfiRecipient?: boolean;
  isDefaultCc?: boolean;
  notes?: string;
};

export type ProjectDocuments = {
  plansLink?: string;
  specsLink?: string;
  addendaLink?: string;
  bidFormLink?: string;
  drawingDate?: string;
  drawingSetName?: string;
  drawingSetVersion?: string;
  lastAddendumReceived?: string;
  documentSource?: ProjectDocumentSource;
  planReviewStatus?: ProjectPlanReviewStatus;
};

export type ProjectCharacteristics = {
  marketSector?: MarketSector;
  buildingType?: string;
  workType?: string;
  constructionType?: string;
  squareFootage?: number;
  stories?: number;
  isOccupiedFacility?: boolean;
  isExistingBuilding?: boolean;
  phasingRequired?: boolean;
  afterHoursWorkRequired?: boolean;
  complexityLevel?: ProjectComplexityLevel;
  finishLevel?: ProjectFinishLevel;
  accessConstraints?: string;
  specialConditions?: string;
};

export type ProjectScopeSetup = {
  bidPackages?: string[];
  alternates?: string[];
  allowances?: string[];
  unitPrices?: string[];
  excludedScopes?: string[];
  ownerDirectScopes?: string[];
  gcSelfPerformScopes?: string[];
  takeoffStatus?: ProjectTakeoffStatus;
};

export type ProjectBidRequirements = {
  bidType?: ProjectBidType;
  contractType?: ProjectContractType;
  bidSubmissionMethod?: ProjectBidSubmissionMethod;
  bidBondRequired?: boolean;
  performanceBondRequired?: boolean;
  paymentBondRequired?: boolean;
  prevailingWageRequired?: boolean;
  davisBaconRequired?: boolean;
  certifiedPayrollRequired?: boolean;
  taxExempt?: boolean;
  liquidatedDamages?: string;
  retainagePercent?: number;
  alternatesRequired?: boolean;
  allowancesRequired?: boolean;
  unitPricesRequired?: boolean;
  qualificationsAllowed?: boolean;
  requiredBidsPerScope?: number;
};

export type ProjectBudgetReadiness = {
  ownerBudget?: number;
  targetBudget?: number;
  romEstimate?: number;
  pricingConfidence?: ProjectPricingConfidence;
  notes?: string;
};

export type ProjectItbInstructions = {
  documentAccessInstructions?: string;
  bidSubmissionInstructions?: string;
  rfiInstructions?: string;
  siteWalkInstructions?: string;
  specialInstructions?: string;
  replyToName?: string;
  replyToEmail?: string;
  replyToPhone?: string;
};

export type Project = {
  id: string;

  projectNumber?: string;
  name: string;
  client: string;
  estimator?: string;

  marketSector: MarketSector;
  projectCategory: string;
  projectSubtype: string;

  address: string;
  city: string;
  state: string;
  zip: string;

  squareFootage?: number;
  projectDurationMonths?: number;

  deliveryMethod?: string;
  ownershipType?: string;

  planLink?: string;
  documentNotes?: string;

  subcontractorBidDueDate?: string;
  bidReviewDate?: string;
  bidDueDate: string;

  status: ProjectStatus;

  archived: boolean;
  archivedAt?: string;
  deleted?: boolean;
  deletedAt?: string;
  createdDate: string;

  csiVersion: CsiMasterFormatVersion;

  setupStatus?: ProjectSetupStatus;
  setupProgress?: ProjectSetupProgress;
  internalTeam?: ProjectInternalTeamMember[];
  externalTeam?: ProjectExternalTeamContact[];
  projectDocuments?: ProjectDocuments;
  projectCharacteristics?: ProjectCharacteristics;
  projectScope?: ProjectScopeSetup;
  bidRequirements?: ProjectBidRequirements;
  budgetReadiness?: ProjectBudgetReadiness;
  itbInstructions?: ProjectItbInstructions;
};
