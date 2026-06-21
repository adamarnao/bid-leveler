import {
  contextTagAvailability,
  projectContextTagOptions,
  projectSectorOptions,
  projectWorkTypeOptions,
  sectorWorkTypeLabels,
} from "./defaultProjectClassifications";
import {
  ProjectClassification,
  ProjectClassificationInput,
  ProjectClassificationOption,
  ProjectContextTagId,
  ProjectSectorId,
  ProjectWorkTypeId,
} from "./types";

const sectorIds = new Set<ProjectSectorId>(projectSectorOptions.map((option) => option.id));
const workTypeIds = new Set<ProjectWorkTypeId>(projectWorkTypeOptions.map((option) => option.id));
const contextTagIds = new Set<ProjectContextTagId>(
  projectContextTagOptions.map((option) => option.id)
);

export function getProjectSectorOptions(): ProjectClassificationOption<ProjectSectorId>[] {
  return [...projectSectorOptions].sort(compareOptions);
}

export function getProjectWorkTypeOptions(): ProjectClassificationOption<ProjectWorkTypeId>[] {
  return [...projectWorkTypeOptions].sort(compareOptions);
}

export function getProjectContextTagOptions(): ProjectClassificationOption<ProjectContextTagId>[] {
  return [...projectContextTagOptions].sort(compareOptions);
}

export function getContextTagOptionsForClassification({
  sector,
  workType,
}: {
  sector?: string | null;
  workType?: string | null;
}): ProjectClassificationOption<ProjectContextTagId>[] {
  const normalizedSector = sector ? normalizeProjectSectorId(sector) : undefined;
  const normalizedWorkType = workType ? normalizeProjectWorkTypeId(workType) : undefined;
  const optionById = new Map(projectContextTagOptions.map((option) => [option.id, option]));

  return contextTagAvailability
    .filter((availability) =>
      isContextTagAvailableForClassification(availability, normalizedSector, normalizedWorkType)
    )
    .map((availability) => optionById.get(availability.contextTag))
    .filter((option): option is ProjectClassificationOption<ProjectContextTagId> =>
      Boolean(option)
    )
    .sort(compareOptions);
}

export function normalizeProjectSectorId(value: string): ProjectSectorId | undefined {
  return normalizeClassificationId(value, sectorIds);
}

export function normalizeProjectWorkTypeId(value: string): ProjectWorkTypeId | undefined {
  return normalizeClassificationId(value, workTypeIds);
}

export function normalizeProjectContextTagId(value: string): ProjectContextTagId | undefined {
  return normalizeClassificationId(value, contextTagIds);
}

export function getWorkTypeOptionsForSector(
  sector?: string | null
): ProjectClassificationOption<ProjectWorkTypeId>[] {
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
  return {
    sectorIds: normalizeIds(
      [...(input?.sectorIds ?? []), ...(input?.sectors ?? [])],
      normalizeProjectSectorId
    ),
    workTypeIds: normalizeIds(
      [...(input?.workTypeIds ?? []), ...(input?.workTypes ?? [])],
      normalizeProjectWorkTypeId
    ),
    contextTagIds: normalizeIds(
      [...(input?.contextTagIds ?? []), ...(input?.contextTags ?? [])],
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

function isContextTagAvailableForClassification(
  availability: (typeof contextTagAvailability)[number],
  sector: ProjectSectorId | undefined,
  workType: ProjectWorkTypeId | undefined
): boolean {
  const matchesSector =
    !availability.sectors || (sector !== undefined && availability.sectors.includes(sector));
  const matchesWorkType =
    !availability.workTypes ||
    (workType !== undefined && availability.workTypes.includes(workType));

  return matchesSector && matchesWorkType;
}

function normalizeClassificationId<TId extends string>(
  value: string,
  allowedIds: ReadonlySet<TId>
): TId | undefined {
  const normalizedValue = value.trim().toLowerCase();
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

function compareOptions<TId extends string>(
  left: ProjectClassificationOption<TId>,
  right: ProjectClassificationOption<TId>
): number {
  return left.sortOrder - right.sortOrder || left.label.localeCompare(right.label);
}
