# CSI Crosswalk Normalization Source Rules

This package defines how CSI / MasterFormat crosswalks are imported, reviewed, corrected, resolved, and displayed.

These files are planning/source-rule artifacts only. They do not modify runtime app imports, do not generate catalog data, and do not change app behavior.

## Documents

1. `CSI_CROSSWALK_NORMALIZATION_SPEC.md` - layer separation policy, raw import rules, resolution model, correction policy, display rules, and anti-patterns.
2. `csiCrosswalkNormalizationSource.ts` - source-rule constants for crosswalk layers, source roles, normalization stages, review statuses, relationship types, runtime outputs, and anti-patterns.

## Core Rule

The app must distinguish four separate layers:

- CSI Catalog - canonical codes that exist.
- CSI Catalog Metadata - alternate terms, included topics, products, abbreviations, keyword index terms, and see references.
- CSI Crosswalk - relationships between canonical CSI codes across MasterFormat versions.
- CSI Trade Mapping - operational trade package / bid package ownership.

Do not merge those layers.

`CSI Crosswalk Excel.xlsx` is raw relationship evidence only. Runtime app behavior must use resolved crosswalk records that have been matched against normalized canonical catalogs.
