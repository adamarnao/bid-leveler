/**
 * Bid-Leveler CSI Version and Trade Mapping Source
 *
 * Planning/source file for implementing version-aware CSI-to-trade mapping.
 * Codex should implement from this rather than inventing behavior.
 */

export type CsiVersionId =
  | "MASTERFORMAT_1995"
  | "MASTERFORMAT_CURRENT";

export type MappingConfidence =
  | "HIGH"
  | "MEDIUM"
  | "LOW";

export type CsiTradeMatchStrength =
  | "PRIMARY"
  | "SECONDARY"
  | "POSSIBLE";

export type CsiTradeAssignmentSource =
  | "PROJECT_OVERRIDE"
  | "COMPANY_OVERRIDE"
  | "DIRECT_VERSION_RULE"
  | "CROSSWALK_RULE"
  | "CODE_PATTERN_RULE"
  | "KEYWORD_RULE"
  | "MANUAL";

export type BidPackageCsiTagRole =
  | "CORE"
  | "OPTIONAL"
  | "POSSIBLE"
  | "EXCLUDED";

export type BidPackageCsiTagSource =
  | "TAXONOMY"
  | "CSI_CROSSWALK"
  | "ESTIMATOR"
  | "MANUAL"
  | "COMPANY_DEFAULT";

export type EquivalentCsiCoverage = {
  version: CsiVersionId;
  csiItemId: string;
  confidence: MappingConfidence;
  source: "CSI_CROSSWALK" | "MANUAL" | "SYSTEM";
  notes?: string;
};

export type SubcontractorCsiCoverage = {
  id: string;
  subcontractorId: string;

  sourceVersion: CsiVersionId;
  sourceCsiItemId: string;

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

  sectorTags?: string[];
  workTypeTags?: string[];
  contextTags?: string[];

  notes?: string;
};

export type CsiTradeAssignment = {
  csiItemId: string;
  csiVersion: CsiVersionId;

  tradeId: string;
  specializationId?: string;

  matchStrength: CsiTradeMatchStrength;
  confidence: MappingConfidence;

  source: CsiTradeAssignmentSource;

  crosswalkedFromCsiItemId?: string;
  crosswalkedFromVersion?: CsiVersionId;

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

export const CSI_MAPPING_PRIORITY_CURRENT_PROJECT = [
  "Project-specific override for current CSI item",
  "Company override for current CSI item",
  "Exact current CSI mapping rule",
  "Current CSI code pattern rule",
  "Current CSI title keyword rule",
  "Crosswalk current to 1995, then check 1995 mapping",
  "Generic fallback keyword/pattern",
  "Unassigned / estimator review required",
] as const;

export const CSI_MAPPING_PRIORITY_1995_PROJECT = [
  "Project-specific override for 1995 CSI item",
  "Company override for 1995 CSI item",
  "Exact 1995 CSI mapping rule",
  "1995 CSI code pattern rule",
  "1995 CSI title keyword rule",
  "Crosswalk 1995 to current, then check current mapping",
  "Generic fallback keyword/pattern",
  "Unassigned / estimator review required",
] as const;

export const VERSION_AWARE_CSI_MAPPING_REQUIREMENTS = {
  preserveOriginalCoverage: true,
  deriveAlternateCoverage: true,
  directProjectVersionMatchFirst: true,
  useCrosswalkFallback: true,
  preserveMappingExplanation: true,
  groupEstimateReviewByProjectCsiVersion: true,
  groupBidLevelingByProjectCsiVersion: true,
} as const;
