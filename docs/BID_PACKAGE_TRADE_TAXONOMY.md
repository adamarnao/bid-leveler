# Bid Package Trade Taxonomy

This document defines the intended trade package taxonomy model for generating and managing project Bid Packages.

## Purpose

Bid Packages are company-standard trade packages customized per project.

The goal is to group selected CSI tags into the packages estimators actually invite, level, and award. CSI hierarchy is useful classification data, but it does not always match how subcontractors bid work.

## Why One-Off Rules Are Not Enough

A single rule such as "group gypsum board and metal framing into Drywall / Framing" is useful, but it is not enough.

Estimating workflows need a repeatable company taxonomy that handles many trades consistently:

- multiple CSI sections can belong to one practical trade package
- one CSI subdivision can contain scopes that should split across trades
- different companies may name packages differently
- project-specific package adjustments should be preserved
- unmatched CSI tags still need a fallback package

The generator should use a taxonomy first, then CSI hierarchy fallback second.

## Taxonomy Structure

Each trade package template should support this structure:

| Field | Purpose |
| --- | --- |
| `tradeId` | Stable company identifier for the trade package template. |
| `name` | User-facing Bid Package name. |
| `aliases` | Alternate names used by estimators or subcontractors. |
| `csiCodePatterns` | CSI code prefixes or patterns that commonly map to this trade. |
| `keywords` | Title/name keywords used when code patterns are insufficient. |
| `exclusions` | Codes or keywords that should not map even if they partially match. |
| `notes` | Human-readable guidance for edge cases. |
| `fallbackBehavior` | What to do when selected CSI tags match partially or ambiguously. |

The implementation may store hierarchy with `parentId`, but user-facing terminology should describe lower-level trade nodes as `Specializations`, not children.

Suggested TypeScript shape:

```ts
export type BidPackageTradeTemplate = {
  tradeId: string;
  name: string;
  aliases?: string[];
  csiCodePatterns?: string[];
  keywords?: string[];
  exclusions?: {
    csiCodePatterns?: string[];
    keywords?: string[];
  };
  notes?: string;
  fallbackBehavior?: "GROUP_BY_TRADE" | "GROUP_BY_CSI_SUBDIVISION" | "REVIEW_REQUIRED";
};
```

## Draft Trade List

The initial company-standard taxonomy should include at least:

| Trade package | Notes |
| --- | --- |
| Concrete | Specializations include Cast-In-Place Concrete, Tilt-Up Concrete, Precast Concrete, and Shotcrete. |
| Masonry | Specializations include CMU / Brick Masonry, Stone Masonry, and Simulated Masonry. |
| Structural Steel | Structural steel framing, joists, deck where company standards place them here. |
| Misc Metals | Specializations include Architectural Metals and Railings. |
| Rough Carpentry | Blocking, sheathing, wood framing, rough carpentry scopes. |
| Finish Carpentry / Millwork | Architectural woodwork, casework, finish carpentry, and Countertops where project/vendor strategy supports it. |
| Countertops | Specialization under Finish Carpentry / Millwork. Laminate tops may stay with millwork; stone, quartz, granite, or solid-surface tops may need separate bid packages. |
| Roofing | Specializations include Membrane Roofing, Sheet Metal Roofing, and Shingle Roofing. |
| Waterproofing | Below-grade waterproofing, sealants, air barriers where company standards place them here. |
| Doors / Frames / Hardware | Doors, frames, hardware, access doors when appropriate. |
| Overhead Doors | Standalone trade for sectional doors, coiling doors, rolling doors, and loading dock doors. |
| Glass / Glazing | Storefront, curtain wall, windows, glazing systems. |
| Drywall / Framing | Gypsum board, drywall, metal studs, non-structural metal framing, shaft wall. |
| Ceilings | ACT, specialty ceilings, ceiling suspension systems. |
| Flooring | Resilient, carpet, wood, fluid-applied flooring where applicable. |
| Tile | Ceramic, porcelain, stone tile, tile setting materials. |
| Painting / Coatings | Painting, high-performance coatings, wall coverings where applicable. |
| Specialties | Needs separate estimator review before adding toilet accessories, fire extinguishers, lockers, signage, and similar specialty breakdowns. |
| Equipment | Owner or contractor equipment scopes where not carried by another trade. |
| Fire Protection | Fire sprinkler and suppression systems. |
| Plumbing | Domestic water, sanitary, storm, fixtures, plumbing equipment, and Medical Gas where applicable. |
| HVAC | Mechanical HVAC systems, ductwork, piping, controls where company standards place controls here. |
| Electrical | Power, lighting, panels, distribution, devices. |
| Low Voltage / Technology | Data, communications, security, AV, low-voltage systems. |
| Earthwork / Sitework | Sitework specializations include Demolition, Earthwork, Utilities, Asphalt / Paving, and Landscaping. |
| Utilities | Site utilities, water, sewer, storm, gas, utility tie-ins. |
| Asphalt / Paving | Asphalt paving, striping, pavement markings where applicable. |
| Landscaping | Planting, irrigation, landscape accessories. |

## Drywall / Framing Example

Gypsum board and metal stud framing should roll into one `Drywall / Framing` Bid Package.

Example selected CSI tags:

- gypsum board
- drywall
- plaster
- metal stud framing
- non-structural metal framing
- shaft wall
- acoustical insulation related to drywall assemblies

These should not generate separate awkward CSI-only packages when they are normally bid together by the same trade.

## Generation Rules

Final generation logic should follow this order:

1. Match selected CSI tags against company trade taxonomy.
2. Group matched tags into trade Bid Packages.
3. Apply exclusions to prevent false matches.
4. Flag ambiguous matches for review where practical.
5. Use CSI hierarchy fallback for unmatched tags.
6. Do not create empty packages.
7. Preserve manually created or manually edited project packages unless the user explicitly chooses to replace them.

## Fallback Behavior

CSI hierarchy fallback should be conservative.

Recommended fallback:

1. Resolve the selected CSI item.
2. Find the nearest Level 2 Subdivision when possible.
3. Create a generated package from the Subdivision label.
4. If no Subdivision exists, fall back to Division.
5. Mark or label the generated package so the estimator can review it.

Fallback packages should be treated as review candidates, not a replacement for company-standard trade taxonomy.

## Customization Rules

The taxonomy should support company defaults and project-specific edits.

Rules:

- Company taxonomy provides default package names and matching rules.
- Project Bid Packages are copied/generated into project storage.
- Project edits should not mutate company defaults.
- Manual project packages should not be overwritten by regeneration.
- Generated packages may be pruned, renamed, split, or merged by the estimator.

## Future Enhancements

Future taxonomy work may include:

- company-specific aliases
- market-sector-specific package variations
- regional trade naming
- subcontractor preference mappings
- split/merge suggestions
- confidence scores for generated packages
- review-needed flags for ambiguous CSI tags
