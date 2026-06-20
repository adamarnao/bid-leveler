import {
  TradeCsiAssignment,
  TradeCsiMappingRule,
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
};

const matchStrengthRank: Record<TradeCsiAssignment["matchStrength"], number> = {
  PRIMARY: 0,
  SECONDARY: 1,
  POSSIBLE: 2,
};

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
  taxonomy: TradeTaxonomyNode[]
): TradeCsiAssignment[] {
  return csiItems
    .map((item) => matchCsiItemToTrades(item, rules, taxonomy)[0])
    .filter(isDefined);
}

export function generateTradePackageSuggestions({
  csiItems,
  taxonomy,
  rules,
  csiVersion,
}: GenerateTradePackageSuggestionsOptions): TradePackageGenerationResult {
  const supportedItems = csiItems.filter((item) =>
    isRuleVersionCompatible(csiVersion, item.version)
  );
  const assignments = assignCsiItemsToTrades(supportedItems, rules, taxonomy);
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

    const packageTrade = getPackageTrade(assignedTrade, taxonomy);
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
        `${packageTrade.name} may be bid as one package or split by child trade.`
      );
    }
    if (assignment.confidence === "LOW") {
      group.warnings.add(`Low confidence match for CSI item ${assignment.csiItemId}.`);
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

function getPackageTrade(
  assignedTrade: TradeTaxonomyNode,
  taxonomy: TradeTaxonomyNode[]
): TradeTaxonomyNode {
  const parentTrade = assignedTrade.parentId
    ? taxonomy.find((node) => node.id === assignedTrade.parentId)
    : undefined;

  if (!parentTrade) return assignedTrade;
  if (parentTrade.defaultPackageMode === "UMBRELLA") return parentTrade;
  if (parentTrade.defaultPackageMode === "SPLIT_BY_CHILD") return assignedTrade;

  return parentTrade;
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
