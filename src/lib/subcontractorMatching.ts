import {
  getCrosswalkEntriesFor1995,
  getCrosswalkEntriesForCurrent,
} from "@/lib/csiCrosswalk";
import {
  getCsiHierarchyRelationship,
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
import {
  CsiCatalogItem,
  CsiHierarchyRelationship,
  CsiMasterFormatVersion,
} from "@/types/Csi";
import { PrequalificationStatus, Subcontractor } from "@/types/Subcontractor";
import {
  BidPackageMatchSummary,
  BidPackageScopeMatchDetail,
  BidPackageSubcontractorMatch,
  MatchSubcontractorsToBidPackagesInput,
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
  itemId?: string;
  sectionNumber: string;
  name?: string;
  divisionNumber: string;
};

type CoverageRelationshipMatch = {
  coverageItem: CsiCatalogItem;
  relationship: CsiHierarchyRelationship;
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
      .sort((a, b) =>
        a.subcontractor.companyName.localeCompare(b.subcontractor.companyName)
      ),
  }));
}

export function matchSubcontractorsToBidPackages({
  projectId,
  csiVersion,
  bidPackages,
  subcontractors,
  includePossibleMatches = true,
  options,
}: MatchSubcontractorsToBidPackagesInput): BidPackageMatchSummary[] {
  return bidPackages.map((bidPackage) => {
    const scopeMatchGroups = matchSubcontractorsToProjectSections({
      projectId,
      projectCsiVersion: csiVersion,
      selectedProjectSections: bidPackage.scopeItemIds,
      subcontractors,
      options,
    });
    const matchesBySubcontractorId = new Map<
      string,
      ProjectSectionSubcontractorMatch[]
    >();

    scopeMatchGroups.forEach((scopeMatchGroup) => {
      scopeMatchGroup.matches.forEach((match) => {
        const matches =
          matchesBySubcontractorId.get(match.subcontractor.id) ?? [];

        matches.push(match);
        matchesBySubcontractorId.set(match.subcontractor.id, matches);
      });
    });

    const matches = Array.from(matchesBySubcontractorId.values())
      .map((scopeMatches) =>
        buildBidPackageSubcontractorMatch(
          projectId,
          csiVersion,
          bidPackage,
          scopeMatchGroups,
          scopeMatches
        )
      )
      .filter((match) => includePossibleMatches || !match.isPossibleMatch)
      .sort(compareBidPackageMatches);
    const defaultMatches = matches.filter((match) => !match.isPossibleMatch);
    const possibleMatches = matches.filter((match) => match.isPossibleMatch);
    const matchedScopeItemIds = new Set(
      matches.flatMap((match) => match.matchedScopeItemIds)
    );

    return {
      projectId,
      csiVersion,
      bidPackage,
      bidPackageId: bidPackage.id,
      bidPackageName: bidPackage.name,
      scopeItemIds: bidPackage.scopeItemIds,
      matches,
      defaultMatches,
      possibleMatches,
      unmatchedScopeItemIds: bidPackage.scopeItemIds.filter(
        (scopeItemId) => !matchedScopeItemIds.has(scopeItemId)
      ),
    };
  });
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
  const bestCoverageMatch = getBestCoverageRelationshipMatch(
    projectCsiVersion,
    normalizedProjectSection,
    subcontractorCoverage.sectionNumbers
  );

  if (!bestCoverageMatch) return undefined;

  const matchType = getMatchType(bestCoverageMatch.relationship);
  const confidence = getMatchConfidence(
    subcontractor,
    projectCsiVersion,
    bestCoverageMatch.coverageItem.number,
    bestCoverageMatch.relationship
  );
  const complianceAlerts = getComplianceAlerts(subcontractor);
  const serviceAreaFit = getServiceAreaFit(subcontractor, projectLocation);
  const matchedSectionNumbers = [bestCoverageMatch.coverageItem.number];
  const matchedDivisionNumbers = [
    getDivisionNumberForProjectSection(
      projectCsiVersion,
      bestCoverageMatch.coverageItem.number,
      bestCoverageMatch.coverageItem.divisionId
    ),
  ];
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
    matchedSectionNumbers: uniqueStrings(matchedSectionNumbers),
    matchedDivisionNumbers: uniqueStrings(matchedDivisionNumbers),
    matchType,
    confidence,
    hierarchyRelationship: bestCoverageMatch.relationship,
    matchLabel: getMatchLabel(matchType),
    isPossibleMatch: isPossibleMatchType(matchType),
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
    itemId: matchingCatalogItem?.id,
    sectionNumber,
    name: matchingCatalogItem?.name ?? sectionInput.name,
    divisionNumber: getDivisionNumberForProjectSection(
      projectCsiVersion,
      sectionNumber,
      matchingCatalogItem?.divisionId
    ),
  };
}

