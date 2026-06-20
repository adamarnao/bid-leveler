import {
  CrossTradeMapping,
  ProjectSectorTag,
  TradeCsiAssignment,
  TradeCsiMappingRule,
  TradePackageGenerationContext,
  TradePackageGenerationResult,
  TradePackageSuggestion,
  TradeTaxonomyCsiItem,
  TradeTaxonomyNode,
} from "./types";

type GenerateTradePackageSuggestionsOptions = {
  csiItems: TradeTaxonomyCsiItem[];
  taxonomy: TradeTaxonomyNode[];
  rules: TradeCsiMappingRule[];
  csiVersion: string;
  crossTradeMappings?: CrossTradeMapping[];
  sectorTags?: ProjectSectorTag[];
} & TradePackageGenerationContext;

const matchStrengthRank: Record<TradeCsiAssignment["matchStrength"], number> = {
  PRIMARY: 0,
  SECONDARY: 1,
  POSSIBLE: 2,
};

const healthcareLabSpecificPackageIds = new Set([
  "healthcare-systems",
  "medical-gas",
  "nurse-call",
  "pneumatic-tube-systems",
  "imaging-equipment-support",
  "icra-infection-control",
  "lead-lined-construction",
  "radiation-shielding",
  "laboratory-cleanroom-systems",
]);

const foodServiceSpecificPackageIds = new Set([
  "food-service-systems",
  "food-service-equipment",
  "commercial-kitchen-equipment",
  "kitchen-hood",
  "kitchen-exhaust",
  "grease-duct",
  "kitchen-hood-fire-suppression",
  "walk-in-coolers-freezers",
  "refrigeration",
]);

export function matchCsiItemToTrades(
  csiItem: TradeTaxonomyCsiItem,
  rules: TradeCsiMappingRule[],
  taxonomy: TradeTaxonomyNode[]
): TradeCsiAssignment[] {
  const tradeIds = new Set(taxonomy.filter((node) => node.isActive).map((node) => node.id));

  return rules
    .filter((rule) => tradeIds.has(rule.tradeId))
    .filter((rule) => isRuleAvailableForVersion(rule, csiItem.version))
    .map((rule) => getRuleAssignment(csiItem, rule))
    .filter(isDefined)
    .sort(compareAssignments);
}

export function assignCsiItemsToTrades(
  csiItems: TradeTaxonomyCsiItem[],
  rules: TradeCsiMappingRule[],
  taxonomy: TradeTaxonomyNode[],
  crossTradeMappings: CrossTradeMapping[] = [],
  context: TradePackageGenerationContext = {}
): TradeCsiAssignment[] {
  return csiItems
    .map((item) =>
      getPreferredAssignmentForCsiItem(item, rules, taxonomy, crossTradeMappings, context)
    )
    .filter(isDefined);
}

