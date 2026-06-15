import { mockCsiDivisions } from "@/data/mockCsiDivisions";
import { mockCsiSections } from "@/data/mockCsiSections";
import {
  expandSectionsTo1995,
  expandSectionsToCurrent,
  getCrosswalkEntriesFor1995,
  getCrosswalkEntriesForCurrent,
} from "@/lib/csiCrosswalk";
import { CsiMasterFormatVersion } from "@/types/Csi";
import { CsiCrosswalkEntry } from "@/types/CsiCrosswalk";
import { Subcontractor } from "@/types/Subcontractor";

export type SubcontractorCsiCoverageForVersion = {
  version: CsiMasterFormatVersion;
  sectionNumbers: string[];
  divisionNumbers: string[];
};

export type DisplayedSubcontractorCsiDivision = {
  id: string;
  number: string;
  name: string;
  label: string;
  sourceFallback: boolean;
  needsReview: boolean;
};

export type DisplayedSubcontractorCsiSection = {
  id: string;
  number: string;
  name: string;
  label: string;
  divisionId: string;
  divisionNumber: string;
  sourceFallback: boolean;
  needsReview: boolean;
};

export type DisplayedSubcontractorCsiCoverage = {
  targetVersion: CsiMasterFormatVersion;
  sourceVersion: CsiMasterFormatVersion;
  divisions: DisplayedSubcontractorCsiDivision[];
  sections: DisplayedSubcontractorCsiSection[];
  warnings: string[];
};

export function getSubcontractorCsiVersion(
  subcontractor: Subcontractor
): CsiMasterFormatVersion {
  return subcontractor.csiCoverage.sourceVersion ?? "MASTERFORMAT_CURRENT";
}

export function getDisplayedSubcontractorCoverage(
  subcontractor: Subcontractor,
  targetVersion: CsiMasterFormatVersion
): DisplayedSubcontractorCsiCoverage {
  const sourceVersion = getSubcontractorCsiVersion(subcontractor);
  const sourceSectionNumbers = getSectionNumbersForSubcontractor(subcontractor);
  const warnings = new Set<string>();
  const sections =
    sourceVersion === targetVersion
      ? sourceSectionNumbers.map((sectionNumber) =>
          createDisplayedSection(sectionNumber, targetVersion, {
            sourceFallback: false,
            needsReview: false,
          })
        )
      : getCrosswalkDisplayedSections(
          sourceSectionNumbers,
          sourceVersion,
          targetVersion,
          warnings
        );
  const sectionDivisionNumbers = sections.map((section) => section.divisionNumber);
  const directDivisionNumbers =
    sourceVersion === targetVersion
      ? subcontractor.csiCoverage.divisionIds
          .map(resolveDivisionNumber)
          .filter(isString)
      : [];
  const divisions = uniqueStrings([
    ...directDivisionNumbers,
    ...sectionDivisionNumbers,
  ]).map((divisionNumber) => {
    const sectionForDivision = sections.find(
      (section) => section.divisionNumber === divisionNumber
    );

    return createDisplayedDivision(divisionNumber, targetVersion, {
      sourceFallback: sectionForDivision?.sourceFallback ?? false,
      needsReview: sectionForDivision?.needsReview ?? false,
    });
  });

  if (sourceVersion !== targetVersion && sections.length === 0) {
    subcontractor.csiCoverage.divisionIds.forEach((divisionId) => {
      const sourceDivisionNumber = resolveDivisionNumber(divisionId);

      if (sourceDivisionNumber) {
        warnings.add("CSI source division shown; no crosswalk section equivalent.");
        divisions.push(
          createDisplayedDivision(sourceDivisionNumber, sourceVersion, {
            sourceFallback: true,
            needsReview: true,
          })
        );
      }
    });
  }

  return {
    targetVersion,
    sourceVersion,
    divisions: uniqueById(divisions),
    sections: uniqueById(sections),
    warnings: Array.from(warnings),
  };
}

export function getSubcontractorCoverageForVersion(
  subcontractor: Subcontractor,
  targetVersion: CsiMasterFormatVersion
): SubcontractorCsiCoverageForVersion {
  const sectionNumbers = convertSubcontractorSectionCoverage(
    subcontractor,
    targetVersion
  );

  return {
    version: targetVersion,
    sectionNumbers,
    divisionNumbers: getDivisionNumbersFromSections(sectionNumbers),
  };
}

