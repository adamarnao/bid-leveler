# Bid-Leveler Project Profile Visibility Overrides v3

This package complements:
- project-profile
- bid_leveler_classification_source_v2
- bid_leveler_csi_version_trade_mapping_rules

Purpose:
Define how system defaults, company defaults, Project Profile classification, project-specific overrides, package-level decisions, and selected CSI evidence resolve into the final project trade visibility list.

Project Classification is a section inside Project Profile. These overrides apply to Project Profile-driven visibility, not to a separate classification subsystem.

Review order:
1. PROJECT_CLASSIFICATION_OVERRIDES_V3.md
2. classificationOverrideSource.v3.ts
3. visibilityResolutionSource.v3.ts

These are planning/source files. Codex should implement from these rules rather than inventing behavior.
