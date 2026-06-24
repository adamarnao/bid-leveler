# Bid-Leveler Project Classification Source Files v2

Project Classification is a section inside the larger Project Profile source-of-truth model.

Project Profile owns the full setup model. Project Classification owns only the classification vocabulary and dependency rules used by profile setup, trade visibility, package generation, ITB preparation, historical pricing, estimate review, and proposal output.

The classification section includes:

- Sector
- Subsector / Facility Type
- Work Type
- Context Tags

The main correction is that **Sector**, **Subsector / Facility Type**, **Work Type**, and **Context Tags** are not independent flat lists.

The intended model is:

```text
Sector selected first
-> Facility Type options filter by sector
-> Work Type labels/options adapt to sector and facility type
-> Context Tags are filtered by sector + facility type + work type
-> Trade visibility is assembled from:
  base common trades
  + sector rules
  + facility type rules
  + work type rules
  + context tag triggers
  + selected CSI evidence
  + visibility overrides
  - demotions/exclusions
```

Review order:

1. `PROJECT_CLASSIFICATION_RULES_V2.md`
2. `projectClassificationSource.v2.ts`
3. `tradeVisibilityRulesSource.v2.ts`

These are planning/source files for Codex to import later. Codex should not invent its own rules.

Do not treat context tags as a junk drawer for all project attributes. Building attributes, logistics, procurement constraints, pricing metrics, and package-specific review decisions belong to Project Profile or reviewed Bid Packages.
