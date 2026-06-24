import {
  ProjectProfile,
  ProjectSetupRule,
  ProjectSetupRuleCondition,
  ProjectSetupRuleEvaluation,
  ProjectSetupRuleEffect,
} from "./types";

export const projectSetupRules: ProjectSetupRule[] = [
  {
    id: "baseline-itb-profile-requirements",
    name: "Baseline ITB Profile Requirements",
    description: "Minimum project profile facts needed before ITB readiness can be evaluated.",
    isActive: true,
    priority: 10,
    conditions: [],
    effects: [
      {
        id: "show-classification-fields",
        type: "SHOW_FIELD",
        targetFieldPath: "classification",
        label: "Show classification fields",
        impactCategories: ["bid_package_generation", "itb_readiness", "historical_pricing"],
      },
      {
        id: "require-sector",
        type: "REQUIRE_FIELD",
        targetFieldPath: "classification.sector",
        label: "Sector",
        impactCategories: ["bid_package_generation", "itb_readiness", "historical_pricing"],
      },
      {
        id: "require-work-type",
        type: "REQUIRE_FIELD",
        targetFieldPath: "classification.workType",
        label: "Work Type",
        impactCategories: ["bid_package_generation", "itb_readiness", "historical_pricing"],
      },
      {
        id: "require-csi-version",
        type: "REQUIRE_FIELD",
        targetFieldPath: "globalAttributes.projectCsiVersion",
        label: "Project CSI Version",
        impactCategories: ["bid_package_generation", "subcontractor_matching", "estimate_review", "proposal_output"],
      },
      {
        id: "require-document-access-instructions",
        type: "ADD_ITB_REQUIREMENT",
        targetFieldPath: "itbInstructions.documentAccessInstructions",
        label: "Document access instructions",
        impactCategories: ["itb_readiness", "proposal_output"],
      },
      {
        id: "add-square-footage-metric",
        type: "ADD_PRICING_METRIC",
        targetId: "square_footage",
        label: "Square Footage",
        impactCategories: ["historical_pricing", "estimate_review"],
      },
    ],
  },
  {
    id: "healthcare-profile-requirements",
    name: "Healthcare Profile Requirements",
    isActive: true,
    priority: 20,
    conditions: [
      {
        id: "sector-is-healthcare",
        fieldPath: "classification.sector",
        operator: "equals",
        value: "healthcare",
      },
    ],
    effects: [
      {
        id: "suggest-infection-control",
        type: "SUGGEST_CONTEXT_TAG",
        targetId: "infection_control",
        label: "Infection Control",
        impactCategories: ["bid_package_generation", "itb_readiness", "proposal_output"],
      },
      {
        id: "core-fire-protection-healthcare",
        type: "CORE_TRADE",
        targetId: "fire-protection",
        label: "Fire Protection",
        impactCategories: ["bid_package_generation", "subcontractor_matching"],
      },
      {
        id: "suggest-medical-gas-healthcare",
        type: "SUGGEST_TRADE",
        targetId: "medical-gas",
        label: "Medical Gas",
        impactCategories: ["bid_package_generation", "subcontractor_matching", "estimate_review"],
      },
      {
        id: "add-exam-room-pricing",
        type: "ADD_PRICING_METRIC",
        targetId: "exam_room_count",
        label: "Exam Rooms",
        impactCategories: ["historical_pricing", "estimate_review"],
      },
      {
        id: "warn-healthcare-special-systems",
        type: "ADD_WARNING",
        label: "Review healthcare specialty systems before ITB launch.",
        impactCategories: ["itb_readiness", "proposal_output"],
      },
    ],
  },
  {
    id: "restaurant-commercial-kitchen-requirements",
    name: "Restaurant Commercial Kitchen Requirements",
    isActive: true,
    priority: 30,
    conditions: [
      {
        id: "sector-is-restaurant",
        fieldPath: "classification.sector",
        operator: "equals",
        value: "restaurant",
      },
    ],
    effects: [
      {
        id: "suggest-commercial-kitchen",
        type: "SUGGEST_CONTEXT_TAG",
        targetId: "commercial_kitchen",
        label: "Commercial Kitchen",
        impactCategories: ["bid_package_generation", "itb_readiness"],
      },
      {
        id: "core-food-service",
        type: "CORE_TRADE",
        targetId: "food-service",
        label: "Food Service",
        impactCategories: ["bid_package_generation", "subcontractor_matching"],
      },
      {
        id: "suggest-kitchen-hood",
        type: "SUGGEST_TRADE",
        targetId: "kitchen-hood",
        label: "Kitchen Hood",
        impactCategories: ["bid_package_generation", "subcontractor_matching"],
      },
      {
        id: "add-seat-count-pricing",
        type: "ADD_PRICING_METRIC",
        targetId: "seat_count",
        label: "Seat Count",
        impactCategories: ["historical_pricing", "estimate_review"],
      },
    ],
  },
  {
    id: "civil-sitework-only-visibility",
    name: "Civil / Sitework Only Visibility",
    isActive: true,
    priority: 40,
    conditions: [
      {
        id: "work-type-is-sitework-civil-only",
        fieldPath: "classification.workType",
        operator: "equals",
        value: "sitework_civil_only",
      },
    ],
    effects: [
      {
        id: "core-sitework-civil",
        type: "CORE_TRADE",
        targetId: "sitework-civil",
        label: "Sitework / Civil",
        impactCategories: ["bid_package_generation", "subcontractor_matching"],
      },
      {
        id: "hide-interior-finish-trades",
        type: "HIDE_TRADE",
        targetId: "interior-finish-stack",
        label: "Interior finish trades",
        description: "Interior finish trades should not be shown as normal candidates for sitework-only projects.",
        impactCategories: ["bid_package_generation", "itb_readiness"],
      },
      {
        id: "add-acreage-pricing",
        type: "ADD_PRICING_METRIC",
        targetId: "acres",
        label: "Acres",
        impactCategories: ["historical_pricing", "estimate_review"],
      },
    ],
  },
  {
    id: "occupied-site-logistics",
    name: "Occupied Site Logistics",
    isActive: true,
    priority: 50,
    conditions: [
      {
        id: "occupied-site-is-true",
        fieldPath: "logistics.occupiedSite",
        operator: "equals",
        value: true,
      },
    ],
    effects: [
      {
        id: "suggest-occupied-context",
        type: "SUGGEST_CONTEXT_TAG",
        targetId: "occupied_site",
        label: "Occupied Site",
        impactCategories: ["bid_package_generation", "itb_readiness", "proposal_output"],
      },
      {
        id: "add-occupied-site-warning",
        type: "ADD_WARNING",
        label: "Clarify temporary protection, access, dust/noise controls, and phasing before ITB launch.",
        impactCategories: ["itb_readiness", "proposal_output"],
      },
    ],
  },
  {
    id: "exterior-envelope-scope",
    name: "Exterior Envelope Scope",
    isActive: true,
    priority: 60,
    conditions: [
      {
        id: "envelope-scope-included",
        fieldPath: "globalAttributes.envelopeScope",
        operator: "equals",
        value: "included",
      },
    ],
    effects: [
      {
        id: "suggest-envelope-context",
        type: "SUGGEST_CONTEXT_TAG",
        targetId: "exterior_envelope_scope",
        label: "Exterior Envelope Scope",
        impactCategories: ["bid_package_generation", "itb_readiness"],
      },
      {
        id: "suggest-roofing",
        type: "SUGGEST_TRADE",
        targetId: "roofing",
        label: "Roofing",
        impactCategories: ["bid_package_generation", "subcontractor_matching"],
      },
      {
        id: "add-envelope-itb-requirement",
        type: "ADD_ITB_REQUIREMENT",
        targetFieldPath: "packageReview.envelopeClarifications",
        label: "Envelope clarifications reviewed by package",
        impactCategories: ["itb_readiness", "proposal_output"],
      },
    ],
  },
  {
    id: "public-bid-procurement",
    name: "Public Bid Procurement",
    isActive: true,
    priority: 70,
    conditions: [
      {
        id: "public-private-is-public",
        fieldPath: "procurement.publicPrivate",
        operator: "equals",
        value: "public",
      },
    ],
    effects: [
      {
        id: "suggest-public-bid-context",
        type: "SUGGEST_CONTEXT_TAG",
        targetId: "public_bid",
        label: "Public Bid",
        impactCategories: ["itb_readiness", "proposal_output"],
      },
      {
        id: "require-prevailing-wage-review",
        type: "REQUIRE_FIELD",
        targetFieldPath: "procurement.prevailingWage",
        label: "Prevailing wage status",
        impactCategories: ["itb_readiness", "proposal_output"],
      },
      {
        id: "add-public-bid-warning",
        type: "ADD_WARNING",
        label: "Confirm public procurement, wage, bond, tax, and form requirements before ITB launch.",
        impactCategories: ["itb_readiness", "proposal_output"],
      },
    ],
  },
];

