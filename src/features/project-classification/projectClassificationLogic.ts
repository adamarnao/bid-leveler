import {
  contextTagAvailability,
  projectContextTagOptions,
  projectSectorOptions,
  projectWorkTypeOptions,
  sectorWorkTypeLabels,
} from "./defaultProjectClassifications";
import {
  CanonicalProjectContextTagId,
  CanonicalProjectSectorId,
  CanonicalProjectWorkTypeId,
  ProjectClassification,
  ProjectClassificationInput,
  ProjectClassificationOption,
} from "./types";

const sectorIds = new Set(projectSectorOptions.map((option) => option.id));
const workTypeIds = new Set(projectWorkTypeOptions.map((option) => option.id));
const contextTagIds = new Set(projectContextTagOptions.map((option) => option.id));

const sectorAliasMap: Record<string, CanonicalProjectSectorId> = {
  civil: "civil_sitework",
  sitework: "civil_sitework",
  "site/civil": "civil_sitework",
  "civil / sitework": "civil_sitework",
  "civil-sitework": "civil_sitework",
  missioncritical: "mission_critical",
  "mission-critical": "mission_critical",
  mission_critical: "mission_critical",
};

const workTypeAliasMap: Record<string, CanonicalProjectWorkTypeId> = {
  tenant_improvement: "interior_fit_out_renovation",
  "tenant improvement": "interior_fit_out_renovation",
  ti: "interior_fit_out_renovation",
  fit_out: "interior_fit_out_renovation",
  "fit-out": "interior_fit_out_renovation",
  "fit out": "interior_fit_out_renovation",
  build_out: "interior_fit_out_renovation",
  "build-out": "interior_fit_out_renovation",
  "build out": "interior_fit_out_renovation",
  interior_renovation: "interior_fit_out_renovation",
  "interior renovation": "interior_fit_out_renovation",
  occupied_renovation: "interior_fit_out_renovation",
  "occupied renovation": "interior_fit_out_renovation",
  remodel: "interior_fit_out_renovation",
  phased_renovation: "interior_fit_out_renovation",
  "phased renovation": "interior_fit_out_renovation",
  white_box: "interior_fit_out_renovation",
  "white box": "interior_fit_out_renovation",
  shell_completion: "interior_fit_out_renovation",
  "shell completion": "interior_fit_out_renovation",
  ground_up: "ground_up_new_construction",
  "ground-up": "ground_up_new_construction",
  "ground up": "ground_up_new_construction",
  "new construction": "ground_up_new_construction",
  addition: "addition_expansion",
  expansion: "addition_expansion",
  adaptive_reuse: "restoration_adaptive_reuse",
  "adaptive reuse": "restoration_adaptive_reuse",
  restoration: "restoration_adaptive_reuse",
  sitework_only: "sitework_civil_only",
  "sitework only": "sitework_civil_only",
  "civil only": "sitework_civil_only",
  demolition_only: "demolition_abatement_only",
  "demolition only": "demolition_abatement_only",
  "abatement only": "demolition_abatement_only",
};

const contextAliasMap: Record<string, CanonicalProjectContextTagId> = {
  occupied_building: "occupied_site",
  "occupied building": "occupied_site",
  "active operations": "occupied_site",
  cleanroom: "cleanroom_context",
  "clean room": "cleanroom_context",
  "cleanroom context": "cleanroom_context",
  icra: "infection_control",
  "infection control": "infection_control",
  "medical gas": "medical_gas_required",
  "medical gas required": "medical_gas_required",
  "nurse call": "nurse_call_required",
  "nurse call required": "nurse_call_required",
  "lead lined construction": "lead_lined_construction",
  "lead-lined construction": "lead_lined_construction",
  "walk-in cooler/freezer": "walk_in_cooler_freezer",
  "walk-in cooler freezer": "walk_in_cooler_freezer",
  "grease interceptor": "grease_interceptor",
  "data center": "data_center",
  "airport secure area": "airport_secure_area",
  "marine waterfront": "marine_waterfront",
  "historic restoration": "historic_restoration",
  "structural retrofit": "structural_retrofit",
  "change of use": "change_of_use",
  "sitework scope": "sitework_scope",
  "exterior envelope scope": "exterior_envelope_scope",
  "roof work": "roof_work",
  "wood framing": "wood_framing",
  "masonry block building": "masonry_block_building",
  "kitchen bath renovation": "kitchen_bath_renovation",
  "siding exterior cladding": "siding_exterior_cladding",
  "windows exterior doors": "windows_exterior_doors",
};

const legacyWorkTypeContextCandidates: Record<string, CanonicalProjectContextTagId[]> = {
  occupied_renovation: ["occupied_site"],
  "occupied renovation": ["occupied_site"],
  phased_renovation: ["phased_work"],
  "phased renovation": ["phased_work"],
  white_box: ["white_box"],
  "white box": ["white_box"],
  shell_completion: ["white_box"],
  "shell completion": ["white_box"],
};

export function getProjectSectorOptions(): ProjectClassificationOption<CanonicalProjectSectorId>[] {
  return [...projectSectorOptions].sort(compareOptions);
}

