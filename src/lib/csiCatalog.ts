import { csiCatalog1995 } from "@/data/csiCatalog1995";
import { csiCatalogCurrent } from "@/data/csiCatalogCurrent";
import {
  CsiCatalogItem,
  CsiDivision,
  CsiMasterFormatVersion,
  CsiSection,
} from "@/types/Csi";

type CsiCatalogIndex = {
  catalog: CsiCatalogItem[];
  itemById: Map<string, CsiCatalogItem>;
  itemByNormalizedNumber: Map<string, CsiCatalogItem>;
  itemByCompactNumber: Map<string, CsiCatalogItem>;
  itemByLegacyAlias: Map<string, CsiCatalogItem>;
  divisionIds: string[];
  divisionItemByDivisionId: Map<string, CsiCatalogItem>;
  sectionsByDivisionId: Map<string, CsiSection[]>;
};

const divisionNameFallbacks: Record<string, string> = {
  "1995-00": "Procurement and Contracting Requirements",
  "1995-01": "General Requirements",
  "1995-02": "Site Construction",
  "1995-03": "Concrete",
  "1995-04": "Masonry",
  "1995-05": "Metals",
  "1995-06": "Wood and Plastics",
  "1995-07": "Thermal and Moisture Protection",
  "1995-08": "Doors and Windows",
  "1995-09": "Finishes",
  "1995-10": "Specialties",
  "1995-11": "Equipment",
  "1995-12": "Furnishings",
  "1995-13": "Special Construction",
  "1995-14": "Conveying Systems",
  "1995-15": "Mechanical",
  "1995-16": "Electrical",
};

const catalogByVersion: Record<CsiMasterFormatVersion, CsiCatalogItem[]> = {
  MASTERFORMAT_1995: csiCatalog1995,
  MASTERFORMAT_CURRENT: csiCatalogCurrent,
};

const catalogIndexesByVersion: Record<CsiMasterFormatVersion, CsiCatalogIndex> = {
  MASTERFORMAT_1995: buildCatalogIndex(csiCatalog1995),
  MASTERFORMAT_CURRENT: buildCatalogIndex(csiCatalogCurrent),
};

export function getCsiCatalog(version: CsiMasterFormatVersion): CsiCatalogItem[] {
  return catalogByVersion[version];
}

export function getCsiDivisions(version: CsiMasterFormatVersion): CsiDivision[] {
  return getCatalogIndex(version).divisionIds
    .map((divisionId) => createDivision(version, divisionId))
    .sort((a, b) => a.number.localeCompare(b.number, undefined, { numeric: true }));
}

export function getCsiSections(version: CsiMasterFormatVersion): CsiSection[] {
  return Array.from(getCatalogIndex(version).sectionsByDivisionId.values()).flat();
}

export function getCsiSectionsByDivision(
  version: CsiMasterFormatVersion,
  divisionId: string
): CsiSection[] {
  const resolvedDivision = resolveCsiDivision(version, divisionId);

  if (!resolvedDivision) return [];

  return getCatalogIndex(version).sectionsByDivisionId.get(resolvedDivision.id) ?? [];
}

export function getCsiDivisionById(
  version: CsiMasterFormatVersion,
  divisionId: string
): CsiDivision | undefined {
  return resolveCsiDivision(version, divisionId);
}

export function getCsiSectionById(
  version: CsiMasterFormatVersion,
  sectionId: string
): CsiSection | undefined {
  return resolveCsiSection(version, sectionId);
}

export function getCsiDivisionLabel(
  version: CsiMasterFormatVersion,
  divisionId: string
): string {
  const division = resolveCsiDivision(version, divisionId);

  return division ? `Division ${division.number} - ${division.name}` : divisionId;
}

export function getCsiSectionLabel(
  version: CsiMasterFormatVersion,
  sectionId: string
): string {
  const section = resolveCsiSection(version, sectionId);

  return section ? `${section.number} - ${section.name}` : sectionId;
}

