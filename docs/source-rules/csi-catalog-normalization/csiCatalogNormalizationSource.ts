/**
 * Bid-Leveler CSI Catalog Normalization Source
 *
 * Planning/source constants for development and future production CSI catalog
 * normalization. Do not import this file into live app code until an explicit
 * implementation phase.
 */

export const CSI_CATALOG_NORMALIZATION_SOURCE_RULE_VERSION = "CSI_CATALOG_NORMALIZATION_V1" as const;

export const csiCatalogSourceRoles = {
  ACTIVE_DEVELOPMENT: "ACTIVE_DEVELOPMENT",
  QA_ONLY: "QA_ONLY",
  DEPRECATED: "DEPRECATED",
  ARCHIVE_VISUAL_BACKUP: "ARCHIVE_VISUAL_BACKUP",
} as const;

export type CsiCatalogSourceRole =
  (typeof csiCatalogSourceRoles)[keyof typeof csiCatalogSourceRoles];

export const csiCatalogNormalizationStages = {
  RAW_EVIDENCE_CAPTURED: "RAW_EVIDENCE_CAPTURED",
  RAW_IMPORT_PARSED: "RAW_IMPORT_PARSED",
  NORMALIZED_CATALOG_DRAFTED: "NORMALIZED_CATALOG_DRAFTED",
  NORMALIZED_CATALOG_QA_REVIEWED: "NORMALIZED_CATALOG_QA_REVIEWED",
  CROSSWALK_RAW_IMPORTED: "CROSSWALK_RAW_IMPORTED",
  CROSSWALK_RESOLVED_TO_NORMALIZED_ITEMS: "CROSSWALK_RESOLVED_TO_NORMALIZED_ITEMS",
  GENERATED_RUNTIME_DATA_READY: "GENERATED_RUNTIME_DATA_READY",
  LICENSED_SOURCE_REPLACEMENT_READY: "LICENSED_SOURCE_REPLACEMENT_READY",
} as const;

export type CsiCatalogNormalizationStage =
  (typeof csiCatalogNormalizationStages)[keyof typeof csiCatalogNormalizationStages];

export const csiCatalogReviewStatuses = {
  NOT_REVIEWED: "NOT_REVIEWED",
  CLEAN: "CLEAN",
  NEEDS_REVIEW: "NEEDS_REVIEW",
  AMBIGUOUS: "AMBIGUOUS",
  INCOMPLETE_SOURCE: "INCOMPLETE_SOURCE",
  DEPRECATED_SOURCE: "DEPRECATED_SOURCE",
  LICENSE_REPLACEMENT_REQUIRED: "LICENSE_REPLACEMENT_REQUIRED",
} as const;

export type CsiCatalogReviewStatus =
  (typeof csiCatalogReviewStatuses)[keyof typeof csiCatalogReviewStatuses];

export const csiCatalogSourceIssueTypes = {
  OCR_ARTIFACT: "OCR_ARTIFACT",
  SCANNED_SOURCE_LOW_CONFIDENCE: "SCANNED_SOURCE_LOW_CONFIDENCE",
  PDF_LAYOUT_AMBIGUITY: "PDF_LAYOUT_AMBIGUITY",
  TABLE_EXTRACTION_AMBIGUITY: "TABLE_EXTRACTION_AMBIGUITY",
  MISSING_CODE: "MISSING_CODE",
  MISSING_TITLE: "MISSING_TITLE",
  MISSING_LEVEL: "MISSING_LEVEL",
  DUPLICATE_CODE: "DUPLICATE_CODE",
  CONFLICTING_TITLE: "CONFLICTING_TITLE",
  INCOMPLETE_DIVISION_00: "INCOMPLETE_DIVISION_00",
  CROSSWALK_UNRESOLVED_SOURCE: "CROSSWALK_UNRESOLVED_SOURCE",
  CROSSWALK_UNRESOLVED_TARGET: "CROSSWALK_UNRESOLVED_TARGET",
  CROSSWALK_MANY_TO_MANY_REVIEW: "CROSSWALK_MANY_TO_MANY_REVIEW",
  LICENSED_SOURCE_REQUIRED: "LICENSED_SOURCE_REQUIRED",
} as const;

export type CsiCatalogSourceIssueType =
  (typeof csiCatalogSourceIssueTypes)[keyof typeof csiCatalogSourceIssueTypes];

export const stableRuntimeConcepts = [
  "CsiCatalogItem",
  "CsiCatalogMetadata",
  "CsiCrosswalkRelationship",
  "CsiTradeMapping",
  "CsiVersion",
  "TradePackage",
] as const;

export const supportedCsiVersions = {
  MASTERFORMAT_1995: {
    id: "MASTERFORMAT_1995",
    label: "MasterFormat 1995 / 16-Division",
  },
  MASTERFORMAT_2004_PLUS: {
    id: "MASTERFORMAT_2004_PLUS",
    label: "MasterFormat 2004+ / 50-Division",
  },
} as const;

