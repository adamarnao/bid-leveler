import {
  getCsiCatalogTree,
  getCsiDivisions,
  getCsiSections,
  getCsiSectionsByDivision,
  resolveCsiCatalogItem,
  resolveCsiDivision,
  resolveCsiSection,
} from "@/lib/csiCatalog";
import {
  CsiCatalogItem,
  CsiCatalogTreeNode,
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

export function getProjectCsiTree(
  version: CsiMasterFormatVersion
): CsiCatalogTreeNode[] {
  return getCsiCatalogTree(version);
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

export function getProjectSelectedCsiItems(
  version: CsiMasterFormatVersion,
  selection: StoredProjectCsiSelection | undefined
): CsiCatalogItem[] {
  const validSelection = validateProjectCsiSelection(selection, version);
  const selectedItems = new Map<string, CsiCatalogItem>();

  validSelection.divisionIds.forEach((divisionId) => {
    const divisionItem = resolveProjectDivisionCatalogItem(version, divisionId);

    if (divisionItem) selectedItems.set(divisionItem.id, divisionItem);
  });

  validSelection.sectionIds.forEach((sectionId) => {
    const selectedItem = resolveProjectCsiItem(version, sectionId);
    if (selectedItem) selectedItems.set(selectedItem.id, selectedItem);
  });

  return Array.from(selectedItems.values()).sort(compareCatalogItems);
}

export function isProjectCsiItemSelected(
  version: CsiMasterFormatVersion,
  selectedIds: string[],
  itemId: string
): boolean {
  return selectedIds.some((selectedId) =>
    projectCsiIdsReferToSameItem(version, selectedId, itemId)
  );
}

export function toggleProjectCsiItemSelection(
  selection: StoredProjectCsiSelection | undefined,
  version: CsiMasterFormatVersion,
  itemId: string,
  checked: boolean
): StoredProjectCsiSelection {
  const validSelection = validateProjectCsiSelection(selection, version);
  const item = resolveProjectCsiItem(version, itemId);

  if (!item) return validSelection;

  const isDivision = item.level === 1;

  if (isDivision) {
    const divisionIds = checked
      ? addUnique(validSelection.divisionIds, item.divisionId)
      : validSelection.divisionIds.filter(
          (divisionId) => divisionId !== item.divisionId
        );

    return {
      ...validSelection,
      divisionIds,
      updatedAt: new Date().toISOString(),
    };
  }

  const sectionIds = checked
    ? addUnique(validSelection.sectionIds, item.id)
    : validSelection.sectionIds.filter(
        (sectionId) => !projectCsiIdsReferToSameItem(version, sectionId, item.id)
      );
  const divisionIds = checked
    ? addUnique(validSelection.divisionIds, item.divisionId)
    : validSelection.divisionIds;

  return {
    ...validSelection,
    divisionIds,
    sectionIds,
    updatedAt: new Date().toISOString(),
  };
}

export function getSelectedProjectCsiSummary(
  version: CsiMasterFormatVersion,
  selection: StoredProjectCsiSelection | undefined
) {
  const selectedItems = getProjectSelectedCsiItems(version, selection);
  const divisionGroups = new Map<
    string,
    {
      division: CsiCatalogItem;
      items: CsiCatalogItem[];
    }
  >();

  selectedItems.forEach((item) => {
    const division = resolveProjectDivisionCatalogItem(version, item.divisionId);

    if (!division) return;

    const group =
      divisionGroups.get(division.id) ?? {
        division,
        items: [],
      };

    group.items.push(item);
    divisionGroups.set(division.id, group);
  });

  return Array.from(divisionGroups.values())
    .map((group) => ({
      ...group,
      items: group.items.sort(compareCatalogItems),
    }))
    .sort((groupA, groupB) => compareCatalogItems(groupA.division, groupB.division));
}

function resolveProjectDivisionCatalogItem(
  version: CsiMasterFormatVersion,
  divisionIdOrNumber: string
) {
  const division = resolveProjectCsiDivision(version, divisionIdOrNumber);

  if (!division) return undefined;

  const divisionCatalogNumber =
    version === "MASTERFORMAT_2004_PLUS"
      ? `${division.number} 00 00`
      : `${division.number}000`;

  return resolveCsiCatalogItem(version, divisionCatalogNumber);
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

function compareCatalogItems(itemA: CsiCatalogItem, itemB: CsiCatalogItem) {
  return (
    itemA.sortOrder - itemB.sortOrder ||
    itemA.number.localeCompare(itemB.number, undefined, { numeric: true })
  );
}

function addUnique(values: string[], ...newValues: string[]) {
  return Array.from(new Set([...values, ...newValues]));
}

function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}
