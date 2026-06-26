/**
 * Bid-Leveler CSI Crosswalk Normalization Source
 *
 * Planning/source constants for CSI / MasterFormat crosswalk import,
 * correction, resolution, and display rules. Do not import this file into
 * live app code until an explicit implementation phase.
 */

export const CSI_CROSSWALK_NORMALIZATION_SOURCE_RULE_VERSION =
  "CSI_CROSSWALK_NORMALIZATION_V1" as const;

export const csiCrosswalkLayerIds = {
  CSI_CATALOG: "CSI_CATALOG",
  CSI_CATALOG_METADATA: "CSI_CATALOG_METADATA",
  CSI_CROSSWALK: "CSI_CROSSWALK",
  CSI_TRADE_MAPPING: "CSI_TRADE_MAPPING",
} as const;

export type CsiCrosswalkLayerId =
  (typeof csiCrosswalkLayerIds)[keyof typeof csiCrosswalkLayerIds];

export const csiCrosswalkSourceRoles = {
  RAW_RELATIONSHIP_EVIDENCE: "RAW_RELATIONSHIP_EVIDENCE",
  QA_REFERENCE: "QA_REFERENCE",
  RESOLVED_RUNTIME_OUTPUT: "RESOLVED_RUNTIME_OUTPUT",
  DEPRECATED_SOURCE: "DEPRECATED_SOURCE",
} as const;

export type CsiCrosswalkSourceRole =
  (typeof csiCrosswalkSourceRoles)[keyof typeof csiCrosswalkSourceRoles];

export const rawCrosswalkSources = [
  {
    filename: "CSI Crosswalk Excel.xlsx",
    role: csiCrosswalkSourceRoles.RAW_RELATIONSHIP_EVIDENCE,
    purpose:
      "Raw cross-version relationship evidence resolved against normalized canonical catalogs before runtime use.",
  },
] as const;

export const csiCrosswalkNormalizationStages = {
  RAW_IMPORT_CAPTURED: "RAW_IMPORT_CAPTURED",
  RAW_VALUES_PRESERVED: "RAW_VALUES_PRESERVED",
  SOURCE_TARGET_RESOLUTION_ATTEMPTED: "SOURCE_TARGET_RESOLUTION_ATTEMPTED",
  RESOLVED_RECORD_DRAFTED: "RESOLVED_RECORD_DRAFTED",
  QA_REVIEWED: "QA_REVIEWED",
  GENERATED_RUNTIME_DATA_READY: "GENERATED_RUNTIME_DATA_READY",
} as const;

export type CsiCrosswalkNormalizationStage =
  (typeof csiCrosswalkNormalizationStages)[keyof typeof csiCrosswalkNormalizationStages];

export const csiCrosswalkRelationshipRoles = {
  PRIMARY: "primary",
  SECONDARY: "secondary",
  RELATED: "related",
  DEPRECATED_HISTORICAL: "deprecated_historical",
  REVIEW_ONLY: "review_only",
} as const;

export type CsiCrosswalkRelationshipRole =
  (typeof csiCrosswalkRelationshipRoles)[keyof typeof csiCrosswalkRelationshipRoles];

export const csiCrosswalkRelationshipTypes = {
  DIRECT_EQUIVALENT: "direct_equivalent",
  SPLIT_INTO_MULTIPLE_CODES: "split_into_multiple_codes",
  CONSOLIDATED_FROM_MULTIPLE_CODES: "consolidated_from_multiple_codes",
  BROADER_THAN_TARGET: "broader_than_target",
  NARROWER_THAN_TARGET: "narrower_than_target",
  RELATED_OPERATIONAL_MATCH: "related_operational_match",
  PARENT_CONTEXT_ONLY: "parent_context_only",
  NO_CLEAR_MATCH: "no_clear_match",
} as const;

export type CsiCrosswalkRelationshipType =
  (typeof csiCrosswalkRelationshipTypes)[keyof typeof csiCrosswalkRelationshipTypes];

export const csiCrosswalkCardinalityValues = {
  ONE_TO_ONE: "one_to_one",
  ONE_TO_MANY: "one_to_many",
  MANY_TO_ONE: "many_to_one",
  MANY_TO_MANY: "many_to_many",
  UNMAPPED_SOURCE: "unmapped_source",
  UNMAPPED_TARGET: "unmapped_target",
} as const;

export type CsiCrosswalkCardinalityValue =
  (typeof csiCrosswalkCardinalityValues)[keyof typeof csiCrosswalkCardinalityValues];