export const activeDevelopmentSources = [
  {
    csiVersion: "MASTERFORMAT_1995",
    filename: "1995_MasterFormat_ocrmypdf_deskew_clean.pdf",
    role: csiCatalogSourceRoles.ACTIVE_DEVELOPMENT,
    purpose: "Primary development extraction source for the 1995 normalized catalog.",
  },
  {
    csiVersion: "MASTERFORMAT_2004_PLUS",
    filename: "2004+ PDF-derived catalog source files",
    role: csiCatalogSourceRoles.ACTIVE_DEVELOPMENT,
    purpose: "Development PDF-derived 2004+ catalog inputs replacing old Excel-derived lists.",
  },
] as const;

export const qaOnlySources = [
  {
    csiVersion: "MASTERFORMAT_1995",
    filename: "1995 MasterFormat CSI_CODES OCR Bluebeam Tables and Forms.pdf",
    role: csiCatalogSourceRoles.QA_ONLY,
    purpose: "QA-only comparison source for extraction completeness and formatting review.",
  },
  {
    csiVersion: "MASTERFORMAT_2004_PLUS",
    filename: "2004+ keyword index",
    role: csiCatalogSourceRoles.QA_ONLY,
    purpose: "Metadata/search evidence only; not canonical catalog identity.",
  },
  {
    csiVersion: "CROSSWALK",
    filename: "CSI Crosswalk Excel.xlsx",
    role: csiCatalogSourceRoles.QA_ONLY,
    purpose: "Raw crosswalk relationship evidence resolved against normalized canonical catalogs.",
  },
] as const;

export const deprecatedSources = [
  {
    csiVersion: "MASTERFORMAT_1995",
    filename: "1995 MasterFormat CSI_CODES OCR.pdf",
    role: csiCatalogSourceRoles.DEPRECATED,
    purpose: "Deprecated/archive-only OCR source retained for traceability.",
  },
] as const;

export const archiveVisualBackupSources = [
  {
    csiVersion: "MASTERFORMAT_1995",
    filename: "Original scanned 1995 PDF",
    role: csiCatalogSourceRoles.ARCHIVE_VISUAL_BACKUP,
    purpose: "Visual backup only, not a runtime or active extraction source.",
  },
] as const;

export const runtimeDataOutputs = [
  "src/data/generated/csiCatalog1995.generated.ts",
  "src/data/generated/csiCatalog2004Plus.generated.ts",
  "src/data/generated/csiCatalogMetadata1995.generated.ts",
  "src/data/generated/csiCatalogMetadata2004Plus.generated.ts",
  "src/data/generated/csiCrosswalkResolved.generated.ts",
] as const;

export const normalizedDataOutputs = [
  "data/normalized/csi_1995_normalized_catalog.xlsx",
  "data/normalized/csi_2004_plus_normalized_catalog.xlsx",
  "data/normalized/csi_crosswalk_raw_import.xlsx",
  "data/normalized/csi_crosswalk_resolved.xlsx",
] as const;

export const sourceReplacementPolicy = {
  developmentSourcesAreTemporary: true,
  productionRequiresLicensedSourceMaterial: true,
  normalizedModelMustRemainSourceAgnostic: true,
  runtimeImportsMustRemainGeneratedStructuredData: true,
  rawSourceValuesMustBePreservedDuringCorrection: true,
  resolvedValuesAreAddedNotOverwritten: true,
} as const;

export const repositoryPlacementPolicy = {
  allowedInRepo: [
    "source-rule docs",
    "importer scripts",
    "normalized generated TypeScript data",
    "normalized generated QA workbooks where licensing permits",
    "non-licensed development evidence summaries",
    "metadata and issue reports",
    "references to external source files by filename",
  ],
  keepOutsideRuntimeAppPaths: [
    "raw PDFs",
    "OCR experiments",
    "scanned files",
    "licensed source documents",
    "raw Excel source files",
    "intermediate extraction dumps",
    "source-specific QA artifacts",
  ],
  runtimeAppPathsMustNotContain: [
    "raw PDFs",
    "OCR PDFs",
    "scanned files",
    "licensed source documents",
    "raw source Excel files",
  ],
} as const;

export const division00Policy = {
  mayBeIncompleteDuringDevelopment: true,
  requiredReviewStatusWhenIncomplete: csiCatalogReviewStatuses.INCOMPLETE_SOURCE,
  doNotFakeMissingItems: true,
  doNotSilentlySynthesizeWithoutSourceBackedRule: true,
} as const;

export const crosswalkCorrectionPolicy = {
  rawImportedValuesAreEvidence: true,
  preserveRawSourceValues: true,
  addResolvedNormalizedValues: true,
  doNotOverwriteRawImportedValues: true,
  resolveAgainstNormalizedCanonicalCatalogs: true,
  reviewUnresolvedSourceOrTargetItems: true,
} as const;

export const csiCatalogNormalizationAntiPatterns = [
  "Import raw PDFs into runtime app code.",
  "Parse PDFs in the browser app.",
  "Make runtime behavior depend on OCR formatting.",
  "Make runtime behavior depend on Excel row order or column layout.",
  "Treat keyword indexes as canonical catalog identity.",
  "Overwrite raw crosswalk values during correction.",
  "Fake missing Division 00 data.",
  "Keep MASTERFORMAT_CURRENT as a runtime ID.",
  "Put licensed source documents in runtime app paths.",
  "Use raw source filenames as stable app object IDs.",
  "Generate multiple competing active catalogs for the same MasterFormat version.",
  "Require Project Setup, Project Scope, bid packages, or subcontractor matching to understand source-document layout.",
] as const;
