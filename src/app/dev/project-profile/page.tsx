"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import AppShell from "@/components/layout/AppShell";
import {
  buildingConditionOptions,
  buildProjectProfileLabel,
  contractTypeOptions,
  evaluateProjectSetupRules,
  getContextTagOptionsForProfile,
  getFacilityTypeOptionsForSector,
  getFieldsRequiredBeforeItb,
  getPackageReviewRequirements,
  getPricingMetricsForProfile,
  getRequiredProjectProfileFields,
  getTradeVisibilityForProjectProfile,
  getWorkTypeLabelForSector,
  getWorkTypeOptionsForSector,
  logisticsConditionOptions,
  occupancyConditionOptions,
  ownerVendorScopeOptions,
  projectProfileContextTagOptions,
  projectProfileSectorOptions,
  ProjectCsiVersionId,
  ProjectProfile,
  ProjectProfileContextTagId,
  ProjectProfileFacilityTypeId,
  ProjectProfileOption,
  ProjectProfileSectorId,
  ProjectProfileTradeVisibilityResult,
  ProjectProfileWorkTypeId,
  ProjectSetupRuleEffect,
  PricingMetric,
  publicPrivateStatusOptions,
  scopeFlagOptions,
  siteWalkStatusOptions,
  structureTypeOptions,
  taxStatusOptions,
  universalPricingMetrics,
} from "@/features/project-profile";
import { getDefaultTradeTaxonomy } from "@/features/trade-taxonomy";

type Scenario = {
  id: string;
  label: string;
  sector: ProjectProfileSectorId;
  facilityType?: ProjectProfileFacilityTypeId;
  workType: ProjectProfileWorkTypeId;
  contextTags?: ProjectProfileContextTagId[];
  siteScope?: ProjectProfile["globalAttributes"]["siteScope"];
  envelopeScope?: ProjectProfile["globalAttributes"]["envelopeScope"];
  occupiedSite?: boolean;
  publicPrivate?: ProjectProfile["procurement"]["publicPrivate"];
};

const scenarios: Scenario[] = [
  {
    id: "office-ti",
    label: "Office + Tenant Improvement / Interior Fit-Out",
    sector: "office",
    facilityType: "general_office",
    workType: "interior_fit_out_renovation",
  },
  {
    id: "residential-remodel",
    label: "Residential + Renovation / Remodel",
    sector: "residential",
    facilityType: "single_family",
    workType: "interior_fit_out_renovation",
    contextTags: ["kitchen_bath_renovation", "wood_framing"],
    occupiedSite: true,
  },
  {
    id: "healthcare-medical-office",
    label: "Healthcare + Medical Office TI",
    sector: "healthcare",
    facilityType: "medical_office_facility",
    workType: "interior_fit_out_renovation",
    contextTags: ["medical_office", "infection_control"],
    occupiedSite: true,
  },
  {
    id: "restaurant-kitchen",
    label: "Restaurant + Commercial Kitchen Build-Out",
    sector: "restaurant",
    facilityType: "commercial_kitchen_only",
    workType: "interior_fit_out_renovation",
    contextTags: ["commercial_kitchen", "kitchen_hood", "grease_interceptor"],
  },
  {
    id: "civil-sitework",
    label: "Civil + Sitework Only",
    sector: "civil_sitework",
    workType: "sitework_civil_only",
    contextTags: ["sitework_scope"],
    siteScope: "included",
  },
  {
    id: "warehouse-ground-up",
    label: "Warehouse + Ground-Up",
    sector: "warehouse",
    facilityType: "dry_warehouse",
    workType: "ground_up_new_construction",
    contextTags: ["sitework_scope"],
    siteScope: "included",
    envelopeScope: "included",
  },
];

const defaultProfile: ProjectProfile = {
  classification: {
    sector: "office",
    facilityType: "general_office",
    workType: "interior_fit_out_renovation",
    contextTags: [],
  },
  globalAttributes: {
    projectCsiVersion: "MASTERFORMAT_2004_PLUS",
    buildingCondition: "existing_to_renovate",
    occupancyCondition: "unknown",
    siteScope: "tbd",
    envelopeScope: "tbd",
  },
  logistics: {
    siteWalkStatus: "tbd",
    occupiedSite: false,
    phasedWork: false,
    nightWork: false,
    restrictedAccess: false,
    secureFacility: false,
    highRise: false,
    limitedLaydown: false,
  },
  procurement: {
    publicPrivate: "unknown",
    prevailingWage: false,
    bondRequired: false,
    taxStatus: "unknown",
    contractType: "unknown",
    ownerVendorScope: "unknown",
    alternatesRequired: false,
    allowancesRequired: false,
    unitPricesRequired: false,
  },
};

