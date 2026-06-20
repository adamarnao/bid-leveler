import {
  projectContextTagOptions,
  projectSectorOptions,
  projectWorkTypeOptions,
} from "./defaultProjectClassifications";
import {
  ProjectClassification,
  ProjectClassificationInput,
  ProjectClassificationOption,
  ProjectContextTagId,
  ProjectSectorId,
  ProjectWorkTypeId,
} from "./types";

const sectorIds = new Set(projectSectorOptions.map((option) => option.id));
const workTypeIds = new Set(projectWorkTypeOptions.map((option) => option.id));
const contextTagIds = new Set(projectContextTagOptions.map((option) => option.id));

export function getProjectSectorOptions(): ProjectClassificationOption<ProjectSectorId>[] {
  return [...projectSectorOptions].sort(compareOptions);
}

export function getProjectWorkTypeOptions(): ProjectClassificationOption<ProjectWorkTypeId>[] {
  return [...projectWorkTypeOptions].sort(compareOptions);
}

export function getProjectContextTagOptions(): ProjectClassificationOption<ProjectContextTagId>[] {
  return [...projectContextTagOptions].sort(compareOptions);
}

export function normalizeProjectClassification(
  input?: ProjectClassificationInput | null
): ProjectClassification {
  return {
    sectorIds: normalizeIds(
      [...(input?.sectorIds ?? []), ...(input?.sectors ?? [])],
      sectorIds
    ) as ProjectSectorId[],
    workTypeIds: normalizeIds(
      [...(input?.workTypeIds ?? []), ...(input?.workTypes ?? [])],
      workTypeIds
    ) as ProjectWorkTypeId[],
    contextTagIds: normalizeIds(
      [...(input?.contextTagIds ?? []), ...(input?.contextTags ?? [])],
      contextTagIds
    ) as ProjectContextTagId[],
  };
}

export function buildProjectClassificationLabel(classification: ProjectClassificationInput): string {
  const normalizedClassification = normalizeProjectClassification(classification);
  const labels = [
    ...getLabels(normalizedClassification.sectorIds, projectSectorOptions),
    ...getLabels(normalizedClassification.workTypeIds, projectWorkTypeOptions),
    ...getLabels(normalizedClassification.contextTagIds, projectContextTagOptions),
  ];

  return labels.length > 0 ? labels.join(" / ") : "Unclassified Project";
}

function normalizeIds<TId extends string>(
  values: readonly string[],
  allowedIds: ReadonlySet<TId>
): TId[] {
  const normalizedIds: TId[] = [];
  const seenIds = new Set<TId>();

  values.forEach((value) => {
    const normalizedValue = value.trim().toLowerCase();
    if (!allowedIds.has(normalizedValue as TId)) return;

    const normalizedId = normalizedValue as TId;
    if (seenIds.has(normalizedId)) return;

    seenIds.add(normalizedId);
    normalizedIds.push(normalizedId);
  });

  return normalizedIds;
}

function getLabels<TId extends string>(
  ids: readonly TId[],
  options: readonly ProjectClassificationOption<TId>[]
): string[] {
  const optionById = new Map(options.map((option) => [option.id, option.label]));

  return ids.map((id) => optionById.get(id) ?? id);
}

function compareOptions<TId extends string>(
  left: ProjectClassificationOption<TId>,
  right: ProjectClassificationOption<TId>
): number {
  return left.sortOrder - right.sortOrder || left.label.localeCompare(right.label);
}
