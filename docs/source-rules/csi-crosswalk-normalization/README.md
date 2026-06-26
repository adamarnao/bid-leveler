# CSI Crosswalk Normalization Source Rules

This package defines how CSI / MasterFormat crosswalks are imported, reviewed, corrected, resolved, and displayed.

These files are planning/source-rule artifacts only. They do not modify runtime app imports, do not generate catalog data, and do not change app behavior.

## Documents

1. `CSI_CROSSWALK_NORMALIZATION_SPEC.md` - layer separation policy, raw import rules, resolution model, correction policy, display rules, and anti-patterns.
2. `csiCrosswalkNormalizationSource.ts` - source-rule constants for relationship roles, relationship types, cardinality, review statuses, issue types, workbench filters, anti-patterns, and canonical correction examples.

## Core Rule

`CSI Crosswalk Excel.xlsx` is raw relationship evidence only. Runtime app behavior must use resolved crosswalk records that have been matched against normalized canonical catalogs.

Crosswalk records must preserve raw imported values and add resolved values separately.
