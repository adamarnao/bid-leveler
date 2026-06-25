import { getSectionDivisionId } from "@/components/subcontractors/form/subcontractorFormCsiHelpers";
import {
  Subcontractor,
  SubcontractorContact,
  SubcontractorContactScope,
  SubcontractorLocation,
} from "@/types/Subcontractor";

export function ensurePrimaryContact(contacts: SubcontractorContact[]) {
  if (contacts.length === 0) return contacts;
  if (contacts.some((contact) => contact.isPrimary)) return contacts;

  return contacts.map((contact, index) => ({
    ...contact,
    isPrimary: index === 0,
  }));
}

export function normalizeLocations(locations: SubcontractorLocation[]) {
  let primaryLocationFound = false;

  return locations.map((location) => {
    const isPrimary = location.isPrimary === true && !primaryLocationFound;

    if (isPrimary) primaryLocationFound = true;

    return {
      ...location,
      name: location.name.trim(),
      address: {
        line1: location.address.line1.trim(),
        line2: emptyToUndefined(location.address.line2),
        city: location.address.city.trim(),
        state: location.address.state.trim(),
        zip: location.address.zip.trim(),
      },
      mainPhone: emptyToUndefined(location.mainPhone),
      mainPhoneExtension: emptyToUndefined(location.mainPhoneExtension),
      email: emptyToUndefined(location.email),
      notes: emptyToUndefined(location.notes),
      isPrimary,
    };
  });
}

export function normalizeContacts(
  contacts: SubcontractorContact[],
  validLocationIds: Set<string>
) {
  return ensurePrimaryContact(contacts).map((contact) => ({
    ...contact,
    locationId:
      contact.locationId && validLocationIds.has(contact.locationId)
        ? contact.locationId
        : undefined,
    title: emptyToUndefined(contact.title),
    email: emptyToUndefined(contact.email),
    officePhone: emptyToUndefined(contact.officePhone),
    officePhoneExtension: emptyToUndefined(contact.officePhoneExtension),
    mobilePhone: emptyToUndefined(contact.mobilePhone),
    phone: emptyToUndefined(contact.phone),
    inviteScopes: normalizeContactScopes(contact, validLocationIds),
    notes: emptyToUndefined(contact.notes),
    isPrimary: contact.isPrimary === true,
    isDefaultInviteRecipient: contact.isDefaultInviteRecipient === true,
    active: contact.active !== false,
  }));
}

export function normalizeContactScopes(
  contact: SubcontractorContact,
  validLocationIds: Set<string>
) {
  return normalizeInviteScopes(contact.inviteScopes ?? [], validLocationIds);
}

export function normalizeInviteScopes(
  scopes: SubcontractorContactScope[],
  validLocationIds: Set<string>
) {
  const normalizedScopes = scopes
    .map((scope) => ({
      divisionIds: normalizeStringArray(scope.divisionIds),
      sectionIds: normalizeStringArray(scope.sectionIds),
      states: normalizeStringArray(scope.states),
      counties: normalizeStringArray(scope.counties),
      citiesOrMarkets: normalizeStringArray(scope.citiesOrMarkets),
      locationIds: normalizeStringArray(scope.locationIds).filter((locationId) =>
        validLocationIds.has(locationId)
      ),
      roleContext: scope.roleContext,
      notes: emptyToUndefined(scope.notes),
    }))
    .map(removeEmptyScopeArrays)
    .filter(isMeaningfulContactScope);

  return normalizedScopes.length > 0 ? normalizedScopes : undefined;
}

export function getSubcontractorSnapshot(subcontractor: Subcontractor) {
  const normalizedSectionIds = subcontractor.csiCoverage.sectionIds;
  const normalizedDivisionIds = Array.from(
    new Set([
      subcontractor.primaryDivisionId,
      ...subcontractor.csiCoverage.divisionIds,
      ...normalizedSectionIds.map(getSectionDivisionId),
    ])
  ).filter(Boolean);
  const normalizedLocations = normalizeLocations(subcontractor.locations ?? []);
  const validLocationIds = new Set(
    normalizedLocations.map((location) => location.id)
  );

  return JSON.stringify({
    companyName: subcontractor.companyName.trim(),
    dba: emptyToUndefined(subcontractor.dba),
    website: emptyToUndefined(subcontractor.website),
    mainPhone: emptyToUndefined(subcontractor.mainPhone),
    mainPhoneExtension: emptyToUndefined(subcontractor.mainPhoneExtension),
    notes: emptyToUndefined(subcontractor.notes),
    address: {
      line1: subcontractor.address.line1.trim(),
      line2: emptyToUndefined(subcontractor.address.line2),
      city: subcontractor.address.city.trim(),
      state: subcontractor.address.state.trim(),
      zip: subcontractor.address.zip.trim(),
    },
    serviceArea: {
      states: subcontractor.serviceArea.states,
      counties: subcontractor.serviceArea.counties,
      citiesOrMarkets: subcontractor.serviceArea.citiesOrMarkets,
      travelRadiusMiles: subcontractor.serviceArea.travelRadiusMiles,
      willTravel: subcontractor.serviceArea.willTravel,
    },
    locations:
      normalizedLocations.length > 0 ? normalizedLocations : undefined,
    contacts: normalizeContacts(subcontractor.contacts, validLocationIds),
    primaryDivisionId: subcontractor.primaryDivisionId,
    csiCoverage: {
      sourceVersion:
        subcontractor.csiCoverage.sourceVersion ?? "MASTERFORMAT_2004_PLUS",
      divisionIds: normalizedDivisionIds,
      sectionIds: normalizedSectionIds,
      specialtyScopeNotes: emptyToUndefined(
        subcontractor.csiCoverage.specialtyScopeNotes
      ),
    },
    relationshipStatus: subcontractor.relationshipStatus,
    prequalification: {
      ...subcontractor.prequalification,
      insuranceExpirationDate: emptyToUndefined(
        subcontractor.prequalification.insuranceExpirationDate
      ),
      licenseExpirationDate: emptyToUndefined(
        subcontractor.prequalification.licenseExpirationDate
      ),
      notes: emptyToUndefined(subcontractor.prequalification.notes),
    },
    vpi: subcontractor.vpi,
  });
}

