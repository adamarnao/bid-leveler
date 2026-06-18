import { csiCrosswalkEntries } from "@/data/csiCrosswalk";
import {
  getCrosswalkEntriesFor1995,
  getCrosswalkEntriesForCurrent,
} from "@/lib/csiCrosswalk";
import {
  getCsiCatalogTree,
  getCsiDivisions,
  getCsiSections,
  resolveCsiCatalogItem,
  resolveCsiDivision,
  resolveCsiSection,
} from "@/lib/csiCatalog";
import {
  getSectionNumbersForSubcontractor,
  getSubcontractorCoverageForVersion,
} from "@/lib/subcontractorCsiCoverage";
import {
  CsiCatalogTreeNode,
  CsiDivision,
  CsiMasterFormatVersion,
} from "@/types/Csi";
import {
  Subcontractor,
  SubcontractorContactScope,
} from "@/types/Subcontractor";

export type CsiPickerSectionOption = {
  id: string;
  divisionId: string;
  number: string;
  name: string;
  additionalTitleCount: number;
};

export function isRealCsiDivisionId(divisionId: string | undefined) {
  if (!divisionId) return false;
  if (divisionId === "unassigned") return false;

  return Boolean(
    resolveCsiDivision("MASTERFORMAT_CURRENT", divisionId) ??
      resolveCsiDivision("MASTERFORMAT_1995", divisionId)
  );
}

export function getVisibleResponsibilityCsiTree(
  version: CsiMasterFormatVersion,
  subcontractor: Subcontractor,
  scopes: SubcontractorContactScope[],
  showAll: boolean
): CsiCatalogTreeNode[] {
  const tree = getCsiCatalogTree(version);

  if (showAll) return tree;

  const visibleItemIds = getVisibleResponsibilityItemIds(
    version,
    subcontractor,
    scopes
  );

  return tree
    .map((node) => filterCsiTreeNode(node, visibleItemIds))
    .filter(isDefined);
}

export function getCsiCoverageTree(
  version: CsiMasterFormatVersion
): CsiCatalogTreeNode[] {
  return getCsiCatalogTree(version);
}

export function getVisibleResponsibilityDivisions(
  allDivisions: CsiDivision[],
  allSections: CsiPickerSectionOption[],
  subcontractor: Subcontractor,
  scopes: SubcontractorContactScope[],
  showAll: boolean
) {
  if (showAll) return allDivisions;

  const sourceVersion = getSubcontractorSourceVersion(subcontractor);
  const selectedDivisionIds = new Set<string>();

  subcontractor.csiCoverage.divisionIds.forEach((divisionId) => {
    addResolvedDivisionId(selectedDivisionIds, sourceVersion, divisionId);
  });
  subcontractor.csiCoverage.sectionIds.forEach((sectionId) => {
    addResolvedSectionDivisionId(selectedDivisionIds, sourceVersion, sectionId);
  });
  scopes.flatMap((scope) => scope.divisionIds ?? []).forEach((divisionId) => {
    addResolvedDivisionId(selectedDivisionIds, sourceVersion, divisionId);
  });
  scopes.flatMap((scope) => scope.sectionIds ?? []).forEach((sectionId) => {
    const optionDivisionId = getSectionDivisionIdFromOptions(sectionId, allSections);

    addResolvedSectionDivisionId(
      selectedDivisionIds,
      sourceVersion,
      optionDivisionId ?? sectionId
    );
  });

  return allDivisions.filter((division) => selectedDivisionIds.has(division.id));
}

export function getVisibleResponsibilitySections(
  allSections: CsiPickerSectionOption[],
  subcontractor: Subcontractor,
  scopes: SubcontractorContactScope[],
  showAll: boolean
) {
  if (showAll) return allSections;

  const sourceVersion = getSubcontractorSourceVersion(subcontractor);
  const selectedSectionIds = new Set<string>();

  subcontractor.csiCoverage.sectionIds.forEach((sectionId) => {
    addResolvedSectionId(selectedSectionIds, sourceVersion, sectionId);
  });
  scopes.flatMap((scope) => scope.sectionIds ?? []).forEach((sectionId) => {
    addResolvedSectionId(selectedSectionIds, sourceVersion, sectionId);
  });

  return allSections.filter((section) => selectedSectionIds.has(section.id));
}

export function getSelectedSectionGroups(
  divisions: CsiDivision[],
  sections: CsiPickerSectionOption[],
  selectedSectionIds: Set<string>
) {
  return divisions
    .map((division) => ({
      divisionId: division.id,
      divisionLabel: `${division.number} - ${division.name}`,
      sections: sections.filter(
        (section) =>
          section.divisionId === division.id && selectedSectionIds.has(section.id)
      ),
    }))
    .filter((group) => group.sections.length > 0);
}

