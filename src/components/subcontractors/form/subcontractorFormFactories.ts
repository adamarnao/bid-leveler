import {
  Subcontractor,
  SubcontractorContact,
  SubcontractorContactScope,
  SubcontractorLocation,
} from "@/types/Subcontractor";
import { CsiMasterFormatVersion } from "@/types/Csi";

export function createEmptySubcontractor(
  defaultCsiVersion: CsiMasterFormatVersion
): Subcontractor {
  const subcontractorId = `subcontractor-${Date.now()}`;

  return {
    id: subcontractorId,
    companyName: "",
    dba: "",
    website: "",
    mainPhone: "",
    mainPhoneExtension: "",
    address: {
      line1: "",
      line2: "",
      city: "",
      state: "",
      zip: "",
    },
    serviceArea: {
      states: [],
      counties: [],
      citiesOrMarkets: [],
      willTravel: false,
    },
    locations: undefined,
    contacts: [createEmptyPrimaryContact(subcontractorId)],
    primaryDivisionId: "unassigned",
    csiCoverage: {
      sourceVersion: defaultCsiVersion,
      divisionIds: [],
      sectionIds: [],
      specialtyScopeNotes: "",
    },
    prequalification: {
      status: "NOT_STARTED",
      w9OnFile: false,
      insuranceOnFile: false,
      licenseOnFile: false,
    },
    vpi: {
      projectsEvaluated: 0,
      confidenceLevel: "LOW",
    },
    relationshipStatus: "CONDITIONAL",
    createdDate: new Date().toISOString().slice(0, 10),
    archived: false,
  };
}

export function createEmptyPrimaryContact(
  subcontractorId: string
): SubcontractorContact {
  return {
    id: `${subcontractorId}-primary-contact`,
    role: "ESTIMATOR",
    name: "",
    primaryPhoneType: "OFFICE",
    isPrimary: true,
    isDefaultInviteRecipient: true,
    active: true,
  };
}

export function createEmptyContact(
  subcontractorId: string,
  contactNumber: number
): SubcontractorContact {
  return {
    id: `${subcontractorId}-contact-${Date.now()}-${contactNumber}`,
    role: "ESTIMATOR",
    name: "",
    primaryPhoneType: "OFFICE",
    isPrimary: false,
    active: true,
  };
}

export function createEmptyLocation(
  subcontractorId: string,
  locationNumber: number
): SubcontractorLocation {
  return {
    id: `${subcontractorId}-location-${Date.now()}-${locationNumber}`,
    name: "",
    type: "BRANCH",
    address: {
      line1: "",
      city: "",
      state: "",
      zip: "",
    },
    isPrimary: false,
  };
}

export function createEmptyContactScope(): SubcontractorContactScope {
  return {};
}
