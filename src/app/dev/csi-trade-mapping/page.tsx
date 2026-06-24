"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import AppShell from "@/components/layout/AppShell";
import ContextHelp from "@/components/ui/ContextHelp";
import { resolveCsiCatalogItem } from "@/lib/csiCatalog";
import {
  assignCsiItemToTrade,
  createSubcontractorDualCoverage,
  csiTradeMappingFixtureScenarios,
  type CsiTradeAssignment,
  type CsiTradeMappingFixtureScenario,
  type CsiTradeMappingItem,
  type CsiVersionId,
  type EquivalentCsiCoverage,
} from "@/features/csi-trade-mapping";

const csiVersionOptions: { id: CsiVersionId; label: string }[] = [
  { id: "MASTERFORMAT_CURRENT", label: "MasterFormat Current" },
  { id: "MASTERFORMAT_1995", label: "MasterFormat 1995" },
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
  {
    role: "CORE",
    content: "Expected part of the bid package scope.",
  },
  {
    role: "OPTIONAL",
    content: "May be requested, selected, or split depending on project requirements.",
  },
  {
    role: "POSSIBLE",
    content: "Ambiguous CSI tag that should be reviewed before ITB use.",
  },
  {
    role: "EXCLUDED",
    content: "Deliberately not part of the package.",
  },
];

type AssignmentPreview = {
  inputItem: CsiTradeMappingItem;
  assignmentItem: CsiTradeMappingItem;
  assignment: CsiTradeAssignment;
  crosswalkEquivalent?: EquivalentCsiCoverage;
  warning?: string;
};

function getScenarioById(scenarioId: string): CsiTradeMappingFixtureScenario {
  return (
    csiTradeMappingFixtureScenarios.find((scenario) => scenario.id === scenarioId) ??
    csiTradeMappingFixtureScenarios[0]
  );
}

function getVersionLabel(version: CsiVersionId): string {
  return csiVersionOptions.find((option) => option.id === version)?.label ?? version;
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

function buildAssignmentPreviews(
  scenario: CsiTradeMappingFixtureScenario,
  projectCsiVersion: CsiVersionId,
): AssignmentPreview[] {
  return scenario.csiItems.map((inputItem) => {
    const dualCoverage = createSubcontractorDualCoverage({
      subcontractorId: `fixture-${scenario.id}`,
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
          warning: `No ${getVersionLabel(projectCsiVersion)} crosswalk equivalent was found for this fixture item.`,
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
          reason: `Fixture input ${formatCsiItem(inputItem)} is ${getVersionLabel(
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
  });
}

function AssignmentCard({ preview }: { preview: AssignmentPreview }) {
  const { assignment, inputItem, assignmentItem, crosswalkEquivalent, warning } = preview;

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
          <strong>{assignment.tradeId ?? "Unassigned"}</strong>
        </div>
        <div>
          <span className="label-text">Mapped Specialization</span>
          <strong>{assignment.specializationId ?? "None"}</strong>
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
                {tradeId}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div className="stack gap-2" style={{ marginTop: 14 }}>
        <span className="label-text">Explanation</span>
        <p className="muted-text">{assignment.reason}</p>
        {warning ? <p className="form-error">{warning}</p> : null}
      </div>
    </div>
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
                  <div key={`${item.id}-${equivalent.version}-${equivalent.csiItemId}`} className="cluster-between gap-3">
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

export default function CsiTradeMappingWorkbenchPage() {
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
    <AppShell title="CSI Trade Mapping Workbench">
      <div className="dashboard-shell taxonomy-workbench">
        <div className="page-header">
          <div>
            <p className="label-text">Internal Dev Tool</p>
            <h1>CSI Trade Mapping Workbench</h1>
            <p className="page-subtitle">
              Inspect MasterFormat 1995/current CSI mapping, trade assignment, crosswalk
              fallback, and subcontractor dual coverage behavior.
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
            This is a read-only diagnostics page. It does not write project data, change
            subcontractor coverage, or alter bid package generation.
          </p>
        </section>

        <section className="app-panel">
          <div className="panel-header">
            <div>
              <p className="label-text">Controls</p>
              <h2>Fixture Scenario</h2>
              <p className="muted-text">
                Select a project CSI version and source fixture to inspect direct mapping,
                crosswalk fallback, and ambiguity handling.
              </p>
            </div>
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
        </section>

        <section className="app-panel">
          <div className="panel-header">
            <div>
              <p className="label-text">Fixture Output</p>
              <h2>CSI-to-Trade Assignment</h2>
              <p className="muted-text">
                Assignment output includes the source, confidence, explanation trail, and
                possible alternate trades where the scope is ambiguous.
              </p>
            </div>
            <span className="taxonomy-meta-chip">{assignmentPreviews.length} input items</span>
          </div>

          <div className="stack gap-3" style={{ marginTop: 16 }}>
            {assignmentPreviews.map((preview) => (
              <AssignmentCard
                key={`${preview.inputItem.id}-${preview.assignmentItem.id}`}
                preview={preview}
              />
            ))}
          </div>
        </section>

        <section className="app-panel">
          <div className="panel-header">
            <div>
              <p className="label-text">Dual Coverage Preview</p>
              <h2>Subcontractor CSI Coverage</h2>
              <p className="muted-text">
                Source coverage remains intact while equivalent alternate-version coverage is
                derived when the CSI crosswalk has enough information.
              </p>
            </div>
          </div>

          <DualCoveragePreview scenario={selectedScenario} />
        </section>

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
