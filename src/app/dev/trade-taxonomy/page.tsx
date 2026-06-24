import Link from "next/link";

import AppShell from "@/components/layout/AppShell";
import ContextHelp from "@/components/ui/ContextHelp";
import {
  getContextTagOptionsForClassification,
  getProjectContextTagOptions,
  getProjectSectorOptions,
  getProjectWorkTypeOptions,
  getWorkTypeLabelForSector,
  getWorkTypeOptionsForSector,
} from "@/features/project-classification";
import TradeTaxonomyClassificationControls from "./TradeTaxonomyClassificationControls";
import {
  defaultCrossTradeMappings,
  defaultTradeCsiMappings,
  drywallFramingCsiFixture,
  flooringCsiFixture,
  generateTradePackageSuggestions,
  getCommonTrades,
  getDefaultTradeTaxonomy,
  getHiddenTrades,
  getRelatedTrades,
  getTriggeredTradesForProject,
  getVisibleTradeTaxonomyForProject,
  healthcareCsiFixture,
  industrialLabCsiFixture,
  mepCsiFixture,
  officeTenantImprovementCsiFixture,
  restaurantCsiFixture,
  type CrossTradeMapping,
  type ProjectContextTag,
  type ProjectSectorTag,
  type ProjectWorkTypeTag,
  type TradeCsiAssignment,
  type TradePackageGenerationResult,
  type TradePackageSuggestion,
  type TradeTaxonomyCsiItem,
  type TradeTaxonomyNode,
} from "@/features/trade-taxonomy";

type FixtureScenario = {
  id: string;
  title: string;
  description: string;
  csiItems: TradeTaxonomyCsiItem[];
  sectorTags?: ProjectSectorTag[];
  workTypeTags?: ProjectWorkTypeTag[];
  contextTags?: ProjectContextTag[];
};

type FixtureScenarioResult = FixtureScenario & {
  result: TradePackageGenerationResult;
};

type TradeTaxonomyWorkbenchPageProps = {
  searchParams?: Promise<{
    sector?: string;
    workType?: string;
    context?: string | string[];
    includeHidden?: string;
  }>;
};

const taxonomy = getDefaultTradeTaxonomy();
const sectorOptions = getProjectSectorOptions();
const workTypeOptions = getProjectWorkTypeOptions();
const contextTagOptions = getProjectContextTagOptions();

type WorkbenchFilterState = {
  sectorTags: ProjectSectorTag[];
  workTypeTags: ProjectWorkTypeTag[];
  contextTags: ProjectContextTag[];
  includeHidden: boolean;
};

const fixtureScenarios: FixtureScenario[] = [
  {
    id: "drywall-framing",
    title: "Drywall / Framing fixture",
    description:
      "Verifies that gypsum board, metal framing, and shaft wall CSI items roll into one trade package.",
    csiItems: drywallFramingCsiFixture,
  },
  {
    id: "flooring",
    title: "Flooring fixture",
    description:
      "Verifies the user-choice flooring group across carpet, resilient flooring, tile, and wood flooring.",
    csiItems: flooringCsiFixture,
  },
  {
    id: "mep",
    title: "MEP fixture",
    description:
      "Verifies plumbing, HVAC, electrical, and low-voltage package suggestions from mixed MEP CSI tags.",
    csiItems: mepCsiFixture,
  },
  {
    id: "healthcare",
    title: "Healthcare fixture",
    description:
      "Verifies classification-triggered healthcare systems and ambiguous medical gas, nurse call, and fire alarm scope.",
    csiItems: healthcareCsiFixture,
    sectorTags: ["healthcare"],
    workTypeTags: ["interior_fit_out_renovation"],
    contextTags: ["medical_office"],
  },
  {
    id: "restaurant",
    title: "Restaurant fixture",
    description:
      "Verifies food service equipment, commercial kitchen equipment, walk-ins, refrigeration, kitchen exhaust, grease interceptors, and hood suppression ambiguity.",
    csiItems: restaurantCsiFixture,
    sectorTags: ["restaurant"],
    workTypeTags: ["interior_fit_out_renovation"],
    contextTags: ["commercial_kitchen"],
  },
  {
    id: "office-ti",
    title: "Office TI fixture",
    description:
      "Verifies a typical office tenant improvement set without hidden specialty clutter.",
    csiItems: officeTenantImprovementCsiFixture,
    sectorTags: ["office"],
    workTypeTags: ["interior_fit_out_renovation"],
  },
  {
    id: "industrial-lab",
    title: "Industrial / Lab fixture",
    description:
      "Verifies process piping, lab gases, lab exhaust, and cleanroom sector-specific ambiguity.",
    csiItems: industrialLabCsiFixture,
    sectorTags: ["industrial", "laboratory", "cleanroom"],
    workTypeTags: ["interior_fit_out_renovation"],
    contextTags: ["lab", "cleanroom_context"],
  },
];

function sortTrades(a: TradeTaxonomyNode, b: TradeTaxonomyNode): number {
  return a.sortOrder - b.sortOrder || a.name.localeCompare(b.name);
}

function getSpecializations(parentId: string, tradeList: TradeTaxonomyNode[]): TradeTaxonomyNode[] {
  return tradeList.filter((trade) => trade.parentId === parentId).sort(sortTrades);
}

function getTradeName(tradeId: string): string {
  return taxonomy.find((trade) => trade.id === tradeId)?.name ?? tradeId;
}

function getTradeNames(tradeIds: string[]): string {
  return tradeIds.map(getTradeName).join(", ");
}

