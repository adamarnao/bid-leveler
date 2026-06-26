# CSI Catalog Normalization Spec

## Purpose

This source-rule package defines how Bid-Leveler handles CSI / MasterFormat catalog source files during development and how those sources will be replaced by properly licensed production source material later.

The app should consume generated structured data, not raw PDFs or OCR files.

## 1. Source-Of-Truth Policy

The app must maintain one normalized active catalog per supported MasterFormat version.

Supported versions:

- `MASTERFORMAT_1995` - MasterFormat 1995 / 16-Division
- `MASTERFORMAT_2004_PLUS` - MasterFormat 2004+ / 50-Division

Stable runtime concepts:

- `CsiCatalogItem`
- `CsiCatalogMetadata`
- `CsiCrosswalkRelationship`
- `CsiTradeMapping`
- `CsiVersion`
- `TradePackage`

The normalized catalog is the application source of truth. Raw source files are evidence used by importers, QA workflows, and replacement validation only.

## 2. Development Vs Production Source Policy

Development sources may be OCR PDFs, PDF-derived extraction files, Excel files, or other temporary evidence used to build normalized catalog data.

Production release must use properly licensed CSI / MasterFormat source material.

Development source files are temporary and must be replaceable with licensed production source material without changing runtime app behavior.

The normalized data structure must remain source-agnostic. Runtime code must not depend on:

- raw PDFs
- OCR PDFs
- scanned files
- Excel row layout
- PDF page layout
- OCR formatting
- source-specific document structure

## 3. Source Roles

Source files are assigned explicit roles.

| Role | Meaning |
| --- | --- |
| Active development source | Primary development extraction source for normalization work. |
| QA-only comparison source | Used to compare extraction quality and identify missing or suspect rows. |
| Deprecated source | Historical extraction source retained only for traceability. |
| Archive / visual backup source | Original visual evidence retained outside runtime paths. |

Required source policy:

- Active development 1995 extraction source: `1995_MasterFormat_ocrmypdf_deskew_clean.pdf`
- 1995 QA-only comparison source: `1995 MasterFormat CSI_CODES OCR Bluebeam Tables and Forms.pdf`
- Deprecated/archive-only 1995 OCR source: `1995 MasterFormat CSI_CODES OCR.pdf`
- Original scanned 1995 PDF may be retained as visual backup only.
- 2004+ PDF-derived catalogs replace old Excel-derived 2004+ catalog lists during development.
- 2004+ keyword index is metadata/search evidence, not canonical catalog identity.
- `CSI Crosswalk Excel.xlsx` is raw relationship evidence only.

## 4. Normalized Catalog Model

The normalized catalog must be source-agnostic and version-specific.

Each normalized CSI catalog item should represent a canonical catalog identity:

- stable normalized ID
- MasterFormat version
- CSI code / section number
- title
- hierarchy level
- parent item ID if applicable
- division ID
- sort order
- source metadata reference
- review status
- issue flags if applicable

There must be one active normalized catalog for `MASTERFORMAT_1995` and one active normalized catalog for `MASTERFORMAT_2004_PLUS`.

The normalized catalog must not expose OCR line numbers, PDF page layout, raw Excel column names, or source-specific row structure as runtime identity.

## 5. Metadata Model

Catalog metadata should track source and review information without making raw source structure part of runtime behavior.

Metadata may include:

- normalized catalog version
- source role
- source filename
- source document type
- source extraction method
- source page or row reference for QA only
- extraction timestamp
- importer version
- review status
- issue types
- notes

Metadata supports auditability, QA, and future replacement by licensed sources. It does not define runtime catalog identity.

## 6. Cross-Reference Model

Cross-references connect normalized catalog items to source evidence and related records.

Cross-reference records may connect:

- normalized CSI item to raw imported row
- normalized CSI item to source PDF page or extraction location
- normalized CSI item to QA comparison source evidence
- normalized CSI item to trade mapping rule evidence
- normalized CSI item to crosswalk raw imported value

Cross-references are evidence trails. Runtime app behavior should consume normalized structured data, not raw source documents.

## 7. Crosswalk Relationship Model

The crosswalk relationship model links normalized canonical items between supported MasterFormat versions.

The crosswalk Excel is raw relationship evidence only. It must be resolved against normalized canonical catalogs before runtime use.

Crosswalk relationships should preserve:

- raw source 1995 code/title
- raw target 2004+ code/title
- resolved 1995 normalized item ID when available
- resolved 2004+ normalized item ID when available
- relationship/cardinality
- review status
- source basis
- notes/warnings

Relationship concepts:

- one-to-one
- one-to-many
- many-to-one
- many-to-many
- incomplete
- no clear match

## 8. Crosswalk Correction Policy

Crosswalk corrections must preserve raw imported values and add resolved values instead of overwriting source evidence.

Do not rewrite imported source cells to make them look clean.

Correction records should add:

- resolved source CSI item ID
- resolved target CSI item ID
- normalized source code/title
- normalized target code/title
- correction reason
- review status
- reviewer or importer version when available

The raw imported source and target values remain available for audit and QA.

## 9. Division 00 Incomplete-Source Policy

Division 00 may be incomplete during development.

Incomplete source coverage must be marked `incomplete_source`.

Do not fake Division 00 data to make the catalog appear complete.

Do not silently synthesize missing Division 00 catalog items unless a later rule explicitly defines a source-backed normalization method.

## 10. Runtime Output Policy

Runtime app behavior should consume generated structured data.

Expected future outputs, but do not create them now:

- `data/normalized/csi_1995_normalized_catalog.xlsx`
- `data/normalized/csi_2004_plus_normalized_catalog.xlsx`
- `data/normalized/csi_crosswalk_raw_import.xlsx`
- `data/normalized/csi_crosswalk_resolved.xlsx`
- `src/data/generated/csiCatalog1995.generated.ts`
- `src/data/generated/csiCatalog2004Plus.generated.ts`
- `src/data/generated/csiCatalogMetadata1995.generated.ts`
- `src/data/generated/csiCatalogMetadata2004Plus.generated.ts`
- `src/data/generated/csiCrosswalkResolved.generated.ts`

Runtime app code should import generated structured data, not raw source files.

## 11. Importer / Source-Adapter Policy

The importer may be source-specific. Runtime behavior must be source-agnostic.

Importer responsibilities:

- read source-specific material
- extract raw evidence
- normalize to canonical catalog model
- attach metadata and source references
- flag extraction issues
- resolve crosswalk rows against normalized catalogs
- produce generated structured outputs

Importer anti-responsibilities:

- do not define runtime object identity from PDF layout
- do not require runtime app code to understand OCR artifacts
- do not erase raw source values during correction
- do not make source-specific document structure a runtime dependency

## 12. Replacing Development Sources With Licensed Production Sources

Development sources must be replaceable.

When licensed production source material is obtained:

1. Add or update source adapters for the licensed source format.
2. Generate the same normalized catalog model.
3. Preserve stable runtime concepts.
4. Re-run crosswalk resolution against normalized catalogs.
5. Compare generated output to development output for expected differences.
6. Mark development sources as replaced or QA-only.
7. Keep runtime imports pointed at generated structured data.

The production release must use properly licensed CSI / MasterFormat source material.

## 13. Files Allowed In The App Repo

Allowed in repo:

- source-rule docs
- importer scripts
- normalized generated TypeScript data
- normalized generated QA workbooks where licensing permits
- non-licensed development evidence summaries
- metadata and issue reports
- references to external source files by filename

Raw licensed source documents should not be committed unless licensing explicitly permits it.

## 14. Files Outside Runtime App Paths

Keep these outside runtime app paths:

- raw PDFs
- OCR experiments
- scanned files
- licensed source documents
- raw Excel source files
- intermediate extraction dumps
- source-specific QA artifacts

Do not place these under runtime import paths such as `src/app`, `src/components`, `src/lib`, or runtime `src/data` modules.

Raw source evidence may live in controlled data-import or external evidence locations during development, subject to licensing and repository policy.

## 15. Explicit Anti-Patterns

Do not:

- import raw PDFs into runtime app code
- parse PDFs in the browser app
- make runtime behavior depend on OCR formatting
- make runtime behavior depend on Excel row order or column layout
- treat keyword indexes as canonical catalog identity
- overwrite raw crosswalk values during correction
- fake missing Division 00 data
- keep `MASTERFORMAT_CURRENT` as a runtime ID
- put licensed source documents in runtime app paths
- use raw source filenames as stable app object IDs
- generate multiple competing active catalogs for the same MasterFormat version
- require Project Setup, Project Scope, bid packages, or subcontractor matching to understand source-document layout

The app should consume generated structured data, not raw PDFs or OCR files.