export function generateTradePackageSuggestions({
  csiItems,
  taxonomy,
  rules,
  csiVersion,
  crossTradeMappings = [],
  sectorTags = [],
  workTypeTags = [],
  contextTags = [],
}: GenerateTradePackageSuggestionsOptions): TradePackageGenerationResult {
  const supportedItems = csiItems.filter((item) =>
    isRuleVersionCompatible(csiVersion, item.version)
  );
  const assignments = assignCsiItemsToTrades(
    supportedItems,
    rules,
    taxonomy,
    crossTradeMappings,
    { sectorTags, workTypeTags, contextTags }
  );
  const assignedItemIds = new Set(assignments.map((assignment) => assignment.csiItemId));
  const unassignedCsiItemIds = supportedItems
    .filter((item) => !assignedItemIds.has(item.id))
    .map((item) => item.id);
  const packageGroups = new Map<
    string,
    {
      trade: TradeTaxonomyNode;
      childTradeIds: Set<string>;
      csiItemIds: Set<string>;
      assignmentConfidences: TradeCsiAssignment["confidence"][];
      warnings: Set<string>;
    }
  >();

  assignments.forEach((assignment) => {
    const assignedTrade = taxonomy.find((node) => node.id === assignment.tradeId);
    if (!assignedTrade) return;

    const packageTrade = getPackageTradeForAssignment(assignment, assignedTrade, taxonomy);
    const group =
      packageGroups.get(packageTrade.id) ??
      {
        trade: packageTrade,
        childTradeIds: new Set<string>(),
        csiItemIds: new Set<string>(),
        assignmentConfidences: [],
        warnings: new Set<string>(),
      };

    group.csiItemIds.add(assignment.csiItemId);
    group.assignmentConfidences.push(assignment.confidence);
    if (assignedTrade.id !== packageTrade.id) group.childTradeIds.add(assignedTrade.id);
    if (packageTrade.defaultPackageMode === "USER_CHOICE") {
      group.warnings.add(
        `${packageTrade.name} may be bid as one package or split by specialization.`
      );
    }
    if (assignment.confidence === "LOW") {
      group.warnings.add(`Low confidence match for CSI item ${assignment.csiItemId}.`);
    }
    if (assignment.isAmbiguous && assignment.possibleTradeIds?.length) {
      group.warnings.add(
        getAmbiguityWarning(assignment, taxonomy)
      );
    }
    if (assignment.classificationNote) {
      group.warnings.add(assignment.classificationNote);
    }

    packageGroups.set(packageTrade.id, group);
  });

  const suggestions = Array.from(packageGroups.values())
    .map<TradePackageSuggestion>((group) => ({
      tradeId: group.trade.id,
      name: group.trade.name,
      parentTradeId: group.trade.parentId,
      packageMode: group.trade.defaultPackageMode,
      csiItemIds: Array.from(group.csiItemIds).sort(),
      childTradeIds:
        group.childTradeIds.size > 0
          ? Array.from(group.childTradeIds).sort()
          : undefined,
      confidence: getSuggestionConfidence(group.assignmentConfidences),
      warnings: Array.from(group.warnings),
    }))
    .sort((left, right) => {
      const leftTrade = taxonomy.find((node) => node.id === left.tradeId);
      const rightTrade = taxonomy.find((node) => node.id === right.tradeId);

      return (leftTrade?.sortOrder ?? 0) - (rightTrade?.sortOrder ?? 0);
    });
  const warnings = [
    ...unassignedCsiItemIds.map(
      (itemId) => `No trade taxonomy mapping found for CSI item ${itemId}.`
    ),
    ...suggestions.flatMap((suggestion) => suggestion.warnings),
  ];

  return {
    suggestions,
    assignments,
    unassignedCsiItemIds,
    warnings: Array.from(new Set(warnings)),
  };
}