export function getSectionNumbersForSubcontractor(
  subcontractor: Subcontractor
): string[] {
  return uniqueStrings(
    subcontractor.csiCoverage.sectionIds
      .map(resolveSectionNumber)
      .filter(isString)
  );
}

export function getDivisionNumbersForSubcontractor(
  subcontractor: Subcontractor
): string[] {
  const divisionNumbersFromDivisions = subcontractor.csiCoverage.divisionIds
    .map(resolveDivisionNumber)
    .filter(isString);
  const divisionNumbersFromSections = getDivisionNumbersFromSections(
    getSectionNumbersForSubcontractor(subcontractor)
  );

  return uniqueStrings([
    ...divisionNumbersFromDivisions,
    ...divisionNumbersFromSections,
  ]);
}

export function convertSubcontractorSectionCoverage(
  subcontractor: Subcontractor,
  targetVersion: CsiMasterFormatVersion
): string[] {
  const sourceVersion = getSubcontractorCsiVersion(subcontractor);
  const sourceSectionNumbers = getSectionNumbersForSubcontractor(subcontractor);

  if (sourceVersion === targetVersion) return sourceSectionNumbers;

  if (
    sourceVersion === "MASTERFORMAT_1995" &&
    targetVersion === "MASTERFORMAT_CURRENT"
  ) {
    return uniqueStrings(expandSectionsToCurrent(sourceSectionNumbers));
  }

  if (
    sourceVersion === "MASTERFORMAT_CURRENT" &&
    targetVersion === "MASTERFORMAT_1995"
  ) {
    return uniqueStrings(expandSectionsTo1995(sourceSectionNumbers));
  }

  return [];
}

function resolveSectionNumber(sectionIdOrNumber: string): string | undefined {
  const normalizedValue = normalizeSectionNumber(sectionIdOrNumber);
  const matchingSection = mockCsiSections.find(
    (section) =>
      section.id === sectionIdOrNumber ||
      normalizeSectionNumber(section.number) === normalizedValue
  );

  return matchingSection?.number ?? normalizedValue;
}

function getCrosswalkDisplayedSections(
  sourceSectionNumbers: string[],
  sourceVersion: CsiMasterFormatVersion,
  targetVersion: CsiMasterFormatVersion,
  warnings: Set<string>
) {
  return sourceSectionNumbers.flatMap((sourceSectionNumber) => {
    const entries =
      sourceVersion === "MASTERFORMAT_1995" &&
      targetVersion === "MASTERFORMAT_CURRENT"
        ? getCrosswalkEntriesFor1995(sourceSectionNumber)
        : getCrosswalkEntriesForCurrent(sourceSectionNumber);
    const matchingEntries = entries.filter((entry) =>
      sourceVersion === "MASTERFORMAT_1995"
        ? Boolean(entry.targetSection.sectionNumber)
        : Boolean(entry.sourceSection.sectionNumber)
    );

    if (matchingEntries.length === 0) {
      warnings.add("Incomplete CSI crosswalk; source section shown as fallback.");

      return [
        createDisplayedSection(sourceSectionNumber, sourceVersion, {
          sourceFallback: true,
          needsReview: true,
        }),
      ];
    }

    return matchingEntries.map((entry) => {
      const targetSection =
        sourceVersion === "MASTERFORMAT_1995"
          ? entry.targetSection
          : entry.sourceSection;
      const needsReview = isReviewMapping(entry);

      if (needsReview) {
        warnings.add("CSI crosswalk needs review.");
      }

      return createDisplayedSection(targetSection.sectionNumber ?? "", targetVersion, {
        fallbackTitle: targetSection.title ?? undefined,
        sourceFallback: false,
        needsReview,
      });
    });
  });
}

function createDisplayedSection(
  sectionNumber: string,
  version: CsiMasterFormatVersion,
  options: {
    fallbackTitle?: string;
    sourceFallback: boolean;
    needsReview: boolean;
  }
): DisplayedSubcontractorCsiSection {
  const normalizedNumber = normalizeSectionNumber(sectionNumber);
  const matchingSection = mockCsiSections.find(
    (section) =>
      section.version === version &&
      normalizeSectionNumber(section.number) === normalizedNumber
  );
  const divisionNumber = getDivisionNumberFromSection(normalizedNumber);
  const divisionId =
    matchingSection?.divisionId ??
    resolveDivisionIdFromNumber(divisionNumber, version);
  const name =
    matchingSection?.name ??
    options.fallbackTitle ??
    getCrosswalkSectionTitle(normalizedNumber, version) ??
    "Source section";

  return {
    id: matchingSection?.id ?? `${version}:${normalizedNumber}`,
    number: normalizedNumber,
    name,
    label: `${normalizedNumber} - ${name}`,
    divisionId,
    divisionNumber,
    sourceFallback: options.sourceFallback,
    needsReview: options.needsReview,
  };
}

