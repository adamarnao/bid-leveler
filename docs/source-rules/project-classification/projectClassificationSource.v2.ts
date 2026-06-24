// Bid-Leveler Project Classification Source v2.
// Planning/source file. Codex should implement from this, not invent parallel classification rules.
// Project Classification is one section inside the larger Project Profile source-of-truth model.

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

export type ProjectFacilityTypeTag =
  | "general_office"
  | "corporate_office"
  | "professional_office"
  | "bank_branch"
  | "call_center"
  | "coworking"
  | "medical_office_facility"
  | "clinic"
  | "surgery_center_facility"
  | "imaging_center"
  | "hospital_facility"
  | "dental"
  | "veterinary"
  | "quick_service_restaurant"
  | "full_service_restaurant"
  | "bar_lounge"
  | "cafe"
  | "ghost_kitchen"
  | "commercial_kitchen_only"
  | "dry_warehouse"
  | "cold_storage_facility"
  | "distribution_center"
  | "flex_warehouse"
  | "manufacturing_warehouse"
  | "single_family"
  | "townhouse"
  | "apartment_unit"
  | "common_area"
  | "clubhouse_amenity"
  | "mixed_use_residential";

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
  // Aliases are search/parsing/help metadata only. They are never runtime IDs and must not create alternate behavior paths.
  aliases?: string[];
  searchKeywords?: string[];
  sortOrder: number;
};

export type SectorWorkTypeLabel = {
  sector: ProjectSectorTag;
  workType: ProjectWorkTypeTag;
  label: string;
  // Optional search/help metadata. UI should display one best sector-specific label, not all aliases.
  aliases?: string[];
  searchKeywords?: string[];
};

export type FacilityTypeAvailability = {
  sector: ProjectSectorTag;
  facilityTypes: ProjectFacilityTypeTag[];
};

export type ContextTagAvailability = {
  contextTag: ProjectContextTag;
  sectors?: ProjectSectorTag[];
  facilityTypes?: ProjectFacilityTypeTag[];
  workTypes?: ProjectWorkTypeTag[];
  requiresAnyContext?: ProjectContextTag[];
  hiddenByDefault?: boolean;
};

