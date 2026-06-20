import {
  ProjectContextTag,
  ProjectSectorTag,
  ProjectWorkTypeTag,
  TradeTaxonomyNode,
  TradeVisibilityContext,
} from "./types";

type TradeSpecializationInput = {
  id: string;
  name: string;
  aliases?: string[];
  description?: string;
  sortOrder: number;
  canBeBidPackage?: boolean;
  defaultPackageMode?: TradeTaxonomyNode["defaultPackageMode"];
  defaultScopeNotes?: string[];
  defaultExclusions?: string[];
  isCommon?: boolean;
  defaultHidden?: boolean;
  sectorTags?: TradeTaxonomyNode["sectorTags"];
  workTypeTags?: TradeTaxonomyNode["workTypeTags"];
  contextTags?: TradeTaxonomyNode["contextTags"];
  specialtyTags?: TradeTaxonomyNode["specialtyTags"];
  relatedTradeIds?: string[];
  splitRecommendation?: string;
  estimatingNotes?: string;
};

const workTypeTriggeredTradeIds: Partial<Record<ProjectWorkTypeTag, string[]>> = {
  tenant_improvement: [
    "specialties",
    "countertops",
    "wallcovering",
    "decorative-finishes",
    "operable-partitions",
    "accordion-folding-partitions",
    "window-treatments",
    "blinds-shades",
    "systems-furniture",
  ],
  fit_out: [
    "specialties",
    "countertops",
    "wallcovering",
    "decorative-finishes",
    "window-treatments",
    "blinds-shades",
  ],
  build_out: [
    "specialties",
    "countertops",
    "wallcovering",
    "decorative-finishes",
    "window-treatments",
    "blinds-shades",
  ],
  interior_renovation: [
    "specialties",
    "hazardous-materials-abatement",
    "asbestos-abatement",
    "lead-paint-abatement",
    "mold-remediation",
    "wallcovering",
    "decorative-finishes",
  ],
  occupied_renovation: [
    "specialties",
    "hazardous-materials-abatement",
    "asbestos-abatement",
    "lead-paint-abatement",
    "mold-remediation",
    "temporary-protection",
  ],
  ground_up: ["conveying", "elevators", "fire-pump", "standpipes"],
  core_and_shell: ["conveying", "elevators", "fire-pump", "standpipes"],
  shell_completion: ["specialties", "conveying", "elevators"],
  white_box: ["specialties", "window-treatments", "blinds-shades"],
  addition: ["conveying", "elevators", "fire-pump", "standpipes"],
  remodel: ["specialties", "hazardous-materials-abatement", "asbestos-abatement"],
  adaptive_reuse: [
    "specialties",
    "hazardous-materials-abatement",
    "asbestos-abatement",
    "lead-paint-abatement",
    "mold-remediation",
    "building-relocation-salvage",
  ],
  restoration: [
    "masonry-restoration",
    "tuckpointing-repointing",
    "hazardous-materials-abatement",
    "asbestos-abatement",
    "lead-paint-abatement",
  ],
  sitework_only: [
    "soil-stabilization",
    "dewatering",
    "shoring-sheeting",
    "traffic-control",
    "traffic-signals",
  ],
  demolition_only: [
    "hazardous-materials-abatement",
    "asbestos-abatement",
    "lead-paint-abatement",
    "mold-remediation",
    "pcb-mercury-universal-waste-removal",
    "underground-storage-tank-removal",
    "building-relocation-salvage",
  ],
  maintenance_repair: ["concrete-repair-restoration", "masonry-restoration"],
  phased_renovation: [
    "specialties",
    "hazardous-materials-abatement",
    "asbestos-abatement",
    "temporary-protection",
  ],
};

const contextTriggeredTradeIds: Partial<Record<ProjectContextTag, string[]>> = {
  medical_office: [
    "healthcare-systems",
    "equipment",
    "medical-gas",
    "nurse-call",
    "medical-equipment",
    "imaging-equipment-support",
    "clean-agent-fire-suppression",
    "cubicle-curtains-tracks",
  ],
  hospital: [
    "healthcare-systems",
    "equipment",
    "conveying",
    "medical-gas",
    "nurse-call",
    "pneumatic-tube-systems",
    "radiation-shielding",
    "lead-lined-construction",
    "imaging-equipment-support",
    "icra-infection-control",
    "clean-agent-fire-suppression",
    "emergency-power",
    "generator",
    "ups",
  ],
  surgery_center: [
    "healthcare-systems",
    "equipment",
    "medical-gas",
    "nurse-call",
    "clean-agent-fire-suppression",
    "icra-infection-control",
  ],
  imaging: [
    "equipment",
    "radiation-shielding",
    "lead-lined-construction",
    "imaging-equipment-support",
    "medical-equipment",
    "healthcare-systems",
  ],
  lab: [
    "laboratory-cleanroom-systems",
    "laboratory-equipment",
    "medical-gas",
    "compressed-air",
    "vacuum-systems",
    "plumbing-process-piping",
    "lab-exhaust",
  ],
  cleanroom: [
    "laboratory-cleanroom-systems",
    "process-systems",
    "high-speed-doors",
    "high-performance-coatings",
    "lab-exhaust",
  ],
  commercial_kitchen: [
    "equipment",
    "food-service-systems",
    "food-service-equipment",
    "commercial-kitchen-equipment",
    "kitchen-hood",
    "kitchen-exhaust",
    "grease-duct",
    "kitchen-hood-fire-suppression",
    "grease-interceptors",
    "walk-in-coolers-freezers",
    "refrigeration",
  ],
  occupied_building: ["temporary-protection", "final-cleaning"],
  night_work: ["temporary-protection", "site-safety"],
  public_bid: ["permits-fees", "bonds-insurance"],
  prevailing_wage: ["general-requirements"],
  secure_facility: [
    "security-hardening-ballistic-protection",
    "intrusion-detection",
    "access-control",
    "detention-equipment",
  ],
  high_rise: ["conveying", "elevators", "fire-pump", "standpipes"],
  tilt_up: ["tilt-up-concrete", "precast-concrete"],
  precast: ["precast-concrete"],
  pre_engineered_metal_building: ["structural-steel"],
  cold_storage: [
    "rigid-insulation",
    "refrigerant-piping",
    "high-speed-doors",
    "walk-in-coolers-freezers",
    "refrigeration",
  ],
  food_processing: [
    "equipment",
    "food-service-systems",
    "process-systems",
    "grease-interceptors",
    "walk-in-coolers-freezers",
    "refrigeration",
    "high-performance-coatings",
    "frp-panels",
  ],
  data_center: [
    "clean-agent-fire-suppression",
    "emergency-power",
    "generator",
    "ups",
    "controls",
    "das-cellular-enhancement",
  ],
  airport_secure_area: ["airport-airfield", "security-hardening-ballistic-protection"],
  marine_waterfront: ["marine-waterfront", "shotcrete", "oil-gas-fuel-systems"],
  historic_restoration: [
    "masonry-restoration",
    "tuckpointing-repointing",
    "lead-paint-abatement",
  ],
  flood_zone: ["waterproofing", "dewatering"],
  infection_control: ["healthcare-systems", "icra-infection-control", "temporary-protection"],
};

const officeTenantImprovementSuppressedTradeIds = new Set([
  "sitework",
  "concrete",
  "masonry",
  "structural-steel",
  "roofing",
  "overhead-doors",
]);

const siteworkOnlySuppressedTradeIds = new Set([
  "concrete",
  "masonry",
  "structural-steel",
  "misc-metals",
  "rough-carpentry",
  "finish-carpentry-millwork",
  "waterproofing",
  "insulation",
  "roofing",
  "doors-frames-hardware",
  "overhead-doors",
  "glass-glazing",
  "drywall-framing",
  "ceilings",
  "flooring",
  "wall-finishes",
  "specialties",
  "equipment",
  "furnishings-ffe",
  "conveying",
  "fire-protection",
  "plumbing",
  "hvac",
  "electrical",
  "low-voltage-technology",
]);

function createTradeSpecializations(
  parentId: string,
  defaults: Partial<TradeTaxonomyNode>,
  entries: TradeSpecializationInput[]
): TradeTaxonomyNode[] {
  return entries.map((entry) => ({
    parentId,
    canBeBidPackage: true,
    defaultPackageMode: "USER_CHOICE",
    isActive: true,
    ...defaults,
    ...entry,
  }));
}

