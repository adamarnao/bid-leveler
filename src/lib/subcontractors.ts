import { mockSubcontractors } from "@/data/mockSubcontractors";
import { mockCsiDivisions } from "@/data/mockCsiDivisions";
import { mockCsiSections } from "@/data/mockCsiSections";
import { getDisplayedSubcontractorCoverage } from "@/lib/subcontractorCsiCoverage";
import { CsiMasterFormatVersion } from "@/types/Csi";
import {
  PrequalificationStatus,
  Subcontractor,
  SubcontractorContact,
} from "@/types/Subcontractor";

export const subcontractorsStorageKey = "subcontractors";

export function getMergedSubcontractors(storageValue?: string): Subcontractor[] {
  return mergeSubcontractors(
    mockSubcontractors,
    parseSavedSubcontractors(storageValue ?? "[]")
  );
}

export function getSubcontractorById(
  subcontractorId: string,
  storageValue?: string
): Subcontractor | undefined {
  return getMergedSubcontractors(storageValue).find(
    (subcontractor) => subcontractor.id === subcontractorId
  );
}

export function saveSubcontractor(subcontractor: Subcontractor) {
  if (typeof window === "undefined") return;

  const savedSubcontractors = parseSavedSubcontractors(
    window.localStorage.getItem(subcontractorsStorageKey) || "[]"
  );
  const updatedSubcontractor = {
    ...subcontractor,
    updatedDate: new Date().toISOString().slice(0, 10),
  };
  const existingIndex = savedSubcontractors.findIndex(
    (savedSubcontractor) => savedSubcontractor.id === subcontractor.id
  );

  if (existingIndex === -1) {
    savedSubcontractors.push(updatedSubcontractor);
  } else {
    savedSubcontractors[existingIndex] = updatedSubcontractor;
  }

  window.localStorage.setItem(
    subcontractorsStorageKey,
    JSON.stringify(savedSubcontractors)
  );
}

export function parseSavedSubcontractors(storageValue: string): Subcontractor[] {
  try {
    const savedSubcontractors = JSON.parse(storageValue);

    return Array.isArray(savedSubcontractors) ? savedSubcontractors : [];
  } catch {
    return [];
  }
}

export function getPrimaryDivisionId(subcontractor: Subcontractor): string {
  return (
    subcontractor.primaryDivisionId ||
    subcontractor.csiCoverage.divisionIds[0] ||
    "unassigned"
  );
}

export function getDivisionLabel(divisionId: string): string {
  if (divisionId === "unassigned") return "Unassigned";

  const division = mockCsiDivisions.find((item) => item.id === divisionId);

  return division
    ? `Division ${division.number} - ${division.name}`
    : divisionId;
}

export function getSectionLabel(sectionId: string): string {
  const section = mockCsiSections.find((item) => item.id === sectionId);

  return section ? `${section.number} - ${section.name}` : sectionId;
}

export function getSectionDivisionId(sectionId: string): string {
  const section = mockCsiSections.find((item) => item.id === sectionId);

  return section?.divisionId ?? "unassigned";
}

export function getSecondaryDivisionLabels(subcontractor: Subcontractor) {
  const primaryDivisionId = getPrimaryDivisionId(subcontractor);

  return subcontractor.csiCoverage.divisionIds
    .filter((divisionId) => divisionId !== primaryDivisionId)
    .map(getDivisionLabel);
}

export function getComplianceAlerts(subcontractor: Subcontractor): string[] {
  const alerts: string[] = [];
  const { prequalification } = subcontractor;

  if (!prequalification.w9OnFile) alerts.push("W-9 missing");
  if (!prequalification.insuranceOnFile) {
    alerts.push("Insurance missing");
  } else if (isExpired(prequalification.insuranceExpirationDate)) {
    alerts.push("Insurance expired");
  } else if (isExpiringSoon(prequalification.insuranceExpirationDate)) {
    alerts.push("Insurance expiring");
  }

  if (!prequalification.licenseOnFile) {
    alerts.push("License missing");
  } else if (isExpired(prequalification.licenseExpirationDate)) {
    alerts.push("License expired");
  } else if (isExpiringSoon(prequalification.licenseExpirationDate)) {
    alerts.push("License expiring");
  }

  return alerts;
}

export type PrimaryPhone = {
  label: "Office" | "Mobile" | "Phone";
  value: string;
};

export type CombinedStatus = {
  label: string;
  tone: "primary" | "secondary" | "success" | "warning" | "danger" | "muted";
};

export type SectionSubcontractorGroup = {
  sectionId: string;
  sectionLabel?: string;
  warnings?: string[];
  subcontractors: Subcontractor[];
};

