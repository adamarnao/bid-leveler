import {
  CsiHierarchyRelationship,
  CsiMasterFormatVersion,
} from "@/types/Csi";
import { ProjectBidPackage } from "@/types/Bid";
import { Subcontractor } from "@/types/Subcontractor";

export type SubcontractorMatchType =
  | "EXACT"
  | "SPECIALIZED_COVERAGE"
  | "BROAD_COVERAGE"
  | "RELATED_SCOPE"
  // Legacy compatibility values. The hierarchy-aware matcher no longer emits
  // these, but existing UI/storage code may still compare against them.
  | "DIRECT"
  | "CROSSWALK_DERIVED"
  | "DIVISION_ONLY";

export type SubcontractorMatchConfidence =
  | "EXACT_DIRECT"
  | "EXACT_CROSSWALK"
  | "AMBIGUOUS_CROSSWALK"
  | "INCOMPLETE_CROSSWALK"
  | "HIERARCHY_RELATED"
  | "BROAD_DIVISION";

export type SubcontractorServiceAreaFit =
  | "STRONG"
  | "PARTIAL"
  | "UNKNOWN"
  | "OUTSIDE_AREA";

export type MatchProjectSectionInput = {
  id?: string;
  sectionNumber?: string;
  name?: string;
};

export type MatchProjectLocationInput = {
  state?: string;
  city?: string;
};

export type MatchSubcontractorsToProjectSectionsOptions = {
  includeDoNotUse?: boolean;
  projectLocation?: MatchProjectLocationInput;
};

export type MatchSubcontractorsToProjectSectionsInput = {
  projectId: string;
  projectCsiVersion: CsiMasterFormatVersion;
  selectedProjectSections: Array<string | MatchProjectSectionInput>;
  subcontractors: Subcontractor[];
  options?: MatchSubcontractorsToProjectSectionsOptions;
};

export type ProjectSectionSubcontractorMatch = {
  projectId: string;
  projectCsiVersion: CsiMasterFormatVersion;
  projectSectionId?: string;
  projectSectionNumber: string;
  projectSectionName?: string;
  projectDivisionNumber: string;
  subcontractor: Subcontractor;
  matchedSectionNumbers: string[];
  matchedDivisionNumbers: string[];
  matchType: SubcontractorMatchType;
  confidence: SubcontractorMatchConfidence;
  hierarchyRelationship?: CsiHierarchyRelationship;
  matchLabel?: string;
  isPossibleMatch?: boolean;
  score: number;
  rankingReasons: string[];
  warnings: string[];
  complianceAlerts: string[];
  serviceAreaFit: SubcontractorServiceAreaFit;
};

export type ProjectSectionSubcontractorMatches = {
  projectId: string;
  projectCsiVersion: CsiMasterFormatVersion;
  projectSectionId?: string;
  projectSectionNumber: string;
  projectSectionName?: string;
  projectDivisionNumber: string;
  matches: ProjectSectionSubcontractorMatch[];
};

export type BidPackageScopeMatchDetail = {
  scopeItemId: string;
  scopeNumber: string;
  scopeName?: string;
  match?: ProjectSectionSubcontractorMatch;
};

export type BidPackageSubcontractorMatch = {
  projectId: string;
  csiVersion: CsiMasterFormatVersion;
  bidPackageId: string;
  bidPackageName: string;
  subcontractorId: string;
  subcontractorName: string;
  subcontractor: Subcontractor;
  defaultContactIds: string[];
  matchType: SubcontractorMatchType;
  matchLabel: string;
  isPossibleMatch: boolean;
  matchedScopeItemIds: string[];
  unmatchedScopeItemIds: string[];
  coverageRatio: number;
  scopeMatchDetails: BidPackageScopeMatchDetail[];
  score: number;
  rankingReasons: string[];
  warnings: string[];
  complianceAlerts: string[];
  serviceAreaFit: SubcontractorServiceAreaFit;
};

export type BidPackageMatchSummary = {
  projectId: string;
  csiVersion: CsiMasterFormatVersion;
  bidPackage: ProjectBidPackage;
  bidPackageId: string;
  bidPackageName: string;
  scopeItemIds: string[];
  matches: BidPackageSubcontractorMatch[];
  defaultMatches: BidPackageSubcontractorMatch[];
  possibleMatches: BidPackageSubcontractorMatch[];
  unmatchedScopeItemIds: string[];
};

export type MatchSubcontractorsToBidPackagesInput = {
  projectId: string;
  csiVersion: CsiMasterFormatVersion;
  bidPackages: ProjectBidPackage[];
  subcontractors: Subcontractor[];
  includePossibleMatches?: boolean;
  options?: MatchSubcontractorsToProjectSectionsOptions;
};
