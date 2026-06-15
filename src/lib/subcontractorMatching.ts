import {
  getCrosswalkEntriesFor1995,
  getCrosswalkEntriesForCurrent,
} from "@/lib/csiCrosswalk";
import {
  normalizeCsiSectionNumber,
  resolveCsiCatalogItem,
  resolveCsiDivision,
  resolveCsiSection,
} from "@/lib/csiCatalog";
import {
  getComplianceAlerts,
  getVendorStatusLabel,
  getVendorStatusTone,
  isDoNotUseVendor,
} from "@/lib/subcontractors";
import {
  getSubcontractorCoverageForVersion,
  getSubcontractorCsiVersion,
} from "@/lib/subcontractorCsiCoverage";
import { CsiMasterFormatVersion } from "@/types/Csi";
import { PrequalificationStatus, Subcontractor } from "@/types/Subcontractor";
import {
  MatchProjectLocationInput,
  MatchProjectSectionInput,
  MatchSubcontractorsToProjectSectionsInput,
  ProjectSectionSubcontractorMatch,
  ProjectSectionSubcontractorMatches,
  SubcontractorMatchConfidence,
  SubcontractorMatchType,
  SubcontractorServiceAreaFit,
} from "@/types/SubcontractorMatching";

type NormalizedProjectSection = {
  id?: string;
  sectionNumber: string;
  name?: string;
  divisionNumber: string;
};

export function matchSubcontractorsToProjectSections({
  projectId,
  projectCsiVersion,
  selectedProjectSections,
  subcontractors,
  options,
}: MatchSubcontractorsToProjectSectionsInput): ProjectSectionSubcontractorMatches[] {
  const projectSections = selectedProjectSections
    .map((section) => normalizeProjectSection(section, projectCsiVersion))
    .filter(isNormalizedProjectSection);
  const candidateSubcontractors = options?.includeDoNotUse
    ? subcontractors
    : subcontractors.filter((subcontractor) => !isDoNotUseVendor(subcontractor));

  return projectSections.map((projectSection) => ({
    projectId,
    projectCsiVersion,
    projectSectionId: projectSection.id,
    projectSectionNumber: projectSection.sectionNumber,
    projectSectionName: projectSection.name,
    projectDivisionNumber: projectSection.divisionNumber,
    matches: candidateSubcontractors
      .map((subcontractor) =>
        matchSubcontractorToProjectSection(
          projectId,
          projectCsiVersion,
          projectSection,
          subcontractor,
          options?.projectLocation
        )
      )
      .filter(isProjectSectionSubcontractorMatch)
      .sort((a, b) => b.score - a.score),
  }));
}

export function matchSubcontractorToProjectSection(
  projectId: string,
  projectCsiVersion: CsiMasterFormatVersion,
  projectSection: string | MatchProjectSectionInput,
  subcontractor: Subcontractor,
  projectLocation?: MatchProjectLocationInput
): ProjectSectionSubcontractorMatch | undefined {
  const normalizedProjectSection = normalizeProjectSection(
    projectSection,
    projectCsiVersion
  );

  if (!normalizedProjectSection) return undefined;

  const subcontractorCoverage = getSubcontractorCoverageForVersion(
    subcontractor,
    projectCsiVersion
  );
  const matchedSectionNumbers = subcontractorCoverage.sectionNumbers.filter(
    (sectionNumber) =>
      normalizeSectionNumber(sectionNumber) ===
      normalizedProjectSection.sectionNumber
  );
  const hasSectionMatch = matchedSectionNumbers.length > 0;
  const matchedDivisionNumbers = subcontractorCoverage.divisionNumbers.filter(
    (divisionNumber) =>
      normalizeSectionNumber(divisionNumber) ===
      normalizedProjectSection.divisionNumber
  );
  const hasDivisionMatch = matchedDivisionNumbers.length > 0;

  if (!hasSectionMatch && !hasDivisionMatch) return undefined;

  const sourceVersion = getSubcontractorCsiVersion(subcontractor);
  const matchType = getMatchType(
    sourceVersion,
    projectCsiVersion,
    hasSectionMatch
  );
  const confidence = getMatchConfidence(
    subcontractor,
    projectCsiVersion,
    normalizedProjectSection.sectionNumber,
    matchType
  );
  const complianceAlerts = getComplianceAlerts(subcontractor);
  const serviceAreaFit = getServiceAreaFit(subcontractor, projectLocation);
  const { score, rankingReasons, warnings } = scoreSubcontractorMatch({
    subcontractor,
    matchType,
    confidence,
    complianceAlerts,
    serviceAreaFit,
  });

  return {
    projectId,
    projectCsiVersion,
    projectSectionId: normalizedProjectSection.id,
    projectSectionNumber: normalizedProjectSection.sectionNumber,
    projectSectionName: normalizedProjectSection.name,
    projectDivisionNumber: normalizedProjectSection.divisionNumber,
    subcontractor,
    matchedSectionNumbers: hasSectionMatch
      ? uniqueStrings(matchedSectionNumbers)
      : [],
    matchedDivisionNumbers: uniqueStrings(matchedDivisionNumbers),
    matchType,
    confidence,
    score,
    rankingReasons,
    warnings,
    complianceAlerts,
    serviceAreaFit,
  };
}

