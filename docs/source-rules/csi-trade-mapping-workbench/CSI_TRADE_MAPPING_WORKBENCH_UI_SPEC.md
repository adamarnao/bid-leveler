\# CSI Trade Mapping Workbench UI Spec



\## Purpose



The CSI Trade Mapping Workbench is a developer/admin data inspection console for reviewing:



1\. CSI crosswalk relationships between MasterFormat 1995 / 16-Division and MasterFormat 2004+ / 50-Division.

2\. CSI-to-trade assignment logic.

3\. Trade-to-CSI mapping coverage.

4\. Mapping gaps, ambiguous relationships, and weak rule coverage.

5\. Fixture/test scenario behavior.



This page is not a production estimating workflow. It is not a normal project setup form. It is not a fixture demo.



The workbench should help answer:



\* What does this 1995 CSI item map to in 2004+?

\* What does this 2004+ CSI item map to in 1995?

\* Is the crosswalk one-to-one, one-to-many, many-to-one, many-to-many, or unmapped?

\* What trade/specialization does this CSI item feed?

\* Which CSI items feed a selected trade/specialization?

\* Which mappings are clean, ambiguous, weak, or missing?

\* Which system mapping rules need correction?



\## Core design principle



This is a data inspection console.



The main workflow is:



Find item → inspect relationship → see explanation/warnings → identify gap → decide correction.



Use:



\* tabbed navigation

\* side-by-side inspectors

\* canonical selectors

\* dense tables for mapping lists

\* compact detail cards for selected items

\* explanation trails

\* clear warnings only where review is needed



Do not use:



\* freeform identity fields

\* fixture-first layout

\* button walls

\* giant scattered cards

\* mock-only data as the main interaction model

\* confidence percentages



\## Canonical selector rule



For identity fields such as CSI item, trade, specialization, subcontractor, contact, facility type, context tag, and bid package template:



\* User may type freely to search.

\* System shows canonical options.

\* User must select a canonical option.

\* Selected value must be the canonical ID/object.

\* The typed search text must not become the saved/selected identity.



Freeform text is acceptable only for notes, explanations, clarifications, exclusions, custom labels, email text, or draft comments.



\## Required tab structure



The workbench must use these tabs:



1\. Crosswalk Explorer

2\. CSI → Trade

3\. Trade → CSI

4\. Coverage / Gaps

5\. Test Scenarios



Header copy:



“Inspect CSI crosswalks, trade mappings, assignment logic, and mapping coverage gaps.”



Visible note:



“System mapping rules are read-only here for now. Future versions should support controlled system rule drafts, company overrides, and project overrides.”



\## Terminology



Use:



\* MasterFormat 1995 / 16-Division

\* MasterFormat 2004+ / 50-Division

\* MASTERFORMAT\_1995

\* MASTERFORMAT\_2004\_PLUS



Do not use:



\* MASTERFORMAT\_CURRENT

\* current MasterFormat

\* current project as a fixture label



\---



\# Tab 1: Crosswalk Explorer



\## Purpose



Inspect how MasterFormat 1995 / 16-Division items map to MasterFormat 2004+ / 50-Division items, and vice versa.



This tab is about CSI version conversion only. It should not primarily be about trades.



\## Layout



Use a side-by-side panel layout.



Left panel:



\* source version / direction control

\* search/filter controls

\* source CSI catalog/results list

\* grouped by division when practical

\* clicking a source CSI item selects it



Right panel:



\* mapped target CSI code(s) for the selected source item

\* grouped by relationship bucket when possible

\* target code, title, version, and division

\* no freeform target search box as the primary interaction



Bottom/detail panel:



\* selected source item details

\* mapped target item details

\* cardinality

\* relationship type

\* review status

\* source basis

\* notes/warnings

\* trade impact preview if existing CSI-to-trade logic can safely provide it



\## Direction



The user must be able to flip direction:



\* 1995 → 2004+

\* 2004+ → 1995



When direction is 1995 → 2004+, selecting a 1995 CSI item on the left shows linked 2004+ CSI item(s) on the right.



