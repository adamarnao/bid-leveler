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
  ProjectProfileSectorId,
  ProjectProfileWorkTypeId,
  ProjectSetupRuleEffect,
  publicPrivateStatusOptions,
  scopeFlagOptions,
  siteWalkStatusOptions,
  structureTypeOptions,
  taxStatusOptions,
} from "@/features/project-profile";

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
    projectCsiVersion: "MASTERFORMAT_CURRENT",
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
  { id: "MASTERFORMAT_CURRENT", label: "MasterFormat Current" },
  { id: "MASTERFORMAT_1995", label: "MasterFormat 1995" },
];

const requiredBeforePackageReview = [
  "Project Profile classification selected",
  "Project CSI version selected",
  "Project scope / CSI evidence selected",
  "Suggested trade packages generated",
  "Bid package include / exclude candidates available",
];

function optionLabel<TId extends string>(
  id: TId | undefined,
  options: readonly { id: TId; label: string }[],
): string | undefined {
  if (!id) return undefined;
  return options.find((option) => option.id === id)?.label ?? id;
}

function formatEffectType(type: string): string {
  return type
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function FieldList({ items, emptyText }: { items: readonly string[]; emptyText: string }) {
  if (!items.length) {
    return <p className="muted-text">{emptyText}</p>;
  }

  return (
    <ul className="taxonomy-warning-list">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
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
              {effect.description ? <p className="muted-text">{effect.description}</p> : null}
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

export default function ProjectProfileWorkbenchPage() {
  const [profile, setProfile] = useState<ProjectProfile>(defaultProfile);

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
              {visibleContextTags.map((tag) => (
                <span key={tag} className="taxonomy-meta-chip">
                  {optionLabel(tag, projectProfileContextTagOptions)}
                </span>
              ))}
            </div>
          </div>
        </section>

        <div className="dashboard-grid">
          <section className="app-panel">
            <div className="panel-header">
              <div>
                <p className="label-text">Required ITB Fields</p>
                <h2>Required Before ITB</h2>
              </div>
              <span className="taxonomy-meta-chip">{itbFields.length} fields</span>
            </div>
            <FieldList items={itbFields} emptyText="No ITB requirements matched." />
          </section>

          <section className="app-panel">
            <div className="panel-header">
              <div>
                <p className="label-text">Required Setup Fields</p>
                <h2>Required By Rules</h2>
              </div>
              <span className="taxonomy-meta-chip">{requiredFields.length} fields</span>
            </div>
            <FieldList items={requiredFields} emptyText="No required setup fields matched." />
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
                {metric.label} ({metric.unit})
              </span>
            ))}
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
