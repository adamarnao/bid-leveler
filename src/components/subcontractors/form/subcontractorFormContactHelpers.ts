import {
  getDivisionName,
  getSectionLabel,
} from "@/components/subcontractors/form/subcontractorFormCsiHelpers";
import { formatStatus } from "@/components/subcontractors/form/subcontractorFormNormalization";
import {
  SubcontractorContact,
  SubcontractorContactScope,
  SubcontractorLocation,
} from "@/types/Subcontractor";

export function getLocationName(
  locations: SubcontractorLocation[],
  locationId: string
) {
  return locations.find((location) => location.id === locationId)?.name || locationId;
}

export function getContactName(contacts: SubcontractorContact[], contactId: string) {
  return (
    contacts.find((contact) => contact.id === contactId)?.name ||
    "Selected Contact"
  );
}

export function formatContactSummary(contact: SubcontractorContact) {
  const contactType = formatStatus(contact.role);
  const jobTitle = contact.title?.trim();

  return jobTitle || contactType;
}

export function getContactScopeSummaries(contact: SubcontractorContact) {
  return (contact.inviteScopes ?? [])
    .map(formatContactScopeSummary)
    .filter(Boolean);
}

export function formatContactScopeSummary(scope: SubcontractorContactScope) {
  const parts = [
    scope.roleContext ? formatStatus(scope.roleContext) : undefined,
    scope.locationIds?.length ? `${scope.locationIds.length} location(s)` : undefined,
    formatScopeCsiSummary(scope),
    scope.states?.length ? `States: ${scope.states.join(", ")}` : undefined,
    scope.counties?.length ? `Counties: ${scope.counties.join(", ")}` : undefined,
    scope.citiesOrMarkets?.length
      ? `Markets: ${scope.citiesOrMarkets.join(", ")}`
      : undefined,
    scope.notes,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" | ") : undefined;
}

export function formatScopeCsiSummary(scope: SubcontractorContactScope) {
  const sectionLabels = (scope.sectionIds ?? []).map(getSectionLabel);
  const divisionLabels = (scope.divisionIds ?? []).map(getDivisionName);

  if (sectionLabels.length > 0) {
    return sectionLabels.slice(0, 3).join(", ") +
      (sectionLabels.length > 3 ? ` +${sectionLabels.length - 3} more` : "");
  }

  if (divisionLabels.length > 0) {
    return divisionLabels.slice(0, 3).join(", ") +
      (divisionLabels.length > 3 ? ` +${divisionLabels.length - 3} more` : "");
  }

  return undefined;
}
