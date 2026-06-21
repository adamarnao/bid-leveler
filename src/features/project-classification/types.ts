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
  | "civil_sitework"
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
  | "interior_fit_out_renovation"
  | "ground_up_new_construction"
  | "core_and_shell"
  | "addition_expansion"
  | "sitework_civil_only"
  | "demolition_abatement_only"
  | "restoration_adaptive_reuse"
  | "maintenance_repair"
  | "specialty_systems_installation";

export type ProjectContextTagId =
  | "occupied_site"
  | "phased_work"
  | "night_work"
  | "public_bid"
  | "prevailing_wage"
  | "secure_facility"
  | "high_rise"
  | "white_box"
  | "furniture_ffe"
  | "access_control"
  | "medical_office"
  | "hospital"
  | "surgery_center"
  | "imaging"
  | "infection_control"
  | "medical_gas_required"
  | "nurse_call_required"
  | "radiation_shielding"
  | "lead_lined_construction"
  | "commercial_kitchen"
  | "food_service"
  | "kitchen_hood"
  | "walk_in_cooler_freezer"
  | "grease_interceptor"
  | "refrigeration"
  | "cold_storage"
  | "food_processing"
  | "data_center"
  | "lab"
  | "cleanroom_context"
  | "historic_restoration"
  | "structural_retrofit"
  | "change_of_use"
  | "tilt_up"
  | "precast"
  | "pre_engineered_metal_building"
  | "airport_secure_area"
  | "marine_waterfront"
  | "flood_zone"
  | "sitework_scope"
  | "exterior_envelope_scope"
  | "roof_work"
  | "wood_framing"
  | "masonry_block_building"
  | "kitchen_bath_renovation"
  | "appliances"
  | "siding_exterior_cladding"
  | "windows_exterior_doors";

export type ProjectClassificationOption<TId extends string> = {
  id: TId;
  label: string;
  description: string;
  sortOrder: number;
  aliases?: string[];
};

export type SectorWorkTypeLabel = {
  sector: ProjectSectorId;
  workType: ProjectWorkTypeId;
  label: string;
  aliases?: string[];
};

export type ContextTagAvailability = {
  contextTag: ProjectContextTagId;
  sectors?: ProjectSectorId[];
  workTypes?: ProjectWorkTypeId[];
  requiresAnyContext?: ProjectContextTagId[];
  hiddenByDefault?: boolean;
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