When direction is 2004+ → 1995, selecting a 2004+ CSI item on the left shows linked 1995 CSI item(s) on the right.



\## Top filters



Crosswalk Explorer should include:



\* Direction toggle

\* Search by CSI code/title

\* Division filter

\* Cardinality filter

\* Relationship type filter

\* Review status filter



Cardinality filter values:



\* All

\* One-to-one

\* One-to-many

\* Many-to-one

\* Many-to-many

\* No match



Relationship type filter values:



\* All

\* Direct Equivalent

\* Broader Than Target

\* Narrower Than Target

\* Split Into Multiple Codes

\* Consolidated From Multiple Codes

\* Related / Operational Match

\* No Clear Match



Review status filter values:



\* All

\* Clean

\* Needs Review

\* Ambiguous

\* Unmapped



\## Crosswalk language



Avoid using “confidence” as the primary Crosswalk Explorer language.



For crosswalks use:



\* Relationship Type

\* Cardinality

\* Review Status

\* Source Basis

\* Notes / Warnings



Do not lead with:



\* confidence percentage

\* vague AI confidence score



Acceptable review status values:



\* Clean

\* Needs Review

\* Ambiguous

\* Unmapped



Acceptable cardinality values:



\* One-to-one

\* One-to-many

\* Many-to-one

\* Many-to-many

\* No match



\## Relationship grouping



The right-side mapped result panel should group linked codes by relationship bucket when possible:



\* Direct / Primary

\* Split / Related

\* Consolidated

\* Needs Review

\* No Clear Match



Example:



Selected source:



09250 — Gypsum Board



Mapped 2004+ result:



Direct / Primary:



\* 09 29 00 — Gypsum Board



Related / Supporting:



\* 09 22 16 — Non-Structural Metal Framing



Bottom detail:



\* Cardinality: One-to-many

\* Relationship Type: Split Into Multiple Codes / Related Operational Match

\* Review Status: Clean or Needs Review

\* Source Basis: Derived from crosswalk data

\* Notes: Legacy gypsum board scope may include modern gypsum board and framing-related items depending project scope.



\## Derived fields



If existing crosswalk data does not explicitly include relationship type, cardinality, or review status:



\* derive cardinality from source/target link counts where possible

\* derive conservative relationship/review status where possible

\* clearly label derived fields as derived

\* do not invent authoritative relationships not present in the data



\## Crosswalk table mode



Crosswalk Explorer should include a compact table mode in addition to the side-by-side inspector.



Table columns:



\* Source Code

\* Source Title

\* Target Code(s)

\* Cardinality

\* Relationship Type

\* Review Status



Clicking a row should load that source item into the side-by-side inspector.



\---



\# Tab 2: CSI → Trade



\## Purpose



Pick a canonical CSI item and inspect which trade/specialization/package logic it maps to.



This tab answers:



“What operational trade package does this CSI scope belong to?”



\## Layout



Use an inspector layout:



Top/left:



\* MasterFormat version dropdown

\* canonical CSI item searchable selector



Main detail:



\* selected CSI detail card

\* trade assignment card

\* assignment source

\* match strength / review status

\* explanation trail

\* alternate trades

\* warnings

\* crosswalk equivalent if available



\## Required displayed fields



For selected CSI item show:



\* CSI code

\* CSI title

\* MasterFormat version

\* division

\* parent path if available



For trade assignment show:



\* default trade

\* specialization if available

\* package role if available

\* assignment source

\* match strength

\* review status

\* reason/explanation

\* alternate trades

\* warnings

\* crosswalk equivalent



\## Assignment source language



Use source-oriented language instead of vague confidence percentages.



Examples:



\* Exact CSI rule

\* Exact crosswalk-derived rule

\* Code pattern rule

\* Title keyword rule

\* Manual/company override

\* Project override

\* No rule found



\## Match strength language



Discrete values only:



\* Strong

\* Moderate

\* Weak

\* Needs Review



Avoid percentages.