function getBestCoverageRelationshipMatch(
  projectCsiVersion: CsiMasterFormatVersion,
  projectSection: NormalizedProjectSection,
  coverageSectionNumbers: string[]
): CoverageRelationshipMatch | undefined {
  const requestedItemIdOrNumber =
    projectSection.itemId ?? projectSection.sectionNumber;
  const matches: CoverageRelationshipMatch[] = [];

  coverageSectionNumbers.forEach((sectionNumber) => {
    const coverageItem = resolveCsiCatalogItem(projectCsiVersion, sectionNumber);
    if (!coverageItem) return;

    const relationship = getCsiHierarchyRelationship(
      projectCsiVersion,
      requestedItemIdOrNumber,
      coverageItem.id
    );

    if (relationship === "UNRELATED") return;

    matches.push({
      coverageItem,
      relationship,
    });
  });

  return matches.sort(
    (matchA, matchB) =>
      getHierarchyRelationshipRank(matchA.relationship) -
        getHierarchyRelationshipRank(matchB.relationship) ||
      matchA.coverageItem.sortOrder - matchB.coverageItem.sortOrder
  )[0];
}

function getMatchType(
  hierarchyRelationship: CsiHierarchyRelationship
): SubcontractorMatchType {
  if (hierarchyRelationship === "EXACT") return "EXACT";
  if (hierarchyRelationship === "DESCENDANT") return "SPECIALIZED_COVERAGE";
  if (hierarchyRelationship === "ANCESTOR") return "BROAD_COVERAGE";

  return "RELATED_SCOPE";
}

function buildBidPackageSubcontractorMatch(
  projectId: string,
  csiVersion: CsiMasterFormatVersion,
  bidPackage: MatchSubcontractorsToBidPackagesInput["bidPackages"][number],
  scopeMatchGroups: ProjectSectionSubcontractorMatches[],
  scopeMatches: ProjectSectionSubcontractorMatch[]
): BidPackageSubcontractorMatch {
  const subcontractor = scopeMatches[0].subcontractor;
  const matchesByScopeItemId = new Map(
    scopeMatches.map((match) => [
      match.projectSectionId ?? match.projectSectionNumber,
      match,
    ])
  );
  const matchedScopeItemIds = bidPackage.scopeItemIds.filter((scopeItemId) =>
    matchesByScopeItemId.has(scopeItemId)
  );
  const unmatchedScopeItemIds = bidPackage.scopeItemIds.filter(
    (scopeItemId) => !matchesByScopeItemId.has(scopeItemId)
  );
  const coverageRatio =
    bidPackage.scopeItemIds.length === 0
      ? 0
      : matchedScopeItemIds.length / bidPackage.scopeItemIds.length;
  const bestMatch = [...scopeMatches].sort(compareScopeMatchesByQuality)[0];
  const hasDefaultMatch = scopeMatches.some(isDefaultPackageScopeMatch);
  const hasOnlyPossibleMatches = !hasDefaultMatch;
  const packageWarnings = getBidPackageMatchWarnings(
    coverageRatio,
    unmatchedScopeItemIds,
    bidPackage.scopeItemIds.length
  );

  return {
    projectId,
    csiVersion,
    bidPackageId: bidPackage.id,
    bidPackageName: bidPackage.name,
    subcontractorId: subcontractor.id,
    subcontractorName: subcontractor.companyName,
    subcontractor,
    defaultContactIds: getDefaultInviteContactIds(subcontractor),
    matchType: bestMatch.matchType,
    matchLabel: getPackageMatchLabel(bestMatch.matchType, coverageRatio),
    isPossibleMatch: hasOnlyPossibleMatches || coverageRatio < 0.5,
    matchedScopeItemIds,
    unmatchedScopeItemIds,
    coverageRatio,
    scopeMatchDetails: buildScopeMatchDetails(
      csiVersion,
      bidPackage.scopeItemIds,
      scopeMatchGroups,
      matchesByScopeItemId
    ),
    score: getBidPackageMatchScore(scopeMatches, coverageRatio),
    rankingReasons: uniqueStrings(
      scopeMatches.flatMap((match) => match.rankingReasons)
    ),
    warnings: uniqueStrings([
      ...scopeMatches.flatMap((match) => match.warnings),
      ...packageWarnings,
    ]),
    complianceAlerts: uniqueStrings(
      scopeMatches.flatMap((match) => match.complianceAlerts)
    ),
    serviceAreaFit: getBestServiceAreaFit(scopeMatches),
  };
}

