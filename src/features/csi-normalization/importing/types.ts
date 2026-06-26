import type {
  CsiCatalogItem,
  CsiCatalogMetadata,
  CsiCatalogMetadataType,
  CsiCatalogRecordType,
  CsiCrosswalkCardinality,
  CsiCrosswalkIssueType,
  CsiCrosswalkRelationship,
  CsiCrosswalkSourceBasis,
  CsiNormalizedDataSet,
  CsiNormalizationReviewStatus,
  CsiRelationshipRole,
  CsiRelationshipType,
  CsiSourceTrace,
  CsiVersion,
} from "../types";
import type { CsiNormalizationValidationResult } from "../validation";

export type ImportedSourceType =
  | "pdf_ocr"
  | "pdf_table"
  | "excel"
  | "manual_fixture"
  | "generated_extract"
  | "qa_comparison";

export type ImportedSourceTrace = {
  sourceId?: string;
  sourceName: string;
  sourceType: ImportedSourceType;
  sourceVersion?: string;
  sourcePage?: string;
  sourceSheet?: string;
  sourceRow?: string;
  sourceColumn?: string;
  sourceNote?: string;
  importedAt?: string;
  importerVersion?: string;
};

export type ImportedCsiCatalogRow = {
  id?: string;
  version: CsiVersion;
  code: string;
  title: string;
  divisionCode: string;
  divisionTitle: string;
  subgroupTitle?: string;
  parentCode?: string;
  hierarchyLevel: number;
  recordType: CsiCatalogRecordType;
  sortOrder?: number;
  description?: string;
  notes?: string;
  reviewStatus?: CsiNormalizationReviewStatus;
  isCanonicalCatalogItem: boolean;
  metadataType?: CsiCatalogMetadataType;
  metadataTargetCode?: string;
  sourceTrace: ImportedSourceTrace;
};

export type ImportedCsiMetadataRow = {
  id?: string;
  version: CsiVersion;
  code: string;
  metadataType: CsiCatalogMetadataType;
  value: string;
  targetCode?: string;
  notes?: string;
  reviewStatus?: CsiNormalizationReviewStatus;
  sourceTrace: ImportedSourceTrace;
};

export type ImportedCsiCrosswalkRow = {
  id?: string;
  sourceVersion: CsiVersion;
  sourceCode: string;
  sourceTitle: string;
  targetVersion: CsiVersion;
  rawTargetCode: string;
  rawTargetTitle: string;
  resolvedTargetCode?: string;
  resolvedTargetTitle?: string;
  relationshipRole?: CsiRelationshipRole;
  relationshipType?: CsiRelationshipType;
  cardinality?: CsiCrosswalkCardinality;
  reviewStatus?: CsiNormalizationReviewStatus;
  issueType?: CsiCrosswalkIssueType;
  sourceBasis?: CsiCrosswalkSourceBasis;
  parentContextCode?: string;
  parentContextTitle?: string;
  notes?: string;
  warnings?: string[];
  sourceTrace: ImportedSourceTrace;
};

export type NormalizedCsiCode = {
  displayCode: string;
  normalizedCode: string;
};

export type BuildNormalizedCatalogItemsResult = {
  catalogItems: CsiCatalogItem[];
  metadata: CsiCatalogMetadata[];
};

export type BuildNormalizedCrosswalkRelationshipsResult = {
  crosswalkRelationships: CsiCrosswalkRelationship[];
};

export type ImportNormalizationResult = {
  importedCatalogRows: ImportedCsiCatalogRow[];
  importedMetadataRows: ImportedCsiMetadataRow[];
  importedCrosswalkRows: ImportedCsiCrosswalkRow[];
  normalizedDataSet: CsiNormalizedDataSet;
  catalogItems: CsiCatalogItem[];
  metadata: CsiCatalogMetadata[];
  crosswalkRelationships: CsiCrosswalkRelationship[];
  validation: CsiNormalizationValidationResult;
};

export function toCsiSourceTrace(trace: ImportedSourceTrace): CsiSourceTrace {
  return {
    sourceId: trace.sourceId ?? makeSourceTraceId(trace),
    sourceRole:
      trace.sourceType === "excel" ? "raw_relationship_evidence" : "qa_only",
    sourceName: trace.sourceName,
    sourceVersion: trace.sourceVersion,
    sourcePage: trace.sourcePage,
    sourceSheet: trace.sourceSheet,
    sourceRow: trace.sourceRow,
    sourceColumn: trace.sourceColumn,
    importedAt: trace.importedAt,
    importerVersion: trace.importerVersion,
    notes: trace.sourceNote,
  };
}

function makeSourceTraceId(trace: ImportedSourceTrace): string {
  return [
    trace.sourceName,
    trace.sourceType,
    trace.sourcePage,
    trace.sourceSheet,
    trace.sourceRow,
    trace.sourceColumn,
  ]
    .filter(Boolean)
    .join("-")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