const csiVersionOptions: { id: ProjectCsiVersionId; label: string }[] = [
  { id: "MASTERFORMAT_2004_PLUS", label: "MasterFormat 2004+ / 50-Division" },
  { id: "MASTERFORMAT_1995", label: "MasterFormat 1995 / 16-Division" },
];

const requiredBeforePackageReview = [
  "Project Profile classification selected",
  "Project CSI version selected",
  "Project scope / CSI evidence selected",
  "Suggested trade packages generated",
  "Bid package include / exclude candidates available",
];

const fieldLabels = new Map<string, string>([
  ["project.name", "Project name"],
  ["project.addressOrMarketLocation", "Address / market location"],
  ["project.clientOwnerOrBidSolicitor", "Client / owner / bid solicitor"],
  ["project.estimatorOrInternalBidContact", "Estimator / internal bid contact"],
  ["project.bidDueDates", "Bid due dates"],
  ["itbInstructions.documentAccessInstructions", "Document access instructions"],
  ["classification.sector", "Sector"],
  ["classification.facilityType", "Subsector / facility type"],
  ["classification.workType", "Work type"],
  ["classification.contextTags", "Context tags"],
  ["globalAttributes.squareFeet", "Square footage"],
  ["globalAttributes.floors", "Floors / stories"],
  ["globalAttributes.buildingCondition", "Building condition"],
  ["globalAttributes.projectCsiVersion", "Project CSI version"],
  ["globalAttributes.siteScope", "Sitework scope flag"],
  ["globalAttributes.envelopeScope", "Exterior envelope scope flag"],
  ["logistics.siteWalkStatus", "Site walk status"],
  ["procurement.publicPrivate", "Public / private bid"],
  ["procurement.prevailingWage", "Prevailing wage status"],
]);

const requiredFieldGroups = [
  {
    title: "Project Intake",
    prefixes: ["project.", "itbInstructions."],
  },
  {
    title: "Classification",
    prefixes: ["classification."],
  },
  {
    title: "Global Attributes",
    prefixes: ["globalAttributes."],
  },
  {
    title: "Logistics",
    prefixes: ["logistics."],
  },
  {
    title: "Procurement",
    prefixes: ["procurement."],
  },
];

function optionLabel<TId extends string>(
  id: TId | undefined,
  options: readonly { id: TId; label: string }[],
): string | undefined {
  if (!id) return undefined;
  return options.find((option) => option.id === id)?.label ?? id;
}

function fieldLabel(fieldPath: string): string {
  return fieldLabels.get(fieldPath) ?? fieldPath;
}