export function getProjectWorkTypeOptions(): ProjectClassificationOption<CanonicalProjectWorkTypeId>[] {
  return [...projectWorkTypeOptions].sort(compareOptions);
}

export function getProjectContextTagOptions(): ProjectClassificationOption<CanonicalProjectContextTagId>[] {
  return [...projectContextTagOptions].sort(compareOptions);
}

export function normalizeProjectSectorId(value: string): CanonicalProjectSectorId | undefined {
  return normalizeClassificationId(value, sectorIds, sectorAliasMap);
}

export function normalizeProjectWorkTypeId(value: string): CanonicalProjectWorkTypeId | undefined {
  return normalizeClassificationId(value, workTypeIds, workTypeAliasMap);
}

export function normalizeProjectContextTagId(value: string): CanonicalProjectContextTagId | undefined {
  return normalizeClassificationId(value, contextTagIds, contextAliasMap);
}

export function getWorkTypeOptionsForSector(
  sector?: string | null
): ProjectClassificationOption<CanonicalProjectWorkTypeId>[] {
  const normalizedSector = sector ? normalizeProjectSectorId(sector) : undefined;

  return getProjectWorkTypeOptions().map((option) => ({
    ...option,
    label: getWorkTypeLabelForSector(option.id, normalizedSector),
  }));
}

export function getWorkTypeLabelForSector(
  workType: string,
  sector?: string | null
): string {
  const normalizedWorkType = normalizeProjectWorkTypeId(workType);
  if (!normalizedWorkType) return workType;

  const normalizedSector = sector ? normalizeProjectSectorId(sector) : undefined;
  const sectorLabel = normalizedSector
    ? sectorWorkTypeLabels.find(
        (item) => item.sector === normalizedSector && item.workType === normalizedWorkType
      )
    : undefined;

  return sectorLabel?.label ?? getOptionLabel(normalizedWorkType, projectWorkTypeOptions);
}

export function normalizeProjectClassification(
  input?: ProjectClassificationInput | null
): ProjectClassification {
  const rawWorkTypeValues = [...(input?.workTypeIds ?? []), ...(input?.workTypes ?? [])];
  const contextCandidatesFromLegacyWorkTypes = rawWorkTypeValues.flatMap((value) => {
    const normalizedValue = normalizeRawValue(value);
    return legacyWorkTypeContextCandidates[normalizedValue] ?? [];
  });

  return {
    sectorIds: normalizeIds(
      [...(input?.sectorIds ?? []), ...(input?.sectors ?? [])],
      normalizeProjectSectorId
    ),
    workTypeIds: normalizeIds(rawWorkTypeValues, normalizeProjectWorkTypeId),
    contextTagIds: normalizeIds(
      [
        ...(input?.contextTagIds ?? []),
        ...(input?.contextTags ?? []),
        ...contextCandidatesFromLegacyWorkTypes,
      ],
      normalizeProjectContextTagId
    ),
  };
}

export function buildProjectClassificationLabel(classification: ProjectClassificationInput): string {
  const normalizedClassification = normalizeProjectClassification(classification);
  const primarySector = normalizedClassification.sectorIds[0];
  const labels = [
    ...getLabels(normalizedClassification.sectorIds, projectSectorOptions),
    ...normalizedClassification.workTypeIds.map((workTypeId) =>
      getWorkTypeLabelForSector(workTypeId, primarySector)
    ),
    ...getLabels(normalizedClassification.contextTagIds, projectContextTagOptions),
  ];

  return labels.length > 0 ? labels.join(" / ") : "Unclassified Project";
}

export function getContextTagAvailability() {
  return [...contextTagAvailability];
}

function normalizeClassificationId<TId extends string>(
  value: string,
  allowedIds: ReadonlySet<TId>,
  aliasMap: Readonly<Record<string, TId>>
): TId | undefined {
  const normalizedValue = normalizeRawValue(value);
  const aliasId = aliasMap[normalizedValue];
  if (aliasId) return aliasId;
  if (allowedIds.has(normalizedValue as TId)) return normalizedValue as TId;
  return undefined;
}

function normalizeIds<TId extends string>(
  values: readonly string[],
  normalize: (value: string) => TId | undefined
): TId[] {
  const normalizedIds: TId[] = [];
  const seenIds = new Set<TId>();

  values.forEach((value) => {
    const normalizedId = normalize(value);
    if (!normalizedId || seenIds.has(normalizedId)) return;

    seenIds.add(normalizedId);
    normalizedIds.push(normalizedId);
  });

  return normalizedIds;
}

function getLabels<TId extends string>(
  ids: readonly TId[],
  options: readonly ProjectClassificationOption<TId>[]
): string[] {
  return ids.map((id) => getOptionLabel(id, options));
}

function getOptionLabel<TId extends string>(
  id: TId,
  options: readonly ProjectClassificationOption<TId>[]
): string {
  return options.find((option) => option.id === id)?.label ?? id;
}

function normalizeRawValue(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function compareOptions<TId extends string>(
  left: ProjectClassificationOption<TId>,
  right: ProjectClassificationOption<TId>
): number {
  return left.sortOrder - right.sortOrder || left.label.localeCompare(right.label);
}
