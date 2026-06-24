# CSI Version and Trade Mapping Rules

## Purpose

Bid-Leveler must support projects and subcontractor coverage using either MasterFormat Current or MasterFormat 1995.

The app already has:
- MasterFormat Current catalog
- MasterFormat 1995 catalog
- a CSI crosswalk/conversion matrix between the versions

The missing layer is the rule system that uses those catalogs and the crosswalk correctly when:
- subcontractors are tagged with CSI coverage
- project bid packages are created
- subcontractors are matched to bid packages
- bid leveling and estimate review are organized
- proposal scope is generated

## Core Principle

Trade Package = what the GC is buying.  
CSI Tags = how the scope is technically classified.  
Subcontractors = who may bid that package.  
MasterFormat Version = how the CSI tags are displayed and grouped for the project.

CSI should power the system, but the estimator should operate primarily through bid packages/trades.

## Company Default and Project Override

Company settings should define the default CSI version:
- MASTERFORMAT_CURRENT
- MASTERFORMAT_1995

Each project inherits the company default but can override it.

The project-level CSI version is a Project Profile / Project Setup field. CSI mapping rules consume that selected version; they should not own broader Project Profile fields such as sector, facility type, work type, logistics, procurement, or pricing metrics.

The selected project CSI version controls:
- CSI tags shown inside bid packages
- CSI selector/search version
- subcontractor matching direct-version priority
- bid leveling grouping by top-level division
- estimate review grouping by top-level division
- proposal CSI references if included

Changing project CSI version after packages/invites/bids exist should require confirmation because it changes display/grouping and may require re-resolving package CSI tags.

## Subcontractor Dual-Tagging Rule

When a subcontractor is assigned CSI coverage in either MasterFormat version, the app should automatically attach equivalent coverage in the alternate version when a reliable crosswalk exists.

Example: Current to 1995:
- User selects 09 29 00 Gypsum Board.
- System derives the 1995 equivalent, such as 09250 Gypsum Board, if mapped.

Example: 1995 to Current:
- User selects 09250 Gypsum Board.
- System derives the current equivalent, such as 09 29 00 Gypsum Board, if mapped.

The subcontractor record must preserve:
- original selected CSI version
- original selected CSI item
- derived alternate-version equivalents
- confidence
- source of derivation

The app should never silently replace the original user selection with only the crosswalked equivalent.

## CSI-to-Trade Mapping Layer

Do not call this a CSI crosswalk. It is not CSI-version conversion.

CSI Crosswalk = maps one CSI version to another CSI version.  
CSI-to-Trade Mapping = maps CSI scope items to estimator trade packages/specializations.

## Mapping Rule Types

CSI-to-trade mapping should support:
1. Exact CSI item mapping
2. CSI code pattern/prefix mapping
3. Title keyword mapping
4. Sector/work type/context-aware mapping
5. Company mapping overrides
6. Project mapping overrides
7. Manual estimator reassignment

## Mapping Priority

For a project using MasterFormat Current:
1. Project-specific override for current CSI item
2. Company override for current CSI item
3. Exact current CSI mapping rule
4. Current CSI code pattern rule
5. Current CSI title keyword rule
6. Crosswalk current to 1995, then check 1995 mapping
7. Generic fallback keyword/pattern
8. Unassigned / estimator review required

For a project using MasterFormat 1995:
1. Project-specific override for 1995 CSI item
2. Company override for 1995 CSI item
3. Exact 1995 CSI mapping rule
4. 1995 CSI code pattern rule
5. 1995 CSI title keyword rule
6. Crosswalk 1995 to current, then check current mapping
7. Generic fallback keyword/pattern
8. Unassigned / estimator review required

## Confidence Rules

Project override: High  
Company override: High  
Direct exact CSI rule: High  
Direct code pattern rule: Medium to High  
Direct keyword rule: Medium  
Crosswalked exact rule: Medium to High  
Crosswalked pattern/keyword: Medium  
Generic fallback keyword: Low to Medium  
Ambiguous cross-trade match: Low to Medium, review required

## Project Bid Package CSI Tags

Project bid packages should carry CSI tags in the project’s selected CSI version.

Each tag should preserve:
- csiVersion
- csiItemId
- role
- source
- tradeId / specializationId
- original CSI version/item if crosswalk-derived
- confidence
- notes

## CSI Tag Roles Inside a Bid Package

Not all CSI tags are equal.

