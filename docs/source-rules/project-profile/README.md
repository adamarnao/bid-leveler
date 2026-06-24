# Project Profile Source Rules

This folder defines the source-of-truth rules for the Project Setup / Project Profile workflow.

The Project Profile model is the preconstruction layer that turns project facts into bid package decisions, ITB readiness, future estimate review support, and proposal-ready clarification output.

## Source-Rule Hierarchy

Project Profile is the parent source-of-truth.

Project Classification is one section inside Project Profile. It defines sector, subsector / facility type, work type, and context tags.

Trade Visibility uses Project Classification plus company overrides, project overrides, selected CSI evidence, and package-level decisions.

CSI Version / Trade Mapping supports package CSI tags, subcontractor matching, bid leveling grouping, estimate review grouping, and proposal scope references.

## Documents

- `PROJECT_PROFILE_AND_SETUP_RULES.md` - canonical workflow stages, ITB readiness requirements, package review requirements, and global-vs-package responsibility rules.
- `projectProfileSource.ts` - planning/source types for project-level profile data.
- `projectSetupRuleSource.ts` - planning/source types for setup dependencies, field effects, and workflow rules.
- `pricingMetricSource.ts` - planning/source pricing metrics by sector/subsector.

## Current Status

These documents are planning/source-rule artifacts only. They do not change live app behavior, storage, routing, or UI until a later implementation phase explicitly integrates them.
