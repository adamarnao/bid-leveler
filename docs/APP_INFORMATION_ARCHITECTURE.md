# App Information Architecture

This document defines the intended product model and route ownership rules for the bid-leveler app. It is a source-of-truth document for future implementation work and should be updated when product architecture changes.

## Canonical Product Hierarchy

The app should organize estimating work in this order:

1. Project
2. Bid Packages
3. CSI tags
4. Invite recipients
5. Bids
6. Leveling
7. Proposal

## Core Model

### Project

A Project is the top-level workspace. It owns project setup data, dates, teams, documents, bid instructions, selected CSI tags, bid packages, invite recipients, bids, leveling decisions, and future proposal data.

### Bid Packages

Bid Packages are the user-facing scope unit.

Estimators should think and work in Bid Packages because that is how subcontractors are invited, bids are compared, and scope gaps are leveled. Examples include Drywall / Framing, Concrete, Plumbing, HVAC, Electrical, and Doors / Frames / Hardware.

Bid Packages are project-scoped. They may be generated from selected CSI tags, manually edited, deleted, or created from scratch. A Bid Package owns a mapped set of CSI scope item IDs for that project.

### CSI Tags

CSI is the technical tagging and classification layer.

CSI codes support:

- subcontractor matching
- package generation
- scope clarity
- bid coverage checks
- leveling context
- proposal scope traceability

CSI codes should not be presented as the primary estimator-facing deliverable when a Bid Package model is available.

### Invite Recipients

Invite recipients are package-scoped. A subcontractor/contact can be invited to one Bid Package without being globally invited to every package.

Recipients may come from subcontractor matching or manual addition. Recipient status tracks draft, queued, sent, failed, or removed state.

### Bids

Bids are project-scoped submissions from subcontractors. A bid may reference one or more CSI scope item IDs and may intersect one or more Bid Packages. Bid submissions store raw submitted pricing, inclusions, exclusions, clarifications, qualifications, pricing items, and source document metadata.

### Leveling

Leveling is organized by Bid Package. The leveling matrix compares bid submissions that intersect the selected package. Leveling decisions store estimator normalization, review, and selection decisions separately from the raw submitted bid.

### Proposal

Proposal is downstream of selected and leveled bids. Until proposal generation is connected to selected bids, clarifications, inclusions, exclusions, alternates, and contract requirements, proposal pages should remain hidden or clearly marked as placeholders.

## Route Disposition

| Route / area | Disposition | Rule |
| --- | --- | --- |
| Dashboard `/` | Keep | Daily command center and project springboard. |
| Project Command Center `/projects/[projectId]` | Keep | Project workspace hub and primary project navigation. |
| Create Project `/projects/new` | Keep | Create-mode Project Setup flow. |
| Project Setup `/projects/[projectId]/setup` | Keep | ITB readiness and post-invite setup workflow. |
| Project Scope `/projects/[projectId]/scope` | Keep | CSI tag selection and Bid Package management. |
| Invites `/projects/[projectId]/invite` | Keep | Bid-package-first ITB recipient review and send-status workflow. |
| Bids `/projects/[projectId]/bids` | Keep | Project bid list and management. |
| Manual Bid Entry `/projects/[projectId]/bids/new` | Keep | Manual bid submission creation. |
| Bid Edit `/projects/[projectId]/bids/[bidId]` | Keep | Manual bid review/edit/delete. |
| Bid Leveling `/projects/[projectId]/leveling` | Keep | Primary bid comparison and leveling workspace. |
| Subcontractors `/subcontractors` | Keep | Subcontractor library. |
| MasterFormat `/masterformat` | Keep | CSI reference and catalog browser. |
| Settings `/settings` | Keep | User/company settings. |
| Overview `/projects/[projectId]/overview` | Demote | Summary/reference page only. It should not be the primary bid leveling path. |
| CSI Division Detail `/projects/[projectId]/csi-divisions/[divisionId]` | Demote | Legacy CSI-first detail view. Use as reference only unless redesigned around Bid Packages. |
| Global Budgets `/budgets` | Hide/quarantine | Keep out of primary navigation until useful. |
| Global Reports `/reports` | Hide/quarantine | Keep out of primary navigation until useful. |
| Project Budget `/projects/[projectId]/budget` | Hide/quarantine | Placeholder only until connected to real takeoffs, historical pricing, allowances, and bid totals. |
| Project Proposal `/projects/[projectId]/proposal` | Hide/quarantine | Placeholder only until connected to selected bids and proposal generation. |