export const defaultTradeTaxonomy: TradeTaxonomyNode[] = [
  {
    id: "general-requirements",
    name: "General Conditions / Project Requirements",
    aliases: ["General Requirements", "General Conditions", "Division 01"],
    description: "Project-wide requirements, temporary facilities, supervision, and administrative scope.",
    sortOrder: 10,
    canBeBidPackage: false,
    defaultPackageMode: "UMBRELLA",
    defaultScopeNotes: ["Track as GC cost or project requirement scope, not ordinary subcontractor bid scope."],
    isActive: true,
    isCommon: true,
    sectorTags: ["commercial", "education", "healthcare", "industrial", "office", "retail"],
    specialtyTags: ["core", "gc_cost"],
    estimatingNotes:
      "Often carried as GC cost or general conditions unless the project requires separate subcontractor pricing.",
  },
  ...createTradeSpecializations(
    "general-requirements",
    {
      canBeBidPackage: false,
      defaultPackageMode: "UMBRELLA",
      isCommon: true,
      sectorTags: ["commercial", "education", "healthcare", "industrial", "office", "retail"],
      specialtyTags: ["gc_cost"],
    },
    [
      { id: "supervision", name: "Supervision", aliases: ["Field Supervision"], sortOrder: 11 },
      { id: "temporary-facilities", name: "Temporary Facilities", aliases: ["Temp Facilities"], sortOrder: 12 },
      { id: "temporary-utilities", name: "Temporary Utilities", aliases: ["Temp Utilities"], sortOrder: 13 },
      { id: "site-safety", name: "Site Safety", aliases: ["Safety"], sortOrder: 14 },
      { id: "dumpsters-waste-management", name: "Dumpsters / Waste Management", aliases: ["Waste Management", "Dumpsters"], sortOrder: 15 },
      { id: "final-cleaning", name: "Final Cleaning", aliases: ["Cleaning"], sortOrder: 16 },
      { id: "temporary-protection", name: "Temporary Protection", aliases: ["Temp Protection"], sortOrder: 17 },
      { id: "hoisting-cranes-lifts", name: "Hoisting / Cranes / Lifts", aliases: ["Hoisting", "Cranes", "Lifts"], sortOrder: 18 },
      { id: "scaffolding", name: "Scaffolding", sortOrder: 19, specialtyTags: ["gc_cost", "cross_trade"], relatedTradeIds: ["masonry", "painting-coatings"] },
      { id: "layout-survey", name: "Layout / Survey", aliases: ["Survey", "Construction Layout"], sortOrder: 20 },
      { id: "testing-inspections", name: "Testing & Inspections", aliases: ["Testing", "Inspections"], sortOrder: 21 },
      { id: "commissioning", name: "Commissioning", aliases: ["Cx"], sortOrder: 22, specialtyTags: ["gc_cost", "specialty"], sectorTags: ["healthcare", "laboratory", "mission_critical", "commercial"] },
      { id: "permits-fees", name: "Permits / Fees", aliases: ["Permits", "Fees"], sortOrder: 23 },
      { id: "bonds-insurance", name: "Bonds / Insurance", aliases: ["Bonding", "Insurance"], sortOrder: 24 },
      { id: "winter-conditions-weather-protection", name: "Winter Conditions / Weather Protection", aliases: ["Winter Conditions", "Weather Protection"], sortOrder: 25 },
      { id: "security-temporary-fencing", name: "Security / Temporary Fencing", aliases: ["Temporary Fencing", "Site Security"], sortOrder: 26 },
      { id: "mobilization-demobilization", name: "Mobilization / Demobilization", aliases: ["Mobilization", "Demobilization"], sortOrder: 27 },
    ]
  ),
  {
    id: "demolition",
    name: "Existing Conditions / Demolition",
    aliases: ["Demo", "Existing Conditions", "Selective Demolition", "Site Demolition"],
    sortOrder: 15,
    canBeBidPackage: true,
    defaultPackageMode: "USER_CHOICE",
    isActive: true,
    isCommon: true,
    sectorTags: ["commercial", "industrial", "sitework", "civil", "retail", "office"],
    specialtyTags: ["core", "alternate_candidate"],
    relatedTradeIds: ["earthwork", "concrete"],
    splitRecommendation:
      "Demolition may be its own package or split by abatement, concrete cutting, salvage, or earthwork scope.",
  },
  ...createTradeSpecializations(
    "demolition",
    {
      defaultPackageMode: "USER_CHOICE",
      sectorTags: ["commercial", "industrial", "sitework", "civil", "retail", "office"],
      specialtyTags: ["core"],
    },
    [
      { id: "selective-demolition", name: "Selective Demolition", aliases: ["Selective Demo"], sortOrder: 151, isCommon: true },
      { id: "full-building-demolition", name: "Full Building Demolition", aliases: ["Building Demolition"], sortOrder: 152 },
      { id: "interior-demolition", name: "Interior Demolition", aliases: ["Interior Demo"], sortOrder: 153, isCommon: true },
      { id: "concrete-sawcutting-coring", name: "Concrete Sawcutting / Coring", aliases: ["Sawcutting", "Core Drilling", "Coring"], sortOrder: 154, relatedTradeIds: ["concrete"] },
      { id: "hazardous-materials-abatement", name: "Hazardous Materials Abatement", aliases: ["Hazmat Abatement"], sortOrder: 155, defaultHidden: true, specialtyTags: ["specialty", "sector_specific"] },
      { id: "asbestos-abatement", name: "Asbestos Abatement", sortOrder: 156, defaultHidden: true, specialtyTags: ["specialty", "sector_specific"] },
      { id: "lead-paint-abatement", name: "Lead Paint Abatement", sortOrder: 157, defaultHidden: true, specialtyTags: ["specialty", "sector_specific"] },
      { id: "mold-remediation", name: "Mold Remediation", sortOrder: 158, defaultHidden: true, specialtyTags: ["specialty", "sector_specific"] },
      { id: "pcb-mercury-universal-waste-removal", name: "PCB / Mercury / Universal Waste Removal", aliases: ["Universal Waste Removal"], sortOrder: 159, defaultHidden: true, specialtyTags: ["specialty", "sector_specific"] },
      { id: "underground-storage-tank-removal", name: "Underground Storage Tank Removal", aliases: ["UST Removal"], sortOrder: 160, defaultHidden: true, sectorTags: ["industrial", "sitework", "civil"], specialtyTags: ["specialty", "sector_specific"] },
      { id: "building-relocation-salvage", name: "Building Relocation / Salvage", aliases: ["Salvage", "Relocation"], sortOrder: 161, defaultHidden: true, specialtyTags: ["specialty", "owner_vendor"] },
    ]
  ),
  {
    id: "sitework",
    name: "Sitework / Civil",
    aliases: ["Civil", "Site"],
    description: "Exterior site, civil, earthwork, utilities, paving, and landscape scope.",
    sortOrder: 20,
    canBeBidPackage: true,
    defaultPackageMode: "SPLIT_BY_CHILD",
    defaultScopeNotes: ["Split sitework by specialization when the project has meaningful civil scope separation."],
    isActive: true,
    isCommon: true,
    sectorTags: ["civil", "sitework", "commercial", "industrial", "warehouse"],
    specialtyTags: ["core"],
    splitRecommendation:
      "Split into sitework specializations when demolition, earthwork, utilities, paving, or landscaping are material scopes.",
  },
  {
    id: "earthwork",
    parentId: "sitework",
    name: "Earthwork",
    aliases: ["Excavation", "Grading", "Site Prep"],
    sortOrder: 22,
    canBeBidPackage: true,
    defaultPackageMode: "UMBRELLA",
    isActive: true,
    isCommon: true,
    sectorTags: ["civil", "sitework", "commercial", "industrial", "warehouse"],
    specialtyTags: ["core"],
  },
  {
    id: "utilities",
    parentId: "sitework",
    name: "Utilities",
    aliases: ["Site Utilities", "Wet Utilities", "Dry Utilities"],
    sortOrder: 23,
    canBeBidPackage: true,
    defaultPackageMode: "USER_CHOICE",
    isActive: true,
    isCommon: true,
    sectorTags: ["civil", "sitework", "industrial", "warehouse", "government"],
    specialtyTags: ["core", "cross_trade"],
    splitRecommendation:
      "Wet utilities, dry utilities, and utility company work may need separate packages or allowances.",
  },
  {
    id: "asphalt-paving",
    parentId: "sitework",
    name: "Asphalt / Paving",
    aliases: ["Paving", "Pavement", "Striping"],
    sortOrder: 24,
    canBeBidPackage: true,
    defaultPackageMode: "UMBRELLA",
    isActive: true,
    isCommon: true,
    sectorTags: ["civil", "sitework", "commercial", "retail", "industrial", "warehouse"],
    specialtyTags: ["core"],
  },
  {
    id: "landscaping",
    parentId: "sitework",
    name: "Landscaping",
    aliases: ["Landscape", "Planting", "Irrigation"],
    sortOrder: 25,
    canBeBidPackage: true,
    defaultPackageMode: "UMBRELLA",
    isActive: true,
    isCommon: true,
    sectorTags: ["civil", "sitework", "commercial", "hospitality", "education", "retail"],
    specialtyTags: ["core", "allowance_candidate"],
  },
  ...createTradeSpecializations(
    "sitework",
    {
      defaultPackageMode: "USER_CHOICE",
      sectorTags: ["civil", "sitework", "commercial", "industrial", "warehouse"],
      specialtyTags: ["core"],
    },
    [
      { id: "clearing-grubbing", name: "Clearing / Grubbing", aliases: ["Clearing", "Grubbing"], sortOrder: 21 },
      { id: "excavation", name: "Excavation", sortOrder: 23 },
      { id: "grading", name: "Grading", aliases: ["Fine Grading", "Rough Grading"], sortOrder: 24 },
      { id: "soil-stabilization", name: "Soil Stabilization", aliases: ["Ground Improvement"], sortOrder: 25, defaultHidden: true, specialtyTags: ["specialty", "sector_specific"] },
      { id: "erosion-control", name: "Erosion Control", aliases: ["SWPPP", "Sediment Control"], sortOrder: 26 },
      { id: "dewatering", name: "Dewatering", sortOrder: 27, defaultHidden: true, specialtyTags: ["specialty", "sector_specific"] },
      { id: "shoring-sheeting", name: "Shoring / Sheeting", aliases: ["Sheeting", "Excavation Support"], sortOrder: 28, defaultHidden: true, specialtyTags: ["specialty", "sector_specific"] },
      { id: "site-utilities", name: "Site Utilities", aliases: ["Civil Utilities"], sortOrder: 29, relatedTradeIds: ["utilities"] },
      { id: "storm-drainage", name: "Storm Drainage", aliases: ["Storm Sewer"], sortOrder: 30, relatedTradeIds: ["utilities"] },
      { id: "sanitary-sewer", name: "Sanitary Sewer", sortOrder: 31, relatedTradeIds: ["utilities"] },
      { id: "water-service", name: "Water Service", sortOrder: 32, relatedTradeIds: ["utilities"] },
      { id: "gas-service", name: "Gas Service", sortOrder: 33, relatedTradeIds: ["utilities", "plumbing"] },
      { id: "electrical-site-utilities", name: "Electrical Site Utilities", aliases: ["Site Electrical"], sortOrder: 34, relatedTradeIds: ["electrical", "utilities"], specialtyTags: ["core", "cross_trade"] },
      { id: "site-concrete", name: "Site Concrete", sortOrder: 35, relatedTradeIds: ["concrete"] },
      { id: "curbs-sidewalks", name: "Curbs / Sidewalks", aliases: ["Curb", "Sidewalks"], sortOrder: 36, relatedTradeIds: ["site-concrete", "concrete"] },
      { id: "concrete-paving", name: "Concrete Paving", sortOrder: 37, relatedTradeIds: ["concrete"] },
      { id: "striping-pavement-markings", name: "Striping / Pavement Markings", aliases: ["Striping", "Pavement Markings"], sortOrder: 38, relatedTradeIds: ["asphalt-paving"] },
      { id: "traffic-control", name: "Traffic Control", sortOrder: 39, defaultHidden: true, sectorTags: ["civil", "sitework", "transportation"], specialtyTags: ["specialty", "sector_specific"] },
      { id: "traffic-signals", name: "Traffic Signals", sortOrder: 40, defaultHidden: true, sectorTags: ["civil", "transportation", "government"], specialtyTags: ["specialty", "sector_specific"] },
      { id: "site-signage", name: "Site Signage", sortOrder: 41, relatedTradeIds: ["specialties"] },
      { id: "fencing-gates", name: "Fencing / Gates", aliases: ["Site Fencing", "Gates"], sortOrder: 42 },
      { id: "retaining-walls", name: "Retaining Walls", sortOrder: 43, relatedTradeIds: ["concrete", "masonry"] },
      { id: "irrigation", name: "Irrigation", sortOrder: 44, relatedTradeIds: ["landscaping"] },
      { id: "hardscape-pavers", name: "Hardscape / Pavers", aliases: ["Pavers", "Hardscape"], sortOrder: 45, relatedTradeIds: ["landscaping", "masonry"] },
      { id: "synthetic-turf", name: "Synthetic Turf", sortOrder: 46, defaultHidden: true, sectorTags: ["sports", "education", "commercial"], specialtyTags: ["specialty", "sector_specific"] },
      { id: "athletic-fields", name: "Athletic Fields", sortOrder: 47, defaultHidden: true, sectorTags: ["sports", "education"], specialtyTags: ["specialty", "sector_specific"] },
      { id: "playgrounds", name: "Playgrounds", sortOrder: 48, defaultHidden: true, sectorTags: ["education", "government", "residential", "multifamily"], specialtyTags: ["specialty", "sector_specific"] },
      { id: "site-furnishings", name: "Site Furnishings", aliases: ["Benches", "Bike Racks", "Trash Receptacles"], sortOrder: 49, specialtyTags: ["allowance_candidate", "specialty"] },
    ]
  ),
  {
    id: "concrete",
    name: "Concrete",
    aliases: ["Cast-in-Place Concrete", "Precast Concrete"],
    sortOrder: 30,
    canBeBidPackage: true,
    defaultPackageMode: "UMBRELLA",
    isActive: true,
    isCommon: true,
    sectorTags: ["commercial", "industrial", "warehouse", "education", "healthcare", "multifamily"],
    specialtyTags: ["core"],
  },
  {
    id: "cast-in-place-concrete",
    parentId: "concrete",
    name: "Cast-In-Place Concrete",
    aliases: ["CIP Concrete", "Cast in Place", "Concrete Slabs", "Foundations"],
    sortOrder: 31,
    canBeBidPackage: true,
    defaultPackageMode: "UMBRELLA",
    isActive: true,
    isCommon: true,
    sectorTags: ["commercial", "industrial", "warehouse", "education", "healthcare", "multifamily"],
    specialtyTags: ["core"],
  },
  {
    id: "tilt-up-concrete",
    parentId: "concrete",
    name: "Tilt-Up Concrete",
    aliases: ["Tilt Wall", "Tilt-Up Panels"],
    sortOrder: 32,
    canBeBidPackage: true,
    defaultPackageMode: "USER_CHOICE",
    isActive: true,
    defaultHidden: true,
    sectorTags: ["industrial", "warehouse"],
    specialtyTags: ["specialty", "sector_specific"],
  },
  {
    id: "precast-concrete",
    parentId: "concrete",
    name: "Precast Concrete",
    aliases: ["Precast", "Precast Panels", "Architectural Precast"],
    sortOrder: 33,
    canBeBidPackage: true,
    defaultPackageMode: "USER_CHOICE",
    isActive: true,
    defaultHidden: true,
    sectorTags: ["commercial", "industrial", "warehouse"],
    specialtyTags: ["specialty"],
  },
  {
    id: "shotcrete",
    parentId: "concrete",
    name: "Shotcrete",
    aliases: ["Gunite"],
    sortOrder: 34,
    canBeBidPackage: true,
    defaultPackageMode: "USER_CHOICE",
    isActive: true,
    defaultHidden: true,
    sectorTags: ["civil", "sitework", "transportation", "marine"],
    specialtyTags: ["specialty", "sector_specific"],
  },
  ...createTradeSpecializations(
    "concrete",
    {
      defaultPackageMode: "USER_CHOICE",
      sectorTags: ["commercial", "industrial", "warehouse", "education", "healthcare", "multifamily"],
      specialtyTags: ["core"],
    },
    [
      { id: "structural-concrete", name: "Structural Concrete", sortOrder: 35 },
      { id: "slabs-on-grade", name: "Slabs on Grade", aliases: ["SOG"], sortOrder: 36 },
      { id: "elevated-slabs", name: "Elevated Slabs", sortOrder: 37 },
      { id: "concrete-formwork", name: "Concrete Formwork", aliases: ["Formwork"], sortOrder: 38 },
      { id: "reinforcing-steel", name: "Reinforcing Steel", aliases: ["Rebar", "Reinforcement"], sortOrder: 39, relatedTradeIds: ["structural-steel"] },
      { id: "post-tensioning", name: "Post-Tensioning", aliases: ["PT"], sortOrder: 40, defaultHidden: true, specialtyTags: ["specialty", "sector_specific"] },
      { id: "concrete-finishing", name: "Concrete Finishing", sortOrder: 41 },
      { id: "polished-concrete", name: "Polished Concrete", sortOrder: 42, specialtyTags: ["specialty", "alternate_candidate"], relatedTradeIds: ["flooring"] },
      { id: "concrete-sealer-densifier", name: "Concrete Sealer / Densifier", aliases: ["Concrete Sealer", "Densifier"], sortOrder: 43, specialtyTags: ["specialty", "alternate_candidate"], relatedTradeIds: ["flooring", "painting-coatings"] },
      { id: "concrete-repair-restoration", name: "Concrete Repair / Restoration", aliases: ["Concrete Restoration"], sortOrder: 44, defaultHidden: true, specialtyTags: ["specialty", "sector_specific"] },
      { id: "grouting", name: "Grouting", sortOrder: 45, specialtyTags: ["specialty", "cross_trade"], relatedTradeIds: ["masonry", "structural-steel"] },
      { id: "lightweight-concrete", name: "Lightweight Concrete", sortOrder: 46, defaultHidden: true, specialtyTags: ["specialty", "sector_specific"] },
      { id: "gypsum-cement-underlayment", name: "Gypsum Cement Underlayment", aliases: ["Gypcrete", "Gypsum Underlayment"], sortOrder: 47, specialtyTags: ["specialty", "cross_trade"], relatedTradeIds: ["flooring"] },
    ]
  ),
  {
    id: "masonry",
    name: "Masonry",
    aliases: ["CMU", "Brick", "Stone Masonry"],
    sortOrder: 40,
    canBeBidPackage: true,
    defaultPackageMode: "UMBRELLA",
    isActive: true,
    isCommon: true,
    sectorTags: ["commercial", "education", "healthcare", "hospitality", "retail"],
    specialtyTags: ["core"],
  },
  {
    id: "cmu-brick-masonry",
    parentId: "masonry",
    name: "CMU / Brick Masonry",
    aliases: ["CMU", "Brick", "Block Masonry"],
    sortOrder: 41,
    canBeBidPackage: true,
    defaultPackageMode: "UMBRELLA",
    isActive: true,
    isCommon: true,
    sectorTags: ["commercial", "education", "healthcare", "hospitality", "retail"],
    specialtyTags: ["core"],
  },
  {
    id: "stone-masonry",
    parentId: "masonry",
    name: "Stone Masonry",
    aliases: ["Natural Stone", "Stone Veneer"],
    sortOrder: 42,
    canBeBidPackage: true,
    defaultPackageMode: "USER_CHOICE",
    isActive: true,
    defaultHidden: true,
    sectorTags: ["hospitality", "retail", "residential", "multifamily"],
    specialtyTags: ["specialty", "alternate_candidate"],
  },
  {
    id: "simulated-masonry",
    parentId: "masonry",
    name: "Simulated Masonry",
    aliases: ["Manufactured Stone", "Cast Stone Veneer", "Faux Stone"],
    sortOrder: 43,
    canBeBidPackage: true,
    defaultPackageMode: "USER_CHOICE",
    isActive: true,
    defaultHidden: true,
    sectorTags: ["hospitality", "retail", "residential", "multifamily"],
    specialtyTags: ["specialty", "alternate_candidate"],
  },
  ...createTradeSpecializations(
    "masonry",
    {
      defaultPackageMode: "USER_CHOICE",
      sectorTags: ["commercial", "education", "healthcare", "hospitality", "retail"],
      specialtyTags: ["core"],
    },
    [
      { id: "structural-masonry", name: "Structural Masonry", sortOrder: 44 },
      { id: "veneer-masonry", name: "Veneer Masonry", aliases: ["Masonry Veneer"], sortOrder: 45 },
      { id: "cast-stone", name: "Cast Stone", sortOrder: 46, defaultHidden: true, specialtyTags: ["specialty", "alternate_candidate"] },
      { id: "glass-unit-masonry", name: "Glass Unit Masonry", aliases: ["Glass Block"], sortOrder: 47, defaultHidden: true, specialtyTags: ["specialty", "sector_specific"] },
      { id: "masonry-restoration", name: "Masonry Restoration", sortOrder: 48, defaultHidden: true, specialtyTags: ["specialty", "sector_specific"] },
      { id: "tuckpointing-repointing", name: "Tuckpointing / Repointing", aliases: ["Repointing", "Tuckpointing"], sortOrder: 49, defaultHidden: true, specialtyTags: ["specialty", "sector_specific"] },
    ]
  ),
  {
    id: "structural-steel",
    name: "Structural Steel",
    aliases: ["Steel", "Steel Framing", "Joists", "Metal Deck"],
    sortOrder: 50,
    canBeBidPackage: true,
    defaultPackageMode: "UMBRELLA",
    isActive: true,
    isCommon: true,
    sectorTags: ["commercial", "industrial", "warehouse", "education", "healthcare"],
    specialtyTags: ["core"],
  },
  ...createTradeSpecializations(
    "structural-steel",
    {
      defaultPackageMode: "UMBRELLA",
      sectorTags: ["commercial", "industrial", "warehouse", "education", "healthcare"],
      specialtyTags: ["core"],
    },
    [
      { id: "structural-steel-framing", name: "Structural Steel", aliases: ["Steel Framing"], sortOrder: 51 },
      { id: "steel-joists", name: "Steel Joists", aliases: ["Joists"], sortOrder: 52 },
      { id: "metal-decking", name: "Metal Decking", aliases: ["Metal Deck", "Steel Deck"], sortOrder: 53 },
      { id: "steel-erection", name: "Steel Erection", aliases: ["Erection"], sortOrder: 54 },
      { id: "misc-structural-steel", name: "Misc Structural Steel", aliases: ["Structural Misc Steel"], sortOrder: 55, relatedTradeIds: ["misc-metals"] },
    ]
  ),
  {
    id: "misc-metals",
    name: "Misc Metals",
    aliases: ["Miscellaneous Metals", "Railings", "Metal Fabrications"],
    sortOrder: 60,
    canBeBidPackage: true,
    defaultPackageMode: "UMBRELLA",
    isActive: true,
    isCommon: true,
    sectorTags: ["commercial", "industrial", "education", "healthcare", "hospitality"],
    specialtyTags: ["core"],
    splitRecommendation:
      "Review railings and decorative architectural metal scope for possible separate packages.",
  },
  {
    id: "architectural-metals",
    parentId: "misc-metals",
    name: "Architectural Metals",
    aliases: ["Architectural Metalwork", "Decorative Metals", "Metal Fabrications"],
    sortOrder: 61,
    canBeBidPackage: true,
    defaultPackageMode: "USER_CHOICE",
    isActive: true,
    defaultHidden: true,
    sectorTags: ["commercial", "hospitality", "retail", "office"],
    specialtyTags: ["specialty", "alternate_candidate"],
    relatedTradeIds: ["railings", "finish-carpentry-millwork"],
  },
  {
    id: "railings",
    parentId: "misc-metals",
    name: "Railings",
    aliases: ["Guardrails", "Handrails", "Stair Railings"],
    sortOrder: 62,
    canBeBidPackage: true,
    defaultPackageMode: "USER_CHOICE",
    isActive: true,
    isCommon: true,
    sectorTags: ["commercial", "education", "healthcare", "sports", "government"],
    specialtyTags: ["core", "cross_trade"],
    relatedTradeIds: ["architectural-metals"],
  },
  ...createTradeSpecializations(
    "misc-metals",
    {
      defaultPackageMode: "USER_CHOICE",
      sectorTags: ["commercial", "industrial", "education", "healthcare", "hospitality"],
      specialtyTags: ["core"],
    },
    [
      { id: "metal-stairs", name: "Stairs", aliases: ["Metal Stairs", "Steel Stairs"], sortOrder: 63 },
      { id: "ladders", name: "Ladders", aliases: ["Metal Ladders"], sortOrder: 64 },
      { id: "bollards", name: "Bollards", sortOrder: 65, relatedTradeIds: ["sitework"] },
      { id: "lintels", name: "Lintels", sortOrder: 66, relatedTradeIds: ["masonry"] },
      { id: "shelf-angles", name: "Shelf Angles", sortOrder: 67, relatedTradeIds: ["masonry", "structural-steel"] },
      { id: "gratings", name: "Gratings", aliases: ["Metal Grating"], sortOrder: 68 },
      { id: "decorative-metals", name: "Decorative Metals", aliases: ["Decorative Metalwork"], sortOrder: 69, defaultHidden: true, specialtyTags: ["specialty", "alternate_candidate"] },
      { id: "metal-fabrications", name: "Metal Fabrications", aliases: ["Misc Metal Fabrications"], sortOrder: 70 },
    ]
  ),
  {
    id: "rough-carpentry",
    name: "Rough Carpentry",
    aliases: ["Blocking", "Wood Framing", "Sheathing"],
    sortOrder: 70,
    canBeBidPackage: true,
    defaultPackageMode: "UMBRELLA",
    isActive: true,
    isCommon: true,
    sectorTags: ["commercial", "residential", "multifamily", "retail", "hospitality"],
    specialtyTags: ["core"],
  },
  ...createTradeSpecializations(
    "rough-carpentry",
    {
      defaultPackageMode: "USER_CHOICE",
      sectorTags: ["commercial", "residential", "multifamily", "retail", "hospitality"],
      specialtyTags: ["core"],
    },
    [
      { id: "wood-framing", name: "Wood Framing", sortOrder: 71 },
      { id: "blocking-backing", name: "Blocking / Backing", aliases: ["Blocking", "Backing"], sortOrder: 72 },
      { id: "sheathing", name: "Sheathing", sortOrder: 73 },
      { id: "trusses", name: "Trusses", aliases: ["Wood Trusses"], sortOrder: 74 },
      { id: "timber-construction", name: "Timber Construction", aliases: ["Timber"], sortOrder: 75, defaultHidden: true, sectorTags: ["commercial", "residential", "multifamily"], specialtyTags: ["specialty", "sector_specific"] },
      { id: "heavy-timber", name: "Heavy Timber", sortOrder: 76, defaultHidden: true, sectorTags: ["commercial", "hospitality", "education"], specialtyTags: ["specialty", "sector_specific"] },
      { id: "clt-mass-timber", name: "CLT / Mass Timber", aliases: ["Cross-Laminated Timber", "Mass Timber"], sortOrder: 77, defaultHidden: true, sectorTags: ["commercial", "education", "residential", "multifamily"], specialtyTags: ["specialty", "sector_specific"] },
    ]
  ),
  {
    id: "finish-carpentry-millwork",
    name: "Finish Carpentry / Millwork",
    aliases: ["Millwork", "Architectural Woodwork", "Casework"],
    sortOrder: 80,
    canBeBidPackage: true,
    defaultPackageMode: "UMBRELLA",
    isActive: true,
    isCommon: true,
    sectorTags: ["commercial", "hospitality", "restaurant", "retail", "office", "healthcare"],
    specialtyTags: ["core"],
    splitRecommendation:
      "Casework and countertops may need to split based on finish material and vendor market.",
  },
  ...createTradeSpecializations(
    "finish-carpentry-millwork",
    {
      defaultPackageMode: "USER_CHOICE",
      sectorTags: ["commercial", "hospitality", "restaurant", "retail", "office", "healthcare"],
      specialtyTags: ["core"],
    },
    [
      { id: "architectural-millwork", name: "Architectural Millwork", aliases: ["Millwork"], sortOrder: 81 },
      { id: "cabinets", name: "Cabinets", aliases: ["Cabinetry"], sortOrder: 82 },
      { id: "casework", name: "Casework", sortOrder: 83 },
      { id: "interior-trim", name: "Interior Trim", aliases: ["Trim"], sortOrder: 90 },
      { id: "wood-paneling", name: "Wood Paneling", aliases: ["Wood Panels"], sortOrder: 91, specialtyTags: ["specialty", "alternate_candidate"] },
    ]
  ),
  {
    id: "countertops",
    parentId: "finish-carpentry-millwork",
    name: "Countertops",
    aliases: [
      "Plastic Laminate Countertops",
      "Solid Surface Countertops",
      "Stone Countertops",
      "Quartz Countertops",
      "Granite Countertops",
    ],
    description:
      "Countertop scope that may travel with millwork or split into a separate stone, quartz, granite, or solid-surface package.",
    sortOrder: 84,
    canBeBidPackage: true,
    defaultPackageMode: "USER_CHOICE",
    defaultScopeNotes: [
      "Plastic laminate tops may be included with millwork.",
      "Stone, quartz, granite, or solid-surface tops may need a separate bid package.",
    ],
    isActive: true,
    defaultHidden: true,
    sectorTags: ["hospitality", "restaurant", "healthcare", "laboratory", "retail", "office"],
    specialtyTags: ["specialty", "cross_trade", "alternate_candidate"],
    relatedTradeIds: ["finish-carpentry-millwork", "tile"],
    splitRecommendation:
      "Use separate package when stone, quartz, granite, or solid surface scope is substantial.",
  },
  ...createTradeSpecializations(
    "countertops",
    {
      defaultPackageMode: "USER_CHOICE",
      defaultHidden: true,
      sectorTags: ["hospitality", "restaurant", "healthcare", "laboratory", "retail", "office"],
      specialtyTags: ["specialty", "cross_trade", "alternate_candidate"],
      relatedTradeIds: ["finish-carpentry-millwork", "tile"],
    },
    [
      { id: "plastic-laminate-countertops", name: "Plastic Laminate Countertops", aliases: ["PLAM Countertops"], sortOrder: 85, estimatingNotes: "Often included with architectural millwork or casework." },
      { id: "solid-surface-countertops", name: "Solid Surface Countertops", sortOrder: 86 },
      { id: "stone-quartz-granite-countertops", name: "Stone / Quartz / Granite Countertops", aliases: ["Stone Countertops", "Quartz Countertops", "Granite Countertops"], sortOrder: 87, estimatingNotes: "Often bid separately from millwork when stone or quartz scope is substantial." },
    ]
  ),
  {
    id: "roofing",
    name: "Roofing",
    aliases: ["Roof", "Membrane Roofing", "Shingles"],
    sortOrder: 90,
    canBeBidPackage: true,
    defaultPackageMode: "UMBRELLA",
    isActive: true,
    isCommon: true,
    sectorTags: ["commercial", "residential", "multifamily", "education", "industrial"],
    specialtyTags: ["core"],
  },
  {
    id: "membrane-roofing",
    parentId: "roofing",
    name: "Membrane Roofing",
    aliases: ["TPO", "EPDM", "PVC Roofing", "Single-Ply Roofing"],
    sortOrder: 91,
    canBeBidPackage: true,
    defaultPackageMode: "UMBRELLA",
    isActive: true,
    isCommon: true,
    sectorTags: ["commercial", "industrial", "education", "healthcare", "warehouse"],
    specialtyTags: ["core"],
  },
  {
    id: "sheet-metal-roofing",
    parentId: "roofing",
    name: "Metal Roofing",
    aliases: ["Sheet Metal Roofing", "Roof Sheet Metal"],
    sortOrder: 92,
    canBeBidPackage: true,
    defaultPackageMode: "USER_CHOICE",
    isActive: true,
    defaultHidden: true,
    sectorTags: ["commercial", "industrial", "warehouse"],
    specialtyTags: ["specialty", "cross_trade"],
    relatedTradeIds: ["waterproofing"],
  },
  {
    id: "shingle-roofing",
    parentId: "roofing",
    name: "Shingle Roofing",
    aliases: ["Asphalt Shingles", "Roof Shingles"],
    sortOrder: 93,
    canBeBidPackage: true,
    defaultPackageMode: "USER_CHOICE",
    isActive: true,
    defaultHidden: true,
    sectorTags: ["residential", "multifamily", "hospitality"],
    specialtyTags: ["specialty", "sector_specific"],
  },
  ...createTradeSpecializations(
    "roofing",
    {
      defaultPackageMode: "USER_CHOICE",
      sectorTags: ["commercial", "residential", "multifamily", "education", "industrial"],
      specialtyTags: ["core"],
    },
    [
      { id: "tpo-roofing", name: "TPO Roofing", sortOrder: 94, relatedTradeIds: ["membrane-roofing"] },
      { id: "epdm-roofing", name: "EPDM Roofing", sortOrder: 95, relatedTradeIds: ["membrane-roofing"] },
      { id: "pvc-roofing", name: "PVC Roofing", sortOrder: 96, relatedTradeIds: ["membrane-roofing"] },
      { id: "modified-bitumen-roofing", name: "Modified Bitumen Roofing", aliases: ["Mod Bit Roofing"], sortOrder: 97, relatedTradeIds: ["membrane-roofing"] },
      { id: "built-up-roofing", name: "Built-Up Roofing", aliases: ["BUR"], sortOrder: 98, relatedTradeIds: ["membrane-roofing"] },
      { id: "roof-accessories", name: "Roof Accessories", sortOrder: 99, specialtyTags: ["specialty", "allowance_candidate"] },
      { id: "roof-hatches", name: "Roof Hatches", sortOrder: 100, relatedTradeIds: ["misc-metals"] },
      { id: "roof-curbs", name: "Roof Curbs", sortOrder: 101, relatedTradeIds: ["hvac"] },
      { id: "gutters-downspouts", name: "Gutters / Downspouts", aliases: ["Gutters", "Downspouts"], sortOrder: 102 },
      { id: "sheet-metal-flashing", name: "Sheet Metal Flashing", aliases: ["Flashing"], sortOrder: 103, relatedTradeIds: ["waterproofing"] },
    ]
  ),
  {
    id: "waterproofing",
    name: "Waterproofing",
    aliases: ["Dampproofing", "Air Barrier", "Sealants"],
    sortOrder: 100,
    canBeBidPackage: true,
    defaultPackageMode: "USER_CHOICE",
    defaultScopeNotes: ["Review sealants and air barrier scope for overlap with glazing, roofing, or exterior wall packages."],
    isActive: true,
    isCommon: true,
    sectorTags: ["commercial", "industrial", "healthcare", "education", "multifamily"],
    specialtyTags: ["core", "cross_trade"],
    relatedTradeIds: ["roofing", "glass-glazing"],
    splitRecommendation:
      "Review air barrier, sealants, and flashing overlap with roofing and glazing scopes.",
  },
  ...createTradeSpecializations(
    "waterproofing",
    {
      defaultPackageMode: "USER_CHOICE",
      sectorTags: ["commercial", "industrial", "healthcare", "education", "multifamily"],
      specialtyTags: ["core", "cross_trade"],
    },
    [
      { id: "below-grade-waterproofing", name: "Below-Grade Waterproofing", aliases: ["Below Grade Waterproofing"], sortOrder: 101 },
      { id: "fluid-applied-waterproofing", name: "Fluid-Applied Waterproofing", sortOrder: 102 },
      { id: "sheet-waterproofing", name: "Sheet Waterproofing", sortOrder: 103 },
      { id: "dampproofing", name: "Dampproofing", sortOrder: 104 },
      { id: "air-barriers", name: "Air Barriers", aliases: ["Air Barrier"], sortOrder: 105, relatedTradeIds: ["roofing", "glass-glazing"] },
      { id: "vapor-barriers", name: "Vapor Barriers", aliases: ["Vapor Barrier"], sortOrder: 106, relatedTradeIds: ["insulation"] },
      { id: "joint-sealants-caulking", name: "Joint Sealants / Caulking", aliases: ["Sealants", "Caulking"], sortOrder: 107, relatedTradeIds: ["glass-glazing", "painting-coatings"] },
      { id: "firestopping", name: "Firestopping", aliases: ["Firestop"], sortOrder: 108, specialtyTags: ["core", "cross_trade"], relatedTradeIds: ["drywall-framing", "hvac", "plumbing", "electrical"] },
      { id: "expansion-joint-covers", name: "Expansion Joint Covers", aliases: ["Expansion Joints"], sortOrder: 109, defaultHidden: true, specialtyTags: ["specialty", "sector_specific"] },
    ]
  ),
  {
    id: "insulation",
    name: "Insulation",
    aliases: ["Thermal Insulation", "Acoustic Insulation"],
    description: "Thermal and acoustic insulation scope that may travel with drywall, roofing, or envelope packages.",
    sortOrder: 105,
    canBeBidPackage: true,
    defaultPackageMode: "USER_CHOICE",
    isActive: true,
    isCommon: true,
    sectorTags: ["commercial", "residential", "multifamily", "education", "healthcare", "industrial"],
    specialtyTags: ["core", "cross_trade"],
    relatedTradeIds: ["drywall-framing", "roofing", "waterproofing"],
    splitRecommendation:
      "Review insulation scope for overlap with drywall, roofing, waterproofing, and exterior wall packages.",
  },
  ...createTradeSpecializations(
    "insulation",
    {
      defaultPackageMode: "USER_CHOICE",
      sectorTags: ["commercial", "residential", "multifamily", "education", "healthcare", "industrial"],
      specialtyTags: ["core", "cross_trade"],
    },
    [
      { id: "batt-insulation", name: "Batt Insulation", aliases: ["Batt"], sortOrder: 106 },
      { id: "rigid-insulation", name: "Rigid Insulation", sortOrder: 107, relatedTradeIds: ["roofing", "waterproofing"] },
      { id: "spray-foam-insulation", name: "Spray Foam Insulation", aliases: ["Spray Foam"], sortOrder: 108, defaultHidden: true, specialtyTags: ["specialty", "sector_specific"] },
      { id: "mineral-wool", name: "Mineral Wool", aliases: ["Rock Wool"], sortOrder: 109 },
      { id: "acoustic-insulation", name: "Acoustic Insulation", aliases: ["Sound Insulation"], sortOrder: 110, relatedTradeIds: ["drywall-framing"] },
    ]
  ),
  {
    id: "doors-frames-hardware",
    name: "Doors / Frames / Hardware",
    aliases: ["DFH", "Doors and Hardware"],
    description: "Doors, frames, hardware, and closely related access opening scope.",
    sortOrder: 110,
    canBeBidPackage: true,
    defaultPackageMode: "UMBRELLA",
    defaultScopeNotes: ["Usually bid as a single coordinated package."],
    isActive: true,
    isCommon: true,
    sectorTags: ["commercial", "education", "healthcare", "hospitality", "office", "retail"],
    specialtyTags: ["core"],
  },
  {
    id: "hollow-metal-doors-frames",
    parentId: "doors-frames-hardware",
    name: "Hollow Metal Doors / Frames",
    aliases: ["Hollow Metal", "HM Doors", "HM Frames"],
    sortOrder: 111,
    canBeBidPackage: true,
    defaultPackageMode: "UMBRELLA",
    isActive: true,
    isCommon: true,
    sectorTags: ["industrial", "warehouse", "commercial", "retail"],
    specialtyTags: ["core"],
    relatedTradeIds: ["doors-frames-hardware", "equipment"],
  },
  {
    id: "wood-doors",
    parentId: "doors-frames-hardware",
    name: "Wood Doors",
    aliases: ["Flush Wood Doors"],
    sortOrder: 112,
    canBeBidPackage: true,
    defaultPackageMode: "UMBRELLA",
    isActive: true,
  },
  {
    id: "fiberglass-doors",
    parentId: "doors-frames-hardware",
    name: "Fiberglass Doors",
    aliases: ["FRP Doors"],
    sortOrder: 113,
    canBeBidPackage: true,
    defaultPackageMode: "USER_CHOICE",
    isActive: true,
    defaultHidden: true,
    sectorTags: ["commercial", "industrial", "healthcare"],
    specialtyTags: ["specialty", "sector_specific"],
  },
  {
    id: "aluminum-doors",
    parentId: "doors-frames-hardware",
    name: "Aluminum Doors",
    aliases: ["Aluminum Entrances"],
    sortOrder: 114,
    canBeBidPackage: true,
    defaultPackageMode: "USER_CHOICE",
    isActive: true,
    relatedTradeIds: ["glass-glazing", "storefront"],
    specialtyTags: ["core", "cross_trade"],
  },
  {
    id: "door-hardware",
    parentId: "doors-frames-hardware",
    name: "Door Hardware",
    aliases: ["Hardware", "Finish Hardware"],
    sortOrder: 115,
    canBeBidPackage: true,
    defaultPackageMode: "UMBRELLA",
    isActive: true,
  },
  {
    id: "access-doors",
    parentId: "doors-frames-hardware",
    name: "Access Doors / Panels",
    aliases: ["Access Panels"],
    sortOrder: 116,
    canBeBidPackage: true,
    defaultPackageMode: "USER_CHOICE",
    isActive: true,
    isCommon: true,
    sectorTags: ["commercial", "retail", "office", "hospitality", "healthcare"],
    specialtyTags: ["core", "cross_trade"],
    relatedTradeIds: ["waterproofing"],
  },
  {
    id: "automatic-door-operators",
    parentId: "doors-frames-hardware",
    name: "Automatic Door Operators",
    aliases: ["Door Operators", "Automatic Operators"],
    sortOrder: 117,
    canBeBidPackage: true,
    defaultPackageMode: "USER_CHOICE",
    isActive: true,
    defaultHidden: true,
    sectorTags: ["commercial", "healthcare", "retail", "office"],
    specialtyTags: ["specialty", "cross_trade"],
    relatedTradeIds: ["electrical", "low-voltage-technology"],
  },
  {
    id: "overhead-doors",
    name: "Overhead Doors",
    aliases: ["Sectional Doors", "Coiling Doors", "Rolling Doors", "Loading Dock Doors"],
    description:
      "Overhead, sectional, coiling, rolling, and loading dock door scope that is often bid separately from DFH.",
    sortOrder: 115,
    canBeBidPackage: true,
    defaultPackageMode: "UMBRELLA",
    isActive: true,
    isCommon: true,
    sectorTags: ["industrial", "warehouse", "commercial", "retail"],
    specialtyTags: ["core"],
  },
  ...createTradeSpecializations(
    "overhead-doors",
    {
      defaultPackageMode: "USER_CHOICE",
      sectorTags: ["industrial", "warehouse", "commercial", "retail"],
      specialtyTags: ["core"],
    },
    [
      { id: "sectional-overhead-doors", name: "Sectional Overhead Doors", aliases: ["Sectional Doors"], sortOrder: 116 },
      { id: "coiling-doors", name: "Coiling Doors", aliases: ["Rolling Doors"], sortOrder: 117 },
      { id: "rolling-fire-doors", name: "Rolling Fire Doors", aliases: ["Fire Doors"], sortOrder: 118, defaultHidden: true, specialtyTags: ["specialty", "sector_specific"] },
      { id: "high-speed-doors", name: "High-Speed Doors", sortOrder: 119, defaultHidden: true, sectorTags: ["industrial", "warehouse", "cleanroom"], specialtyTags: ["specialty", "sector_specific"] },
      { id: "loading-dock-equipment", name: "Loading Dock Equipment", sortOrder: 120, relatedTradeIds: ["equipment"] },
      { id: "dock-levelers", name: "Dock Levelers", sortOrder: 121, relatedTradeIds: ["loading-dock-equipment"] },
      { id: "dock-seals-shelters", name: "Dock Seals / Shelters", aliases: ["Dock Seals", "Dock Shelters"], sortOrder: 122, relatedTradeIds: ["loading-dock-equipment"] },
    ]
  ),
  {
    id: "glass-glazing",
    name: "Glass / Glazing",
    aliases: ["Glazing", "Storefront", "Curtain Wall"],
    sortOrder: 120,
    canBeBidPackage: true,
    defaultPackageMode: "USER_CHOICE",
    isActive: true,
    isCommon: true,
    sectorTags: ["commercial", "retail", "office", "hospitality", "healthcare"],
    specialtyTags: ["core", "cross_trade"],
  },
  {
    id: "storefront",
    parentId: "glass-glazing",
    name: "Storefront",
    aliases: ["Aluminum Storefront"],
    sortOrder: 121,
    canBeBidPackage: true,
    defaultPackageMode: "UMBRELLA",
    isActive: true,
  },
  {
    id: "curtain-wall",
    parentId: "glass-glazing",
    name: "Curtain Wall",
    aliases: ["Curtainwall"],
    sortOrder: 122,
    canBeBidPackage: true,
    defaultPackageMode: "UMBRELLA",
    isActive: true,
  },
  {
    id: "interior-glass-glazing",
    parentId: "glass-glazing",
    name: "Interior Glass / Glazing",
    aliases: ["Interior Glass", "Glass Partitions"],
    sortOrder: 123,
    canBeBidPackage: true,
    defaultPackageMode: "USER_CHOICE",
    isActive: true,
  },
  ...createTradeSpecializations(
    "glass-glazing",
    {
      defaultPackageMode: "USER_CHOICE",
      sectorTags: ["commercial", "retail", "office", "hospitality", "healthcare"],
      specialtyTags: ["core"],
    },
    [
      { id: "glass-entrances", name: "Glass Entrances", aliases: ["Glass Entry Doors"], sortOrder: 124, relatedTradeIds: ["storefront", "aluminum-doors"] },
      { id: "mirrors", name: "Mirrors", sortOrder: 125, relatedTradeIds: ["specialties"] },
      { id: "skylights", name: "Skylights", sortOrder: 126, defaultHidden: true, sectorTags: ["commercial", "education", "hospitality", "residential"], specialtyTags: ["specialty", "cross_trade"], relatedTradeIds: ["roofing"] },
      { id: "translucent-wall-roof-assemblies", name: "Translucent Wall / Roof Assemblies", aliases: ["Translucent Panels"], sortOrder: 127, defaultHidden: true, sectorTags: ["commercial", "industrial", "education"], specialtyTags: ["specialty", "sector_specific"], relatedTradeIds: ["roofing"] },
    ]
  ),
  {
    id: "drywall-framing",
    name: "Drywall / Framing",
    aliases: ["Drywall", "Gypsum Board", "Metal Stud Framing"],
    description: "Interior framing, gypsum board, shaft wall, plaster, and related drywall assemblies.",
    sortOrder: 130,
    canBeBidPackage: true,
    defaultPackageMode: "UMBRELLA",
    defaultScopeNotes: ["Gypsum board and metal stud framing should typically roll into one package."],
    defaultExclusions: ["ACT ceilings unless intentionally included.", "Painting unless intentionally included."],
    isActive: true,
    isCommon: true,
    sectorTags: ["commercial", "education", "healthcare", "hospitality", "office", "retail"],
    specialtyTags: ["core"],
    relatedTradeIds: ["ceilings", "painting-coatings"],
  },
  {
    id: "non-structural-metal-framing",
    parentId: "drywall-framing",
    name: "Non-Structural Metal Framing",
    aliases: ["Metal Studs", "Metal Framing"],
    sortOrder: 131,
    canBeBidPackage: true,
    defaultPackageMode: "UMBRELLA",
    isActive: true,
  },
  {
    id: "gypsum-board",
    parentId: "drywall-framing",
    name: "Gypsum Board",
    aliases: ["Drywall", "GWB"],
    sortOrder: 132,
    canBeBidPackage: true,
    defaultPackageMode: "UMBRELLA",
    isActive: true,
  },
  {
    id: "shaft-wall-assemblies",
    parentId: "drywall-framing",
    name: "Shaft Wall Assemblies",
    aliases: ["Shaft Wall", "Shaftwall"],
    sortOrder: 133,
    canBeBidPackage: true,
    defaultPackageMode: "UMBRELLA",
    isActive: true,
  },
  {
    id: "plaster",
    parentId: "drywall-framing",
    name: "Plaster",
    aliases: ["Gypsum Plaster", "Veneer Plaster"],
    sortOrder: 134,
    canBeBidPackage: true,
    defaultPackageMode: "USER_CHOICE",
    isActive: true,
    isCommon: true,
    sectorTags: ["commercial", "education", "healthcare", "office", "retail"],
    specialtyTags: ["core", "cross_trade"],
    relatedTradeIds: ["drywall-framing"],
    splitRecommendation:
      "Plaster may be included with drywall/framing or split as a specialty finish depending on project scope.",
  },
  ...createTradeSpecializations(
    "drywall-framing",
    {
      defaultPackageMode: "USER_CHOICE",
      sectorTags: ["commercial", "education", "healthcare", "hospitality", "office", "retail"],
      specialtyTags: ["core"],
    },
    [
      { id: "drywall-acoustic-insulation", name: "Acoustic Insulation", aliases: ["Sound Batt Insulation"], sortOrder: 135, relatedTradeIds: ["insulation"] },
      { id: "drywall-finishing", name: "Drywall Finishing", aliases: ["Tape and Finish", "Drywall Finish"], sortOrder: 136, relatedTradeIds: ["painting-coatings"] },
    ]
  ),
  {
    id: "ceilings",
    name: "Ceilings",
    aliases: ["ACT", "Acoustical Ceilings"],
    sortOrder: 140,
    canBeBidPackage: true,
    defaultPackageMode: "USER_CHOICE",
    isActive: true,
    isCommon: true,
    sectorTags: ["commercial", "education", "healthcare", "office", "retail"],
    specialtyTags: ["core", "cross_trade"],
    relatedTradeIds: ["drywall-framing"],
    splitRecommendation:
      "ACT and specialty ceilings may split when project size or vendor market supports it.",
  },
  {
    id: "acoustical-ceilings",
    parentId: "ceilings",
    name: "ACT Ceilings",
    aliases: ["ACT", "Acoustical Ceiling Tile"],
    sortOrder: 141,
    canBeBidPackage: true,
    defaultPackageMode: "UMBRELLA",
    isActive: true,
  },
  {
    id: "specialty-ceilings",
    parentId: "ceilings",
    name: "Specialty Ceilings",
    aliases: ["Wood Ceilings", "Metal Ceilings"],
    sortOrder: 142,
    canBeBidPackage: true,
    defaultPackageMode: "USER_CHOICE",
    isActive: true,
  },
  ...createTradeSpecializations(
    "ceilings",
    {
      defaultPackageMode: "USER_CHOICE",
      sectorTags: ["commercial", "education", "healthcare", "office", "retail"],
      specialtyTags: ["core"],
    },
    [
      { id: "wood-ceilings", name: "Wood Ceilings", sortOrder: 143, defaultHidden: true, sectorTags: ["commercial", "hospitality", "education"], specialtyTags: ["specialty", "alternate_candidate"] },
      { id: "metal-ceilings", name: "Metal Ceilings", sortOrder: 144, defaultHidden: true, sectorTags: ["commercial", "transportation", "airport"], specialtyTags: ["specialty", "sector_specific"] },
      { id: "acoustic-panels-clouds", name: "Acoustic Panels / Clouds", aliases: ["Acoustic Clouds", "Acoustical Panels"], sortOrder: 145, defaultHidden: true, sectorTags: ["commercial", "education", "office", "hospitality"], specialtyTags: ["specialty", "cross_trade"], relatedTradeIds: ["painting-coatings"] },
    ]
  ),
  {
    id: "flooring",
    name: "Flooring",
    aliases: ["Floor Finishes"],
    description: "Floor finishes and substrate preparation scope.",
    sortOrder: 150,
    canBeBidPackage: true,
    defaultPackageMode: "USER_CHOICE",
    defaultScopeNotes: ["Choose umbrella or split specialization packages based on project size and subcontractor market."],
    isActive: true,
    isCommon: true,
    sectorTags: ["commercial", "education", "healthcare", "hospitality", "office", "retail"],
    specialtyTags: ["core"],
    splitRecommendation:
      "Split flooring by finish type when there are specialty installers or meaningful schedule/package separation.",
  },
  {
    id: "carpet",
    parentId: "flooring",
    name: "Carpet",
    aliases: ["Carpet Tile", "Broadloom"],
    sortOrder: 151,
    canBeBidPackage: true,
    defaultPackageMode: "UMBRELLA",
    isActive: true,
    isCommon: true,
    sectorTags: ["commercial", "education", "healthcare", "hospitality", "office"],
    specialtyTags: ["core"],
  },
  {
    id: "carpet-tile",
    parentId: "flooring",
    name: "Carpet Tile",
    aliases: ["Modular Carpet"],
    sortOrder: 152,
    canBeBidPackage: true,
    defaultPackageMode: "UMBRELLA",
    isActive: true,
    isCommon: true,
    sectorTags: ["commercial", "education", "healthcare", "hospitality", "office"],
    specialtyTags: ["core"],
    relatedTradeIds: ["carpet"],
  },
  {
    id: "resilient-flooring-lvt",
    parentId: "flooring",
    name: "Resilient Flooring / LVT",
    aliases: ["LVT", "VCT", "Resilient"],
    sortOrder: 153,
    canBeBidPackage: true,
    defaultPackageMode: "UMBRELLA",
    isActive: true,
    isCommon: true,
    sectorTags: ["commercial", "education", "healthcare", "hospitality", "office", "retail"],
    specialtyTags: ["core"],
  },
  {
    id: "tile",
    parentId: "flooring",
    name: "Tile",
    aliases: ["Ceramic Tile", "Porcelain Tile", "Stone Tile"],
    sortOrder: 154,
    canBeBidPackage: true,
    defaultPackageMode: "UMBRELLA",
    isActive: true,
    isCommon: true,
    sectorTags: ["commercial", "education", "healthcare", "hospitality", "restaurant"],
    specialtyTags: ["core", "cross_trade"],
    relatedTradeIds: ["countertops"],
  },
  {
    id: "wood-flooring",
    parentId: "flooring",
    name: "Wood Flooring",
    aliases: ["Hardwood Flooring"],
    sortOrder: 155,
    canBeBidPackage: true,
    defaultPackageMode: "USER_CHOICE",
    isActive: true,
    defaultHidden: true,
    sectorTags: ["residential", "multifamily", "hospitality"],
    specialtyTags: ["specialty", "sector_specific"],
  },
  {
    id: "resinous-epoxy-flooring",
    parentId: "flooring",
    name: "Resinous / Epoxy Flooring",
    aliases: ["Epoxy Flooring", "Resinous Flooring"],
    sortOrder: 156,
    canBeBidPackage: true,
    defaultPackageMode: "USER_CHOICE",
    isActive: true,
    defaultHidden: true,
    sectorTags: ["industrial", "healthcare", "laboratory", "restaurant"],
    specialtyTags: ["specialty", "sector_specific", "alternate_candidate"],
  },
  {
    id: "flooring-prep-moisture-mitigation",
    parentId: "flooring",
    name: "Flooring Prep / Moisture Mitigation",
    aliases: ["Floor Prep", "Moisture Mitigation", "Self-Leveling"],
    sortOrder: 159,
    canBeBidPackage: true,
    defaultPackageMode: "USER_CHOICE",
    isActive: true,
    defaultHidden: true,
    sectorTags: ["healthcare", "laboratory", "cleanroom", "restaurant"],
    specialtyTags: ["specialty", "cross_trade"],
    relatedTradeIds: ["concrete"],
  },
  ...createTradeSpecializations(
    "flooring",
    {
      defaultPackageMode: "USER_CHOICE",
      sectorTags: ["commercial", "education", "healthcare", "hospitality", "office", "retail"],
      specialtyTags: ["core"],
    },
    [
      { id: "sheet-vinyl", name: "Sheet Vinyl", aliases: ["Sheet Vinyl Flooring"], sortOrder: 157, relatedTradeIds: ["resilient-flooring-lvt"] },
      { id: "rubber-flooring", name: "Rubber Flooring", sortOrder: 158, defaultHidden: true, sectorTags: ["healthcare", "education", "sports"], specialtyTags: ["specialty", "sector_specific"] },
      { id: "athletic-flooring", name: "Athletic Flooring", sortOrder: 160, defaultHidden: true, sectorTags: ["sports", "education"], specialtyTags: ["specialty", "sector_specific"] },
      { id: "floor-leveling", name: "Floor Leveling", aliases: ["Self-Leveling"], sortOrder: 161, specialtyTags: ["specialty", "cross_trade"], relatedTradeIds: ["concrete", "flooring-prep-moisture-mitigation"] },
    ]
  ),
  {
    id: "painting-coatings",
    name: "Wall Finishes",
    aliases: ["Painting", "Coatings", "Wall Finishes", "Painting / Coatings"],
    sortOrder: 160,
    canBeBidPackage: true,
    defaultPackageMode: "UMBRELLA",
    isActive: true,
    isCommon: true,
    sectorTags: ["commercial", "education", "healthcare", "hospitality", "office", "retail"],
    specialtyTags: ["core"],
  },
  ...createTradeSpecializations(
    "painting-coatings",
    {
      defaultPackageMode: "USER_CHOICE",
      sectorTags: ["commercial", "education", "healthcare", "hospitality", "office", "retail"],
      specialtyTags: ["core"],
    },
    [
      { id: "painting-coatings-specialization", name: "Painting / Coatings", aliases: ["Painting", "Coatings"], sortOrder: 161 },
      { id: "wallcovering", name: "Wallcovering", aliases: ["Wall Covering"], sortOrder: 162, defaultHidden: true, sectorTags: ["hospitality", "office", "retail", "healthcare"], specialtyTags: ["specialty", "alternate_candidate"] },
      { id: "decorative-finishes", name: "Decorative Finishes", sortOrder: 163, defaultHidden: true, sectorTags: ["hospitality", "retail", "office"], specialtyTags: ["specialty", "alternate_candidate"] },
      { id: "high-performance-coatings", name: "High-Performance Coatings", aliases: ["Industrial Coatings"], sortOrder: 164, defaultHidden: true, sectorTags: ["industrial", "healthcare", "laboratory", "cleanroom"], specialtyTags: ["specialty", "sector_specific"] },
      { id: "frp-panels", name: "FRP Panels", aliases: ["Fiberglass Reinforced Panels"], sortOrder: 165, defaultHidden: true, sectorTags: ["restaurant", "healthcare", "laboratory", "industrial"], specialtyTags: ["specialty", "sector_specific"] },
      { id: "acoustical-wall-panels", name: "Acoustical Wall Panels", aliases: ["Acoustic Wall Panels"], sortOrder: 166, defaultHidden: true, sectorTags: ["education", "office", "hospitality", "commercial"], specialtyTags: ["specialty", "cross_trade"], relatedTradeIds: ["ceilings"] },
    ]
  ),
  {
    id: "specialties",
    name: "Specialties",
    aliases: ["Division 10", "Accessories", "Signage"],
    sortOrder: 170,
    canBeBidPackage: true,
    defaultPackageMode: "USER_CHOICE",
    isActive: true,
    isCommon: true,
    sectorTags: ["commercial", "office", "healthcare", "education", "hospitality", "sports", "government"],
    specialtyTags: ["core", "specialty"],
  },
  ...createTradeSpecializations(
    "specialties",
    {
      defaultPackageMode: "USER_CHOICE",
      sectorTags: ["commercial", "office", "healthcare", "education", "hospitality", "sports", "government"],
      specialtyTags: ["specialty"],
    },
    [
      { id: "toilet-accessories", name: "Toilet Accessories", aliases: ["Toilet Room Accessories"], sortOrder: 171, isCommon: true },
      { id: "fire-extinguishers-cabinets", name: "Fire Extinguishers / Cabinets", aliases: ["Fire Extinguishers", "Fire Extinguisher Cabinets"], sortOrder: 172, isCommon: true, relatedTradeIds: ["fire-protection"] },
      { id: "lockers", name: "Lockers", sortOrder: 173, defaultHidden: true, sectorTags: ["education", "sports", "healthcare", "commercial"] },
      { id: "signage", name: "Signage", aliases: ["Signs"], sortOrder: 174, isCommon: true },
      { id: "visual-display-boards", name: "Visual Display Boards", aliases: ["Markerboards", "Tackboards"], sortOrder: 175, defaultHidden: true, sectorTags: ["education", "healthcare"] },
      { id: "projection-screens", name: "Projection Screens", sortOrder: 176, defaultHidden: true, sectorTags: ["education", "office", "hospitality"], specialtyTags: ["specialty", "owner_vendor"] },
      { id: "postal-specialties", name: "Postal Specialties", aliases: ["Mailboxes"], sortOrder: 177, defaultHidden: true, sectorTags: ["multifamily", "office", "government"], specialtyTags: ["specialty", "sector_specific"] },
      { id: "cubicle-curtains-tracks", name: "Cubicle Curtains / Tracks", aliases: ["Cubicle Curtains", "Curtain Tracks"], sortOrder: 178, defaultHidden: true, sectorTags: ["healthcare"], specialtyTags: ["specialty", "sector_specific"] },
      { id: "corner-guards-wall-protection", name: "Corner Guards / Wall Protection", aliases: ["Wall Protection", "Corner Guards"], sortOrder: 179, isCommon: true, sectorTags: ["commercial", "office", "healthcare", "education"] },
      { id: "entrance-mats-grilles", name: "Entrance Mats / Grilles", aliases: ["Entrance Mats", "Entrance Grilles"], sortOrder: 180, defaultHidden: true, sectorTags: ["commercial", "office", "hospitality"] },
      { id: "flagpoles", name: "Flagpoles", sortOrder: 181, defaultHidden: true, sectorTags: ["government", "education", "commercial"], specialtyTags: ["specialty", "sector_specific"] },
      { id: "louvers-vents", name: "Louvers / Vents", aliases: ["Louvers", "Vents"], sortOrder: 182, defaultHidden: true, specialtyTags: ["specialty", "cross_trade"], relatedTradeIds: ["hvac", "glass-glazing"] },
      { id: "bird-control", name: "Bird Control", sortOrder: 183, defaultHidden: true, sectorTags: ["commercial", "industrial", "transportation"], specialtyTags: ["specialty", "sector_specific"] },
      { id: "operable-partitions", name: "Operable Partitions", sortOrder: 184, defaultHidden: true, sectorTags: ["education", "hospitality", "office"], specialtyTags: ["specialty", "sector_specific"] },
      { id: "accordion-folding-partitions", name: "Accordion / Folding Partitions", aliases: ["Folding Partitions"], sortOrder: 185, defaultHidden: true, sectorTags: ["education", "hospitality", "office"], specialtyTags: ["specialty", "sector_specific"] },
      { id: "storage-shelving", name: "Storage Shelving", aliases: ["Shelving"], sortOrder: 186, defaultHidden: true, sectorTags: ["warehouse", "healthcare", "education", "commercial"] },
      { id: "wire-mesh-partitions", name: "Wire Mesh Partitions", sortOrder: 187, defaultHidden: true, sectorTags: ["warehouse", "industrial", "detention"], specialtyTags: ["specialty", "sector_specific"] },
      { id: "bath-partitions", name: "Bath Partitions", aliases: ["Toilet Partitions", "Restroom Partitions"], sortOrder: 188, isCommon: true },
    ]
  ),
  {
    id: "equipment",
    name: "Equipment",
    aliases: ["Division 11"],
    sortOrder: 180,
    canBeBidPackage: true,
    defaultPackageMode: "USER_CHOICE",
    isActive: true,
    defaultHidden: true,
    sectorTags: ["restaurant", "healthcare", "laboratory", "industrial"],
    specialtyTags: ["owner_vendor", "allowance_candidate", "sector_specific"],
    estimatingNotes:
      "Equipment may be owner-furnished, vendor-provided, or carried as an allowance depending on procurement.",
  },
  ...createTradeSpecializations(
    "equipment",
    {
      defaultPackageMode: "USER_CHOICE",
      defaultHidden: true,
      sectorTags: ["restaurant", "healthcare", "laboratory", "industrial"],
      specialtyTags: ["owner_vendor", "allowance_candidate", "sector_specific"],
    },
    [
      { id: "food-service-equipment", name: "Food Service Equipment", sortOrder: 181, sectorTags: ["restaurant", "education"], contextTags: ["commercial_kitchen"], relatedTradeIds: ["plumbing", "electrical", "hvac"] },
      { id: "commercial-kitchen-equipment", name: "Commercial Kitchen Equipment", sortOrder: 182, sectorTags: ["restaurant", "education"], contextTags: ["commercial_kitchen"], relatedTradeIds: ["food-service-equipment"] },
      { id: "residential-appliances", name: "Residential Appliances", sortOrder: 183, sectorTags: ["residential", "multifamily", "hospitality"], specialtyTags: ["owner_vendor", "allowance_candidate"] },
      { id: "laundry-equipment", name: "Laundry Equipment", sortOrder: 184, sectorTags: ["multifamily", "hospitality", "healthcare"] },
      { id: "medical-equipment", name: "Medical Equipment", sortOrder: 185, sectorTags: ["healthcare"], contextTags: ["medical_office", "hospital", "surgery_center", "imaging"], specialtyTags: ["owner_vendor", "sector_specific"] },
      { id: "laboratory-equipment", name: "Laboratory Equipment", sortOrder: 186, sectorTags: ["laboratory", "healthcare", "education"], specialtyTags: ["owner_vendor", "sector_specific"] },
      { id: "athletic-equipment", name: "Athletic Equipment", sortOrder: 187, sectorTags: ["sports", "education"], specialtyTags: ["owner_vendor", "sector_specific"] },
      { id: "stage-theater-equipment", name: "Stage / Theater Equipment", sortOrder: 188, sectorTags: ["education", "hospitality", "sports"], specialtyTags: ["owner_vendor", "sector_specific"] },
      { id: "audio-visual-equipment", name: "Audio Visual Equipment", aliases: ["AV Equipment"], sortOrder: 189, sectorTags: ["office", "education", "hospitality", "commercial"], relatedTradeIds: ["av", "low-voltage-technology"] },
      { id: "equipment-loading-dock-equipment", name: "Loading Dock Equipment", sortOrder: 190, sectorTags: ["industrial", "warehouse", "retail"], relatedTradeIds: ["overhead-doors", "loading-dock-equipment"] },
      { id: "trash-chutes", name: "Trash Chutes", sortOrder: 191, sectorTags: ["multifamily", "hospitality", "healthcare"], specialtyTags: ["specialty", "sector_specific"] },
      { id: "projection-presentation-equipment", name: "Projection / Presentation Equipment", sortOrder: 192, sectorTags: ["education", "office", "hospitality"], relatedTradeIds: ["projection-screens", "av"] },
      { id: "vehicle-service-equipment", name: "Vehicle Service Equipment", sortOrder: 193, sectorTags: ["industrial", "transportation", "government"], specialtyTags: ["owner_vendor", "sector_specific"] },
    ]
  ),
  {
    id: "furnishings-ffe",
    name: "Furnishings / FF&E",
    aliases: ["Furnishings", "FF&E", "Furniture Fixtures and Equipment"],
    sortOrder: 185,
    canBeBidPackage: true,
    defaultPackageMode: "USER_CHOICE",
    isActive: true,
    defaultHidden: true,
    sectorTags: ["hospitality", "office", "education", "healthcare", "retail"],
    specialtyTags: ["owner_vendor", "allowance_candidate", "sector_specific"],
    estimatingNotes:
      "Often owner/vendor furnished or allowance-driven; include only when GC is responsible for procurement or coordination.",
  },
  ...createTradeSpecializations(
    "furnishings-ffe",
    {
      defaultPackageMode: "USER_CHOICE",
      defaultHidden: true,
      sectorTags: ["hospitality", "office", "education", "healthcare", "retail"],
      specialtyTags: ["owner_vendor", "allowance_candidate", "sector_specific"],
    },
    [
      { id: "window-treatments", name: "Window Treatments", sortOrder: 186, sectorTags: ["hospitality", "office", "healthcare", "education"], relatedTradeIds: ["glass-glazing"] },
      { id: "blinds-shades", name: "Blinds / Shades", aliases: ["Blinds", "Shades"], sortOrder: 187, relatedTradeIds: ["window-treatments"] },
      { id: "curtains-drapery", name: "Curtains / Drapery", aliases: ["Drapery"], sortOrder: 188, sectorTags: ["hospitality", "healthcare", "residential", "multifamily"] },
      { id: "fixed-seating", name: "Fixed Seating", sortOrder: 189, sectorTags: ["education", "sports", "hospitality"] },
      { id: "auditorium-seating", name: "Auditorium Seating", sortOrder: 190, sectorTags: ["education", "sports", "government"] },
      { id: "furniture", name: "Furniture", sortOrder: 191 },
      { id: "systems-furniture", name: "Systems Furniture", aliases: ["Workstations"], sortOrder: 192, sectorTags: ["office", "government", "education"] },
      { id: "artwork-accessories", name: "Artwork / Accessories", aliases: ["Artwork", "Accessories"], sortOrder: 193, sectorTags: ["hospitality", "office", "healthcare", "retail"] },
      { id: "rugs-mats", name: "Rugs / Mats", aliases: ["Rugs", "Mats"], sortOrder: 194, relatedTradeIds: ["flooring"] },
    ]
  ),
  {
    id: "conveying",
    name: "Conveying",
    aliases: ["Elevators", "Conveying Equipment", "Division 14"],
    sortOrder: 188,
    canBeBidPackage: true,
    defaultPackageMode: "USER_CHOICE",
    isActive: true,
    defaultHidden: true,
    sectorTags: ["commercial", "healthcare", "hospitality", "office", "multifamily", "transportation"],
    specialtyTags: ["specialty", "sector_specific"],
    splitRecommendation:
      "Conveying is typically bid as a specialty package when vertical transportation or material movement systems are in scope.",
  },
  ...createTradeSpecializations(
    "conveying",
    {
      defaultPackageMode: "USER_CHOICE",
      defaultHidden: true,
      sectorTags: ["commercial", "healthcare", "hospitality", "office", "multifamily", "transportation"],
      specialtyTags: ["specialty", "sector_specific"],
    },
    [
      { id: "elevators", name: "Elevators", sortOrder: 189 },
      { id: "escalators", name: "Escalators", sortOrder: 190, sectorTags: ["transportation", "airport", "retail", "commercial"] },
      { id: "platform-lifts", name: "Platform Lifts", sortOrder: 191 },
      { id: "wheelchair-lifts", name: "Wheelchair Lifts", sortOrder: 192 },
      { id: "dumbwaiters", name: "Dumbwaiters", sortOrder: 193, sectorTags: ["restaurant", "hospitality", "healthcare"] },
      { id: "material-lifts", name: "Material Lifts", sortOrder: 194, sectorTags: ["industrial", "warehouse", "healthcare"] },
      { id: "pneumatic-tube-systems", name: "Pneumatic Tube Systems", sortOrder: 195, sectorTags: ["healthcare", "laboratory"], contextTags: ["hospital"], specialtyTags: ["specialty", "sector_specific"] },
    ]
  ),
  {
    id: "fire-protection",
    name: "Fire Protection",
    aliases: ["Sprinklers", "Fire Suppression"],
    sortOrder: 190,
    canBeBidPackage: true,
    defaultPackageMode: "UMBRELLA",
    isActive: true,
    isCommon: true,
    sectorTags: ["commercial", "healthcare", "education", "industrial", "warehouse"],
    specialtyTags: ["core"],
  },
  ...createTradeSpecializations(
    "fire-protection",
    {
      defaultPackageMode: "USER_CHOICE",
      sectorTags: ["commercial", "healthcare", "education", "industrial", "warehouse"],
      specialtyTags: ["core"],
    },
    [
      { id: "fire-sprinklers", name: "Fire Sprinklers", aliases: ["Sprinklers"], sortOrder: 191 },
      { id: "fire-pump", name: "Fire Pump", aliases: ["Fire Pumps"], sortOrder: 192, defaultHidden: true, specialtyTags: ["specialty", "sector_specific"] },
      { id: "standpipes", name: "Standpipes", sortOrder: 193, defaultHidden: true, specialtyTags: ["specialty", "sector_specific"] },
      { id: "clean-agent-fire-suppression", name: "Clean Agent Fire Suppression", aliases: ["Clean Agent", "Pre-Action", "FM-200"], sortOrder: 194, defaultHidden: true, sectorTags: ["mission_critical", "laboratory", "healthcare", "industrial"], specialtyTags: ["specialty", "sector_specific"] },
      { id: "kitchen-hood-fire-suppression", name: "Kitchen Hood Fire Suppression", aliases: ["Hood Suppression"], sortOrder: 195, defaultHidden: true, sectorTags: ["restaurant", "education"], contextTags: ["commercial_kitchen"], specialtyTags: ["specialty", "sector_specific"], relatedTradeIds: ["food-service-equipment", "hvac"] },
      { id: "fireproofing", name: "Fireproofing", aliases: ["Spray Fireproofing", "Intumescent Fireproofing"], sortOrder: 196, defaultHidden: true, sectorTags: ["commercial", "industrial", "office"], specialtyTags: ["specialty", "cross_trade"], relatedTradeIds: ["structural-steel", "painting-coatings"] },
    ]
  ),
  {
    id: "plumbing",
    name: "Plumbing",
    aliases: ["Plumbing Fixtures", "Plumbing Piping"],
    sortOrder: 200,
    canBeBidPackage: true,
    defaultPackageMode: "UMBRELLA",
    isActive: true,
    isCommon: true,
    sectorTags: ["commercial", "healthcare", "education", "hospitality", "restaurant", "laboratory"],
    specialtyTags: ["core"],
  },
  ...createTradeSpecializations(
    "plumbing",
    {
      defaultPackageMode: "USER_CHOICE",
      sectorTags: ["commercial", "healthcare", "education", "hospitality", "restaurant", "laboratory"],
      specialtyTags: ["core"],
    },
    [
      { id: "plumbing-fixtures", name: "Plumbing Fixtures", aliases: ["Fixtures"], sortOrder: 201 },
      { id: "domestic-water", name: "Domestic Water", aliases: ["Domestic Water Piping"], sortOrder: 202 },
      { id: "sanitary-waste-vent", name: "Sanitary Waste / Vent", aliases: ["Sanitary", "Waste and Vent"], sortOrder: 203 },
      { id: "plumbing-storm-drainage", name: "Storm Drainage", aliases: ["Storm Piping"], sortOrder: 204, relatedTradeIds: ["storm-drainage"] },
      { id: "plumbing-gas-piping", name: "Gas Piping", aliases: ["Natural Gas Piping"], sortOrder: 205, relatedTradeIds: ["gas-service"] },
    ]
  ),
  {
    id: "medical-gas",
    parentId: "plumbing",
    name: "Medical Gas",
    aliases: ["Med Gas", "Medical Gas Piping"],
    sortOrder: 201,
    canBeBidPackage: true,
    defaultPackageMode: "USER_CHOICE",
    isActive: true,
    defaultHidden: true,
    sectorTags: ["healthcare", "laboratory"],
    contextTags: ["medical_office", "hospital", "surgery_center"],
    specialtyTags: ["sector_specific", "specialty"],
    relatedTradeIds: ["plumbing"],
    estimatingNotes:
      "Medical Gas is healthcare/laboratory-specific and should stay hidden for typical commercial projects.",
  },
  ...createTradeSpecializations(
    "plumbing",
    {
      defaultPackageMode: "USER_CHOICE",
      defaultHidden: true,
      sectorTags: ["healthcare", "laboratory", "industrial", "restaurant"],
      specialtyTags: ["specialty", "sector_specific"],
    },
    [
      { id: "compressed-air", name: "Compressed Air", aliases: ["Compressed Air Piping"], sortOrder: 207, sectorTags: ["industrial", "laboratory", "healthcare"] },
      { id: "vacuum-systems", name: "Vacuum Systems", aliases: ["Vacuum Piping"], sortOrder: 208, sectorTags: ["healthcare", "laboratory", "industrial"] },
      { id: "plumbing-process-piping", name: "Process Piping", sortOrder: 209, sectorTags: ["industrial", "laboratory", "cleanroom"], relatedTradeIds: ["process-systems"] },
      { id: "water-heaters", name: "Water Heaters", sortOrder: 210, defaultHidden: false, specialtyTags: ["core"] },
      { id: "plumbing-pumps", name: "Pumps", aliases: ["Plumbing Pumps"], sortOrder: 211, defaultHidden: false, specialtyTags: ["core"] },
      { id: "grease-interceptors", name: "Grease Interceptors", sortOrder: 212, sectorTags: ["restaurant"], contextTags: ["commercial_kitchen"], relatedTradeIds: ["food-service-equipment"] },
      { id: "oil-sand-interceptors", name: "Oil / Sand Interceptors", sortOrder: 213, sectorTags: ["industrial", "transportation", "government"] },
      { id: "plumbing-insulation", name: "Plumbing Insulation", sortOrder: 214, defaultHidden: false, specialtyTags: ["core", "cross_trade"], relatedTradeIds: ["insulation"] },
    ]
  ),
  {
    id: "hvac",
    name: "HVAC",
    aliases: ["Mechanical", "Heating Ventilating Air Conditioning"],
    sortOrder: 210,
    canBeBidPackage: true,
    defaultPackageMode: "USER_CHOICE",
    isActive: true,
    isCommon: true,
    sectorTags: ["commercial", "healthcare", "education", "industrial", "office", "retail"],
    specialtyTags: ["core"],
    splitRecommendation:
      "Split equipment, ductwork, and controls when specialty subs or design packages warrant it.",
  },
  ...createTradeSpecializations(
    "hvac",
    {
      defaultPackageMode: "USER_CHOICE",
      sectorTags: ["commercial", "healthcare", "education", "industrial", "office", "retail"],
      specialtyTags: ["core"],
    },
    [
      { id: "air-handling-units", name: "Air Handling Units", aliases: ["AHUs"], sortOrder: 211 },
      { id: "rooftop-units", name: "Rooftop Units", aliases: ["RTUs"], sortOrder: 212 },
      { id: "split-systems-vrf", name: "Split Systems / VRF", aliases: ["Split Systems", "VRF"], sortOrder: 213 },
    ]
  ),
  {
    id: "hvac-equipment",
    parentId: "hvac",
    name: "HVAC Equipment",
    aliases: ["Mechanical Equipment"],
    sortOrder: 211,
    canBeBidPackage: true,
    defaultPackageMode: "USER_CHOICE",
    isActive: true,
    defaultHidden: true,
    sectorTags: ["commercial", "healthcare", "industrial", "mission_critical"],
    specialtyTags: ["specialty", "owner_vendor"],
    relatedTradeIds: ["hvac"],
  },
  {
    id: "ductwork-air-distribution",
    parentId: "hvac",
    name: "Ductwork / Air Distribution",
    aliases: ["Ductwork", "Air Distribution"],
    sortOrder: 212,
    canBeBidPackage: true,
    defaultPackageMode: "UMBRELLA",
    isActive: true,
    isCommon: true,
    sectorTags: ["commercial", "healthcare", "education", "industrial", "office"],
    specialtyTags: ["core"],
  },
  ...createTradeSpecializations(
    "hvac",
    {
      defaultPackageMode: "USER_CHOICE",
      sectorTags: ["commercial", "healthcare", "education", "industrial", "office", "retail"],
      specialtyTags: ["core"],
    },
    [
      { id: "hydronic-piping", name: "Hydronic Piping", sortOrder: 214 },
      { id: "chilled-water", name: "Chilled Water", aliases: ["Chilled Water Piping"], sortOrder: 215 },
      { id: "hot-water", name: "Hot Water", aliases: ["Heating Hot Water"], sortOrder: 216 },
      { id: "steam-condensate", name: "Steam / Condensate", aliases: ["Steam Piping", "Condensate Piping"], sortOrder: 217, defaultHidden: true, sectorTags: ["healthcare", "industrial", "laboratory"], specialtyTags: ["specialty", "sector_specific"] },
      { id: "refrigerant-piping", name: "Refrigerant Piping", sortOrder: 218 },
      { id: "exhaust-systems", name: "Exhaust Systems", aliases: ["Exhaust"], sortOrder: 219 },
      { id: "kitchen-exhaust", name: "Kitchen Exhaust", sortOrder: 220, defaultHidden: true, sectorTags: ["restaurant"], contextTags: ["commercial_kitchen"], specialtyTags: ["specialty", "sector_specific"], relatedTradeIds: ["food-service-equipment", "kitchen-hood", "grease-duct"] },
      { id: "lab-exhaust", name: "Lab Exhaust", sortOrder: 221, defaultHidden: true, sectorTags: ["laboratory", "cleanroom", "healthcare"], specialtyTags: ["specialty", "sector_specific"], relatedTradeIds: ["laboratory-cleanroom-systems"] },
    ]
  ),
  {
    id: "controls",
    parentId: "hvac",
    name: "Controls / BAS",
    aliases: ["Building Automation", "BAS", "Temperature Controls"],
    sortOrder: 213,
    canBeBidPackage: true,
    defaultPackageMode: "USER_CHOICE",
    isActive: true,
    defaultHidden: true,
    sectorTags: ["commercial", "healthcare", "industrial", "laboratory", "mission_critical"],
    specialtyTags: ["specialty", "cross_trade", "owner_vendor"],
    relatedTradeIds: ["electrical", "low-voltage-technology"],
    splitRecommendation:
      "Controls can sit with HVAC, electrical, or low-voltage depending on project delivery and vendor package.",
  },
  ...createTradeSpecializations(
    "hvac",
    {
      defaultPackageMode: "USER_CHOICE",
      sectorTags: ["commercial", "healthcare", "education", "industrial", "office", "retail"],
      specialtyTags: ["core"],
    },
    [
      { id: "testing-adjusting-balancing", name: "Testing Adjusting & Balancing", aliases: ["TAB", "Testing and Balancing"], sortOrder: 223, specialtyTags: ["specialty"] },
      { id: "mechanical-insulation", name: "Mechanical Insulation", sortOrder: 224, specialtyTags: ["core", "cross_trade"], relatedTradeIds: ["insulation"] },
      { id: "vibration-isolation", name: "Vibration Isolation", sortOrder: 225, defaultHidden: true, sectorTags: ["healthcare", "laboratory", "industrial"], specialtyTags: ["specialty", "sector_specific"] },
    ]
  ),
  {
    id: "electrical",
    name: "Electrical",
    aliases: ["Power", "Lighting"],
    sortOrder: 220,
    canBeBidPackage: true,
    defaultPackageMode: "USER_CHOICE",
    isActive: true,
    isCommon: true,
    sectorTags: ["commercial", "healthcare", "education", "industrial", "office", "retail"],
    specialtyTags: ["core"],
    splitRecommendation:
      "Power distribution, lighting, devices, and systems may split on large or specialty projects.",
  },
  ...createTradeSpecializations(
    "electrical",
    {
      defaultPackageMode: "USER_CHOICE",
      sectorTags: ["commercial", "healthcare", "education", "industrial", "office", "retail"],
      specialtyTags: ["core"],
    },
    [
      { id: "electrical-service", name: "Electrical Service", sortOrder: 221 },
    ]
  ),
  {
    id: "power-distribution",
    parentId: "electrical",
    name: "Power Distribution",
    aliases: ["Distribution", "Switchgear", "Panels"],
    sortOrder: 221,
    canBeBidPackage: true,
    defaultPackageMode: "UMBRELLA",
    isActive: true,
  },
  ...createTradeSpecializations(
    "electrical",
    {
      defaultPackageMode: "USER_CHOICE",
      sectorTags: ["commercial", "healthcare", "education", "industrial", "office", "retail"],
      specialtyTags: ["core"],
    },
    [
      { id: "switchgear", name: "Switchgear", sortOrder: 222 },
      { id: "panels", name: "Panels", aliases: ["Panelboards"], sortOrder: 223 },
      { id: "transformers", name: "Transformers", sortOrder: 224 },
      { id: "feeders", name: "Feeders", sortOrder: 225 },
      { id: "branch-wiring", name: "Branch Wiring", sortOrder: 226 },
    ]
  ),
  {
    id: "lighting",
    parentId: "electrical",
    name: "Lighting",
    aliases: ["Light Fixtures", "Lighting Controls"],
    sortOrder: 227,
    canBeBidPackage: true,
    defaultPackageMode: "USER_CHOICE",
    isActive: true,
  },
  {
    id: "devices",
    parentId: "electrical",
    name: "Devices",
    aliases: ["Wiring Devices", "Receptacles", "Switches"],
    sortOrder: 229,
    canBeBidPackage: true,
    defaultPackageMode: "UMBRELLA",
    isActive: true,
  },
  ...createTradeSpecializations(
    "electrical",
    {
      defaultPackageMode: "USER_CHOICE",
      sectorTags: ["commercial", "healthcare", "education", "industrial", "office", "retail"],
      specialtyTags: ["core"],
    },
    [
      { id: "lighting-controls", name: "Lighting Controls", sortOrder: 228, relatedTradeIds: ["lighting", "controls"] },
      { id: "emergency-power", name: "Emergency Power", sortOrder: 230, defaultHidden: true, sectorTags: ["healthcare", "mission_critical", "industrial", "government"], specialtyTags: ["specialty", "sector_specific"] },
      { id: "generator", name: "Generator", aliases: ["Generators"], sortOrder: 231, defaultHidden: true, sectorTags: ["healthcare", "mission_critical", "industrial", "government"], specialtyTags: ["specialty", "sector_specific"] },
      { id: "ups", name: "UPS", aliases: ["Uninterruptible Power Supply"], sortOrder: 232, defaultHidden: true, sectorTags: ["mission_critical", "healthcare", "laboratory"], specialtyTags: ["specialty", "sector_specific"] },
      { id: "lightning-protection", name: "Lightning Protection", sortOrder: 233, defaultHidden: true, sectorTags: ["commercial", "government", "industrial"], specialtyTags: ["specialty", "sector_specific"] },
      { id: "grounding", name: "Grounding", sortOrder: 234 },
      { id: "temporary-power", name: "Temporary Power", sortOrder: 235, specialtyTags: ["core", "gc_cost"], relatedTradeIds: ["general-requirements"] },
    ]
  ),
  {
    id: "low-voltage-technology",
    name: "Low Voltage / Technology",
    aliases: ["Low Voltage", "Technology", "Communications"],
    sortOrder: 230,
    canBeBidPackage: true,
    defaultPackageMode: "USER_CHOICE",
    defaultScopeNotes: ["Split by specialization when specialist subcontractors are expected."],
    isActive: true,
    isCommon: true,
    sectorTags: ["commercial", "healthcare", "education", "office", "retail", "mission_critical"],
    specialtyTags: ["core", "cross_trade"],
    relatedTradeIds: ["electrical", "controls"],
    splitRecommendation:
      "Split data, security, AV, and fire alarm when distinct specialist subcontractors are expected.",
  },
  {
    id: "data-communications",
    parentId: "low-voltage-technology",
    name: "Data / Communications",
    aliases: ["Data", "Telecom", "Communications"],
    sortOrder: 231,
    canBeBidPackage: true,
    defaultPackageMode: "UMBRELLA",
    isActive: true,
  },
  ...createTradeSpecializations(
    "low-voltage-technology",
    {
      defaultPackageMode: "USER_CHOICE",
      sectorTags: ["commercial", "healthcare", "education", "office", "retail", "mission_critical"],
      specialtyTags: ["core"],
    },
    [
      { id: "structured-cabling", name: "Structured Cabling", aliases: ["Cabling"], sortOrder: 232, relatedTradeIds: ["data-communications"] },
      { id: "fiber-optic-cabling", name: "Fiber Optic Cabling", aliases: ["Fiber"], sortOrder: 233, defaultHidden: true, sectorTags: ["mission_critical", "office", "education", "healthcare"], specialtyTags: ["specialty", "sector_specific"], relatedTradeIds: ["data-communications"] },
    ]
  ),
  {
    id: "security-access-control",
    parentId: "low-voltage-technology",
    name: "Security / Access Control",
    aliases: ["Security", "Access Control", "CCTV"],
    sortOrder: 232,
    canBeBidPackage: true,
    defaultPackageMode: "UMBRELLA",
    isActive: true,
  },
  ...createTradeSpecializations(
    "low-voltage-technology",
    {
      defaultPackageMode: "USER_CHOICE",
      sectorTags: ["commercial", "healthcare", "education", "office", "retail", "mission_critical"],
      specialtyTags: ["core"],
    },
    [
      { id: "security", name: "Security", sortOrder: 235, relatedTradeIds: ["security-access-control"] },
      { id: "access-control", name: "Access Control", sortOrder: 236, relatedTradeIds: ["security-access-control"] },
      { id: "cctv-video-surveillance", name: "CCTV / Video Surveillance", aliases: ["CCTV", "Video Surveillance"], sortOrder: 237, relatedTradeIds: ["security-access-control"] },
      { id: "intrusion-detection", name: "Intrusion Detection", sortOrder: 238, defaultHidden: true, sectorTags: ["commercial", "government", "detention", "mission_critical"], specialtyTags: ["specialty", "sector_specific"], relatedTradeIds: ["security-access-control"] },
    ]
  ),
  {
    id: "av",
    parentId: "low-voltage-technology",
    name: "AV",
    aliases: ["Audio Visual", "Audiovisual"],
    sortOrder: 233,
    canBeBidPackage: true,
    defaultPackageMode: "UMBRELLA",
    isActive: true,
  },
  ...createTradeSpecializations(
    "low-voltage-technology",
    {
      defaultPackageMode: "USER_CHOICE",
      sectorTags: ["commercial", "healthcare", "education", "office", "retail", "mission_critical"],
      specialtyTags: ["core"],
    },
    [
      { id: "sound-paging", name: "Sound / Paging", aliases: ["Paging", "Sound System"], sortOrder: 240, relatedTradeIds: ["av"] },
      { id: "nurse-call", name: "Nurse Call", sortOrder: 241, defaultHidden: true, sectorTags: ["healthcare"], contextTags: ["medical_office", "hospital", "surgery_center"], specialtyTags: ["specialty", "sector_specific"] },
      { id: "clock-systems", name: "Clock Systems", sortOrder: 242, defaultHidden: true, sectorTags: ["education", "healthcare"], specialtyTags: ["specialty", "sector_specific"] },
      { id: "intercom", name: "Intercom", sortOrder: 243, defaultHidden: true, sectorTags: ["education", "government", "commercial"], specialtyTags: ["specialty", "sector_specific"] },
    ]
  ),
  {
    id: "fire-alarm",
    parentId: "low-voltage-technology",
    name: "Fire Alarm",
    aliases: ["FA"],
    sortOrder: 234,
    canBeBidPackage: true,
    defaultPackageMode: "USER_CHOICE",
    isActive: true,
    defaultHidden: true,
    sectorTags: ["commercial", "healthcare", "education", "industrial", "mission_critical"],
    specialtyTags: ["specialty", "cross_trade"],
    relatedTradeIds: ["electrical", "fire-protection"],
  },
  ...createTradeSpecializations(
    "low-voltage-technology",
    {
      defaultPackageMode: "USER_CHOICE",
      defaultHidden: true,
      sectorTags: ["commercial", "healthcare", "education", "office", "retail", "mission_critical"],
      specialtyTags: ["specialty", "sector_specific"],
    },
    [
      { id: "building-automation-controls", name: "Building Automation / Controls", aliases: ["BAS", "Building Automation"], sortOrder: 245, specialtyTags: ["specialty", "cross_trade"], relatedTradeIds: ["controls", "electrical"] },
      { id: "das-cellular-enhancement", name: "DAS / Cellular Enhancement", aliases: ["DAS", "Cellular Enhancement"], sortOrder: 246, sectorTags: ["commercial", "healthcare", "airport", "sports", "mission_critical"] },
      { id: "wi-fi", name: "Wi-Fi", aliases: ["Wireless", "Wireless Access Points"], sortOrder: 247, sectorTags: ["commercial", "education", "office", "hospitality", "healthcare"], relatedTradeIds: ["data-communications"] },
    ]
  ),
  {
    id: "process-systems",
    name: "Process Systems",
    aliases: ["Process", "Process Utilities"],
    sortOrder: 300,
    canBeBidPackage: true,
    defaultPackageMode: "USER_CHOICE",
    isActive: true,
    defaultHidden: true,
    sectorTags: ["industrial", "laboratory", "cleanroom"],
    specialtyTags: ["sector_specific", "specialty", "owner_vendor"],
    relatedTradeIds: ["plumbing-process-piping", "electrical", "hvac"],
  },
  {
    id: "healthcare-systems",
    name: "Healthcare",
    aliases: ["Healthcare Specialty Systems"],
    sortOrder: 310,
    canBeBidPackage: true,
    defaultPackageMode: "USER_CHOICE",
    isActive: true,
    defaultHidden: true,
    sectorTags: ["healthcare"],
    specialtyTags: ["sector_specific", "specialty", "owner_vendor"],
    relatedTradeIds: ["medical-gas", "nurse-call", "medical-equipment", "radiation-shielding", "pneumatic-tube-systems"],
  },
  ...createTradeSpecializations(
    "healthcare-systems",
    {
      defaultPackageMode: "USER_CHOICE",
      defaultHidden: true,
      sectorTags: ["healthcare"],
      specialtyTags: ["sector_specific", "specialty", "owner_vendor"],
    },
    [
      {
        id: "imaging-equipment-support",
        name: "Imaging Equipment Support",
        aliases: ["Imaging Support", "Radiology Equipment Support", "MRI Support", "CT Support"],
        sortOrder: 311,
        contextTags: ["imaging", "hospital", "medical_office"],
        relatedTradeIds: ["medical-equipment", "radiation-shielding", "electrical", "hvac"],
        estimatingNotes:
          "Coordinate structural, electrical, mechanical, shielding, and vendor requirements for imaging equipment.",
      },
      {
        id: "icra-infection-control",
        name: "ICRA / Infection Control",
        aliases: ["ICRA", "Infection Control", "Healthcare Containment"],
        sortOrder: 312,
        contextTags: ["infection_control", "hospital", "surgery_center", "occupied_building"],
        relatedTradeIds: ["temporary-protection", "general-requirements"],
        estimatingNotes:
          "Usually carried as temporary protection, phasing, containment, cleaning, and healthcare infection-control requirements.",
      },
      {
        id: "lead-lined-construction",
        name: "Lead-Lined Construction",
        aliases: ["Lead Lining", "Lead-Lined Drywall", "Lead-Lined Doors", "Shielded Construction"],
        sortOrder: 313,
        contextTags: ["imaging", "hospital", "medical_office"],
        relatedTradeIds: ["radiation-shielding", "drywall-framing", "doors-frames-hardware"],
        estimatingNotes:
          "May be packaged with radiation shielding, drywall, or doors depending on project documents and company practice.",
      },
    ]
  ),
  {
    id: "laboratory-cleanroom-systems",
    name: "Laboratory / Cleanroom",
    aliases: ["Laboratory", "Cleanroom"],
    sortOrder: 320,
    canBeBidPackage: true,
    defaultPackageMode: "USER_CHOICE",
    isActive: true,
    defaultHidden: true,
    sectorTags: ["laboratory", "cleanroom", "healthcare"],
    specialtyTags: ["sector_specific", "specialty", "owner_vendor"],
    relatedTradeIds: ["laboratory-equipment", "lab-exhaust", "plumbing-process-piping"],
  },
  {
    id: "food-service-systems",
    name: "Food Service",
    aliases: ["Foodservice"],
    sortOrder: 330,
    canBeBidPackage: true,
    defaultPackageMode: "USER_CHOICE",
    isActive: true,
    defaultHidden: true,
    sectorTags: ["restaurant", "education"],
    contextTags: ["commercial_kitchen"],
    specialtyTags: ["sector_specific", "specialty", "owner_vendor"],
    relatedTradeIds: ["food-service-equipment", "commercial-kitchen-equipment", "kitchen-hood", "kitchen-exhaust", "grease-duct", "walk-in-coolers-freezers", "refrigeration"],
  },
  ...createTradeSpecializations(
    "food-service-systems",
    {
      defaultPackageMode: "USER_CHOICE",
      defaultHidden: true,
      sectorTags: ["restaurant"],
      contextTags: ["commercial_kitchen"],
      specialtyTags: ["sector_specific", "specialty", "owner_vendor"],
    },
    [
      {
        id: "kitchen-hood",
        name: "Kitchen Hood",
        aliases: ["Commercial Kitchen Hood", "Exhaust Hood", "Range Hood"],
        sortOrder: 331,
        relatedTradeIds: ["kitchen-exhaust", "kitchen-hood-fire-suppression", "hvac"],
      },
      {
        id: "grease-duct",
        name: "Grease Duct",
        aliases: ["Commercial Grease Duct", "Kitchen Grease Duct"],
        sortOrder: 332,
        relatedTradeIds: ["kitchen-exhaust", "kitchen-hood", "hvac"],
      },
      {
        id: "walk-in-coolers-freezers",
        name: "Walk-In Coolers / Freezers",
        aliases: ["Walk-In Coolers", "Walk-In Freezers", "Cold Rooms"],
        sortOrder: 333,
        contextTags: ["commercial_kitchen", "food_processing", "cold_storage"],
        relatedTradeIds: ["refrigeration", "food-service-equipment", "hvac"],
      },
      {
        id: "refrigeration",
        name: "Refrigeration",
        aliases: ["Commercial Refrigeration", "Kitchen Refrigeration"],
        sortOrder: 334,
        contextTags: ["commercial_kitchen", "food_processing", "cold_storage"],
        relatedTradeIds: ["refrigerant-piping", "hvac", "walk-in-coolers-freezers"],
      },
    ]
  ),
  {
    id: "residential-multifamily-systems",
    name: "Residential / Multifamily",
    aliases: ["Residential", "Multifamily"],
    sortOrder: 340,
    canBeBidPackage: true,
    defaultPackageMode: "USER_CHOICE",
    isActive: true,
    defaultHidden: true,
    sectorTags: ["residential", "multifamily"],
    specialtyTags: ["sector_specific", "specialty"],
    relatedTradeIds: ["residential-appliances", "wood-flooring", "conveying"],
  },
  {
    id: "railroad-transit",
    name: "Railroad / Transit",
    aliases: ["Railroad", "Transit"],
    sortOrder: 350,
    canBeBidPackage: true,
    defaultPackageMode: "USER_CHOICE",
    isActive: true,
    defaultHidden: true,
    sectorTags: ["transportation"],
    specialtyTags: ["sector_specific", "specialty"],
  },
  {
    id: "marine-waterfront",
    name: "Marine / Waterfront",
    aliases: ["Marine", "Waterfront"],
    sortOrder: 360,
    canBeBidPackage: true,
    defaultPackageMode: "USER_CHOICE",
    isActive: true,
    defaultHidden: true,
    sectorTags: ["marine"],
    contextTags: ["marine_waterfront"],
    specialtyTags: ["sector_specific", "specialty"],
  },
  {
    id: "airport-airfield",
    name: "Airport / Airfield",
    aliases: ["Airport", "Airfield"],
    sortOrder: 370,
    canBeBidPackage: true,
    defaultPackageMode: "USER_CHOICE",
    isActive: true,
    defaultHidden: true,
    sectorTags: ["airport"],
    contextTags: ["airport_secure_area"],
    specialtyTags: ["sector_specific", "specialty"],
  },
  {
    id: "solar-photovoltaic",
    name: "Solar / Photovoltaic",
    aliases: ["Solar", "PV", "Photovoltaic"],
    sortOrder: 380,
    canBeBidPackage: true,
    defaultPackageMode: "USER_CHOICE",
    isActive: true,
    defaultHidden: true,
    sectorTags: ["renewable_energy"],
    specialtyTags: ["sector_specific", "specialty", "owner_vendor"],
    relatedTradeIds: ["electrical", "roofing"],
  },
  {
    id: "ev-charging",
    name: "EV Charging",
    aliases: ["Electric Vehicle Charging", "EV Chargers"],
    sortOrder: 390,
    canBeBidPackage: true,
    defaultPackageMode: "USER_CHOICE",
    isActive: true,
    defaultHidden: true,
    sectorTags: ["renewable_energy", "retail", "transportation"],
    specialtyTags: ["sector_specific", "specialty", "owner_vendor"],
    relatedTradeIds: ["electrical", "sitework"],
  },
  {
    id: "wind-renewable-energy",
    name: "Wind / Renewable Energy",
    aliases: ["Wind", "Renewable Energy"],
    sortOrder: 400,
    canBeBidPackage: true,
    defaultPackageMode: "USER_CHOICE",
    isActive: true,
    defaultHidden: true,
    sectorTags: ["renewable_energy"],
    specialtyTags: ["sector_specific", "specialty", "owner_vendor"],
  },
  {
    id: "oil-gas-fuel-systems",
    name: "Oil / Gas / Fuel Systems",
    aliases: ["Fuel Systems", "Oil and Gas"],
    sortOrder: 410,
    canBeBidPackage: true,
    defaultPackageMode: "USER_CHOICE",
    isActive: true,
    defaultHidden: true,
    sectorTags: ["marine", "airport"],
    contextTags: ["marine_waterfront"],
    specialtyTags: ["sector_specific", "specialty"],
    relatedTradeIds: ["plumbing-gas-piping", "electrical"],
  },
  {
    id: "pools-aquatics",
    name: "Pools / Aquatics",
    aliases: ["Pools", "Aquatics"],
    sortOrder: 420,
    canBeBidPackage: true,
    defaultPackageMode: "USER_CHOICE",
    isActive: true,
    defaultHidden: true,
    sectorTags: ["sports", "hospitality", "residential", "multifamily"],
    specialtyTags: ["sector_specific", "specialty"],
  },
  {
    id: "sports-athletic-surfacing",
    name: "Sports / Athletic Surfacing",
    aliases: ["Athletic Surfacing", "Sports Surfacing"],
    sortOrder: 430,
    canBeBidPackage: true,
    defaultPackageMode: "USER_CHOICE",
    isActive: true,
    defaultHidden: true,
    sectorTags: ["sports", "education"],
    specialtyTags: ["sector_specific", "specialty"],
    relatedTradeIds: ["athletic-flooring", "athletic-fields"],
  },
  {
    id: "theater-stage-rigging",
    name: "Theater / Stage Rigging",
    aliases: ["Theater Rigging", "Stage Rigging"],
    sortOrder: 440,
    canBeBidPackage: true,
    defaultPackageMode: "USER_CHOICE",
    isActive: true,
    defaultHidden: true,
    sectorTags: ["education", "hospitality", "sports"],
    specialtyTags: ["sector_specific", "specialty", "owner_vendor"],
    relatedTradeIds: ["stage-theater-equipment"],
  },
  {
    id: "detention-equipment",
    name: "Detention Equipment",
    aliases: ["Detention"],
    sortOrder: 450,
    canBeBidPackage: true,
    defaultPackageMode: "USER_CHOICE",
    isActive: true,
    defaultHidden: true,
    sectorTags: ["detention"],
    specialtyTags: ["sector_specific", "specialty"],
  },
  {
    id: "security-hardening-ballistic-protection",
    name: "Security Hardening / Ballistic Protection",
    aliases: ["Security Hardening", "Ballistic Protection"],
    sortOrder: 460,
    canBeBidPackage: true,
    defaultPackageMode: "USER_CHOICE",
    isActive: true,
    defaultHidden: true,
    sectorTags: ["detention", "mission_critical"],
    contextTags: ["secure_facility"],
    specialtyTags: ["sector_specific", "specialty"],
    relatedTradeIds: ["security-access-control", "glass-glazing", "doors-frames-hardware"],
  },
  {
    id: "radiation-shielding",
    name: "Radiation Shielding",
    aliases: ["Lead Lining", "Shielding"],
    sortOrder: 470,
    canBeBidPackage: true,
    defaultPackageMode: "USER_CHOICE",
    isActive: true,
    defaultHidden: true,
    sectorTags: ["healthcare", "laboratory"],
    contextTags: ["imaging", "hospital", "medical_office"],
    specialtyTags: ["sector_specific", "specialty"],
    relatedTradeIds: ["healthcare-systems", "drywall-framing"],
  },
  {
    id: "agricultural-greenhouse-systems",
    name: "Agricultural / Greenhouse Systems",
    aliases: ["Agricultural", "Greenhouse Systems"],
    sortOrder: 480,
    canBeBidPackage: true,
    defaultPackageMode: "USER_CHOICE",
    isActive: true,
    defaultHidden: true,
    sectorTags: ["agricultural"],
    specialtyTags: ["sector_specific", "specialty", "owner_vendor"],
  },
];

