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

CSI Crosswalk Excel.xlsx is raw relationship evidence only.

It is not canonical truth.

Raw imported values must be preserved.

Corrections must add resolved values instead of overwriting raw values.

Runtime app behavior must use resolved crosswalk records, not raw crosswalk records.

Crosswalk targets must be resolved against normalized canonical catalogs.

Do not treat keyword index terms, included topics, alternate terms, products, or abbreviations as canonical CSI records.

Keyword index terms are search metadata only. The 2004+ keyword index terms are search metadata only.

## 3. Required Crosswalk Fields

Resolved crosswalk records should include:

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
- source trace back to raw evidence

## 4. Relationship Vocabulary

Allowed `relationshipRole` values:

- `primary`
- `secondary`
- `related`
- `deprecated_historical`
- `review_only`

Allowed `relationshipType` values:

- `direct_equivalent`
- `split_into_multiple_codes`
- `consolidated_from_multiple_codes`
- `broader_than_target`
- `narrower_than_target`
- `related_operational_match`
- `parent_context_only`
- `no_clear_match`

Allowed `cardinality` values:

- `one_to_one`
- `one_to_many`
- `many_to_one`
- `many_to_many`
- `unmapped_source`
- `unmapped_target`

Allowed `reviewStatus` values:

- `clean`
- `corrected`
- `needs_review`
- `ambiguous`
- `unmapped`
- `rejected`

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

## 5. Confidence Rule

Do not use numeric confidence percentages for crosswalk relationships.

Crosswalk relationships use no numeric confidence percentages.

Use relationshipType, relationshipRole, cardinality, reviewStatus, issueType, sourceBasis, notes, and warnings.

For CSI-to-trade mapping, use match strength labels only: strong, moderate, weak, needs_review.

## 6. Required Correction Example

Required example: 1995 `02775` Sidewalks raw target `32 10 00` Bases, Ballasts, and Paving must resolve to `32 16 23` Sidewalks.

The raw target `32 10 00` - Bases, Ballasts, and Paving is parent context only.

Required classification:

- `relationshipRole`: `primary`
- `relationshipType`: `direct_equivalent`
- `cardinality`: `one_to_one`
- `reviewStatus`: `corrected`
- `issueType`: `over_broad_parent_target`
- `sourceBasis`: `specific_child_correction`
- `notes`: Raw target is a parent grouping. Resolved target is the specific child code.

Parent context should be preserved as `parentContextCode` and `parentContextTitle`, not used as the final resolved target.

## 7. Parent-Context Rule

Parent codes such as `32 10 00` may be useful as parent context, but they should not be used as final resolved targets when a more specific child code exists and matches the source title.

## 8. Keyword / Index Metadata Rule

Keyword index terms are search metadata only.

Non-preferred terms, alternate terms, abbreviations, products, and included topics are metadata.

Metadata terms can point users toward canonical CSI codes, but they must not become canonical CSI records or crosswalk targets.

## 9. Same-Code Duplicate Rule

Repeated same-code labels in source documents must not automatically create multiple canonical records.

Same-code included terms should be attached as metadata to the canonical item.

## 10. Runtime Output Policy

Runtime app behavior should consume generated structured data from resolved crosswalk records.

Runtime app behavior must use resolved crosswalk records and must not consume `CSI Crosswalk Excel.xlsx` directly.

Expected future outputs, not created by this package:

- `data/normalized/csi_crosswalk_raw_import.xlsx`
- `data/normalized/csi_crosswalk_resolved.xlsx`
- `src/data/generated/csiCrosswalkResolved.generated.ts`

## 11. Explicit Anti-Patterns

Do not:

- Treat CSI Crosswalk Excel.xlsx as canonical truth.
- Overwrite raw crosswalk data instead of preserving raw and resolved values.
- Map keyword index terms as canonical CSI records.
- Map included topics as canonical CSI records.
- Use `32 10 00` as the final target for `02775` Sidewalks when `32 16 23` Sidewalks exists.
- Use numeric confidence percentages for crosswalk relationships.
- Use vague confidence labels without reason codes.
- Mix catalog records, metadata terms, crosswalk relationships, and trade mappings in one flat table.
