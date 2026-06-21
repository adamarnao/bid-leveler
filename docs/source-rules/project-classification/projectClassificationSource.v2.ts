// Bid-Leveler Project Classification Source v2.
// Planning/source file. Codex should implement from this, not invent parallel classification rules.

export type ProjectSectorTag =
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

export type ProjectWorkTypeTag =
  | "interior_fit_out_renovation"
  | "ground_up_new_construction"
  | "core_and_shell"
  | "addition_expansion"
  | "sitework_civil_only"
  | "demolition_abatement_only"
  | "restoration_adaptive_reuse"
  | "maintenance_repair"
  | "specialty_systems_installation";

export type ProjectContextTag =
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

export type ClassificationOption<TId extends string> = {
  id: TId;
  label: string;
  description: string;
  aliases?: string[];
  sortOrder: number;
};

export type SectorWorkTypeLabel = {
  sector: ProjectSectorTag;
  workType: ProjectWorkTypeTag;
  label: string;
  aliases?: string[];
};

export type ContextTagAvailability = {
  contextTag: ProjectContextTag;
  sectors?: ProjectSectorTag[];
  workTypes?: ProjectWorkTypeTag[];
  requiresAnyContext?: ProjectContextTag[];
  hiddenByDefault?: boolean;
};

export type ProjectClassification = {
  sector?: ProjectSectorTag;
  workType?: ProjectWorkTypeTag;
  contextTags?: ProjectContextTag[];
};

export const PROJECT_SECTORS: ClassificationOption<ProjectSectorTag>[] = [
  { id: "commercial", label: "Commercial", description: "General commercial project where no narrower sector has been selected.", sortOrder: 10 },
  { id: "office", label: "Office", description: "Office buildings, tenant suites, corporate interiors, and office fit-outs.", sortOrder: 20 },
  { id: "retail", label: "Retail", description: "Retail stores, shopping centers, storefronts, and sales environments.", sortOrder: 30 },
  { id: "restaurant", label: "Restaurant", description: "Restaurants, cafes, bars, commercial kitchens, and food service tenant spaces.", sortOrder: 40 },
  { id: "hospitality", label: "Hospitality", description: "Hotels, resorts, guestrooms, lobbies, amenity spaces, and hospitality back-of-house work.", sortOrder: 50 },
  { id: "healthcare", label: "Healthcare", description: "Medical office, clinic, hospital, surgery center, imaging, and healthcare support spaces.", sortOrder: 60 },
  { id: "education", label: "Education", description: "Schools, colleges, universities, classrooms, labs, cafeterias, and campus facilities.", sortOrder: 70 },
  { id: "industrial", label: "Industrial", description: "Industrial, manufacturing, process, utility, and production facilities.", sortOrder: 80 },
  { id: "warehouse", label: "Warehouse", description: "Warehouse, logistics, distribution, storage, fulfillment, and light industrial shell/buildout work.", sortOrder: 90 },
  { id: "laboratory", label: "Laboratory", description: "Laboratory, research, testing, and technical/scientific facilities.", sortOrder: 100 },
  { id: "cleanroom", label: "Cleanroom", description: "Cleanroom, controlled environment, and specialty technical production spaces.", sortOrder: 110 },
  { id: "multifamily", label: "Multifamily", description: "Apartment buildings, mixed-use residential, multifamily common areas, and unit renovations.", sortOrder: 120 },
  { id: "residential", label: "Residential", description: "Single-family residential, townhomes, custom homes, and residential remodels.", sortOrder: 130 },
  { id: "civil_sitework", label: "Civil / Sitework", description: "Site/civil, utilities, paving, earthwork, landscaping, and exterior development projects.", sortOrder: 140 },
  { id: "government", label: "Government", description: "Public agency, municipal, state, federal, and civic projects.", sortOrder: 150 },
  { id: "detention", label: "Detention", description: "Correctional, detention, holding, and secure custodial facilities.", sortOrder: 160 },
  { id: "transportation", label: "Transportation", description: "Transit, station, roadway, rail, airport, marine, and transportation infrastructure facilities.", sortOrder: 170 },
  { id: "airport", label: "Airport", description: "Airport, airfield, terminal, hangar, and secure aviation environments.", sortOrder: 180 },
  { id: "marine", label: "Marine / Waterfront", description: "Marine, dock, waterfront, pier, seawall, and shoreline work.", sortOrder: 190 },
  { id: "sports", label: "Sports / Recreation", description: "Athletic, recreation, sports fields, pools, performance, and event facilities.", sortOrder: 200 },
  { id: "mission_critical", label: "Mission Critical", description: "Data centers, critical facilities, UPS/generator-heavy environments, and resilient infrastructure.", sortOrder: 210 },
  { id: "renewable_energy", label: "Renewable Energy", description: "Solar, wind, EV charging, battery, and renewable infrastructure projects.", sortOrder: 220 },
  { id: "agricultural", label: "Agricultural", description: "Agricultural, greenhouse, grow, livestock, food production, and related facilities.", sortOrder: 230 },
];

