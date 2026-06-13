import { CsiMasterFormatVersion } from "@/types/Csi";

export type RelationshipStatus =
  | "PREFERRED"
  | "APPROVED"
  | "CONDITIONAL"
  | "INACTIVE"
  | "DO_NOT_USE";

export type PrequalificationStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "QUALIFIED"
  | "CONDITIONAL"
  | "EXPIRED"
  | "REJECTED";

export type ContactRole =
  | "ESTIMATOR"
  | "PROJECT_MANAGER"
  | "OWNER"
  | "ACCOUNTING"
  | "GENERAL";

export type PhoneType = "OFFICE" | "MOBILE";

export type VpiConfidenceLevel = "LOW" | "MEDIUM" | "HIGH";

export type SubcontractorLocationType =
  | "HEADQUARTERS"
  | "BRANCH"
  | "FIELD_OFFICE"
  | "BILLING";

export type SubcontractorContactRoleContext =
  | "ESTIMATING"
  | "PROJECT_MANAGEMENT"
  | "ACCOUNTING"
  | "AWARD";

export type SubcontractorAddress = {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip: string;
};

export type SubcontractorServiceArea = {
  states: string[];
  counties: string[];
  citiesOrMarkets: string[];
  travelRadiusMiles?: number;
  willTravel: boolean;
};

export type SubcontractorLocation = {
  id: string;
  name: string;
  type: SubcontractorLocationType;
  address: SubcontractorAddress;
  mainPhone?: string;
  mainPhoneExtension?: string;
  email?: string;
  serviceArea?: SubcontractorServiceArea;
  notes?: string;
  isPrimary?: boolean;
};

export type SubcontractorContactScope = {
  divisionIds?: string[];
  sectionIds?: string[];
  states?: string[];
  counties?: string[];
  citiesOrMarkets?: string[];
  locationIds?: string[];
  roleContext?: SubcontractorContactRoleContext;
  notes?: string;
};

export type SubcontractorContact = {
  id: string;
  locationId?: string;
  role: ContactRole;
  name: string;
  title?: string;
  email?: string;
  officePhone?: string;
  officePhoneExtension?: string;
  mobilePhone?: string;
  primaryPhoneType?: PhoneType;
  phone?: string;
  isPrimary?: boolean;
  isDefaultInviteRecipient?: boolean;
  inviteScopes?: SubcontractorContactScope[];
  active?: boolean;
  notes?: string;
};

export type SubcontractorCsiCoverage = {
  sourceVersion?: CsiMasterFormatVersion;
  divisionIds: string[];
  sectionIds: string[];
  specialtyScopeNotes?: string;
};

export type SubcontractorPrequalification = {
  status: PrequalificationStatus;
  w9OnFile: boolean;
  insuranceOnFile: boolean;
  licenseOnFile: boolean;
  bondingCapacity?: number;
  insuranceExpirationDate?: string;
  licenseExpirationDate?: string;
  notes?: string;
};

export type VendorPerformanceIndex = {
  responsiveness?: number;
  bidCompleteness?: number;
  bidAccuracy?: number;
  schedulePerformance?: number;
  fieldQuality?: number;
  administrativeCompliance?: number;
  overall?: number;
  projectsEvaluated: number;
  confidenceLevel: VpiConfidenceLevel;
};

export type Subcontractor = {
  id: string;
  companyName: string;
  dba?: string;
  address: SubcontractorAddress;
  website?: string;
  mainPhone?: string;
  mainPhoneExtension?: string;
  notes?: string;
  serviceArea: SubcontractorServiceArea;
  locations?: SubcontractorLocation[];
  contacts: SubcontractorContact[];
  primaryDivisionId: string;
  csiCoverage: SubcontractorCsiCoverage;
  prequalification: SubcontractorPrequalification;
  vpi: VendorPerformanceIndex;
  relationshipStatus: RelationshipStatus;
  createdDate: string;
  updatedDate?: string;
  archived: boolean;
};
