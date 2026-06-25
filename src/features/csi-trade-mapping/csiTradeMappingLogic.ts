import {
  get1995SectionsForCurrent,
  getCurrentSectionsFor1995,
} from "@/lib/csiCrosswalk";
import { formatCsiMasterFormatVersion } from "@/types/Csi";

import { defaultCsiTradeMappingRules } from "./defaultCsiTradeMappingRules";
import type {
  AssignCsiItemsToTradesInput,
  AssignCsiItemToTradeInput,
  CsiToTradeMappingRule,
  CsiTradeAssignment,
  CsiTradeAssignmentOverride,
  CsiTradeMappingItem,
  CsiVersionId,
  DeriveEquivalentCsiCoverageInput,
  EquivalentCsiCoverage,
  MappingConfidence,
  SubcontractorCsiCoverage,
  CreateSubcontractorDualCoverageInput,
} from "./types";

export function getCsiTradeMappingRules(): CsiToTradeMappingRule[] {
  return defaultCsiTradeMappingRules;
}

export function getCsiTradeMappingRulesForVersion(
  version: CsiVersionId,
): CsiToTradeMappingRule[] {
  return defaultCsiTradeMappingRules.filter((rule) => rule.csiVersion === version);
}

export function assignCsiItemsToTrades(input: AssignCsiItemsToTradesInput): CsiTradeAssignment[] {
  return input.csiItems.map((csiItem) => assignCsiItemToTrade({ ...input, csiItem }));
}

export function assignCsiItemToTrade(input: AssignCsiItemToTradeInput): CsiTradeAssignment {
  const rules = input.rules ?? defaultCsiTradeMappingRules;
  const projectCsiVersion = input.projectCsiVersion ?? input.csiItem.version;

  const projectOverride = findOverride(input.csiItem, input.projectOverrides);
  if (projectOverride) {
    return assignmentFromOverride(input.csiItem, projectOverride, "PROJECT_OVERRIDE");
  }

  const companyOverride = findOverride(input.csiItem, input.companyOverrides);
  if (companyOverride) {
    return assignmentFromOverride(input.csiItem, companyOverride, "COMPANY_OVERRIDE");
  }

  const versionRules = rules.filter((rule) => rule.csiVersion === input.csiItem.version);
  const directExactRule = findExactRule(input.csiItem, versionRules);
  if (directExactRule) {
    return assignmentFromRule(input.csiItem, directExactRule, "DIRECT_VERSION_RULE");
  }

  const codePatternRule = findCodePatternRule(input.csiItem, versionRules);
  if (codePatternRule) {
    return assignmentFromRule(input.csiItem, codePatternRule, "CODE_PATTERN_RULE");
  }

  const keywordRule = findKeywordRule(input.csiItem, versionRules);
  if (keywordRule) {
    return assignmentFromRule(input.csiItem, keywordRule, "KEYWORD_RULE");
  }

  const crosswalkAssignment = findCrosswalkAssignment(input, rules, projectCsiVersion);
  if (crosswalkAssignment) {
    return crosswalkAssignment;
  }

  const genericRule = findKeywordRule(input.csiItem, rules) ?? findCodePatternRule(input.csiItem, rules);
  if (genericRule) {
    return assignmentFromRule(input.csiItem, genericRule, "GENERIC_FALLBACK");
  }

  return {
    csiItemId: input.csiItem.id,
    csiVersion: input.csiItem.version,
    confidence: "LOW",
    source: "UNASSIGNED",
    reason: `No CSI-to-trade mapping rule matched ${formatCsiItem(input.csiItem)}. Estimator review required.`,
  };
}

export function deriveEquivalentCsiCoverage(
  input: DeriveEquivalentCsiCoverageInput,
): EquivalentCsiCoverage[] {
  const targetVersion = getAlternateVersion(input.sourceVersion);
  const sections =
    input.sourceVersion === "MASTERFORMAT_2004_PLUS"
      ? get1995SectionsForCurrent(input.sourceCsiNumber)
      : getCurrentSectionsFor1995(input.sourceCsiNumber);

  return sections.map((section) => ({
    version: targetVersion,
    csiItemId: createDerivedCsiItemId(targetVersion, section.sectionNumber),
    csiNumber: section.sectionNumber ?? undefined,
    csiTitle: section.title ?? undefined,
    confidence: getCrosswalkConfidence(section.sectionNumber ?? undefined, input.sourceCsiNumber),
    source: "CSI_CROSSWALK",
    notes: `Derived from ${input.sourceVersion} ${input.sourceCsiNumber} using CSI crosswalk.`,
  }));
}

