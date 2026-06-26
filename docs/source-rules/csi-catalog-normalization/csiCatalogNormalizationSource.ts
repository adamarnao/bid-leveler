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

export const activeDevelopmentSources = [
  {
    csiVersion: "MASTERFORMAT_1995",
    filename: "1995_MasterFormat_ocrmypdf_deskew_clean.pdf",
    role: csiCatalogSourceRoles.ACTIVE_DEVELOPMENT,
    purpose: "Active development 1995 extraction source is OCRmyPDF output.",
  },
  {
    csiVersion: "MASTERFORMAT_2004_PLUS",
    filename: "2004+ PDF-derived catalog source files",
    role: csiCatalogSourceRoles.ACTIVE_DEVELOPMENT,
    purpose: "2004+ PDF-derived catalogs replace old Excel-derived 2004+ catalog lists during development.",
  },
] as const;

export const qaOnlySources = [
  {
    csiVersion: "MASTERFORMAT_1995",
    filename: "1995 MasterFormat CSI_CODES OCR Bluebeam Tables and Forms.pdf",
    role: csiCatalogSourceRoles.QA_ONLY,
    purpose: "Bluebeam Tables/Forms OCR is QA comparison only.",
  },
  {
    csiVersion: "MASTERFORMAT_2004_PLUS",
    filename: "2004+ keyword index",
    role: csiCatalogSourceRoles.QA_ONLY,
    purpose: "2004+ keyword index is metadata/search evidence, not canonical catalog identity.",
  },
] as const;

export const deprecatedSources = [
  {
    csiVersion: "MASTERFORMAT_1995",
    filename: "1995 MasterFormat CSI_CODES OCR.pdf",
    role: csiCatalogSourceRoles.DEPRECATED,
    purpose: "First Bluebeam text OCR is deprecated/archive only.",
  },
] as const;

export const archiveVisualBackupSources = [
  {
    csiVersion: "MASTERFORMAT_1995",
    filename: "Original scanned 1995 PDF",
    role: csiCatalogSourceRoles.ARCHIVE_VISUAL_BACKUP,
    purpose: "Original scanned 1995 PDF is visual backup only.",
  },
] as const;

export const csiCatalogNormalizationStages = {
  RAW_EVIDENCE_CAPTURED: "RAW_EVIDENCE_CAPTURED",
  RAW_IMPORT_PARSED: "RAW_IMPORT_PARSED",
  NORMALIZED_CATALOG_DRAFTED: "NORMALIZED_CATALOG_DRAFTED",
  NORMALIZED_CATALOG_QA_REVIEWED: "NORMALIZED_CATALOG_QA_REVIEWED",
  GENERATED_RUNTIME_DATA_READY: "GENERATED_RUNTIME_DATA_READY",
  LICENSED_SOURCE_REPLACEMENT_READY: "LICENSED_SOURCE_REPLACEMENT_READY",
} as const;

export type CsiCatalogNormalizationStage =
  (typeof csiCatalogNormalizationStages)[keyof typeof csiCatalogNormalizationStages];

export const csiCatalogReviewStatuses = {
  CLEAN: "clean",
  CORRECTED: "corrected",
  NEEDS_REVIEW: "needs_review",
  AMBIGUOUS: "ambiguous",
  UNMAPPED: "unmapped",
  REJECTED: "rejected",
  INCOMPLETE_SOURCE: "incomplete_source",
} as const;

export type CsiCatalogReviewStatus =
  (typeof csiCatalogReviewStatuses)[keyof typeof csiCatalogReviewStatuses];

export const csiCatalogRuntimeDataOutputs = [
  "src/data/generated/csiCatalog1995.generated.ts",
  "src/data/generated/csiCatalog2004Plus.generated.ts",
  "src/data/generated/csiCatalogMetadata1995.generated.ts",
  "src/data/generated/csiCatalogMetadata2004Plus.generated.ts",
] as const;

export const csiCatalogSourceReplacementPolicy = {
  developmentSourcesAreTemporary: true,
  productionReleaseMustUseProperlyLicensedCsiMasterFormatSourceMaterial: true,
  normalizedModelMustRemainSourceAgnostic: true,
  runtimeImportsMustRemainGeneratedStructuredData: true,
} as const;

export const csiCatalogRepositoryPlacementPolicy = {
  allowedInRepo: [
    "source-rule docs",
    "importer scripts",
    "generated structured TypeScript data",
    "normalized QA summaries where licensing permits",
    "references to external source files by filename",
  ],
  keepOutsideRuntimeAppPaths: [
    "raw PDFs",
    "OCR PDFs",
    "scanned files",
    "licensed source documents",
    "raw Excel source files",
    "source-specific extraction dumps",
  ],
} as const;

export const csiCatalogNormalizationAntiPatterns = [
  "Import raw PDFs into runtime app code.",
  "Parse PDFs in the browser app.",
  "Make runtime behavior depend on OCR formatting.",
  "Make runtime behavior depend on PDF page layout.",
  "Make runtime behavior depend on Excel row layout.",
  "Treat keyword indexes as canonical catalog identity.",
  "Fake missing Division 00 data.",
  "Put licensed source documents in runtime app paths.",
  "Use raw source filenames as stable app object IDs.",
] as const;