function getPreferredAssignmentForCsiItem(
  csiItem: TradeTaxonomyCsiItem,
  rules: TradeCsiMappingRule[],
  taxonomy: TradeTaxonomyNode[],
  crossTradeMappings: CrossTradeMapping[],
  context: TradePackageGenerationContext
): TradeCsiAssignment | undefined {
  const crossTradeMapping = matchCrossTradeMapping(csiItem, crossTradeMappings);
  const ruleAssignment = matchCsiItemToTrades(csiItem, rules, taxonomy)[0];

  if (!crossTradeMapping) return ruleAssignment;

  const primaryTrade = taxonomy.find((node) => node.id === crossTradeMapping.primaryTradeId);
  if (!primaryTrade) return ruleAssignment;

  const classificationPreference = getClassificationPreferredTrade(
    crossTradeMapping,
    context,
    taxonomy
  );
  const selectedTradeId = classificationPreference?.tradeId ?? crossTradeMapping.primaryTradeId;
  const selectedTrade = taxonomy.find((node) => node.id === selectedTradeId) ?? primaryTrade;
  const sectorPreferredTradeId = getSectorPreferredTradeId(crossTradeMapping, context.sectorTags ?? []);
  const classificationNote =
    classificationPreference && classificationPreference.tradeId !== crossTradeMapping.primaryTradeId
      ? `Assigned to ${selectedTrade.name} because ${classificationPreference.label} context makes that package more specific than ${primaryTrade.name}.`
      : classificationPreference
        ? `${classificationPreference.label} context supports assigning ${crossTradeMapping.label} to ${selectedTrade.name}.`
        : undefined;
  const crossTradeAssignment: TradeCsiAssignment = {
    csiItemId: csiItem.id,
    tradeId: selectedTrade.id,
    matchStrength: "PRIMARY",
    confidence: classificationPreference ? "MEDIUM" : "LOW",
    reason: classificationNote
      ? `${classificationNote} ${crossTradeMapping.label} remains cross-trade scope and should be reviewed.`
      : `${crossTradeMapping.label} is cross-trade scope. Conservative primary trade is ${primaryTrade.name}.`,
    crossTradeMappingId: crossTradeMapping.id,
    possibleTradeIds: crossTradeMapping.possibleTradeIds,
    sectorPreferredTradeId,
    classificationPreferredTradeId: classificationPreference?.tradeId,
    classificationContextLabel: classificationPreference?.label,
    classificationNote,
    isAmbiguous: true,
  };

  if (!ruleAssignment) return crossTradeAssignment;
  if (ruleAssignment.tradeId === selectedTrade.id) {
    return {
      ...ruleAssignment,
      confidence: classificationPreference
        ? getContextAdjustedConfidence(ruleAssignment.confidence)
        : downgradeConfidence(ruleAssignment.confidence),
      reason: classificationNote
        ? `${ruleAssignment.reason} ${classificationNote}`
        : `${ruleAssignment.reason} ${crossTradeMapping.label} is cross-trade scope.`,
      crossTradeMappingId: crossTradeMapping.id,
      possibleTradeIds: crossTradeMapping.possibleTradeIds,
      sectorPreferredTradeId,
      classificationPreferredTradeId: classificationPreference?.tradeId,
      classificationContextLabel: classificationPreference?.label,
      classificationNote,
      isAmbiguous: true,
    };
  }

  return {
    ...crossTradeAssignment,
    reason: `${crossTradeAssignment.reason} Rule ${ruleAssignment.tradeId} also matched and should be reviewed.`,
  };
}

function matchCrossTradeMapping(
  csiItem: TradeTaxonomyCsiItem,
  crossTradeMappings: CrossTradeMapping[]
): CrossTradeMapping | undefined {
  return crossTradeMappings.find((mapping) => {
    if (mapping.exactCsiIds?.includes(csiItem.id)) return true;

    const normalizedCode = normalizeCsiCode(csiItem.number);
    const hasCodeMatch = (mapping.csiCodePatterns ?? []).some((pattern) =>
      normalizedCode.startsWith(normalizeCsiCode(pattern.replace(/\*$/, "")))
    );
    if (hasCodeMatch) return true;

    const normalizedTitle = normalizeSearchText(csiItem.name);

    return (mapping.titleKeywords ?? []).some((keyword) =>
      normalizedTitle.includes(normalizeSearchText(keyword))
    );
  });
}

function getSectorPreferredTradeId(
  crossTradeMapping: CrossTradeMapping,
  sectorTags: ProjectSectorTag[]
): string | undefined {
  return sectorTags
    .map((sectorTag) => crossTradeMapping.sectorPreferredTradeIds?.[sectorTag])
    .find(isDefined);
}

function getClassificationPreferredTrade(
  crossTradeMapping: CrossTradeMapping,
  context: TradePackageGenerationContext,
  taxonomy: TradeTaxonomyNode[]
): { tradeId: string; label: string } | undefined {
  const eligibleTradeIds = new Set([
    crossTradeMapping.primaryTradeId,
    ...crossTradeMapping.possibleTradeIds,
  ]);

  const contextPreference = getPreferredTradeFromTagMap(
    context.contextTags ?? [],
    crossTradeMapping.contextPreferredTradeIds,
    formatContextTag
  );
  if (contextPreference && isEligibleActiveTrade(contextPreference.tradeId, eligibleTradeIds, taxonomy)) {
    return contextPreference;
  }

  const workTypePreference = getPreferredTradeFromTagMap(
    context.workTypeTags ?? [],
    crossTradeMapping.workTypePreferredTradeIds,
    formatWorkTypeTag
  );
  if (workTypePreference && isEligibleActiveTrade(workTypePreference.tradeId, eligibleTradeIds, taxonomy)) {
    return workTypePreference;
  }

  const sectorPreference = getPreferredTradeFromTagMap(
    context.sectorTags ?? [],
    crossTradeMapping.sectorPreferredTradeIds,
    formatSectorTag
  );
  if (sectorPreference && isEligibleActiveTrade(sectorPreference.tradeId, eligibleTradeIds, taxonomy)) {
    return sectorPreference;
  }

  return undefined;
}