export function searchCsiCatalog(
  version: CsiMasterFormatVersion,
  query: string
): CsiCatalogItem[] {
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery) return getCsiCatalog(version);

  return getCsiCatalog(version).filter((item) =>
    normalizeSearchText(`${item.number} ${item.name}`).includes(normalizedQuery)
  );
}

export function normalizeCsiSectionNumber(value: string): string {
  return String(value ?? "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function getDivisionIdFromSectionNumber(
  version: CsiMasterFormatVersion,
  sectionNumber: string
): string {
  const resolvedItem = resolveCatalogItem(version, sectionNumber);

  if (resolvedItem) return resolvedItem.divisionId;

  const prefix = getVersionPrefix(version);
  const divisionNumber = normalizeCsiSectionNumber(sectionNumber).slice(0, 2);

  return `${prefix}-${divisionNumber}`;
}

export function resolveCsiCatalogItem(
  version: CsiMasterFormatVersion,
  sectionIdOrNumber: string
): CsiCatalogItem | undefined {
  return resolveCatalogItem(version, sectionIdOrNumber);
}

export function resolveCsiSection(
  version: CsiMasterFormatVersion,
  sectionIdOrNumber: string
): CsiSection | undefined {
  const item = resolveCatalogItem(version, sectionIdOrNumber);

  return item && item.level > 1 ? catalogItemToSection(item) : undefined;
}

export function resolveCsiDivision(
  version: CsiMasterFormatVersion,
  divisionIdOrNumber: string
): CsiDivision | undefined {
  const divisionId = normalizeDivisionId(version, divisionIdOrNumber);
  const hasDivision = getCatalogIndex(version).divisionItemByDivisionId.has(
    divisionId
  );

  return hasDivision ? createDivision(version, divisionId) : undefined;
}

function resolveCatalogItem(
  version: CsiMasterFormatVersion,
  sectionIdOrNumber: string
): CsiCatalogItem | undefined {
  const index = getCatalogIndex(version);
  const normalizedInput = normalizeCsiSectionNumber(sectionIdOrNumber);
  const stableId = getCatalogItemId(version, normalizedInput);
  const compactInput = compactSectionValue(normalizedInput);
  const legacyAlias = normalizeOldMockCurrentId(sectionIdOrNumber);

  return (
    index.itemById.get(sectionIdOrNumber) ??
    index.itemById.get(stableId) ??
    index.itemByLegacyAlias.get(sectionIdOrNumber) ??
    index.itemById.get(legacyAlias) ??
    index.itemByNormalizedNumber.get(normalizedInput) ??
    index.itemByCompactNumber.get(compactInput)
  );
}

function createDivision(
  version: CsiMasterFormatVersion,
  divisionId: string
): CsiDivision {
  const divisionNumber = divisionId.replace(`${getVersionPrefix(version)}-`, "");
  const divisionItem =
    getCatalogIndex(version).divisionItemByDivisionId.get(divisionId);

  return {
    id: divisionId,
    version,
    number: divisionNumber,
    name:
      divisionItem?.name ??
      divisionNameFallbacks[divisionId] ??
      `Division ${divisionNumber}`,
    level: divisionItem?.level,
    parentId: divisionItem?.parentId,
    sortOrder: divisionItem?.sortOrder,
  };
}

function catalogItemToSection(item: CsiCatalogItem): CsiSection {
  return {
    id: item.id,
    version: item.version,
    divisionId: item.divisionId,
    number: item.number,
    name: item.name,
    level: item.level,
    parentId: item.parentId,
    sortOrder: item.sortOrder,
  };
}

function getCatalogItemId(
  version: CsiMasterFormatVersion,
  sectionNumber: string
): string {
  const prefix = getVersionPrefix(version);
  const normalizedNumber = normalizeCsiSectionNumber(sectionNumber);

  if (version === "MASTERFORMAT_1995") return `${prefix}-${normalizedNumber}`;

  return `${prefix}-${normalizedNumber.replace(/\s+/g, "-").replace(/\./g, "-")}`;
}

function normalizeDivisionId(
  version: CsiMasterFormatVersion,
  divisionIdOrNumber: string
): string {
  const prefix = getVersionPrefix(version);
  const normalizedValue = normalizeCsiSectionNumber(divisionIdOrNumber);

  if (normalizedValue.startsWith(`${prefix}-`)) {
    return normalizedValue.slice(0, `${prefix}-00`.length);
  }

  return `${prefix}-${normalizedValue.slice(0, 2)}`;
}

function normalizeOldMockCurrentId(value: string) {
  const match = value.match(/^current-(\d{2})-(\d{4})$/);

  if (!match) return value;

  return `current-${match[1]}-${match[2].slice(0, 2)}-${match[2].slice(2)}`;
}

function compactSectionValue(value: string) {
  return normalizeCsiSectionNumber(value).replace(/\s+/g, "").replace(/\./g, "");
}

function getVersionPrefix(version: CsiMasterFormatVersion) {
  return version === "MASTERFORMAT_1995" ? "1995" : "current";
}

function normalizeSearchText(value: string) {
  return normalizeCsiSectionNumber(value).toLowerCase();
}

function getCatalogIndex(version: CsiMasterFormatVersion): CsiCatalogIndex {
  return catalogIndexesByVersion[version];
}

function buildCatalogIndex(catalog: CsiCatalogItem[]): CsiCatalogIndex {
  const itemById = new Map<string, CsiCatalogItem>();
  const itemByNormalizedNumber = new Map<string, CsiCatalogItem>();
  const itemByCompactNumber = new Map<string, CsiCatalogItem>();
  const itemByLegacyAlias = new Map<string, CsiCatalogItem>();
  const divisionIds = new Set<string>();
  const divisionItemByDivisionId = new Map<string, CsiCatalogItem>();
  const sectionsByDivisionId = new Map<string, CsiSection[]>();

  catalog.forEach((item) => {
    const normalizedNumber = normalizeCsiSectionNumber(item.number);
    const compactNumber = compactSectionValue(normalizedNumber);

    itemById.set(item.id, item);
    setFirst(itemByNormalizedNumber, normalizedNumber, item);
    setFirst(itemByCompactNumber, compactNumber, item);
    divisionIds.add(item.divisionId);

    const legacyAlias = getLegacyCurrentAlias(item);
    if (legacyAlias) itemByLegacyAlias.set(legacyAlias, item);

    if (
      !divisionItemByDivisionId.has(item.divisionId) &&
      (item.level === 1 || compactNumber.slice(2) === "0000")
    ) {
      divisionItemByDivisionId.set(item.divisionId, item);
    }

    if (item.level > 1) {
      const section = catalogItemToSection(item);
      const sections = sectionsByDivisionId.get(item.divisionId) ?? [];

      sections.push(section);
      sectionsByDivisionId.set(item.divisionId, sections);
    }
  });

  divisionIds.forEach((divisionId) => {
    if (divisionItemByDivisionId.has(divisionId)) return;

    const fallbackItem = catalog.find((item) => item.divisionId === divisionId);
    if (fallbackItem) divisionItemByDivisionId.set(divisionId, fallbackItem);
  });

  return {
    catalog,
    itemById,
    itemByNormalizedNumber,
    itemByCompactNumber,
    itemByLegacyAlias,
    divisionIds: Array.from(divisionIds),
    divisionItemByDivisionId,
    sectionsByDivisionId,
  };
}

function setFirst(
  map: Map<string, CsiCatalogItem>,
  key: string,
  item: CsiCatalogItem
) {
  if (!map.has(key)) map.set(key, item);
}

function getLegacyCurrentAlias(item: CsiCatalogItem) {
  if (item.version !== "MASTERFORMAT_CURRENT") return undefined;

  const match = item.id.match(/^current-(\d{2})-(\d{2})-(\d{2})$/);

  if (!match) return undefined;

  return `current-${match[1]}-${match[2]}${match[3]}`;
}
