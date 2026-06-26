import { division32SidewalkFixture } from "./fixtures/division32SidewalkFixture";
import type {
  CsiCatalogItem,
  CsiCatalogMetadata,
  CsiCrosswalkRelationship,
  CsiNormalizedDataSet,
  CsiTradeMappingMatchStrength,
  CsiTradeMappingReference,
} from "./types";

export type CsiNormalizationValidationIssue = {
  severity: "error" | "warning";
  code: string;
  message: string;
  relatedId?: string;
  relatedCode?: string;
};

export type CsiNormalizationValidationResult = {
  issues: CsiNormalizationValidationIssue[];
  errorCount: number;
  warningCount: number;
  isValid: boolean;
};

type UnknownRecord = Record<string, unknown>;

const allowedTradeMatchStrengths: CsiTradeMappingMatchStrength[] = [
  "strong",
  "moderate",
  "weak",
  "needs_review",
];

function createResult(
  issues: CsiNormalizationValidationIssue[],
): CsiNormalizationValidationResult {
  const errorCount = issues.filter((issue) => issue.severity === "error").length;
  const warningCount = issues.filter((issue) => issue.severity === "warning").length;

  return {
    issues,
    errorCount,
    warningCount,
    isValid: errorCount === 0,
  };
}

function hasNumericConfidence(record: unknown): boolean {
  if (!record || typeof record !== "object") {
    return false;
  }

  const value = (record as UnknownRecord).confidence;
  return typeof value === "number";
}

