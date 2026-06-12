import { Project } from "@/types/Project";

export const mockProjects: Project[] = [
  {
    id: "1",

    projectNumber: "2026-001",
    name: "North Port Medical Office",
    client: "ABC Development",
    estimator: "Adam",

    marketSector: "Medical",
    projectCategory: "Medical Office",
    projectSubtype: "Tenant Improvement",

    address: "123 Main St",
    city: "North Port",
    state: "FL",
    zip: "34286",

    squareFootage: 12000,
    projectDurationMonths: 6,

    deliveryMethod: "Hard Bid",
    ownershipType: "Private",

    planLink: "",
    documentNotes: "",

    bidDueDate: "2026-07-15",
    status: "BIDDING",

    archived: false,
    createdDate: "2026-06-09",

    csiVersion: "MASTERFORMAT_CURRENT",
  },
];
