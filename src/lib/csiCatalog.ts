import { csiCatalog1995 } from "@/data/csiCatalog1995";
import { csiCatalogCurrent } from "@/data/csiCatalogCurrent";
import {
  CsiCatalogItem,
  CsiDivision,
  CsiMasterFormatVersion,
  CsiSection,
} from "@/types/Csi";

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

export function getCsiCatalog(version: CsiMasterFormatVersion): CsiCatalogItem[] {
  return catalogByVersion[version];
}

export function getCsiDivisions(version: CsiMasterFormatVersion): CsiDivision[] {
  const divisionIds = new Set(getCsiCatalog(version).map((item) => item.divisionId));

  return Array.from(divisionIds)
    .map((divisionId) => createDivision(version, divisionId))
    .sort((a, b) => a.number.localeCompare(b.number, undefined, { numeric: true }));
}

export function getCsiSections(version: CsiMasterFormatVersion): CsiSection[] {
  return getCsiCatalog(version)
    .filter((item) => item.level > 1)
    .map(catalogItemToSection);
}

export function getCsiSectionsByDivision(
  version: CsiMasterFormatVersion,
  divisionId: string
): CsiSection[] {
  const resolvedDivision = resolveCsiDivision(version, divisionId);

  if (!resolvedDivision) return [];

  return getCsiSections(version).filter(
    (section) => section.divisionId === resolvedDivision.id
  );
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
  const prefix = getVersionPrefix(version);
  const divisionNumber = normalizeCsiSectionNumber(sectionNumber).slice(0, 2);

  return `${prefix}-${divisionNumber}`;
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
  const hasDivision = getCsiCatalog(version).some(
    (item) => item.divisionId === divisionId
  );

  return hasDivision ? createDivision(version, divisionId) : undefined;
}

function resolveCatalogItem(
  version: CsiMasterFormatVersion,
  sectionIdOrNumber: string
): CsiCatalogItem | undefined {
  const catalog = getCsiCatalog(version);
  const normalizedInput = normalizeCsiSectionNumber(sectionIdOrNumber);
  const stableId = getCatalogItemId(version, normalizedInput);
  const compactInput = compactSectionValue(normalizedInput);

  return catalog.find((item) => {
    const itemNumber = normalizeCsiSectionNumber(item.number);

    return (
      item.id === sectionIdOrNumber ||
      item.id === stableId ||
      itemNumber === normalizedInput ||
      compactSectionValue(itemNumber) === compactInput ||
      item.id === normalizeOldMockCurrentId(sectionIdOrNumber)
    );
  });
}

function createDivision(
  version: CsiMasterFormatVersion,
  divisionId: string
): CsiDivision {
  const catalog = getCsiCatalog(version);
  const divisionNumber = divisionId.replace(`${getVersionPrefix(version)}-`, "");
  const divisionItem = catalog.find(
    (item) =>
      item.divisionId === divisionId &&
      (item.level === 1 || compactSectionValue(item.number).slice(2) === "0000")
  );

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
