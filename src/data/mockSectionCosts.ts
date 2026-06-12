export type MockSectionCost = {
  sectionId: string;
  budget: number;
  lowBid: number;
  selectedCost: number;
};

export const mockSectionCosts: MockSectionCost[] = [
  {
    sectionId: "current-09-2216",
    budget: 25000,
    lowBid: 23800,
    selectedCost: 24200,
  },
  {
    sectionId: "current-09-2900",
    budget: 65000,
    lowBid: 61500,
    selectedCost: 62000,
  },
  {
    sectionId: "current-09-5100",
    budget: 18000,
    lowBid: 17200,
    selectedCost: 17500,
  },
  {
    sectionId: "current-09-9100",
    budget: 22000,
    lowBid: 21000,
    selectedCost: 21500,
  },
  {
    sectionId: "current-26-0500",
    budget: 40000,
    lowBid: 38200,
    selectedCost: 39000,
  },
  {
    sectionId: "current-26-5100",
    budget: 32000,
    lowBid: 30500,
    selectedCost: 31000,
  },
];