export function getDivisionName(divisionId: string) {
  if (!isRealCsiDivisionId(divisionId)) return "";

  const division =
    resolveCsiDivision("MASTERFORMAT_CURRENT", divisionId) ??
    resolveCsiDivision("MASTERFORMAT_1995", divisionId);

  return division ? `${division.number} - ${division.name}` : divisionId;
}

export function getSectionLabel(sectionId: string) {
  const section = getAllCsiSectionOptions().find((item) => item.id === sectionId);

  return section ? `${section.number} - ${section.name}` : sectionId;
}

export function getSectionDivisionId(sectionId: string) {
  const section = getAllCsiSectionOptions().find((item) => item.id === sectionId);

  return section?.divisionId ?? "";
}

export function getSectionDivisionIdFromOptions(
  sectionId: string,
  sectionOptions: CsiPickerSectionOption[]
) {
  return sectionOptions.find((section) => section.id === sectionId)?.divisionId;
}

export function csiDivisionIdsContain(
  version: CsiMasterFormatVersion,
  divisionIds: string[] | undefined,
  divisionId: string
) {
  const resolvedDivisionId = resolveDivisionIdentity(version, divisionId);

  return (divisionIds ?? []).some(
    (candidateDivisionId) =>
      resolveDivisionIdentity(version, candidateDivisionId) === resolvedDivisionId
  );
}

export function csiSectionIdsContain(
  version: CsiMasterFormatVersion,
  sectionIds: string[] | undefined,
  sectionId: string
) {
  const resolvedSectionId = resolveSectionIdentity(version, sectionId);

  return (sectionIds ?? []).some(
    (candidateSectionId) =>
      resolveSectionIdentity(version, candidateSectionId) === resolvedSectionId
  );
}

export function filterOutCsiSectionIds(
  version: CsiMasterFormatVersion,
  sectionIds: string[] | undefined,
  idsToRemove: string[]
) {
  return (sectionIds ?? []).filter(
    (sectionId) =>
      !idsToRemove.some((idToRemove) =>
        csiSectionIdsReferToSameItem(version, sectionId, idToRemove)
      )
  );
}

export function filterOutCsiDivisionIds(
  version: CsiMasterFormatVersion,
  divisionIds: string[] | undefined,
  idsToRemove: string[]
) {
  return (divisionIds ?? []).filter(
    (divisionId) =>
      !idsToRemove.some((idToRemove) =>
        csiDivisionIdsReferToSameItem(version, divisionId, idToRemove)
      )
  );
}

export function csiSectionIdsReferToSameItem(
  version: CsiMasterFormatVersion,
  sectionIdA: string,
  sectionIdB: string
) {
  return (
    resolveSectionIdentity(version, sectionIdA) ===
    resolveSectionIdentity(version, sectionIdB)
  );
}

export function csiDivisionIdsReferToSameItem(
  version: CsiMasterFormatVersion,
  divisionIdA: string,
  divisionIdB: string
) {
  return (
    resolveDivisionIdentity(version, divisionIdA) ===
    resolveDivisionIdentity(version, divisionIdB)
  );
}

export function getDisplayedSectionIds(
  subcontractor: Subcontractor,
  pickerDisplayVersion: CsiMasterFormatVersion,
  visibleSections: CsiPickerSectionOption[]
) {
  const sourceVersion =
    subcontractor.csiCoverage.sourceVersion ?? "MASTERFORMAT_CURRENT";

  if (sourceVersion === pickerDisplayVersion) {
    return new Set(subcontractor.csiCoverage.sectionIds);
  }

  const equivalentSectionNumbers = new Set(
    getSubcontractorCoverageForVersion(
      subcontractor,
      pickerDisplayVersion
    ).sectionNumbers.map(normalizeSectionNumber)
  );

  return new Set(
    visibleSections
      .filter((section) =>
        equivalentSectionNumbers.has(normalizeSectionNumber(section.number))
      )
      .map((section) => section.id)
  );
}