export function getDefaultTradeTaxonomy(): TradeTaxonomyNode[] {
  return defaultTradeTaxonomy.map((node) => ({ ...node }));
}

export function getTradeById(id: string): TradeTaxonomyNode | undefined {
  const trade = defaultTradeTaxonomy.find((node) => node.id === id);

  return trade ? { ...trade } : undefined;
}

export function getTradeChildren(parentId: string): TradeTaxonomyNode[] {
  return defaultTradeTaxonomy
    .filter((node) => node.parentId === parentId)
    .sort(compareTradeNodes)
    .map((node) => ({ ...node }));
}

export function getTradeSpecializations(parentId: string): TradeTaxonomyNode[] {
  return getTradeChildren(parentId);
}

export function getVisibleTradesForSector(
  taxonomy: TradeTaxonomyNode[],
  sectorTags: ProjectSectorTag[]
): TradeTaxonomyNode[] {
  return taxonomy
    .filter((node) => shouldShowTradeForProject(node, { sectorTags }))
    .sort(compareTradeNodes)
    .map((node) => ({ ...node }));
}

export function getVisibleTradeTaxonomyForProject(
  context: {
    taxonomy: TradeTaxonomyNode[];
  } & TradeVisibilityContext
): TradeTaxonomyNode[] {
  const { taxonomy } = context;

  return taxonomy
    .filter((node) => shouldShowTradeForProject(node, context))
    .sort(compareTradeNodes)
    .map((node) => ({ ...node }));
}

