export type ProjectProfileOption<TId extends string> = {
  id: TId;
  label: string;
  description: string;
  sortOrder: number;
  aliases?: string[];
};

export type ProjectProfileSectorId =
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

export type ProjectProfileFacilityTypeId =
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

export type ProjectProfileWorkTypeId =
  | "interior_fit_out_renovation"
  | "ground_up_new_construction"
  | "core_and_shell"
  | "addition_expansion"
  | "sitework_civil_only"
  | "demolition_abatement_only"
  | "restoration_adaptive_reuse"
  | "maintenance_repair"
  | "specialty_systems_installation";

export type ProjectProfileContextTagId =
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

export type ProjectCsiVersionId = "MASTERFORMAT_CURRENT" | "MASTERFORMAT_1995";

export type ProjectProfileBuildingCondition =
  | "new_construction"
  | "existing_to_remain"
  | "existing_to_renovate"
  | "partial_demolition"
  | "full_demolition"
  | "unknown";

export type ProjectProfileStructureType =
  | "steel"
  | "concrete"
  | "masonry"
  | "wood_framed"
  | "pre_engineered_metal_building"
  | "tilt_up"
  | "precast"
  | "mixed"
  | "unknown";

export type ProjectProfileOccupancyCondition =
  | "vacant"
  | "occupied"
  | "partially_occupied"
  | "active_operations"
  | "unknown";

export type ProjectProfileScopeFlag = "included" | "not_included" | "tbd";

export type ProjectSiteWalkStatus = "scheduled" | "tbd" | "not_applicable";

export type ProjectPublicPrivateStatus =
  | "public"
  | "private"
  | "public_private_partnership"
  | "unknown";

export type ProjectTaxStatus =
  | "taxable"
  | "tax_exempt"
  | "partially_tax_exempt"
  | "unknown";

export type ProjectContractType =
  | "lump_sum"
  | "cost_plus"
  | "gmp"
  | "unit_price"
  | "design_build"
  | "cm_at_risk"
  | "unknown";

export type ProjectOwnerVendorScope =
  | "none_known"
  | "ofci"
  | "ofoi"
  | "cfci"
  | "nic"
  | "mixed"
  | "unknown";

export type ProjectProfileFinishLevel =
  | "standard"
  | "enhanced"
  | "high_end"
  | "specialty"
  | "unknown";

export type ProjectProfileIntensity = "none" | "low" | "medium" | "high" | "unknown";

export type ProjectProfileClassification = {
  sector: ProjectProfileSectorId;
  facilityType?: ProjectProfileFacilityTypeId;
  subsector?: string;
  workType: ProjectProfileWorkTypeId;
  contextTags: ProjectProfileContextTagId[];
};

export type ProjectProfileGlobalAttributes = {
  squareFeet?: number;
  floors?: number;
  buildingCondition?: ProjectProfileBuildingCondition;
  structureType?: ProjectProfileStructureType;
  occupancyCondition?: ProjectProfileOccupancyCondition;
  siteScope?: ProjectProfileScopeFlag;
  envelopeScope?: ProjectProfileScopeFlag;
  projectCsiVersion: ProjectCsiVersionId;
};

export type ProjectProfileLogistics = {
  siteWalkStatus: ProjectSiteWalkStatus;
  siteWalkDate?: string;
  occupiedSite?: boolean;
  phasedWork?: boolean;
  nightWork?: boolean;
  restrictedAccess?: boolean;
  secureFacility?: boolean;
  highRise?: boolean;
  limitedLaydown?: boolean;
};

export type ProjectProfileProcurement = {
  publicPrivate?: ProjectPublicPrivateStatus;
  prevailingWage?: boolean;
  bondRequired?: boolean;
  taxStatus?: ProjectTaxStatus;
  contractType?: ProjectContractType;
  ownerVendorScope?: ProjectOwnerVendorScope;
  alternatesRequired?: boolean;
  allowancesRequired?: boolean;
  unitPricesRequired?: boolean;
};

export type ProjectPackageDefaultAssumptions = {
  defaultFinishLevel?: ProjectProfileFinishLevel;
  defaultDemoIntensity?: ProjectProfileIntensity;
  defaultMepIntensity?: ProjectProfileIntensity;
  defaultLowVoltageIntensity?: ProjectProfileIntensity;
};

export type ProjectProfilePricingMetricValue = {
  metricId: string;
  value?: string | number;
  unit?: string;
  notes?: string;
};

