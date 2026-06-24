export type ProjectProfileSectorId = string;

export type ProjectProfileWorkTypeId = string;

export type ProjectProfileContextTagId = string;

export type ProjectCsiVersionId = string;

export type ProjectProfilePricingMetricValue = {
  metricId: string;
  value?: string | number;
  unit?: string;
  notes?: string;
};

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

export type ProjectProfileScopeFlag =
  | "included"
  | "not_included"
  | "tbd";

export type ProjectSiteWalkStatus =
  | "scheduled"
  | "tbd"
  | "not_applicable";

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

export type ProjectProfileIntensity =
  | "none"
  | "low"
  | "medium"
  | "high"
  | "unknown";

export type ProjectProfileClassification = {
  sector: ProjectProfileSectorId;
  subsector?: string;
  facilityType?: string;
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

export type ProjectProfile = {
  classification: ProjectProfileClassification;
  globalAttributes: ProjectProfileGlobalAttributes;
  logistics: ProjectProfileLogistics;
  procurement: ProjectProfileProcurement;
  pricingMetrics?: ProjectProfilePricingMetricValue[];

  /**
   * These values are defaults used to suggest and prefill package-level review.
   * They are not the final source of truth for every trade package.
   */
  packageDefaultAssumptions?: ProjectPackageDefaultAssumptions;
};