export const csiCrosswalkReviewStatuses = {
  CLEAN: "clean",
  CORRECTED: "corrected",
  NEEDS_REVIEW: "needs_review",
  AMBIGUOUS: "ambiguous",
  UNMAPPED: "unmapped",
  REJECTED: "rejected",
} as const;

export type CsiCrosswalkReviewStatus =
  (typeof csiCrosswalkReviewStatuses)[keyof typeof csiCrosswalkReviewStatuses];

export const csiCrosswalkIssueTypes = {
  NONE: "none",
  OVER_BROAD_PARENT_TARGET: "over_broad_parent_target",
  PARENT_CONTEXT_ONLY: "parent_context_only",
  SPECIFIC_CHILD_AVAILABLE: "specific_child_available",
  TITLE_MISMATCH: "title_mismatch",
  MISSING_SOURCE_CODE: "missing_source_code",
  MISSING_TARGET_CODE: "missing_target_code",
  ALIAS_OR_KEYWORD_MAPPED_AS_CODE: "alias_or_keyword_mapped_as_code",
  INCLUDED_TOPIC_MAPPED_AS_CODE: "included_topic_mapped_as_code",
  DUPLICATE_SAME_CODE_RECORD: "duplicate_same_code_record",
  SOURCE_INCOMPLETE: "source_incomplete",
  OCR_UNCERTAIN: "ocr_uncertain",
  TRADE_IMPACTING: "trade_impacting",
} as const;

export type CsiCrosswalkIssueType =
  (typeof csiCrosswalkIssueTypes)[keyof typeof csiCrosswalkIssueTypes];

export const csiCrosswalkSourceBasisValues = {
  RAW_CROSSWALK_EXCEL: "raw_crosswalk_excel",
  EXACT_CODE_AND_TITLE_MATCH: "exact_code_and_title_match",
  EXACT_CODE_MATCH_WITH_TITLE_CORRECTION: "exact_code_match_with_title_correction",
  SPECIFIC_CHILD_CORRECTION: "specific_child_correction",
  PARENT_CONTEXT_PRESERVED: "parent_context_preserved",
  MANUAL_REVIEW_CORRECTION: "manual_review_correction",
  NORMALIZED_CATALOG_RESOLUTION: "normalized_catalog_resolution",
  UNRESOLVED_RAW_EVIDENCE: "unresolved_raw_evidence",
} as const;

export type CsiCrosswalkSourceBasisValue =
  (typeof csiCrosswalkSourceBasisValues)[keyof typeof csiCrosswalkSourceBasisValues];

export const csiTradeMatchStrengthLabels = {
  STRONG: "strong",
  MODERATE: "moderate",
  WEAK: "weak",
  NEEDS_REVIEW: "needs_review",
} as const;

export type CsiTradeMatchStrengthLabel =
  (typeof csiTradeMatchStrengthLabels)[keyof typeof csiTradeMatchStrengthLabels];

export const prohibitedConfidenceFormats = [
  "numeric percentages for crosswalk relationships",
  "confidence: 87%",
  "87% confidence",
  "decimal confidence scores such as 0.87",
  "vague confidence labels without reason codes",
] as const;

export const csiCrosswalkWorkbenchFilters = {
  ALL_RAW_RELATIONSHIPS: "all_raw_relationships",
  RESOLVED_RELATIONSHIPS: "resolved_relationships",
  OVER_BROAD_TARGETS: "over_broad_targets",
  PARENT_CONTEXT_ONLY_MAPPINGS: "parent_context_only_mappings",
  EXACT_TITLE_CORRECTIONS: "exact_title_corrections",
  ALIAS_KEYWORD_MAPPED_AS_CODE: "alias_keyword_mapped_as_code",
  INCLUDED_TOPIC_MAPPED_AS_CODE: "included_topic_mapped_as_code",
  MISSING_SOURCE_CODE: "missing_source_code",
  MISSING_TARGET_CODE: "missing_target_code",
  AMBIGUOUS_RELATIONSHIPS: "ambiguous_relationships",
  UNMAPPED_1995_CODES: "unmapped_1995_codes",
  UNMAPPED_2004_PLUS_CODES: "unmapped_2004_plus_codes",
  TRADE_IMPACTING_ISSUES: "trade_impacting_issues",
} as const;

export type CsiCrosswalkWorkbenchFilter =
  (typeof csiCrosswalkWorkbenchFilters)[keyof typeof csiCrosswalkWorkbenchFilters];