export function shouldShowTradeForSector(
  trade: TradeTaxonomyNode,
  sectorTags: ProjectSectorTag[],
  includeHidden: boolean
): boolean {
  return shouldShowTradeForProject(trade, { sectorTags, includeHidden });
}

export function shouldShowTradeForProject(
  trade: TradeTaxonomyNode,
  context: TradeVisibilityContext = {}
): boolean {
  if (!trade.isActive) return false;
  if (context.includeHidden) return true;
  if (isSuppressedForOfficeTenantImprovement(trade, context)) return false;
  if (isSuppressedForSiteworkOnly(trade, context)) return false;
  if (!trade.defaultHidden) return true;

  return isTradeTriggeredForProject(trade, context);
}

export function getSectorTriggeredTrades(
  taxonomy: TradeTaxonomyNode[],
  sectorTags: ProjectSectorTag[]
): TradeTaxonomyNode[] {
  return getTriggeredTradesForProject(taxonomy, { sectorTags });
}

export function getTriggeredTradesForProject(
  taxonomy: TradeTaxonomyNode[],
  context: TradeVisibilityContext = {}
): TradeTaxonomyNode[] {
  return taxonomy
    .filter((node) => node.defaultHidden)
    .filter((node) => shouldShowTradeForProject(node, context))
    .sort(compareTradeNodes)
    .map((node) => ({ ...node }));
}