function hasText(value: string | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function makeCatalogCodeKey(item: Pick<CsiCatalogItem, "version" | "code">): string {
  return `${item.version}:${item.code.trim().toLowerCase()}`;
}

function makeCatalogCodeSet(catalogItems: CsiCatalogItem[]): Set<string> {
  return new Set(catalogItems.map((item) => makeCatalogCodeKey(item)));
}

function addIssue(
  issues: CsiNormalizationValidationIssue[],
  issue: CsiNormalizationValidationIssue,
): void {
  issues.push(issue);
}

export function validateCsiCatalogItems(
  catalogItems: CsiCatalogItem[],
): CsiNormalizationValidationResult {
  const issues: CsiNormalizationValidationIssue[] = [];
  const seenIds = new Set<string>();
  const seenVersionCodes = new Set<string>();
  const metadataRecordTypes = new Set(["included_topic", "keyword_index_term", "alternate_term"]);

  for (const item of catalogItems) {
    if (seenIds.has(item.id)) {
      addIssue(issues, {
        severity: "error",
        code: "duplicate_catalog_item_id",
        message: `Duplicate canonical catalog item ID: ${item.id}`,
        relatedId: item.id,
        relatedCode: item.code,
      });
    }
    seenIds.add(item.id);

    const versionCodeKey = makeCatalogCodeKey(item);
    if (seenVersionCodes.has(versionCodeKey)) {
      addIssue(issues, {
        severity: "error",
        code: "duplicate_catalog_version_code",
        message: `Duplicate canonical catalog record for ${item.version} ${item.code}.`,
        relatedId: item.id,
        relatedCode: item.code,
      });
    }
    seenVersionCodes.add(versionCodeKey);

    if (!hasText(item.code)) {
      addIssue(issues, {
        severity: "error",
        code: "missing_catalog_item_code",
        message: "Catalog item is missing a CSI code.",
        relatedId: item.id,
      });
    }

    if (!hasText(item.title)) {
      addIssue(issues, {
        severity: "error",
        code: "missing_catalog_item_title",
        message: "Catalog item is missing a title.",
        relatedId: item.id,
        relatedCode: item.code,
      });
    }

    if (metadataRecordTypes.has(item.recordType)) {
      addIssue(issues, {
        severity: "error",
        code: "metadata_represented_as_catalog_item",
        message:
          "Keyword, alternate-term, or included-topic metadata must not be represented as a canonical catalog item.",
        relatedId: item.id,
        relatedCode: item.code,
      });
    }
  }

  return createResult(issues);
}

export function validateCsiCatalogMetadata(
  metadata: CsiCatalogMetadata[],
  catalogItems: CsiCatalogItem[],
): CsiNormalizationValidationResult {
  const issues: CsiNormalizationValidationIssue[] = [];
  const catalogItemIds = new Set(catalogItems.map((item) => item.id));

  for (const metadataRecord of metadata) {
    if (!catalogItemIds.has(metadataRecord.csiItemId)) {
      addIssue(issues, {
        severity: "error",
        code: "metadata_points_to_missing_catalog_item",
        message: `Metadata record points to missing catalog item ${metadataRecord.csiItemId}.`,
        relatedId: metadataRecord.id,
        relatedCode: metadataRecord.code,
      });
    }
  }

  return createResult(issues);
}

export function validateCsiCrosswalkRelationships(
  crosswalkRelationships: CsiCrosswalkRelationship[],
  catalogItems: CsiCatalogItem[],
): CsiNormalizationValidationResult {
  const issues: CsiNormalizationValidationIssue[] = [];
  const catalogCodeSet = makeCatalogCodeSet(catalogItems);

  for (const relationship of crosswalkRelationships) {
    if (!hasText(relationship.sourceCode)) {
      addIssue(issues, {
        severity: "error",
        code: "crosswalk_source_code_missing",
        message: "Crosswalk relationship is missing a source code.",
        relatedId: relationship.id,
      });
    }

    if (hasText(relationship.rawTargetCode) && !hasText(relationship.resolvedTargetCode)) {
      addIssue(issues, {
        severity: "error",
        code: "crosswalk_raw_target_without_resolved_target",
        message:
          "Crosswalk relationship has a raw target code but no resolved target code.",
        relatedId: relationship.id,
        relatedCode: relationship.rawTargetCode,
      });
    }

    if (hasText(relationship.resolvedTargetCode)) {
      const resolvedTargetKey = makeCatalogCodeKey({
        version: relationship.targetVersion,
        code: relationship.resolvedTargetCode,
      });

      if (!catalogCodeSet.has(resolvedTargetKey)) {
        addIssue(issues, {
          severity: "error",
          code: "resolved_target_code_not_in_target_catalog",
          message: `Resolved target ${relationship.targetVersion} ${relationship.resolvedTargetCode} was not found in the target catalog.`,
          relatedId: relationship.id,
          relatedCode: relationship.resolvedTargetCode,
        });
      }
    }

    const parentContextCode = relationship.parentContextCode;
    if (hasText(parentContextCode)) {
      const parentContextKey = makeCatalogCodeKey({
        version: relationship.targetVersion,
        code: parentContextCode,
      });

      if (!catalogCodeSet.has(parentContextKey)) {
        addIssue(issues, {
          severity: "error",
          code: "parent_context_code_not_in_target_catalog",
          message: `Parent context ${relationship.targetVersion} ${parentContextCode} was not found in the target catalog.`,
          relatedId: relationship.id,
          relatedCode: parentContextCode,
        });
      }
    }

    if (
      relationship.relationshipType === "parent_context_only" &&
      hasText(relationship.parentContextCode) &&
      relationship.resolvedTargetCode === relationship.parentContextCode
    ) {
      addIssue(issues, {
        severity: "error",
        code: "parent_context_used_as_final_target",
        message:
          "parent_context_only must not use the parent context code as the final resolved target when a more specific target is expected.",
        relatedId: relationship.id,
        relatedCode: relationship.resolvedTargetCode,
      });
    }

    if (relationship.issueType === "over_broad_parent_target" && !hasText(relationship.parentContextCode)) {
      addIssue(issues, {
        severity: "error",
        code: "over_broad_parent_target_missing_parent_context",
        message:
          "over_broad_parent_target relationships must preserve parentContextCode.",
        relatedId: relationship.id,
        relatedCode: relationship.resolvedTargetCode,
      });
    }

    if (relationship.reviewStatus === "corrected" && !hasText(relationship.notes)) {
      addIssue(issues, {
        severity: "error",
        code: "corrected_crosswalk_missing_notes",
        message: "Corrected crosswalk relationships must include notes.",
        relatedId: relationship.id,
        relatedCode: relationship.resolvedTargetCode,
      });
    }

    if (hasNumericConfidence(relationship)) {
      addIssue(issues, {
        severity: "error",
        code: "numeric_confidence_on_crosswalk_relationship",
        message:
          "Crosswalk relationships must use relationship fields and warnings, not numeric confidence.",
        relatedId: relationship.id,
        relatedCode: relationship.resolvedTargetCode,
      });
    }
  }

  return createResult(issues);
}

export function validateCsiTradeMappingReferences(
  tradeMappingReferences: CsiTradeMappingReference[],
): CsiNormalizationValidationResult {
  const issues: CsiNormalizationValidationIssue[] = [];
  const allowedStrengths = new Set<string>(allowedTradeMatchStrengths);

  for (const reference of tradeMappingReferences) {
    if (hasNumericConfidence(reference)) {
      addIssue(issues, {
        severity: "error",
        code: "numeric_confidence_on_trade_mapping",
        message:
          "Trade mapping records must use matchStrength labels and reason codes, not numeric confidence.",
        relatedId: reference.id,
        relatedCode: reference.csiCode,
      });
    }

    if (!allowedStrengths.has(reference.matchStrength)) {
      addIssue(issues, {
        severity: "error",
        code: "invalid_trade_mapping_match_strength",
        message:
          "Trade mapping matchStrength must be one of strong, moderate, weak, needs_review.",
        relatedId: reference.id,
        relatedCode: reference.csiCode,
      });
    }
  }

  return createResult(issues);
}

export function validateCsiNormalizationFixture(
  fixture: CsiNormalizedDataSet,
): CsiNormalizationValidationResult {
  const results = [
    validateCsiCatalogItems(fixture.catalogItems),
    validateCsiCatalogMetadata(fixture.metadata, fixture.catalogItems),
    validateCsiCrosswalkRelationships(
      fixture.crosswalkRelationships,
      fixture.catalogItems,
    ),
    validateCsiTradeMappingReferences(fixture.tradeMappingReferences),
  ];

  return createResult(results.flatMap((result) => result.issues));
}

export const division32SidewalkFixtureValidation = validateCsiNormalizationFixture(
  division32SidewalkFixture,
);
