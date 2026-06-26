"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import AppShell from "@/components/layout/AppShell";
import ContextHelp from "@/components/ui/ContextHelp";
import { csiCrosswalkEntries } from "@/data/csiCrosswalk";
import {
  getCsiAncestors,
  getCsiCatalog,
  getCsiDivisions,
  resolveCsiCatalogItem,
  searchCsiCatalog,
} from "@/lib/csiCatalog";
import {
  assignCsiItemToTrade,
  createSubcontractorDualCoverage,
  csiTradeMappingFixtureScenarios,
  getCsiTradeMappingRules,
  type CsiToTradeMappingRule,
  type CsiTradeAssignment,
  type CsiTradeMappingFixtureScenario,
  type CsiTradeMappingItem,
  type CsiVersionId,
  type EquivalentCsiCoverage,
} from "@/features/csi-trade-mapping";
import { correctedSidewalkCrosswalkRelationship } from "@/features/csi-normalization/fixtures";
import {
  getDefaultTradeTaxonomy,
  type TradeTaxonomyNode,
} from "@/features/trade-taxonomy";
import {
  formatCsiMasterFormatVersion,
  formatCsiMasterFormatVersionShort,
  type CsiCatalogItem,
} from "@/types/Csi";
import type {
  CsiCrosswalkEntry,
  CsiCrosswalkMappingConfidence,
  CsiCrosswalkRelationship,
  CsiCrosswalkSection,
} from "@/types/CsiCrosswalk";

const csiVersionOptions: { id: CsiVersionId; label: string }[] = [
  { id: "MASTERFORMAT_2004_PLUS", label: "MasterFormat 2004+ / 50-Division" },
  { id: "MASTERFORMAT_1995", label: "MasterFormat 1995 / 16-Division" },
];

const sourceHelp = new Map<string, string>([
  [
    "DIRECT_VERSION_RULE",
    "The CSI item matched a mapping rule in the same MasterFormat version as the input item.",
  ],
  [
    "CROSSWALK_RULE",
    "The input CSI item was converted to the alternate MasterFormat version through the CSI crosswalk, then mapped to a trade.",
  ],
  ["CODE_PATTERN_RULE", "The CSI section number matched a configured code prefix or pattern."],
  ["KEYWORD_RULE", "The CSI title matched configured mapping keywords."],
]);

const confidenceHelp = new Map<string, string>([
  ["HIGH", "Strong assignment. Usually safe for automatic trade mapping."],
  ["MEDIUM", "Plausible assignment. Review when the package affects ITB correctness."],
  ["LOW", "Weak or ambiguous assignment. Estimator review is required before project use."],
]);

const csiTagRoleHelp = [
  { role: "CORE", content: "Expected part of the bid package scope." },
  {
    role: "OPTIONAL",
    content: "May be requested, selected, or split depending on project requirements.",
  },
  { role: "POSSIBLE", content: "Ambiguous CSI tag that should be reviewed before ITB use." },
  { role: "EXCLUDED", content: "Deliberately not part of the package." },
];

type AssignmentPreview = {
  inputItem: CsiTradeMappingItem;
  assignmentItem: CsiTradeMappingItem;
  assignment: CsiTradeAssignment;
  crosswalkEquivalent?: EquivalentCsiCoverage;
  warning?: string;
};

type CatalogCoverageSummary = {
  totalItems: number;
  mappedItems: number;
  unmappedItems: number;
};

type WorkbenchTab =
  | "crosswalk"
  | "csi-to-trade"
  | "trade-to-csi"
  | "coverage-gaps"
  | "test-scenarios";

type CrosswalkDirection = "1995_TO_2004_PLUS" | "2004_PLUS_TO_1995";

type CrosswalkCardinalityFilter =
  | "ALL"
  | CsiCrosswalkRelationship
  | "NO_MATCH";

type CrosswalkRelationshipType =
  | "DIRECT_EQUIVALENT"
  | "BROADER_THAN_TARGET"
  | "NARROWER_THAN_TARGET"
  | "SPLIT_INTO_MULTIPLE_CODES"
  | "CONSOLIDATED_FROM_MULTIPLE_CODES"
  | "RELATED_OPERATIONAL_MATCH"
  | "NO_CLEAR_MATCH";

type CrosswalkRelationshipTypeFilter = "ALL" | CrosswalkRelationshipType;

type CrosswalkReviewStatus = "CLEAN" | "NEEDS_REVIEW" | "AMBIGUOUS" | "UNMAPPED";
type CrosswalkReviewStatusFilter = "ALL" | CrosswalkReviewStatus;

type CrosswalkSourceRow = {
  sourceItem: CsiCatalogItem;
  entries: CsiCrosswalkEntry[];
  targetItems: CsiCatalogItem[];
  cardinality: CrosswalkCardinalityFilter;
  relationshipType: CrosswalkRelationshipType;
  reviewStatus: CrosswalkReviewStatus;
  sourceBasis: string;
  warnings: string[];
  issueType?: string;
  relationshipRole?: string;
  notes?: string;
};

type CrosswalkTargetGroup = {
  label: string;
  targetItems: CsiCatalogItem[];
};

const taxonomy = getDefaultTradeTaxonomy();
const mappingRules = getCsiTradeMappingRules();
const csiVersions = csiVersionOptions.map((option) => option.id);

const workbenchTabs: { id: WorkbenchTab; label: string }[] = [
  { id: "crosswalk", label: "Crosswalk Explorer" },
  { id: "csi-to-trade", label: "CSI to Trade" },
  { id: "trade-to-csi", label: "Trade to CSI" },
  { id: "coverage-gaps", label: "Coverage / Gaps" },
  { id: "test-scenarios", label: "Test Scenarios" },
];

const crosswalkCardinalityOptions: { value: CrosswalkCardinalityFilter; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "ONE_TO_ONE", label: "One-to-one" },
  { value: "ONE_TO_MANY", label: "One-to-many" },
  { value: "MANY_TO_ONE", label: "Many-to-one" },
  { value: "MANY_TO_MANY", label: "Many-to-many" },
  { value: "NO_MATCH", label: "No match" },
];

const crosswalkRelationshipTypeOptions: {
  value: CrosswalkRelationshipTypeFilter;
  label: string;
}[] = [
  { value: "ALL", label: "All" },
  { value: "DIRECT_EQUIVALENT", label: "Direct Equivalent" },
  { value: "BROADER_THAN_TARGET", label: "Broader Than Target" },
  { value: "NARROWER_THAN_TARGET", label: "Narrower Than Target" },
  { value: "SPLIT_INTO_MULTIPLE_CODES", label: "Split Into Multiple Codes" },
  { value: "CONSOLIDATED_FROM_MULTIPLE_CODES", label: "Consolidated From Multiple Codes" },
  { value: "RELATED_OPERATIONAL_MATCH", label: "Related / Operational Match" },
  { value: "NO_CLEAR_MATCH", label: "No Clear Match" },
];

const crosswalkReviewStatusOptions: {
  value: CrosswalkReviewStatusFilter;
  label: string;
}[] = [
  { value: "ALL", label: "All" },
  { value: "CLEAN", label: "Clean" },
  { value: "NEEDS_REVIEW", label: "Needs Review" },
  { value: "AMBIGUOUS", label: "Ambiguous" },
  { value: "UNMAPPED", label: "Unmapped" },
];

function getScenarioById(scenarioId: string): CsiTradeMappingFixtureScenario | undefined {
  return csiTradeMappingFixtureScenarios.find((scenario) => scenario.id === scenarioId);
}

function getVersionLabel(version: CsiVersionId): string {
  return formatCsiMasterFormatVersion(version);
}

function getVersionShortLabel(version: CsiVersionId): string {
  return formatCsiMasterFormatVersionShort(version);
}

function getTradeName(tradeId: string | undefined): string {
  if (!tradeId) return "Unassigned";
  return taxonomy.find((trade) => trade.id === tradeId)?.name ?? tradeId;
}

