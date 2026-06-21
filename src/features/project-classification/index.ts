export * from "./types";
export {
  contextTagAvailability,
  projectContextTagOptions,
  projectSectorOptions,
  projectWorkTypeOptions,
  sectorWorkTypeLabels,
} from "./defaultProjectClassifications";
export {
  buildProjectClassificationLabel,
  getContextTagAvailability,
  getProjectContextTagOptions,
  getProjectSectorOptions,
  getProjectWorkTypeOptions,
  getWorkTypeLabelForSector,
  getWorkTypeOptionsForSector,
  normalizeProjectContextTagId,
  normalizeProjectClassification,
  normalizeProjectSectorId,
  normalizeProjectWorkTypeId,
} from "./projectClassificationLogic";
