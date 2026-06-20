# UX Interaction Standards

This document defines interaction and layout standards for the app. It should be used before adding new pages, controls, or workflow surfaces.

## Page Identity

One page should have one real title.

Avoid duplicate eyebrow/title pairs such as:

- Estimator Dashboard
- Dashboard

Use supporting copy for context instead of repeating the title.

Good pattern:

- Title: Dashboard
- Supporting copy: Today's bid activity, deadlines, and project health.

## Action Placement

### Primary Page Actions

The primary page action belongs in the page header right.

Examples:

- Dashboard: Create Project
- Subcontractor Library: Add Subcontractor
- Bids: Add Manual Bid
- Project Scope: Add Bid Package or Generate Bid Packages

### Section Actions

Section actions belong in the section header right.

Examples:

- Bid Packages section: Generate Bid Packages
- Recipient package section: Send Package ITB
- Bid list section: Add Manual Bid

### Row And Card Actions

Rows and cards should open the main object by default.

Common secondary actions such as edit, delete, archive, send, resend, restore, and remove should be icon buttons or overflow menu actions where practical.

Avoid turning every action into inline hyperlink text. Text links are acceptable for navigation inside copy or low-emphasis secondary routes, but common app actions should use buttons, icon buttons, or menus.

## Navigation Rules

- Project routes should use canonical labels: Project Command Center, Project Setup, Project Scope, Invites, Bids, Bid Leveling.
- Do not label Project Scope as Setup.
- Do not label Project Setup as Scope.
- Placeholder modules should be hidden from primary navigation until they are useful.
- If a page exists only to quarantine a future module, clearly state that it is a placeholder.

## Object Opening Rules

| Object | Preferred open behavior |
| --- | --- |
| Project card | Opens Project Command Center. |
| Bid Package card | Opens package edit/details or package-focused workflow. |
| Bid row/card | Opens bid detail/edit. |
| Invite recipient row | Opens inline details or recipient edit. |
| Subcontractor card | Opens subcontractor profile. |

## Action Controls

### Use Buttons For App Actions

Use buttons for:

- create
- save
- send
- archive
- restore
- delete
- generate
- apply
- cancel
- prune

### Use Icon Buttons Or Overflow Menus For Repeated Row Actions

Use icon buttons or overflow menus for repeated actions in rows/cards:

- edit
- delete
- archive
- send
- resend
- restore
- remove

Icon buttons must have accessible labels.

### Danger Actions

Danger actions require confirmation or menu separation.

Examples:

- Archive Project requires confirmation.
- Delete Permanently requires strong confirmation.
- Delete Bid should disclose that dependent leveling decisions are removed.
- Remove Invite Recipient should affect only the selected package unless explicitly stated.

Danger actions should not be the primary button unless the whole page is a destructive confirmation screen.

## Forms And Editing

Profile and detail pages should move toward editable sections rather than full-page edit for every change.

Preferred long-term pattern:

1. Profile page shows structured sections.
2. Each section has an edit action.
3. Editing opens inline controls, a modal, or a focused panel.
4. Save affects only that section.

Full-page edit remains acceptable for complex forms until section editing exists.

## Placeholder Rules

Placeholders should be hidden from primary nav unless they are important for orientation.

If a placeholder route remains accessible:

- use the real page title
- clearly state what will connect later
- do not show fake totals as real data
- provide links back to active workflows

Examples:

- Project Budget should explain future takeoffs, historical pricing, allowances, and bid totals.
- Project Proposal should explain future selected bids, clarifications, inclusions, exclusions, alternates, and contract requirements.

## Badge Rules

Badges must be stable, compact, and scannable.

Rules:

- No word wrapping.
- Adequate horizontal padding.
- Stable line height.
- Consistent uppercase treatment where used.
- Do not use badges for long explanations.
- Use color to support status, not as the only meaning.
- Provide accessible text or titles when using glyph-only status indicators.

Recommended status styles:

| Status | Visual rule |
| --- | --- |
| Complete | Green checked square or compact success badge. |
| Incomplete required | Red exclamation badge. |
| Partial / needs review | Amber question or amber dot badge. |
| Not started | Neutral gray hollow circle. |
| Draft | Neutral badge. |
| Sent | Success badge. |
| Failed | Danger badge. |
| Removed | Hidden from main list or muted if shown in audit context. |

## Tables And Matrices

Tables and matrices should be dense but legible.

Rules:

- Keep row headers stable.
- Prefer sticky first column for comparison matrices when practical.
- Use horizontal scroll instead of compressing important values.
- Keep status chips short.
- Empty cells should show a dash or Unknown, not blank ambiguity.
- Repeated row actions should use icon buttons or a compact action menu.

## Modals And Drawers

Use modals for focused create/edit tasks where context should not be lost.

Use side panels/drawers for comparison/detail workflows where the user benefits from keeping the matrix or list visible.

Modal and drawer actions should follow this order:

1. Primary save/apply/send action
2. Secondary cancel/back action
3. Danger action separated visually or placed in an overflow menu

## Checkbox And Toggle Rules

Use checkboxes for multi-select behavior.

Examples:

- selecting multiple CSI scopes
- assigning multiple CSI tags to a Bid Package
- selecting scopes covered by a bid

Use toggles for binary on/off settings when the setting is not part of a multi-select list.

Examples:

- enable notification setting
- include archived items
- show possible matches

## Copy Rules

- Prefer direct product terms: Bid Package, CSI tag, Invite recipient, Bid, Leveling.
- Use ITB when referring to invite-to-bid readiness and launch.
- Avoid describing unfinished behavior as complete.
- Avoid "smart" labels when the action is simple. Use Generate, Save, Send, Archive, Restore, Delete.

