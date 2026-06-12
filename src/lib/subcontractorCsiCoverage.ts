import { mockCsiDivisions } from "@/data/mockCsiDivisions";
import { mockCsiSections } from "@/data/mockCsiSections";
import {
  expandSectionsTo1995,
  expandSectionsToCurrent,
} from "@/lib/csiCrosswalk";
import { CsiMasterFormatVersion } from "@/types/Csi";
import { Subcontractor } from "@/types/Subcontractor";

export type SubcontractorCsiCoverageForVersion = {
  version: CsiMasterFormatVersion;
  sectionNumbers: string[];
  divisionNumbers: string[];
};

export function getSubcontractorCsiVersion(
  subcontractor: Subcontractor
): CsiMasterFormatVersion {
  return subcontractor.csiCoverage.sourceVersion ?? "MASTERFORMAT_CURRENT";
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

function resolveDivisionNumber(divisionIdOrNumber: string): string | undefined {
  const normalizedValue = normalizeSectionNumber(divisionIdOrNumber);
  const matchingDivision = mockCsiDivisions.find(
    (division) =>
      division.id === divisionIdOrNumber ||
      normalizeSectionNumber(division.number) === normalizedValue
  );

  return matchingDivision?.number ?? getDivisionNumberFromSection(normalizedValue);
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

function isString(value: string | undefined): value is string {
  return typeof value === "string";
}
