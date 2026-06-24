export type ProjectSetupRuleEffectType =
  | "SHOW_FIELD"
  | "REQUIRE_FIELD"
  | "SUGGEST_CONTEXT_TAG"
  | "CORE_TRADE"
  | "SUGGEST_TRADE"
  | "HIDE_TRADE"
  | "ADD_ITB_REQUIREMENT"
  | "ADD_PRICING_METRIC"
  | "ADD_WARNING";

export type ProjectSetupFieldImpactCategory =
  | "bid_package_generation"
  | "itb_readiness"
  | "subcontractor_matching"
  | "historical_pricing"
  | "estimate_review"
  | "proposal_output";

export type ProjectSetupRuleOperator =
  | "equals"
  | "not_equals"
  | "includes"
  | "not_includes"
  | "exists"
  | "not_exists";

export type ProjectSetupRuleCondition = {
  id: string;
  fieldPath: string;
  operator: ProjectSetupRuleOperator;
  value?: string | number | boolean | string[];
  description?: string;
};

export type ProjectSetupRuleEffect = {
  id: string;
  type: ProjectSetupRuleEffectType;
  targetId?: string;
  targetFieldPath?: string;
  label?: string;
  description?: string;
  impactCategories: ProjectSetupFieldImpactCategory[];
};

export type ProjectSetupRule = {
  id: string;
  name: string;
  description?: string;
  conditions: ProjectSetupRuleCondition[];
  effects: ProjectSetupRuleEffect[];
  priority?: number;
  isActive: boolean;
};