function getPreferredTradeFromTagMap<TTag extends string>(
  tags: TTag[],
  tradeIdsByTag: Partial<Record<TTag, string>> | undefined,
  formatTag: (tag: TTag) => string
): { tradeId: string; label: string } | undefined {
  return tags
    .map((tag) => {
      const tradeId = tradeIdsByTag?.[tag];

      return tradeId ? { tradeId, label: formatTag(tag) } : undefined;
    })
    .find(isDefined);
}

function isEligibleActiveTrade(
  tradeId: string,
  eligibleTradeIds: Set<string>,
  taxonomy: TradeTaxonomyNode[]
) {
  return eligibleTradeIds.has(tradeId) && taxonomy.some((node) => node.id === tradeId && node.isActive);
}

function getAmbiguityWarning(
  assignment: TradeCsiAssignment,
  taxonomy: TradeTaxonomyNode[]
) {
  const primaryTradeName = taxonomy.find((node) => node.id === assignment.tradeId)?.name ?? assignment.tradeId;
  const possibleTradeNames = (assignment.possibleTradeIds ?? [])
    .map((tradeId) => taxonomy.find((node) => node.id === tradeId)?.name ?? tradeId)
    .join(", ");
  const sectorPreferredTradeName = assignment.sectorPreferredTradeId
    ? taxonomy.find((node) => node.id === assignment.sectorPreferredTradeId)?.name ??
      assignment.sectorPreferredTradeId
    : undefined;
  const classificationPreferredTradeName = assignment.classificationPreferredTradeId
    ? taxonomy.find((node) => node.id === assignment.classificationPreferredTradeId)?.name ??
      assignment.classificationPreferredTradeId
    : undefined;

  return `${assignment.csiItemId} is ambiguous cross-trade scope. Primary suggestion: ${primaryTradeName}. Possible trades: ${possibleTradeNames}.${
    sectorPreferredTradeName ? ` Sector preference: ${sectorPreferredTradeName}.` : ""
  }${
    classificationPreferredTradeName && classificationPreferredTradeName !== sectorPreferredTradeName
      ? ` Classification preference: ${classificationPreferredTradeName}.`
      : ""
  }`;
}

function downgradeConfidence(
  confidence: TradeCsiAssignment["confidence"]
): TradeCsiAssignment["confidence"] {
  if (confidence === "HIGH") return "MEDIUM";

  return "LOW";
}

function getContextAdjustedConfidence(
  confidence: TradeCsiAssignment["confidence"]
): TradeCsiAssignment["confidence"] {
  if (confidence === "LOW") return "MEDIUM";

  return confidence;
}

function formatSectorTag(tag: string) {
  return formatClassificationTag(tag);
}

function formatWorkTypeTag(tag: string) {
  return formatClassificationTag(tag);
}

function formatContextTag(tag: string) {
  return formatClassificationTag(tag);
}

