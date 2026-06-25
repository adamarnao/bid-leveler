# Database-Ready Domain Model

## Purpose

This document defines the future real-product data model for Bid-Leveler. It is database-ready planning guidance, not live app behavior.

The model aligns these source-rule areas:

- Project Profile and Project Setup
- Project Classification and visibility overrides
- CSI version and trade mapping
- Subcontractor contacts and coverage
- Bid packages and package review
- ITB recipients and correspondence
- Bid submissions and pricing items
- Bid leveling and estimate review
- Proposal output

## Canonical Product Hierarchy

Company / Workspace -> Projects -> Project Profile -> Bid Packages -> CSI Tags -> Invite Recipients -> Bid Submissions -> Bid Leveling -> Estimate Review -> Proposal

Bid Package owns the scope. CSI tags classify the package scope. Subcontractors and contacts are invited to bid packages. Selected bids feed estimate review. Estimate review feeds proposal output.

## Company / Workspace Data

Future entities:

| Entity | Purpose |
| --- | --- |
| Company | Workspace/account boundary for projects, users, subcontractors, settings, and overrides. |
| User | Internal user who estimates, coordinates, reviews, or administers work. |
| UserRole | Permission and workflow role assignment. |
| CompanySettings | Company defaults for CSI version, terminology, visibility, and workflow behavior. |
| CompanyDefaultCsiVersion | Default project CSI version, either `MASTERFORMAT_1995` or `MASTERFORMAT_2004_PLUS`. |
| CompanyTradeVisibilityOverride | Company-level trade visibility rule layered over system defaults. |
| CompanyCsiToTradeOverride | Company-level CSI-to-trade assignment override. |
| CompanyBidPackageTemplate | Company-standard package template that can seed project bid packages. |
| CompanyTerminologyPreference | Company-preferred labels without changing canonical runtime IDs. |

System taxonomy, source rules, seed CSI mappings, and default trade package rules remain source-controlled seed data. Company customizations belong in the database.

## Subcontractor Data

Future entities:

| Entity | Purpose |
| --- | --- |
| SubcontractorCompany | Trade partner company record. |
| SubcontractorLocation | Office/branch/service-area location for a subcontractor. |
| SubcontractorContact | First-class person record for bidding, PM, accounting, contracts, insurance, and package-specific communication. |
| SubcontractorContactRole | Contact role assignment, including estimating, PM, accounting, contracts, insurance, division-specific, or package-specific roles. |
| SubcontractorCsiCoverage | Original CSI coverage selected for the subcontractor in MasterFormat 1995 / 16-Division or MasterFormat 2004+ / 50-Division. |
| SubcontractorEquivalentCsiCoverage | Derived alternate-version coverage from a reliable CSI crosswalk. |
| SubcontractorTradeSpecialization | Trade taxonomy and specialization coverage independent of CSI version. |
| SubcontractorPrequalification | Prequal status, limits, notes, and review metadata. |
| SubcontractorInsuranceDocument | Insurance document tracking and expiration metadata. |
| SubcontractorTaxDocument | W-9 and tax document tracking. |

Contacts are not nested text fields. A subcontractor may have estimating, PM, accounting, contracts, insurance, and division-specific contacts. Invite and resend behavior should target contacts, not only subcontractor companies.

CSI coverage must support both MasterFormat 1995 / 16-Division and MasterFormat 2004+ / 50-Division. Equivalent coverage should be derived through the CSI crosswalk when reliable and must preserve the original selected coverage.

## Project Data

Future entities:

| Entity | Purpose |
| --- | --- |
| Project | Top-level project record, identity, client, status, bid dates, and lifecycle. |
| ProjectProfile | Parent setup/profile model used for classification, scope generation, ITB readiness, historical pricing, estimate review, and proposal output. |
| ProjectClassification | Sector, facility type/subsector, work type, and context tags. |
| ProjectGlobalAttributes | Square footage, floors, building condition, structure type, occupancy condition, site scope, envelope scope, and project CSI version. |
| ProjectLogistics | Site walk, occupied site, phasing, night work, restricted access, secure facility, high-rise, limited laydown. |
| ProjectProcurement | Public/private, prevailing wage, bond, tax status, contract type, owner/vendor scope, alternates, allowances, unit prices. |
| ProjectDocument | Plans, specs, addenda, bid forms, instructions, and document access metadata. |
| ProjectEvent | Site walk, pre-bid meeting, RFI deadline, sub bid deadline, GC bid deadline, addendum events, and future event-specific invites. |
| ProjectTradeVisibilityOverride | Project-specific trade visibility decision with explanation trail. |
| ProjectCsiVersionSettings | Company default, selected project CSI version, and override metadata. |

Project Profile is the larger source of truth. Classification is one section inside Project Profile, not a competing system.

## Bid Package Data

Future entities:

| Entity | Purpose |
| --- | --- |
| ProjectBidPackage | Project-specific trade/bid package that estimators review, invite, level, and carry into estimate review. |
| BidPackageCsiTag | CSI item attached to a bid package with role and version metadata. |
| BidPackageTradeSpecialization | Trade taxonomy node/specialization assigned to the package. |
| BidPackageReview | Estimator review state and package-specific intensity/default override decisions. |
| BidPackageClarification | Package-specific clarification requested or carried forward. |
| BidPackageExclusion | Package-specific exclusion. |
| BidPackageRequestedAlternate | Alternate requested from bidders. |
| BidPackageRequestedAllowance | Allowance requested from bidders. |
| BidPackageRequestedUnitPrice | Unit price requested from bidders. |

