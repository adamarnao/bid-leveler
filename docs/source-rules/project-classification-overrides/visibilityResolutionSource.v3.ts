/**
 * Bid-Leveler Visibility Resolution Source v3.
 *
 * Planning/source file defining final visibility results and explanations.
 */

export type TradeVisibilityLevel =
  | "CORE"
  | "SUGGESTED"
  | "CONTEXTUAL"
  | "HIDDEN"
  | "EXCLUDED";

export type VisibilityReasonSource =
  | "SYSTEM_DEFAULT"
  | "COMPANY_DEFAULT"
  | "PROJECT_CLASSIFICATION"
  | "CONTEXT_TAG"
  | "CSI_EVIDENCE"
  | "PROJECT_OVERRIDE"
  | "MANUAL";

export type VisibilityExplanation = {
  source: VisibilityReasonSource;
  message: string;
  priority?: number;
};

export type TradeVisibilityResolutionInput = {
  projectId?: string;
  sectorTags?: string[];
  workTypeTags?: string[];
  contextTags?: string[];
  selectedCsiItemIds?: string[];
  companyOverrides?: unknown[];
  projectOverrides?: unknown[];
  includeHidden?: boolean;
};

export type TradeVisibilityResolutionResult = {
  tradeId: string;
  defaultVisibility: TradeVisibilityLevel;
  finalVisibility: TradeVisibilityLevel;
  isVisible: boolean;
  isManuallyOverridden: boolean;
  isCompanyDefault: boolean;
  isTriggeredByContext: boolean;
  isTriggeredByCsi: boolean;
  explanations: VisibilityExplanation[];
  warnings?: string[];
};

export type TradeVisibilityGroupedResult = {
  core: TradeVisibilityResolutionResult[];
  suggested: TradeVisibilityResolutionResult[];
  contextual: TradeVisibilityResolutionResult[];
  hidden: TradeVisibilityResolutionResult[];
  excluded: TradeVisibilityResolutionResult[];
};

export const VISIBILITY_RESOLUTION_RULES = {
  projectOverridesWin: true,
  companyOverridesOverrideSystem: true,
  selectedCsiEvidenceCanRevealHiddenTrades: true,
  explicitProjectHiddenWinsOverCsiEvidence: true,
  explanationsRequired: true,
} as const;

export const EXPLANATION_TRAIL_EXAMPLE = [
  "Normally hidden for Office + Tenant Improvement / Interior Fit-Out.",
  "Shown because estimator selected Exterior Envelope Scope.",
  "Promoted by project-specific override.",
] as const;
