import {
  contextTagAvailability,
  facilityTypeAvailabilityBySector,
  projectProfileContextTagOptions,
  projectProfileFacilityTypeOptions,
  projectProfileSectorOptions,
  projectProfileWorkTypeOptions,
  sectorWorkTypeLabels,
} from "./defaultProjectProfileOptions";
import { evaluateProjectSetupRules } from "./projectSetupRules";
import {
  ContextTagAvailability,
  ProjectProfile,
  ProjectProfileContextTagId,
  ProjectProfileFacilityTypeId,
  ProjectProfileOption,
  ProjectProfileSectorId,
  ProjectProfileWorkTypeId,
  ProjectSetupRuleEffect,
} from "./types";

export function getFacilityTypeOptionsForSector(
  sector: ProjectProfileSectorId,
): ProjectProfileOption<ProjectProfileFacilityTypeId>[] {
  const availability = facilityTypeAvailabilityBySector.find((entry) => entry.sector === sector);

  if (!availability) {
    return [];
  }

  return projectProfileFacilityTypeOptions
    .filter((option) => availability.facilityTypes.includes(option.id))
    .sort(compareOptions);
}

export function getWorkTypeOptionsForSector(
  sector: ProjectProfileSectorId,
): ProjectProfileOption<ProjectProfileWorkTypeId>[] {
  return projectProfileWorkTypeOptions
    .map((option) => ({
      ...option,
      label: getWorkTypeLabelForSector(option.id, sector),
    }))
    .sort(compareOptions);
}

export function getWorkTypeLabelForSector(
  workType: ProjectProfileWorkTypeId,
  sector: ProjectProfileSectorId,
): string {
  return (
    sectorWorkTypeLabels.find((label) => label.sector === sector && label.workType === workType)
      ?.label ?? getOptionLabel(workType, projectProfileWorkTypeOptions)
  );
}

export function getContextTagOptionsForProfile(
  profile: ProjectProfile,
): ProjectProfileOption<ProjectProfileContextTagId>[] {
  const optionById = new Map(projectProfileContextTagOptions.map((option) => [option.id, option]));

  return contextTagAvailability
    .filter((availability) => isContextTagAvailableForProfile(availability, profile))
    .map((availability) => optionById.get(availability.contextTag))
    .filter((option): option is ProjectProfileOption<ProjectProfileContextTagId> => Boolean(option))
    .sort(compareOptions);
}

export function buildProjectProfileLabel(profile: ProjectProfile): string {
  const { classification } = profile;
  const sectorLabel = getOptionLabel(classification.sector, projectProfileSectorOptions);
  const facilityLabel = classification.facilityType
    ? getOptionLabel(classification.facilityType, projectProfileFacilityTypeOptions)
    : classification.subsector;
  const workTypeLabel = getWorkTypeLabelForSector(classification.workType, classification.sector);

  return [sectorLabel, facilityLabel, workTypeLabel].filter(Boolean).join(" / ");
}

export function getRequiredProjectProfileFields(profile: ProjectProfile): string[] {
  return collectFieldPaths(
    evaluateProjectSetupRules(profile).effects.filter((effect) => effect.type === "REQUIRE_FIELD"),
  );
}

export function getFieldsRequiredBeforeItb(profile: ProjectProfile): string[] {
  const setupEffects = evaluateProjectSetupRules(profile).effects;
  const explicitRequirements = collectFieldPaths(
    setupEffects.filter(
      (effect) => effect.type === "REQUIRE_FIELD" || effect.type === "ADD_ITB_REQUIREMENT",
    ),
  );

  return dedupeStrings([
    "project.name",
    "project.addressOrMarketLocation",
    "project.clientOwnerOrBidSolicitor",
    "project.estimatorOrInternalBidContact",
    "project.bidDueDates",
    "itbInstructions.documentAccessInstructions",
    "classification.sector",
    "classification.facilityType",
    "classification.workType",
    "classification.contextTags",
    "globalAttributes.squareFeet",
    "globalAttributes.floors",
    "globalAttributes.buildingCondition",
    "globalAttributes.projectCsiVersion",
    "globalAttributes.siteScope",
    "globalAttributes.envelopeScope",
    "logistics.siteWalkStatus",
    "procurement.publicPrivate",
    ...explicitRequirements,
  ]);
}

export function getPackageReviewRequirements(profile: ProjectProfile): string[] {
  const setupEffects = evaluateProjectSetupRules(profile).effects;
  const requirementLabels = setupEffects
    .filter((effect) => effect.type === "ADD_ITB_REQUIREMENT")
    .map((effect) => effect.label)
    .filter((label): label is string => Boolean(label));

  return dedupeStrings([
    "include / exclude decision",
    "split / combine decision",
    "package name",
    "trade / specialization",
    "CSI tags",
    "CSI tag roles: core / optional / possible / excluded",
    "scope summary",
    "package-specific finish level",
    "package-specific work intensity",
    "package-specific demo intensity if relevant",
    "package-specific MEP coordination intensity if relevant",
    "package-specific low voltage / controls / specialty system intensity if relevant",
    "clarifications",
    "exclusions",
    "requested alternates",
    "requested allowances",
    "requested unit prices",
    "required attachments/forms",
    "subcontractor recipient review status",
    ...requirementLabels,
  ]);
}

function isContextTagAvailableForProfile(
  availability: ContextTagAvailability,
  profile: ProjectProfile,
): boolean {
  const { sector, facilityType, workType, contextTags } = profile.classification;
  const matchesSector = !availability.sectors || availability.sectors.includes(sector);
  const matchesFacilityType =
    !availability.facilityTypes ||
    (facilityType !== undefined && availability.facilityTypes.includes(facilityType));
  const matchesWorkType = !availability.workTypes || availability.workTypes.includes(workType);
  const matchesRequiredContext =
    !availability.requiresAnyContext ||
    availability.requiresAnyContext.some((contextTag) => contextTags.includes(contextTag));

  return matchesSector && matchesFacilityType && matchesWorkType && matchesRequiredContext;
}

function collectFieldPaths(effects: readonly ProjectSetupRuleEffect[]): string[] {
  return dedupeStrings(
    effects
      .map((effect) => effect.targetFieldPath)
      .filter((fieldPath): fieldPath is string => Boolean(fieldPath)),
  );
}

function getOptionLabel<TId extends string>(
  id: TId,
  options: readonly ProjectProfileOption<TId>[],
): string {
  return options.find((option) => option.id === id)?.label ?? id;
}

function compareOptions<TId extends string>(
  leftOption: ProjectProfileOption<TId>,
  rightOption: ProjectProfileOption<TId>,
): number {
  return leftOption.sortOrder - rightOption.sortOrder || leftOption.label.localeCompare(rightOption.label);
}

function dedupeStrings(values: readonly string[]): string[] {
  return [...new Set(values)];
}
