# Bid-Leveler Agent Instructions

These are standing instructions for Codex agents working in this repository.

## Operating Mode

- Prefer small, scoped, reviewable changes.
- Do not modify unrelated files.
- Do not modify `package.json` or add dependencies unless explicitly requested.
- Do not change runtime app behavior when the task is documentation, source rules, data modeling, or verification only.
- If a task is audit-only or planning-only, do not edit files.
- If a task is docs/source-rules only, do not modify `src`, routes, generated data, storage keys, or package configuration.
- Do not commit.
- Do not push.

## Verification Expectations

- After every task, confirm expected files were created or updated.
- Confirm whether runtime app files were modified.
- Run `npm run lint` when available.
- Run `npm run build` when available and appropriate.
- Fix failures caused by the current task.
- Do not fix unrelated pre-existing failures unless explicitly asked.
- End every task with this summary:

```text
Verification Summary:
- Files created/updated:
- Runtime files modified: yes/no
- npm run lint: passed/failed/not available
- npm run build: passed/failed/not available
- Unrelated issues detected: yes/no
- Ready to commit: yes/no
```

## CSI / MasterFormat Source Rules

- Raw PDFs, OCR PDFs, scanned files, Excel source files, and source experiments are evidence only.
- Runtime app code must consume normalized structured data, not raw source files.
- Maintain one normalized active catalog per supported MasterFormat version.
- Development CSI source files are temporary and must be replaceable with licensed production source material later.
- Production release must use properly licensed CSI / MasterFormat source material.
- The CSI data model must remain source-agnostic.
- Do not place raw PDFs, OCR experiments, scanned files, or licensed source documents in runtime app paths.
- The importer may be source-specific; app runtime behavior must be source-agnostic.

## CSI Catalog Normalization

Before changing CSI catalog logic, Codex must read:

`docs/source-rules/csi-catalog-normalization/CSI_CATALOG_NORMALIZATION_SPEC.md`

Catalog normalization rules:

- The normalized catalog is the runtime source of truth for canonical CSI records.
- Raw source files are development evidence, QA evidence, or licensed production source material, not runtime app dependencies.
- Metadata such as alternate terms, included topics, products, abbreviations, keyword index terms, and see references supports search and review.
- Metadata must not become fake canonical CSI records.
- Division 00 may be incomplete during development and should be marked as incomplete source, not faked.

## CSI Crosswalk Normalization

Before changing CSI crosswalk logic, Codex must read:

`docs/source-rules/csi-crosswalk-normalization/CSI_CROSSWALK_NORMALIZATION_SPEC.md`

Crosswalk rules:

- `CSI Crosswalk Excel.xlsx` is raw relationship evidence only.
- Preserve raw imported values.
- Add resolved values separately.
- Runtime app behavior must use resolved crosswalk records.
- Do not treat keyword index terms, included topics, alternate terms, products, or abbreviations as canonical CSI records.
- Do not use numeric confidence percentages for crosswalk relationships.
- Use `relationshipType`, `relationshipRole`, `cardinality`, `reviewStatus`, `issueType`, `sourceBasis`, `notes`, and warnings.
- For CSI-to-trade mapping, use match strength labels only: `strong`, `moderate`, `weak`, `needs_review`.

## Known Crosswalk Example

1995 `02775` - Sidewalks should resolve to `32 16 23` - Sidewalks.

The raw target `32 10 00` - Bases, Ballasts, and Paving is parent context only, not the final resolved target.

## Git / Scope Discipline

- Do not commit.
- Do not push.
- Do not revert user changes unless explicitly requested.
- Do not use destructive Git commands such as `git reset --hard` or `git checkout --` unless explicitly requested.
- Keep generated, runtime, and source-rule changes clearly separated.
- For source-rule work, update only the requested source-rule files unless the user asks for live integration.
- For live app work, preserve storage keys and existing user data unless the user explicitly requests a breaking change.