export function getDisplayedDivisionIds(
  subcontractor: Subcontractor,
  pickerDisplayVersion: CsiMasterFormatVersion,
  visibleDivisions: CsiDivision[],
  visibleSections: CsiPickerSectionOption[],
  selectedSectionIds: Set<string>
) {
  const sourceVersion =
    subcontractor.csiCoverage.sourceVersion ?? "MASTERFORMAT_CURRENT";

  if (sourceVersion === pickerDisplayVersion) {
    return new Set(subcontractor.csiCoverage.divisionIds);
  }

  const selectedDivisionIds = new Set(
    visibleSections
      .filter((section) => selectedSectionIds.has(section.id))
      .map((section) => section.divisionId)
  );
  const equivalentDivisionNumbers = new Set(
    getSubcontractorCoverageForVersion(
      subcontractor,
      pickerDisplayVersion
    ).divisionNumbers.map(normalizeSectionNumber)
  );

  visibleDivisions.forEach((division) => {
    if (equivalentDivisionNumbers.has(normalizeSectionNumber(division.number))) {
      selectedDivisionIds.add(division.id);
    }
  });

  return selectedDivisionIds;
}

export function getDivisionIdsForSections(sectionIds: string[]) {
  return Array.from(
    new Set(sectionIds.map(getSectionDivisionId).filter(Boolean))
  );
}

export function getBestPrimaryDivisionId(
  currentPrimaryDivisionId: string,
  selectedDivisionIds: string[],
  fallbackDivisionId: string
) {
  if (selectedDivisionIds.includes(currentPrimaryDivisionId)) {
    return currentPrimaryDivisionId;
  }

  if (selectedDivisionIds.includes(fallbackDivisionId)) {
    return fallbackDivisionId;
  }

  return selectedDivisionIds[0] ?? fallbackDivisionId ?? currentPrimaryDivisionId;
}

export function getCrosswalkIssueCount(
  subcontractor: Subcontractor,
  pickerDisplayVersion: CsiMasterFormatVersion
) {
  const sourceVersion =
    subcontractor.csiCoverage.sourceVersion ?? "MASTERFORMAT_CURRENT";

  if (sourceVersion === pickerDisplayVersion) return 0;

  return getSectionNumbersForSubcontractor(subcontractor).filter((sectionNumber) => {
    const entries =
      sourceVersion === "MASTERFORMAT_1995"
        ? getCrosswalkEntriesFor1995(sectionNumber)
        : getCrosswalkEntriesForCurrent(sectionNumber);

    if (entries.length === 0) return true;

    return entries.some((entry) => {
      const missingTarget =
        sourceVersion === "MASTERFORMAT_1995"
          ? !entry.targetSection.sectionNumber
          : !entry.sourceSection.sectionNumber;

      return (
        missingTarget ||
        entry.relationship === "MANY_TO_MANY" ||
        entry.relationship === "INCOMPLETE" ||
        entry.mappingConfidence === "SPECIAL_CASE" ||
        entry.mappingConfidence === "INCOMPLETE"
      );
    });
  }).length;
}

export function getCsiDivisionOptions(
  version: CsiMasterFormatVersion
): CsiDivision[] {
  return getCsiDivisions(version);
}

export function getCsiSectionOptions(
  version: CsiMasterFormatVersion
): CsiPickerSectionOption[] {
  return getCsiSections(version).map((section) => ({
    id: section.id,
    divisionId: section.divisionId,
    number: section.number,
    name: section.name,
    additionalTitleCount: 0,
  }));
}

export function get1995SectionOptions(): CsiPickerSectionOption[] {
  const sectionsByNumber = new Map<string, Set<string>>();

  csiCrosswalkEntries.forEach((entry) => {
    const sectionNumber = entry.sourceSection.sectionNumber;
    const title = entry.sourceSection.title;

    if (!sectionNumber) return;

    const titles = sectionsByNumber.get(sectionNumber) ?? new Set<string>();

    if (title) titles.add(title);
    sectionsByNumber.set(sectionNumber, titles);
  });

  return Array.from(sectionsByNumber.entries())
    .map(([sectionNumber, titleSet]) => {
      const titles = Array.from(titleSet);
      const divisionNumber = sectionNumber.slice(0, 2);

      return {
        id: sectionNumber,
        divisionId: `1995-${divisionNumber}`,
        number: sectionNumber,
        name: titles[0] ?? "Untitled Section",
        additionalTitleCount: Math.max(titles.length - 1, 0),
      };
    })
    .sort((a, b) => a.number.localeCompare(b.number));
}

export function getAllCsiSectionOptions(): CsiPickerSectionOption[] {
  return [
    ...getCsiSectionOptions("MASTERFORMAT_CURRENT"),
    ...getCsiSectionOptions("MASTERFORMAT_1995"),
  ];
}

function normalizeSectionNumber(value: string) {
  return value.replace(/\u00a0/g, " ").trim();
}

