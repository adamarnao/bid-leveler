import { csiCatalog1995 } from "@/data/csiCatalog1995";
import { csiCatalogCurrent } from "@/data/csiCatalogCurrent";
import {
  CsiCatalogItem,
  CsiCatalogTreeNode,
  CsiDivision,
  CsiHierarchyRelationship,
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
  itemsByLevel: Map<number, CsiCatalogItem[]>;
  childrenByParentId: Map<string, CsiCatalogItem[]>;
  rootItems: CsiCatalogItem[];
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

export function getCsiCatalogTree(
  version: CsiMasterFormatVersion
): CsiCatalogTreeNode[] {
  const index = getCatalogIndex(version);

  return index.rootItems.map((item) => buildCatalogTreeNode(version, item));
}

export function getCsiItemsByLevel(
  version: CsiMasterFormatVersion,
  level: number
): CsiCatalogItem[] {
  return getCatalogIndex(version).itemsByLevel.get(level) ?? [];
}

export function getCsiChildren(
  version: CsiMasterFormatVersion,
  parentId: string
): CsiCatalogItem[] {
  const parentItem = resolveCsiCatalogItem(version, parentId);

  if (!parentItem) return [];

  return getCatalogIndex(version).childrenByParentId.get(parentItem.id) ?? [];
}

export function getCsiDescendants(
  version: CsiMasterFormatVersion,
  itemId: string
): CsiCatalogItem[] {
  const item = resolveCsiCatalogItem(version, itemId);

  if (!item) return [];

  const descendants: CsiCatalogItem[] = [];
  const stack = [...getCsiChildren(version, item.id)].reverse();

  while (stack.length > 0) {
    const child = stack.pop();
    if (!child) continue;

    descendants.push(child);
    stack.push(...getCsiChildren(version, child.id).reverse());
  }

  return descendants;
}

export function getCsiAncestors(
  version: CsiMasterFormatVersion,
  itemId: string
): CsiCatalogItem[] {
  const item = resolveCsiCatalogItem(version, itemId);
  if (!item) return [];

  const ancestors: CsiCatalogItem[] = [];
  let parentId = item.parentId;

  while (parentId) {
    const parent = resolveCsiCatalogItem(version, parentId);
    if (!parent) break;

    ancestors.unshift(parent);
    parentId = parent.parentId;
  }

  return ancestors;
}

export function getCsiLevel1Divisions(
  version: CsiMasterFormatVersion
): CsiCatalogItem[] {
  return getCsiItemsByLevel(version, 1);
}

export function getCsiLevel2Subdivisions(
  version: CsiMasterFormatVersion
): CsiCatalogItem[] {
  return getCsiItemsByLevel(version, 2);
}

export function getCsiLevel3Sections(
  version: CsiMasterFormatVersion
): CsiCatalogItem[] {
  return getCsiItemsByLevel(version, 3);
}

export function getCsiLevel4Subsections(
  version: CsiMasterFormatVersion
): CsiCatalogItem[] {
  return getCsiItemsByLevel(version, 4);
}

export function resolveCsiItemLevel(
  version: CsiMasterFormatVersion,
  idOrNumber: string
): number | undefined {
  return resolveCsiCatalogItem(version, idOrNumber)?.level;
}

export function getNearestLevel2Ancestor(
  version: CsiMasterFormatVersion,
  idOrNumber: string
): CsiCatalogItem | undefined {
  const item = resolveCsiCatalogItem(version, idOrNumber);

  if (!item) return undefined;
  if (isCsiSubdivisionItem(item)) return item;

  return [...getCsiAncestors(version, item.id)]
    .reverse()
    .find(isCsiSubdivisionItem);
}

export function getCsiHierarchyRelationship(
  version: CsiMasterFormatVersion,
  requestedItemIdOrNumber: string,
  coverageItemIdOrNumber: string
): CsiHierarchyRelationship {
  const requestedItem = resolveCsiCatalogItem(version, requestedItemIdOrNumber);
  const coverageItem = resolveCsiCatalogItem(version, coverageItemIdOrNumber);

  if (!requestedItem || !coverageItem) return "UNRELATED";
  if (requestedItem.id === coverageItem.id) return "EXACT";

  const requestedAncestors = getCsiAncestors(version, requestedItem.id);
  const coverageAncestors = getCsiAncestors(version, coverageItem.id);

  if (requestedAncestors.some((ancestor) => ancestor.id === coverageItem.id)) {
    return "ANCESTOR";
  }

  if (coverageAncestors.some((ancestor) => ancestor.id === requestedItem.id)) {
    return "DESCENDANT";
  }

  if (haveMeaningfulSharedParent(version, requestedItem, coverageItem)) {
    return "SIBLING";
  }

  return "UNRELATED";
}

export function isCsiDivisionItem(item: CsiCatalogItem): boolean {
  return item.level === 1;
}

export function isCsiSubdivisionItem(item: CsiCatalogItem): boolean {
  return item.level === 2;
}

export function isCsiSectionItem(item: CsiCatalogItem): boolean {
  return item.level === 3;
}

export function isCsiSubsectionItem(item: CsiCatalogItem): boolean {
  return item.level === 4;
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

function buildCatalogTreeNode(
  version: CsiMasterFormatVersion,
  item: CsiCatalogItem
): CsiCatalogTreeNode {
  return {
    item,
    children: (getCatalogIndex(version).childrenByParentId.get(item.id) ?? []).map(
      (child) => buildCatalogTreeNode(version, child)
    ),
  };
}

function haveMeaningfulSharedParent(
  version: CsiMasterFormatVersion,
  requestedItem: CsiCatalogItem,
  coverageItem: CsiCatalogItem
) {
  if (isCsiDivisionItem(requestedItem) || isCsiDivisionItem(coverageItem)) {
    return false;
  }

  if (
    requestedItem.parentId &&
    coverageItem.parentId &&
    requestedItem.parentId === coverageItem.parentId
  ) {
    return true;
  }

  const requestedLevel2Ancestor = getNearestLevel2Ancestor(
    version,
    requestedItem.id
  );
  const coverageLevel2Ancestor = getNearestLevel2Ancestor(
    version,
    coverageItem.id
  );

  return Boolean(
    requestedLevel2Ancestor &&
      coverageLevel2Ancestor &&
      requestedLevel2Ancestor.id === coverageLevel2Ancestor.id &&
      requestedItem.id !== requestedLevel2Ancestor.id &&
      coverageItem.id !== coverageLevel2Ancestor.id
  );
}

function buildCatalogIndex(catalog: CsiCatalogItem[]): CsiCatalogIndex {
  const itemById = new Map<string, CsiCatalogItem>();
  const itemByNormalizedNumber = new Map<string, CsiCatalogItem>();
  const itemByCompactNumber = new Map<string, CsiCatalogItem>();
  const itemByLegacyAlias = new Map<string, CsiCatalogItem>();
  const divisionIds = new Set<string>();
  const divisionItemByDivisionId = new Map<string, CsiCatalogItem>();
  const sectionsByDivisionId = new Map<string, CsiSection[]>();
  const itemsByLevel = new Map<number, CsiCatalogItem[]>();
  const childrenByParentId = new Map<string, CsiCatalogItem[]>();
  const rootItems: CsiCatalogItem[] = [];

  catalog.forEach((item) => {
    const normalizedNumber = normalizeCsiSectionNumber(item.number);
    const compactNumber = compactSectionValue(normalizedNumber);

    itemById.set(item.id, item);
    setFirst(itemByNormalizedNumber, normalizedNumber, item);
    setFirst(itemByCompactNumber, compactNumber, item);
    divisionIds.add(item.divisionId);
    appendToMap(itemsByLevel, item.level, item);

    if (item.parentId) {
      appendToMap(childrenByParentId, item.parentId, item);
    } else {
      rootItems.push(item);
    }

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

  sortItems(rootItems);
  itemsByLevel.forEach(sortItems);
  childrenByParentId.forEach(sortItems);
  sectionsByDivisionId.forEach((sections) =>
    sections.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
  );

  return {
    catalog,
    itemById,
    itemByNormalizedNumber,
    itemByCompactNumber,
    itemByLegacyAlias,
    divisionIds: Array.from(divisionIds),
    divisionItemByDivisionId,
    sectionsByDivisionId,
    itemsByLevel,
    childrenByParentId,
    rootItems,
  };
}

function setFirst(
  map: Map<string, CsiCatalogItem>,
  key: string,
  item: CsiCatalogItem
) {
  if (!map.has(key)) map.set(key, item);
}

function appendToMap<K, V>(map: Map<K, V[]>, key: K, value: V) {
  const values = map.get(key) ?? [];

  values.push(value);
  map.set(key, values);
}

function sortItems<T extends { sortOrder?: number; number: string }>(items: T[]) {
  items.sort(
    (a, b) =>
      (a.sortOrder ?? 0) - (b.sortOrder ?? 0) ||
      a.number.localeCompare(b.number, undefined, { numeric: true })
  );
}

function getLegacyCurrentAlias(item: CsiCatalogItem) {
  if (item.version !== "MASTERFORMAT_CURRENT") return undefined;

  const match = item.id.match(/^current-(\d{2})-(\d{2})-(\d{2})$/);

  if (!match) return undefined;

  return `current-${match[1]}-${match[2]}${match[3]}`;
}