export function createSubcontractorDualCoverage(
  input: CreateSubcontractorDualCoverageInput,
): SubcontractorCsiCoverage {
  const now = input.now ?? new Date().toISOString();
  const equivalentCsiItems = deriveEquivalentCsiCoverage(input);

  return {
    id: input.id ?? `${input.subcontractorId}-${input.sourceVersion}-${slugify(input.sourceCsiItemId)}`,
    subcontractorId: input.subcontractorId,
    sourceVersion: input.sourceVersion,
    sourceCsiItemId: input.sourceCsiItemId,
    sourceCsiNumber: input.sourceCsiNumber,
    sourceCsiTitle: input.sourceCsiTitle,
    equivalentCsiItems,
    source: input.source ?? "SYSTEM_DERIVED",
    confidence: equivalentCsiItems.length ? "HIGH" : "LOW",
    createdAt: now,
    updatedAt: now,
  };
}

function findCrosswalkAssignment(
  input: AssignCsiItemToTradeInput,
  rules: CsiToTradeMappingRule[],
  projectCsiVersion: CsiVersionId,
): CsiTradeAssignment | undefined {
  const equivalentItems =
    input.equivalentItems && input.equivalentItems.length
      ? input.equivalentItems
      : deriveEquivalentCsiCoverage({
          sourceVersion: input.csiItem.version,
          sourceCsiItemId: input.csiItem.id,
          sourceCsiNumber: input.csiItem.number,
          sourceCsiTitle: input.csiItem.name,
        });

  const preferredEquivalentItems = equivalentItems.filter(
    (item) => item.version === getAlternateVersion(input.csiItem.version),
  );

  for (const equivalentItem of preferredEquivalentItems) {
    const crosswalkedCsiItem: CsiTradeMappingItem = {
      id: equivalentItem.csiItemId,
      version: equivalentItem.version,
      number: equivalentItem.csiNumber ?? equivalentItem.csiItemId,
      name: equivalentItem.csiTitle ?? equivalentItem.csiItemId,
    };
    const crosswalkRules = rules.filter((rule) => rule.csiVersion === crosswalkedCsiItem.version);
    const rule =
      findExactRule(crosswalkedCsiItem, crosswalkRules) ??
      findCodePatternRule(crosswalkedCsiItem, crosswalkRules) ??
      findKeywordRule(crosswalkedCsiItem, crosswalkRules);

    if (!rule) continue;

    const assignment = assignmentFromRule(crosswalkedCsiItem, rule, "CROSSWALK_RULE");
    return {
      ...assignment,
      csiItemId: input.csiItem.id,
      csiVersion: input.csiItem.version,
      confidence: getCrosswalkAssignmentConfidence(assignment.confidence, equivalentItem.confidence),
      crosswalkedFromCsiItemId: crosswalkedCsiItem.id,
      crosswalkedFromVersion: crosswalkedCsiItem.version,
      crosswalkedFromCsiNumber: crosswalkedCsiItem.number,
      reason: `No direct ${formatCsiMasterFormatVersion(input.csiItem.version)} rule matched ${formatCsiItem(
        input.csiItem,
      )}. Crosswalked to ${formatCsiMasterFormatVersion(crosswalkedCsiItem.version)} ${crosswalkedCsiItem.number} and matched rule ${
        rule.id
      } for ${formatCsiMasterFormatVersion(projectCsiVersion)} project evaluation.`,
    };
  }

  return undefined;
}

function findOverride(
  csiItem: CsiTradeMappingItem,
  overrides: CsiTradeAssignmentOverride[] | undefined,
): CsiTradeAssignmentOverride | undefined {
  return overrides?.find(
    (override) =>
      override.csiVersion === csiItem.version &&
      (override.csiItemId === csiItem.id ||
        normalizeCode(override.csiNumber ?? "") === normalizeCode(csiItem.number)),
  );
}

function findExactRule(
  csiItem: CsiTradeMappingItem,
  rules: CsiToTradeMappingRule[],
): CsiToTradeMappingRule | undefined {
  return rules.find((rule) => rule.exactCsiIds?.includes(csiItem.id));
}