function createDisplayedDivision(
  divisionNumber: string,
  version: CsiMasterFormatVersion,
  options: {
    sourceFallback: boolean;
    needsReview: boolean;
  }
): DisplayedSubcontractorCsiDivision {
  const normalizedNumber = normalizeSectionNumber(divisionNumber);
  const matchingDivision = mockCsiDivisions.find(
    (division) =>
      division.version === version &&
      normalizeSectionNumber(division.number) === normalizedNumber
  );
  const name =
    matchingDivision?.name ??
    getCrosswalkDivisionTitle(normalizedNumber, version) ??
    "Source division";

  return {
    id: matchingDivision?.id ?? `${version}:division:${normalizedNumber}`,
    number: normalizedNumber,
    name,
    label: `Division ${normalizedNumber} - ${name}`,
    sourceFallback: options.sourceFallback,
    needsReview: options.needsReview,
  };
}

function resolveDivisionNumber(divisionIdOrNumber: string): string | undefined {
  const normalizedValue = normalizeSectionNumber(divisionIdOrNumber);
  const matchingDivision = mockCsiDivisions.find(
    (division) =>
      division.id === divisionIdOrNumber ||
      normalizeSectionNumber(division.number) === normalizedValue
  );

  return matchingDivision?.number ?? getDivisionNumberFromSection(normalizedValue);
}

function resolveDivisionIdFromNumber(
  divisionNumber: string,
  version: CsiMasterFormatVersion
) {
  const matchingDivision = mockCsiDivisions.find(
    (division) =>
      division.version === version &&
      normalizeSectionNumber(division.number) === normalizeSectionNumber(divisionNumber)
  );

  return matchingDivision?.id ?? `${version}:division:${normalizeSectionNumber(divisionNumber)}`;
}

function getDivisionNumbersFromSections(sectionNumbers: string[]): string[] {
  return uniqueStrings(sectionNumbers.map(getDivisionNumberFromSection));
}

function getDivisionNumberFromSection(sectionNumber: string): string {
  return normalizeSectionNumber(sectionNumber).slice(0, 2);
}

function normalizeSectionNumber(value: string): string {
  return value.replace(/\u00a0/g, " ").trim();
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.map(normalizeSectionNumber).filter(Boolean)));
}

function uniqueById<T extends { id: string }>(values: T[]): T[] {
  const seenIds = new Set<string>();

  return values.filter((value) => {
    if (seenIds.has(value.id)) return false;

    seenIds.add(value.id);
    return true;
  });
}

function isReviewMapping(entry: CsiCrosswalkEntry) {
  return (
    entry.relationship === "ONE_TO_MANY" ||
    entry.relationship === "MANY_TO_ONE" ||
    entry.relationship === "MANY_TO_MANY" ||
    entry.relationship === "INCOMPLETE" ||
    entry.mappingConfidence === "SPECIAL_CASE" ||
    entry.mappingConfidence === "INCOMPLETE"
  );
}

function getCrosswalkSectionTitle(
  sectionNumber: string,
  version: CsiMasterFormatVersion
) {
  if (version === "MASTERFORMAT_1995") {
    return getCrosswalkEntriesFor1995(sectionNumber)[0]?.sourceSection.title;
  }

  return getCrosswalkEntriesForCurrent(sectionNumber)[0]?.targetSection.title;
}

function getCrosswalkDivisionTitle(
  divisionNumber: string,
  version: CsiMasterFormatVersion
) {
  const matchingEntry =
    version === "MASTERFORMAT_1995"
      ? getCrosswalkEntriesFor1995(divisionNumber)[0]
      : getCrosswalkEntriesForCurrent(divisionNumber)[0];
  const title =
    version === "MASTERFORMAT_1995"
      ? matchingEntry?.sourceSection.title
      : matchingEntry?.targetSection.title;

  return title?.includes("Division") ? title : undefined;
}

function isString(value: string | undefined): value is string {
  return typeof value === "string";
}