export const canonicalCrosswalkExampleCorrections = [
  {
    id: "1995-02775-sidewalks-to-2004-plus-321623-sidewalks",
    sourceVersion: "MASTERFORMAT_1995",
    sourceCode: "02775",
    sourceTitle: "Sidewalks",
    targetVersion: "MASTERFORMAT_2004_PLUS",
    rawTargetCode: "32 10 00",
    rawTargetTitle: "Bases, Ballasts, and Paving",
    resolvedTargetCode: "32 16 23",
    resolvedTargetTitle: "Sidewalks",
    relationshipRole: csiCrosswalkRelationshipRoles.PRIMARY,
    relationshipType: csiCrosswalkRelationshipTypes.DIRECT_EQUIVALENT,
    cardinality: csiCrosswalkCardinalityValues.ONE_TO_ONE,
    reviewStatus: csiCrosswalkReviewStatuses.CORRECTED,
    issueType: csiCrosswalkIssueTypes.OVER_BROAD_PARENT_TARGET,
    sourceBasis: csiCrosswalkSourceBasisValues.SPECIFIC_CHILD_CORRECTION,
    parentContextCode: "32 10 00",
    parentContextTitle: "Bases, Ballasts, and Paving",
    notes:
      "Raw target is a parent grouping. Resolved target is the specific child code.",
  },
] as const;

export const canonicalCrosswalkTargetPolicy = {
  canonicalTargetsMustBeNormalizedCatalogItems: true,
  metadataTermsCannotBeCanonicalTargets: [
    "keyword index terms",
    "included topics",
    "alternate terms",
    "product names",
    "abbreviations",
    "see references",
    "OCR-only text fragments",
    "source-specific row labels",
  ],
  unresolvedMetadataTermsRequireReview: true,
} as const;

export const crosswalkCorrectionPolicy = {
  rawImportedValuesAreEvidence: true,
  preserveRawImportedValues: true,
  addResolvedValues: true,
  doNotOverwriteRawSourceEvidence: true,
  resolveTargetsAgainstNormalizedCanonicalCatalogs: true,
  runtimeUsesResolvedRecordsOnly: true,
} as const;

export const csiCrosswalkRuntimeOutputs = [
  "src/data/generated/csiCrosswalkResolved.generated.ts",
] as const;

export const csiCrosswalkNormalizedDataOutputs = [
  "data/normalized/csi_crosswalk_raw_import.xlsx",
  "data/normalized/csi_crosswalk_resolved.xlsx",
] as const;

export const csiCrosswalkDisplayPolicy = {
  productionUiDisplaysResolvedRecords: true,
  rawEvidenceIsForWorkbenchQaAndDebugOnly: true,
  displayMasterFormatVersions: true,
  displayRelationshipRole: true,
  displayRelationshipType: true,
  displayCardinality: true,
  displayReviewStatus: true,
  displayIssueType: true,
  displaySourceBasis: true,
  displayWarningsWhenPresent: true,
  prohibitNumericConfidencePercentages: true,
} as const;

export const csiCrosswalkRepositoryPlacementPolicy = {
  allowedInRepo: [
    "source-rule docs",
    "importer scripts",
    "resolved generated TypeScript data",
    "normalized QA workbooks where licensing permits",
    "metadata and issue reports",
    "references to external source files by filename",
  ],
  keepOutsideRuntimeAppPaths: [
    "raw Excel source files",
    "licensed source documents",
    "intermediate extraction dumps",
    "source-specific QA artifacts",
  ],
} as const;

export const csiCrosswalkNormalizationAntiPatterns = [
  "Treating the crosswalk Excel as canonical truth.",
  "Overwriting raw crosswalk data instead of preserving raw and resolved values.",
  "Use raw crosswalk records directly in runtime app behavior.",
  "Mapping keyword index terms as canonical CSI records.",
  "Mapping included topics as canonical CSI records.",
  "Use product names or abbreviations as canonical crosswalk targets.",
  "Merge CSI catalog metadata into CSI crosswalk relationships.",
  "Merge CSI crosswalk relationships into CSI trade mapping rules.",
  "Infer bid package ownership from crosswalk equivalence alone.",
  "Depend on Excel row order, sheet layout, or column names in runtime app behavior.",
  "Present ambiguous crosswalk relationships as clean one-to-one mappings.",
  "Using 32 10 00 as the final target for 02775 Sidewalks when 32 16 23 Sidewalks exists.",
  "Using numeric confidence percentages for crosswalk relationships.",
  "Using vague confidence labels without reason codes.",
  "Mixing catalog records, metadata terms, crosswalk relationships, and trade mappings in one flat table.",
] as const;
