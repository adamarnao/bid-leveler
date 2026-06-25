import type { CsiTradeMappingItem, CsiVersionId } from "./types";

export type CsiTradeMappingFixtureScenario = {
  id: string;
  title: string;
  projectCsiVersion: CsiVersionId;
  subcontractorCoverageVersion: CsiVersionId;
  csiItems: CsiTradeMappingItem[];
  expectedBehavior: string;
};

export const masterFormat2004PlusGypsumBoardItem: CsiTradeMappingItem = {
  id: "2004-plus-09-29-00",
  version: "MASTERFORMAT_2004_PLUS",
  number: "09 29 00",
  name: "Gypsum Board",
};

export const legacyGypsumBoardItem: CsiTradeMappingItem = {
  id: "1995-09250",
  version: "MASTERFORMAT_1995",
  number: "09250",
  name: "Gypsum Board",
};

export const fireAlarmItem: CsiTradeMappingItem = {
  id: "2004-plus-28-31-00",
  version: "MASTERFORMAT_2004_PLUS",
  number: "28 31 00",
  name: "Fire Detection and Alarm",
};

export const acousticInsulationItem: CsiTradeMappingItem = {
  id: "2004-plus-09-81-16",
  version: "MASTERFORMAT_2004_PLUS",
  number: "09 81 16",
  name: "Acoustic Insulation",
};

export const csiTradeMappingFixtureScenarios: CsiTradeMappingFixtureScenario[] = [
  {
    id: "2004-plus-project-2004-plus-gypsum",
    title: "Project MF: 2004+ / 50-Division | Sub coverage: 2004+ / 50-Division | Gypsum Board",
    projectCsiVersion: "MASTERFORMAT_2004_PLUS",
    subcontractorCoverageVersion: "MASTERFORMAT_2004_PLUS",
    csiItems: [masterFormat2004PlusGypsumBoardItem],
    expectedBehavior: "Drywall / Framing assignment should match directly on the 2004+ / 50-Division rule.",
  },
  {
    id: "2004-plus-project-1995-gypsum",
    title: "Project MF: 2004+ / 50-Division | Sub coverage: 1995 / 16-Division | Gypsum Board",
    projectCsiVersion: "MASTERFORMAT_2004_PLUS",
    subcontractorCoverageVersion: "MASTERFORMAT_1995",
    csiItems: [legacyGypsumBoardItem],
    expectedBehavior: "Drywall / Framing assignment should be explainable through 1995 to 2004+ equivalent coverage.",
  },
  {
    id: "1995-project-2004-plus-gypsum",
    title: "Project MF: 1995 / 16-Division | Sub coverage: 2004+ / 50-Division | Gypsum Board",
    projectCsiVersion: "MASTERFORMAT_1995",
    subcontractorCoverageVersion: "MASTERFORMAT_2004_PLUS",
    csiItems: [masterFormat2004PlusGypsumBoardItem],
    expectedBehavior: "Drywall / Framing assignment should be explainable through 2004+ to 1995 equivalent coverage.",
  },
  {
    id: "1995-project-1995-gypsum",
    title: "Project MF: 1995 / 16-Division | Sub coverage: 1995 / 16-Division | Gypsum Board",
    projectCsiVersion: "MASTERFORMAT_1995",
    subcontractorCoverageVersion: "MASTERFORMAT_1995",
    csiItems: [legacyGypsumBoardItem],
    expectedBehavior: "Drywall / Framing assignment should match directly on 1995 MasterFormat rule.",
  },
  {
    id: "fire-alarm-ambiguous",
    title: "Project MF: 2004+ / 50-Division | Ambiguous Fire Alarm Mapping",
    projectCsiVersion: "MASTERFORMAT_2004_PLUS",
    subcontractorCoverageVersion: "MASTERFORMAT_2004_PLUS",
    csiItems: [fireAlarmItem],
    expectedBehavior: "Fire alarm should default conservatively while preserving possible electrical/fire protection trades.",
  },
  {
    id: "insulation-ambiguous",
    title: "Project MF: 2004+ / 50-Division | Ambiguous Insulation Mapping",
    projectCsiVersion: "MASTERFORMAT_2004_PLUS",
    subcontractorCoverageVersion: "MASTERFORMAT_2004_PLUS",
    csiItems: [acousticInsulationItem],
    expectedBehavior: "Insulation should produce a low-confidence possible assignment requiring estimator review.",
  },
];