function buildScopeMatchDetails(
  csiVersion: CsiMasterFormatVersion,
  scopeItemIds: string[],
  scopeMatchGroups: ProjectSectionSubcontractorMatches[],
  matchesByScopeItemId: Map<string, ProjectSectionSubcontractorMatch>
): BidPackageScopeMatchDetail[] {
  const scopeGroupsById = new Map(
    scopeMatchGroups.map((group) => [
      group.projectSectionId ?? group.projectSectionNumber,
      group,
    ])
  );

  return scopeItemIds.map((scopeItemId) => {
    const item = resolveCsiCatalogItem(csiVersion, scopeItemId);
    const group = scopeGroupsById.get(scopeItemId);

    return {
      scopeItemId,
      scopeNumber: item?.number ?? group?.projectSectionNumber ?? scopeItemId,
      scopeName: item?.name ?? group?.projectSectionName,
      match: matchesByScopeItemId.get(scopeItemId),
    };
  });
}

function isDefaultPackageScopeMatch(match: ProjectSectionSubcontractorMatch) {
  return (
    match.matchType === "EXACT" ||
    match.matchType === "SPECIALIZED_COVERAGE" ||
    match.matchType === "DIRECT" ||
    match.matchType === "CROSSWALK_DERIVED"
  );
}

function getPackageMatchLabel(
  matchType: SubcontractorMatchType,
  coverageRatio: number
) {
  if (coverageRatio < 0.5) return "Partial Package Coverage";

  return getMatchLabel(matchType);
}

function getBidPackageMatchWarnings(
  coverageRatio: number,
  unmatchedScopeItemIds: string[],
  packageScopeCount: number
) {
  const warnings: string[] = [];

  if (coverageRatio < 1 && unmatchedScopeItemIds.length > 0) {
    warnings.push(`${unmatchedScopeItemIds.length} package scope(s) unmatched`);
  }

  if (packageScopeCount > 1 && coverageRatio < 0.5) {
    warnings.push("Low package coverage");
  }

  return warnings;
}

function getBidPackageMatchScore(
  scopeMatches: ProjectSectionSubcontractorMatch[],
  coverageRatio: number
) {
  const bestScopeScore = Math.max(...scopeMatches.map((match) => match.score));
  const coverageScore = Math.round(coverageRatio * 20);

  return clampScore(bestScopeScore + coverageScore);
}

function getBestServiceAreaFit(scopeMatches: ProjectSectionSubcontractorMatch[]) {
  return [...scopeMatches].sort(
    (matchA, matchB) =>
      getServiceAreaFitRank(matchA.serviceAreaFit) -
      getServiceAreaFitRank(matchB.serviceAreaFit)
  )[0].serviceAreaFit;
}

function getServiceAreaFitRank(serviceAreaFit: SubcontractorServiceAreaFit) {
  if (serviceAreaFit === "STRONG") return 0;
  if (serviceAreaFit === "PARTIAL") return 1;
  if (serviceAreaFit === "UNKNOWN") return 2;

  return 3;
}

function compareScopeMatchesByQuality(
  matchA: ProjectSectionSubcontractorMatch,
  matchB: ProjectSectionSubcontractorMatch
) {
  return (
    getPackageMatchTypeRank(matchA.matchType) -
      getPackageMatchTypeRank(matchB.matchType) ||
    matchB.score - matchA.score ||
    matchA.subcontractor.companyName.localeCompare(matchB.subcontractor.companyName)
  );
}

function compareBidPackageMatches(
  matchA: BidPackageSubcontractorMatch,
  matchB: BidPackageSubcontractorMatch
) {
  if (matchA.isPossibleMatch !== matchB.isPossibleMatch) {
    return matchA.isPossibleMatch ? 1 : -1;
  }

  return (
    matchB.coverageRatio - matchA.coverageRatio ||
    getPackageMatchTypeRank(matchA.matchType) -
      getPackageMatchTypeRank(matchB.matchType) ||
    matchB.score - matchA.score ||
    matchA.subcontractorName.localeCompare(matchB.subcontractorName)
  );
}