Rules:

- Bid Package owns the scope.
- CSI tags classify package scope.
- CSI tag roles are `CORE`, `OPTIONAL`, `POSSIBLE`, or `EXCLUDED`.
- Package-level finish, work, demo, MEP coordination, low-voltage, and specialty intensity belong in `BidPackageReview`.
- Project-level assumptions may seed package defaults, but package review is the final source of truth before ITB.

## Invite / Correspondence Data

Future entities:

| Entity | Purpose |
| --- | --- |
| ProjectInviteRecipient | Contact-level ITB recipient tied to project, bid package, subcontractor, and contact/email. |
| ProjectInviteSendBatch | Batch send operation for one or more packages/recipients. |
| ProjectInviteSendLog | Per-recipient send/resend outcome and error history. |
| ProjectRfi | RFI record tied to project, package, subcontractor/contact, and responses. |
| ProjectRfiDistribution | RFI distribution list and send tracking. |
| ProjectAddendum | Addendum metadata and package/recipient distribution. |
| ProjectMessageThread | Threaded project correspondence for ITBs, RFIs, addenda, and bid follow-up. |

Invite recipients are tied to bid packages and contacts. A subcontractor can receive different package invites through different contacts.

## Bid Data

Future entities:

| Entity | Purpose |
| --- | --- |
| BidSubmission | Raw submitted bid from a subcontractor/contact for a project and one or more bid packages. |
| BidSubmissionAttachment | Source bid document metadata and file references. |
| BidPricingItem | Base bid, alternates, allowances, unit prices, fees, taxes, bonds, contingencies, and other pricing rows. |
| BidClarification | Submitted or estimator-normalized clarification. |
| BidExclusion | Submitted or estimator-normalized exclusion. |
| BidScopeCoverage | Bidder-stated scope coverage against bid package CSI tags and scope rows. |
| BidPackageCoverageComparison | Matrix-ready comparison of bids against package scope requirements. |

Submitted bid data must remain separate from estimator leveling decisions. Raw submitted pricing is not overwritten by leveled pricing.

## Bid Leveling / Estimate Review

Future entities:

| Entity | Purpose |
| --- | --- |
| BidLevelingDecision | Estimator decision record for a bid submission/package scope group. |
| SelectedBid | Winning/selected bid carried forward into estimate review. |
| LevelingAdjustment | Leveling add/deduct or normalization item. |
| EstimateReview | Project financial review sheet that compiles selected bids, markups, GC costs, clarifications, exclusions, and proposal-ready notes. |
| EstimateReviewLineItem | Trade/package/subcontractor financial line. |
| GeneralConditionsLineItem | General Conditions or project requirements cost line. |
| FeeInsuranceTaxBondLineItem | Fee, insurance, tax, bond, and markup line. |
| EstimateClarification | Clarification carried in estimate review and optionally into proposal. |
| EstimateExclusion | Exclusion carried in estimate review and optionally into proposal. |

Selected bids feed Estimate Review. Estimate Review is the central financial compilation surface before proposal output.

## Proposal Output

Future entities:

| Entity | Purpose |
| --- | --- |
| Proposal | Client-facing proposal output record generated from estimate review. |
| ProposalSection | Structured proposal section such as scope, pricing, clarifications, exclusions, alternates, schedule, or assumptions. |
| ProposalClarification | Proposal-facing clarification. |
| ProposalExclusion | Proposal-facing exclusion. |
| ProposalAlternate | Proposal-facing alternate. |
| ProposalAttachment | Proposal attachment metadata and file reference. |

Proposal output is downstream of Estimate Review. Proposal generation should not become the source of truth for bids, package scope, or leveling.

## Relationship Rules

- Company has many users, projects, subcontractor companies, company settings, and company overrides.
- Company has many subcontractors.
- Subcontractor has many locations and contacts.
- Subcontractor contacts are first-class records.
- Subcontractor has CSI coverage in one or both MasterFormat versions.
- Equivalent subcontractor CSI coverage is derived from the CSI crosswalk when reliable.
- Project has one selected CSI version.
- Project has one Project Profile.
- Project Profile includes classification, global attributes, logistics, procurement, and package default assumptions.
- Project has many documents and events.
- Project has many bid packages.
- Bid package has CSI tags.
- Bid package has trade specializations and package review data.
- Invite recipients are tied to projects, bid packages, subcontractors, and contacts.
- Bids are tied to projects, bid packages, subcontractors, and contacts.
- Bid submissions preserve raw submitted data.
- Bid leveling decisions preserve estimator normalization separately from raw bids.
- Selected bids feed Estimate Review.
- Estimate Review feeds Proposal.

## Storage Principle

- System defaults are source-controlled seed data.
- Company overrides belong in the database.
- Project overrides belong in the database.
- Company bid package templates belong in the database after customization.
- Project bid packages belong in the database.
- Project bids, invites, leveling decisions, estimate reviews, and proposals belong in the database.
- Mock/localStorage data is temporary and not a design constraint.

## Migration Guidance

LocalStorage and mock records may inform initial data shape but must not constrain the durable schema.

When this model is implemented:

1. Keep canonical IDs source-rule aligned.
2. Preserve raw submitted data separately from review/leveling decisions.
3. Preserve company defaults separately from company overrides.
4. Preserve project overrides separately from system and company rules.
5. Store explanation trails for visibility, CSI mapping, invite recipient generation, and leveling decisions.
