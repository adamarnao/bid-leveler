# Database-Ready Domain Model Source Rules

This folder documents the future database-ready domain model for Bid-Leveler.

These files are planning/source artifacts only. They do not define live app storage, do not add a database dependency, and must not be imported into runtime code until an explicit implementation phase.

## Read Order

1. `DATABASE_READY_DOMAIN_MODEL.md`
2. `databaseModelSource.ts`

## Relationship To Other Source Rules

- Project Profile is the parent source of truth for project setup and classification.
- Project Classification is a section inside Project Profile.
- Trade Visibility uses Project Classification, company overrides, project overrides, and selected CSI evidence.
- CSI Version / Trade Mapping supports package CSI tags, subcontractor coverage, matching, leveling, and estimate review grouping.
- This database model describes where those concepts should live when mock/localStorage data is replaced by real persistence.

## Storage Principle

System defaults are source-controlled seed data. Company overrides, project overrides, project bid packages, invite recipients, bid submissions, leveling decisions, estimate reviews, and proposal outputs belong in the database.

Mock data and localStorage are temporary implementation scaffolding and are not design constraints.