export type ProjectClassification = {
  sector?: ProjectSectorTag;
  facilityType?: ProjectFacilityTypeTag;
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

export const PROJECT_FACILITY_TYPES: ClassificationOption<ProjectFacilityTypeTag>[] = [
  { id: "general_office", label: "General Office", description: "General office space without a more specific facility subtype.", sortOrder: 10 },
  { id: "corporate_office", label: "Corporate Office", description: "Corporate headquarters, administrative offices, and corporate workplace environments.", sortOrder: 20 },
  { id: "professional_office", label: "Professional Office", description: "Professional service offices such as legal, accounting, consulting, or similar tenant spaces.", sortOrder: 30 },
  { id: "bank_branch", label: "Bank Branch", description: "Retail banking, credit union, teller, vault, or financial service branch spaces.", sortOrder: 40 },
  { id: "call_center", label: "Call Center", description: "Call center, contact center, support center, or high-density workstation environment.", sortOrder: 50 },
  { id: "coworking", label: "Coworking", description: "Coworking, shared office, flexible suite, or serviced workplace environment.", sortOrder: 60 },

  { id: "medical_office_facility", label: "Medical Office", description: "Medical office building, outpatient medical suite, or similar healthcare office facility.", sortOrder: 110 },
  { id: "clinic", label: "Clinic", description: "Clinic, outpatient clinic, urgent care, or ambulatory care facility.", sortOrder: 120 },
  { id: "surgery_center_facility", label: "Surgery Center", description: "Surgery center or ambulatory surgical facility.", sortOrder: 130 },
  { id: "imaging_center", label: "Imaging Center", description: "Imaging, radiology, MRI, CT, X-ray, or diagnostic imaging facility.", sortOrder: 140 },
  { id: "hospital_facility", label: "Hospital", description: "Hospital, inpatient care, acute care, or hospital department project.", sortOrder: 150 },
  { id: "dental", label: "Dental", description: "Dental, orthodontic, oral surgery, or dental specialty facility.", sortOrder: 160 },
  { id: "veterinary", label: "Veterinary", description: "Veterinary clinic, animal hospital, or animal care facility.", sortOrder: 170 },

  { id: "quick_service_restaurant", label: "Quick Service", description: "Quick service restaurant, fast casual, counter service, or takeout-focused restaurant.", sortOrder: 210 },
  { id: "full_service_restaurant", label: "Full Service", description: "Full service dining, table service restaurant, or similar food service space.", sortOrder: 220 },
  { id: "bar_lounge", label: "Bar / Lounge", description: "Bar, lounge, tavern, tasting room, or beverage-focused hospitality space.", sortOrder: 230 },
  { id: "cafe", label: "Cafe", description: "Cafe, coffee shop, bakery cafe, or light food service tenant space.", sortOrder: 240 },
  { id: "ghost_kitchen", label: "Ghost Kitchen", description: "Delivery-only kitchen, commissary kitchen, or multi-brand kitchen facility.", sortOrder: 250 },
  { id: "commercial_kitchen_only", label: "Commercial Kitchen Only", description: "Commercial kitchen scope without a public dining or sales area.", sortOrder: 260 },

  { id: "dry_warehouse", label: "Dry Warehouse", description: "Dry storage, general warehouse, or non-refrigerated storage facility.", sortOrder: 310 },
  { id: "cold_storage_facility", label: "Cold Storage", description: "Cold storage, refrigerated warehouse, freezer, or controlled temperature facility.", sortOrder: 320 },
  { id: "distribution_center", label: "Distribution Center", description: "Distribution, logistics, fulfillment, shipping, or receiving center.", sortOrder: 330 },
  { id: "flex_warehouse", label: "Flex Warehouse", description: "Flex warehouse with office, light industrial, showroom, or mixed warehouse uses.", sortOrder: 340 },
  { id: "manufacturing_warehouse", label: "Manufacturing Warehouse", description: "Manufacturing, production, assembly, or warehouse-production facility.", sortOrder: 350 },

  { id: "single_family", label: "Single Family", description: "Single-family residential project or custom home.", sortOrder: 410 },
  { id: "townhouse", label: "Townhouse", description: "Townhome, rowhouse, or attached residential unit project.", sortOrder: 420 },
  { id: "apartment_unit", label: "Apartment Unit", description: "Apartment unit, residential unit, or unit-level renovation.", sortOrder: 430 },
  { id: "common_area", label: "Common Area", description: "Residential or multifamily common area such as corridors, lobby, leasing, or shared support space.", sortOrder: 440 },
  { id: "clubhouse_amenity", label: "Clubhouse / Amenity", description: "Clubhouse, amenity, fitness, pool house, or residential amenity space.", sortOrder: 450 },
  { id: "mixed_use_residential", label: "Mixed-Use Residential", description: "Residential project mixed with retail, office, parking, amenity, or other uses.", sortOrder: 460 },
];

export const FACILITY_TYPE_AVAILABILITY_BY_SECTOR: FacilityTypeAvailability[] = [
  {
    sector: "office",
    facilityTypes: ["general_office", "corporate_office", "professional_office", "bank_branch", "call_center", "coworking"],
  },
  {
    sector: "healthcare",
    facilityTypes: ["medical_office_facility", "clinic", "surgery_center_facility", "imaging_center", "hospital_facility", "dental", "veterinary"],
  },
  {
    sector: "restaurant",
    facilityTypes: ["quick_service_restaurant", "full_service_restaurant", "bar_lounge", "cafe", "ghost_kitchen", "commercial_kitchen_only"],
  },
  {
    sector: "warehouse",
    facilityTypes: ["dry_warehouse", "cold_storage_facility", "distribution_center", "flex_warehouse", "manufacturing_warehouse"],
  },
  {
    sector: "residential",
    facilityTypes: ["single_family", "townhouse", "mixed_use_residential"],
  },
  {
    sector: "multifamily",
    facilityTypes: ["apartment_unit", "common_area", "clubhouse_amenity", "mixed_use_residential"],
  },
];

export function getFacilityTypeOptionsForSector(
  sector: ProjectSectorTag,
): ClassificationOption<ProjectFacilityTypeTag>[] {
  const availability = FACILITY_TYPE_AVAILABILITY_BY_SECTOR.find((entry) => entry.sector === sector);

  if (!availability) {
    return [];
  }

  return PROJECT_FACILITY_TYPES.filter((option) => availability.facilityTypes.includes(option.id)).sort(
    (leftOption, rightOption) => leftOption.sortOrder - rightOption.sortOrder,
  );
}

export const PROJECT_WORK_TYPES: ClassificationOption<ProjectWorkTypeTag>[] = [
  {
    id: "interior_fit_out_renovation",
    label: "Interior Fit-Out / Renovation",
    description: "Interior work inside an existing building or shell. Includes tenant improvement, fit-out, build-out, interior renovation, remodel, and similar work.",
    aliases: [
      "Tenant Improvement",
      "TI",
      "Tenant Build-Out",
      "Build-Out",
      "Buildout",
      "Fit-Out",
      "Fitout",
      "Interior Renovation",
      "Interior Remodel",
      "Remodel",
    ],
    searchKeywords: ["tenant suite", "interior work", "existing building", "interior construction", "build out", "tenant finish"],
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
  {
    sector: "office",
    workType: "interior_fit_out_renovation",
    label: "Tenant Improvement / Interior Fit-Out",
    aliases: ["Office TI", "Office Build-Out", "Tenant Fit-Out"],
    searchKeywords: ["tenant build-out", "fit-out", "interior renovation"],
  },
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