## Page Responsibility Rules

### Dashboard

The dashboard answers: What should the estimator work on today?

It may show project health, upcoming dates, action items, and quick access to active projects. It should not own project setup, bid package editing, invite recipient editing, or bid leveling decisions.

### Project Command Center

The Project Command Center is the project workspace hub. It links to the major project modules and may summarize project status. It should not duplicate every workflow form.

### Project Setup

Project Setup owns ITB readiness and post-invite setup completeness. It should summarize scope/package status and link to Project Scope for detailed package editing.

`READY_FOR_INVITES` means ITB Launch Ready, not fully complete project setup.

### Project Scope

Project Scope owns selected CSI tags and Bid Packages. It should make Bid Packages the primary user-facing scope unit and CSI tags the supporting classification layer.

### Invites

Invites owns package-scoped recipient generation, editing, removal, and send status. It should not own CSI selection or Bid Package mapping.

### Bids

Bids owns submitted bid records. Bid records should preserve raw subcontractor-submitted information and source document metadata.

### Bid Leveling

Bid Leveling owns comparison and estimator normalization by Bid Package. It should not overwrite raw bid submissions.

### Proposal

Proposal should consume selected and leveled bid data. It should not invent proposal totals or show mock financial data.

## Source-Of-Truth Rules

| Concept | Source of truth | Rule |
| --- | --- | --- |
| Project record | `projects` storage through project helpers | Pages should use merged project helpers, not direct mock lookup. |
| Archive/delete state | Project helpers | Deleted projects are filtered by default; mock-backed deletes use tombstones. |
| CSI selections | `projectCsiSelections` | Legacy `sectionIds` may contain Level 2, 3, or 4 IDs. Do not rename storage shape without migration. |
| Bid Packages | `projectBidPackages` | Bid Packages are the estimator-facing scope units. |
| Package CSI tags | `ProjectBidPackage.scopeItemIds` | Tags must remain selected project CSI scopes or be flagged as stale. |
| Invite recipients | `projectInviteRecipients` | Package/contact recipient model is primary. Legacy draft selections are compatibility only. |
| Legacy invite drafts | `projectDraftInviteSelections` | Read only for compatibility or migration notices. Do not build new workflows on this key. |
| Bid submissions | `projectBidSubmissions` | Store raw submitted bid data and submitted pricing items. |
| Leveling decisions | `projectBidLevelingDecisions` | Store estimator review, normalization, adjustments, and selection decisions. |
| Subcontractor data | `subcontractors` storage through subcontractor helpers | Matching should use merged subcontractor data and hierarchy-aware CSI coverage. |
| CSI catalog | `csiCatalog` helpers | Catalog hierarchy is authoritative: Division, Subdivision, Section, Subsection. |

## Source-Of-Truth Conflict Rules

- Bid Packages should not be silently mutated when CSI selections change. Stale package mappings should be flagged and pruned by explicit user action.
- Deleting a Bid Package should not automatically delete bids unless a dependency cleanup policy exists and is confirmed.
- Bid submissions should not be treated as package-owned records. They are project-scoped and intersect packages through CSI scope item IDs.
- Leveling decisions may depend on Bid Packages and bid submissions. Deleting bids or packages must account for dependent decisions.
- Legacy invite drafts should not drive primary dashboard or invite behavior once package recipients exist.
- Prototype/mock bid and cost data must not be mixed with real project bid summaries unless clearly labeled as prototype data.

