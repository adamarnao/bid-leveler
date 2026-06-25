"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import AppShell from "@/components/layout/AppShell";
import ContextHelp from "@/components/ui/ContextHelp";
import { resolveCsiCatalogItem, searchCsiCatalog } from "@/lib/csiCatalog";
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
import {
  getDefaultTradeTaxonomy,
  type TradeTaxonomyNode,
} from "@/features/trade-taxonomy";
import {
  formatCsiMasterFormatVersion,
  formatCsiMasterFormatVersionShort,
  type CsiCatalogItem,
} from "@/types/Csi";

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

const taxonomy = getDefaultTradeTaxonomy();
const mappingRules = getCsiTradeMappingRules();

function getScenarioById(scenarioId: string): CsiTradeMappingFixtureScenario {
  return (
    csiTradeMappingFixtureScenarios.find((scenario) => scenario.id === scenarioId) ??
    csiTradeMappingFixtureScenarios[0]
  );
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
      </div>

      <div className="setup-summary-grid" style={{ marginTop: 16 }}>
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
  const [selectedTradeId, setSelectedTradeId] = useState("drywall-framing");
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
        <p className="muted-text">
          {selectedTrade?.name ?? selectedTradeId}
          {selectedSpecialization ? ` / ${selectedSpecialization.name}` : ""}
        </p>
      </div>

      <div className="stack gap-3" style={{ marginTop: 16 }}>
        {matchingRules.length ? (
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

function CsiAssignmentInspector() {
  const [selectedVersion, setSelectedVersion] = useState<CsiVersionId>("MASTERFORMAT_2004_PLUS");
  const [projectCsiVersion, setProjectCsiVersion] = useState<CsiVersionId>("MASTERFORMAT_2004_PLUS");
  const [searchQuery, setSearchQuery] = useState("gypsum board");
  const searchResults = useMemo(
    () => searchCsiCatalog(selectedVersion, searchQuery).slice(0, 40),
    [searchQuery, selectedVersion],
  );
  const [selectedItemId, setSelectedItemId] = useState("");
  const selectedItem =
    searchResults.find((item) => item.id === selectedItemId) ??
    searchResults[0] ??
    undefined;
  const preview = selectedItem
    ? buildAssignmentPreview(toMappingItem(selectedItem), projectCsiVersion, "csi-search")
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
            value={selectedItem?.id ?? ""}
            onChange={(event) => setSelectedItemId(event.target.value)}
          >
            {searchResults.map((item) => (
              <option key={item.id} value={item.id}>
                {item.number} - {item.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="stack gap-3" style={{ marginTop: 16 }}>
        {preview ? (
          <AssignmentCard preview={preview} />
        ) : (
          <p className="muted-text">No CSI catalog item is selected.</p>
        )}
      </div>
    </section>
  );
}

function CrosswalkReview() {
  const [sourceVersion, setSourceVersion] = useState<CsiVersionId>("MASTERFORMAT_2004_PLUS");
  const [searchQuery, setSearchQuery] = useState("gypsum board");
  const searchResults = useMemo(
    () => searchCsiCatalog(sourceVersion, searchQuery).slice(0, 40),
    [searchQuery, sourceVersion],
  );
  const [selectedItemId, setSelectedItemId] = useState("");
  const selectedItem =
    searchResults.find((item) => item.id === selectedItemId) ??
    searchResults[0] ??
    undefined;
  const dualCoverage = selectedItem
    ? createSubcontractorDualCoverage({
        subcontractorId: "crosswalk-review",
        sourceVersion: selectedItem.version,
        sourceCsiItemId: selectedItem.id,
        sourceCsiNumber: selectedItem.number,
        sourceCsiTitle: selectedItem.name,
        now: "2026-01-01T00:00:00.000Z",
      })
    : undefined;

  return (
    <section className="app-panel" id="crosswalk-review">
      <div className="panel-header">
        <div>
          <p className="label-text">Crosswalk Review</p>
          <h2>Version Equivalent Coverage</h2>
          <p className="muted-text">
            Select a canonical CSI item and inspect the equivalent item in the other
            MasterFormat version. This is read-only crosswalk diagnostics.
          </p>
        </div>
      </div>

      <div className="taxonomy-control-grid">
        <label className="field-stack">
          <span>Source CSI Version</span>
          <select
            value={sourceVersion}
            onChange={(event) => {
              setSourceVersion(event.target.value as CsiVersionId);
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
            value={selectedItem?.id ?? ""}
            onChange={(event) => setSelectedItemId(event.target.value)}
          >
            {searchResults.map((item) => (
              <option key={item.id} value={item.id}>
                {item.number} - {item.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {selectedItem && dualCoverage ? (
        <div className="project-csi-selected-group" style={{ marginTop: 16 }}>
          <div className="cluster-between align-start gap-3">
            <div>
              <span className="label-text">Source Coverage Item</span>
              <h3>{selectedItem.number} - {selectedItem.name}</h3>
              <p className="muted-text">{getVersionLabel(selectedItem.version)}</p>
            </div>
            <span className="taxonomy-meta-chip">
              Target: {getVersionShortLabel(getAlternateVersion(selectedItem.version))}
            </span>
          </div>

          {dualCoverage.equivalentCsiItems.length ? (
            <div className="stack gap-2" style={{ marginTop: 14 }}>
              <span className="label-text">Equivalent Item</span>
              {dualCoverage.equivalentCsiItems.map((equivalent) => (
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
      ) : (
        <p className="muted-text" style={{ marginTop: 16 }}>
          No CSI catalog item is selected.
        </p>
      )}
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
  const [selectedScenarioId, setSelectedScenarioId] = useState(
    csiTradeMappingFixtureScenarios[0]?.id ?? "",
  );
  const selectedScenario = getScenarioById(selectedScenarioId);
  const [projectCsiVersion, setProjectCsiVersion] = useState<CsiVersionId>(
    selectedScenario.projectCsiVersion,
  );

  const assignmentPreviews = useMemo(
    () => buildAssignmentPreviews(selectedScenario, projectCsiVersion),
    [projectCsiVersion, selectedScenario],
  );

  function handleScenarioChange(scenarioId: string) {
    const nextScenario = getScenarioById(scenarioId);
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
            value={selectedScenario.id}
            onChange={(event) => handleScenarioChange(event.target.value)}
          >
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
        <p className="muted-text">{selectedScenario.expectedBehavior}</p>
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
    </section>
  );
}

export default function CsiTradeMappingWorkbenchPage() {
  return (
    <AppShell title="CSI Trade Mapping Workbench">
      <div className="dashboard-shell taxonomy-workbench">
        <div className="page-header">
          <div>
            <p className="label-text">Internal Dev Tool</p>
            <h1>CSI Trade Mapping Workbench</h1>
            <p className="page-subtitle">
              Inspect MasterFormat 1995 / 16-Division and MasterFormat 2004+ /
              50-Division CSI mapping, trade assignment, crosswalk fallback, and
              subcontractor dual coverage behavior.
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
            This workbench inspects the CSI-to-trade mapping rule library. A trade
            may have no direct rules yet. Fixture tests prove assignment behavior, while the
            mapping inspector shows actual rule coverage.
          </p>
          <p>
            System mapping rules are read-only in this workbench for now. Later, this page
            should support controlled system rule drafts, company overrides, and project
            overrides.
          </p>
          <p>
            The 2004+ / 50-Division catalog is a development dataset and must support
            replacement by a licensed MasterFormat import before launch.
          </p>
        </section>

        <nav className="taxonomy-meta-list" aria-label="CSI trade mapping workbench sections">
          <a href="#mapping-coverage-summary" className="button-secondary">
            Mapping Coverage Summary
          </a>
          <a href="#csi-catalog-browser" className="button-secondary">
            CSI Catalog Browser
          </a>
          <a href="#trade-mapping-browser" className="button-secondary">
            Trade Mapping Browser
          </a>
          <a href="#crosswalk-review" className="button-secondary">
            Crosswalk Review
          </a>
          <a href="#fixture-tests" className="button-secondary">
            Fixture Tests
          </a>
        </nav>

        <MappingCoverageSummary />
        <CsiAssignmentInspector />
        <TradeRulesInspector />
        <CrosswalkReview />
        <FixtureTests />

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