export type DivisionSubcontractorGroup = {
  divisionId: string;
  divisionLabel?: string;
  warnings?: string[];
  sections: SectionSubcontractorGroup[];
};

export function getPrimaryContact(subcontractor: Subcontractor) {
  return (
    subcontractor.contacts.find((contact) => contact.isPrimary) ??
    subcontractor.contacts[0]
  );
}

export function getPrimaryPhone(
  contact: SubcontractorContact | undefined,
  subcontractor?: Subcontractor
): PrimaryPhone | undefined {
  if (contact?.primaryPhoneType === "MOBILE" && contact.mobilePhone) {
    return { label: "Mobile", value: contact.mobilePhone };
  }

  if (contact?.primaryPhoneType === "OFFICE" && contact.officePhone) {
    return { label: "Office", value: contact.officePhone };
  }

  if (contact?.mobilePhone) return { label: "Mobile", value: contact.mobilePhone };
  if (contact?.officePhone) return { label: "Office", value: contact.officePhone };
  if (contact?.phone) return { label: "Phone", value: contact.phone };
  if (subcontractor?.mainPhone) {
    return { label: "Office", value: subcontractor.mainPhone };
  }

  return undefined;
}

export function getCombinedStatus(subcontractor: Subcontractor): CombinedStatus {
  const prequalStatus = subcontractor.prequalification.status;

  if (isDoNotUseVendor(subcontractor)) {
    return { label: "Do Not Use", tone: "danger" };
  }

  return {
    label: formatVendorStatus(prequalStatus),
    tone: getVendorStatusTone(prequalStatus),
  };
}

export function isPreferredVendor(subcontractor: Subcontractor) {
  return subcontractor.relationshipStatus === "PREFERRED";
}

export function isDoNotUseVendor(subcontractor: Subcontractor) {
  return subcontractor.relationshipStatus === "DO_NOT_USE";
}

export function getBadgeClassName(tone: CombinedStatus["tone"]) {
  return `badge badge-${tone}`;
}

export function groupSubcontractorsByDivisionAndSection(
  subcontractors: Subcontractor[],
  targetVersion?: CsiMasterFormatVersion
): DivisionSubcontractorGroup[] {
  if (targetVersion) {
    return groupSubcontractorsByDisplayedDivisionAndSection(
      subcontractors,
      targetVersion
    );
  }

  const divisionGroups = new Map<string, Map<string, Subcontractor[]>>();

  subcontractors.forEach((subcontractor) => {
    const sectionIds =
      subcontractor.csiCoverage.sectionIds.length > 0
        ? subcontractor.csiCoverage.sectionIds
        : [`${getPrimaryDivisionId(subcontractor)}::unassigned`];

    sectionIds.forEach((sectionId) => {
      const divisionId = sectionId.includes("::unassigned")
        ? sectionId.split("::")[0]
        : getSectionDivisionId(sectionId);
      const sectionGroups =
        divisionGroups.get(divisionId) ?? new Map<string, Subcontractor[]>();
      const sectionSubcontractors = sectionGroups.get(sectionId) ?? [];

      sectionGroups.set(sectionId, [...sectionSubcontractors, subcontractor]);
      divisionGroups.set(divisionId, sectionGroups);
    });
  });

  return Array.from(divisionGroups.entries())
    .map(([divisionId, sectionGroups]) => ({
      divisionId,
      sections: Array.from(sectionGroups.entries())
        .map(([sectionId, sectionSubcontractors]) => ({
          sectionId,
          subcontractors: sectionSubcontractors.sort((a, b) =>
            a.companyName.localeCompare(b.companyName)
          ),
        }))
        .sort((a, b) =>
          getSectionLabel(a.sectionId).localeCompare(getSectionLabel(b.sectionId))
        ),
    }))
    .sort((a, b) =>
      getDivisionLabel(a.divisionId).localeCompare(getDivisionLabel(b.divisionId))
    );
}