function getPackageMatchTypeRank(matchType: SubcontractorMatchType) {
  if (
    matchType === "EXACT" ||
    matchType === "DIRECT" ||
    matchType === "CROSSWALK_DERIVED"
  ) {
    return 0;
  }

  if (matchType === "SPECIALIZED_COVERAGE") return 1;
  if (matchType === "BROAD_COVERAGE" || matchType === "DIVISION_ONLY") return 2;

  return 3;
}

function getDefaultInviteContactIds(subcontractor: Subcontractor) {
  const activeContactsWithEmail = subcontractor.contacts.filter(
    (contact) => contact.active !== false && Boolean(contact.email?.trim())
  );
  const defaultInviteContactIds = activeContactsWithEmail
    .filter((contact) => contact.isDefaultInviteRecipient)
    .map((contact) => contact.id);

  if (defaultInviteContactIds.length > 0) return defaultInviteContactIds;

  const primaryContact = activeContactsWithEmail.find((contact) => contact.isPrimary);
  if (primaryContact) return [primaryContact.id];

  const estimatorContactIds = activeContactsWithEmail
    .filter((contact) => contact.role === "ESTIMATOR")
    .map((contact) => contact.id);

  if (estimatorContactIds.length > 0) return estimatorContactIds;

  return activeContactsWithEmail.map((contact) => contact.id);
}

function getMatchConfidence(
  subcontractor: Subcontractor,
  projectCsiVersion: CsiMasterFormatVersion,
  matchedCoverageNumber: string,
  hierarchyRelationship: CsiHierarchyRelationship
): SubcontractorMatchConfidence {
  const sourceVersion = getSubcontractorCsiVersion(subcontractor);

  if (sourceVersion === projectCsiVersion) {
    return hierarchyRelationship === "EXACT"
      ? "EXACT_DIRECT"
      : "HIERARCHY_RELATED";
  }

  const sourceSectionNumbers = subcontractor.csiCoverage.sectionIds.map((sectionId) =>
    normalizeSectionIdOrNumber(sectionId, sourceVersion)
  );
  const relatedEntries = sourceSectionNumbers.flatMap((sourceSectionNumber) =>
    sourceVersion === "MASTERFORMAT_1995" &&
    projectCsiVersion === "MASTERFORMAT_2004_PLUS"
      ? getCrosswalkEntriesFor1995(sourceSectionNumber).filter(
          (entry) =>
            normalizeNullableSectionNumber(entry.targetSection.sectionNumber) ===
            normalizeSectionNumber(matchedCoverageNumber)
        )
      : getCrosswalkEntriesForCurrent(sourceSectionNumber).filter(
          (entry) =>
            normalizeNullableSectionNumber(entry.sourceSection.sectionNumber) ===
            normalizeSectionNumber(matchedCoverageNumber)
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
    case "HIERARCHY_RELATED":
      return 24;
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
  if (matchType === "EXACT") return "Exact CSI match";
  if (matchType === "SPECIALIZED_COVERAGE") return "Specialized CSI coverage";
  if (matchType === "BROAD_COVERAGE") return "Broad CSI coverage";
  if (matchType === "RELATED_SCOPE") return "Related CSI scope";
  if (matchType === "DIRECT") return "Direct CSI section match";
  if (matchType === "DIVISION_ONLY") return "Division-level fallback match";

  return `Crosswalk CSI match: ${formatStatus(confidence)}`;
}

function getMatchLabel(matchType: SubcontractorMatchType) {
  if (matchType === "EXACT" || matchType === "DIRECT") return "Exact Match";
  if (matchType === "SPECIALIZED_COVERAGE") return "Specialized Coverage";
  if (matchType === "BROAD_COVERAGE" || matchType === "DIVISION_ONLY") {
    return "Broad Coverage";
  }

  return "Related Scope";
}

function isPossibleMatchType(matchType: SubcontractorMatchType) {
  return matchType === "BROAD_COVERAGE" || matchType === "RELATED_SCOPE";
}

function getHierarchyRelationshipRank(
  relationship: CsiHierarchyRelationship
) {
  if (relationship === "EXACT") return 0;
  if (relationship === "DESCENDANT") return 1;
  if (relationship === "ANCESTOR") return 2;
  if (relationship === "SIBLING") return 3;

  return 4;
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
