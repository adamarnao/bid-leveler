export type CsiVersion = "MASTERFORMAT_1995" | "MASTERFORMAT_2004_PLUS";

export type CsiNormalizationReviewStatus =
  | "clean"
  | "corrected"
  | "needs_review"
  | "ambiguous"
  | "unmapped"
  | "rejected"
  | "incomplete_source";

export type CsiSourceRole =
  | "active_development"
  | "qa_only"
  | "deprecated"
  | "archive_visual_backup"
  | "raw_relationship_evidence"
  | "resolved_runtime_output"
  | "licensed_production_source";

export type CsiCatalogRecordType =
  | "division"
  | "subdivision"
  | "section"
  | "section_group"
  | "included_topic"
  | "placeholder";

export type CsiCatalogMetadataType =
  | "alternate_term"
  | "abbreviation"
  | "product"
  | "included_topic"
  | "usually_includes"
  | "may_include"
  | "does_not_include"
  | "see_reference"
  | "see_also_reference"
  | "keyword_index_term";

export type CsiRelationshipRole =
  | "primary"
  | "secondary"
  | "related"
  | "deprecated_historical"
  | "review_only";

export type CsiRelationshipType =
  | "direct_equivalent"
  | "split_into_multiple_codes"
  | "consolidated_from_multiple_codes"
  | "broader_than_target"
  | "narrower_than_target"
  | "related_operational_match"
  | "parent_context_only"
  | "no_clear_match";

export type CsiCrosswalkCardinality =
  | "one_to_one"
  | "one_to_many"
  | "many_to_one"
  | "many_to_many"
  | "unmapped_source"
  | "unmapped_target";

export type CsiCrosswalkIssueType =
  | "none"
  | "over_broad_parent_target"
  | "parent_context_only"
  | "specific_child_available"
  | "title_mismatch"
  | "missing_source_code"
  | "missing_target_code"
  | "alias_or_keyword_mapped_as_code"
  | "included_topic_mapped_as_code"
  | "duplicate_same_code_record"
  | "source_incomplete"
  | "ocr_uncertain"
  | "trade_impacting";

export type CsiTradeMappingMatchStrength =
  | "strong"
  | "moderate"
  | "weak"
  | "needs_review";

export type CsiSourceTrace = {
  sourceId: string;
  sourceRole: CsiSourceRole;
  sourceName: string;
  sourceVersion?: string;
  sourcePage?: string;
  sourceSheet?: string;
  sourceRow?: string;
  sourceColumn?: string;
  importedAt?: string;
  importerVersion?: string;
  notes?: string;
};

/**
 * Catalog items are canonical CSI records. They represent codes that exist in
 * a normalized MasterFormat catalog and are safe runtime identities.
 */
export type CsiCatalogItem = {
  id: string;
  version: CsiVersion;
  code: string;
  normalizedCode: string;
  title: string;
  normalizedTitle: string;
  divisionCode: string;
  divisionTitle: string;
  subgroupTitle?: string;
  parentCode?: string;
  hierarchyLevel: number;
  recordType: CsiCatalogRecordType;
  description?: string;
  sourceTrace: CsiSourceTrace;
  reviewStatus: CsiNormalizationReviewStatus;
  notes?: string;
};

/**
 * Metadata records support search, references, and explanatory context.
 * They must not become fake CSI catalog records or canonical crosswalk targets.
 */
export type CsiCatalogMetadata = {
  id: string;
  csiItemId: string;
  version: CsiVersion;
  code: string;
  metadataType: CsiCatalogMetadataType;
  value: string;
  normalizedValue: string;
  targetCode?: string;
  sourceTrace: CsiSourceTrace;
  reviewStatus: CsiNormalizationReviewStatus;
  notes?: string;
};

export type CsiCrossReference = {
  id: string;
  csiItemId: string;
  version: CsiVersion;
  code: string;
  referenceType:
    | "raw_source_row"
    | "source_page"
    | "qa_comparison"
    | "metadata_record"
    | "crosswalk_raw_value"
    | "trade_mapping_rule";
  targetId?: string;
  targetCode?: string;
  label?: string;
  sourceTrace: CsiSourceTrace;
  reviewStatus: CsiNormalizationReviewStatus;
  notes?: string;
};

/**
 * Crosswalk records preserve raw imported target values separately from
 * resolved target values. Corrections add resolved fields and do not overwrite
 * source evidence.
 */
export type CsiCrosswalkRelationship = {
  id: string;
  sourceVersion: CsiVersion;
  sourceCode: string;
  sourceTitle: string;
  targetVersion: CsiVersion;
  rawTargetCode: string;
  rawTargetTitle: string;
  resolvedTargetCode: string;
  resolvedTargetTitle: string;
  relationshipRole: CsiRelationshipRole;
  relationshipType: CsiRelationshipType;
  cardinality: CsiCrosswalkCardinality;
  reviewStatus: CsiNormalizationReviewStatus;
  issueType: CsiCrosswalkIssueType;
  sourceBasis: string;
  parentContextCode?: string;
  parentContextTitle?: string;
  notes?: string;
  sourceTrace: CsiSourceTrace;
};

export type CsiTradeMappingReference = {
  id: string;
  csiVersion: CsiVersion;
  csiCode: string;
  tradeId: string;
  tradeName?: string;
  specializationId?: string;
  specializationName?: string;
  matchStrength: CsiTradeMappingMatchStrength;
  reasonCodes: string[];
  sourceTrace?: CsiSourceTrace;
  reviewStatus?: CsiNormalizationReviewStatus;
  notes?: string;
};

/**
 * Source files are replaceable. Runtime app behavior should depend on this
 * source-agnostic model, not raw PDFs, OCR output, Excel row layout, or source
 * document structure.
 */
export type CsiNormalizedDataSet = {
  version: CsiVersion;
  catalogItems: CsiCatalogItem[];
  metadata: CsiCatalogMetadata[];
  crossReferences: CsiCrossReference[];
  crosswalkRelationships: CsiCrosswalkRelationship[];
  tradeMappingReferences: CsiTradeMappingReference[];
  generatedAt: string;
  generatorVersion: string;
};
