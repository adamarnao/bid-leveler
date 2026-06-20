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

Professional taxonomy nodes also support lightweight metadata so a comprehensive GC trade library can exist without cluttering normal project setup:

| Field | Purpose |
| --- | --- |
| `isCommon` | Marks trades that should usually appear in normal setup and package generation views. |
| `defaultHidden` | Hides specialty or sector-specific trades until triggered by sector, search, or advanced review. |
| `sectorTags` | Project-sector triggers such as healthcare, restaurant, laboratory, sitework, warehouse, or mission critical. |
| `specialtyTags` | Trade behavior tags such as core, specialty, sector-specific, owner/vendor, allowance candidate, GC cost, alternate candidate, or cross-trade. |
| `relatedTradeIds` | Captures cross-trade ambiguity where scope may belong to more than one bid package. |
| `splitRecommendation` | User-facing guidance for when to split or combine a trade package. |
| `estimatingNotes` | Estimator-facing notes for procurement, allowances, owner/vendor scope, and bid strategy. |

Default project setup should favor common visible trades. Hidden specialty trades should become visible only when a sector trigger, search, or advanced taxonomy review makes them relevant.

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
| General Conditions / Project Requirements | GC cost / project requirement scope, not ordinary subcontractor scope. Includes supervision, temporary facilities/utilities, safety, waste management, final cleaning, temporary protection, hoisting, scaffolding, layout/survey, testing, commissioning, permits, bonds/insurance, winter conditions, temporary fencing, and mobilization. |
| Existing Conditions / Demolition | Selective demolition, full building demolition, interior demolition, sawcutting/coring, hazardous materials, asbestos, lead paint, mold remediation, universal waste, UST removal, and salvage/relocation. |
| Sitework / Civil | Clearing/grubbing, earthwork, excavation, grading, soil stabilization, erosion control, dewatering, shoring/sheeting, utilities, storm, sanitary, water, gas, site electrical, site concrete, curbs/sidewalks, paving, striping, traffic control/signals, site signage, fencing/gates, retaining walls, landscaping, irrigation, hardscape, synthetic turf, athletic fields, playgrounds, and site furnishings. |
| Concrete | Cast-in-place, tilt-up, precast, shotcrete, structural concrete, slabs, formwork, reinforcing steel, post-tensioning, finishing, polished concrete, sealers/densifiers, repair/restoration, grouting, lightweight concrete, and gypsum cement underlayment. |
| Masonry | CMU/brick, structural masonry, veneer masonry, stone, cast stone, simulated/manufactured masonry, glass unit masonry, restoration, and tuckpointing/repointing. |
| Structural Steel | Structural steel, steel joists, metal decking, steel erection, and miscellaneous structural steel. |
| Misc Metals | Stairs, railings, ladders, bollards, lintels, shelf angles, gratings, architectural metals, decorative metals, and metal fabrications. |
| Rough Carpentry | Wood framing, blocking/backing, sheathing, trusses, timber construction, heavy timber, and CLT/mass timber. |
| Finish Carpentry / Millwork | Architectural millwork, cabinets, casework, Countertops, interior trim, and wood paneling. |
| Countertops | Specialization under Finish Carpentry / Millwork. Laminate tops may stay with millwork; solid surface, stone, quartz, or granite tops may need separate bid packages. |
| Roofing | Membrane roofing, TPO, EPDM, PVC, modified bitumen, built-up roofing, metal roofing, shingle roofing, roof accessories, roof hatches, roof curbs, gutters/downspouts, and sheet metal flashing. |
| Waterproofing | Below-grade, fluid-applied, sheet waterproofing, dampproofing, air/vapor barriers, sealants/caulking, firestopping, and expansion joint covers. |
| Insulation | Batt, rigid, spray foam, mineral wool, and acoustic insulation; review overlap with drywall, roofing, and waterproofing. |
| Doors / Frames / Hardware | Hollow metal doors/frames, wood doors, fiberglass doors, aluminum doors, door hardware, access doors/panels, and automatic door operators. |
| Overhead Doors | Standalone trade for sectional overhead doors, coiling doors, rolling fire doors, high-speed doors, loading dock equipment, dock levelers, and dock seals/shelters. |
| Glass / Glazing | Storefront, curtain wall, interior glass/glazing, glass entrances, mirrors, skylights, and translucent wall/roof assemblies. |
| Drywall / Framing | Non-structural metal framing, gypsum board, shaft wall assemblies, plaster, acoustic insulation, and drywall finishing. |
| Ceilings | ACT ceilings, specialty ceilings, wood ceilings, metal ceilings, and acoustic panels/clouds. |
| Flooring | Carpet, carpet tile, resilient/LVT, sheet vinyl, rubber flooring, tile, wood flooring, resinous/epoxy, athletic flooring, prep/moisture mitigation, and floor leveling. |
| Wall Finishes | Painting/coatings, wallcovering, decorative finishes, high-performance coatings, FRP panels, and acoustical wall panels. |
| Specialties | Toilet accessories, fire extinguishers/cabinets, lockers, signage, visual display boards, projection screens, postal specialties, cubicle curtains/tracks, wall protection, entrance mats/grilles, flagpoles, louvers/vents, bird control, operable/folding partitions, storage shelving, wire mesh partitions, and bath partitions. Obscure items remain hidden/specialty by default. |
| Equipment | Food service, commercial kitchen, residential appliances, laundry, medical, laboratory, athletic, stage/theater, AV, loading dock equipment, trash chutes, projection/presentation, and vehicle service equipment. Often owner/vendor furnished or allowance-driven. |
| Furnishings / FF&E | Window treatments, blinds/shades, curtains/drapery, fixed seating, auditorium seating, furniture, systems furniture, artwork/accessories, and rugs/mats. Hidden by default unless GC procurement or coordination is in scope. |
| Conveying | Elevators, escalators, platform lifts, wheelchair lifts, dumbwaiters, material lifts, and pneumatic tube systems. Hidden by default unless vertical transportation or material movement systems are in scope. |
| Fire Protection | Fire sprinkler and suppression systems. |
| Plumbing | Domestic water, sanitary, storm, fixtures, plumbing equipment, and Medical Gas where applicable. |
| HVAC | Mechanical HVAC systems, ductwork, piping, controls where company standards place controls here. |
| Electrical | Power, lighting, panels, distribution, devices. |
| Low Voltage / Technology | Data, communications, security, AV, low-voltage systems. |
| Earthwork / Sitework | See Sitework / Civil. Demolition now lives under Existing Conditions / Demolition rather than Sitework. |
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
- sector-triggered hidden specialty trades
- regional trade naming
- subcontractor preference mappings
- split/merge suggestions
- confidence scores for generated packages
- review-needed flags for ambiguous CSI tags
- project-specific overrides that do not mutate the company taxonomy