function formatEnumLabel(value: string): string {
  return value
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function formatCsiItem(item: CsiTradeMappingItem): string {
  return `${item.number} - ${item.name}`;
}

function formatCsiCatalogItem(item: CsiCatalogItem): string {
  return `${item.number} - ${item.name}`;
}

function formatCsiOption(item: CsiCatalogItem): string {
  return `${item.number} — ${item.name}`;
}

function toMappingItem(item: CsiCatalogItem): CsiTradeMappingItem {
  return {
    id: item.id,
    version: item.version,
    number: item.number,
    name: item.name,
  };
}

function resolveEquivalentAsMappingItem(equivalent: EquivalentCsiCoverage): CsiTradeMappingItem {
  const resolvedCatalogItem = equivalent.csiNumber
    ? resolveCsiCatalogItem(equivalent.version, equivalent.csiNumber)
    : undefined;

  return {
    id: resolvedCatalogItem?.id ?? equivalent.csiItemId,
    version: equivalent.version,
    number: resolvedCatalogItem?.number ?? equivalent.csiNumber ?? equivalent.csiItemId,
    name: resolvedCatalogItem?.name ?? equivalent.csiTitle ?? equivalent.csiItemId,
  };
}

function getAlternateVersion(version: CsiVersionId): CsiVersionId {
  return version === "MASTERFORMAT_2004_PLUS" ? "MASTERFORMAT_1995" : "MASTERFORMAT_2004_PLUS";
}

function getCsiParentPath(item: CsiCatalogItem): string {
  const ancestors = getCsiAncestors(item.version, item.id);
  if (!ancestors.length) return "Top-level catalog item";

  return ancestors.map(formatCsiCatalogItem).join(" / ");
}

function getCsiDivisionPath(item: CsiCatalogItem): string {
  const ancestors = getCsiAncestors(item.version, item.id);
  const division = ancestors.find((ancestor) => ancestor.level === 1) ?? (item.level === 1 ? item : undefined);

  return division ? formatCsiCatalogItem(division) : "Division not resolved";
}

function getCatalogCoverageSummary(version: CsiVersionId): CatalogCoverageSummary {
  const catalog = getCsiCatalog(version);
  let unmappedItems = 0;

  catalog.forEach((item) => {
    const assignment = assignCsiItemToTrade({
      csiItem: toMappingItem(item),
      projectCsiVersion: version,
    });

    if (assignment.source === "UNASSIGNED") {
      unmappedItems += 1;
    }
  });

  return {
    totalItems: catalog.length,
    mappedItems: catalog.length - unmappedItems,
    unmappedItems,
  };
}

function getCrosswalkSourceVersion(direction: CrosswalkDirection): CsiVersionId {
  return direction === "1995_TO_2004_PLUS" ? "MASTERFORMAT_1995" : "MASTERFORMAT_2004_PLUS";
}

function getCrosswalkTargetVersion(direction: CrosswalkDirection): CsiVersionId {
  return direction === "1995_TO_2004_PLUS" ? "MASTERFORMAT_2004_PLUS" : "MASTERFORMAT_1995";
}

function getCrosswalkDirectionLabel(direction: CrosswalkDirection): string {
  return direction === "1995_TO_2004_PLUS"
    ? "1995 / 16-Division to 2004+ / 50-Division"
    : "2004+ / 50-Division to 1995 / 16-Division";
}

function getSourceSection(entry: CsiCrosswalkEntry, direction: CrosswalkDirection): CsiCrosswalkSection {
  return direction === "1995_TO_2004_PLUS" ? entry.sourceSection : entry.targetSection;
}

function getTargetSection(entry: CsiCrosswalkEntry, direction: CrosswalkDirection): CsiCrosswalkSection {
  return direction === "1995_TO_2004_PLUS" ? entry.targetSection : entry.sourceSection;
}

function invertCrosswalkRelationship(
  relationship: CsiCrosswalkRelationship,
  direction: CrosswalkDirection,
): CsiCrosswalkRelationship {
  if (direction === "1995_TO_2004_PLUS") return relationship;
  if (relationship === "ONE_TO_MANY") return "MANY_TO_ONE";
  if (relationship === "MANY_TO_ONE") return "ONE_TO_MANY";
  return relationship;
}

function getCrosswalkCardinality(
  entries: CsiCrosswalkEntry[],
  direction: CrosswalkDirection,
): CrosswalkCardinalityFilter {
  if (!entries.length) return "NO_MATCH";

  const relationships = new Set(
    entries.map((entry) => invertCrosswalkRelationship(entry.relationship, direction)),
  );

  if (relationships.has("MANY_TO_MANY")) return "MANY_TO_MANY";
  if (relationships.has("ONE_TO_MANY") && relationships.has("MANY_TO_ONE")) return "MANY_TO_MANY";
  if (relationships.has("ONE_TO_MANY")) return "ONE_TO_MANY";
  if (relationships.has("MANY_TO_ONE")) return "MANY_TO_ONE";
  if (relationships.has("INCOMPLETE")) return "NO_MATCH";
  return "ONE_TO_ONE";
}

function getCrosswalkRelationshipType(
  cardinality: CrosswalkCardinalityFilter,
  mappingConfidence: CsiCrosswalkMappingConfidence | undefined,
): CrosswalkRelationshipType {
  if (cardinality === "NO_MATCH" || mappingConfidence === "INCOMPLETE") return "NO_CLEAR_MATCH";
  if (cardinality === "ONE_TO_ONE" && mappingConfidence === "DIRECT") return "DIRECT_EQUIVALENT";
  if (cardinality === "ONE_TO_MANY") return "SPLIT_INTO_MULTIPLE_CODES";
  if (cardinality === "MANY_TO_ONE") return "CONSOLIDATED_FROM_MULTIPLE_CODES";
  if (cardinality === "MANY_TO_MANY") return "RELATED_OPERATIONAL_MATCH";
  if (mappingConfidence === "SPECIAL_CASE") return "RELATED_OPERATIONAL_MATCH";
  if (mappingConfidence === "EXPANDED") return "RELATED_OPERATIONAL_MATCH";
  return "DIRECT_EQUIVALENT";
}

function getCrosswalkReviewStatus(
  cardinality: CrosswalkCardinalityFilter,
  relationshipType: CrosswalkRelationshipType,
  mappingConfidence: CsiCrosswalkMappingConfidence | undefined,
): CrosswalkReviewStatus {
  if (cardinality === "NO_MATCH" || relationshipType === "NO_CLEAR_MATCH") return "UNMAPPED";
  if (mappingConfidence === "SPECIAL_CASE") return "AMBIGUOUS";
  if (cardinality === "ONE_TO_ONE" && mappingConfidence === "DIRECT") return "CLEAN";
  return "NEEDS_REVIEW";
}

function getPrimaryMappingConfidence(entries: CsiCrosswalkEntry[]): CsiCrosswalkMappingConfidence | undefined {
  if (!entries.length) return undefined;
  if (entries.some((entry) => entry.mappingConfidence === "SPECIAL_CASE")) return "SPECIAL_CASE";
  if (entries.some((entry) => entry.mappingConfidence === "INCOMPLETE")) return "INCOMPLETE";
  if (entries.some((entry) => entry.mappingConfidence === "EXPANDED")) return "EXPANDED";
  return "DIRECT";
}

function formatCrosswalkCardinality(value: CrosswalkCardinalityFilter): string {
  return crosswalkCardinalityOptions.find((option) => option.value === value)?.label ?? formatEnumLabel(value);
}

function formatCrosswalkRelationshipType(value: CrosswalkRelationshipType): string {
  return crosswalkRelationshipTypeOptions.find((option) => option.value === value)?.label ?? formatEnumLabel(value);
}

function formatCrosswalkReviewStatus(value: CrosswalkReviewStatus): string {
  return crosswalkReviewStatusOptions.find((option) => option.value === value)?.label ?? formatEnumLabel(value);
}

function getCrosswalkEntriesForSourceItem(
  sourceItem: CsiCatalogItem,
  direction: CrosswalkDirection,
): CsiCrosswalkEntry[] {
  const normalizedSourceNumber = normalizeCrosswalkSectionNumber(sourceItem.number);

  return csiCrosswalkEntries.filter((entry) => {
    const sourceSection = getSourceSection(entry, direction);
    return normalizeCrosswalkSectionNumber(sourceSection.sectionNumber ?? "") === normalizedSourceNumber;
  });
}

function getTargetItemsForCrosswalkEntries(
  entries: CsiCrosswalkEntry[],
  direction: CrosswalkDirection,
): CsiCatalogItem[] {
  const targetVersion = getCrosswalkTargetVersion(direction);
  const seenIds = new Set<string>();

  return entries.flatMap((entry) => {
    const targetSection = getTargetSection(entry, direction);
    if (!targetSection.sectionNumber) return [];

    const targetItem = resolveCsiCatalogItem(targetVersion, targetSection.sectionNumber);
    if (!targetItem || seenIds.has(targetItem.id)) return [];

    seenIds.add(targetItem.id);
    return [targetItem];
  });
}

function buildCrosswalkSourceRow(sourceItem: CsiCatalogItem, direction: CrosswalkDirection): CrosswalkSourceRow {
  const entries = getCrosswalkEntriesForSourceItem(sourceItem, direction);
  const targetItems = getTargetItemsForCrosswalkEntries(entries, direction);
  const cardinality = getCrosswalkCardinality(entries, direction);
  const primaryConfidence = getPrimaryMappingConfidence(entries);
  const relationshipType = getCrosswalkRelationshipType(cardinality, primaryConfidence);
  const reviewStatus = getCrosswalkReviewStatus(cardinality, relationshipType, primaryConfidence);
  const warnings: string[] = [];

  if (!targetItems.length) warnings.push("No linked target CSI item is available in the crosswalk data.");
  if (reviewStatus === "AMBIGUOUS") warnings.push("Crosswalk source data marks this relationship as a special case.");
  if (reviewStatus === "NEEDS_REVIEW") warnings.push("Relationship is derived from expanded or multi-code crosswalk data.");

  return {
    sourceItem,
    entries,
    targetItems,
    cardinality,
    relationshipType,
    reviewStatus,
    sourceBasis: entries.length
      ? "Sourced from CSI crosswalk data; relationship fields are derived for inspection."
      : "No crosswalk row found for this canonical source item.",
    warnings,
  };
}

function groupCrosswalkTargets(row: CrosswalkSourceRow): CrosswalkTargetGroup[] {
  if (!row.targetItems.length) {
    return [{ label: "No Clear Match", targetItems: [] }];
  }

  if (row.reviewStatus === "AMBIGUOUS" || row.reviewStatus === "NEEDS_REVIEW") {
    return [{ label: "Needs Review", targetItems: row.targetItems }];
  }

  if (row.cardinality === "ONE_TO_ONE") {
    return [{ label: "Direct / Primary", targetItems: row.targetItems }];
  }

  if (row.cardinality === "MANY_TO_ONE") {
    return [{ label: "Consolidated", targetItems: row.targetItems }];
  }

  return [{ label: "Split / Related", targetItems: row.targetItems }];
}

function normalizeCrosswalkSectionNumber(value: string): string {
  return value.replace(/\u00a0/g, " ").trim();
}

function isTopLevelTrade(trade: TradeTaxonomyNode): boolean {
  return !trade.parentId && trade.canBeBidPackage && trade.isActive;
}

function getSpecializations(tradeId: string): TradeTaxonomyNode[] {
  return taxonomy
    .filter((trade) => trade.parentId === tradeId && trade.isActive)
    .sort((left, right) => left.sortOrder - right.sortOrder || left.name.localeCompare(right.name));
}

function getFilteredTrades(query: string): TradeTaxonomyNode[] {
  const normalizedQuery = query.trim().toLowerCase();
  return taxonomy
    .filter(isTopLevelTrade)
    .filter((trade) => {
      if (!normalizedQuery) return true;
      return `${trade.name} ${trade.id} ${trade.aliases?.join(" ") ?? ""}`
        .toLowerCase()
        .includes(normalizedQuery);
    })
    .sort((left, right) => left.sortOrder - right.sortOrder || left.name.localeCompare(right.name));
}

function getRulesForTrade(
  tradeId: string,
  specializationId: string,
): CsiToTradeMappingRule[] {
  return mappingRules.filter((rule) => {
    if (rule.tradeId !== tradeId) return false;
    if (!specializationId) return true;
    return rule.specializationId === specializationId;
  });
}

function getRulesByTradeCount(): { tradeId: string; count: number }[] {
  return Array.from(
    mappingRules.reduce((counts, rule) => {
      counts.set(rule.tradeId, (counts.get(rule.tradeId) ?? 0) + 1);
      return counts;
    }, new Map<string, number>()),
  )
    .map(([tradeId, count]) => ({ tradeId, count }))
    .sort((left, right) => right.count - left.count || getTradeName(left.tradeId).localeCompare(getTradeName(right.tradeId)));
}

function getUnmappedTopLevelTrades(): TradeTaxonomyNode[] {
  const mappedTradeIds = new Set(mappingRules.map((rule) => rule.tradeId));
  return taxonomy.filter(isTopLevelTrade).filter((trade) => !mappedTradeIds.has(trade.id));
}

function getRuleCapabilityLabel(rule: CsiToTradeMappingRule, selectedVersion: CsiVersionId): string {
  if (rule.csiVersion === selectedVersion) return "Direct version rule";
  return `Crosswalk/fallback candidate from ${getVersionLabel(rule.csiVersion)}`;
}

function mapNormalizedReviewStatus(status: string): CrosswalkReviewStatus {
  if (status === "clean" || status === "corrected") return "CLEAN";
  if (status === "ambiguous") return "AMBIGUOUS";
  if (status === "unmapped" || status === "rejected") return "UNMAPPED";
  return "NEEDS_REVIEW";
}

function mapNormalizedRelationshipType(type: string): CrosswalkRelationshipType {
  if (type === "direct_equivalent") return "DIRECT_EQUIVALENT";
  if (type === "broader_than_target") return "BROADER_THAN_TARGET";
  if (type === "narrower_than_target") return "NARROWER_THAN_TARGET";
  if (type === "split_into_multiple_codes") return "SPLIT_INTO_MULTIPLE_CODES";
  if (type === "consolidated_from_multiple_codes") return "CONSOLIDATED_FROM_MULTIPLE_CODES";
  if (type === "related_operational_match") return "RELATED_OPERATIONAL_MATCH";
  return "NO_CLEAR_MATCH";
}

function buildCorrectedSidewalkSampleRow(): CrosswalkSourceRow | undefined {
  const sourceItem = resolveCsiCatalogItem("MASTERFORMAT_1995", correctedSidewalkCrosswalkRelationship.sourceCode);
  const targetItem = resolveCsiCatalogItem(
    "MASTERFORMAT_2004_PLUS",
    correctedSidewalkCrosswalkRelationship.resolvedTargetCode,
  );

  if (!sourceItem || !targetItem) return undefined;

  return {
    sourceItem,
    entries: [],
    targetItems: [targetItem],
    cardinality: "ONE_TO_ONE",
    relationshipType: mapNormalizedRelationshipType(correctedSidewalkCrosswalkRelationship.relationshipType),
    reviewStatus: mapNormalizedReviewStatus(correctedSidewalkCrosswalkRelationship.reviewStatus),
    sourceBasis:
      "Normalized fixture correction. Raw target is preserved separately from the resolved target.",
    warnings: correctedSidewalkCrosswalkRelationship.warnings ?? [],
    issueType: correctedSidewalkCrosswalkRelationship.issueType,
    relationshipRole: correctedSidewalkCrosswalkRelationship.relationshipRole,
    notes: correctedSidewalkCrosswalkRelationship.notes,
  };
}

function CrosswalkExplorer() {
  const [direction, setDirection] = useState<CrosswalkDirection>("1995_TO_2004_PLUS");
  const [searchQuery, setSearchQuery] = useState("");
  const [divisionFilter, setDivisionFilter] = useState("ALL");
  const [cardinalityFilter, setCardinalityFilter] = useState<CrosswalkCardinalityFilter>("ALL");
  const [relationshipTypeFilter, setRelationshipTypeFilter] =
    useState<CrosswalkRelationshipTypeFilter>("ALL");
  const [reviewStatusFilter, setReviewStatusFilter] = useState<CrosswalkReviewStatusFilter>("ALL");
  const [viewMode, setViewMode] = useState<"INSPECTOR" | "TABLE">("INSPECTOR");
  const [selectedSourceItemId, setSelectedSourceItemId] = useState("");
  const [selectedSampleId, setSelectedSampleId] = useState<"SIDEWALKS_02775" | "">("");
  const sourceVersion = getCrosswalkSourceVersion(direction);
  const targetVersion = getCrosswalkTargetVersion(direction);
  const divisionOptions = useMemo(() => getCsiDivisions(sourceVersion), [sourceVersion]);
  const sidewalkSampleRow = useMemo(() => buildCorrectedSidewalkSampleRow(), []);
  const sourceRows = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return getCsiCatalog(sourceVersion)
      .filter((item) => {
        if (divisionFilter !== "ALL" && item.divisionId !== divisionFilter) return false;
        if (!normalizedQuery) return true;
        return `${item.number} ${item.name}`.toLowerCase().includes(normalizedQuery);
      })
      .map((item) => buildCrosswalkSourceRow(item, direction))
      .filter((row) => {
        if (cardinalityFilter !== "ALL" && row.cardinality !== cardinalityFilter) return false;
        if (relationshipTypeFilter !== "ALL" && row.relationshipType !== relationshipTypeFilter) {
          return false;
        }
        if (reviewStatusFilter !== "ALL" && row.reviewStatus !== reviewStatusFilter) return false;
        return true;
      })
      .slice(0, 250);
  }, [cardinalityFilter, direction, divisionFilter, relationshipTypeFilter, reviewStatusFilter, searchQuery, sourceVersion]);
  const selectedRow =
    selectedSampleId === "SIDEWALKS_02775"
      ? sidewalkSampleRow
      : sourceRows.find((row) => row.sourceItem.id === selectedSourceItemId);
  const groupedSourceRows = useMemo(() => {
    return sourceRows.reduce((groups, row) => {
      const divisionLabel = getCsiDivisionPath(row.sourceItem);
      const rows = groups.get(divisionLabel) ?? [];
      groups.set(divisionLabel, [...rows, row]);
      return groups;
    }, new Map<string, CrosswalkSourceRow[]>());
  }, [sourceRows]);
  const targetGroups = selectedRow ? groupCrosswalkTargets(selectedRow) : [];
  const sourceAssignment = selectedRow
    ? assignCsiItemToTrade({
        csiItem: toMappingItem(selectedRow.sourceItem),
        projectCsiVersion: selectedRow.sourceItem.version,
      })
    : undefined;

  function handleDirectionChange(nextDirection: CrosswalkDirection) {
    setDirection(nextDirection);
    setDivisionFilter("ALL");
    setSelectedSourceItemId("");
    setSelectedSampleId("");
  }

  function loadSidewalkSample() {
    setDirection("1995_TO_2004_PLUS");
    setSearchQuery("");
    setDivisionFilter("ALL");
    setCardinalityFilter("ALL");
    setRelationshipTypeFilter("ALL");
    setReviewStatusFilter("ALL");
    setViewMode("INSPECTOR");
    setSelectedSourceItemId("");
    setSelectedSampleId("SIDEWALKS_02775");
  }

  return (
    <section className="app-panel">
      <div className="panel-header">
        <div>
          <p className="label-text">Crosswalk Explorer</p>
          <h2>MasterFormat Version Conversion</h2>
          <p className="muted-text">
            Inspect how canonical CSI items convert between MasterFormat 1995 / 16-Division
            and MasterFormat 2004+ / 50-Division. Relationship fields are derived from the
            source crosswalk where explicit metadata is not available.
          </p>
        </div>
        <div className="header-actions">
          <button type="button" className="button-secondary" onClick={loadSidewalkSample}>
            Load sidewalk crosswalk sample
          </button>
          <span className="taxonomy-meta-chip">{getCrosswalkDirectionLabel(direction)}</span>
        </div>
      </div>

      <div className="taxonomy-control-grid">
        <label className="field-stack">
          <span>Direction</span>
          <select
            value={direction}
            onChange={(event) => handleDirectionChange(event.target.value as CrosswalkDirection)}
          >
            <option value="1995_TO_2004_PLUS">1995 to 2004+</option>
            <option value="2004_PLUS_TO_1995">2004+ to 1995</option>
          </select>
        </label>
        <label className="field-stack">
          <span>Search CSI Code / Title</span>
          <input
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.target.value);
              setSelectedSourceItemId("");
              setSelectedSampleId("");
            }}
            placeholder="Search canonical source items"
          />
        </label>
        <label className="field-stack">
          <span>Division</span>
          <select
            value={divisionFilter}
            onChange={(event) => {
              setDivisionFilter(event.target.value);
              setSelectedSourceItemId("");
              setSelectedSampleId("");
            }}
          >
            <option value="ALL">All divisions</option>
            {divisionOptions.map((division) => (
              <option key={division.id} value={division.id}>
                Division {division.number} - {division.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field-stack">
          <span>Cardinality</span>
          <select
            value={cardinalityFilter}
            onChange={(event) => setCardinalityFilter(event.target.value as CrosswalkCardinalityFilter)}
          >
            {crosswalkCardinalityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field-stack">
          <span>Relationship Type</span>
          <select
            value={relationshipTypeFilter}
            onChange={(event) =>
              setRelationshipTypeFilter(event.target.value as CrosswalkRelationshipTypeFilter)
            }
          >
            {crosswalkRelationshipTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field-stack">
          <span>Review Status</span>
          <select
            value={reviewStatusFilter}
            onChange={(event) =>
              setReviewStatusFilter(event.target.value as CrosswalkReviewStatusFilter)
            }
          >
            {crosswalkReviewStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field-stack">
          <span>Mode</span>
          <select
            value={viewMode}
            onChange={(event) => setViewMode(event.target.value as "INSPECTOR" | "TABLE")}
          >
            <option value="INSPECTOR">Side-by-side inspector</option>
            <option value="TABLE">Crosswalk table</option>
          </select>
        </label>
      </div>

      <p className="muted-text" style={{ marginTop: 10 }}>
        {sourceRows.length} canonical source items shown from {getVersionLabel(sourceVersion)}.
        Search filters the source catalog only; clicking a result selects the canonical CSI item.
      </p>

      {viewMode === "TABLE" ? (
        <div className="table-shell" style={{ marginTop: 16 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Source Code</th>
                <th>Source Title</th>
                <th>Target Code(s)</th>
                <th>Cardinality</th>
                <th>Relationship Type</th>
                <th>Review Status</th>
              </tr>
            </thead>
            <tbody>
              {sourceRows.map((row) => (
                <tr
                  key={row.sourceItem.id}
                  onClick={() => {
                    setSelectedSourceItemId(row.sourceItem.id);
                    setSelectedSampleId("");
                    setViewMode("INSPECTOR");
                  }}
                  style={{ cursor: "pointer" }}
                >
                  <td>{row.sourceItem.number}</td>
                  <td>{row.sourceItem.name}</td>
                  <td>
                    {row.targetItems.length
                      ? row.targetItems.map((item) => item.number).join(", ")
                      : "No match"}
                  </td>
                  <td>{formatCrosswalkCardinality(row.cardinality)}</td>
                  <td>{formatCrosswalkRelationshipType(row.relationshipType)}</td>
                  <td>{formatCrosswalkReviewStatus(row.reviewStatus)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(280px, 0.9fr) minmax(320px, 1.1fr)",
            gap: 16,
            alignItems: "start",
            marginTop: 16,
          }}
        >
          <div className="project-csi-selected-group">
            <div className="cluster-between align-start gap-3">
              <div>
                <p className="label-text">Source Catalog</p>
                <h3>{getVersionShortLabel(sourceVersion)}</h3>
                <p className="muted-text">Canonical source CSI items grouped by division.</p>
              </div>
              <span className="taxonomy-meta-chip">{sourceRows.length} rows</span>
            </div>

            <div className="stack gap-3" style={{ marginTop: 14, maxHeight: 560, overflowY: "auto" }}>
              {Array.from(groupedSourceRows.entries()).length ? Array.from(groupedSourceRows.entries()).map(([divisionLabel, rows]) => (
                <div key={divisionLabel} className="stack gap-2">
                  <span className="label-text">{divisionLabel}</span>
                  {rows.slice(0, 30).map((row) => (
                    <button
                      key={row.sourceItem.id}
                      type="button"
                      className={
                        selectedRow?.sourceItem.id === row.sourceItem.id
                          && selectedSampleId === ""
                          ? "button-primary"
                          : "button-secondary"
                      }
                      onClick={() => {
                        setSelectedSourceItemId(row.sourceItem.id);
                        setSelectedSampleId("");
                      }}
                      style={{ justifyContent: "flex-start", textAlign: "left", width: "100%" }}
                    >
                      {formatCsiOption(row.sourceItem)}
                    </button>
                  ))}
                </div>
              )) : (
                <p className="muted-text">
                  No canonical CSI items match the current filters. Adjust filters or load a sample scenario.
                </p>
              )}
            </div>
          </div>

          <div className="stack gap-3">
            {selectedRow ? (
              <>
                <div className="project-csi-selected-group">
                  <div className="cluster-between align-start gap-3">
                    <div>
                      <p className="label-text">Mapped Target Codes</p>
                      <h3>{getVersionShortLabel(targetVersion)}</h3>
                      <p className="muted-text">
                        Target codes grouped by derived relationship bucket.
                      </p>
                    </div>
                    <span className="taxonomy-meta-chip">
                      {formatCrosswalkReviewStatus(selectedRow.reviewStatus)}
                    </span>
                  </div>

                  <div className="stack gap-3" style={{ marginTop: 14 }}>
                    {targetGroups.map((group) => (
                      <div key={group.label} className="stack gap-2">
                        <span className="label-text">{group.label}</span>
                        {group.targetItems.length ? (
                          group.targetItems.map((item) => (
                            <div key={item.id} className="cluster-between gap-3">
                              <span>
                                {item.number} - {item.name}
                              </span>
                              <span className="taxonomy-meta-chip">{getCsiDivisionPath(item)}</span>
                            </div>
                          ))
                        ) : (
                          <p className="form-error">No linked target code is available.</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="project-csi-selected-group">
                  <p className="label-text">Selected Source Details</p>
                  <h3>{formatCsiCatalogItem(selectedRow.sourceItem)}</h3>
                  <p className="muted-text">{getVersionLabel(selectedRow.sourceItem.version)}</p>

                  <div className="setup-summary-grid" style={{ marginTop: 14 }}>
                    <div>
                      <span className="label-text">Division</span>
                      <p className="muted-text">{getCsiDivisionPath(selectedRow.sourceItem)}</p>
                    </div>
                    <div>
                      <span className="label-text">Parent Path</span>
                      <p className="muted-text">{getCsiParentPath(selectedRow.sourceItem)}</p>
                    </div>
                    <div>
                      <span className="label-text">Cardinality</span>
                      <strong>{formatCrosswalkCardinality(selectedRow.cardinality)}</strong>
                    </div>
                    <div>
                      <span className="label-text">Relationship Type</span>
                      <strong>{formatCrosswalkRelationshipType(selectedRow.relationshipType)}</strong>
                    </div>
                    <div>
                      <span className="label-text">Review Status</span>
                      <strong>{formatCrosswalkReviewStatus(selectedRow.reviewStatus)}</strong>
                    </div>
                    <div>
                      <span className="label-text">Relationship Role</span>
                      <strong>{selectedRow.relationshipRole ? formatEnumLabel(selectedRow.relationshipRole) : "Derived"}</strong>
                    </div>
                    <div>
                      <span className="label-text">Issue Type</span>
                      <strong>{selectedRow.issueType ? formatEnumLabel(selectedRow.issueType) : "None"}</strong>
                    </div>
                    <div>
                      <span className="label-text">Source Basis</span>
                      <p className="muted-text">{selectedRow.sourceBasis}</p>
                    </div>
                  </div>

                  {selectedRow.notes ? (
                    <div className="stack gap-2" style={{ marginTop: 14 }}>
                      <span className="label-text">Notes</span>
                      <p className="muted-text">{selectedRow.notes}</p>
                    </div>
                  ) : null}

                  {sourceAssignment ? (
                    <div className="stack gap-2" style={{ marginTop: 14 }}>
                      <span className="label-text">Trade Impact Preview</span>
                      <p className="muted-text">
                        {getTradeName(sourceAssignment.tradeId)}
                        {sourceAssignment.specializationId
                          ? ` / ${getTradeName(sourceAssignment.specializationId)}`
                          : ""}{" "}
                        via {formatEnumLabel(sourceAssignment.source)}
                      </p>
                    </div>
                  ) : null}

                  {selectedRow.warnings.length ? (
                    <div className="stack gap-1" style={{ marginTop: 14 }}>
                      <span className="label-text">Notes / Warnings</span>
                      {selectedRow.warnings.map((warning) => (
                        <p key={warning} className="form-error">
                          {warning}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="muted-text" style={{ marginTop: 14 }}>
                      No review warning for this derived crosswalk row.
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div className="project-csi-selected-group">
                <p className="label-text">Empty State</p>
                <h3>Select a canonical CSI item</h3>
                <p className="muted-text">
                  Choose a canonical CSI code from the source catalog or load the sidewalk sample
                  scenario. Search text only filters options and is not treated as a selected CSI
                  identity.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function buildAssignmentPreviews(
  scenario: CsiTradeMappingFixtureScenario,
  projectCsiVersion: CsiVersionId,
): AssignmentPreview[] {
  return scenario.csiItems.map((inputItem) =>
    buildAssignmentPreview(inputItem, projectCsiVersion, `fixture-${scenario.id}`),
  );
}

function buildAssignmentPreview(
  inputItem: CsiTradeMappingItem,
  projectCsiVersion: CsiVersionId,
  subcontractorId = "workbench",
): AssignmentPreview {
  const dualCoverage = createSubcontractorDualCoverage({
    subcontractorId,
    sourceVersion: inputItem.version,
    sourceCsiItemId: inputItem.id,
    sourceCsiNumber: inputItem.number,
    sourceCsiTitle: inputItem.name,
    now: "2026-01-01T00:00:00.000Z",
  });
  const crosswalkEquivalent = dualCoverage.equivalentCsiItems.find(
    (equivalent) => equivalent.version === projectCsiVersion,
  );

  if (inputItem.version !== projectCsiVersion) {
    if (!crosswalkEquivalent) {
      return {
        inputItem,
        assignmentItem: inputItem,
        assignment: assignCsiItemToTrade({ csiItem: inputItem, projectCsiVersion }),
        warning: `No ${getVersionLabel(projectCsiVersion)} crosswalk equivalent was found for this CSI item.`,
      };
    }

    const assignmentItem = resolveEquivalentAsMappingItem(crosswalkEquivalent);
    return {
      inputItem,
      assignmentItem,
      crosswalkEquivalent,
      assignment: {
        ...assignCsiItemToTrade({ csiItem: assignmentItem, projectCsiVersion }),
        source: "CROSSWALK_RULE",
        crosswalkedFromCsiItemId: inputItem.id,
        crosswalkedFromVersion: inputItem.version,
        crosswalkedFromCsiNumber: inputItem.number,
        reason: `Input ${formatCsiItem(inputItem)} is ${getVersionLabel(
          inputItem.version,
        )}. Project version is ${getVersionLabel(
          projectCsiVersion,
        )}, so the workbench used crosswalk equivalent ${formatCsiItem(
          assignmentItem,
        )} before assigning the trade.`,
      },
    };
  }

  return {
    inputItem,
    assignmentItem: inputItem,
    assignment: assignCsiItemToTrade({ csiItem: inputItem, projectCsiVersion }),
  };
}

function MappingCoverageSummary() {
  const masterFormat2004PlusRuleCount = mappingRules.filter((rule) => rule.csiVersion === "MASTERFORMAT_2004_PLUS").length;
  const legacyRuleCount = mappingRules.filter((rule) => rule.csiVersion === "MASTERFORMAT_1995").length;
  const ambiguousRuleCount = mappingRules.filter(
    (rule) => rule.matchStrength === "POSSIBLE" || Boolean(rule.possibleTradeIds?.length),
  ).length;
  const catalogCoverage = useMemo(
    () =>
      csiVersions.map((version) => ({
        version,
        ...getCatalogCoverageSummary(version),
      })),
    [],
  );
  const totalCsiItems = catalogCoverage.reduce((total, summary) => total + summary.totalItems, 0);
  const unmappedCsiItems = catalogCoverage.reduce((total, summary) => total + summary.unmappedItems, 0);
  const rulesByTrade = getRulesByTradeCount();
  const unmappedTrades = getUnmappedTopLevelTrades();

  return (
    <section className="app-panel" id="mapping-coverage-summary">
      <div className="panel-header">
        <div>
          <p className="label-text">Mapping Coverage Summary</p>
          <h2>Rule Library Summary</h2>
          <p className="muted-text">
            This summary describes the partial CSI-to-trade mapping library currently loaded
            in code. It does not claim full MasterFormat coverage.
          </p>
          <p className="muted-text">
            Fixtures are test scenarios only. The mapping universe is the full CSI catalog,
            crosswalk, trade taxonomy, and mapping rule library.
          </p>
        </div>
      </div>

      <div className="setup-summary-grid">
        <div>
          <span className="label-text">Total Rules</span>
          <strong>{mappingRules.length}</strong>
        </div>
        <div>
          <span className="label-text">2004+ / 50-Division Rules</span>
          <strong>{masterFormat2004PlusRuleCount}</strong>
        </div>
        <div>
          <span className="label-text">1995 / 16-Division Rules</span>
          <strong>{legacyRuleCount}</strong>
        </div>
        <div>
          <span className="label-text">Ambiguous / Cross-Trade</span>
          <strong>{ambiguousRuleCount}</strong>
        </div>
        <div>
          <span className="label-text">Full CSI Catalog Items</span>
          <strong>{totalCsiItems}</strong>
        </div>
        <div>
          <span className="label-text">Unmapped CSI Items</span>
          <strong>{unmappedCsiItems}</strong>
        </div>
      </div>

      <div className="setup-summary-grid" style={{ marginTop: 16 }}>
        <div>
          <span className="label-text">Catalog Assignment Coverage</span>
          <div className="taxonomy-meta-list" style={{ marginTop: 8 }}>
            {catalogCoverage.map((summary) => (
              <span key={summary.version} className="taxonomy-meta-chip">
                {getVersionShortLabel(summary.version)}: {summary.mappedItems} mapped /{" "}
                {summary.unmappedItems} unmapped
              </span>
            ))}
          </div>
        </div>
        <div>
          <span className="label-text">Rules By Trade</span>
          <div className="taxonomy-meta-list" style={{ marginTop: 8 }}>
            {rulesByTrade.slice(0, 12).map((entry) => (
              <span key={entry.tradeId} className="taxonomy-meta-chip">
                {getTradeName(entry.tradeId)}: {entry.count}
              </span>
            ))}
          </div>
        </div>
        <div>
          <span className="label-text">Unmapped Trade Categories</span>
          <p className="muted-text" style={{ marginTop: 8 }}>
            {unmappedTrades.length} active top-level trade categories have zero direct rules.
          </p>
          <details style={{ marginTop: 8 }}>
            <summary className="button-secondary">Show unmapped trades</summary>
            <div className="taxonomy-meta-list" style={{ marginTop: 10 }}>
              {unmappedTrades.slice(0, 40).map((trade) => (
                <span key={trade.id} className="taxonomy-meta-chip">
                  {trade.name}
                </span>
              ))}
            </div>
          </details>
        </div>
      </div>
    </section>
  );
}

function RuleCard({
  rule,
  selectedVersion,
}: {
  rule: CsiToTradeMappingRule;
  selectedVersion: CsiVersionId;
}) {
  return (
    <div className="project-csi-selected-group">
      <div className="cluster-between align-start gap-3">
        <div>
          <h3>{rule.id}</h3>
          <p className="muted-text">
            {getTradeName(rule.tradeId)}
            {rule.specializationId ? ` / ${getTradeName(rule.specializationId)}` : ""}
          </p>
        </div>
        <div className="taxonomy-meta-list">
          <span className="taxonomy-meta-chip">{getVersionLabel(rule.csiVersion)}</span>
          <span className="taxonomy-meta-chip">{getRuleCapabilityLabel(rule, selectedVersion)}</span>
        </div>
      </div>

      <div className="setup-summary-grid" style={{ marginTop: 14 }}>
        <div>
          <span className="label-text">Exact CSI IDs</span>
          <p className="muted-text">{rule.exactCsiIds?.join(", ") || "None"}</p>
        </div>
        <div>
          <span className="label-text">Code Patterns</span>
          <p className="muted-text">{rule.csiCodePatterns?.join(", ") || "None"}</p>
        </div>
        <div>
          <span className="label-text">Title Keywords</span>
          <p className="muted-text">{rule.titleKeywords?.join(", ") || "None"}</p>
        </div>
        <div>
          <span className="label-text">Strength / Confidence</span>
          <p className="muted-text">
            {formatEnumLabel(rule.matchStrength)} / {rule.confidence ?? "Default"}
          </p>
        </div>
      </div>

      {rule.possibleTradeIds?.length ? (
        <div className="stack gap-2" style={{ marginTop: 14 }}>
          <span className="label-text">Possible Alternate Trades</span>
          <div className="taxonomy-meta-list">
            {rule.possibleTradeIds.map((tradeId) => (
              <span key={tradeId} className="taxonomy-meta-chip">
                {getTradeName(tradeId)}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {rule.notes ? <p className="muted-text" style={{ marginTop: 14 }}>{rule.notes}</p> : null}
    </div>
  );
}

function TradeRulesInspector() {
  const [tradeSearch, setTradeSearch] = useState("");
  const [selectedTradeId, setSelectedTradeId] = useState("");
  const [selectedSpecializationId, setSelectedSpecializationId] = useState("");
  const [selectedVersion, setSelectedVersion] = useState<CsiVersionId>("MASTERFORMAT_2004_PLUS");

  const tradeOptions = useMemo(() => getFilteredTrades(tradeSearch), [tradeSearch]);
  const specializationOptions = useMemo(() => getSpecializations(selectedTradeId), [selectedTradeId]);
  const selectedTrade = taxonomy.find((trade) => trade.id === selectedTradeId);
  const selectedSpecialization = taxonomy.find((trade) => trade.id === selectedSpecializationId);
  const matchingRules = useMemo(() => {
    const rules = getRulesForTrade(selectedTradeId, selectedSpecializationId);
    const directRules = rules.filter((rule) => rule.csiVersion === selectedVersion);
    const fallbackRules = rules.filter((rule) => rule.csiVersion === getAlternateVersion(selectedVersion));
    return [...directRules, ...fallbackRules];
  }, [selectedSpecializationId, selectedTradeId, selectedVersion]);

  return (
    <section className="app-panel" id="trade-mapping-browser">
      <div className="panel-header">
        <div>
          <p className="label-text">Trade Mapping Browser</p>
          <h2>Trade to CSI Rules</h2>
          <p className="muted-text">
            Select a trade and optional specialization to inspect the actual CSI mapping rules
            that target it. Direct rules match the selected CSI version; opposite-version rules
            can participate in crosswalk fallback.
          </p>
        </div>
        <span className="taxonomy-meta-chip">{matchingRules.length} rules</span>
      </div>

      <div className="taxonomy-control-grid">
        <label className="field-stack">
          <span>Search Trade</span>
          <input
            value={tradeSearch}
            onChange={(event) => setTradeSearch(event.target.value)}
            placeholder="Search trade category"
          />
        </label>
        <label className="field-stack">
          <span>Trade Category</span>
          <select
            value={selectedTradeId}
            onChange={(event) => {
              setSelectedTradeId(event.target.value);
              setSelectedSpecializationId("");
            }}
          >
            <option value="">Select a trade category...</option>
            {tradeOptions.map((trade) => (
              <option key={trade.id} value={trade.id}>
                {trade.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field-stack">
          <span>Specialization</span>
          <select
            value={selectedSpecializationId}
            onChange={(event) => setSelectedSpecializationId(event.target.value)}
          >
            <option value="">All specializations</option>
            {specializationOptions.map((trade) => (
              <option key={trade.id} value={trade.id}>
                {trade.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field-stack">
          <span>CSI Version</span>
          <select
            value={selectedVersion}
            onChange={(event) => setSelectedVersion(event.target.value as CsiVersionId)}
          >
            {csiVersionOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="stack gap-2" style={{ marginTop: 16 }}>
        <span className="label-text">Selected Trade</span>
        {selectedTrade ? (
          <p className="muted-text">
            {selectedTrade.name}
            {selectedSpecialization ? ` / ${selectedSpecialization.name}` : ""}
          </p>
        ) : (
          <p className="muted-text">
            Select a canonical trade category to inspect CSI rule coverage. Search only filters
            the trade options.
          </p>
        )}
      </div>

      <div className="stack gap-3" style={{ marginTop: 16 }}>
        {!selectedTradeId ? (
          <p className="muted-text">No trade category is selected.</p>
        ) : matchingRules.length ? (
          matchingRules.map((rule) => (
            <RuleCard key={rule.id} rule={rule} selectedVersion={selectedVersion} />
          ))
        ) : (
          <p className="muted-text">No CSI mapping rules have been defined for this trade yet.</p>
        )}
      </div>
    </section>
  );
}

function AssignmentCard({ preview }: { preview: AssignmentPreview }) {
  const { assignment, inputItem, assignmentItem, crosswalkEquivalent, warning } = preview;
  const isAmbiguous =
    assignment.source === "UNASSIGNED" ||
    assignment.confidence === "LOW" ||
    Boolean(assignment.possibleTradeIds?.length);

  return (
    <div className="project-csi-selected-group">
      <div className="cluster-between align-start gap-3">
        <div>
          <p className="label-text">Input CSI Item</p>
          <h3>{formatCsiItem(inputItem)}</h3>
          <p className="muted-text">{getVersionLabel(inputItem.version)}</p>
        </div>
        <span className="taxonomy-meta-chip">{formatEnumLabel(assignment.source)}</span>
      </div>

      {crosswalkEquivalent ? (
        <div className="setup-summary-grid" style={{ marginTop: 14 }}>
          <div>
            <span className="label-text">Crosswalk Source</span>
            <strong>{formatCsiItem(inputItem)}</strong>
            <p className="muted-text">{getVersionLabel(inputItem.version)}</p>
          </div>
          <div>
            <span className="label-text">Crosswalk Equivalent</span>
            <strong>{formatCsiItem(assignmentItem)}</strong>
            <p className="muted-text">{getVersionLabel(assignmentItem.version)}</p>
          </div>
        </div>
      ) : null}

      <div className="setup-summary-grid" style={{ marginTop: 14 }}>
        <div>
          <span className="label-text">Mapped Trade</span>
          <strong>{getTradeName(assignment.tradeId)}</strong>
        </div>
        <div>
          <span className="label-text">Mapped Specialization</span>
          <strong>{getTradeName(assignment.specializationId)}</strong>
        </div>
        <div>
          <span className="label-text">Source</span>
          <strong>
            {formatEnumLabel(assignment.source)}
            {sourceHelp.has(assignment.source) ? (
              <ContextHelp
                label={formatEnumLabel(assignment.source)}
                content={sourceHelp.get(assignment.source) ?? ""}
              />
            ) : null}
          </strong>
        </div>
        <div>
          <span className="label-text">Confidence</span>
          <strong>
            {assignment.confidence}
            <ContextHelp
              label={`${assignment.confidence} confidence`}
              content={confidenceHelp.get(assignment.confidence) ?? "Assignment confidence."}
            />
          </strong>
        </div>
      </div>

      {assignment.possibleTradeIds?.length ? (
        <div className="stack gap-2" style={{ marginTop: 14 }}>
          <span className="label-text">Possible Alternate Trades</span>
          <div className="taxonomy-meta-list">
            {assignment.possibleTradeIds.map((tradeId) => (
              <span key={tradeId} className="taxonomy-meta-chip">
                {getTradeName(tradeId)}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div className="stack gap-2" style={{ marginTop: 14 }}>
        <span className="label-text">Explanation</span>
        <p className="muted-text">{assignment.reason}</p>
        {isAmbiguous ? (
          <p className="form-error">Estimator review recommended before using this assignment.</p>
        ) : null}
        {warning ? <p className="form-error">{warning}</p> : null}
      </div>
    </div>
  );
}

function EquivalentCoverageList({
  selectedItem,
  equivalentItems,
}: {
  selectedItem: CsiCatalogItem;
  equivalentItems: EquivalentCsiCoverage[];
}) {
  return (
    <div className="project-csi-selected-group">
      <div className="cluster-between align-start gap-3">
        <div>
          <p className="label-text">Crosswalk Equivalent</p>
          <h3>{getVersionShortLabel(getAlternateVersion(selectedItem.version))}</h3>
          <p className="muted-text">
            Alternate MasterFormat coverage derived from the selected canonical CSI item.
          </p>
        </div>
        <span className="taxonomy-meta-chip">{equivalentItems.length} equivalents</span>
      </div>

      {equivalentItems.length ? (
        <div className="stack gap-2" style={{ marginTop: 14 }}>
          {equivalentItems.map((equivalent) => (
            <div
              key={`${equivalent.version}-${equivalent.csiItemId}`}
              className="cluster-between gap-3"
            >
              <span>
                {equivalent.csiNumber ?? equivalent.csiItemId} -{" "}
                {equivalent.csiTitle ?? "Untitled equivalent"}
              </span>
              <span className="taxonomy-meta-chip">
                {getVersionShortLabel(equivalent.version)} / {equivalent.confidence}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="form-error" style={{ marginTop: 14 }}>
          No clean crosswalk equivalent exists for this CSI item in the development dataset.
        </p>
      )}
    </div>
  );
}

function CsiAssignmentInspector() {
  const [selectedVersion, setSelectedVersion] = useState<CsiVersionId>("MASTERFORMAT_2004_PLUS");
  const [projectCsiVersion, setProjectCsiVersion] = useState<CsiVersionId>("MASTERFORMAT_2004_PLUS");
  const [searchQuery, setSearchQuery] = useState("");
  const searchResults = useMemo(
    () => searchCsiCatalog(selectedVersion, searchQuery).slice(0, 40),
    [searchQuery, selectedVersion],
  );
  const [selectedItemId, setSelectedItemId] = useState("");
  const selectedItem = searchResults.find((item) => item.id === selectedItemId);
  const preview = selectedItem
    ? buildAssignmentPreview(toMappingItem(selectedItem), projectCsiVersion, "csi-search")
    : undefined;
  const selectedItemDualCoverage = selectedItem
    ? createSubcontractorDualCoverage({
        subcontractorId: "catalog-browser",
        sourceVersion: selectedItem.version,
        sourceCsiItemId: selectedItem.id,
        sourceCsiNumber: selectedItem.number,
        sourceCsiTitle: selectedItem.name,
        now: "2026-01-01T00:00:00.000Z",
      })
    : undefined;

  return (
    <section className="app-panel" id="csi-catalog-browser">
      <div className="panel-header">
        <div>
          <p className="label-text">CSI Catalog Browser</p>
          <h2>CSI to Trade Assignment</h2>
          <p className="muted-text">
            Search the actual CSI catalog, select a section, and inspect the trade assignment
            returned by the mapping rules and crosswalk fallback behavior.
          </p>
        </div>
      </div>

      <div className="taxonomy-control-grid">
        <label className="field-stack">
          <span>Input CSI Version</span>
          <select
            value={selectedVersion}
            onChange={(event) => {
              setSelectedVersion(event.target.value as CsiVersionId);
              setSelectedItemId("");
            }}
          >
            {csiVersionOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field-stack">
          <span>Project CSI Version</span>
          <select
            value={projectCsiVersion}
            onChange={(event) => setProjectCsiVersion(event.target.value as CsiVersionId)}
          >
            {csiVersionOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field-stack">
          <span>Search CSI Catalog</span>
          <input
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.target.value);
              setSelectedItemId("");
            }}
            placeholder="Search by code or title"
          />
        </label>
        <label className="field-stack">
          <span>CSI Item</span>
          <select
            value={selectedItemId}
            onChange={(event) => setSelectedItemId(event.target.value)}
          >
            <option value="">Select a CSI item...</option>
            {searchResults.map((item) => (
              <option key={item.id} value={item.id}>
                {formatCsiOption(item)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="muted-text" style={{ marginTop: 10 }}>
        {searchResults.length} canonical CSI results shown. Search filters options only; the
        dropdown value must be a canonical CSI identity before assignment runs.
      </p>

      <div className="stack gap-3" style={{ marginTop: 16 }}>
        {preview && selectedItem ? (
          <>
            <div className="project-csi-selected-group">
              <div className="cluster-between align-start gap-3">
                <div>
                  <p className="label-text">Selected Canonical CSI Item</p>
                  <h3>{formatCsiCatalogItem(selectedItem)}</h3>
                  <p className="muted-text">{getVersionLabel(selectedItem.version)}</p>
                </div>
                <span className="taxonomy-meta-chip">Level {selectedItem.level}</span>
              </div>

              <div className="setup-summary-grid" style={{ marginTop: 14 }}>
                <div>
                  <span className="label-text">Division</span>
                  <p className="muted-text">{getCsiDivisionPath(selectedItem)}</p>
                </div>
                <div>
                  <span className="label-text">Parent Path</span>
                  <p className="muted-text">{getCsiParentPath(selectedItem)}</p>
                </div>
              </div>
            </div>

            <AssignmentCard preview={preview} />

            {selectedItemDualCoverage ? (
              <EquivalentCoverageList
                selectedItem={selectedItem}
                equivalentItems={selectedItemDualCoverage.equivalentCsiItems}
              />
            ) : null}
          </>
        ) : (
          <div className="project-csi-selected-group">
            <p className="label-text">Empty State</p>
            <h3>Choose a canonical CSI code</h3>
            <p className="muted-text">
              Select a canonical CSI item from the dropdown to inspect trade assignment. Search
              text is only a filter and cannot create a selected CSI record.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function DualCoveragePreview({ scenario }: { scenario: CsiTradeMappingFixtureScenario }) {
  return (
    <div className="stack gap-3">
      {scenario.csiItems.map((item) => {
        const dualCoverage = createSubcontractorDualCoverage({
          subcontractorId: `fixture-${scenario.id}`,
          sourceVersion: item.version,
          sourceCsiItemId: item.id,
          sourceCsiNumber: item.number,
          sourceCsiTitle: item.name,
          now: "2026-01-01T00:00:00.000Z",
        });

        return (
          <div key={item.id} className="project-csi-selected-group">
            <div className="cluster-between align-start gap-3">
              <div>
                <span className="label-text">Source Coverage Item</span>
                <h3>{formatCsiItem(item)}</h3>
                <p className="muted-text">{getVersionLabel(item.version)}</p>
              </div>
              <span className="taxonomy-meta-chip">{dualCoverage.confidence} confidence</span>
            </div>

            {dualCoverage.equivalentCsiItems.length ? (
              <div className="stack gap-2" style={{ marginTop: 14 }}>
                <span className="label-text">Equivalent Alternate-Version Coverage</span>
                {dualCoverage.equivalentCsiItems.map((equivalent) => (
                  <div
                    key={`${item.id}-${equivalent.version}-${equivalent.csiItemId}`}
                    className="cluster-between gap-3"
                  >
                    <span>
                      {equivalent.csiNumber ?? equivalent.csiItemId} -{" "}
                      {equivalent.csiTitle ?? "Untitled equivalent"}
                    </span>
                    <span className="taxonomy-meta-chip">{equivalent.confidence}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="form-error" style={{ marginTop: 14 }}>
                No reliable alternate-version crosswalk coverage was found for this fixture item.
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function FixtureTests() {
  const [selectedScenarioId, setSelectedScenarioId] = useState("");
  const selectedScenario = selectedScenarioId ? getScenarioById(selectedScenarioId) : undefined;
  const [projectCsiVersion, setProjectCsiVersion] = useState<CsiVersionId>("MASTERFORMAT_2004_PLUS");

  const assignmentPreviews = useMemo(
    () => (selectedScenario ? buildAssignmentPreviews(selectedScenario, projectCsiVersion) : []),
    [projectCsiVersion, selectedScenario],
  );

  function handleScenarioChange(scenarioId: string) {
    if (!scenarioId) {
      setSelectedScenarioId("");
      return;
    }

    const nextScenario = getScenarioById(scenarioId);
    if (!nextScenario) {
      setSelectedScenarioId("");
      return;
    }

    setSelectedScenarioId(nextScenario.id);
    setProjectCsiVersion(nextScenario.projectCsiVersion);
  }

  return (
    <section className="app-panel" id="fixture-tests">
      <div className="panel-header">
        <div>
          <p className="label-text">Fixture Tests</p>
          <h2>Known Mapping Scenarios</h2>
          <p className="muted-text">
            Fixture tests prove assignment behavior for direct version matches,
            crosswalk-derived matches, and ambiguous scope.
          </p>
        </div>
        <span className="taxonomy-meta-chip">{csiTradeMappingFixtureScenarios.length} scenarios</span>
      </div>

      <div className="taxonomy-control-grid">
        <label className="field-stack">
          <span>CSI Version</span>
          <select
            value={projectCsiVersion}
            onChange={(event) => setProjectCsiVersion(event.target.value as CsiVersionId)}
          >
            {csiVersionOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="field-stack">
          <span>Fixture Scenario</span>
          <select
            value={selectedScenarioId}
            onChange={(event) => handleScenarioChange(event.target.value)}
          >
            <option value="">Select a sample scenario...</option>
            {csiTradeMappingFixtureScenarios.map((scenario) => (
              <option key={scenario.id} value={scenario.id}>
                {scenario.title}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="stack gap-2" style={{ marginTop: 16 }}>
        <span className="label-text">Expected Behavior</span>
        <p className="muted-text">
          {selectedScenario
            ? selectedScenario.expectedBehavior
            : "Select a sample scenario to compare expected and actual mapping behavior."}
        </p>
      </div>

      {selectedScenario ? (
        <>
          <div className="setup-summary-grid" style={{ marginTop: 16 }}>
            <div>
              <span className="label-text">Project MasterFormat</span>
              <strong>{getVersionLabel(projectCsiVersion)}</strong>
            </div>
            <div>
              <span className="label-text">Subcontractor Coverage MasterFormat</span>
              <strong>{getVersionLabel(selectedScenario.subcontractorCoverageVersion)}</strong>
            </div>
            <div>
              <span className="label-text">Input CSI Items</span>
              <strong>{selectedScenario.csiItems.length}</strong>
            </div>
          </div>

          <div className="stack gap-3" style={{ marginTop: 16 }}>
            {assignmentPreviews.map((preview) => (
              <AssignmentCard
                key={`${preview.inputItem.id}-${preview.assignmentItem.id}`}
                preview={preview}
              />
            ))}
          </div>

          <div className="stack gap-3" style={{ marginTop: 16 }}>
            <span className="label-text">Subcontractor Dual Coverage Preview</span>
            <DualCoveragePreview scenario={selectedScenario} />
          </div>
        </>
      ) : (
        <div className="project-csi-selected-group" style={{ marginTop: 16 }}>
          <p className="label-text">Empty State</p>
          <h3>Select a sample scenario</h3>
          <p className="muted-text">
            Test scenarios are explicit samples only. Nothing is loaded until a scenario is
            selected.
          </p>
        </div>
      )}
    </section>
  );
}

export default function CsiTradeMappingWorkbenchPage() {
  const [activeTab, setActiveTab] = useState<WorkbenchTab>("crosswalk");

  return (
    <AppShell title="CSI Trade Mapping Workbench">
      <div className="dashboard-shell taxonomy-workbench">
        <div className="page-header">
          <div>
            <p className="label-text">Internal Dev Tool</p>
            <h1>CSI Trade Mapping Workbench</h1>
            <p className="page-subtitle">
              Inspect CSI crosswalks, trade mappings, assignment logic, and mapping coverage gaps.
            </p>
          </div>
          <div className="header-actions">
            <Link href="/dev/trade-taxonomy" className="button-secondary">
              Master Trade Library
            </Link>
            <Link href="/" className="button-secondary">
              Dashboard
            </Link>
          </div>
        </div>

        <section className="app-panel taxonomy-workbench-note">
          <p>
            This is a read-only developer/admin data inspection console. It uses the full CSI
            catalogs, crosswalk, trade taxonomy, and CSI-to-trade mapping rule library.
          </p>
          <p>
            System mapping rules are read-only here for now. Future versions should support
            controlled system rule drafts, company overrides, and project overrides.
          </p>
        </section>

        <nav className="taxonomy-meta-list" aria-label="CSI trade mapping workbench tabs">
          {workbenchTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={activeTab === tab.id ? "button-primary" : "button-secondary"}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {activeTab === "crosswalk" ? <CrosswalkExplorer /> : null}
        {activeTab === "csi-to-trade" ? <CsiAssignmentInspector /> : null}
        {activeTab === "trade-to-csi" ? <TradeRulesInspector /> : null}
        {activeTab === "coverage-gaps" ? <MappingCoverageSummary /> : null}
        {activeTab === "test-scenarios" ? <FixtureTests /> : null}

        <section className="app-panel">
          <div className="panel-header">
            <div>
              <p className="label-text">Reference Help</p>
              <h2>CSI Tag Roles</h2>
              <p className="muted-text">
                Bid package CSI roles are not edited here, but the mapping module uses these
                role concepts when project package tags are created later.
              </p>
            </div>
          </div>
          <div className="taxonomy-meta-list">
            {csiTagRoleHelp.map((item) => (
              <span key={item.role} className="taxonomy-meta-chip">
                {item.role}
                <ContextHelp label={item.role} content={item.content} />
              </span>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
