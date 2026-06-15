export type CsiMasterFormatVersion =
  | "MASTERFORMAT_1995"
  | "MASTERFORMAT_CURRENT";

export type CsiDivision = {
  id: string;
  version: CsiMasterFormatVersion;
  number: string;
  name: string;
  level?: number;
  parentId?: string;
  sortOrder?: number;
};

export type CsiSection = {
  id: string;
  version: CsiMasterFormatVersion;
  divisionId: string;
  number: string;
  name: string;
  level?: number;
  parentId?: string;
  sortOrder?: number;
};

export type CsiCatalogItem = {
  id: string;
  version: CsiMasterFormatVersion;
  number: string;
  name: string;
  level: number;
  divisionId: string;
  parentId?: string;
  sortOrder: number;
};

export type CsiCatalogTreeNode = {
  item: CsiCatalogItem;
  children: CsiCatalogTreeNode[];
};

export type CsiScopeItem = {
  id: string;
  sectionId: string;
  name: string;
  description?: string;
};

export type ProjectCsiSelection = {
  id: string;
  projectId: string;
  version: CsiMasterFormatVersion;
  divisionId: string;
  sectionId?: string;
  scopeItemIds: string[];
  notes?: string;
};

export type StoredProjectCsiSelection = {
  version: CsiMasterFormatVersion;
  divisionIds: string[];
  sectionIds: string[];
  updatedAt: string;
};

export type StoredProjectCsiSelections = Record<
  string,
  StoredProjectCsiSelection
>;
