import {
  SubcontractorContact,
  SubcontractorContactScope,
  SubcontractorLocation,
} from "@/types/Subcontractor";

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
