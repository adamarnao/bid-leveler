import type { CsiTradeMappingItem, CsiVersionId } from "./types";

export type CsiTradeMappingFixtureScenario = {
  id: string;
  title: string;
  projectCsiVersion: CsiVersionId;
  subcontractorCoverageVersion: CsiVersionId;
  csiItems: CsiTradeMappingItem[];
  expectedBehavior: string;
};

export const currentGypsumBoardItem: CsiTradeMappingItem = {
  id: "current-09-29-00",
  version: "MASTERFORMAT_CURRENT",
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
  id: "current-28-31-00",
  version: "MASTERFORMAT_CURRENT",
  number: "28 31 00",
  name: "Fire Detection and Alarm",
};

export const acousticInsulationItem: CsiTradeMappingItem = {
  id: "current-09-81-16",
  version: "MASTERFORMAT_CURRENT",
  number: "09 81 16",
  name: "Acoustic Insulation",
};

export const csiTradeMappingFixtureScenarios: CsiTradeMappingFixtureScenario[] = [
  {
    id: "current-project-current-gypsum",
    title: "Current project + current gypsum board coverage",
    projectCsiVersion: "MASTERFORMAT_CURRENT",
    subcontractorCoverageVersion: "MASTERFORMAT_CURRENT",
    csiItems: [currentGypsumBoardItem],
    expectedBehavior: "Drywall / Framing assignment should match directly on current MasterFormat rule.",
  },
  {
    id: "current-project-1995-gypsum",
    title: "Current project + 1995 gypsum board coverage",
    projectCsiVersion: "MASTERFORMAT_CURRENT",
    subcontractorCoverageVersion: "MASTERFORMAT_1995",
    csiItems: [legacyGypsumBoardItem],
    expectedBehavior: "Drywall / Framing assignment should be explainable through 1995/current equivalent coverage.",
  },
  {
    id: "1995-project-current-gypsum",
    title: "1995 project + current gypsum board coverage",
    projectCsiVersion: "MASTERFORMAT_1995",
    subcontractorCoverageVersion: "MASTERFORMAT_CURRENT",
    csiItems: [currentGypsumBoardItem],
    expectedBehavior: "Drywall / Framing assignment should be explainable through current/1995 equivalent coverage.",
  },
  {
    id: "1995-project-1995-gypsum",
    title: "1995 project + 1995 gypsum board coverage",
    projectCsiVersion: "MASTERFORMAT_1995",
    subcontractorCoverageVersion: "MASTERFORMAT_1995",
    csiItems: [legacyGypsumBoardItem],
    expectedBehavior: "Drywall / Framing assignment should match directly on 1995 MasterFormat rule.",
  },
  {
    id: "fire-alarm-ambiguous",
    title: "Fire alarm ambiguous mapping",
    projectCsiVersion: "MASTERFORMAT_CURRENT",
    subcontractorCoverageVersion: "MASTERFORMAT_CURRENT",
    csiItems: [fireAlarmItem],
    expectedBehavior: "Fire alarm should default conservatively while preserving possible electrical/fire protection trades.",
  },
  {
    id: "insulation-ambiguous",
    title: "Insulation ambiguous mapping",
    projectCsiVersion: "MASTERFORMAT_CURRENT",
    subcontractorCoverageVersion: "MASTERFORMAT_CURRENT",
    csiItems: [acousticInsulationItem],
    expectedBehavior: "Insulation should produce a low-confidence possible assignment requiring estimator review.",
  },
];

