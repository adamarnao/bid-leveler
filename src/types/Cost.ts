export type ProjectCostCategory =
  | "GENERAL_CONDITIONS"
  | "GENERAL_REQUIREMENTS"
  | "GC_FEE"
  | "INSURANCE"
  | "BOND"
  | "PERMIT"
  | "ALLOWANCE"
  | "CONTINGENCY"
  | "SUBCONTRACTOR";

export type ProjectCostItem = {
  id: string;
  projectId: string;
  category: ProjectCostCategory;
  name: string;
  amount: number;
  notes?: string;
};