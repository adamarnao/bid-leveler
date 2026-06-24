import type { CsiCatalogItem, CsiMasterFormatVersion } from "@/types/Csi";

export type CsiVersionId = CsiMasterFormatVersion;

export type MappingConfidence = "HIGH" | "MEDIUM" | "LOW";

export type CsiTradeMatchStrength = "PRIMARY" | "SECONDARY" | "POSSIBLE";

export type CsiTradeAssignmentSource =
  | "PROJECT_OVERRIDE"
  | "COMPANY_OVERRIDE"
  | "DIRECT_VERSION_RULE"
  | "CODE_PATTERN_RULE"
  | "KEYWORD_RULE"
  | "CROSSWALK_RULE"
  | "GENERIC_FALLBACK"
  | "UNASSIGNED"
  | "MANUAL";

export type BidPackageCsiTagRole = "CORE" | "OPTIONAL" | "POSSIBLE" | "EXCLUDED";

export type BidPackageCsiTagSource =
  | "TAXONOMY"
  | "CSI_CROSSWALK"
  | "ESTIMATOR"
  | "MANUAL"
  | "COMPANY_DEFAULT";

export type EquivalentCsiCoverage = {
  version: CsiVersionId;
  csiItemId: string;
  csiNumber?: string;
  csiTitle?: string;
  confidence: MappingConfidence;
  source: "CSI_CROSSWALK" | "MANUAL" | "SYSTEM";
  notes?: string;
};

export type SubcontractorCsiCoverage = {
  id: string;
  subcontractorId: string;
  sourceVersion: CsiVersionId;
  sourceCsiItemId: string;
  sourceCsiNumber?: string;
  sourceCsiTitle?: string;
  equivalentCsiItems: EquivalentCsiCoverage[];
  tradeIds?: string[];
  specializationIds?: string[];
  source: "USER_SELECTED" | "SYSTEM_DERIVED" | "COMPANY_DEFAULT" | "MANUAL_OVERRIDE";
  confidence: MappingConfidence;
  createdAt: string;
  updatedAt: string;
};

export type CsiToTradeMappingRule = {
  id: string;
  csiVersion: CsiVersionId;
  exactCsiIds?: string[];
  csiCodePatterns?: string[];
  titleKeywords?: string[];
  tradeId: string;
  specializationId?: string;
  matchStrength: CsiTradeMatchStrength;
  confidence?: MappingConfidence;
  possibleTradeIds?: string[];
  sectorTags?: string[];
  workTypeTags?: string[];
  contextTags?: string[];
  notes?: string;
};

export type CsiTradeAssignment = {
  csiItemId: string;
  csiVersion: CsiVersionId;
  tradeId?: string;
  specializationId?: string;
  matchStrength?: CsiTradeMatchStrength;
  confidence: MappingConfidence;
  source: CsiTradeAssignmentSource;
  crosswalkedFromCsiItemId?: string;
  crosswalkedFromVersion?: CsiVersionId;
  crosswalkedFromCsiNumber?: string;
  possibleTradeIds?: string[];
  reason: string;
};

export type BidPackageCsiTag = {
  id: string;
  bidPackageId: string;
  csiVersion: CsiVersionId;
  csiItemId: string;
  role: BidPackageCsiTagRole;
  source: BidPackageCsiTagSource;
  tradeId?: string;
  specializationId?: string;
  originalCsiVersion?: CsiVersionId;
  originalCsiItemId?: string;
  confidence?: MappingConfidence;
  notes?: string;
};

export type ProjectCsiVersionSettings = {
  companyDefaultCsiVersion: CsiVersionId;
  projectCsiVersion: CsiVersionId;
  wasProjectOverride: boolean;
};

export type ProjectBidPackageCsiReporting = {
  bidPackageId: string;
  csiVersion: CsiVersionId;
  primaryCsiDivisionId?: string;
  csiTagIds: string[];
  explanation?: string;
};

export type CsiTradeMappingItem = Pick<CsiCatalogItem, "id" | "version" | "number" | "name">;

export type CsiTradeAssignmentOverride = {
  csiVersion: CsiVersionId;
  csiItemId?: string;
  csiNumber?: string;
  tradeId: string;
  specializationId?: string;
  matchStrength?: CsiTradeMatchStrength;
  confidence?: MappingConfidence;
  reason?: string;
};

export type AssignCsiItemToTradeInput = {
  csiItem: CsiTradeMappingItem;
  projectCsiVersion?: CsiVersionId;
  rules?: CsiToTradeMappingRule[];
  projectOverrides?: CsiTradeAssignmentOverride[];
  companyOverrides?: CsiTradeAssignmentOverride[];
  equivalentItems?: EquivalentCsiCoverage[];
  sectorTags?: string[];
  workTypeTags?: string[];
  contextTags?: string[];
};

export type AssignCsiItemsToTradesInput = Omit<AssignCsiItemToTradeInput, "csiItem"> & {
  csiItems: CsiTradeMappingItem[];
};

export type DeriveEquivalentCsiCoverageInput = {
  sourceVersion: CsiVersionId;
  sourceCsiItemId: string;
  sourceCsiNumber: string;
  sourceCsiTitle?: string;
};

export type CreateSubcontractorDualCoverageInput = DeriveEquivalentCsiCoverageInput & {
  subcontractorId: string;
  id?: string;
  now?: string;
  source?: SubcontractorCsiCoverage["source"];
};

