import type {
  CsiCatalogItem,
  CsiCrosswalkRelationship,
} from "../types";
import {
  makeNormalizedCsiCodeKey,
  normalizeCsiCode,
} from "./normalizeCsiCode";
import type {
  BuildNormalizedCrosswalkRelationshipsResult,
  ImportedCsiCrosswalkRow,
} from "./types";
import { toCsiSourceTrace } from "./types";

export function buildNormalizedCrosswalkRelationships({
  crosswalkRows,
  targetCatalogItems = [],
}: {
  crosswalkRows: ImportedCsiCrosswalkRow[];
  targetCatalogItems?: CsiCatalogItem[];
}): BuildNormalizedCrosswalkRelationshipsResult {
  const targetCatalogCodeKeys = new Set(
    targetCatalogItems.map((item) => makeNormalizedCsiCodeKey(item.version, item.code)),
  );

  return {
    crosswalkRelationships: crosswalkRows.map((row) =>
      buildCrosswalkRelationship(row, targetCatalogCodeKeys),
    ),
  };
}

function buildCrosswalkRelationship(
  row: ImportedCsiCrosswalkRow,
  targetCatalogCodeKeys: Set<string>,
): CsiCrosswalkRelationship {
  const sourceCode = normalizeCsiCode(row.sourceCode);
  const rawTargetCode = normalizeCsiCode(row.rawTargetCode);
  const resolvedTargetCode = row.resolvedTargetCode
    ? normalizeCsiCode(row.resolvedTargetCode)
    : undefined;
  const parentContextCode = row.parentContextCode
    ? normalizeCsiCode(row.parentContextCode)
    : undefined;
  const warnings = [...(row.warnings ?? [])];

  if (
    resolvedTargetCode &&
    targetCatalogCodeKeys.size > 0 &&
    !targetCatalogCodeKeys.has(makeNormalizedCsiCodeKey(row.targetVersion, resolvedTargetCode.displayCode))
  ) {
    warnings.push(
      `Resolved target ${resolvedTargetCode.displayCode} was not found in the provided target catalog.`,
    );
  }

  return {
    id:
      row.id ??
      `crosswalk-${row.sourceVersion.toLowerCase()}-${sourceCode.normalizedCode.toLowerCase()}-${row.targetVersion.toLowerCase()}`,
    sourceVersion: row.sourceVersion,
    sourceCode: sourceCode.displayCode,
    sourceTitle: row.sourceTitle.trim(),
    targetVersion: row.targetVersion,
    rawTargetCode: rawTargetCode.displayCode,
    rawTargetTitle: row.rawTargetTitle.trim(),
    resolvedTargetCode: resolvedTargetCode?.displayCode ?? "",
    resolvedTargetTitle: row.resolvedTargetTitle?.trim() ?? "",
    relationshipRole: row.relationshipRole ?? "review_only",
    relationshipType: row.relationshipType ?? "no_clear_match",
    cardinality: row.cardinality ?? "unmapped_source",
    reviewStatus: row.reviewStatus ?? "needs_review",
    issueType: row.issueType ?? "none",
    sourceBasis: row.sourceBasis ?? "raw_crosswalk_excel",
    parentContextCode: parentContextCode?.displayCode,
    parentContextTitle: row.parentContextTitle,
    notes: row.notes,
    warnings,
    sourceTrace: toCsiSourceTrace(row.sourceTrace),
  };
}