export function getHiddenTrades(taxonomy: TradeTaxonomyNode[]): TradeTaxonomyNode[] {
  return taxonomy
    .filter((node) => node.defaultHidden)
    .sort(compareTradeNodes)
    .map((node) => ({ ...node }));
}

export function getCommonTrades(taxonomy: TradeTaxonomyNode[]): TradeTaxonomyNode[] {
  return taxonomy
    .filter((node) => node.isCommon)
    .sort(compareTradeNodes)
    .map((node) => ({ ...node }));
}

export function getTradesBySector(
  taxonomy: TradeTaxonomyNode[],
  sectorTag: ProjectSectorTag
): TradeTaxonomyNode[] {
  return taxonomy
    .filter((node) => node.sectorTags?.includes(sectorTag))
    .sort(compareTradeNodes)
    .map((node) => ({ ...node }));
}

export function getRelatedTrades(tradeId: string): TradeTaxonomyNode[] {
  const trade = defaultTradeTaxonomy.find((node) => node.id === tradeId);
  if (!trade?.relatedTradeIds?.length) return [];

  const relatedTradeIds = new Set(trade.relatedTradeIds);

  return defaultTradeTaxonomy
    .filter((node) => relatedTradeIds.has(node.id))
    .sort(compareTradeNodes)
    .map((node) => ({ ...node }));
}

