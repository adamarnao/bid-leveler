/* eslint-disable @typescript-eslint/no-require-imports */

const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

const workbookPath = path.join(
  __dirname,
  "..",
  "data-import",
  "1995_to_2012_CSI_Code_conversion.xlsx"
);
const dataDir = path.join(__dirname, "..", "src", "data");

const versionConfig = {
  MASTERFORMAT_1995: {
    prefix: "1995",
    sectionHeader: "1995 SECTION",
    titleHeader: "1995 TITLE",
    levelHeader: "1995 LEVEL",
  },
  MASTERFORMAT_CURRENT: {
    prefix: "current",
    sectionHeader: "2012 SECTION",
    titleHeader: "2012 TITLE",
    levelHeader: "2012 LEVEL",
  },
};

const workbook = XLSX.readFile(workbookPath, { cellDates: false });
const sheetNames = workbook.SheetNames;
const catalog1995SheetName = findSheetName(/1995/i, /number|title/i);
const catalogCurrentSheetName = findSheetName(/2012/i, /number|title/i);
const crosswalkSheetName = findSheetName(/1995/i, /2012|transition|crosswalk/i);

if (!catalog1995SheetName || !catalogCurrentSheetName || !crosswalkSheetName) {
  throw new Error(
    `Unable to detect required CSI sheets. Found: ${sheetNames.join(", ")}`
  );
}

const catalog1995Rows = readSheetRows(catalog1995SheetName);
const catalogCurrentRows = readSheetRows(catalogCurrentSheetName);
const crosswalkRows = readSheetRows(crosswalkSheetName);

const catalog1995 = buildCatalog(
  catalog1995Rows,
  "MASTERFORMAT_1995",
  versionConfig.MASTERFORMAT_1995
);
const catalogCurrent = buildCatalog(
  catalogCurrentRows,
  "MASTERFORMAT_CURRENT",
  versionConfig.MASTERFORMAT_CURRENT
);
const crosswalkEntries = buildCrosswalkEntries(crosswalkRows);

writeTypeScriptDataFile(
  path.join(dataDir, "csiCatalog1995.ts"),
  'import { CsiCatalogItem } from "@/types/Csi";',
  "csiCatalog1995",
  "CsiCatalogItem[]",
  catalog1995
);
writeTypeScriptDataFile(
  path.join(dataDir, "csiCatalogCurrent.ts"),
  'import { CsiCatalogItem } from "@/types/Csi";',
  "csiCatalogCurrent",
  "CsiCatalogItem[]",
  catalogCurrent
);
writeTypeScriptDataFile(
  path.join(dataDir, "csiCrosswalk.ts"),
  'import { CsiCrosswalkEntry } from "@/types/CsiCrosswalk";',
  "csiCrosswalkEntries",
  "CsiCrosswalkEntry[]",
  crosswalkEntries
);

console.log(`Generated ${catalog1995.length} 1995 CSI catalog items.`);
console.log(`Generated ${catalogCurrent.length} current CSI catalog items.`);
console.log(`Generated ${crosswalkEntries.length} CSI crosswalk entries.`);
console.log(
  `Generated ${countDivisions(catalog1995)} 1995 divisions and ${countDivisions(
    catalogCurrent
  )} current divisions.`
);

function findSheetName(...patterns) {
  return sheetNames.find((sheetName) =>
    patterns.every((pattern) => pattern.test(sheetName))
  );
}

function readSheetRows(sheetName) {
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: "",
    raw: false,
  });
  const [headerRow, ...recordRows] = rows;
  const headerIndex = new Map(
    headerRow.map((header, index) => [normalizeHeader(header), index])
  );

  return recordRows
    .filter((row) => row.some((value) => normalizeText(value)))
    .map((row) => ({ row, headerIndex }));
}

