import Link from "next/link";

import AppShell from "@/components/layout/AppShell";
import {
  defaultTradeCsiMappings,
  drywallFramingCsiFixture,
  flooringCsiFixture,
  generateTradePackageSuggestions,
  getDefaultTradeTaxonomy,
  mepCsiFixture,
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
};

type FixtureScenarioResult = FixtureScenario & {
  result: TradePackageGenerationResult;
};

const taxonomy = getDefaultTradeTaxonomy();

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
];

function sortTrades(a: TradeTaxonomyNode, b: TradeTaxonomyNode): number {
  return a.sortOrder - b.sortOrder || a.name.localeCompare(b.name);
}

function getChildTrades(parentId: string): TradeTaxonomyNode[] {
  return taxonomy.filter((trade) => trade.parentId === parentId).sort(sortTrades);
}

function getTradeName(tradeId: string): string {
  return taxonomy.find((trade) => trade.id === tradeId)?.name ?? tradeId;
}

function formatMode(mode: TradeTaxonomyNode["defaultPackageMode"]): string {
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

function TradeNodeCard({ trade, depth = 0 }: { trade: TradeTaxonomyNode; depth?: number }) {
  const children = getChildTrades(trade.id);

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
          {trade.description ? <p className="muted-text">{trade.description}</p> : null}
          {trade.aliases?.length ? (
            <p className="muted-text">
              <span className="label-text">Aliases</span> {trade.aliases.join(", ")}
            </p>
          ) : null}
        </div>
        <span className="badge badge-muted">#{trade.sortOrder}</span>
      </div>

      {children.length > 0 ? (
        <div className="stack gap-2" style={{ marginTop: 12 }}>
          {children.map((child) => (
            <TradeNodeCard key={child.id} trade={child} depth={depth + 1} />
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
              (candidate) =>
                candidate.csiItemId === item.id && candidate.tradeId === suggestion.tradeId,
            );

            return (
              <div key={item.id} className="cluster-between gap-3">
                <CsiItemLabel item={item} />
                {assignment ? (
                  <span className="badge badge-muted" title={assignment.reason}>
                    {assignment.matchStrength} / {assignment.confidence}
                  </span>
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

export default function TradeTaxonomyWorkbenchPage() {
  const rootTrades = taxonomy.filter((trade) => !trade.parentId).sort(sortTrades);
  const scenarioResults = fixtureScenarios.map<FixtureScenarioResult>((scenario) => ({
    ...scenario,
    result: generateTradePackageSuggestions({
      csiItems: scenario.csiItems,
      taxonomy,
      rules: defaultTradeCsiMappings,
      csiVersion: "MASTERFORMAT_CURRENT",
    }),
  }));

  return (
    <AppShell title="Trade Taxonomy Workbench">
      <div className="dashboard-shell">
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
            <span className="badge badge-primary">{taxonomy.length} trades</span>
          </div>

          <div className="stack gap-3" style={{ marginTop: 16 }}>
            {rootTrades.map((trade) => (
              <TradeNodeCard key={trade.id} trade={trade} />
            ))}
          </div>
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
