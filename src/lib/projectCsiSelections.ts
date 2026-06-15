import {
  getCsiDivisions,
  getCsiSections,
  getCsiSectionsByDivision,
  resolveCsiCatalogItem,
  resolveCsiDivision,
  resolveCsiSection,
} from "@/lib/csiCatalog";
import {
  CsiCatalogItem,
  CsiDivision,
  CsiMasterFormatVersion,
  CsiSection,
  StoredProjectCsiSelection,
} from "@/types/Csi";

export type ProjectCsiDisplayItem = CsiSection;

export function getProjectCsiDivisions(
  version: CsiMasterFormatVersion
): CsiDivision[] {
  return getCsiDivisions(version);
}

export function getProjectCsiSections(
  version: CsiMasterFormatVersion
): ProjectCsiDisplayItem[] {
  return getCsiSections(version);
}

export function getProjectCsiSectionsByDivision(
  version: CsiMasterFormatVersion,
  divisionId: string,
  selectedSectionIds: string[] = []
): ProjectCsiDisplayItem[] {
  const resolvedDivision = resolveProjectCsiDivision(version, divisionId);
  if (!resolvedDivision) return [];

  const sectionsById = new Map<string, ProjectCsiDisplayItem>();

  getCsiSectionsByDivision(version, resolvedDivision.id).forEach((section) => {
    sectionsById.set(section.id, section);
  });

  selectedSectionIds.forEach((sectionId) => {
    const selectedItem = resolveProjectCsiItem(version, sectionId);

    if (
      selectedItem &&
      selectedItem.divisionId === resolvedDivision.id &&
      !sectionsById.has(selectedItem.id)
    ) {
      sectionsById.set(selectedItem.id, catalogItemToProjectSection(selectedItem));
    }
  });

  return Array.from(sectionsById.values()).sort(compareProjectCsiItems);
}

export function validateProjectCsiSelection(
  selection: StoredProjectCsiSelection | undefined,
  version: CsiMasterFormatVersion
): StoredProjectCsiSelection {
  const selectedSectionIds = Array.isArray(selection?.sectionIds)
    ? selection.sectionIds.filter((sectionId) =>
        Boolean(resolveProjectCsiItem(version, sectionId))
      )
    : [];
  const sectionParentDivisionIds = selectedSectionIds
    .map((sectionId) => resolveProjectCsiItem(version, sectionId)?.divisionId)
    .filter(isDefined);
  const selectedDivisionIds = Array.isArray(selection?.divisionIds)
    ? selection.divisionIds
        .map((divisionId) => resolveProjectCsiDivision(version, divisionId)?.id)
        .filter(isDefined)
    : [];

  return {
    version,
    divisionIds: addUnique(selectedDivisionIds, ...sectionParentDivisionIds),
    sectionIds: selectedSectionIds,
    updatedAt: selection?.updatedAt ?? new Date().toISOString(),
  };
}

export function resolveProjectCsiItem(
  version: CsiMasterFormatVersion,
  sectionIdOrNumber: string
): CsiCatalogItem | undefined {
  const resolvedSection = resolveCsiSection(version, sectionIdOrNumber);

  return resolvedSection
    ? resolveCsiCatalogItem(version, resolvedSection.id)
    : resolveCsiCatalogItem(version, sectionIdOrNumber);
}

export function resolveProjectCsiDivision(
  version: CsiMasterFormatVersion,
  divisionIdOrNumber: string
): CsiDivision | undefined {
  return resolveCsiDivision(version, divisionIdOrNumber);
}

export function getProjectCsiDivisionLabel(
  version: CsiMasterFormatVersion,
  divisionIdOrNumber: string
) {
  const division = resolveProjectCsiDivision(version, divisionIdOrNumber);

  return division
    ? `Division ${division.number} - ${division.name}`
    : divisionIdOrNumber;
}

export function getProjectCsiSectionLabel(
  version: CsiMasterFormatVersion,
  sectionIdOrNumber: string
) {
  const item = resolveProjectCsiItem(version, sectionIdOrNumber);

  return item ? `${item.number} - ${item.name}` : sectionIdOrNumber;
}

export function compareProjectCsiSelectionIds(
  version: CsiMasterFormatVersion,
  leftId: string,
  rightId: string
) {
  const leftItem = resolveProjectCsiItem(version, leftId);
  const rightItem = resolveProjectCsiItem(version, rightId);

  return (leftItem?.number ?? leftId).localeCompare(
    rightItem?.number ?? rightId,
    undefined,
    { numeric: true }
  );
}

export function projectCsiIdsReferToSameItem(
  version: CsiMasterFormatVersion,
  leftId: string,
  rightId: string
) {
  if (leftId === rightId) return true;

  const leftItem = resolveProjectCsiItem(version, leftId);
  const rightItem = resolveProjectCsiItem(version, rightId);

  return Boolean(leftItem && rightItem && leftItem.id === rightItem.id);
}

function catalogItemToProjectSection(item: CsiCatalogItem): ProjectCsiDisplayItem {
  return {
    id: item.id,
    version: item.version,
    divisionId: item.divisionId,
    number: item.number,
    name: item.name,
    level: item.level,
    parentId: item.parentId,
    sortOrder: item.sortOrder,
  };
}

function compareProjectCsiItems(
  itemA: ProjectCsiDisplayItem,
  itemB: ProjectCsiDisplayItem
) {
  return itemA.number.localeCompare(itemB.number, undefined, { numeric: true });
}

function addUnique(values: string[], ...newValues: string[]) {
  return Array.from(new Set([...values, ...newValues]));
}

function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}
