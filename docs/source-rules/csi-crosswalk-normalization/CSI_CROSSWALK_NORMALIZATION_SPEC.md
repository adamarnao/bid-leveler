# CSI Crosswalk Normalization Spec

## Purpose

This source-rule package defines how Bid-Leveler imports, reviews, corrects, resolves, and displays CSI / MasterFormat crosswalk relationships.

The app should consume generated resolved crosswalk data, not raw Excel rows or source-specific document structure.

## 1. Layer Separation Policy

The app must distinguish four separate layers.

| Layer | Purpose | Must Not Become |
| --- | --- | --- |
| CSI Catalog | Canonical CSI codes that exist in a supported MasterFormat version. | Trade package ownership. |
| CSI Catalog Metadata | Alternate terms, included topics, products, abbreviations, keyword index terms, and see references. | Canonical catalog identity or crosswalk targets. |
| CSI Crosswalk | Relationships between canonical CSI codes across MasterFormat versions. | A keyword index or trade mapping rule. |
| CSI Trade Mapping | Operational trade package / bid package ownership. | Catalog identity or cross-version equivalence. |

These layers may reference each other, but they must remain separate runtime concepts.

## 2. Crosswalk Source Policy

`CSI Crosswalk Excel.xlsx` is raw relationship evidence only.

It is not canonical truth.

Raw imported values must be preserved exactly enough for audit and QA. Corrections must add resolved values instead of overwriting raw values.

Runtime app behavior must use resolved crosswalk records, not raw crosswalk records.

Crosswalk targets must be resolved against normalized canonical catalogs.

Keyword terms, included topics, alternate terms, products, abbreviations, and see references must not become canonical crosswalk targets.

## 3. Raw Import Model

Raw import records preserve the evidence from the source file.

Raw import records should keep:

- source filename
- source row or sheet reference when available
- raw source MasterFormat version
- raw source code
- raw source title
- raw target MasterFormat version
- raw target code
- raw target title
- raw relationship notes if present
- importer version
- import timestamp
- source issue flags

Raw import records are not used directly by runtime matching, subcontractor coverage, bid package generation, or bid leveling.

## 4. Resolved Crosswalk Model

Resolved crosswalk records connect normalized canonical CSI items across supported MasterFormat versions.

Resolved records should include:

- stable crosswalk relationship ID
- `sourceVersion`
- `sourceCode`
- `sourceTitle`
- `targetVersion`
- `rawTargetCode`
- `rawTargetTitle`
- `resolvedTargetCode`
- `resolvedTargetTitle`
- `relationshipRole`
- `relationshipType`
- `cardinality`
- `reviewStatus`
- `issueType`
- `sourceBasis`
- `notes`
- `parentContextCode`, when applicable
- `parentContextTitle`, when applicable
- warnings
- link back to raw imported evidence

The resolved relationship is the runtime-safe crosswalk layer.

## 5. Crosswalk Relationship Vocabulary

Crosswalk quality must be described with structured relationship fields. Do not use numeric confidence percentages for crosswalk relationships.

### Relationship Roles

Allowed `relationshipRole` values:

- `primary`
- `secondary`
- `related`
- `deprecated_historical`
- `review_only`

### Relationship Types

Allowed `relationshipType` values:

- `direct_equivalent`
- `split_into_multiple_codes`
- `consolidated_from_multiple_codes`
- `broader_than_target`
- `narrower_than_target`
- `related_operational_match`
- `parent_context_only`
- `no_clear_match`

### Cardinality

Allowed `cardinality` values:

- `one_to_one`
- `one_to_many`
- `many_to_one`
- `many_to_many`
- `unmapped_source`
- `unmapped_target`

### Review Statuses

Allowed `reviewStatus` values:

- `clean`
- `corrected`
- `needs_review`
- `ambiguous`
- `unmapped`
- `rejected`

### Issue Types

Allowed `issueType` values:

- `none`
- `over_broad_parent_target`
- `parent_context_only`
- `specific_child_available`
- `title_mismatch`
- `missing_source_code`
- `missing_target_code`
- `alias_or_keyword_mapped_as_code`
- `included_topic_mapped_as_code`
- `duplicate_same_code_record`
- `source_incomplete`
- `ocr_uncertain`
- `trade_impacting`

### Confidence Rule

Do not use numeric confidence percentages for crosswalk relationships.

Crosswalk quality must be described with:

- `relationshipType`
- `relationshipRole`
- `cardinality`
- `reviewStatus`
- `issueType`
- `sourceBasis`
- `notes`
- warnings

Do not use fields such as `confidence: 87%` for crosswalk relationships.

## 6. Correction Policy

Crosswalk corrections must add resolved values. They must not overwrite raw imported values.

Correction records may add:

- resolved source CSI item ID
- resolved target CSI item ID
- normalized source code/title
- normalized target code/title
- correction reason
- review status
- reviewer or importer version when available
- correction notes

The raw source row remains available for QA, debugging, and future source replacement.

### Required Correction Example

1995 source:

- `02775` - Sidewalks

Raw crosswalk:

- `02775` - Sidewalks
- to `32 10 00` - Bases, Ballasts, and Paving

Corrected/resolved crosswalk:

- `02775` - Sidewalks
- to `32 16 23` - Sidewalks

Parent context:

- `32 10 00` - Bases, Ballasts, and Paving

Required classification:

- `relationshipRole`: `primary`
- `relationshipType`: `direct_equivalent`
- `cardinality`: `one_to_one`
- `reviewStatus`: `corrected`
- `issueType`: `over_broad_parent_target`
- `notes`: Raw target is a parent grouping. Resolved target is the specific child code.

The parent context should be preserved as `parentContextCode` and `parentContextTitle`, not used as the final resolved target.

## 7. Canonical Target Policy

Canonical crosswalk endpoints must be normalized CSI catalog items.

The following may support search, metadata, and QA, but must not become canonical crosswalk targets:

- keyword index terms
- included topics
- alternate terms
- product names
- abbreviations
- see references
- OCR-only text fragments
- source-specific row labels

If a raw crosswalk row points to a term that is not a normalized catalog item, the resolver must mark it for review or connect it to a resolved canonical item with an explanation trail.

### Parent-Context Rule

Parent codes such as `32 10 00` may be useful as parent context, but they should not be used as final resolved targets when a more specific child code exists and matches the source title.

### Keyword / Index Metadata Rule

2004+ keyword index terms are search metadata only.

Non-preferred terms, alternate terms, abbreviations, products, and included topics are metadata.

Metadata terms can point users toward canonical CSI codes, but they must not become canonical CSI records or crosswalk targets.

### Same-Code Duplicate Rule

Repeated same-code labels in source documents must not automatically create multiple canonical records.

Same-code included terms should be attached as metadata to the canonical item.

## 8. Review Status Policy

Resolved crosswalk records should support explicit review status.

Required statuses:

- `clean`
- `corrected`
- `needs_review`
- `ambiguous`
- `unmapped`
- `rejected`

The runtime should prefer clean and corrected resolved relationships. Ambiguous, unmapped, and rejected records should remain visible in workbenches and QA tools.

## 9. Source Issue Types

Crosswalk import and resolution may flag issues such as:

- `none`
- `over_broad_parent_target`
- `parent_context_only`
- `specific_child_available`
- `title_mismatch`
- `missing_source_code`
- `missing_target_code`
- `alias_or_keyword_mapped_as_code`
- `included_topic_mapped_as_code`
- `duplicate_same_code_record`
- `source_incomplete`
- `ocr_uncertain`
- `trade_impacting`

Issue flags should explain why a relationship is not runtime-safe yet.

## 10. Display Rules

Production runtime UI should display resolved crosswalk results, not raw source rows.

Raw imported values may be shown in internal workbenches, QA screens, and debug tools only when clearly labeled as raw evidence.

Display should make clear:

- which MasterFormat versions are being compared
- whether the relationship is resolved
- relationship role
- relationship type
- cardinality
- review status
- issue type
- whether the result came from direct resolution, correction, or manual review
- whether warnings remain

Display should not show crosswalk quality as a numeric percentage.

## 10A. CSI-To-Trade Match Strength Rule

CSI-to-trade mapping may use match strength, but not percentages.

Allowed match-strength labels:

- `strong`
- `moderate`
- `weak`
- `needs_review`

Trade match strength must include reason codes. Do not use `confidence: 87%` or similar language.

CSI-to-trade match strength belongs to the CSI Trade Mapping layer. It must not be used as a replacement for crosswalk relationship fields.

## 11. Importer / Source-Adapter Policy

Importers may be source-specific.

Runtime app behavior must be source-agnostic.

Importer responsibilities:

- read raw source files
- preserve source evidence
- normalize raw row shape into raw import records
- attempt resolution against normalized canonical catalogs
- produce review issues for unresolved values
- generate resolved crosswalk records only when endpoints are canonical catalog items

Importers must not make runtime app behavior depend on Excel row layout, sheet names, source formatting, OCR text position, or document-specific structure.

## 12. Runtime Output Policy

Expected future outputs, not created by this package:

- `data/normalized/csi_crosswalk_raw_import.xlsx`
- `data/normalized/csi_crosswalk_resolved.xlsx`
- `src/data/generated/csiCrosswalkResolved.generated.ts`

The runtime app should consume generated structured data from resolved crosswalk records.

The runtime app should not consume `CSI Crosswalk Excel.xlsx` directly.

## 13. Relationship To Other Source Rules

CSI catalog normalization owns canonical catalog identity.

CSI crosswalk normalization owns cross-version equivalence between canonical catalog items.

CSI trade mapping owns operational trade package / bid package ownership.

Project profile and trade visibility may use resolved CSI evidence, but they must not define canonical crosswalk endpoints.

## 14. Production Source Replacement Policy

Development crosswalk sources are evidence used to build and QA the normalized relationship model.

Production release must support replacement by properly licensed source material where required.

Replacing the source must not require changes to runtime object identity, app UI behavior, or bid package logic if the normalized resolved output contract remains stable.

## 15. Explicit Anti-Patterns

Do not:

- Treat `CSI Crosswalk Excel.xlsx` as canonical truth.
- Overwrite raw imported values during correction.
- Use raw crosswalk rows directly in runtime matching.
- Make keyword terms canonical crosswalk targets.
- Make included topics canonical crosswalk targets.
- Make product names canonical crosswalk targets.
- Merge CSI catalog metadata into CSI crosswalk relationships.
- Merge CSI crosswalk relationships into CSI trade mapping rules.
- Infer bid package ownership from crosswalk equivalence alone.
- Depend on Excel row order, sheet layout, or column names in runtime app behavior.
- Hide ambiguous crosswalk relationships by pretending they are clean one-to-one mappings.