export const PROJECT_WORK_TYPES: ClassificationOption<ProjectWorkTypeTag>[] = [
  {
    id: "interior_fit_out_renovation",
    label: "Interior Fit-Out / Renovation",
    description: "Interior work inside an existing building or shell. Includes tenant improvement, fit-out, build-out, interior renovation, remodel, and similar work.",
    aliases: ["tenant improvement", "TI", "fit-out", "build-out", "interior renovation", "remodel", "tenant buildout"],
    sortOrder: 10,
  },
  { id: "ground_up_new_construction", label: "Ground-Up / New Construction", description: "New building construction from site/foundation through completed project.", sortOrder: 20 },
  { id: "core_and_shell", label: "Core & Shell", description: "Base building structure, enclosure, and primary systems without full tenant buildout.", sortOrder: 30 },
  { id: "addition_expansion", label: "Addition / Expansion", description: "New square footage added to an existing building or facility.", sortOrder: 40 },
  { id: "sitework_civil_only", label: "Sitework / Civil Only", description: "Site/civil scope without meaningful building interior scope.", sortOrder: 50 },
  { id: "demolition_abatement_only", label: "Demolition / Abatement Only", description: "Demolition, selective demolition, full demolition, or abatement package without rebuild scope.", sortOrder: 60 },
  { id: "restoration_adaptive_reuse", label: "Restoration / Adaptive Reuse", description: "Existing building restoration, preservation, reuse, conversion, or major rehabilitation.", sortOrder: 70 },
  { id: "maintenance_repair", label: "Maintenance / Repair", description: "Repair, replacement, maintenance, service, or small corrective construction scope.", sortOrder: 80 },
  { id: "specialty_systems_installation", label: "Specialty Systems Installation", description: "Narrow project focused primarily on a system, equipment package, or specialty scope.", sortOrder: 90 },
];

export const SECTOR_WORK_TYPE_LABELS: SectorWorkTypeLabel[] = [
  { sector: "office", workType: "interior_fit_out_renovation", label: "Tenant Improvement / Interior Fit-Out", aliases: ["Office TI", "Office Build-Out", "Tenant Fit-Out"] },
  { sector: "retail", workType: "interior_fit_out_renovation", label: "Store Build-Out / Renovation", aliases: ["Retail Fit-Out", "Store Fit-Out"] },
  { sector: "restaurant", workType: "interior_fit_out_renovation", label: "Restaurant Build-Out / Renovation", aliases: ["Restaurant Fit-Out", "Restaurant TI"] },
  { sector: "healthcare", workType: "interior_fit_out_renovation", label: "Medical Office TI / Renovation", aliases: ["Clinic TI", "Medical Office Build-Out"] },
  { sector: "multifamily", workType: "interior_fit_out_renovation", label: "Unit Renovation / Remodel", aliases: ["Unit Renovation", "Apartment Renovation"] },
  { sector: "residential", workType: "interior_fit_out_renovation", label: "Renovation / Remodel", aliases: ["Residential Remodel", "Home Renovation"] },
  { sector: "hospitality", workType: "interior_fit_out_renovation", label: "Guestroom / Public Area Renovation", aliases: ["Hotel Renovation", "Guestroom Renovation"] },
  { sector: "industrial", workType: "interior_fit_out_renovation", label: "Interior Renovation / Process Area Fit-Out", aliases: ["Process Area Fit-Out"] },
  { sector: "warehouse", workType: "interior_fit_out_renovation", label: "Warehouse Tenant Build-Out", aliases: ["Warehouse TI", "Logistics Build-Out"] },
  { sector: "laboratory", workType: "interior_fit_out_renovation", label: "Lab Renovation / Fit-Out", aliases: ["Lab Fit-Out", "Lab Renovation"] },
  { sector: "cleanroom", workType: "interior_fit_out_renovation", label: "Cleanroom Fit-Out / Renovation", aliases: ["Cleanroom Build-Out"] },
];