function buildCatalog(rows, version, config) {
  const items = [];
  const itemIds = new Set();
  const hierarchyStack = [];

  rows.forEach(({ row, headerIndex }, rowIndex) => {
    const sectionNumber = normalizeSection(
      row[headerIndex.get(normalizeHeader(config.sectionHeader))]
    );
    const title = normalizeNullableText(
      row[headerIndex.get(normalizeHeader(config.titleHeader))]
    );
    const level = normalizeLevel(row[headerIndex.get(normalizeHeader(config.levelHeader))]);

    if (!sectionNumber || !title || level === null) return;

    while (
      hierarchyStack.length > 0 &&
      hierarchyStack[hierarchyStack.length - 1].level >= level
    ) {
      hierarchyStack.pop();
    }

    const id = getCatalogItemId(version, sectionNumber);
    const parentId = hierarchyStack[hierarchyStack.length - 1]?.id;
    const item = {
      id,
      version,
      number: sectionNumber,
      name: title,
      level,
      divisionId: getDivisionIdFromSectionNumber(version, sectionNumber),
      ...(parentId ? { parentId } : {}),
      sortOrder: rowIndex,
    };

    if (!itemIds.has(id)) {
      itemIds.add(id);
      items.push(item);
    }

    hierarchyStack.push(item);
  });

  return items;
}

function buildCrosswalkEntries(rows) {
  const parsedRows = rows
    .map(({ row, headerIndex }) => ({
      sourceSectionNumber: normalizeSection(
        row[headerIndex.get(normalizeHeader("1995 SECTION"))]
      ),
      sourceTitle: normalizeNullableText(
        row[headerIndex.get(normalizeHeader("1995 TITLE"))]
      ),
      sourceLevel: normalizeLevel(row[headerIndex.get(normalizeHeader("1995 LEVEL"))]),
      targetSectionNumber: normalizeSection(
        row[headerIndex.get(normalizeHeader("2012 SECTION"))]
      ),
      targetTitle: normalizeNullableText(
        row[headerIndex.get(normalizeHeader("2012 TITLE"))]
      ),
      targetLevel: normalizeLevel(row[headerIndex.get(normalizeHeader("2012 LEVEL"))]),
    }))
    .filter(
      (row) =>
        row.sourceSectionNumber ||
        row.sourceTitle ||
        row.targetSectionNumber ||
        row.targetTitle
    );
  const sourceToTargets = new Map();
  const targetToSources = new Map();

  parsedRows.forEach((row) => {
    addToSetMap(sourceToTargets, row.sourceSectionNumber, row.targetSectionNumber);
    addToSetMap(targetToSources, row.targetSectionNumber, row.sourceSectionNumber);
  });

  return parsedRows.map((row, index) => {
    const relationship = getRelationship(row, sourceToTargets, targetToSources);

    return {
      id: `csi-crosswalk-${String(index + 1).padStart(4, "0")}`,
      sourceVersion: "MASTERFORMAT_1995",
      targetVersion: "MASTERFORMAT_CURRENT",
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
}

function writeTypeScriptDataFile(outputPath, importLine, exportName, typeName, value) {
  const output = `${importLine}\n\nexport const ${exportName}: ${typeName} = ${JSON.stringify(
    value,
    null,
    2
  )};\n`;

  fs.writeFileSync(outputPath, output);
}

function normalizeHeader(value) {
  return normalizeText(value).toUpperCase();
}

function normalizeText(value) {
  return String(value ?? "")
    .replace(/^\uFEFF/, "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeNullableText(value) {
  return normalizeText(value) || null;
}

function normalizeSection(value) {
  return normalizeText(value) || null;
}

function normalizeLevel(value) {
  const normalizedValue = normalizeText(value);

  if (!normalizedValue) return null;

  const numericLevel = Number(normalizedValue);

  return Number.isNaN(numericLevel) ? null : numericLevel;
}

function getCatalogItemId(version, sectionNumber) {
  const prefix = version === "MASTERFORMAT_1995" ? "1995" : "current";
  const normalizedNumber = normalizeSection(sectionNumber);

  if (version === "MASTERFORMAT_1995") return `${prefix}-${normalizedNumber}`;

  return `${prefix}-${normalizedNumber.replace(/\s+/g, "-").replace(/\./g, "-")}`;
}

function getDivisionIdFromSectionNumber(version, sectionNumber) {
  const prefix = version === "MASTERFORMAT_1995" ? "1995" : "current";
  const divisionNumber = normalizeSection(sectionNumber).slice(0, 2);

  return `${prefix}-${divisionNumber}`;
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

function countDivisions(items) {
  return new Set(items.map((item) => item.divisionId)).size;
}
