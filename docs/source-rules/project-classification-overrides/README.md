# Bid-Leveler Classification Overrides v3

This package complements:
- bid_leveler_classification_source_v2
- bid_leveler_csi_version_trade_mapping_rules

Purpose:
Define how system defaults, company defaults, project-specific overrides, and CSI evidence resolve into the final project trade visibility list.

Review order:
1. PROJECT_CLASSIFICATION_OVERRIDES_V3.md
2. classificationOverrideSource.v3.ts
3. visibilityResolutionSource.v3.ts

These are planning/source files. Codex should implement from these rules rather than inventing behavior.
