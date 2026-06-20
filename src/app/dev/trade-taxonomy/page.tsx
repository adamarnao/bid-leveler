import Link from "next/link";

import AppShell from "@/components/layout/AppShell";
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
  getSectorTriggeredTrades,
  getVisibleTradeTaxonomyForProject,
  getVisibleTradesForSector,
  healthcareCsiFixture,
  industrialLabCsiFixture,
  mepCsiFixture,
  officeTenantImprovementCsiFixture,
  restaurantCsiFixture,
  type CrossTradeMapping,
  type ProjectSectorTag,
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
};

type FixtureScenarioResult = FixtureScenario & {
  result: TradePackageGenerationResult;
};

type TradeTaxonomyWorkbenchPageProps = {
  searchParams?: Promise<{
    sector?: string;
  }>;
};

const taxonomy = getDefaultTradeTaxonomy();

const sectorOptions: ProjectSectorTag[] = [
  "commercial",
  "healthcare",
  "hospitality",
  "restaurant",
  "education",
  "industrial",
  "laboratory",
  "cleanroom",
  "sitework",
  "retail",
  "office",
  "warehouse",
  "transportation",
  "airport",
  "marine",
  "mission_critical",
  "government",
  "detention",
  "renewable_energy",
  "sports",
  "agricultural",
];

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
      "Verifies sector-triggered healthcare systems and ambiguous medical gas, nurse call, and fire alarm scope.",
    csiItems: healthcareCsiFixture,
    sectorTags: ["healthcare"],
  },
  {
    id: "restaurant",
    title: "Restaurant fixture",
    description:
      "Verifies kitchen hood, food service equipment, grease interceptor, and hood suppression ambiguity.",
    csiItems: restaurantCsiFixture,
    sectorTags: ["restaurant"],
  },
  {
    id: "office-ti",
    title: "Office TI fixture",
    description:
      "Verifies a typical office tenant improvement set without hidden specialty clutter.",
    csiItems: officeTenantImprovementCsiFixture,
    sectorTags: ["office"],
  },
  {
    id: "industrial-lab",
    title: "Industrial / Lab fixture",
    description:
      "Verifies process piping, lab gases, lab exhaust, and cleanroom sector-specific ambiguity.",
    csiItems: industrialLabCsiFixture,
    sectorTags: ["industrial", "laboratory", "cleanroom"],
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
    return "badge-success";
  }

  if (confidence === "MEDIUM") {
    return "badge-warning";
  }

  return "badge-muted";
}

