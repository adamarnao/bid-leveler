export type TradePackageMode =
  | "UMBRELLA"
  | "SPLIT_BY_CHILD"
  | "USER_CHOICE";

export type ProjectSectorTag =
  | "commercial"
  | "residential"
  | "multifamily"
  | "healthcare"
  | "hospitality"
  | "restaurant"
  | "education"
  | "industrial"
  | "laboratory"
  | "cleanroom"
  | "civil"
  | "sitework"
  | "retail"
  | "office"
  | "warehouse"
  | "transportation"
  | "airport"
  | "marine"
  | "sports"
  | "mission_critical"
  | "government"
  | "detention"
  | "renewable_energy"
  | "agricultural";

export type TradeSpecialtyTag =
  | "core"
  | "specialty"
  | "sector_specific"
  | "owner_vendor"
  | "allowance_candidate"
  | "gc_cost"
  | "alternate_candidate"
  | "cross_trade";

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
  isCommon?: boolean;
  defaultHidden?: boolean;
  sectorTags?: ProjectSectorTag[];
  specialtyTags?: TradeSpecialtyTag[];
  relatedTradeIds?: string[];
  splitRecommendation?: string;
  estimatingNotes?: string;
};

export type TradeCsiMatchStrength =
  | "PRIMARY"
  | "SECONDARY"
  | "POSSIBLE";

export type TradeCsiMappingRule = {
  id: string;
  tradeId: string;
  csiVersion: string;
  codePatterns?: string[];
  titleKeywords?: string[];
  exactCsiIds?: string[];
  matchStrength: TradeCsiMatchStrength;
  notes?: string;
};

export type TradeCsiAssignment = {
  csiItemId: string;
  tradeId: string;
  matchStrength: TradeCsiMatchStrength;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  reason: string;
};

export type TradePackageSuggestion = {
  tradeId: string;
  name: string;
  parentTradeId?: string;
  packageMode: TradePackageMode;
  csiItemIds: string[];
  childTradeIds?: string[];
  confidence: "HIGH" | "MEDIUM" | "LOW";
  warnings: string[];
};

export type TradePackageGenerationResult = {
  suggestions: TradePackageSuggestion[];
  assignments: TradeCsiAssignment[];
  unassignedCsiItemIds: string[];
  warnings: string[];
};

export type TradeTaxonomyCsiItem = {
  id: string;
  version: string;
  number: string;
  name: string;
};
