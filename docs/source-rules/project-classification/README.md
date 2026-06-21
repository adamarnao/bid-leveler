# Bid-Leveler Classification Source Files v2

This package supersedes the earlier classification draft.

The main correction is that **Sector**, **Work Type**, and **Context Tags** are not independent flat lists.

The intended model is:

Sector selected first
→ Work Type labels/options adapt to sector
→ Context Tags are filtered by sector + work type
→ Trade visibility is assembled from:
  base common trades
  + sector rules
  + work type rules
  + context tag triggers
  - demotions/exclusions

Review order:
1. PROJECT_CLASSIFICATION_RULES_V2.md
2. projectClassificationSource.v2.ts
3. tradeVisibilityRulesSource.v2.ts

These are planning/source files for Codex to import later. Codex should not invent its own rules.
