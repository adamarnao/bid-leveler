# CSI Catalog Normalization Source Rules

This package defines how CSI / MasterFormat catalog source files are handled during development and how they will be replaced by properly licensed production source material later.

These files are planning/source-rule artifacts only. They do not modify runtime app imports, do not generate catalog data, and do not change app behavior.

## Documents

1. `CSI_CATALOG_NORMALIZATION_SPEC.md` - source-of-truth policy, normalization model, crosswalk correction policy, repository placement rules, and anti-patterns.
2. `csiCatalogNormalizationSource.ts` - source-rule constants for source roles, active development sources, normalization stages, review statuses, expected outputs, and placement policy.

## Core Rule

The app should consume generated structured data, not raw PDFs, OCR files, scanned files, Excel row layouts, PDF page layouts, OCR formatting, or source-specific document structure.

The runtime app must maintain one normalized active catalog per supported MasterFormat version:

- `MASTERFORMAT_1995`
- `MASTERFORMAT_2004_PLUS`

Development source files are evidence only. Production release must use properly licensed CSI / MasterFormat source material.
