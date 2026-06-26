import type { CsiNormalizedDataSet } from "../types";
import { validateCsiNormalizationFixture } from "../validation";
import { buildNormalizedCatalogItems } from "./buildNormalizedCatalogItems";
import { buildNormalizedCrosswalkRelationships } from "./buildNormalizedCrosswalkRelationships";
import type {
  ImportedCsiCatalogRow,
  ImportedCsiCrosswalkRow,
  ImportedCsiMetadataRow,
  ImportedSourceTrace,
  ImportNormalizationResult,
} from "./types";

const catalogSourceTrace: ImportedSourceTrace = {
  sourceName: "Division 32 sidewalk importer prototype",
  sourceType: "manual_fixture",
  sourceVersion: "prototype-v1",
  sourceNote:
    "Importer boundary prototype only. This does not parse PDFs, OCR files, Excel files, or source-specific layouts.",
  importerVersion: "prototype-v1",
};

const crosswalkSourceTrace: ImportedSourceTrace = {
  sourceName: "CSI Crosswalk Excel.xlsx",
  sourceType: "excel",
  sourceVersion: "prototype-v1",
  sourceSheet: "Division 32 sidewalk prototype",
  sourceRow: "02775",
  sourceNote:
    "Raw relationship evidence is preserved separately from corrected resolved values.",
  importerVersion: "prototype-v1",
};

export const division32PrototypeCatalogRows: ImportedCsiCatalogRow[] = [
  {
    version: "MASTERFORMAT_2004_PLUS",
    code: "32 00 00",
    title: "Exterior Improvements",
    divisionCode: "32",
    divisionTitle: "Exterior Improvements",
    hierarchyLevel: 1,
    recordType: "division",
    sortOrder: 320000,
    isCanonicalCatalogItem: true,
    sourceTrace: catalogSourceTrace,
  },
  {
    version: "MASTERFORMAT_2004_PLUS",
    code: "32 10 00",
    title: "Bases, Ballasts, and Paving",
    divisionCode: "32",
    divisionTitle: "Exterior Improvements",
    parentCode: "32 00 00",
    hierarchyLevel: 2,
    recordType: "subdivision",
    sortOrder: 321000,
    description:
      "Parent context for paving-related exterior improvement scope. Not the final sidewalk target when a specific child code applies.",
    notes: "Preserved as parent context for the 1995 02775 Sidewalks correction.",
    isCanonicalCatalogItem: true,
    sourceTrace: catalogSourceTrace,
  },
  {
    version: "MASTERFORMAT_2004_PLUS",
    code: "32 16 00",
    title: "Curbs, Gutters, Sidewalks, and Driveways",
    divisionCode: "32",
    divisionTitle: "Exterior Improvements",
    parentCode: "32 10 00",
    hierarchyLevel: 3,
    recordType: "section_group",
    sortOrder: 321600,
    isCanonicalCatalogItem: true,
    sourceTrace: catalogSourceTrace,
  },
  {
    version: "MASTERFORMAT_2004_PLUS",
    code: "32 16 13",
    title: "Curbs and Gutters",
    divisionCode: "32",
    divisionTitle: "Exterior Improvements",
    subgroupTitle: "Curbs, Gutters, Sidewalks, and Driveways",
    parentCode: "32 16 00",
    hierarchyLevel: 4,
    recordType: "section",
    sortOrder: 321613,
    isCanonicalCatalogItem: true,
    sourceTrace: catalogSourceTrace,
  },
  {
    version: "MASTERFORMAT_2004_PLUS",
    code: "32 16 23",
    title: "Sidewalks",
    divisionCode: "32",
    divisionTitle: "Exterior Improvements",
    subgroupTitle: "Curbs, Gutters, Sidewalks, and Driveways",
    parentCode: "32 16 00",
    hierarchyLevel: 4,
    recordType: "section",
    sortOrder: 321623,
    description:
      "Specific canonical sidewalk item for resolving 1995 02775 Sidewalks.",
    isCanonicalCatalogItem: true,
    sourceTrace: catalogSourceTrace,
  },
  {
    version: "MASTERFORMAT_2004_PLUS",
    code: "32 16 33",
    title: "Driveways",
    divisionCode: "32",
    divisionTitle: "Exterior Improvements",
    subgroupTitle: "Curbs, Gutters, Sidewalks, and Driveways",
    parentCode: "32 16 00",
    hierarchyLevel: 4,
    recordType: "section",
    sortOrder: 321633,
    isCanonicalCatalogItem: true,
    sourceTrace: catalogSourceTrace,
  },
];

