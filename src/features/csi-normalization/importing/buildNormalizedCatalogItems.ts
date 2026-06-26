import type {
  CsiCatalogItem,
  CsiCatalogMetadata,
  CsiCatalogMetadataType,
  CsiVersion,
} from "../types";
import {
  makeNormalizedCsiCodeKey,
  normalizeCsiCode,
  normalizeTitle,
} from "./normalizeCsiCode";
import type {
  BuildNormalizedCatalogItemsResult,
  ImportedCsiCatalogRow,
  ImportedCsiMetadataRow,
} from "./types";
import { toCsiSourceTrace } from "./types";

const metadataOnlyTypes: ReadonlySet<CsiCatalogMetadataType> = new Set([
  "alternate_term",
  "abbreviation",
  "product",
  "included_topic",
  "usually_includes",
  "may_include",
  "does_not_include",
  "see_reference",
  "see_also_reference",
  "keyword_index_term",
]);

export function buildNormalizedCatalogItems({
  catalogRows,
  metadataRows = [],
}: {
  catalogRows: ImportedCsiCatalogRow[];
  metadataRows?: ImportedCsiMetadataRow[];
}): BuildNormalizedCatalogItemsResult {
  const catalogItems = catalogRows
    .filter((row) => row.isCanonicalCatalogItem)
    .map((row) => buildCatalogItem(row));
  const catalogItemIdByVersionCode = new Map(
    catalogItems.map((item) => [makeNormalizedCsiCodeKey(item.version, item.code), item.id]),
  );

  return {
    catalogItems,
    metadata: [
      ...metadataRows.map((row) => buildMetadataRecord(row, catalogItemIdByVersionCode)),
      ...catalogRows
        .filter((row) => !row.isCanonicalCatalogItem && row.metadataType)
        .map((row) => buildMetadataRecordFromCatalogRow(row, catalogItemIdByVersionCode)),
    ],
  };
}

function buildCatalogItem(row: ImportedCsiCatalogRow): CsiCatalogItem {
  const code = normalizeCsiCode(row.code);
  const divisionCode = normalizeCsiCode(row.divisionCode);
  const parentCode = row.parentCode ? normalizeCsiCode(row.parentCode) : undefined;

  return {
    id: row.id ?? makeCatalogItemId(row.version, code.displayCode),
    version: row.version,
    code: code.displayCode,
    normalizedCode: code.normalizedCode,
    title: row.title.trim(),
    normalizedTitle: normalizeTitle(row.title),
    divisionId: makeDivisionId(row.version, divisionCode.displayCode),
    divisionCode: divisionCode.displayCode,
    divisionTitle: row.divisionTitle.trim(),
    subgroupTitle: row.subgroupTitle,
    parentId: parentCode ? makeCatalogItemId(row.version, parentCode.displayCode) : undefined,
    parentCode: parentCode?.displayCode,
    hierarchyLevel: row.hierarchyLevel,
    recordType: row.recordType,
    sortOrder: row.sortOrder,
    description: row.description,
    sourceTrace: toCsiSourceTrace(row.sourceTrace),
    sourceMetadataReference: row.sourceTrace.sourceId,
    reviewStatus: row.reviewStatus ?? "clean",
    notes: row.notes,
  };
}

function buildMetadataRecord(
  row: ImportedCsiMetadataRow,
  catalogItemIdByVersionCode: Map<string, string>,
): CsiCatalogMetadata {
  const code = normalizeCsiCode(row.code);
  const targetCode = row.targetCode ? normalizeCsiCode(row.targetCode) : code;

  return {
    id: row.id ?? makeMetadataId(row.version, code.displayCode, row.metadataType, row.value),
    csiItemId:
      catalogItemIdByVersionCode.get(makeNormalizedCsiCodeKey(row.version, targetCode.displayCode)) ??
      makeUnresolvedCatalogReferenceId(row.version, targetCode.displayCode),
    version: row.version,
    code: code.displayCode,
    metadataType: row.metadataType,
    value: row.value.trim(),
    normalizedValue: normalizeTitle(row.value),
    targetCode: targetCode.displayCode,
    sourceTrace: toCsiSourceTrace(row.sourceTrace),
    reviewStatus: row.reviewStatus ?? "clean",
    notes: row.notes,
  };
}

function buildMetadataRecordFromCatalogRow(
  row: ImportedCsiCatalogRow,
  catalogItemIdByVersionCode: Map<string, string>,
): CsiCatalogMetadata {
  const metadataType = row.metadataType;
  if (!metadataType || !metadataOnlyTypes.has(metadataType)) {
    throw new Error("Non-canonical catalog row must provide a valid metadata type.");
  }

  return buildMetadataRecord(
    {
      id: row.id,
      version: row.version,
      code: row.code,
      metadataType,
      value: row.title,
      targetCode: row.metadataTargetCode ?? row.code,
      notes: row.notes,
      reviewStatus: row.reviewStatus,
      sourceTrace: row.sourceTrace,
    },
    catalogItemIdByVersionCode,
  );
}

export function makeCatalogItemId(version: CsiVersion, code: string): string {
  return `${version.toLowerCase()}-${normalizeCsiCode(code).normalizedCode.toLowerCase()}`;
}

function makeDivisionId(version: CsiVersion, divisionCode: string): string {
  const normalizedDivision = normalizeCsiCode(divisionCode).normalizedCode;
  return `${version.toLowerCase()}-division-${normalizedDivision.toLowerCase()}`;
}

function makeMetadataId(
  version: CsiVersion,
  code: string,
  metadataType: CsiCatalogMetadataType,
  value: string,
): string {
  return [
    "metadata",
    version.toLowerCase(),
    normalizeCsiCode(code).normalizedCode.toLowerCase(),
    metadataType,
    normalizeTitle(value).replace(/\s+/g, "-"),
  ].join("-");
}

function makeUnresolvedCatalogReferenceId(version: CsiVersion, code: string): string {
  return `unresolved-${version.toLowerCase()}-${normalizeCsiCode(code).normalizedCode.toLowerCase()}`;
}
