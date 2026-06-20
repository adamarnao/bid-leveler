export type ProjectSectorId =
  | "commercial"
  | "office"
  | "retail"
  | "restaurant"
  | "hospitality"
  | "healthcare"
  | "education"
  | "industrial"
  | "warehouse"
  | "laboratory"
  | "cleanroom"
  | "multifamily"
  | "residential"
  | "civil"
  | "sitework"
  | "government"
  | "detention"
  | "transportation"
  | "airport"
  | "marine"
  | "sports"
  | "mission_critical"
  | "renewable_energy"
  | "agricultural";

export type ProjectWorkTypeId =
  | "tenant_improvement"
  | "fit_out"
  | "build_out"
  | "interior_renovation"
  | "occupied_renovation"
  | "ground_up"
  | "core_and_shell"
  | "shell_completion"
  | "white_box"
  | "addition"
  | "remodel"
  | "adaptive_reuse"
  | "restoration"
  | "sitework_only"
  | "demolition_only"
  | "maintenance_repair"
  | "phased_renovation";

export type ProjectContextTagId =
  | "medical_office"
  | "hospital"
  | "surgery_center"
  | "imaging"
  | "lab"
  | "cleanroom"
  | "commercial_kitchen"
  | "occupied_building"
  | "night_work"
  | "public_bid"
  | "prevailing_wage"
  | "secure_facility"
  | "high_rise"
  | "tilt_up"
  | "precast"
  | "pre_engineered_metal_building"
  | "cold_storage"
  | "food_processing"
  | "data_center"
  | "airport_secure_area"
  | "marine_waterfront"
  | "historic_restoration"
  | "flood_zone"
  | "infection_control";

export type ProjectClassificationOption<TId extends string> = {
  id: TId;
  label: string;
  description: string;
  sortOrder: number;
  aliases?: string[];
};

export type ProjectClassification = {
  sectorIds: ProjectSectorId[];
  workTypeIds: ProjectWorkTypeId[];
  contextTagIds: ProjectContextTagId[];
};

export type ProjectClassificationInput = {
  sectorIds?: readonly string[];
  sectors?: readonly string[];
  workTypeIds?: readonly string[];
  workTypes?: readonly string[];
  contextTagIds?: readonly string[];
  contextTags?: readonly string[];
};