\## Ambiguous examples



For fire alarm-like cases, the UI should show:



\* Default Assignment: Low Voltage / Technology, Electrical, or Fire Protection depending current rule

\* Possible Trades: Electrical, Fire Protection, Low Voltage / Technology

\* Match Strength: Moderate or Weak

\* Review Status: Needs Review

\* Reason: Fire alarm may be bought under different trades depending company practice and project requirements.

\* Recommended Action: Review company default or project-specific override.



\---



\# Tab 3: Trade → CSI



\## Purpose



Pick a canonical trade/specialization and inspect which CSI items and rules feed into it.



This tab answers:



“Does this trade have enough CSI mapping coverage?”



\## Layout



Top controls:



\* canonical trade selector

\* specialization selector

\* MasterFormat version selector



Main content:



\* selected trade/specialization detail card

\* exact CSI mappings table

\* code pattern rules table

\* keyword rules table/list

\* crosswalk support section

\* weak coverage warning if no direct rules exist



\## Required sections



Exact Mappings table:



\* CSI Code

\* CSI Title

\* MasterFormat Version

\* Division

\* Specialization

\* Rule Source

\* Review Status



Pattern Rules table:



\* Pattern

\* Applies To

\* Trade

\* Specialization

\* Match Strength

\* Notes



Keyword Rules table/list:



\* Keyword

\* Applies To

\* Trade

\* Specialization

\* Match Strength

\* Notes



Weak coverage state:



If a trade has no exact rules and only weak/pattern/keyword rules, show:



“Coverage status: Weak. Add exact CSI mapping rules before relying on automatic package generation.”



If a trade has no rules, show:



“Coverage status: Unmapped. This trade currently has no direct CSI mapping rules.”



\---



\# Tab 4: Coverage / Gaps



\## Purpose



Show the health of the mapping system.



This tab answers:



“What still needs work?”



\## Layout



Use summary metric cards plus dense tables.



Summary cards should include when data supports them:



\* 2004+ CSI items

\* 2004+ mapped directly

\* 2004+ unmapped

\* 1995 CSI items

\* 1995 mapped directly

\* 1995 mapped by crosswalk

\* 1995 unmapped

\* trades with no direct rules

\* ambiguous mappings

\* weak/low-strength mappings



Tables:



1\. Unmapped CSI Items

2\. Trades With Weak Mapping

3\. Ambiguous Mappings

4\. Low-Strength / Review Required Mappings



\## Unmapped CSI Items table



Columns:



\* MasterFormat

\* Code

\* Title

\* Division

\* Suggested Action



\## Trades With Weak Mapping table



Columns:



\* Trade

\* Exact Rules

\* Pattern Rules

\* Keyword Rules

\* Coverage Status

\* Suggested Action



\## Ambiguous Mappings table



Columns:



\* CSI Item

\* Default Trade

\* Possible Trades

\* Reason

\* Suggested Action



\## Low-Strength Mapping table



Columns:



\* CSI Item

\* Assigned Trade

\* Assignment Source

\* Match Strength

\* Review Status

\* Suggested Action



\---



\# Tab 5: Test Scenarios



\## Purpose



Verify known expected behavior.



Fixtures are tests, not the main workbench.



\## Layout



Use a test-result-oriented layout:



\* scenario selector/table

\* expected result

\* actual result

\* pass/review/fail status

\* explanation



\## Scenario label style



Do not use vague labels such as:



\* current project

\* current MasterFormat

\* current gypsum board coverage



Use explicit labels:



\* Gypsum Board — same-version direct match

\* Gypsum Board — crosswalk match from 1995 to 2004+

\* Fire Alarm — ambiguous trade assignment

\* Insulation — possible cross-trade ambiguity



Each scenario should display:



\* Project MasterFormat

\* Subcontractor Coverage MasterFormat, if relevant

\* Input CSI Item

\* Expected Assignment

\* Actual Assignment

\* Expected Source

\* Actual Source

\* Result: Pass / Review / Fail

\* Reason



Example:



Scenario:

Gypsum Board — same-version direct match



Project MasterFormat:

MasterFormat 2004+ / 50-Division



Subcontractor Coverage:

MasterFormat 2004+ / 50-Division



Expected:

Direct strong match to Drywall / Framing > Gypsum Board



Actual:

Direct strong match to Drywall / Framing > Gypsum Board



Result:

Pass



\---



\# Visual design rules



\## Use tables for dense inspection data



Use tables for:



\* crosswalk rows

\* mapped CSI rules

\* unmapped items

\* weak trade coverage

\* ambiguous mappings

\* fixture/test scenario lists



\## Use cards for selected item detail



Use cards for:



\* selected CSI item

\* selected trade/specialization

\* assignment result

\* warning/explanation panel



\## Use badges sparingly



Badges are only for:



\* Review Status

\* Relationship Type

\* Cardinality

\* Assignment Source

\* Match Strength

\* Warning state



Do not badge every metadata label.



\## Use explanation trails



Every mapping result should show:



\* why this result happened

\* what rule was used

\* whether crosswalk was involved

\* whether estimator/admin review is needed



\## Separate warnings from normal metadata



Warnings should be visually separate from ordinary details.



Normal exact mapping should look clean.



Ambiguous, unmapped, or weak mapping should look like review-required information.



\---



\# Data-source rules



The workbench must use:



\* full CSI catalogs

\* full CSI crosswalk

\* full trade taxonomy

\* full CSI-to-trade mapping rule library



Fixtures are only test cases.



Mental model:



\* CSI catalogs = source universe

\* trade taxonomy = target universe

\* mapping rules = relationship layer

\* fixtures = tests



\---



\# Future editing model



System mapping rules are read-only for now.



Later, this workbench should support:



1\. Controlled system rule drafts

2\. Company overrides

3\. Project overrides



Do not mix these concepts.



\## Future system rule editor



Should eventually support:



\* edit rule draft

\* preview impact

\* validate against fixtures

\* export/generated source change

\* commit after review



\## Future company/project override editor



Should eventually support:



\* company default override

\* project-specific override

\* database persistence

\* audit trail



For now, if edit affordances are shown, they should be clearly labeled as draft/preview only and should not pretend to save production data.



\---



\# Phase 1 implementation target



Phase 1 should implement:



1\. Workbench tabbed shell

2\. Crosswalk Explorer side-by-side layout

3\. Canonical CSI selection pattern

4\. Crosswalk filters

5\. Crosswalk table mode

6\. Basic scaffolds for remaining tabs

7\. Fixtures demoted to Test Scenarios



Phase 1 should not attempt to fully finish every tab.



Success criteria:



\* Page is no longer fixture-first.

\* Crosswalk Explorer is side-by-side.

\* Selecting a source CSI item on the left shows linked target CSI code(s) on the right.

\* Direction can flip 1995 → 2004+ and 2004+ → 1995.

\* Search/filter controls do not create freeform selected identity.

\* Cardinality filter exists.

\* Crosswalk language uses relationship type, cardinality, review status, and source basis instead of confidence-first language.

\* Test scenarios are clearly secondary.

\* No `MASTERFORMAT\_CURRENT` references exist.



\---



\# Validation



Run:



npm run lint



npx tsc --noEmit --incremental false



Manual check:



Open `/dev/csi-trade-mapping`.



Verify:



1\. Page has five required tabs.

2\. Crosswalk Explorer is side-by-side.

3\. Selecting a 1995 CSI item shows linked 2004+ CSI code(s).

4\. Direction can flip to 2004+ → 1995.

5\. Search/filter controls do not create freeform selected identity.

6\. Cardinality filter exists.

7\. Fixtures are demoted to Test Scenarios.

8\. Exact clean crosswalks do not show vague low confidence warnings.

9\. No `MASTERFORMAT\_CURRENT` references exist.



Report:



\* changed files

\* new/updated components

\* crosswalk explorer behavior

\* available filters

\* fields derived vs sourced

\* validation results

\* known limitations



