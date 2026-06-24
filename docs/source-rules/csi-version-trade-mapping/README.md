# Bid-Leveler CSI Version + Trade Mapping Source Files

This package defines the source-of-truth rules for how Bid-Leveler should handle:
- MasterFormat Current
- MasterFormat 1995
- the existing CSI version crosswalk
- CSI-to-trade mapping
- subcontractor dual CSI coverage tagging
- project CSI version inheritance/override
- bid package CSI tags
- bid leveling / estimate review division grouping

Project CSI version is part of Project Profile / Project Setup. These rules define how that selected version affects CSI display, package tags, matching, leveling, and reporting. Do not move unrelated Project Profile fields into CSI mapping logic.

These files are planning/source files. Codex should implement from these rules rather than inventing behavior.

Review order:
1. CSI_VERSION_AND_TRADE_MAPPING_RULES.md
2. csiVersionTradeMappingSource.ts