export function getTradeAncestors(id: string): TradeTaxonomyNode[] {
  const ancestors: TradeTaxonomyNode[] = [];
  let currentNode = defaultTradeTaxonomy.find((node) => node.id === id);

  while (currentNode?.parentId) {
    const parentNode = defaultTradeTaxonomy.find(
      (node) => node.id === currentNode?.parentId
    );

    if (!parentNode) break;
    ancestors.unshift({ ...parentNode });
    currentNode = parentNode;
  }

  return ancestors;
}

function compareTradeNodes(
  leftNode: TradeTaxonomyNode,
  rightNode: TradeTaxonomyNode
) {
  return leftNode.sortOrder - rightNode.sortOrder;
}

function isTradeTriggeredForProject(
  trade: TradeTaxonomyNode,
  context: TradeVisibilityContext
): boolean {
  const sectorTags = new Set(context.sectorTags ?? []);
  const workTypeTags = new Set(context.workTypeTags ?? []);
  const contextTags = new Set(context.contextTags ?? []);

  if (trade.sectorTags?.some((tag) => sectorTags.has(tag))) return true;
  if (trade.workTypeTags?.some((tag) => workTypeTags.has(tag))) return true;
  if (trade.contextTags?.some((tag) => contextTags.has(tag))) return true;

  return getTriggeredTradeIdsForContext(context).has(trade.id);
}