function getSubcontractorSourceVersion(subcontractor: Subcontractor) {
  return subcontractor.csiCoverage.sourceVersion ?? "MASTERFORMAT_CURRENT";
}

function getVisibleResponsibilityItemIds(
  version: CsiMasterFormatVersion,
  subcontractor: Subcontractor,
  scopes: SubcontractorContactScope[]
) {
  const visibleItemIds = new Set<string>();

  subcontractor.csiCoverage.divisionIds.forEach((divisionId) => {
    addResolvedItemAndAncestors(visibleItemIds, version, divisionId);
  });
  subcontractor.csiCoverage.sectionIds.forEach((sectionId) => {
    addResolvedItemAndAncestors(visibleItemIds, version, sectionId);
  });
  scopes.flatMap((scope) => scope.divisionIds ?? []).forEach((divisionId) => {
    addResolvedItemAndAncestors(visibleItemIds, version, divisionId);
  });
  scopes.flatMap((scope) => scope.sectionIds ?? []).forEach((sectionId) => {
    addResolvedItemAndAncestors(visibleItemIds, version, sectionId);
  });

  return visibleItemIds;
}

function addResolvedItemAndAncestors(
  itemIds: Set<string>,
  version: CsiMasterFormatVersion,
  itemIdOrNumber: string | undefined
) {
  if (!itemIdOrNumber) return;

  const item =
    resolveCsiCatalogItem(version, itemIdOrNumber) ??
    resolveCsiCatalogItem(version, resolveDivisionIdentity(version, itemIdOrNumber));

  if (!item) return;

  itemIds.add(item.id);

  let parentId = item.parentId;
  while (parentId) {
    const parent = resolveCsiCatalogItem(version, parentId);
    if (!parent) break;

    itemIds.add(parent.id);
    parentId = parent.parentId;
  }
}

function filterCsiTreeNode(
  node: CsiCatalogTreeNode,
  visibleItemIds: Set<string>
): CsiCatalogTreeNode | undefined {
  const children = node.children
    .map((child) => filterCsiTreeNode(child, visibleItemIds))
    .filter(isDefined);

  if (!visibleItemIds.has(node.item.id) && children.length === 0) {
    return undefined;
  }

  return {
    item: node.item,
    children,
  };
}

function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}

function addResolvedDivisionId(
  divisionIds: Set<string>,
  version: CsiMasterFormatVersion,
  divisionIdOrNumber: string | undefined
) {
  if (!divisionIdOrNumber) return;

  const division = resolveCsiDivision(version, divisionIdOrNumber);

  if (division) {
    divisionIds.add(division.id);
    return;
  }

  const item = resolveCsiCatalogItem(version, divisionIdOrNumber);
  if (item) divisionIds.add(item.divisionId);
}

function addResolvedSectionDivisionId(
  divisionIds: Set<string>,
  version: CsiMasterFormatVersion,
  sectionIdOrNumber: string | undefined
) {
  if (!sectionIdOrNumber) return;

  const section = resolveCsiSection(version, sectionIdOrNumber);
  if (section) {
    divisionIds.add(section.divisionId);
    return;
  }

  const item = resolveCsiCatalogItem(version, sectionIdOrNumber);
  if (item) {
    divisionIds.add(item.divisionId);
    return;
  }

  addResolvedDivisionId(divisionIds, version, sectionIdOrNumber);
}

function addResolvedSectionId(
  sectionIds: Set<string>,
  version: CsiMasterFormatVersion,
  sectionIdOrNumber: string | undefined
) {
  if (!sectionIdOrNumber) return;

  const section = resolveCsiSection(version, sectionIdOrNumber);
  if (section) {
    sectionIds.add(section.id);
    return;
  }

  const item = resolveCsiCatalogItem(version, sectionIdOrNumber);
  if (item) sectionIds.add(item.id);
}

function resolveDivisionIdentity(
  version: CsiMasterFormatVersion,
  divisionIdOrNumber: string
) {
  const division = resolveCsiDivision(version, divisionIdOrNumber);
  if (division) return division.id;

  const item = resolveCsiCatalogItem(version, divisionIdOrNumber);
  if (item) return item.divisionId;

  return divisionIdOrNumber;
}

function resolveSectionIdentity(
  version: CsiMasterFormatVersion,
  sectionIdOrNumber: string
) {
  const section = resolveCsiSection(version, sectionIdOrNumber);
  if (section) return section.id;

  const item = resolveCsiCatalogItem(version, sectionIdOrNumber);
  if (item) return item.id;

  return sectionIdOrNumber;
}
