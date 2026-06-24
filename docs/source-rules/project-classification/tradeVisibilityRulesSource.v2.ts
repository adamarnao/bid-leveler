// Bid-Leveler Trade Visibility Source v2.
// Planning/source file. tradeId values must later be aligned with live taxonomy IDs.

import type {
  ProjectContextTag,
  ProjectFacilityTypeTag,
  ProjectSectorTag,
  ProjectWorkTypeTag,
} from "./projectClassificationSource.v2";

export type TradeVisibilityLevel =
  | "CORE"
  | "SUGGESTED"
  | "CONTEXTUAL"
  | "HIDDEN"
  | "EXCLUDED";

export type TradeVisibilityProfile = {
  id: string;
  label: string;
  sector?: ProjectSectorTag;
  facilityType?: ProjectFacilityTypeTag;
  workType?: ProjectWorkTypeTag;
  contextTags?: ProjectContextTag[];
  coreTradeIds: string[];
  suggestedTradeIds: string[];
  contextualTradeIds: string[];
  hiddenTradeIds: string[];
  excludedTradeIds: string[];
  notes: string[];
};

export const OFFICE_TI_PROFILE: TradeVisibilityProfile = {
  id: "office-interior-fit-out-renovation",
  label: "Office + Tenant Improvement / Interior Fit-Out",
  sector: "office",
  workType: "interior_fit_out_renovation",
  coreTradeIds: [
    "existing-conditions-selective-demolition",
    "drywall-framing",
    "ceilings",
    "flooring",
    "wall-finishes",
    "doors-frames-hardware",
    "glass-glazing",
    "finish-carpentry-millwork",
    "cabinets-casework",
    "countertops",
    "basic-specialties",
    "fire-protection",
    "plumbing",
    "hvac",
    "electrical",
    "low-voltage-technology",
  ],
  suggestedTradeIds: [
    "window-treatments",
    "furnishings-ffe",
    "access-control-security",
    "acoustic-panels",
  ],
  contextualTradeIds: [
    "temporary-protection",
    "phasing-night-work",
    "security-access-coordination",
  ],
  hiddenTradeIds: [
    "sitework-civil",
    "concrete",
    "masonry",
    "structural-steel",
    "roofing",
    "overhead-doors",
    "full-building-demolition",
    "hazardous-materials-abatement",
    "food-service",
    "medical-gas",
    "cleanroom",
    "process-systems",
    "airport-airfield",
    "marine-waterfront",
    "railroad-transit",
  ],
  excludedTradeIds: [],
  notes: [
    "Office TI should stay interior-focused. Site, structure, envelope, and specialty sector trades are hidden unless context triggers them.",
    "Selective/interior demolition is core. Full building demolition is not core.",
  ],
};

export const RESIDENTIAL_REMODEL_PROFILE: TradeVisibilityProfile = {
  id: "residential-interior-fit-out-renovation",
  label: "Residential + Renovation / Remodel",
  sector: "residential",
  workType: "interior_fit_out_renovation",
  coreTradeIds: [
    "existing-conditions-selective-demolition",
    "rough-carpentry-wood-framing",
    "drywall-gypsum-board",
    "finish-carpentry-trim-millwork",
    "cabinets-casework",
    "countertops",
    "doors-hardware",
    "flooring",
    "tile",
    "painting-wall-finishes",
    "plumbing",
    "hvac",
    "electrical",
    "appliances",
  ],
  suggestedTradeIds: [
    "insulation",
    "waterproofing",
    "bath-accessories",
    "closet-shelving",
    "window-treatments",
    "low-voltage-security",
    "windows-exterior-doors",
    "roofing",
    "siding-exterior-cladding",
  ],
  contextualTradeIds: [
    "masonry-block-building",
    "sitework-landscaping",
  ],
  hiddenTradeIds: [
    "non-structural-metal-framing",
    "act-ceilings",
    "structural-steel",
    "storefront-curtain-wall",
    "heavy-civil-sitework",
    "medical-gas",
    "food-service",
    "cleanroom",
    "laboratory",
    "process-systems",
  ],
  excludedTradeIds: [],
  notes: [
    "Residential remodel should not assume metal stud framing or ACT ceilings.",
    "Wood/stick framing, cabinets, countertops, tile, doors, flooring, appliances, and MEP modifications are more typical.",
  ],
};

export const MULTIFAMILY_UNIT_RENOVATION_PROFILE: TradeVisibilityProfile = {
  ...RESIDENTIAL_REMODEL_PROFILE,
  id: "multifamily-unit-renovation",
  label: "Multifamily + Unit Renovation / Remodel",
  sector: "multifamily",
  notes: [
    "Multifamily unit renovation is similar to residential remodel, but may also include common area, fire protection, access control, and elevator coordination depending scope.",
  ],
};