function isSuppressedForOfficeTenantImprovement(
  trade: TradeTaxonomyNode,
  context: TradeVisibilityContext
): boolean {
  const sectorTags = new Set(context.sectorTags ?? []);
  const workTypeTags = new Set(context.workTypeTags ?? []);

  if (!sectorTags.has("office") || !workTypeTags.has("tenant_improvement")) {
    return false;
  }

  if (officeTenantImprovementSuppressedTradeIds.has(trade.id)) return true;

  let currentParentId = trade.parentId;

  while (currentParentId) {
    if (officeTenantImprovementSuppressedTradeIds.has(currentParentId)) return true;

    currentParentId = defaultTradeTaxonomy.find((node) => node.id === currentParentId)?.parentId;
  }

  return false;
}

function isSuppressedForSiteworkOnly(
  trade: TradeTaxonomyNode,
  context: TradeVisibilityContext
): boolean {
  const workTypeTags = new Set(context.workTypeTags ?? []);

  if (!workTypeTags.has("sitework_only")) return false;
  if (isTradeTriggeredForProject(trade, context)) return false;
  if (siteworkOnlySuppressedTradeIds.has(trade.id)) return true;

  let currentParentId = trade.parentId;

  while (currentParentId) {
    if (siteworkOnlySuppressedTradeIds.has(currentParentId)) return true;

    currentParentId = defaultTradeTaxonomy.find((node) => node.id === currentParentId)?.parentId;
  }

  return false;
}

function getTriggeredTradeIdsForContext(context: TradeVisibilityContext): Set<string> {
  const triggeredTradeIds = new Set<string>();

  context.workTypeTags?.forEach((workTypeTag) => {
    workTypeTriggeredTradeIds[workTypeTag]?.forEach((tradeId) => {
      triggeredTradeIds.add(tradeId);
    });
  });

  context.contextTags?.forEach((contextTag) => {
    contextTriggeredTradeIds[contextTag]?.forEach((tradeId) => {
      triggeredTradeIds.add(tradeId);
    });
  });

  return triggeredTradeIds;
}