export function evaluateProjectSetupRules(
  profile: ProjectProfile,
  rules: readonly ProjectSetupRule[] = projectSetupRules,
): ProjectSetupRuleEvaluation {
  const matchingRules = rules
    .filter((rule) => rule.isActive)
    .filter((rule) => rule.conditions.every((condition) => doesConditionMatch(profile, condition)))
    .sort((leftRule, rightRule) => (leftRule.priority ?? 0) - (rightRule.priority ?? 0));

  return {
    matchingRules,
    effects: dedupeEffects(matchingRules.flatMap((rule) => rule.effects)),
  };
}

function doesConditionMatch(profile: ProjectProfile, condition: ProjectSetupRuleCondition): boolean {
  const actualValue = getValueAtPath(profile, condition.fieldPath);

  switch (condition.operator) {
    case "equals":
      return actualValue === condition.value;
    case "not_equals":
      return actualValue !== condition.value;
    case "includes":
      return Array.isArray(actualValue) && typeof condition.value === "string"
        ? actualValue.includes(condition.value)
        : false;
    case "not_includes":
      return Array.isArray(actualValue) && typeof condition.value === "string"
        ? !actualValue.includes(condition.value)
        : true;
    case "exists":
      return actualValue !== undefined && actualValue !== null && actualValue !== "";
    case "not_exists":
      return actualValue === undefined || actualValue === null || actualValue === "";
    default:
      return false;
  }
}

function getValueAtPath(source: unknown, fieldPath: string): unknown {
  return fieldPath.split(".").reduce<unknown>((currentValue, pathPart) => {
    if (currentValue === null || typeof currentValue !== "object") {
      return undefined;
    }

    return (currentValue as Record<string, unknown>)[pathPart];
  }, source);
}

function dedupeEffects(effects: readonly ProjectSetupRuleEffect[]): ProjectSetupRuleEffect[] {
  const effectByKey = new Map<string, ProjectSetupRuleEffect>();

  effects.forEach((effect) => {
    const key = `${effect.type}:${effect.targetFieldPath ?? effect.targetId ?? effect.id}`;
    if (!effectByKey.has(key)) {
      effectByKey.set(key, effect);
    }
  });

  return [...effectByKey.values()];
}
