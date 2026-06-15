import { csiCrosswalkEntries } from "@/data/csiCrosswalk";
import { mockCsiDivisions } from "@/data/mockCsiDivisions";
import { mockCsiSections } from "@/data/mockCsiSections";
import {
  getCrosswalkEntriesFor1995,
  getCrosswalkEntriesForCurrent,
} from "@/lib/csiCrosswalk";
import {
  getSectionNumbersForSubcontractor,
  getSubcontractorCoverageForVersion,
} from "@/lib/subcontractorCsiCoverage";
import { CsiDivision, CsiMasterFormatVersion } from "@/types/Csi";
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

export function getVisibleResponsibilityDivisions(
  allDivisions: CsiDivision[],
  allSections: CsiPickerSectionOption[],
  subcontractor: Subcontractor,
  scopes: SubcontractorContactScope[],
  showAll: boolean
) {
  if (showAll) return allDivisions;

  const selectedDivisionIds = new Set([
    ...subcontractor.csiCoverage.divisionIds,
    ...subcontractor.csiCoverage.sectionIds.map(getSectionDivisionId),
    ...scopes.flatMap((scope) => scope.divisionIds ?? []),
    ...scopes
      .flatMap((scope) => scope.sectionIds ?? [])
      .map((sectionId) =>
        getSectionDivisionIdFromOptions(sectionId, allSections) ??
        getSectionDivisionId(sectionId)
      ),
  ]);

  return allDivisions.filter((division) => selectedDivisionIds.has(division.id));
}

export function getVisibleResponsibilitySections(
  allSections: CsiPickerSectionOption[],
  subcontractor: Subcontractor,
  scopes: SubcontractorContactScope[],
  showAll: boolean
) {
  if (showAll) return allSections;

  const selectedSectionIds = new Set([
    ...subcontractor.csiCoverage.sectionIds,
    ...scopes.flatMap((scope) => scope.sectionIds ?? []),
  ]);

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
  const division = mockCsiDivisions.find((item) => item.id === divisionId);

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
  return mockCsiDivisions.filter((division) => division.version === version);
}

export function getCsiSectionOptions(
  version: CsiMasterFormatVersion
): CsiPickerSectionOption[] {
  if (version === "MASTERFORMAT_CURRENT") {
    return mockCsiSections.map((section) => ({
      id: section.id,
      divisionId: section.divisionId,
      number: section.number,
      name: section.name,
      additionalTitleCount: 0,
    }));
  }

  return get1995SectionOptions();
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