function formatClassificationTag(tag: string) {
  return tag
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getPackageTradeForAssignment(
  assignment: TradeCsiAssignment,
  assignedTrade: TradeTaxonomyNode,
  taxonomy: TradeTaxonomyNode[]
): TradeTaxonomyNode {
  if (shouldKeepSpecificPackageTrade(assignment, assignedTrade, taxonomy)) {
    return assignedTrade;
  }

  const parentTrade = assignedTrade.parentId
    ? taxonomy.find((node) => node.id === assignedTrade.parentId)
    : undefined;

  if (!parentTrade) return assignedTrade;
  if (parentTrade.defaultPackageMode === "UMBRELLA") return parentTrade;
  if (parentTrade.defaultPackageMode === "SPLIT_BY_CHILD") return assignedTrade;

  return parentTrade;
}

function shouldKeepSpecificPackageTrade(
  assignment: TradeCsiAssignment,
  assignedTrade: TradeTaxonomyNode,
  taxonomy: TradeTaxonomyNode[]
): boolean {
  if (assignment.classificationPreferredTradeId === assignedTrade.id) return true;
  if (healthcareLabSpecificPackageIds.has(assignedTrade.id)) return true;
  if (foodServiceSpecificPackageIds.has(assignedTrade.id)) return true;

  const parentTrade = assignedTrade.parentId
    ? taxonomy.find((node) => node.id === assignedTrade.parentId)
    : undefined;

  return parentTrade
    ? healthcareLabSpecificPackageIds.has(parentTrade.id) ||
        foodServiceSpecificPackageIds.has(parentTrade.id)
    : false;
}

function getRuleAssignment(
  csiItem: TradeTaxonomyCsiItem,
  rule: TradeCsiMappingRule
): TradeCsiAssignment | undefined {
  if (rule.exactCsiIds?.includes(csiItem.id)) {
    return {
      csiItemId: csiItem.id,
      tradeId: rule.tradeId,
      matchStrength: rule.matchStrength,
      confidence: getConfidence(rule.matchStrength, "exact"),
      reason: `Exact CSI id matched rule ${rule.id}.`,
    };
  }

  const normalizedCode = normalizeCsiCode(csiItem.number);
  const matchingCodePattern = (rule.codePatterns ?? []).find((pattern) =>
    normalizedCode.startsWith(normalizeCsiCode(pattern.replace(/\*$/, "")))
  );

  if (matchingCodePattern) {
    return {
      csiItemId: csiItem.id,
      tradeId: rule.tradeId,
      matchStrength: rule.matchStrength,
      confidence: getConfidence(rule.matchStrength, "code"),
      reason: `CSI code ${csiItem.number} matched pattern ${matchingCodePattern}.`,
    };
  }

  const normalizedTitle = normalizeSearchText(csiItem.name);
  const matchingKeyword = (rule.titleKeywords ?? []).find((keyword) =>
    normalizedTitle.includes(normalizeSearchText(keyword))
  );

  if (matchingKeyword) {
    return {
      csiItemId: csiItem.id,
      tradeId: rule.tradeId,
      matchStrength: rule.matchStrength,
      confidence: getConfidence(rule.matchStrength, "keyword"),
      reason: `CSI title matched keyword "${matchingKeyword}".`,
    };
  }

  return undefined;
}

function getConfidence(
  matchStrength: TradeCsiAssignment["matchStrength"],
  matchBasis: "exact" | "code" | "keyword"
): TradeCsiAssignment["confidence"] {
  if (matchStrength === "PRIMARY" && matchBasis !== "keyword") return "HIGH";
  if (matchStrength === "PRIMARY") return "MEDIUM";
  if (matchStrength === "SECONDARY" && matchBasis === "code") return "MEDIUM";

  return "LOW";
}

function getSuggestionConfidence(
  confidences: TradeCsiAssignment["confidence"][]
): TradePackageSuggestion["confidence"] {
  if (confidences.length === 0) return "LOW";
  if (confidences.every((confidence) => confidence === "HIGH")) return "HIGH";
  if (confidences.some((confidence) => confidence === "LOW")) return "LOW";

  return "MEDIUM";
}

function compareAssignments(
  leftAssignment: TradeCsiAssignment,
  rightAssignment: TradeCsiAssignment
) {
  return (
    matchStrengthRank[leftAssignment.matchStrength] -
      matchStrengthRank[rightAssignment.matchStrength] ||
    confidenceRank(leftAssignment.confidence) -
      confidenceRank(rightAssignment.confidence) ||
    leftAssignment.tradeId.localeCompare(rightAssignment.tradeId)
  );
}

function confidenceRank(confidence: TradeCsiAssignment["confidence"]) {
  if (confidence === "HIGH") return 0;
  if (confidence === "MEDIUM") return 1;

  return 2;
}

function isRuleAvailableForVersion(rule: TradeCsiMappingRule, csiVersion: string) {
  return rule.csiVersion === "ALL" || isRuleVersionCompatible(rule.csiVersion, csiVersion);
}

function isRuleVersionCompatible(ruleVersion: string, csiVersion: string) {
  return ruleVersion === "ALL" || ruleVersion === csiVersion;
}

function normalizeCsiCode(value: string) {
  return value.replace(/[^0-9]/g, "");
}

function normalizeSearchText(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}
