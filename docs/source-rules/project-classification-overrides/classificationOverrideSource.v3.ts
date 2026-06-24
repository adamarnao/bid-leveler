/**
 * Bid-Leveler Classification Override Source v3.
 *
 * Planning/source file. Codex should implement from this rather than inventing behavior.
 */

export type TradeVisibilityLevel =
  | "CORE"
  | "SUGGESTED"
  | "CONTEXTUAL"
  | "HIDDEN"
  | "EXCLUDED";

export type VisibilityOverrideSource =
  | "SYSTEM_DEFAULT"
  | "COMPANY_DEFAULT"
  | "SECTOR"
  | "FACILITY_TYPE"
  | "WORK_TYPE"
  | "PROJECT_OVERRIDE"
  | "CONTEXT_TAG"
  | "BUILDING_ATTRIBUTE"
  | "PACKAGE_DECISION"
  | "CSI_EVIDENCE"
  | "MANUAL";

export type CompanyTradeVisibilityOverride = {
  id: string;
  tradeId: string;
  visibility: TradeVisibilityLevel;
  sectorTags?: string[];
  facilityTypeTags?: string[];
  workTypeTags?: string[];
  contextTags?: string[];
  buildingAttributeTags?: string[];
  packageDecisionTags?: string[];
  selectedCsiItemIds?: string[];
  reason?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ProjectTradeVisibilityOverride = {
  id: string;
  projectId: string;
  tradeId: string;
  visibility: TradeVisibilityLevel;
  source?: VisibilityOverrideSource;
  reason?: string;
  createdAt: string;
  updatedAt: string;
};

export type ProjectClassificationOverride = {
  id: string;
  projectId: string;
  sectorTags?: string[];
  facilityTypeTags?: string[];
  workTypeTags?: string[];
  addedContextTags?: string[];
  hiddenContextTags?: string[];
  buildingAttributeTags?: string[];
  packageDecisionTags?: string[];
  selectedCsiItemIds?: string[];
  forcedVisibleTradeIds?: string[];
  forcedCoreTradeIds?: string[];
  forcedSuggestedTradeIds?: string[];
  forcedHiddenTradeIds?: string[];
  forcedExcludedTradeIds?: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type TradePackageSplitOverride = {
  id: string;
  projectId: string;
  parentTradeId: string;
  splitSpecializationTradeIds: string[];
  reason?: string;
  createdAt: string;
  updatedAt: string;
};

export type TradePackageCombineOverride = {
  id: string;
  projectId: string;
  targetPackageTradeId: string;
  combinedTradeIds: string[];
  customPackageName?: string;
  reason?: string;
  createdAt: string;
  updatedAt: string;
};

export type CsiTradeAssignmentOverride = {
  id: string;
  projectId?: string;
  companyDefault?: boolean;
  csiVersion: string;
  csiItemId: string;
  tradeId: string;
  specializationId?: string;
  reason?: string;
  createdAt: string;
  updatedAt: string;
};

export const VISIBILITY_RESOLUTION_ORDER = [
  "System default visibility",
  "Company default overrides",
  "Project Profile classification rules: sector / facility type / work type / context",
  "Building attribute and package-level decision rules",
  "Selected CSI tag evidence",
  "Project-specific overrides",
  "Final visibility with explanation trail",
] as const;

export const OVERRIDE_ACTIONS = [
  "ADD_HIDDEN_TRADE",
  "PROMOTE_TO_CORE",
  "DEMOTE_TO_SUGGESTED",
  "HIDE_FROM_PROJECT",
  "RESTORE_HIDDEN_TRADE",
  "RESET_TRADE_TO_PROJECT_DEFAULTS",
  "RESET_ALL_TO_COMPANY_DEFAULTS",
  "RESET_ALL_TO_SYSTEM_DEFAULTS",
] as const;