function findCodePatternRule(
  csiItem: CsiTradeMappingItem,
  rules: CsiToTradeMappingRule[],
): CsiToTradeMappingRule | undefined {
  const normalizedNumber = normalizeCode(csiItem.number);

  return rules.find((rule) =>
    rule.csiCodePatterns?.some((pattern) => normalizedNumber.startsWith(normalizeCode(pattern))),
  );
}

function findKeywordRule(
  csiItem: CsiTradeMappingItem,
  rules: CsiToTradeMappingRule[],
): CsiToTradeMappingRule | undefined {
  const text = normalizeText(`${csiItem.number} ${csiItem.name}`);

  return rules.find((rule) =>
    rule.titleKeywords?.some((keyword) => text.includes(normalizeText(keyword))),
  );
}

function assignmentFromOverride(
  csiItem: CsiTradeMappingItem,
  override: CsiTradeAssignmentOverride,
  source: "PROJECT_OVERRIDE" | "COMPANY_OVERRIDE",
): CsiTradeAssignment {
  return {
    csiItemId: csiItem.id,
    csiVersion: csiItem.version,
    tradeId: override.tradeId,
    specializationId: override.specializationId,
    matchStrength: override.matchStrength ?? "PRIMARY",
    confidence: override.confidence ?? "HIGH",
    source,
    reason: override.reason ?? `${source === "PROJECT_OVERRIDE" ? "Project" : "Company"} override matched ${formatCsiItem(csiItem)}.`,
  };
}

function assignmentFromRule(
  csiItem: CsiTradeMappingItem,
  rule: CsiToTradeMappingRule,
  source: CsiTradeAssignment["source"],
): CsiTradeAssignment {
  return {
    csiItemId: csiItem.id,
    csiVersion: csiItem.version,
    tradeId: rule.tradeId,
    specializationId: rule.specializationId,
    matchStrength: rule.matchStrength,
    confidence: rule.confidence ?? confidenceForSource(source),
    source,
    possibleTradeIds: rule.possibleTradeIds,
    reason: `${formatSource(source)} matched rule ${rule.id} for ${formatCsiItem(csiItem)}.${
      rule.notes ? ` ${rule.notes}` : ""
    }`,
  };
}

function getAlternateVersion(version: CsiVersionId): CsiVersionId {
  return version === "MASTERFORMAT_2004_PLUS" ? "MASTERFORMAT_1995" : "MASTERFORMAT_2004_PLUS";
}

function confidenceForSource(source: CsiTradeAssignment["source"]): MappingConfidence {
  if (source === "PROJECT_OVERRIDE" || source === "COMPANY_OVERRIDE" || source === "DIRECT_VERSION_RULE") {
    return "HIGH";
  }

  if (source === "CODE_PATTERN_RULE" || source === "KEYWORD_RULE" || source === "CROSSWALK_RULE") {
    return "MEDIUM";
  }

  return "LOW";
}

function getCrosswalkAssignmentConfidence(
  assignmentConfidence: MappingConfidence,
  crosswalkConfidence: MappingConfidence,
): MappingConfidence {
  if (assignmentConfidence === "LOW" || crosswalkConfidence === "LOW") return "LOW";
  if (assignmentConfidence === "MEDIUM" || crosswalkConfidence === "MEDIUM") return "MEDIUM";
  return "HIGH";
}

function getCrosswalkConfidence(targetNumber: string | undefined, sourceNumber: string): MappingConfidence {
  if (!targetNumber) return "LOW";
  return normalizeCode(targetNumber).slice(0, 2) === normalizeCode(sourceNumber).slice(0, 2)
    ? "HIGH"
    : "MEDIUM";
}

function createDerivedCsiItemId(version: CsiVersionId, sectionNumber: string | null): string {
  const prefix = version === "MASTERFORMAT_2004_PLUS" ? "2004-plus" : "1995";
  return `${prefix}-${slugify(sectionNumber ?? "unknown")}`;
}

function formatCsiItem(csiItem: CsiTradeMappingItem): string {
  return `${csiItem.number} ${csiItem.name}`.trim();
}

function formatSource(source: CsiTradeAssignment["source"]): string {
  return source
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function normalizeCode(value: string): string {
  return value.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
}

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function slugify(value: string): string {
  return normalizeText(value).replace(/\s+/g, "-") || "unknown";
}