export const HEALTHCARE_MEDICAL_OFFICE_TI_PROFILE: TradeVisibilityProfile = {
  id: "healthcare-medical-office-interior-fit-out-renovation",
  label: "Healthcare + Medical Office TI / Renovation",
  sector: "healthcare",
  facilityType: "medical_office_facility",
  workType: "interior_fit_out_renovation",
  coreTradeIds: [
    ...OFFICE_TI_PROFILE.coreTradeIds,
    "medical-gas",
    "nurse-call",
    "icra-infection-control",
  ],
  suggestedTradeIds: [
    "medical-equipment",
    "imaging-equipment-support",
    "lead-lined-construction",
    "radiation-shielding",
    "pneumatic-tubes",
  ],
  contextualTradeIds: [
    "surgery-center",
    "imaging",
    "hospital",
  ],
  hiddenTradeIds: [
    "sitework-civil",
    "structural-steel",
    "food-service",
    "process-systems",
    "airport-airfield",
    "marine-waterfront",
  ],
  excludedTradeIds: [],
  notes: [
    "Medical office TI should start like office TI, then add healthcare systems when context indicates them.",
    "Medical Gas and Nurse Call should not be buried under generic Plumbing/Low Voltage when healthcare context is active.",
  ],
};

export const RESTAURANT_COMMERCIAL_KITCHEN_TI_PROFILE: TradeVisibilityProfile = {
  id: "restaurant-commercial-kitchen-interior-fit-out-renovation",
  label: "Restaurant + Build-Out / Renovation + Commercial Kitchen",
  sector: "restaurant",
  facilityType: "commercial_kitchen_only",
  workType: "interior_fit_out_renovation",
  contextTags: ["commercial_kitchen"],
  coreTradeIds: [
    "existing-conditions-selective-demolition",
    "drywall-framing",
    "ceilings",
    "flooring",
    "wall-finishes",
    "doors-frames-hardware",
    "glass-glazing",
    "basic-specialties",
    "food-service",
    "commercial-kitchen-equipment",
    "kitchen-hood",
    "kitchen-exhaust",
    "kitchen-hood-fire-suppression",
    "grease-interceptor",
    "walk-in-cooler-freezer",
    "refrigeration",
    "fire-protection",
    "plumbing",
    "hvac",
    "electrical",
    "low-voltage-technology",
  ],
  suggestedTradeIds: [
    "finish-carpentry-millwork",
    "countertops",
    "signage",
    "furnishings-ffe",
  ],
  contextualTradeIds: [
    "grease-duct",
    "food-processing",
  ],
  hiddenTradeIds: [
    "sitework-civil",
    "concrete",
    "masonry",
    "structural-steel",
    "roofing",
    "healthcare",
    "laboratory-cleanroom",
    "process-systems",
  ],
  excludedTradeIds: [],
  notes: [
    "Food Service Equipment should not collapse into HVAC simply because kitchen exhaust is present.",
    "Kitchen Hood Fire Suppression belongs closer to Fire Protection than generic HVAC.",
  ],
};

export const CIVIL_SITEWORK_ONLY_PROFILE: TradeVisibilityProfile = {
  id: "civil-sitework-only",
  label: "Civil / Sitework + Sitework Only",
  sector: "civil_sitework",
  workType: "sitework_civil_only",
  coreTradeIds: [
    "sitework-civil",
    "clearing-grubbing",
    "earthwork",
    "excavation",
    "grading",
    "erosion-control",
    "site-utilities",
    "storm-drainage",
    "sanitary-sewer",
    "water-service",
    "asphalt-paving",
    "concrete-paving",
    "curbs-sidewalks",
    "landscaping",
    "irrigation",
    "fencing-gates",
  ],
  suggestedTradeIds: [
    "dewatering",
    "shoring-sheeting",
    "traffic-control",
    "traffic-signals",
    "retaining-walls",
    "hardscape-pavers",
    "site-furnishings",
  ],
  contextualTradeIds: [
    "athletic-fields",
    "playgrounds",
    "synthetic-turf",
  ],
  hiddenTradeIds: [
    "drywall-framing",
    "ceilings",
    "flooring",
    "wall-finishes",
    "doors-frames-hardware",
    "plumbing",
    "hvac",
    "electrical",
    "low-voltage-technology",
  ],
  excludedTradeIds: [],
  notes: ["Sitework-only should not show the full building trade stack by default."],
};

export const INITIAL_TRADE_VISIBILITY_PROFILES: TradeVisibilityProfile[] = [
  OFFICE_TI_PROFILE,
  RESIDENTIAL_REMODEL_PROFILE,
  MULTIFAMILY_UNIT_RENOVATION_PROFILE,
  HEALTHCARE_MEDICAL_OFFICE_TI_PROFILE,
  RESTAURANT_COMMERCIAL_KITCHEN_TI_PROFILE,
  CIVIL_SITEWORK_ONLY_PROFILE,
];
