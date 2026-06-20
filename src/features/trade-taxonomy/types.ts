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