export const division32PrototypeMetadataRows: ImportedCsiMetadataRow[] = [
  {
    version: "MASTERFORMAT_2004_PLUS",
    code: "32 10 00",
    metadataType: "may_include",
    value: "Parent context for paving, pedestrian paving, and walk-related records.",
    targetCode: "32 10 00",
    notes:
      "Parent-context metadata only. This must not become a canonical sidewalk record.",
    sourceTrace: catalogSourceTrace,
  },
  {
    version: "MASTERFORMAT_2004_PLUS",
    code: "32 16 23",
    metadataType: "alternate_term",
    value: "Walks",
    targetCode: "32 16 23",
    notes:
      "Walks is search/reference metadata for Sidewalks and must not become a fake canonical CSI record.",
    sourceTrace: catalogSourceTrace,
  },
  {
    version: "MASTERFORMAT_2004_PLUS",
    code: "32 16 23",
    metadataType: "keyword_index_term",
    value: "Sidewalk paving",
    targetCode: "32 16 23",
    notes:
      "Keyword metadata can point to the canonical Sidewalks item, but it is not a crosswalk target.",
    sourceTrace: catalogSourceTrace,
  },
];

export const division32PrototypeCrosswalkRows: ImportedCsiCrosswalkRow[] = [
  {
    id: "crosswalk-1995-02775-sidewalks-corrected",
    sourceVersion: "MASTERFORMAT_1995",
    sourceCode: "02775",
    sourceTitle: "Sidewalks",
    targetVersion: "MASTERFORMAT_2004_PLUS",
    rawTargetCode: "32 10 00",
    rawTargetTitle: "Bases, Ballasts, and Paving",
    resolvedTargetCode: "32 16 23",
    resolvedTargetTitle: "Sidewalks",
    relationshipRole: "primary",
    relationshipType: "direct_equivalent",
    cardinality: "one_to_one",
    reviewStatus: "corrected",
    issueType: "over_broad_parent_target",
    sourceBasis: "specific_child_correction",
    parentContextCode: "32 10 00",
    parentContextTitle: "Bases, Ballasts, and Paving",
    notes:
      "Raw target is a parent grouping. Resolved target is the specific child code.",
    warnings: [
      "Do not use 32 10 00 as the final resolved target when 32 16 23 Sidewalks exists.",
    ],
    sourceTrace: crosswalkSourceTrace,
  },
];

const normalizedCatalog = buildNormalizedCatalogItems({
  catalogRows: division32PrototypeCatalogRows,
  metadataRows: division32PrototypeMetadataRows,
});

const normalizedCrosswalk = buildNormalizedCrosswalkRelationships({
  crosswalkRows: division32PrototypeCrosswalkRows,
  targetCatalogItems: normalizedCatalog.catalogItems,
});

export const division32ImportPrototypeDataSet: CsiNormalizedDataSet = {
  version: "MASTERFORMAT_2004_PLUS",
  catalogItems: normalizedCatalog.catalogItems,
  metadata: normalizedCatalog.metadata,
  crossReferences: [],
  crosswalkRelationships: normalizedCrosswalk.crosswalkRelationships,
  tradeMappingReferences: [],
  generatedAt: "2026-06-26T00:00:00.000Z",
  generatorVersion: "import-prototype-v1",
};

export const division32ImportPrototype: ImportNormalizationResult = {
  importedCatalogRows: division32PrototypeCatalogRows,
  importedMetadataRows: division32PrototypeMetadataRows,
  importedCrosswalkRows: division32PrototypeCrosswalkRows,
  normalizedDataSet: division32ImportPrototypeDataSet,
  catalogItems: division32ImportPrototypeDataSet.catalogItems,
  metadata: division32ImportPrototypeDataSet.metadata,
  crosswalkRelationships: division32ImportPrototypeDataSet.crosswalkRelationships,
  validation: validateCsiNormalizationFixture(division32ImportPrototypeDataSet),
};