function normalizeProjectSection(
  section: string | MatchProjectSectionInput,
  projectCsiVersion: CsiMasterFormatVersion
): NormalizedProjectSection | undefined {
  const sectionInput = typeof section === "string" ? { id: section } : section;
  const matchingSection =
    resolveCsiSection(projectCsiVersion, sectionInput.id ?? "") ??
    resolveCsiSection(projectCsiVersion, sectionInput.sectionNumber ?? "");
  const matchingCatalogItem =
    matchingSection ??
    resolveCsiCatalogItem(projectCsiVersion, sectionInput.id ?? "") ??
    resolveCsiCatalogItem(projectCsiVersion, sectionInput.sectionNumber ?? "");
  const sectionNumber = normalizeSectionNumber(
    matchingCatalogItem?.number ??
      sectionInput.sectionNumber ??
      sectionInput.id ??
      ""
  );

  if (!sectionNumber) return undefined;

  return {
    id: matchingCatalogItem?.id ?? sectionInput.id,
    sectionNumber,
    name: matchingCatalogItem?.name ?? sectionInput.name,
    divisionNumber: getDivisionNumberForProjectSection(
      projectCsiVersion,
      sectionNumber,
      matchingCatalogItem?.divisionId
    ),
  };
}

function getMatchType(
  sourceVersion: CsiMasterFormatVersion,
  projectCsiVersion: CsiMasterFormatVersion,
  hasSectionMatch: boolean
): SubcontractorMatchType {
  if (!hasSectionMatch) return "DIVISION_ONLY";

  return sourceVersion === projectCsiVersion ? "DIRECT" : "CROSSWALK_DERIVED";
}

function getMatchConfidence(
  subcontractor: Subcontractor,
  projectCsiVersion: CsiMasterFormatVersion,
  projectSectionNumber: string,
  matchType: SubcontractorMatchType
): SubcontractorMatchConfidence {
  if (matchType === "DIVISION_ONLY") return "BROAD_DIVISION";
  if (matchType === "DIRECT") return "EXACT_DIRECT";

  const sourceVersion = getSubcontractorCsiVersion(subcontractor);
  const sourceSectionNumbers = subcontractor.csiCoverage.sectionIds.map((sectionId) =>
    normalizeSectionIdOrNumber(sectionId, sourceVersion)
  );
  const relatedEntries = sourceSectionNumbers.flatMap((sourceSectionNumber) =>
    sourceVersion === "MASTERFORMAT_1995" &&
    projectCsiVersion === "MASTERFORMAT_CURRENT"
      ? getCrosswalkEntriesFor1995(sourceSectionNumber).filter(
          (entry) =>
            normalizeNullableSectionNumber(entry.targetSection.sectionNumber) ===
            projectSectionNumber
        )
      : getCrosswalkEntriesForCurrent(sourceSectionNumber).filter(
          (entry) =>
            normalizeNullableSectionNumber(entry.sourceSection.sectionNumber) ===
            projectSectionNumber
        )
  );

  if (relatedEntries.length === 0) return "INCOMPLETE_CROSSWALK";

  if (
    relatedEntries.some(
      (entry) =>
        entry.relationship === "MANY_TO_MANY" ||
        entry.relationship === "ONE_TO_MANY" ||
        entry.relationship === "MANY_TO_ONE" ||
        entry.mappingConfidence === "SPECIAL_CASE" ||
        entry.mappingConfidence === "INCOMPLETE"
    )
  ) {
    return "AMBIGUOUS_CROSSWALK";
  }

  return "EXACT_CROSSWALK";
}

function scoreSubcontractorMatch({
  subcontractor,
  matchType,
  confidence,
  complianceAlerts,
  serviceAreaFit,
}: {
  subcontractor: Subcontractor;
  matchType: SubcontractorMatchType;
  confidence: SubcontractorMatchConfidence;
  complianceAlerts: string[];
  serviceAreaFit: SubcontractorServiceAreaFit;
}) {
  const rankingReasons: string[] = [];
  const warnings: string[] = [];
  let score = 0;

  score += getMatchQualityScore(confidence);
  rankingReasons.push(formatMatchReason(matchType, confidence));

  const vpiScore = getVpiScore(subcontractor);
  score += vpiScore;
  if (subcontractor.vpi.overall !== undefined) {
    rankingReasons.push(`VPI ${subcontractor.vpi.overall.toFixed(1)} / 5`);
  } else {
    warnings.push("VPI not rated");
  }

  const prequalificationScore = getPrequalificationScore(
    subcontractor.prequalification.status,
    complianceAlerts
  );
  score += prequalificationScore;
  rankingReasons.push(`Vendor Status: ${getVendorStatusLabel(subcontractor)}`);

  if (complianceAlerts.length > 0) {
    warnings.push(...complianceAlerts);
  }

  score += getServiceAreaScore(serviceAreaFit);
  rankingReasons.push(`Service area fit: ${formatStatus(serviceAreaFit)}`);

  if (
    confidence === "AMBIGUOUS_CROSSWALK" ||
    confidence === "INCOMPLETE_CROSSWALK"
  ) {
    warnings.push(formatStatus(confidence));
  }

  if (getVendorStatusTone(subcontractor) === "danger") {
    warnings.push("Vendor status needs review");
  }

  return {
    score: clampScore(score),
    rankingReasons,
    warnings: uniqueStrings(warnings),
  };
}

