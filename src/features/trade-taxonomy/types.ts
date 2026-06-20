export type TradePackageMode =
  | "UMBRELLA"
  | "SPLIT_BY_CHILD"
  | "USER_CHOICE";

export type TradeTaxonomyNode = {
  id: string;
  parentId?: string;
  name: string;
  aliases?: string[];
  description?: string;
  sortOrder: number;
  canBeBidPackage: boolean;
  defaultPackageMode: TradePackageMode;
  defaultScopeNotes?: string[];
  defaultExclusions?: string[];
  isActive: boolean;
};