function formatMode(mode: TradeTaxonomyNode["defaultPackageMode"]): string {
  if (mode === "SPLIT_BY_CHILD") {
    return "Split By Specialization";
  }

  return mode
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function getConfidenceBadgeClass(confidence: TradePackageSuggestion["confidence"]): string {
  if (confidence === "HIGH") {
    return "taxonomy-confidence-strong";
  }

  if (confidence === "MEDIUM") {
    return "taxonomy-confidence-medium";
  }

  return "taxonomy-confidence-low";
}

function formatEnumLabel(value: string): string {
  return value
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function getModeHelp(mode: TradeTaxonomyNode["defaultPackageMode"]): string {
  if (mode === "UMBRELLA") {
    return "When selected CSI tags match one or more specializations under this trade, the generator creates one parent bid package instead of separate specialization packages. Example: Hollow Metal Doors, Wood Doors, and Door Hardware can roll into one Doors / Frames / Hardware package.";
  }

  if (mode === "SPLIT_BY_CHILD") {
    return "When selected CSI tags match specializations under this trade, the generator creates separate bid packages for those matching specializations by default. Example: Sitework may split into Earthwork, Utilities, Asphalt Paving, and Landscaping.";
  }

  return "When selected CSI tags match several specializations under this trade, the generator suggests one parent package first and marks it for estimator review. The estimator can keep one package or split it into separate packages. Example: Flooring may stay one package or split into Carpet, LVT, and Tile.";
}

function getStatusLabel(trade: TradeTaxonomyNode, depth: number): "Active" | "Hidden" | "Inactive" | undefined {
  if (!trade.isActive) return "Inactive";
  if (trade.defaultHidden) return "Hidden";
  if (depth === 0) return "Active";

  return undefined;
}

function getMatchSummaryLabel(matchStrength: string, confidence: string): string {
  return `${formatEnumLabel(matchStrength)} · ${formatEnumLabel(confidence)}`;
}

function formatSectorTag(sectorTag: ProjectSectorTag): string {
  return formatClassificationTag(sectorTag, sectorOptions);
}

function formatWorkTypeTag(workTypeTag: ProjectWorkTypeTag): string {
  return formatClassificationTag(workTypeTag, workTypeOptions);
}

function formatContextTag(contextTag: ProjectContextTag): string {
  return formatClassificationTag(contextTag, contextTagOptions);
}

function formatClassificationTag(
  value: string,
  options: readonly { id: string; label: string }[]
): string {
  return options.find((option) => option.id === value)?.label ?? formatEnumLabel(value);
}

function parseSingleTag<TTag extends string>(
  value: string | string[] | undefined,
  options: readonly { id: TTag }[]
): TTag | undefined {
  const firstValue = Array.isArray(value) ? value[0] : value;
  if (!firstValue) return undefined;

  const validIds = new Set(options.map((option) => option.id));

  return validIds.has(firstValue as TTag) ? (firstValue as TTag) : undefined;
}

function parseTagList<TTag extends string>(
  value: string | string[] | undefined,
  options: readonly { id: TTag }[]
): TTag[] {
  if (!value) return [];

  const validIds = new Set(options.map((option) => option.id));
  const selectedIds: TTag[] = [];
  const seenIds = new Set<TTag>();
  const rawValues = Array.isArray(value) ? value : value.split(",");

  rawValues
    .map((part) => part.trim())
    .filter(Boolean)
    .forEach((part) => {
      if (!validIds.has(part as TTag)) return;

      const selectedId = part as TTag;
      if (seenIds.has(selectedId)) return;

      seenIds.add(selectedId);
      selectedIds.push(selectedId);
    });

  return selectedIds;
}

function TradeMetadataBadges({ trade }: { trade: TradeTaxonomyNode }) {
  const metadataLabels: string[] = [];
  if (trade.isCommon) metadataLabels.push("Common");
  if (trade.specialtyTags?.includes("sector_specific")) metadataLabels.push("Sector-Specific");
  if (trade.specialtyTags?.includes("gc_cost")) metadataLabels.push("GC Cost");
  if (trade.specialtyTags?.includes("owner_vendor")) metadataLabels.push("Owner/Vendor");
  if (trade.specialtyTags?.includes("cross_trade")) metadataLabels.push("Cross-Trade");
  if (trade.canBeBidPackage) metadataLabels.push("Bid Package");

  if (!metadataLabels.length) return null;

  return (
    <div className="taxonomy-meta-list">
      {metadataLabels.map((label) => (
        <span key={label} className="taxonomy-meta-chip">
          {label}
        </span>
      ))}
    </div>
  );
}

function TradeNodeCard({
  trade,
  tradeList,
  depth = 0,
}: {
  trade: TradeTaxonomyNode;
  tradeList: TradeTaxonomyNode[];
  depth?: number;
}) {
  const specializations = getSpecializations(trade.id, tradeList);
  const relatedTrades = getRelatedTrades(trade.id);
  const statusLabel = getStatusLabel(trade, depth);

  return (
    <div
      className={`taxonomy-trade-row ${
        depth === 0 ? "taxonomy-trade-category-row" : "taxonomy-specialization-row"
      }`}
      style={{ marginLeft: depth > 0 ? Math.min(depth, 3) * 14 : 0 }}
    >
      <div className="cluster-between align-start gap-3">
        <div>
          <div className="taxonomy-trade-title-row">
            <strong className="taxonomy-trade-name">{trade.name}</strong>
            {statusLabel ? (
              <span className={`taxonomy-status-chip taxonomy-status-${statusLabel.toLowerCase()}`}>
                {statusLabel}
              </span>
            ) : null}
            <span className="taxonomy-mode-label">
              {formatMode(trade.defaultPackageMode)}
              <ContextHelp label={formatMode(trade.defaultPackageMode)} content={getModeHelp(trade.defaultPackageMode)} />
            </span>
          </div>
          <TradeMetadataBadges trade={trade} />
          {trade.description ? <p className="muted-text">{trade.description}</p> : null}
          {trade.aliases?.length ? (
            <p className="muted-text">
              <span className="label-text">Aliases</span> {trade.aliases.join(", ")}
            </p>
          ) : null}
          {trade.sectorTags?.length ? (
            <p className="muted-text">
              <span className="label-text">Sectors</span>{" "}
              {trade.sectorTags.map(formatSectorTag).join(", ")}
            </p>
          ) : null}
          {trade.workTypeTags?.length ? (
            <p className="muted-text">
              <span className="label-text">Work Types</span>{" "}
              {trade.workTypeTags.map(formatWorkTypeTag).join(", ")}
            </p>
          ) : null}
          {trade.contextTags?.length ? (
            <p className="muted-text">
              <span className="label-text">Context Tags</span>{" "}
              {trade.contextTags.map(formatContextTag).join(", ")}
            </p>
          ) : null}
          {relatedTrades.length ? (
            <p className="muted-text">
              <span className="label-text">Related trades</span>{" "}
              {relatedTrades.map((relatedTrade) => relatedTrade.name).join(", ")}
            </p>
          ) : null}
          {trade.splitRecommendation ? (
            <p className="muted-text">
              <span className="label-text">Split guidance</span> {trade.splitRecommendation}
            </p>
          ) : null}
          {trade.estimatingNotes ? (
            <p className="muted-text">
              <span className="label-text">Estimating notes</span> {trade.estimatingNotes}
            </p>
          ) : null}
        </div>
      </div>

      {specializations.length > 0 ? (
        <div className="stack gap-2" style={{ marginTop: 12 }}>
          {specializations.map((specialization) => (
            <TradeNodeCard
              key={specialization.id}
              trade={specialization}
              tradeList={tradeList}
              depth={depth + 1}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function CsiItemLabel({ item }: { item: TradeTaxonomyCsiItem }) {
  return (
    <span>
      <strong>{item.number}</strong> {item.name}
      <span className="muted-text"> ({item.id})</span>
    </span>
  );
}

function LegendItem({
  label,
  content,
  help,
  className,
}: {
  label: string;
  content: string;
  help?: string;
  className?: string;
}) {
  return (
    <div className="taxonomy-legend-item">
      <span className={className ?? "taxonomy-meta-chip"}>
        {label}
        {help ? <ContextHelp label={label} content={help} /> : null}
      </span>
      <p>{content}</p>
    </div>
  );
}

function WorkbenchLegend() {
  return (
    <section className="app-panel taxonomy-legend">
      <div className="panel-header">
        <div>
          <p className="label-text">Legend</p>
          <h2>How to Read Taxonomy Signals</h2>
          <p className="muted-text">
            Badges are limited to state and metadata. Detailed explanations are available from
            the help icons.
          </p>
        </div>
      </div>

      <div className="taxonomy-legend-grid">
        <div className="taxonomy-legend-group">
          <h3>Status</h3>
          <LegendItem
            label="Active"
            className="taxonomy-status-chip taxonomy-status-active"
            content="Available for package generation."
          />
          <LegendItem
            label="Hidden"
            className="taxonomy-status-chip taxonomy-status-hidden"
            content="Hidden unless sector, work type, context, or manual enablement makes it relevant later."
          />
          <LegendItem
            label="Inactive"
            className="taxonomy-status-chip taxonomy-status-inactive"
            content="Unavailable or retired."
          />
        </div>

        <div className="taxonomy-legend-group">
          <h3>Package Mode</h3>
          <LegendItem
            label="Umbrella"
            content="Selected CSI tags matching specializations under this trade create one parent bid package."
            help="When selected CSI tags match one or more specializations under this trade, the generator creates one parent bid package instead of separate specialization packages. Example: Hollow Metal Doors, Wood Doors, and Door Hardware can roll into one Doors / Frames / Hardware package."
          />
          <LegendItem
            label="Split"
            content="Selected CSI tags matching specializations create separate bid packages by default."
            help="When selected CSI tags match specializations under this trade, the generator creates separate bid packages for those matching specializations by default. Example: Sitework may split into Earthwork, Utilities, Asphalt Paving, and Landscaping."
          />
          <LegendItem
            label="User Choice"
            content="Generator suggests a parent package first and flags the split decision for estimator review."
            help="When selected CSI tags match several specializations under this trade, the generator suggests one parent package first and marks it for estimator review. The estimator can keep one package or split it into separate packages. Example: Flooring may stay one package or split into Carpet, LVT, and Tile."
          />
        </div>

        <div className="taxonomy-legend-group">
          <h3>Metadata</h3>
          <LegendItem label="Common" content="Shown for most projects." />
          <LegendItem
            label="GC Cost"
            content="Usually tracked in estimate review, not sent as a normal subcontractor ITB package."
            help="Usually tracked in the estimate review as a general condition or project cost, not sent as a normal subcontractor ITB package unless the estimator chooses to package it."
          />
          <LegendItem
            label="Owner/Vendor"
            content="May be furnished, installed, bid, allowed, or excluded based on project requirements."
            help="May be owner-furnished, owner-installed, contractor-installed, vendor-direct, allowance-based, or excluded from the GC bid depending on project requirements."
          />
          <LegendItem
            label="Sector-Specific"
            content="Hidden until project classification makes it relevant."
            help="Hidden by default unless project sector, work type, or context makes it relevant. Example: Medical Gas appears for healthcare projects; Food Service Equipment appears for restaurant or commercial kitchen projects."
          />
          <LegendItem
            label="Cross-Trade"
            content="One CSI tag may reasonably map to more than one trade package."
            help="The same CSI tag may reasonably belong to more than one trade package. The generator chooses a default, but the estimator should review the assignment. Example: Fire Alarm may belong under Electrical, Low Voltage, or Fire Protection depending on company practice."
          />
          <LegendItem
            label="Bid Package"
            content="Can become a project-specific package used through the ITB and review workflow."
            help="This trade can become a project-specific bid package used for ITBs, bid collection, leveling, and proposal review."
          />
        </div>

        <div className="taxonomy-legend-group">
          <h3>Match Confidence</h3>
          <LegendItem
            label="Primary · High"
            className="taxonomy-match-summary taxonomy-confidence-strong"
            content="The CSI tag strongly matches this trade and can usually be assigned automatically."
          />
          <LegendItem
            label="Secondary · Medium"
            className="taxonomy-match-summary taxonomy-confidence-medium"
            content="The CSI tag plausibly belongs here, but another trade may also be reasonable. Review before sending ITBs."
          />
          <LegendItem
            label="Possible · Low"
            className="taxonomy-match-summary taxonomy-confidence-low"
            content="The CSI tag is ambiguous or weakly matched. The estimator should manually confirm or remap it."
          />
        </div>
      </div>

      <p className="muted-text taxonomy-guidance-note">
        TODO: app-wide guidance settings can later control how much context help appears.
      </p>
    </section>
  );
}

type ProjectVisibilityLevel =
  | "core"
  | "suggested"
  | "contextual"
  | "hidden"
  | "excluded";

type ProjectVisibilityGroups = Record<ProjectVisibilityLevel, TradeTaxonomyNode[]>;

const officeInteriorCoreTradeIds = new Set([
  "demolition",
  "drywall-framing",
  "ceilings",
  "flooring",
  "wall-finishes",
  "doors-frames-hardware",
  "glass-glazing",
  "specialties",
  "fire-protection",
  "plumbing",
  "hvac",
  "electrical",
  "low-voltage-technology",
]);

const officeInteriorSuggestedTradeIds = new Set([
  "finish-carpentry-millwork",
  "furnishings-ffe",
]);

const officeInteriorExcludedTradeIds = new Set([
  "sitework",
  "concrete",
  "masonry",
  "structural-steel",
  "roofing",
  "overhead-doors",
  "food-service-systems",
  "healthcare-systems",
  "process-systems",
  "laboratory-cleanroom-systems",
]);

const residentialRenovationCoreTradeIds = new Set([
  "demolition",
  "rough-carpentry",
  "finish-carpentry-millwork",
  "doors-frames-hardware",
  "drywall-framing",
  "wall-finishes",
  "flooring",
  "plumbing",
  "hvac",
  "electrical",
  "equipment",
]);

const residentialRenovationSuggestedTradeIds = new Set([
  "insulation",
  "waterproofing",
  "specialties",
  "low-voltage-technology",
  "furnishings-ffe",
]);

const residentialRenovationExcludedTradeIds = new Set([
  "sitework",
  "concrete",
  "masonry",
  "structural-steel",
  "misc-metals",
  "roofing",
  "overhead-doors",
  "glass-glazing",
  "ceilings",
  "food-service-systems",
  "healthcare-systems",
  "process-systems",
  "laboratory-cleanroom-systems",
]);

const civilSiteworkCoreTradeIds = new Set(["sitework", "demolition"]);
const groundUpCoreTradeIds = new Set([
  "sitework",
  "concrete",
  "masonry",
  "structural-steel",
  "misc-metals",
  "roofing",
  "waterproofing",
  "insulation",
  "doors-frames-hardware",
  "glass-glazing",
  "drywall-framing",
  "ceilings",
  "flooring",
  "wall-finishes",
  "specialties",
  "fire-protection",
  "plumbing",
  "hvac",
  "electrical",
  "low-voltage-technology",
]);

function getProjectVisibilityGroups({
  taxonomy,
  selectedFilters,
}: {
  taxonomy: TradeTaxonomyNode[];
  selectedFilters: WorkbenchFilterState;
}): ProjectVisibilityGroups {
  const rootTrades = taxonomy.filter((trade) => !trade.parentId && trade.isActive).sort(sortTrades);
  const triggeredTradeIds = new Set(
    getTriggeredTradesForProject(taxonomy, selectedFilters).map((trade) => trade.id)
  );
  const groups: ProjectVisibilityGroups = {
    core: [],
    suggested: [],
    contextual: [],
    hidden: [],
    excluded: [],
  };

  rootTrades.forEach((trade) => {
    const level = getProjectVisibilityLevel(trade, selectedFilters, triggeredTradeIds);
    groups[level].push(trade);
  });

  return groups;
}

function getProjectVisibilityLevel(
  trade: TradeTaxonomyNode,
  selectedFilters: WorkbenchFilterState,
  triggeredTradeIds: ReadonlySet<string>
): ProjectVisibilityLevel {
  if (isContextualTrade(trade, selectedFilters, triggeredTradeIds)) return "contextual";

  if (isOfficeInteriorFitOut(selectedFilters)) {
    if (officeInteriorCoreTradeIds.has(trade.id)) return "core";
    if (officeInteriorSuggestedTradeIds.has(trade.id)) return "suggested";
    if (officeInteriorExcludedTradeIds.has(trade.id)) return "excluded";
  }

  if (isResidentialRenovation(selectedFilters)) {
    if (residentialRenovationCoreTradeIds.has(trade.id)) return "core";
    if (residentialRenovationSuggestedTradeIds.has(trade.id)) return "suggested";
    if (residentialRenovationExcludedTradeIds.has(trade.id)) return "excluded";
  }

  if (selectedFilters.workTypeTags.includes("sitework_civil_only")) {
    if (civilSiteworkCoreTradeIds.has(trade.id)) return "core";
    if (trade.id !== "sitework" && trade.id !== "demolition") return "excluded";
  }

  if (selectedFilters.workTypeTags.includes("ground_up_new_construction")) {
    if (groundUpCoreTradeIds.has(trade.id)) return "core";
  }

  if (trade.defaultHidden) return "hidden";
  if (trade.isCommon) return "core";

  return "suggested";
}

function isOfficeInteriorFitOut(selectedFilters: WorkbenchFilterState): boolean {
  return (
    selectedFilters.sectorTags.includes("office") &&
    selectedFilters.workTypeTags.includes("interior_fit_out_renovation")
  );
}

function isResidentialRenovation(selectedFilters: WorkbenchFilterState): boolean {
  return (
    (selectedFilters.sectorTags.includes("residential") ||
      selectedFilters.sectorTags.includes("multifamily")) &&
    selectedFilters.workTypeTags.includes("interior_fit_out_renovation")
  );
}

function isContextualTrade(
  trade: TradeTaxonomyNode,
  selectedFilters: WorkbenchFilterState,
  triggeredTradeIds: ReadonlySet<string>
): boolean {
  if (triggeredTradeIds.has(trade.id)) return true;
  if (selectedFilters.contextTags.includes("sitework_scope") && trade.id === "sitework") return true;
  if (selectedFilters.contextTags.includes("roof_work") && trade.id === "roofing") return true;
  if (
    selectedFilters.contextTags.includes("exterior_envelope_scope") &&
    ["roofing", "waterproofing", "glass-glazing"].includes(trade.id)
  ) {
    return true;
  }
  if (selectedFilters.contextTags.includes("commercial_kitchen") && trade.id === "equipment") {
    return true;
  }
  if (
    (selectedFilters.contextTags.includes("medical_gas_required") ||
      selectedFilters.contextTags.includes("nurse_call_required") ||
      selectedFilters.contextTags.includes("infection_control")) &&
    trade.id === "healthcare-systems"
  ) {
    return true;
  }

  return false;
}

function TradeVisibilityGroup({
  title,
  description,
  trades,
}: {
  title: string;
  description: string;
  trades: TradeTaxonomyNode[];
}) {
  return (
    <div className="taxonomy-visibility-group">
      <div className="cluster-between align-start gap-3">
        <div>
          <h3>{title}</h3>
          <p className="muted-text">{description}</p>
        </div>
        <span className="taxonomy-meta-chip">{trades.length}</span>
      </div>
      {trades.length ? (
        <div className="taxonomy-visibility-list">
          {trades.map((trade) => (
            <div key={trade.id} className="taxonomy-visibility-card">
              <strong>{trade.name}</strong>
              <span className="muted-text">{trade.id}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="muted-text">No trades in this group.</p>
      )}
    </div>
  );
}

function SuggestedPackageCard({
  suggestion,
  fixtureItems,
  result,
}: {
  suggestion: TradePackageSuggestion;
  fixtureItems: TradeTaxonomyCsiItem[];
  result: TradePackageGenerationResult;
}) {
  const assignedItems = suggestion.csiItemIds
    .map((itemId) => fixtureItems.find((item) => item.id === itemId))
    .filter((item): item is TradeTaxonomyCsiItem => Boolean(item));
  const matchSummaryLabels = Array.from(
    new Set(
      suggestion.csiItemIds
        .map((itemId) => result.assignments.find((assignment) => assignment.csiItemId === itemId))
        .filter((assignment): assignment is TradeCsiAssignment => Boolean(assignment))
        .map((assignment) => getMatchSummaryLabel(assignment.matchStrength, assignment.confidence))
    )
  );
  const lowConfidenceItems = assignedItems.filter((item) => {
    const assignment = result.assignments.find(
      (candidate) => candidate.csiItemId === item.id,
    );

    return assignment?.confidence === "LOW";
  });

  return (
    <div className="taxonomy-suggestion-card">
      <div className="cluster-between align-start gap-3">
        <div>
          <div className="taxonomy-trade-title-row">
            <strong>{suggestion.name}</strong>
            <span className="taxonomy-mode-label">
              {formatMode(suggestion.packageMode)}
              <ContextHelp
                label={formatMode(suggestion.packageMode)}
                content={getModeHelp(suggestion.packageMode)}
              />
            </span>
            {matchSummaryLabels.length ? (
              <span className={`taxonomy-match-summary ${getConfidenceBadgeClass(suggestion.confidence)}`}>
                {matchSummaryLabels.join(", ")}
              </span>
            ) : null}
          </div>
          <p className="muted-text">
            Trade: {getTradeName(suggestion.tradeId)}
            {suggestion.parentTradeId
              ? ` / Trade category: ${getTradeName(suggestion.parentTradeId)}`
              : ""}
          </p>
        </div>
        <span className="taxonomy-meta-chip">{suggestion.csiItemIds.length} CSI tags</span>
      </div>

      {suggestion.childTradeIds?.length ? (
        <div className="taxonomy-specialization-list">
          <span className="label-text">Specializations</span>
          <ul>
            {suggestion.childTradeIds.map((childTradeId) => (
              <li key={childTradeId}>{getTradeName(childTradeId)}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="taxonomy-mapped-items">
        <span className="label-text">Assigned CSI items</span>
        {assignedItems.length ? (
          assignedItems.map((item) => {
            const assignment = result.assignments.find(
              (candidate) => candidate.csiItemId === item.id,
            );

            return (
              <div key={item.id} className="taxonomy-mapped-item">
                <div className="cluster-between gap-3">
                  <CsiItemLabel item={item} />
                  {assignment ? (
                    <span
                      className={`taxonomy-match-summary ${getConfidenceBadgeClass(assignment.confidence)}`}
                      title={assignment.reason}
                    >
                      {getMatchSummaryLabel(assignment.matchStrength, assignment.confidence)}
                    </span>
                  ) : null}
                </div>
                {assignment?.isAmbiguous && assignment.possibleTradeIds?.length ? (
                  <p className="muted-text">
                    <span className="label-text">Ambiguous</span> Possible trades:{" "}
                    {getTradeNames(assignment.possibleTradeIds)}
                    {assignment.sectorPreferredTradeId
                      ? ` / Sector preference: ${getTradeName(assignment.sectorPreferredTradeId)}`
                      : ""}
                    {assignment.classificationPreferredTradeId
                      ? ` / Classification preference: ${getTradeName(assignment.classificationPreferredTradeId)}`
                      : ""}
                  </p>
                ) : null}
                {assignment?.classificationNote ? (
                  <p className="muted-text">{assignment.classificationNote}</p>
                ) : null}
              </div>
            );
          })
        ) : (
          <p className="muted-text">No CSI items assigned to this suggestion.</p>
        )}
      </div>

      {lowConfidenceItems.length ? (
        <div className="taxonomy-warning-block">
          <span className="label-text">Low-Confidence Items</span>
          <ul className="taxonomy-warning-list">
            {lowConfidenceItems.map((item) => (
              <li key={item.id}>
                {item.number} {item.name}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {suggestion.warnings.length ? (
        <div className="taxonomy-warning-block">
          <span className="label-text">Important Warnings</span>
          <ul className="taxonomy-warning-list">
            {suggestion.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {suggestion.informationalNotes.length ? (
        <div className="taxonomy-specialization-list">
          <span className="label-text">Informational Notes</span>
          <ul>
            {suggestion.informationalNotes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function FixtureInspection({ scenario }: { scenario: FixtureScenarioResult }) {
  const unassignedItems = scenario.result.unassignedCsiItemIds
    .map((itemId) => scenario.csiItems.find((item) => item.id === itemId))
    .filter((item): item is TradeTaxonomyCsiItem => Boolean(item));

  return (
    <section className="app-panel" id={scenario.id}>
      <div className="panel-header">
        <div>
          <p className="label-text">Fixture Inspection</p>
          <h2>{scenario.title}</h2>
          <p className="muted-text">{scenario.description}</p>
          {scenario.sectorTags?.length ? (
            <p className="muted-text">
              <span className="label-text">Sector context</span>{" "}
              {scenario.sectorTags.map(formatSectorTag).join(", ")}
            </p>
          ) : null}
          {scenario.workTypeTags?.length ? (
            <p className="muted-text">
              <span className="label-text">Work type context</span>{" "}
              {scenario.workTypeTags.map(formatWorkTypeTag).join(", ")}
            </p>
          ) : null}
          {scenario.contextTags?.length ? (
            <p className="muted-text">
              <span className="label-text">Context tags</span>{" "}
              {scenario.contextTags.map(formatContextTag).join(", ")}
            </p>
          ) : null}
        </div>
        <span className="taxonomy-meta-chip">
          {scenario.result.suggestions.length} suggestions
        </span>
      </div>

      <div className="table-shell" style={{ marginTop: 16 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>CSI Code</th>
              <th>Title</th>
              <th>ID</th>
            </tr>
          </thead>
          <tbody>
            {scenario.csiItems.map((item) => (
              <tr key={item.id}>
                <td>{item.number}</td>
                <td>{item.name}</td>
                <td>{item.id}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="stack gap-3" style={{ marginTop: 18 }}>
        <h3>Suggested Trade Packages</h3>
        {scenario.result.suggestions.length ? (
          scenario.result.suggestions.map((suggestion) => (
            <SuggestedPackageCard
              key={suggestion.tradeId}
              suggestion={suggestion}
              fixtureItems={scenario.csiItems}
              result={scenario.result}
            />
          ))
        ) : (
          <p className="muted-text">No trade packages suggested.</p>
        )}
      </div>

      <div className="stack gap-2" style={{ marginTop: 18 }}>
        <h3>Unassigned Items</h3>
        {unassignedItems.length ? (
          unassignedItems.map((item) => (
            <div key={item.id} className="project-csi-selected-group">
              <CsiItemLabel item={item} />
            </div>
          ))
        ) : (
          <p className="muted-text">No unassigned CSI items.</p>
        )}
      </div>

      {scenario.result.warnings.length ? (
        <div className="taxonomy-warning-block">
          <h3>Important Generation Warnings</h3>
          <ul className="taxonomy-warning-list">
            {scenario.result.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {scenario.result.informationalNotes.length ? (
        <div className="taxonomy-specialization-list">
          <h3>Generation Notes</h3>
          <ul>
            {scenario.result.informationalNotes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

function CrossTradeMappingSection({ mappings }: { mappings: CrossTradeMapping[] }) {
  return (
    <section className="app-panel">
      <div className="panel-header">
        <div>
          <p className="label-text">Cross-Trade Mapping Diagnostics</p>
          <h2>Ambiguous Scope Rules</h2>
          <p className="muted-text">
            These rules keep one conservative primary suggestion while showing possible
            alternate trades and sector preference.
          </p>
        </div>
        <span className="taxonomy-meta-chip">{mappings.length} mappings</span>
      </div>

      <div className="stack gap-3" style={{ marginTop: 16 }}>
        {mappings.map((mapping) => (
          <div key={mapping.id} className="project-csi-selected-group">
            <div className="cluster-between align-start gap-3">
              <div>
                <div className="taxonomy-trade-title-row">
                  <strong>{mapping.label}</strong>
                  <span className="taxonomy-meta-chip">
                    Primary: {getTradeName(mapping.primaryTradeId)}
                  </span>
                </div>
                <p className="muted-text">
                  <span className="label-text">Possible trades</span>{" "}
                  {getTradeNames(mapping.possibleTradeIds)}
                </p>
                {mapping.notes ? <p className="muted-text">{mapping.notes}</p> : null}
              </div>
              <span className="taxonomy-meta-chip">{mapping.id}</span>
            </div>

            {mapping.sectorPreferredTradeIds ? (
              <div className="taxonomy-meta-list" style={{ marginTop: 10 }}>
                <span className="label-text">Sector preferences</span>
                {Object.entries(mapping.sectorPreferredTradeIds).map(([sectorTag, tradeId]) => (
                  <span key={`${mapping.id}-${sectorTag}`} className="taxonomy-meta-chip">
                    {formatSectorTag(sectorTag as ProjectSectorTag)}: {getTradeName(tradeId)}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}

export default async function TradeTaxonomyWorkbenchPage({
  searchParams,
}: TradeTaxonomyWorkbenchPageProps) {
  const resolvedSearchParams = await searchParams;
  const selectedSector = parseSingleTag<ProjectSectorTag>(
    resolvedSearchParams?.sector,
    sectorOptions
  );
  const workTypeOptionsForSector = getWorkTypeOptionsForSector(selectedSector);
  const selectedWorkType = parseSingleTag<ProjectWorkTypeTag>(
    resolvedSearchParams?.workType,
    workTypeOptionsForSector
  );
  const availableContextOptions = getContextTagOptionsForClassification({
    sector: selectedSector,
    workType: selectedWorkType,
  });
  const selectedContextTags = parseTagList<ProjectContextTag>(
    resolvedSearchParams?.context,
    availableContextOptions
  );
  const selectedFilters: WorkbenchFilterState = {
    sectorTags: selectedSector ? [selectedSector] : [],
    workTypeTags: selectedWorkType ? [selectedWorkType] : [],
    contextTags: selectedContextTags,
    includeHidden: resolvedSearchParams?.includeHidden === "true",
  };
  const masterPreviewTaxonomy = getVisibleTradeTaxonomyForProject({
    taxonomy,
    ...selectedFilters,
  });
  const projectVisibilityGroups = getProjectVisibilityGroups({ taxonomy, selectedFilters });
  const triggeredTrades = getTriggeredTradesForProject(taxonomy, selectedFilters);
  const masterRootTrades = masterPreviewTaxonomy.filter((trade) => !trade.parentId).sort(sortTrades);
  const commonTrades = getCommonTrades(taxonomy);
  const hiddenTrades = getHiddenTrades(taxonomy);
  const scenarioResults = fixtureScenarios.map<FixtureScenarioResult>((scenario) => ({
    ...scenario,
    result: generateTradePackageSuggestions({
      csiItems: scenario.csiItems,
      taxonomy,
      rules: defaultTradeCsiMappings,
      crossTradeMappings: defaultCrossTradeMappings,
      sectorTags: scenario.sectorTags ?? [],
      workTypeTags: scenario.workTypeTags ?? [],
      contextTags: scenario.contextTags ?? [],
      csiVersion: "MASTERFORMAT_CURRENT",
    }),
  }));
  const activeFilterLabel = [
    ...selectedFilters.sectorTags.map(formatSectorTag),
    ...selectedFilters.workTypeTags.map((workType) =>
      getWorkTypeLabelForSector(workType, selectedSector)
    ),
    ...selectedFilters.contextTags.map(formatContextTag),
    selectedFilters.includeHidden ? "Include Hidden" : undefined,
  ].filter((label): label is string => Boolean(label));

  return (
    <AppShell title="Master Trade Library Workbench">
      <div className="dashboard-shell taxonomy-workbench">
        <div className="page-header">
          <div>
            <p className="label-text">Internal Dev Tool</p>
            <h1>Master Trade Library Workbench</h1>
            <p className="page-subtitle">
              Inspect the full company trade taxonomy, specializations, CSI mapping behavior,
              cross-trade rules, and hidden/sector-specific trade metadata.
            </p>
          </div>
          <div className="header-actions">
            <Link href="/dev/project-profile" className="button-primary">
              Open Project Profile Workbench
            </Link>
            <Link href="/" className="button-secondary">
              Dashboard
            </Link>
          </div>
        </div>

        <section className="app-panel taxonomy-workbench-note">
          <p>
            This page is for taxonomy debugging and master trade library review. It is not
            the project setup workflow. Use Project Profile Workbench to preview
            project-specific trade visibility, setup requirements, and pricing metrics.
          </p>
        </section>

        <WorkbenchLegend />

        <section className="app-panel">
          <div className="panel-header">
            <div>
              <p className="label-text">Diagnostic Filters</p>
              <h2>Taxonomy Visibility Filter</h2>
              <p className="muted-text">
                These filters are for taxonomy inspection only. They approximate how
                sector, work type, context tags, and hidden-trade settings affect master
                library visibility, but they are not the final Project Setup flow.
              </p>
            </div>
            <div className="taxonomy-meta-list">
              <span className="taxonomy-meta-chip">{sectorOptions.length} sectors</span>
              <span className="taxonomy-meta-chip">{workTypeOptions.length} work types</span>
              <span className="taxonomy-meta-chip">
                {availableContextOptions.length} available context tags
              </span>
            </div>
          </div>

          <TradeTaxonomyClassificationControls
            selectedSector={selectedSector}
            selectedWorkType={selectedWorkType}
            selectedContextTags={selectedContextTags}
            includeHidden={selectedFilters.includeHidden}
          />

          {activeFilterLabel.length ? (
            <div className="stack gap-2" style={{ marginTop: 16 }}>
              <span className="label-text">Active Diagnostic Filters</span>
              <div className="taxonomy-meta-list">
                {activeFilterLabel.map((label) => (
                  <span key={label} className="taxonomy-meta-chip">
                    {label}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </section>

        <section className="app-panel">
          <div className="panel-header">
            <div>
              <p className="label-text">Diagnostic Visibility Preview</p>
              <h2>Taxonomy Visibility by Filter</h2>
              <p className="muted-text">
                Active means a trade exists in the master library. Core, Suggested,
                Contextual, Hidden, and Excluded here are diagnostic relevance buckets for
                the selected filters. Use Project Profile Workbench for the primary
                project-specific setup/profile preview.
              </p>
            </div>
          </div>

          <div className="taxonomy-visibility-grid">
            <TradeVisibilityGroup
              title="Core Trades"
              description="Expected trade categories for the selected classification."
              trades={projectVisibilityGroups.core}
            />
            <TradeVisibilityGroup
              title="Suggested Trades"
              description="Often relevant but should be reviewed before project use."
              trades={projectVisibilityGroups.suggested}
            />
            <TradeVisibilityGroup
              title="Contextual Trades"
              description="Shown because sector, work type, or selected context tags make them relevant."
              trades={projectVisibilityGroups.contextual}
            />
            <TradeVisibilityGroup
              title="Hidden but Available"
              description="Available in the master library, but not normally shown for this classification."
              trades={projectVisibilityGroups.hidden}
            />
            <TradeVisibilityGroup
              title="Excluded / Not Normally Relevant"
              description="Not normally relevant to this classification unless the estimator manually enables it later."
              trades={projectVisibilityGroups.excluded}
            />
          </div>
        </section>

        <details className="app-panel taxonomy-master-library">
          <summary>
            <span>
              <span className="label-text">Master Trade Library</span>
              <strong>Full Trade Hierarchy</strong>
              <span className="muted-text">
                Full active library preview. This is not the selected project trade list.
              </span>
            </span>
            <span className="taxonomy-meta-list">
              <span className="taxonomy-meta-chip">{masterPreviewTaxonomy.length} shown</span>
              <span className="taxonomy-meta-chip">{commonTrades.length} common</span>
              <span className="taxonomy-status-chip taxonomy-status-hidden">
                {hiddenTrades.length} hidden
              </span>
              <span className="taxonomy-meta-chip">{triggeredTrades.length} triggered</span>
            </span>
          </summary>

          <div className="stack gap-3" style={{ marginTop: 16 }}>
            {masterRootTrades.map((trade) => (
              <TradeNodeCard key={trade.id} trade={trade} tradeList={masterPreviewTaxonomy} />
            ))}
          </div>
        </details>

        <CrossTradeMappingSection mappings={defaultCrossTradeMappings} />

        <section className="app-panel taxonomy-fixture-guide">
          <div className="panel-header">
            <div>
              <p className="label-text">Fixture Inspection Guide</p>
              <h2>How to Read Generated Results</h2>
              <p className="muted-text">
                Fixture data shows how sample selected scope tags move through CSI mapping
                and taxonomy generation diagnostics.
              </p>
            </div>
          </div>

          <ul className="taxonomy-instruction-list">
            <li>Input CSI items are sample selected project scope tags.</li>
            <li>The generator compares those CSI tags to trade mapping rules.</li>
            <li>Suggested packages show what bid packages would be created.</li>
            <li>Assignments show why each CSI tag landed in a trade.</li>
            <li>Confidence shows how safe the automatic assignment is.</li>
            <li>Warnings identify items that should be reviewed before project use.</li>
          </ul>
          <p className="muted-text">
            No edits are saved from this workbench.
          </p>
        </section>

        <div className="stack gap-4">
          {scenarioResults.map((scenario) => (
            <FixtureInspection key={scenario.id} scenario={scenario} />
          ))}
        </div>
      </div>
    </AppShell>
  );
}