function getMatchQualityScore(confidence: SubcontractorMatchConfidence) {
  switch (confidence) {
    case "EXACT_DIRECT":
      return 40;
    case "EXACT_CROSSWALK":
      return 34;
    case "AMBIGUOUS_CROSSWALK":
      return 26;
    case "INCOMPLETE_CROSSWALK":
      return 16;
    case "BROAD_DIVISION":
      return 12;
  }
}

function getVpiScore(subcontractor: Subcontractor) {
  if (subcontractor.vpi.overall === undefined) return 0;

  return (subcontractor.vpi.overall / 5) * 15;
}

function getPrequalificationScore(
  status: PrequalificationStatus,
  complianceAlerts: string[]
) {
  const compliancePenalty = Math.min(complianceAlerts.length * 3, 9);

  switch (status) {
    case "QUALIFIED":
      return 15 - compliancePenalty;
    case "CONDITIONAL":
      return 9 - compliancePenalty;
    case "IN_PROGRESS":
      return 7 - compliancePenalty;
    case "NOT_STARTED":
      return 3 - compliancePenalty;
    case "EXPIRED":
    case "REJECTED":
      return -15 - compliancePenalty;
  }
}

function getServiceAreaFit(
  subcontractor: Subcontractor,
  projectLocation: MatchProjectLocationInput | undefined
): SubcontractorServiceAreaFit {
  if (!projectLocation?.state && !projectLocation?.city) return "UNKNOWN";

  const projectState = normalizeText(projectLocation.state ?? "");
  const projectCity = normalizeText(projectLocation.city ?? "");
  const states = subcontractor.serviceArea.states.map(normalizeText);
  const markets = subcontractor.serviceArea.citiesOrMarkets.map(normalizeText);

  if (
    (projectState && states.includes(projectState)) ||
    (projectCity && markets.includes(projectCity))
  ) {
    return "STRONG";
  }

  if (subcontractor.serviceArea.willTravel) return "PARTIAL";

  return "OUTSIDE_AREA";
}

function getServiceAreaScore(serviceAreaFit: SubcontractorServiceAreaFit) {
  switch (serviceAreaFit) {
    case "STRONG":
      return 10;
    case "PARTIAL":
      return 5;
    case "UNKNOWN":
      return 3;
    case "OUTSIDE_AREA":
      return -10;
  }
}

function formatMatchReason(
  matchType: SubcontractorMatchType,
  confidence: SubcontractorMatchConfidence
) {
  if (matchType === "DIRECT") return "Direct CSI section match";
  if (matchType === "DIVISION_ONLY") return "Division-level fallback match";

  return `Crosswalk CSI match: ${formatStatus(confidence)}`;
}

function normalizeSectionIdOrNumber(
  value: string,
  version: CsiMasterFormatVersion
) {
  const matchingSection =
    resolveCsiSection(version, value) ?? resolveCsiCatalogItem(version, value);

  return normalizeSectionNumber(matchingSection?.number ?? value);
}

function normalizeNullableSectionNumber(value: string | null) {
  return value ? normalizeSectionNumber(value) : "";
}

function getDivisionNumberFromSection(sectionNumber: string) {
  return normalizeSectionNumber(sectionNumber).slice(0, 2);
}

function getDivisionNumberForProjectSection(
  version: CsiMasterFormatVersion,
  sectionNumber: string,
  divisionId: string | undefined
) {
  if (!divisionId) return getDivisionNumberFromSection(sectionNumber);

  return (
    resolveCsiDivision(version, divisionId)?.number ??
    getDivisionNumberFromSection(sectionNumber)
  );
}

function normalizeSectionNumber(value: string) {
  return normalizeCsiSectionNumber(value);
}

function normalizeText(value: string) {
  return value.toLowerCase().trim();
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function formatStatus(value: string) {
  return value
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

function isNormalizedProjectSection(
  section: NormalizedProjectSection | undefined
): section is NormalizedProjectSection {
  return Boolean(section);
}

function isProjectSectionSubcontractorMatch(
  match: ProjectSectionSubcontractorMatch | undefined
): match is ProjectSectionSubcontractorMatch {
  return Boolean(match);
}
