export type ScopeItem = {
  id: string;
  tradeId: string;
  name: string;
  description?: string;
};

export type ProjectScopeItem = {
  id: string;
  projectId: string;
  tradeId: string;
  scopeItemId: string;
  included: boolean;
  notes?: string;
};