function formatEffectType(type: string): string {
  return type
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function FieldList({
  items,
  emptyText,
  formatItem = (item) => item,
}: {
  items: readonly string[];
  emptyText: string;
  formatItem?: (item: string) => string;
}) {
  if (!items.length) {
    return <p className="muted-text">{emptyText}</p>;
  }

  return (
    <ul className="taxonomy-warning-list">
      {items.map((item) => (
        <li key={item}>{formatItem(item)}</li>
      ))}
    </ul>
  );
}

function GroupedRequiredFieldList({ fields }: { fields: readonly string[] }) {
  const remainingFields = new Set(fields);

  return (
    <div className="stack gap-3">
      {requiredFieldGroups.map((group) => {
        const groupFields = fields.filter((field) =>
          group.prefixes.some((prefix) => field.startsWith(prefix)),
        );
        groupFields.forEach((field) => remainingFields.delete(field));

        if (!groupFields.length) {
          return null;
        }

        return (
          <details key={group.title} className="project-csi-selected-group" open>
            <summary className="cluster-between gap-3">
              <strong>{group.title}</strong>
              <span className="taxonomy-meta-chip">{groupFields.length}</span>
            </summary>
            <FieldList
              items={groupFields}
              emptyText="No fields."
              formatItem={fieldLabel}
            />
          </details>
        );
      })}

      {remainingFields.size ? (
        <details className="project-csi-selected-group" open>
          <summary className="cluster-between gap-3">
            <strong>Other</strong>
            <span className="taxonomy-meta-chip">{remainingFields.size}</span>
          </summary>
          <FieldList
            items={[...remainingFields]}
            emptyText="No fields."
            formatItem={fieldLabel}
          />
        </details>
      ) : null}
    </div>
  );
}

function OptionDetailList<TId extends string>({
  options,
  emptyText,
}: {
  options: readonly ProjectProfileOption<TId>[];
  emptyText: string;
}) {
  if (!options.length) {
    return <p className="muted-text">{emptyText}</p>;
  }

  return (
    <div className="stack gap-2">
      {options.map((option) => (
        <div key={option.id} className="project-csi-selected-group">
          <strong>{option.label}</strong>
          <p className="muted-text">{option.description}</p>
        </div>
      ))}
    </div>
  );
}

function EffectList({ effects }: { effects: readonly ProjectSetupRuleEffect[] }) {
  if (!effects.length) {
    return <p className="muted-text">No setup rule effects match this profile.</p>;
  }

  return (
    <div className="stack gap-2">
      {effects.map((effect) => (
        <div key={effect.id} className="project-csi-selected-group">
          <div className="cluster-between gap-3 align-start">
            <div>
              <strong>{effect.label ?? effect.targetId ?? effect.targetFieldPath ?? effect.id}</strong>
              <p className="muted-text">
                <span className="label-text">Target</span>{" "}
                {effect.targetFieldPath ?? effect.targetId ?? "Profile-level effect"}
              </p>
              <p className="muted-text">
                <span className="label-text">Reason</span>{" "}
                {effect.description ?? "Derived from the matching setup rule conditions."}
              </p>
              <p className="muted-text">
                <span className="label-text">Impact</span>{" "}
                {effect.impactCategories.join(", ")}
              </p>
            </div>
            <span className="taxonomy-meta-chip">{formatEffectType(effect.type)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function MetricList({
  metrics,
  profile,
}: {
  metrics: readonly PricingMetric[];
  profile: ProjectProfile;
}) {
  const universalMetricIds = new Set(universalPricingMetrics.map((metric) => metric.id));
  const sectorLabel = optionLabel(profile.classification.sector, projectProfileSectorOptions);
  const facilityLabel = optionLabel(profile.classification.facilityType, facilityTypeOptionsForProfile(profile));

  return (
    <div className="stack gap-2">
      {metrics.map((metric) => (
        <div key={metric.id} className="project-csi-selected-group">
          <div className="cluster-between gap-3 align-start">
            <div>
              <strong>{metric.label}</strong>
              <p className="muted-text">
                <span className="label-text">Applies to</span>{" "}
                {universalMetricIds.has(metric.id)
                  ? "All project profiles"
                  : [sectorLabel, facilityLabel].filter(Boolean).join(" / ")}
              </p>
              {metric.description ? <p className="muted-text">{metric.description}</p> : null}
            </div>
            <span className="taxonomy-meta-chip">{metric.unit}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function TradeVisibilityGroup({
  title,
  description,
  trades,
}: {
  title: string;
  description: string;
  trades: readonly ProjectProfileTradeVisibilityResult[];
}) {
  return (
    <section className="taxonomy-visibility-group">
      <div className="cluster-between gap-3 align-start">
        <div>
          <h3>{title}</h3>
          <p className="muted-text">{description}</p>
        </div>
        <span className="taxonomy-meta-chip">{trades.length}</span>
      </div>

      {trades.length ? (
        <div className="taxonomy-visibility-list">
          {trades.map((trade) => (
            <div key={`${title}-${trade.tradeId}`} className="taxonomy-visibility-card">
              <strong>{trade.tradeName}</strong>
              <p className="muted-text">{trade.explanations.join(" ")}</p>
              {trade.isHiddenByDefault ? (
                <span className="taxonomy-status-chip taxonomy-status-hidden">
                  Hidden By Default
                </span>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <p className="muted-text">No trades in this group for the selected profile.</p>
      )}
    </section>
  );
}

function facilityTypeOptionsForProfile(
  profile: ProjectProfile,
): ProjectProfileOption<ProjectProfileFacilityTypeId>[] {
  return getFacilityTypeOptionsForSector(profile.classification.sector);
}

export default function ProjectProfileWorkbenchPage() {
  const [profile, setProfile] = useState<ProjectProfile>(defaultProfile);
  const masterTradeLibrary = useMemo(() => getDefaultTradeTaxonomy(), []);

  const facilityTypeOptions = useMemo(
    () => getFacilityTypeOptionsForSector(profile.classification.sector),
    [profile.classification.sector],
  );
  const workTypeOptions = useMemo(
    () => getWorkTypeOptionsForSector(profile.classification.sector),
    [profile.classification.sector],
  );
  const contextTagOptions = useMemo(() => getContextTagOptionsForProfile(profile), [profile]);
  const contextOptionIds = useMemo(
    () => new Set(contextTagOptions.map((option) => option.id)),
    [contextTagOptions],
  );
  const visibleContextTags = profile.classification.contextTags.filter((tag) =>
    contextOptionIds.has(tag),
  );
  const ruleEvaluation = useMemo(() => evaluateProjectSetupRules(profile), [profile]);
  const pricingMetrics = useMemo(() => getPricingMetricsForProfile(profile), [profile]);
  const tradeVisibility = useMemo(
    () => getTradeVisibilityForProjectProfile(profile, masterTradeLibrary),
    [masterTradeLibrary, profile],
  );
  const packageableMasterTrades = useMemo(
    () =>
      masterTradeLibrary
        .filter((trade) => trade.isActive && trade.canBeBidPackage)
        .sort((leftTrade, rightTrade) => leftTrade.sortOrder - rightTrade.sortOrder),
    [masterTradeLibrary],
  );
  const profileLabel = buildProjectProfileLabel(profile);
  const requiredFields = getRequiredProjectProfileFields(profile);
  const itbFields = getFieldsRequiredBeforeItb(profile);
  const packageReviewRequirements = getPackageReviewRequirements(profile);
  const suggestedContextTags = ruleEvaluation.effects
    .filter((effect) => effect.type === "SUGGEST_CONTEXT_TAG")
    .map((effect) => effect.targetId)
    .filter((targetId): targetId is ProjectProfileContextTagId =>
      projectProfileContextTagOptions.some((option) => option.id === targetId),
    )
    .filter((targetId) => !profile.classification.contextTags.includes(targetId));
  const warnings = ruleEvaluation.effects.filter((effect) => effect.type === "ADD_WARNING");

  function updateProfile(nextProfile: ProjectProfile) {
    const availableContextIds = new Set(getContextTagOptionsForProfile(nextProfile).map((option) => option.id));
    setProfile({
      ...nextProfile,
      classification: {
        ...nextProfile.classification,
        contextTags: nextProfile.classification.contextTags.filter((tag) =>
          availableContextIds.has(tag),
        ),
      },
    });
  }

  function setScenario(scenarioId: string) {
    const scenario = scenarios.find((candidate) => candidate.id === scenarioId);
    if (!scenario) return;

    updateProfile({
      ...defaultProfile,
      classification: {
        sector: scenario.sector,
        facilityType: scenario.facilityType,
        workType: scenario.workType,
        contextTags: scenario.contextTags ?? [],
      },
      globalAttributes: {
        ...defaultProfile.globalAttributes,
        siteScope: scenario.siteScope ?? defaultProfile.globalAttributes.siteScope,
        envelopeScope: scenario.envelopeScope ?? defaultProfile.globalAttributes.envelopeScope,
      },
      logistics: {
        ...defaultProfile.logistics,
        occupiedSite: scenario.occupiedSite ?? defaultProfile.logistics.occupiedSite,
      },
      procurement: {
        ...defaultProfile.procurement,
        publicPrivate: scenario.publicPrivate ?? defaultProfile.procurement.publicPrivate,
      },
    });
  }

  function setSector(sector: ProjectProfileSectorId) {
    const nextFacilityType = getFacilityTypeOptionsForSector(sector)[0]?.id;
    updateProfile({
      ...profile,
      classification: {
        ...profile.classification,
        sector,
        facilityType: nextFacilityType,
      },
    });
  }

  function toggleContextTag(contextTag: ProjectProfileContextTagId) {
    setProfile((currentProfile) => {
      const nextTags = currentProfile.classification.contextTags.includes(contextTag)
        ? currentProfile.classification.contextTags.filter((tag) => tag !== contextTag)
        : [...currentProfile.classification.contextTags, contextTag];

      return {
        ...currentProfile,
        classification: {
          ...currentProfile.classification,
          contextTags: nextTags,
        },
      };
    });
  }

  return (
    <AppShell title="Project Profile Workbench">
      <div className="dashboard-shell taxonomy-workbench">
        <div className="page-header">
          <div>
            <p className="page-subtitle">
              Internal inspection page for project classification, required setup fields,
              pricing metrics, and package review requirements.
            </p>
          </div>
          <Link href="/" className="button-secondary">
            Dashboard
          </Link>
        </div>

        <section className="app-panel taxonomy-workbench-note">
          <p>
            Project-level finish/demo/MEP values are default assumptions only. Final finish,
            work, demo, MEP, and specialty intensity are reviewed per bid package before ITB.
          </p>
        </section>

        <section className="app-panel">
          <div className="panel-header">
            <div>
              <p className="label-text">Profile Inputs</p>
              <h2>Classification Controls</h2>
              <p className="muted-text">
                Sector controls facility type, work type labels, and available context tags.
              </p>
            </div>
            <label className="field-stack" style={{ minWidth: 280 }}>
              <span>Compact Test Scenario</span>
              <select defaultValue="" onChange={(event) => setScenario(event.target.value)}>
                <option value="">Select scenario</option>
                {scenarios.map((scenario) => (
                  <option key={scenario.id} value={scenario.id}>
                    {scenario.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="taxonomy-control-grid" style={{ marginTop: 16 }}>
            <label className="field-stack">
              <span>Sector</span>
              <select
                value={profile.classification.sector}
                onChange={(event) => setSector(event.target.value as ProjectProfileSectorId)}
              >
                {projectProfileSectorOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="field-stack">
              <span>Facility Type</span>
              <select
                value={profile.classification.facilityType ?? ""}
                onChange={(event) =>
                  updateProfile({
                    ...profile,
                    classification: {
                      ...profile.classification,
                      facilityType: event.target.value
                        ? (event.target.value as ProjectProfileFacilityTypeId)
                        : undefined,
                    },
                  })
                }
              >
                <option value="">No facility type selected</option>
                {facilityTypeOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="field-stack">
              <span>Work Type</span>
              <select
                value={profile.classification.workType}
                onChange={(event) =>
                  updateProfile({
                    ...profile,
                    classification: {
                      ...profile.classification,
                      workType: event.target.value as ProjectProfileWorkTypeId,
                    },
                  })
                }
              >
                {workTypeOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="field-stack">
              <span>Context Tags</span>
              <details className="taxonomy-context-dropdown">
                <summary>
                  {visibleContextTags.length
                    ? `${visibleContextTags.length} context tags selected`
                    : "No context tags selected"}
                </summary>
                <div className="taxonomy-context-options">
                  {contextTagOptions.length ? (
                    contextTagOptions.map((option) => (
                      <label key={option.id} className="taxonomy-context-option">
                        <input
                          type="checkbox"
                          checked={profile.classification.contextTags.includes(option.id)}
                          onChange={() => toggleContextTag(option.id)}
                        />
                        <span className="taxonomy-context-option-label">{option.label}</span>
                      </label>
                    ))
                  ) : (
                    <p className="muted-text">No context tags are available for this profile.</p>
                  )}
                </div>
              </details>
            </div>
          </div>
        </section>

        <section className="app-panel">
          <div className="panel-header">
            <div>
              <p className="label-text">Global Attributes Preview</p>
              <h2>Project Facts Available To Setup</h2>
            </div>
            <span className="taxonomy-meta-chip">
              {optionLabel(profile.globalAttributes.projectCsiVersion, csiVersionOptions)}
            </span>
          </div>

          <div className="profile-detail-grid" style={{ marginTop: 16 }}>
            <div className="profile-detail">
              <span>Square Footage</span>
              <strong>Required before ITB</strong>
            </div>
            <div className="profile-detail">
              <span>Floors / Stories</span>
              <strong>Required before ITB</strong>
            </div>
            <div className="profile-detail">
              <span>Building Condition</span>
              <strong>{buildingConditionOptions.length} options</strong>
            </div>
            <div className="profile-detail">
              <span>Structure Type</span>
              <strong>{structureTypeOptions.length} options</strong>
            </div>
            <div className="profile-detail">
              <span>Occupancy Condition</span>
              <strong>{occupancyConditionOptions.length} options</strong>
            </div>
            <div className="profile-detail">
              <span>Site Scope</span>
              <strong>{scopeFlagOptions.length} states</strong>
            </div>
            <div className="profile-detail">
              <span>Envelope Scope</span>
              <strong>{scopeFlagOptions.length} states</strong>
            </div>
            <div className="profile-detail">
              <span>Project CSI Version</span>
              <strong>{csiVersionOptions.length} options</strong>
            </div>
          </div>

          <div className="stack gap-3" style={{ marginTop: 18 }}>
            <details className="project-csi-selected-group" open>
              <summary className="cluster-between gap-3">
                <strong>Building Condition Options</strong>
                <span className="taxonomy-meta-chip">{buildingConditionOptions.length}</span>
              </summary>
              <OptionDetailList
                options={buildingConditionOptions}
                emptyText="No building condition options."
              />
            </details>
            <details className="project-csi-selected-group">
              <summary className="cluster-between gap-3">
                <strong>Structure Type Options</strong>
                <span className="taxonomy-meta-chip">{structureTypeOptions.length}</span>
              </summary>
              <OptionDetailList options={structureTypeOptions} emptyText="No structure type options." />
            </details>
            <details className="project-csi-selected-group">
              <summary className="cluster-between gap-3">
                <strong>Occupancy Condition Options</strong>
                <span className="taxonomy-meta-chip">{occupancyConditionOptions.length}</span>
              </summary>
              <OptionDetailList
                options={occupancyConditionOptions}
                emptyText="No occupancy condition options."
              />
            </details>
            <details className="project-csi-selected-group">
              <summary className="cluster-between gap-3">
                <strong>Site / Envelope Scope Flags</strong>
                <span className="taxonomy-meta-chip">{scopeFlagOptions.length}</span>
              </summary>
              <OptionDetailList options={scopeFlagOptions} emptyText="No scope flag options." />
            </details>
            <details className="project-csi-selected-group">
              <summary className="cluster-between gap-3">
                <strong>Project CSI Version Options</strong>
                <span className="taxonomy-meta-chip">{csiVersionOptions.length}</span>
              </summary>
              <FieldList
                items={csiVersionOptions.map((option) => option.label)}
                emptyText="No CSI version options."
              />
            </details>
          </div>
        </section>

        <section className="app-panel">
          <div className="panel-header">
            <div>
              <p className="label-text">Logistics / Procurement Preview</p>
              <h2>Rule Inputs</h2>
            </div>
          </div>

          <div className="profile-detail-grid" style={{ marginTop: 16 }}>
            <div className="profile-detail">
              <span>Site Walk Status</span>
              <strong>{siteWalkStatusOptions.map((option) => option.label).join(", ")}</strong>
            </div>
            <div className="profile-detail">
              <span>Logistics Conditions</span>
              <strong>{logisticsConditionOptions.length} toggles</strong>
            </div>
            <div className="profile-detail">
              <span>Public / Private</span>
              <strong>{publicPrivateStatusOptions.length} options</strong>
            </div>
            <div className="profile-detail">
              <span>Prevailing Wage</span>
              <strong>Boolean rule input</strong>
            </div>
            <div className="profile-detail">
              <span>Bond Required</span>
              <strong>Boolean rule input</strong>
            </div>
            <div className="profile-detail">
              <span>Tax Status</span>
              <strong>{taxStatusOptions.length} options</strong>
            </div>
            <div className="profile-detail">
              <span>Contract Type</span>
              <strong>{contractTypeOptions.length} options</strong>
            </div>
            <div className="profile-detail">
              <span>Owner / Vendor Scope</span>
              <strong>{ownerVendorScopeOptions.length} options</strong>
            </div>
          </div>

          <div className="stack gap-3" style={{ marginTop: 18 }}>
            <details className="project-csi-selected-group" open>
              <summary className="cluster-between gap-3">
                <strong>Site Walk Status Options</strong>
                <span className="taxonomy-meta-chip">{siteWalkStatusOptions.length}</span>
              </summary>
              <OptionDetailList
                options={siteWalkStatusOptions}
                emptyText="No site walk status options."
              />
            </details>
            <details className="project-csi-selected-group">
              <summary className="cluster-between gap-3">
                <strong>Logistics Condition Toggles</strong>
                <span className="taxonomy-meta-chip">{logisticsConditionOptions.length}</span>
              </summary>
              <OptionDetailList
                options={logisticsConditionOptions}
                emptyText="No logistics conditions."
              />
            </details>
            <details className="project-csi-selected-group">
              <summary className="cluster-between gap-3">
                <strong>Public / Private Options</strong>
                <span className="taxonomy-meta-chip">{publicPrivateStatusOptions.length}</span>
              </summary>
              <OptionDetailList
                options={publicPrivateStatusOptions}
                emptyText="No public/private options."
              />
            </details>
            <details className="project-csi-selected-group">
              <summary className="cluster-between gap-3">
                <strong>Tax Status Options</strong>
                <span className="taxonomy-meta-chip">{taxStatusOptions.length}</span>
              </summary>
              <OptionDetailList options={taxStatusOptions} emptyText="No tax status options." />
            </details>
            <details className="project-csi-selected-group">
              <summary className="cluster-between gap-3">
                <strong>Contract Type Options</strong>
                <span className="taxonomy-meta-chip">{contractTypeOptions.length}</span>
              </summary>
              <OptionDetailList
                options={contractTypeOptions}
                emptyText="No contract type options."
              />
            </details>
            <details className="project-csi-selected-group">
              <summary className="cluster-between gap-3">
                <strong>Owner / Vendor Scope Options</strong>
                <span className="taxonomy-meta-chip">{ownerVendorScopeOptions.length}</span>
              </summary>
              <OptionDetailList
                options={ownerVendorScopeOptions}
                emptyText="No owner/vendor scope options."
              />
            </details>
          </div>
        </section>

        <section className="app-panel">
          <div className="panel-header">
            <div>
              <p className="label-text">Project Profile Label</p>
              <h2>{profileLabel}</h2>
              <p className="muted-text">
                Work type display:{" "}
                {getWorkTypeLabelForSector(
                  profile.classification.workType,
                  profile.classification.sector,
                )}
              </p>
            </div>
            <div className="taxonomy-meta-list">
              <span className="taxonomy-meta-chip">{visibleContextTags.length} selected context tags</span>
              <span className="taxonomy-meta-chip">{contextTagOptions.length} available context tags</span>
            </div>
          </div>
          <div className="dashboard-grid" style={{ marginTop: 16 }}>
            <div className="project-csi-selected-group">
              <div className="cluster-between gap-3">
                <strong>Selected Context Tags</strong>
                <span className="taxonomy-meta-chip">{visibleContextTags.length}</span>
              </div>
              <FieldList
                items={visibleContextTags}
                emptyText="No context tags selected."
                formatItem={(tag) => optionLabel(tag as ProjectProfileContextTagId, projectProfileContextTagOptions) ?? tag}
              />
            </div>
            <details className="project-csi-selected-group" open>
              <summary className="cluster-between gap-3">
                <strong>Available Context Tags</strong>
                <span className="taxonomy-meta-chip">{contextTagOptions.length}</span>
              </summary>
              <OptionDetailList options={contextTagOptions} emptyText="No context tags available." />
            </details>
          </div>
        </section>

        <section className="app-panel">
          <div className="panel-header">
            <div>
              <p className="label-text">Current Project Visibility</p>
              <h2>Trade Visibility From Project Profile</h2>
              <p className="muted-text">
                These groups are derived from the selected sector, facility type, work type,
                context tags, and modeled global attributes. The master library remains separate
                below.
              </p>
            </div>
            <div className="taxonomy-meta-list">
              <span className="taxonomy-meta-chip">
                {tradeVisibility.core.length} core
              </span>
              <span className="taxonomy-meta-chip">
                {tradeVisibility.suggested.length} suggested
              </span>
              <span className="taxonomy-meta-chip">
                {tradeVisibility.contextual.length} contextual
              </span>
            </div>
          </div>

          <div className="taxonomy-visibility-grid">
            <TradeVisibilityGroup
              title="Core Trades"
              description="Expected and normally reviewed for this Project Profile."
              trades={tradeVisibility.core}
            />
            <TradeVisibilityGroup
              title="Suggested Trades"
              description="Often relevant, but the estimator should confirm before ITB use."
              trades={tradeVisibility.suggested}
            />
            <TradeVisibilityGroup
              title="Contextual Trades"
              description="Shown because context tags, global attributes, or taxonomy triggers made them relevant."
              trades={tradeVisibility.contextual}
            />
            <TradeVisibilityGroup
              title="Hidden but Available"
              description="Available in the master library but not normally active for this Project Profile."
              trades={tradeVisibility.hidden}
            />
            <TradeVisibilityGroup
              title="Excluded / Not Normally Relevant"
              description="Explicitly not expected for this profile unless estimator scope evidence overrides it."
              trades={tradeVisibility.excluded}
            />
          </div>
        </section>

        <details className="app-panel taxonomy-master-library">
          <summary>
            <span>
              <span className="label-text">Master Trade Library</span>
              <strong>Full Active Packageable Trade List</strong>
              <span className="muted-text">
                This is the full master library, not the current project visibility result.
              </span>
            </span>
            <span className="taxonomy-meta-chip">{packageableMasterTrades.length} trades</span>
          </summary>
          <div className="taxonomy-visibility-list" style={{ marginTop: 16 }}>
            {packageableMasterTrades.map((trade) => (
              <div key={trade.id} className="taxonomy-visibility-card">
                <strong>{trade.name}</strong>
                <p className="muted-text">
                  {trade.defaultHidden
                    ? "Hidden by default unless project context or CSI evidence triggers it."
                    : "Active in the master trade library."}
                </p>
              </div>
            ))}
          </div>
        </details>

        <div className="dashboard-grid">
          <section className="app-panel">
            <div className="panel-header">
              <div>
                <p className="label-text">Required ITB Fields</p>
                <h2>Required Before ITB</h2>
              </div>
              <span className="taxonomy-meta-chip">{itbFields.length} fields</span>
            </div>
            <GroupedRequiredFieldList fields={itbFields} />
          </section>

          <section className="app-panel">
            <div className="panel-header">
              <div>
                <p className="label-text">Required Setup Fields</p>
                <h2>Required By Rules</h2>
              </div>
              <span className="taxonomy-meta-chip">{requiredFields.length} fields</span>
            </div>
            <FieldList
              items={requiredFields}
              emptyText="No required setup fields matched."
              formatItem={fieldLabel}
            />
          </section>
        </div>

        <div className="dashboard-grid">
          <section className="app-panel">
            <div className="panel-header">
              <div>
                <p className="label-text">Package Review</p>
                <h2>Required Before Package Review</h2>
              </div>
            </div>
            <FieldList items={requiredBeforePackageReview} emptyText="No package review prerequisites." />
          </section>

          <section className="app-panel">
            <div className="panel-header">
              <div>
                <p className="label-text">Package Review</p>
                <h2>Package Review Requirements</h2>
              </div>
              <span className="taxonomy-meta-chip">{packageReviewRequirements.length} items</span>
            </div>
            <FieldList items={packageReviewRequirements} emptyText="No package review requirements." />
          </section>
        </div>

        <section className="app-panel">
          <div className="panel-header">
            <div>
              <p className="label-text">Pricing Metrics</p>
              <h2>Metrics For This Profile</h2>
            </div>
            <span className="taxonomy-meta-chip">{pricingMetrics.length} metrics</span>
          </div>
          <div className="taxonomy-meta-list" style={{ marginTop: 16 }}>
            {pricingMetrics.map((metric) => (
              <span key={metric.id} className="taxonomy-meta-chip">
                {metric.label}
              </span>
            ))}
          </div>
          <div style={{ marginTop: 18 }}>
            <MetricList metrics={pricingMetrics} profile={profile} />
          </div>
        </section>

        <section className="app-panel">
          <div className="panel-header">
            <div>
              <p className="label-text">Rule Effects</p>
              <h2>Setup Rule Effects</h2>
              <p className="muted-text">
                Matching rules: {ruleEvaluation.matchingRules.map((rule) => rule.name).join(", ") || "None"}
              </p>
            </div>
            <span className="taxonomy-meta-chip">{ruleEvaluation.effects.length} effects</span>
          </div>
          <EffectList effects={ruleEvaluation.effects} />
        </section>

        <div className="dashboard-grid">
          <section className="app-panel">
            <div className="panel-header">
              <div>
                <p className="label-text">Suggested Context Tags</p>
                <h2>Rule Suggestions</h2>
              </div>
            </div>
            <div className="taxonomy-meta-list">
              {suggestedContextTags.length ? (
                suggestedContextTags.map((tag) => (
                  <span key={tag} className="taxonomy-meta-chip">
                    {optionLabel(tag, projectProfileContextTagOptions)}
                  </span>
                ))
              ) : (
                <p className="muted-text">No additional context tags suggested.</p>
              )}
            </div>
          </section>

          <section className="app-panel">
            <div className="panel-header">
              <div>
                <p className="label-text">Warnings</p>
                <h2>Profile Warnings</h2>
              </div>
            </div>
            <EffectList effects={warnings} />
          </section>
        </div>
      </div>
    </AppShell>
  );
}