function formatSectorTag(sectorTag: ProjectSectorTag): string {
  return sectorTag
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function isProjectSectorTag(value: string | undefined): value is ProjectSectorTag {
  return Boolean(value && sectorOptions.includes(value as ProjectSectorTag));
}

function TradeMetadataBadges({ trade }: { trade: TradeTaxonomyNode }) {
  return (
    <div className="cluster gap-2">
      {trade.isCommon ? <span className="badge badge-success">Common</span> : null}
      {trade.defaultHidden ? <span className="badge badge-warning">Hidden</span> : null}
      {trade.specialtyTags?.includes("sector_specific") ? (
        <span className="badge badge-muted">Sector-Specific</span>
      ) : null}
      {trade.specialtyTags?.includes("gc_cost") ? (
        <span className="badge badge-muted">GC Cost</span>
      ) : null}
      {trade.specialtyTags?.includes("owner_vendor") ? (
        <span className="badge badge-muted">Owner/Vendor</span>
      ) : null}
      {trade.specialtyTags?.includes("cross_trade") ? (
        <span className="badge badge-muted">Cross-Trade</span>
      ) : null}
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

  return (
    <div
      className="project-csi-selected-group"
      style={{ marginLeft: depth > 0 ? 16 : 0 }}
    >
      <div className="cluster-between align-start gap-3">
        <div>
          <div className="cluster gap-2">
            <strong>{trade.name}</strong>
            <span className="badge badge-muted">{formatMode(trade.defaultPackageMode)}</span>
            <span className={trade.isActive ? "badge badge-success" : "badge badge-muted"}>
              {trade.isActive ? "Active" : "Inactive"}
            </span>
            {trade.canBeBidPackage ? (
              <span className="badge badge-primary">Bid Package</span>
            ) : (
              <span className="badge badge-muted">Grouping</span>
            )}
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
        <span className="badge badge-muted">#{trade.sortOrder}</span>
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

  return (
    <div className="project-csi-selected-group">
      <div className="cluster-between align-start gap-3">
        <div>
          <div className="cluster gap-2">
            <strong>{suggestion.name}</strong>
            <span className="badge badge-muted">{formatMode(suggestion.packageMode)}</span>
            <span className={`badge ${getConfidenceBadgeClass(suggestion.confidence)}`}>
              {suggestion.confidence}
            </span>
          </div>
          <p className="muted-text">
            Trade: {getTradeName(suggestion.tradeId)}
            {suggestion.parentTradeId
              ? ` / Trade category: ${getTradeName(suggestion.parentTradeId)}`
              : ""}
          </p>
        </div>
        <span className="badge badge-primary">{suggestion.csiItemIds.length} CSI tags</span>
      </div>

      {suggestion.childTradeIds?.length ? (
        <div className="cluster gap-2" style={{ marginTop: 10 }}>
          <span className="label-text">Specializations</span>
          {suggestion.childTradeIds.map((childTradeId) => (
            <span key={childTradeId} className="badge badge-muted">
              {getTradeName(childTradeId)}
            </span>
          ))}
        </div>
      ) : null}

      <div className="stack gap-2" style={{ marginTop: 12 }}>
        <span className="label-text">Assigned CSI items</span>
        {assignedItems.length ? (
          assignedItems.map((item) => {
            const assignment = result.assignments.find(
              (candidate) => candidate.csiItemId === item.id,
            );

            return (
              <div key={item.id} className="stack gap-2">
                <div className="cluster-between gap-3">
                  <CsiItemLabel item={item} />
                  {assignment ? (
                    <span className="badge badge-muted" title={assignment.reason}>
                      {assignment.matchStrength} / {assignment.confidence}
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
                  </p>
                ) : null}
              </div>
            );
          })
        ) : (
          <p className="muted-text">No CSI items assigned to this suggestion.</p>
        )}
      </div>

      {suggestion.warnings.length ? (
        <div className="stack gap-2" style={{ marginTop: 12 }}>
          <span className="label-text">Warnings</span>
          {suggestion.warnings.map((warning) => (
            <span key={warning} className="badge badge-warning">
              {warning}
            </span>
          ))}
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
        </div>
        <span className="badge badge-primary">
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
        <div className="stack gap-2" style={{ marginTop: 18 }}>
          <h3>Generation Warnings</h3>
          {scenario.result.warnings.map((warning) => (
            <span key={warning} className="badge badge-warning">
              {warning}
            </span>
          ))}
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
          <p className="label-text">Cross-Trade Mapping</p>
          <h2>Ambiguous Scope Rules</h2>
          <p className="muted-text">
            These rules keep one conservative primary suggestion while showing possible
            alternate trades and sector preference.
          </p>
        </div>
        <span className="badge badge-warning">{mappings.length} mappings</span>
      </div>

      <div className="stack gap-3" style={{ marginTop: 16 }}>
        {mappings.map((mapping) => (
          <div key={mapping.id} className="project-csi-selected-group">
            <div className="cluster-between align-start gap-3">
              <div>
                <div className="cluster gap-2">
                  <strong>{mapping.label}</strong>
                  <span className="badge badge-primary">
                    Primary: {getTradeName(mapping.primaryTradeId)}
                  </span>
                </div>
                <p className="muted-text">
                  <span className="label-text">Possible trades</span>{" "}
                  {getTradeNames(mapping.possibleTradeIds)}
                </p>
                {mapping.notes ? <p className="muted-text">{mapping.notes}</p> : null}
              </div>
              <span className="badge badge-muted">{mapping.id}</span>
            </div>

            {mapping.sectorPreferredTradeIds ? (
              <div className="cluster gap-2" style={{ marginTop: 10 }}>
                <span className="label-text">Sector preferences</span>
                {Object.entries(mapping.sectorPreferredTradeIds).map(([sectorTag, tradeId]) => (
                  <span key={`${mapping.id}-${sectorTag}`} className="badge badge-muted">
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
  const selectedSector = isProjectSectorTag(resolvedSearchParams?.sector)
    ? resolvedSearchParams.sector
    : undefined;
  const visibleTaxonomy = getVisibleTradeTaxonomyForProject({
    taxonomy,
    sectorTags: selectedSector ? [selectedSector] : [],
  });
  const legacyVisibleTaxonomy = getVisibleTradesForSector(
    taxonomy,
    selectedSector ? [selectedSector] : []
  );
  const sectorTriggeredTrades = getSectorTriggeredTrades(
    taxonomy,
    selectedSector ? [selectedSector] : []
  );
  const rootTrades = visibleTaxonomy.filter((trade) => !trade.parentId).sort(sortTrades);
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
      csiVersion: "MASTERFORMAT_CURRENT",
    }),
  }));

  return (
    <AppShell title="Trade Taxonomy Workbench">
      <div className="dashboard-shell taxonomy-workbench">
        <div className="page-header">
          <div>
            <p className="label-text">Internal Dev Tool</p>
            <p className="page-subtitle">
              Internal inspection page for company trade taxonomy and CSI-to-trade package
              suggestions.
            </p>
          </div>
          <Link href="/" className="button-secondary">
            Dashboard
          </Link>
        </div>

        <section className="app-panel taxonomy-workbench-note">
          <p>
            This is a read-only workbench for inspecting the company trade taxonomy,
            sector visibility rules, cross-trade mappings, and CSI-to-trade package
            suggestions. Editing will be handled later in Trade Taxonomy Settings.
          </p>
        </section>

        <section className="app-panel">
          <div className="panel-header">
            <div>
              <p className="label-text">Default Taxonomy</p>
              <h2>Trade Hierarchy</h2>
              <p className="muted-text">
                Trade categories and specializations are shown with package mode, active
                status, and bid package eligibility.
              </p>
            </div>
            <div className="cluster gap-2">
              <span className="badge badge-primary">{visibleTaxonomy.length} visible</span>
              <span className="badge badge-success">{commonTrades.length} common</span>
              <span className="badge badge-warning">{hiddenTrades.length} hidden</span>
              <span className="badge badge-muted">
                {sectorTriggeredTrades.length} sector-triggered
              </span>
            </div>
          </div>

          <div className="taxonomy-filter-section">
            <span className="label-text">Sector visibility filters</span>
            <div className="taxonomy-filter-list" aria-label="Sector visibility filters">
              <Link
                href="/dev/trade-taxonomy"
                className={`taxonomy-filter-button ${
                  selectedSector ? "button-secondary" : "button-primary"
                }`}
              >
                Default
              </Link>
              {sectorOptions.map((sectorTag) => (
                <Link
                  key={sectorTag}
                  href={`/dev/trade-taxonomy?sector=${sectorTag}`}
                  className={`taxonomy-filter-button ${
                    selectedSector === sectorTag ? "button-primary" : "button-secondary"
                  }`}
                >
                  {formatSectorTag(sectorTag)}
                </Link>
              ))}
            </div>
            <p className="muted-text">
              Hidden specialty trades appear when their sector trigger matches the selected
              filter. Legacy and new visibility helpers agree on{" "}
              {legacyVisibleTaxonomy.length} visible records for this filter.
            </p>
          </div>

          {sectorTriggeredTrades.length ? (
            <div className="stack gap-2" style={{ marginTop: 16 }}>
              <span className="label-text">Sector-triggered hidden trades</span>
              <div className="cluster gap-2">
                {sectorTriggeredTrades.map((trade) => (
                  <span key={trade.id} className="badge badge-warning">
                    {trade.name}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          <div className="stack gap-3" style={{ marginTop: 16 }}>
            {rootTrades.map((trade) => (
              <TradeNodeCard key={trade.id} trade={trade} tradeList={visibleTaxonomy} />
            ))}
          </div>
        </section>

        <CrossTradeMappingSection mappings={defaultCrossTradeMappings} />

        <section className="app-panel taxonomy-fixture-guide">
          <div className="panel-header">
            <div>
              <p className="label-text">Fixture Inspection Guide</p>
              <h2>How to Read Generated Results</h2>
              <p className="muted-text">
                Fixture data shows how sample CSI tags move through the taxonomy generator.
              </p>
            </div>
          </div>

          <ul className="taxonomy-instruction-list">
            <li>Input CSI items are sample scope tags.</li>
            <li>Suggested packages are the trade packages the system would create.</li>
            <li>Assignments show which trade each CSI item mapped to.</li>
            <li>Confidence indicates how strong the mapping is.</li>
            <li>
              Warnings identify ambiguous or cross-trade items that may need estimator review.
            </li>
            <li>Unassigned items need manual mapping or taxonomy rule improvement.</li>
          </ul>
          <p className="muted-text">
            No edits are saved from this page. Use this screen to validate taxonomy behavior
            before integrating it into Project Scope.
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