function groupSubcontractorsByDisplayedDivisionAndSection(
  subcontractors: Subcontractor[],
  targetVersion: CsiMasterFormatVersion
): DivisionSubcontractorGroup[] {
  const divisionGroups = new Map<
    string,
    {
      label: string;
      warnings: Set<string>;
      sections: Map<
        string,
        {
          label: string;
          warnings: Set<string>;
          subcontractors: Subcontractor[];
        }
      >;
    }
  >();

  subcontractors.forEach((subcontractor) => {
    const displayedCoverage = getDisplayedSubcontractorCoverage(
      subcontractor,
      targetVersion
    );
    const sections =
      displayedCoverage.sections.length > 0
        ? displayedCoverage.sections
        : displayedCoverage.divisions.map((division) => ({
            id: `${division.id}::unassigned`,
            label: `${division.label} - Unassigned section`,
            divisionId: division.id,
            needsReview: division.needsReview,
          }));

    sections.forEach((section) => {
      const division =
        displayedCoverage.divisions.find(
          (displayedDivision) => displayedDivision.id === section.divisionId
        ) ??
        displayedCoverage.divisions.find(
          (displayedDivision) =>
            "divisionNumber" in section &&
            displayedDivision.number === section.divisionNumber
        );
      const divisionId = division?.id ?? section.divisionId;
      const divisionLabel = division?.label ?? getDivisionLabel(divisionId);
      const divisionGroup =
        divisionGroups.get(divisionId) ??
        {
          label: divisionLabel,
          warnings: new Set<string>(),
          sections: new Map(),
        };
      const sectionGroup =
        divisionGroup.sections.get(section.id) ??
        {
          label: section.label,
          warnings: new Set<string>(),
          subcontractors: [],
        };

      displayedCoverage.warnings.forEach((warning) => {
        divisionGroup.warnings.add(warning);
        sectionGroup.warnings.add(warning);
      });
      if (section.needsReview) {
        sectionGroup.warnings.add("CSI display needs review.");
      }

      sectionGroup.subcontractors.push(subcontractor);
      divisionGroup.sections.set(section.id, sectionGroup);
      divisionGroups.set(divisionId, divisionGroup);
    });
  });

  return Array.from(divisionGroups.entries())
    .map(([divisionId, divisionGroup]) => ({
      divisionId,
      divisionLabel: divisionGroup.label,
      warnings: Array.from(divisionGroup.warnings),
      sections: Array.from(divisionGroup.sections.entries())
        .map(([sectionId, sectionGroup]) => ({
          sectionId,
          sectionLabel: sectionGroup.label,
          warnings: Array.from(sectionGroup.warnings),
          subcontractors: sectionGroup.subcontractors.sort((a, b) =>
            a.companyName.localeCompare(b.companyName)
          ),
        }))
        .sort((a, b) =>
          (a.sectionLabel ?? a.sectionId).localeCompare(
            b.sectionLabel ?? b.sectionId,
            undefined,
            { numeric: true }
          )
        ),
    }))
    .sort((a, b) =>
      (a.divisionLabel ?? a.divisionId).localeCompare(
        b.divisionLabel ?? b.divisionId,
        undefined,
        { numeric: true }
      )
    );
}

export function formatStatus(value: string) {
  return value
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

export function formatVendorStatus(status: PrequalificationStatus) {
  if (status === "QUALIFIED") return "Prequalified";
  if (status === "NOT_STARTED") return "Not Started";
  if (status === "IN_PROGRESS") return "In Progress";

  return formatStatus(status);
}

export function getVendorStatusTone(
  status: PrequalificationStatus
): CombinedStatus["tone"] {
  return getPrequalificationTone(status);
}

export function getPrequalificationTone(
  status: PrequalificationStatus
): CombinedStatus["tone"] {
  if (status === "QUALIFIED") return "success";
  if (status === "CONDITIONAL" || status === "IN_PROGRESS") return "warning";
  if (status === "EXPIRED" || status === "REJECTED") return "danger";

  return "muted";
}

function isExpired(dateValue: string | undefined): boolean {
  if (!dateValue) return false;

  return startOfDay(dateValue).getTime() < startOfDay(new Date()).getTime();
}

function isExpiringSoon(dateValue: string | undefined): boolean {
  if (!dateValue) return false;

  const expirationDate = startOfDay(dateValue).getTime();
  const today = startOfDay(new Date()).getTime();
  const thirtyDaysFromNow = today + 30 * 24 * 60 * 60 * 1000;

  return expirationDate >= today && expirationDate <= thirtyDaysFromNow;
}

function startOfDay(value: string | Date): Date {
  const date = typeof value === "string" ? new Date(`${value}T00:00:00`) : value;

  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function mergeSubcontractors(
  mockSubcontractorList: Subcontractor[],
  savedSubcontractors: Subcontractor[]
) {
  const subcontractorsById = new Map<string, Subcontractor>();

  mockSubcontractorList.forEach((subcontractor) =>
    subcontractorsById.set(subcontractor.id, subcontractor)
  );
  savedSubcontractors.forEach((subcontractor) =>
    subcontractorsById.set(subcontractor.id, subcontractor)
  );

  return Array.from(subcontractorsById.values());
}
