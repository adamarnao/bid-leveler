# CSI Catalog Normalization Spec

## Purpose

This source-rule package defines how Bid-Leveler handles CSI / MasterFormat catalog source files during development and how those sources will be replaced by properly licensed production source material later.

The app should consume generated structured data, not raw PDFs or OCR files.

## 1. Source-Of-Truth Policy

The app must maintain one normalized active catalog per supported MasterFormat version.

Supported versions:

- `MASTERFORMAT_1995` - MasterFormat 1995 / 16-Division
- `MASTERFORMAT_2004_PLUS` - MasterFormat 2004+ / 50-Division

The normalized catalog is the application source of truth for canonical CSI records.

Raw source files are development evidence only. Raw PDFs, OCR PDFs, scanned files, Excel source files, and OCR experiments are development evidence only.

## 2. Development Vs Production Source Policy

Development CSI source files are temporary and must be replaceable with licensed production source material later.

Production release must use properly licensed CSI/MasterFormat source material.

The CSI data model must remain source-agnostic.

Runtime app code must consume normalized structured data, not raw source files.

The runtime app must not depend directly on raw PDFs, OCR formatting, PDF page layout, Excel row layout, or source-specific document structure.

## 3. Source Roles

Source files are assigned explicit roles.

| Role | Meaning |
| --- | --- |
| Active development source | Primary development extraction source for normalization work. |
| QA-only comparison source | Used to compare extraction quality and identify missing or suspect rows. |
| Deprecated source | Historical extraction source retained only for traceability. |
| Archive / visual backup source | Original visual evidence retained outside runtime paths. |

Required source policy:

- Active development 1995 extraction source is OCRmyPDF output: `1995_MasterFormat_ocrmypdf_deskew_clean.pdf`.
- Bluebeam Tables/Forms OCR is QA comparison only: `1995 MasterFormat CSI_CODES OCR Bluebeam Tables and Forms.pdf`.
- First Bluebeam text OCR is deprecated/archive only: `1995 MasterFormat CSI_CODES OCR.pdf`.
- Original scanned 1995 PDF is visual backup only.
- 2004+ PDF-derived catalogs replace old Excel-derived 2004+ catalog lists during development.
- 2004+ keyword index is metadata/search evidence, not canonical catalog identity.

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

Catalog metadata should support search, QA, and source review without becoming canonical CSI catalog identity.

Metadata may include:

- alternate terms
- abbreviations
- products
- included topics
- keyword index terms
- see references
- source notes

The 2004+ keyword index is metadata/search evidence, not canonical catalog identity.

## 6. Division 00 Incomplete-Source Policy

Division 00 may be incomplete during development and should be marked incomplete_source, not faked.

Incomplete Division 00 source coverage must use review status `incomplete_source`.

Do not fake Division 00 data to make the catalog appear complete.

Do not silently synthesize missing Division 00 catalog items unless a later rule explicitly defines a source-backed normalization method.

## 7. Runtime Output Policy

Runtime app behavior should consume generated structured data.

Expected future outputs, not created by this package:

- `src/data/generated/csiCatalog1995.generated.ts`
- `src/data/generated/csiCatalog2004Plus.generated.ts`
- `src/data/generated/csiCatalogMetadata1995.generated.ts`
- `src/data/generated/csiCatalogMetadata2004Plus.generated.ts`

Runtime app code must not import raw PDFs, OCR PDFs, scanned files, Excel source files, or source experiments.

## 8. Repository Placement Policy

Allowed in the app repo:

- source-rule docs
- importer scripts
- generated structured TypeScript data
- normalized QA summaries where licensing permits
- references to external source files by filename

Keep outside runtime app paths:

- raw PDFs
- OCR experiments
- scanned files
- licensed source documents
- raw Excel source files
- source-specific extraction dumps

## 9. Explicit Anti-Patterns

Do not:

- Import raw PDFs into runtime app code.
- Parse PDFs in the browser app.
- Make runtime behavior depend on OCR formatting.
- Make runtime behavior depend on PDF page layout.
- Make runtime behavior depend on Excel row layout.
- Treat keyword indexes as canonical catalog identity.
- Fake missing Division 00 data.
- Put licensed source documents in runtime app paths.
- Use raw source filenames as stable app object IDs.