export function clearContactLocation(
  contact: SubcontractorContact,
  removedLocationId: string
): SubcontractorContact {
  return {
    ...contact,
    locationId:
      contact.locationId === removedLocationId ? undefined : contact.locationId,
    inviteScopes: contact.inviteScopes?.map((scope) => ({
      ...scope,
      locationIds: scope.locationIds?.filter(
        (locationId) => locationId !== removedLocationId
      ),
    })),
  };
}

export function cloneInviteScopes(scopes: SubcontractorContactScope[]) {
  return scopes.map((scope) => ({
    ...scope,
    divisionIds: scope.divisionIds ? [...scope.divisionIds] : undefined,
    sectionIds: scope.sectionIds ? [...scope.sectionIds] : undefined,
    states: scope.states ? [...scope.states] : undefined,
    counties: scope.counties ? [...scope.counties] : undefined,
    citiesOrMarkets: scope.citiesOrMarkets
      ? [...scope.citiesOrMarkets]
      : undefined,
    locationIds: scope.locationIds ? [...scope.locationIds] : undefined,
  }));
}

export function removeEmptyScopeArrays(scope: SubcontractorContactScope) {
  return {
    ...scope,
    divisionIds:
      scope.divisionIds && scope.divisionIds.length > 0
        ? scope.divisionIds
        : undefined,
    sectionIds:
      scope.sectionIds && scope.sectionIds.length > 0
        ? scope.sectionIds
        : undefined,
    states: scope.states && scope.states.length > 0 ? scope.states : undefined,
    counties:
      scope.counties && scope.counties.length > 0 ? scope.counties : undefined,
    citiesOrMarkets:
      scope.citiesOrMarkets && scope.citiesOrMarkets.length > 0
        ? scope.citiesOrMarkets
        : undefined,
    locationIds:
      scope.locationIds && scope.locationIds.length > 0
        ? scope.locationIds
        : undefined,
  };
}

export function isMeaningfulContactScope(scope: SubcontractorContactScope) {
  return Boolean(
    scope.divisionIds?.length ||
      scope.sectionIds?.length ||
      scope.states?.length ||
      scope.counties?.length ||
      scope.citiesOrMarkets?.length ||
      scope.locationIds?.length ||
      scope.roleContext ||
      scope.notes
  );
}

export function toggleArrayValue(values: string[], value: string, checked: boolean) {
  return checked
    ? uniqueStrings([...values, value])
    : values.filter((item) => item !== value);
}

export function parseCommaSeparatedValues(value: string) {
  return normalizeStringArray(value.split(","));
}

export function normalizeStringArray(values: string[] | undefined) {
  return uniqueStrings(values ?? []);
}

export function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

export function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function emptyToUndefined(value: string | undefined) {
  return value?.trim() ? value.trim() : undefined;
}

export function formatOptionalNumber(value: number | undefined) {
  return value === undefined ? "" : String(value);
}

export function formatPhoneInput(value: string | undefined) {
  const digits = getDigits(value).slice(0, 10);

  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;

  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export function formatWholeNumberInput(value: string) {
  return getDigits(value);
}

export function formatCurrencyInput(value: number | undefined) {
  if (value === undefined) return "";

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
    style: "currency",
    currency: "USD",
  }).format(value);
}

export function toOptionalNumber(value: string) {
  if (value.trim() === "") return undefined;

  const numberValue = Number(value);

  return Number.isNaN(numberValue) ? undefined : numberValue;
}

export function toOptionalWholeNumber(value: string) {
  const digits = getDigits(value);

  return digits ? Number(digits) : undefined;
}

export function toOptionalCurrencyNumber(value: string) {
  const normalizedValue = value.replace(/[^\d.]/g, "");

  if (normalizedValue.trim() === "") return undefined;

  const numberValue = Number(normalizedValue);

  return Number.isNaN(numberValue) ? undefined : Math.round(numberValue);
}

export function toRequiredNumber(value: string) {
  const numberValue = Number(value);

  return Number.isNaN(numberValue) ? 0 : numberValue;
}

export function normalizeSectionNumber(value: string) {
  return value.replace(/\u00a0/g, " ").trim();
}

export function formatStatus(value: string) {
  return value
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

export function formatCsiSourceVersion(value: string) {
  if (value === "MASTERFORMAT_2004_PLUS") return "MasterFormat 2004+ / 50-Division";
  if (value === "MASTERFORMAT_1995") return "MasterFormat 1995 / 16-Division";

  return formatStatus(value);
}

function getDigits(value: string | undefined) {
  return (value ?? "").replace(/\D/g, "");
}