CORE = expected part of bid package scope.  
OPTIONAL = may be requested, selected, or split depending project.  
POSSIBLE = ambiguous; estimator should review.  
EXCLUDED = deliberately not part of this package.

Example:

Drywall / Framing:
- CORE: Gypsum Board, Non-Structural Metal Framing
- POSSIBLE: Acoustic Insulation
- EXCLUDED: ACT Ceilings, if split into Ceilings package

## Bid Package CSI Version Behavior

If the project uses 1995:
- bid package CSI tags are displayed in 1995 MasterFormat.

If the project uses Current:
- bid package CSI tags are displayed in current MasterFormat.

The trade package stays the same. Only the CSI representation changes.

## Subcontractor Matching Priority

For a project using the selected CSI version:
1. Direct subcontractor coverage match in project CSI version
2. Crosswalk-derived equivalent match from alternate CSI version
3. Trade/specialization match
4. Keyword/manual possible match
5. No match

The UI should explain the source:
- Matched directly on 09 29 00 Gypsum Board.
- Matched through 1995/current CSI crosswalk from 09250 Gypsum Board.

## Estimate Review / Bid Leveling Grouping

Bid leveling and estimate review should organize by the project’s selected MasterFormat top-level division.

Example:

Division 09 - Finishes
- Bid Package: Drywall / Framing
- Bid Package: Ceilings
- Bid Package: Flooring

Division 22 - Plumbing
- Bid Package: Plumbing

Division 23 - HVAC
- Bid Package: HVAC

Division 26 - Electrical
- Bid Package: Electrical

If the project uses 1995, use 1995 top-level divisions.  
If the project uses Current, use Current top-level divisions.

## Bid Package Ownership vs Reporting Division

Bid Package = what gets bid.  
CSI Division = how it is organized in review/proposal.  
Trade Taxonomy = how the package was intelligently created.

## Packages Spanning Multiple Divisions

Some packages will include CSI tags from more than one division.

Examples:
- Food Service Equipment may require plumbing/electrical/fire protection coordination.
- Low Voltage may span communications, security, fire alarm.
- Kitchen Hood may touch HVAC, food service, fire suppression.

Each bid package should have a primary reporting division.

Primary Division Rules:
1. If most package CSI tags fall under one top-level division, use that division.
2. If the trade taxonomy has a preferred reporting division, use it.
3. If project context makes a different division more appropriate, allow rule preference.
4. If ambiguous, estimator selects primary reporting division.
5. Always preserve all CSI tags inside the package.

## Subcontractor Profile UI Rules

Subcontractor profile should show:
- CSI Coverage
- Current MasterFormat coverage
- 1995 MasterFormat equivalent coverage
- mapping status/confidence

Recommended display:
- Show the company/project default CSI version first.
- Show equivalent CSI tags collapsed.
- Show warnings where crosswalk is missing/low-confidence.

## ITB Flow

ITB generation should use:
- project’s selected CSI version
- bid package name
- CSI tags inside package
- trade/specialization identity
- project details
- RFI/site walk/bid due instructions
- matched recipients

CSI codes should appear as supporting scope detail, not as the main message.

## Codex Implementation Rule

Codex should not invent the CSI/version behavior.

Implementation should follow this sequence:
1. Add source docs/types for CSI version + trade mapping rules.
2. Add version-aware CSI assignment helpers.
3. Add subcontractor dual-tagging helpers.
4. Add workbench inspection for version-aware mappings.
5. Only then integrate into subcontractor profile / project setup / package builder.

## Required Test Scenarios

1. Current project + current subcontractor coverage:
- Project uses current MasterFormat.
- Sub has current gypsum board coverage.
- Drywall package matches directly.

2. Current project + 1995 subcontractor coverage:
- Project uses current MasterFormat.
- Sub has 1995 gypsum board coverage.
- Drywall package matches through crosswalk.

3. 1995 project + current subcontractor coverage:
- Project uses 1995 MasterFormat.
- Sub has current gypsum board coverage.
- Drywall package matches through crosswalk.

4. 1995 project + 1995 subcontractor coverage:
- Project uses 1995 MasterFormat.
- Sub has 1995 gypsum board coverage.
- Drywall package matches directly.

5. Cross-trade ambiguous scope:
- Insulation or fire alarm maps to multiple possible trades.
- App returns possible trades and review warning.

6. Package grouping:
- Project uses 1995.
- Estimate review groups packages by 1995 divisions.
- Same packages in current project group by current divisions.
