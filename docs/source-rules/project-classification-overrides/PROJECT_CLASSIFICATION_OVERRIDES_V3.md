# Project Profile Visibility Overrides v3

## Purpose

Project Profile visibility rules need to support defaults, overrides, and exceptions.

The system must recommend trades intelligently without becoming rigid.

A trade may be:
- visible by system default
- added by company default
- added by project-specific override
- triggered by sector
- triggered by facility type / subsector
- triggered by work type
- triggered by context tag
- triggered by building attributes
- triggered by package-level decisions
- triggered by selected CSI evidence
- manually hidden or promoted by the estimator

## Three Layers of Control

System Defaults
→ Company Defaults
→ Project-Specific Overrides

## Visibility Resolution Order

Final trade visibility should resolve in this order:

1. Start with system default visibility.
2. Apply company default overrides.
3. Apply Project Profile classification rules: sector, facility type / subsector, work type, and context tags.
4. Apply selected CSI tag evidence.
5. Apply building attribute, package-level decision, and project-specific overrides.
6. Return final visibility and explanation trail.

Project-specific overrides should win over company and system defaults.

Company defaults should win over system defaults.

Selected CSI evidence should be able to reveal a hidden trade as Suggested or Contextual, but if the estimator explicitly hides it for the project, the project override wins.

## Override Inputs

Visibility overrides can apply to:

- sector
- facility type / subsector
- work type
- context tag
- building attributes
- package-level decisions
- selected CSI evidence
- project-specific override

Building attributes include global Project Profile facts such as structure type, occupied / active operations status, sitework scope flag, exterior envelope scope flag, floor count, high-rise status, secure facility status, and similar profile attributes.

Package-level decisions include reviewed bid package include/exclude decisions, split/combine decisions, CSI tag roles, package-specific finish level, package-specific intensity assumptions, and package-specific clarifications or exclusions.

## Visibility Levels

| Level | Meaning |
|---|---|
| CORE | Expected and normally included for this project classification. |
| SUGGESTED | Likely or commonly relevant; estimator should review. |
| CONTEXTUAL | Available because a context tag or selected CSI evidence triggered it. |
| HIDDEN | Available in the library but not shown by default. |
| EXCLUDED | Normally not relevant or explicitly hidden, but still manually recoverable. |

## Explanation Trail

Every final visibility result should explain why.

Example:

Siding / Exterior Cladding  
Visibility: Suggested

Why:
- Normally hidden for Office + Tenant Improvement / Interior Fit-Out.
- Shown because estimator selected Exterior Envelope Scope.
- Promoted by project-specific override.

Example:

Full Building Demolition  
Visibility: Hidden

Why:
- Active in master trade library.
- Not normally relevant for Office + Tenant Improvement / Interior Fit-Out.
- Selective / Interior Demolition remains Core.

## Manual Override Actions

The Project Setup / Bid Package Builder should eventually support:

- Add Hidden Trade
- Promote to Core
- Demote to Suggested
- Hide from Project
- Restore Hidden Trade
- Reset Trade to Project Defaults
- Reset All to Company Defaults
- Reset All to System Defaults

## Reset Behavior

### Reset Trade to Project Defaults

Removes the project-specific override for one trade and recalculates from:
- system defaults
- company defaults
- Project Profile classification rules
- CSI evidence

### Reset All to Company Defaults

Removes all project-specific overrides, but keeps company defaults.

### Reset All to System Defaults

Ignores/removes company and project overrides for the preview, but should not delete company settings unless user is in Settings and confirms.

## Company Settings Future UI

Settings
→ Trade / Bid Package Defaults
→ Classification Visibility Rules
→ CSI-to-Trade Mapping Preferences
→ Package Split/Combine Defaults

Company-level examples:
- For Office TI, always show Millwork as Suggested.
- For Healthcare, always show Infection Control as Core.
- For Restaurant + Commercial Kitchen, always show Food Service Equipment as Core.
- For Residential Remodel, always show Appliances as Suggested.
- For Government jobs, show public-bid/prevailing-wage warnings.

## Project Setup Future UI

After Project Profile classification is selected:

- Core Trades
- Suggested Trades
- Contextual Trades
- Hidden but Available
- Excluded / Not Normally Relevant

Estimator actions:
- Add hidden trade
- Promote/demote/hide trade
- Add context tag
- Split specializations
- Combine packages
- Review CSI tags inside package

## Key Rule

The app should not decide permanently. It should recommend, explain, and allow estimator override.
