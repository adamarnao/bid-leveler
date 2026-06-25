/* eslint-disable @typescript-eslint/no-require-imports */

const fs = require("fs");
const path = require("path");

const inputPath = path.join(__dirname, "..", "data-import", "csi-crosswalk.csv");
const outputPath = path.join(__dirname, "..", "src", "data", "csiCrosswalk.ts");

const csv = fs.readFileSync(inputPath, "utf8");
const rows = parseCsv(csv);
const [header, ...records] = rows;
const headerIndex = new Map(
  header.map((name, index) => [normalizeHeaderName(name), index])
);

const parsedRows = records
  .filter((row) => row.some((value) => normalizeText(value)))
  .map((row) => ({
    sourceSectionNumber: normalizeSection(row[headerIndex.get("1995 SECTION")]),
    sourceTitle: normalizeNullableText(row[headerIndex.get("1995 TITLE")]),
    sourceLevel: normalizeLevel(row[headerIndex.get("1995 LEVEL")]),
    targetSectionNumber: normalizeSection(row[headerIndex.get("2004 SECTION")]),
    targetTitle: normalizeNullableText(row[headerIndex.get("2004 TITLE")]),
    targetLevel: normalizeLevel(row[headerIndex.get("2004 LEVEL")]),
  }));

const sourceToTargets = new Map();
const targetToSources = new Map();

for (const row of parsedRows) {
  addToSetMap(sourceToTargets, row.sourceSectionNumber, row.targetSectionNumber);
  addToSetMap(targetToSources, row.targetSectionNumber, row.sourceSectionNumber);
}

const entries = parsedRows.map((row, index) => {
  const relationship = getRelationship(row, sourceToTargets, targetToSources);

  return {
    id: `csi-crosswalk-${String(index + 1).padStart(4, "0")}`,
    sourceVersion: "MASTERFORMAT_1995",
    targetVersion: "MASTERFORMAT_2004_PLUS",
    sourceSection: {
      sectionNumber: row.sourceSectionNumber,
      title: row.sourceTitle,
      level: row.sourceLevel,
    },
    targetSection: {
      sectionNumber: row.targetSectionNumber,
      title: row.targetTitle,
      level: row.targetLevel,
    },
    relationship,
    mappingConfidence: getMappingConfidence(row, relationship),
  };
});

const output = `import { CsiCrosswalkEntry } from "@/types/CsiCrosswalk";

export const csiCrosswalkEntries: CsiCrosswalkEntry[] = ${JSON.stringify(
  entries,
  null,
  2
)};
`;

fs.writeFileSync(outputPath, output);
console.log(`Generated ${entries.length} entries at ${outputPath}`);

function parseCsv(value) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    const nextChar = value[index + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      field += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") index += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  if (field || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

function normalizeText(value) {
  return String(value ?? "")
    .replace(/^\uFEFF/, "")
    .replace(/\u00a0/g, " ")
    .trim();
}

function normalizeHeaderName(value) {
  return normalizeText(value).toUpperCase();
}

function normalizeNullableText(value) {
  const normalizedValue = normalizeText(value);

  return normalizedValue || null;
}

function normalizeSection(value) {
  const normalizedValue = normalizeText(value);

  return normalizedValue || null;
}

function normalizeLevel(value) {
  const normalizedValue = normalizeText(value);

  if (!normalizedValue) return null;

  const numericLevel = Number(normalizedValue);

  return Number.isNaN(numericLevel) ? null : numericLevel;
}

function addToSetMap(map, key, value) {
  if (!key || !value) return;

  const values = map.get(key) ?? new Set();

  values.add(value);
  map.set(key, values);
}

function getRelationship(row, sourceToTargets, targetToSources) {
  if (!row.sourceSectionNumber || !row.targetSectionNumber) return "INCOMPLETE";

  const targetCount = sourceToTargets.get(row.sourceSectionNumber)?.size ?? 0;
  const sourceCount = targetToSources.get(row.targetSectionNumber)?.size ?? 0;

  if (targetCount === 1 && sourceCount === 1) return "ONE_TO_ONE";
  if (targetCount > 1 && sourceCount === 1) return "ONE_TO_MANY";
  if (targetCount === 1 && sourceCount > 1) return "MANY_TO_ONE";
  if (targetCount > 1 && sourceCount > 1) return "MANY_TO_MANY";

  return "INCOMPLETE";
}

function getMappingConfidence(row, relationship) {
  if (relationship === "INCOMPLETE") return "INCOMPLETE";

  const hasSpecialCaseData =
    row.sourceLevel === null ||
    row.targetLevel === null ||
    !row.sourceTitle ||
    !row.targetTitle ||
    startsWithSee(row.sourceTitle) ||
    startsWithSee(row.targetTitle);

  if (hasSpecialCaseData || relationship === "MANY_TO_MANY") {
    return "SPECIAL_CASE";
  }

  if (relationship === "ONE_TO_ONE") return "DIRECT";

  return "EXPANDED";
}

function startsWithSee(value) {
  return /^see\b/i.test(value ?? "");
}
