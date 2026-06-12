import { ProjectCostItem } from "@/types/Cost";

export const mockProjectCosts: ProjectCostItem[] = [
  {
    id: "cost-1",
    projectId: "1",
    category: "GENERAL_CONDITIONS",
    name: "Supervision",
    amount: 42000,
  },
  {
    id: "cost-2",
    projectId: "1",
    category: "GENERAL_REQUIREMENTS",
    name: "Dumpsters, temp facilities, cleanup",
    amount: 26500,
  },
  {
    id: "cost-3",
    projectId: "1",
    category: "GC_FEE",
    name: "General Contractor Fee",
    amount: 45000,
  },
  {
    id: "cost-4",
    projectId: "1",
    category: "INSURANCE",
    name: "Insurance",
    amount: 12500,
  },
];