export const CONTEXT_TAG_AVAILABILITY: ContextTagAvailability[] = [
  { contextTag: "occupied_site" },
  { contextTag: "phased_work" },
  { contextTag: "night_work" },
  { contextTag: "public_bid", sectors: ["government", "education", "civil_sitework", "transportation", "airport", "marine"] },
  { contextTag: "prevailing_wage", sectors: ["government", "education", "civil_sitework", "transportation", "airport", "marine"] },
  { contextTag: "secure_facility", sectors: ["office", "government", "detention", "healthcare", "transportation", "airport", "mission_critical"] },
  { contextTag: "high_rise", sectors: ["office", "hospitality", "multifamily", "residential", "commercial"] },
  { contextTag: "white_box", workTypes: ["interior_fit_out_renovation", "core_and_shell"] },
  { contextTag: "furniture_ffe", sectors: ["office", "hospitality", "education", "multifamily", "residential"] },
  { contextTag: "access_control", sectors: ["office", "retail", "healthcare", "education", "government", "detention", "warehouse", "mission_critical"] },

  { contextTag: "medical_office", sectors: ["healthcare"] },
  { contextTag: "hospital", sectors: ["healthcare"] },
  { contextTag: "surgery_center", sectors: ["healthcare"] },
  { contextTag: "imaging", sectors: ["healthcare"] },
  { contextTag: "infection_control", sectors: ["healthcare"] },
  { contextTag: "medical_gas_required", sectors: ["healthcare", "laboratory"] },
  { contextTag: "nurse_call_required", sectors: ["healthcare"] },
  { contextTag: "radiation_shielding", sectors: ["healthcare", "laboratory"] },
  { contextTag: "lead_lined_construction", sectors: ["healthcare", "laboratory"] },
  { contextTag: "lab", sectors: ["laboratory", "healthcare", "education", "industrial"] },
  { contextTag: "cleanroom_context", sectors: ["cleanroom", "laboratory", "healthcare", "industrial"] },

  { contextTag: "commercial_kitchen", sectors: ["restaurant", "hospitality", "education", "healthcare", "commercial"] },
  { contextTag: "food_service", sectors: ["restaurant", "hospitality", "education", "healthcare"] },
  { contextTag: "kitchen_hood", sectors: ["restaurant", "hospitality", "education", "healthcare"] },
  { contextTag: "walk_in_cooler_freezer", sectors: ["restaurant", "hospitality", "warehouse", "industrial", "agricultural"] },
  { contextTag: "grease_interceptor", sectors: ["restaurant", "hospitality", "education", "healthcare"] },
  { contextTag: "refrigeration", sectors: ["restaurant", "hospitality", "warehouse", "industrial", "agricultural"] },
  { contextTag: "cold_storage", sectors: ["warehouse", "industrial", "restaurant", "agricultural"] },
  { contextTag: "food_processing", sectors: ["industrial", "agricultural", "warehouse"] },

  { contextTag: "data_center", sectors: ["mission_critical", "office", "industrial", "warehouse"] },
  { contextTag: "historic_restoration", workTypes: ["restoration_adaptive_reuse"] },
  { contextTag: "structural_retrofit", workTypes: ["restoration_adaptive_reuse", "addition_expansion", "maintenance_repair"] },
  { contextTag: "change_of_use", workTypes: ["restoration_adaptive_reuse", "interior_fit_out_renovation"] },
  { contextTag: "tilt_up", sectors: ["warehouse", "industrial", "retail"], workTypes: ["ground_up_new_construction"] },
  { contextTag: "precast", sectors: ["warehouse", "industrial", "commercial", "multifamily"], workTypes: ["ground_up_new_construction", "core_and_shell"] },
  { contextTag: "pre_engineered_metal_building", sectors: ["warehouse", "industrial", "agricultural"], workTypes: ["ground_up_new_construction"] },
  { contextTag: "airport_secure_area", sectors: ["airport", "transportation"] },
  { contextTag: "marine_waterfront", sectors: ["marine"] },
  { contextTag: "flood_zone" },
  { contextTag: "sitework_scope", workTypes: ["ground_up_new_construction", "addition_expansion", "sitework_civil_only"] },
  { contextTag: "exterior_envelope_scope", workTypes: ["ground_up_new_construction", "core_and_shell", "addition_expansion", "restoration_adaptive_reuse", "maintenance_repair"] },
  { contextTag: "roof_work", workTypes: ["ground_up_new_construction", "core_and_shell", "addition_expansion", "restoration_adaptive_reuse", "maintenance_repair"] },

  { contextTag: "wood_framing", sectors: ["residential", "multifamily"] },
  { contextTag: "masonry_block_building", sectors: ["residential", "multifamily", "commercial"] },
  { contextTag: "kitchen_bath_renovation", sectors: ["residential", "multifamily"] },
  { contextTag: "appliances", sectors: ["residential", "multifamily", "hospitality"] },
  { contextTag: "siding_exterior_cladding", sectors: ["residential", "multifamily"], workTypes: ["ground_up_new_construction", "maintenance_repair", "restoration_adaptive_reuse"] },
  { contextTag: "windows_exterior_doors", sectors: ["residential", "multifamily"], workTypes: ["ground_up_new_construction", "maintenance_repair", "restoration_adaptive_reuse"] },
];
