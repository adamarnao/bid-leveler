import { CsiMasterFormatVersion } from "@/types/Csi";

export type CsiCrosswalkRelationship =
  | "ONE_TO_ONE"
  | "ONE_TO_MANY"
  | "MANY_TO_ONE"
  | "MANY_TO_MANY"
  | "INCOMPLETE";

export type CsiCrosswalkMappingConfidence =
  | "DIRECT"
  | "EXPANDED"
  | "SPECIAL_CASE"
  | "INCOMPLETE";

export type CsiCrosswalkSection = {
  sectionNumber: string | null;
  title: string | null;
  level: number | null;
};

export type CsiCrosswalkEntry = {
  id: string;
  sourceVersion: Extract<CsiMasterFormatVersion, "MASTERFORMAT_1995">;
  targetVersion: Extract<CsiMasterFormatVersion, "MASTERFORMAT_2004_PLUS">;
  sourceSection: CsiCrosswalkSection;
  targetSection: CsiCrosswalkSection;
  relationship: CsiCrosswalkRelationship;
  mappingConfidence: CsiCrosswalkMappingConfidence;
};