export type ProjectProfile = {
  classification: ProjectProfileClassification;
  globalAttributes: ProjectProfileGlobalAttributes;
  logistics: ProjectProfileLogistics;
  procurement: ProjectProfileProcurement;
  pricingMetrics?: ProjectProfilePricingMetricValue[];
  packageDefaultAssumptions?: ProjectPackageDefaultAssumptions;
};

export type SectorWorkTypeLabel = {
  sector: ProjectProfileSectorId;
  workType: ProjectProfileWorkTypeId;
  label: string;
  aliases?: string[];
};

export type FacilityTypeAvailability = {
  sector: ProjectProfileSectorId;
  facilityTypes: ProjectProfileFacilityTypeId[];
};

export type ContextTagAvailability = {
  contextTag: ProjectProfileContextTagId;
  sectors?: ProjectProfileSectorId[];
  facilityTypes?: ProjectProfileFacilityTypeId[];
  workTypes?: ProjectProfileWorkTypeId[];
  requiresAnyContext?: ProjectProfileContextTagId[];
  hiddenByDefault?: boolean;
};

export type ProjectSetupRuleEffectType =
  | "SHOW_FIELD"
  | "REQUIRE_FIELD"
  | "SUGGEST_CONTEXT_TAG"
  | "CORE_TRADE"
  | "SUGGEST_TRADE"
  | "HIDE_TRADE"
  | "ADD_ITB_REQUIREMENT"
  | "ADD_PRICING_METRIC"
  | "ADD_WARNING";

export type ProjectSetupFieldImpactCategory =
  | "bid_package_generation"
  | "itb_readiness"
  | "subcontractor_matching"
  | "historical_pricing"
  | "estimate_review"
  | "proposal_output";

export type ProjectSetupRuleOperator =
  | "equals"
  | "not_equals"
  | "includes"
  | "not_includes"
  | "exists"
  | "not_exists";

export type ProjectSetupRuleCondition = {
  id: string;
  fieldPath: string;
  operator: ProjectSetupRuleOperator;
  value?: string | number | boolean | readonly string[];
  description?: string;
};

export type ProjectSetupRuleEffect = {
  id: string;
  type: ProjectSetupRuleEffectType;
  targetId?: string;
  targetFieldPath?: string;
  label?: string;
  description?: string;
  impactCategories: ProjectSetupFieldImpactCategory[];
};

export type ProjectSetupRule = {
  id: string;
  name: string;
  description?: string;
  conditions: ProjectSetupRuleCondition[];
  effects: ProjectSetupRuleEffect[];
  priority?: number;
  isActive: boolean;
};

export type ProjectSetupRuleEvaluation = {
  matchingRules: ProjectSetupRule[];
  effects: ProjectSetupRuleEffect[];
};

export type PricingMetricValueType =
  | "number"
  | "currency"
  | "area"
  | "length"
  | "volume"
  | "duration"
  | "text";

export type PricingMetricUnit =
  | "sf"
  | "sy"
  | "lf"
  | "cy"
  | "acres"
  | "months"
  | "count"
  | "usd"
  | "feet"
  | "mixed"
  | "none";

export type PricingMetric = {
  id: string;
  label: string;
  valueType: PricingMetricValueType;
  unit: PricingMetricUnit;
  description?: string;
};

export type SectorPricingMetricGroup = {
  id: string;
  sectorIds: ProjectProfileSectorId[];
  facilityTypeIds?: ProjectProfileFacilityTypeId[];
  metrics: PricingMetric[];
};

export type ProjectProfileTradeVisibilityLevel =
  | "CORE"
  | "SUGGESTED"
  | "CONTEXTUAL"
  | "HIDDEN"
  | "EXCLUDED";

export type ProjectProfileTradeVisibilityResult = {
  tradeId: string;
  tradeName: string;
  visibility: ProjectProfileTradeVisibilityLevel;
  explanations: string[];
  isTriggeredByContext?: boolean;
  isHiddenByDefault?: boolean;
};

export type ProjectProfileTradeVisibilityGroups = {
  core: ProjectProfileTradeVisibilityResult[];
  suggested: ProjectProfileTradeVisibilityResult[];
  contextual: ProjectProfileTradeVisibilityResult[];
  hidden: ProjectProfileTradeVisibilityResult[];
  excluded: ProjectProfileTradeVisibilityResult[];
};
