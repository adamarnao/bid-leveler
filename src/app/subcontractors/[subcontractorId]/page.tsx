"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import Panel from "@/components/ui/Panel";
import {
  getBadgeClassName,
  getComplianceAlerts,
  getDivisionLabel,
  formatVendorStatus,
  getMergedSubcontractors,
  getVendorStatusTone,
  isPreferredVendor,
  getPrimaryDivisionId,
  getPrimaryPhone,
  getSecondaryDivisionLabels,
  getSectionDivisionId,
  getSectionLabel,
  subcontractorsStorageKey,
} from "@/lib/subcontractors";
import {
  Subcontractor,
  SubcontractorContact,
  SubcontractorContactScope,
  SubcontractorLocation,
} from "@/types/Subcontractor";

type BadgeTone = "primary" | "secondary" | "success" | "warning" | "danger" | "muted";

type ContactScopeGroup = {
  label: string;
  contacts: SubcontractorContact[];
};

type ContactLocationGroup = {
  locationId: string;
  label: string;
  contactsByScope: ContactScopeGroup[];
};

export default function SubcontractorProfilePage() {
  const params = useParams();
  const rawSubcontractorId = params.subcontractorId;
  const subcontractorId = Array.isArray(rawSubcontractorId)
    ? rawSubcontractorId[0]
    : rawSubcontractorId;
  const subcontractors = useSubcontractorsSnapshot();
  const subcontractor = subcontractors.find((item) => item.id === subcontractorId);

  if (!subcontractor) {
    return (
      <AppShell title="Subcontractor Not Found">
        <h1>Subcontractor Not Found</h1>
        <p>Requested subcontractor ID: {subcontractorId}</p>
        <Link href="/subcontractors">Back to Subcontractors</Link>
      </AppShell>
    );
  }

  const inviteContacts = getInviteContacts(subcontractor);
  const contactLocationGroups = getContactLocationGroups(
    subcontractor,
    sortContactsForDisplay(subcontractor.contacts, inviteContacts)
  );
  const meaningfulLocations = getMeaningfulLocations(subcontractor);
  const simplifiedStatus = getSimplifiedStatus(subcontractor);
  const complianceWarnings = getComplianceAlerts(subcontractor);
  const sectionLabels = subcontractor.csiCoverage.sectionIds.map(getSectionLabel);
  const secondaryDivisionLabels = getSecondaryDivisionLabels(subcontractor);
  const primaryTradeLabel = formatPrimaryTrade(subcontractor);

  return (
    <AppShell title={subcontractor.companyName}>
      <div className="command-nav">
        <Link href="/subcontractors" className="command-nav-link">
          {"<-"} Back to Subcontractors
        </Link>
      </div>

      <Panel title="Company Summary">
        <div className="profile-summary">
          <div>
            <div className="profile-title-row">
              <h2>{subcontractor.companyName}</h2>
              {isPreferredVendor(subcontractor) && (
                <span className="badge badge-primary">Preferred</span>
              )}
            </div>
            {subcontractor.dba && (
              <p className="muted-text">DBA: {subcontractor.dba}</p>
            )}
            <div className="badge-list">
              <span className={getBadgeClassName(simplifiedStatus.tone)}>
                {simplifiedStatus.label}
              </span>
              <span className="badge badge-secondary">
                VPI: {formatVpiOverall(subcontractor)}
              </span>
            </div>
          </div>

          <Link
            href={`/subcontractors/${subcontractor.id}/edit`}
            className="button-primary profile-edit-link"
          >
            Edit Subcontractor
          </Link>
        </div>

        <div className="profile-detail-grid">
          <ProfileDetail label="Main Phone" value={subcontractor.mainPhone} />
          <ProfileDetail
            label="Website"
            value={
              subcontractor.website ? (
                <a href={subcontractor.website}>{subcontractor.website}</a>
              ) : undefined
            }
          />
          <ProfileDetail label="Address" value={formatAddress(subcontractor)} />
          <ProfileDetail label="Primary Trade" value={primaryTradeLabel} />
        </div>
      </Panel>

      {meaningfulLocations.length > 0 && (
        <Panel title="Locations / Branches">
          <div className="profile-card-grid">
            {meaningfulLocations.map((location) => (
              <div key={location.id} className="profile-info-card">
                <div className="profile-title-row">
                  <strong>{location.name}</strong>
                  {location.isPrimary && (
                    <span className="badge badge-secondary">Primary</span>
                  )}
                </div>
                <p className="muted-text">{formatStatus(location.type)}</p>
                <p>{formatLocationAddress(location)}</p>
                {location.mainPhone && <p>{location.mainPhone}</p>}
                {location.email && <p>{location.email}</p>}
                <p className="muted-text">
                  {location.serviceArea
                    ? formatServiceAreaSummary(location.serviceArea)
                    : "Uses company service area"}
                </p>
                {location.notes && <p>{location.notes}</p>}
              </div>
            ))}
          </div>
        </Panel>
      )}

      <Panel title="Contacts">
        {contactLocationGroups.length === 0 ? (
          <div className="profile-empty-warning">
            <span className="badge badge-warning">No contacts</span>
            <p className="muted-text">
              No contacts have been added to this subcontractor profile.
            </p>
          </div>
        ) : (
          <ContactLocationGroups
            subcontractor={subcontractor}
            locationGroups={contactLocationGroups}
          />
        )}
      </Panel>

      <Panel title="Trade Coverage">
        <div className="profile-detail-grid">
          <ProfileDetail
            label="Primary Trade"
            value={primaryTradeLabel}
          />
          <ProfileDetail
            label="Secondary Divisions"
            value={formatList(secondaryDivisionLabels, "None")}
          />
          <ProfileDetail
            label="Specialty Scope Notes"
            value={subcontractor.csiCoverage.specialtyScopeNotes || "None"}
          />
        </div>

        {subcontractor.notes && (
          <p className="profile-note">
            <strong>Notes:</strong> {subcontractor.notes}
          </p>
        )}

        <div className="profile-label-list">
          <strong>Selected Sections</strong>
          {sectionLabels.length === 0 ? (
            <p className="muted-text">No sections selected.</p>
          ) : (
            <div className="badge-list">
              {sectionLabels.map((sectionLabel) => (
                <span key={sectionLabel} className="badge badge-muted">
                  {sectionLabel}
                </span>
              ))}
            </div>
          )}
        </div>
      </Panel>

      <Panel title="Service Area">
        <div className="profile-detail-grid">
          <ProfileDetail
            label="States"
            value={formatList(subcontractor.serviceArea.states)}
          />
          <ProfileDetail
            label="Counties"
            value={formatList(subcontractor.serviceArea.counties)}
          />
          <ProfileDetail
            label="Cities / Markets"
            value={formatList(subcontractor.serviceArea.citiesOrMarkets)}
          />
          <ProfileDetail
            label="Travel Radius"
            value={
              subcontractor.serviceArea.travelRadiusMiles
                ? `${subcontractor.serviceArea.travelRadiusMiles} miles`
                : "Not specified"
            }
          />
          <ProfileDetail
            label="Will Travel"
            value={subcontractor.serviceArea.willTravel ? "Yes" : "No"}
          />
        </div>
      </Panel>

      <Panel title="VPI / Performance">
        <div className="profile-performance-summary">
          <ProfileMetric label="Overall" value={formatVpiOverall(subcontractor)} />
          <ProfileMetric
            label="Projects Evaluated"
            value={String(subcontractor.vpi.projectsEvaluated)}
          />
        </div>

        <div className="profile-score-grid">
          <ProfileDetail
            label="Responsiveness"
            value={formatScore(subcontractor.vpi.responsiveness)}
          />
          <ProfileDetail
            label="Bid Completeness"
            value={formatScore(subcontractor.vpi.bidCompleteness)}
          />
          <ProfileDetail
            label="Bid Accuracy"
            value={formatScore(subcontractor.vpi.bidAccuracy)}
          />
          <ProfileDetail
            label="Schedule Performance"
            value={formatScore(subcontractor.vpi.schedulePerformance)}
          />
          <ProfileDetail
            label="Field Quality"
            value={formatScore(subcontractor.vpi.fieldQuality)}
          />
          <ProfileDetail
            label="Administrative Compliance"
            value={formatScore(subcontractor.vpi.administrativeCompliance)}
          />
        </div>
      </Panel>

      <Panel title="Vendor Status & Compliance">
        <div className="profile-detail-grid">
          <ProfileDetail
            label="Vendor Status"
            value={formatVendorStatus(subcontractor.prequalification.status)}
          />
          <ProfileDetail
            label="W-9"
            value={subcontractor.prequalification.w9OnFile ? "On file" : "Missing"}
          />
          <ProfileDetail
            label="Insurance"
            value={
              subcontractor.prequalification.insuranceOnFile ? "On file" : "Missing"
            }
          />
          <ProfileDetail
            label="License"
            value={
              subcontractor.prequalification.licenseOnFile ? "On file" : "Missing"
            }
          />
          <ProfileDetail
            label="Insurance Expiration"
            value={subcontractor.prequalification.insuranceExpirationDate || "Not set"}
          />
          <ProfileDetail
            label="License Expiration"
            value={subcontractor.prequalification.licenseExpirationDate || "Not set"}
          />
          <ProfileDetail
            label="Bonding Capacity"
            value={
              subcontractor.prequalification.bondingCapacity
                ? `$${subcontractor.prequalification.bondingCapacity.toLocaleString()}`
                : "Not specified"
            }
          />
        </div>

        <div className="profile-label-list">
          <strong>Warnings</strong>
          <div className="badge-list">
            {complianceWarnings.length === 0 ? (
              <span className="badge badge-success">No compliance warnings</span>
            ) : (
              complianceWarnings.map((warning) => (
                <span key={warning} className="badge badge-warning">
                  {warning}
                </span>
              ))
            )}
          </div>
        </div>

        {subcontractor.prequalification.notes && (
          <p className="profile-note">
            <strong>Notes:</strong> {subcontractor.prequalification.notes}
          </p>
        )}
      </Panel>

    </AppShell>
  );
}

function ProfileDetail({
  label,
  value,
}: {
  label: string;
  value?: React.ReactNode;
}) {
  return (
    <div className="profile-detail">
      <span>{label}</span>
      <strong>{value || "Not provided"}</strong>
    </div>
  );
}

function ProfileMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="profile-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ContactLocationGroups({
  subcontractor,
  locationGroups,
}: {
  subcontractor: Subcontractor;
  locationGroups: ContactLocationGroup[];
}) {
  return (
    <div className="profile-location-contact-list">
      {locationGroups.map((locationGroup) => (
        <div key={locationGroup.locationId} className="profile-info-card">
          <h3>{locationGroup.label}</h3>
          <div className="profile-scope-group-list">
            {locationGroup.contactsByScope.map((scopeGroup) => (
              <div key={`${locationGroup.locationId}-${scopeGroup.label}`}>
                <h4>{scopeGroup.label}</h4>
                <div className="profile-contact-grid">
                  {scopeGroup.contacts.map((contact) => (
                    <ContactCard
                      key={contact.id}
                      subcontractor={subcontractor}
                      contact={contact}
                      markers={getContactMarkers(contact)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ContactCard({
  subcontractor,
  contact,
  markers,
}: {
  subcontractor: Subcontractor;
  contact: SubcontractorContact;
  markers: Array<string | undefined>;
}) {
  const primaryPhone = getPrimaryPhone(contact, subcontractor);
  const visibleMarkers = markers.filter(Boolean);

  return (
    <div className="profile-contact-card">
      <div className="profile-title-row">
        <strong>{contact.name}</strong>
        {visibleMarkers.map((marker) => (
          <span
            key={marker}
            className={
              marker === "Inactive" ? "badge badge-muted" : "badge badge-secondary"
            }
          >
            {marker}
          </span>
        ))}
      </div>
      <p className="muted-text">{formatContactRoleTitle(contact)}</p>
      <div className="profile-contact-methods">
        <span>{contact.email || "No email"}</span>
        {contact.officePhone && <span>Office: {contact.officePhone}</span>}
        {contact.mobilePhone && <span>Mobile: {contact.mobilePhone}</span>}
        {primaryPhone && <span>Primary: {primaryPhone.value}</span>}
      </div>
      {contact.notes && <p>{contact.notes}</p>}
    </div>
  );
}

function getContactMarkers(contact: SubcontractorContact) {
  return [
    contact.isDefaultInviteRecipient ? "Default Invite" : undefined,
    contact.isPrimary ? "Primary" : undefined,
    contact.active === false ? "Inactive" : undefined,
  ];
}

let cachedSubcontractorsStorageValue: string | undefined;
let cachedSubcontractors: Subcontractor[] = getMergedSubcontractors();

function useSubcontractorsSnapshot(): Subcontractor[] {
  return useSyncExternalStore(
    subscribeToSubcontractorStorage,
    getSubcontractorsSnapshot,
    getServerSubcontractorsSnapshot
  );
}

function subscribeToSubcontractorStorage(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
  };
}

function getServerSubcontractorsSnapshot(): Subcontractor[] {
  return cachedSubcontractors;
}

function getSubcontractorsSnapshot(): Subcontractor[] {
  const storageValue = localStorage.getItem(subcontractorsStorageKey) || "[]";

  if (storageValue !== cachedSubcontractorsStorageValue) {
    cachedSubcontractorsStorageValue = storageValue;
    cachedSubcontractors = getMergedSubcontractors(storageValue);
  }

  return cachedSubcontractors;
}

function getInviteContacts(subcontractor: Subcontractor): SubcontractorContact[] {
  const activeContactsWithEmail = subcontractor.contacts.filter(
    (contact) => contact.active !== false && Boolean(contact.email?.trim())
  );
  const defaultInviteContacts = activeContactsWithEmail.filter(
    (contact) => contact.isDefaultInviteRecipient
  );

  if (defaultInviteContacts.length > 0) return defaultInviteContacts;

  const primaryContact = activeContactsWithEmail.find((contact) => contact.isPrimary);
  if (primaryContact) return [primaryContact];

  const estimatorContacts = activeContactsWithEmail.filter(
    (contact) => contact.role === "ESTIMATOR"
  );
  if (estimatorContacts.length > 0) return estimatorContacts;

  return activeContactsWithEmail;
}

function sortContactsForDisplay(
  contacts: SubcontractorContact[],
  inviteContacts: SubcontractorContact[]
) {
  const inviteContactIds = new Set(inviteContacts.map((contact) => contact.id));

  return [...contacts].sort((contactA, contactB) => {
    const inviteWeightA = inviteContactIds.has(contactA.id) ? 0 : 1;
    const inviteWeightB = inviteContactIds.has(contactB.id) ? 0 : 1;
    const activeWeightA = contactA.active === false ? 1 : 0;
    const activeWeightB = contactB.active === false ? 1 : 0;

    return (
      inviteWeightA - inviteWeightB ||
      activeWeightA - activeWeightB ||
      contactA.name.localeCompare(contactB.name)
    );
  });
}

function getMeaningfulLocations(subcontractor: Subcontractor) {
  const locations = subcontractor.locations ?? [];

  if (locations.length > 1) return locations;

  return locations.filter((location) => {
    const duplicatesCompanyAddress =
      formatLocationAddress(location) === formatAddress(subcontractor);

    return (
      !duplicatesCompanyAddress ||
      Boolean(location.mainPhone) ||
      Boolean(location.email) ||
      Boolean(location.serviceArea) ||
      Boolean(location.notes)
    );
  });
}

function getContactLocationGroups(
  subcontractor: Subcontractor,
  contacts: SubcontractorContact[]
): ContactLocationGroup[] {
  const locationGroups = new Map<string, Map<string, SubcontractorContact[]>>();

  contacts.forEach((contact) => {
    const locationId = contact.locationId ?? "company-wide";
    const scopeLabel = getContactScopeGroupLabel(contact);
    const scopeGroups = locationGroups.get(locationId) ?? new Map();
    const scopeContacts = scopeGroups.get(scopeLabel) ?? [];

    scopeContacts.push(contact);
    scopeGroups.set(scopeLabel, scopeContacts);
    locationGroups.set(locationId, scopeGroups);
  });

  return Array.from(locationGroups.entries())
    .sort(([locationIdA], [locationIdB]) => {
      if (locationIdA === "company-wide") return -1;
      if (locationIdB === "company-wide") return 1;

      return getLocationLabel(subcontractor, locationIdA).localeCompare(
        getLocationLabel(subcontractor, locationIdB)
      );
    })
    .map(([locationId, scopeGroups]) => ({
      locationId,
      label:
        locationId === "company-wide"
          ? "General / Company-wide Contacts"
          : getLocationLabel(subcontractor, locationId),
      contactsByScope: Array.from(scopeGroups.entries())
        .sort(([labelA], [labelB]) => {
          if (labelA === "General Contacts") return -1;
          if (labelB === "General Contacts") return 1;

          return labelA.localeCompare(labelB);
        })
        .map(([label, groupedContacts]) => ({
          label,
          contacts: groupedContacts,
        })),
    }));
}

function getContactScopeGroupLabel(contact: SubcontractorContact) {
  const firstScope = contact.inviteScopes?.[0];

  if (!firstScope) return "General Contacts";

  return formatScopeTradeLine(firstScope) ?? "General Contacts";
}

function getSimplifiedStatus(subcontractor: Subcontractor): {
  label: string;
  tone: BadgeTone;
} {
  if (subcontractor.relationshipStatus === "DO_NOT_USE") {
    return { label: "Do Not Use", tone: "danger" };
  }

  return {
    label: formatVendorStatus(subcontractor.prequalification.status),
    tone: getVendorStatusTone(subcontractor.prequalification.status),
  };
}

function formatAddress(subcontractor: Subcontractor) {
  const { address } = subcontractor;

  return [address.line1, address.line2, address.city, address.state, address.zip]
    .filter(Boolean)
    .join(", ");
}

function formatLocationAddress(location: SubcontractorLocation) {
  const { address } = location;

  return [address.line1, address.line2, address.city, address.state, address.zip]
    .filter(Boolean)
    .join(", ");
}

function formatPrimaryTrade(subcontractor: Subcontractor) {
  const primaryDivisionId = getPrimaryDivisionId(subcontractor);
  const primaryDivisionLabel = getDivisionLabel(primaryDivisionId);
  const primarySectionLabels = subcontractor.csiCoverage.sectionIds
    .filter((sectionId) => getSectionDivisionId(sectionId) === primaryDivisionId)
    .map(getSectionLabel);

  return primarySectionLabels.length === 0
    ? primaryDivisionLabel
    : `${primaryDivisionLabel} - ${primarySectionLabels.join(", ")}`;
}

function formatContactRoleTitle(contact: SubcontractorContact) {
  const roleLabel = formatStatus(contact.role);
  const title = contact.title?.trim();

  if (!title) return roleLabel;

  const normalizedRole = roleLabel.toLowerCase();
  const normalizedTitle = title.toLowerCase();

  if (
    normalizedTitle.includes(normalizedRole) ||
    normalizedRole.includes(normalizedTitle)
  ) {
    return title;
  }

  return `${roleLabel} / ${title}`;
}

function formatScopeTradeLine(scope: SubcontractorContactScope) {
  const tradeParts = [
    scope.divisionIds?.map(getDivisionLabel).join(", "),
    scope.sectionIds?.map(getSectionLabel).join(", "),
  ].filter(Boolean);

  if (tradeParts.length === 0) return undefined;

  const context = scope.roleContext ? formatStatus(scope.roleContext) : "Scope";

  return `${context}: ${tradeParts.join(" - ")}`;
}

function getLocationLabel(
  subcontractor: Subcontractor,
  locationId: string | undefined
) {
  if (!locationId) return "-";

  return (
    subcontractor.locations?.find((location) => location.id === locationId)?.name ??
    locationId
  );
}

function formatServiceAreaSummary(
  serviceArea: Subcontractor["serviceArea"]
) {
  return [
    formatList(serviceArea.counties, ""),
    formatList(serviceArea.citiesOrMarkets, ""),
  ]
    .filter(Boolean)
    .join(" | ");
}

function formatVpiOverall(subcontractor: Subcontractor) {
  return subcontractor.vpi.overall === undefined
    ? "Not rated"
    : `${subcontractor.vpi.overall.toFixed(1)} / 5`;
}

function formatScore(value: number | undefined) {
  return value === undefined ? "Not rated" : `${value} / 5`;
}

function formatStatus(value: string) {
  return value
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

function formatList(values: string[], emptyText = "Not specified") {
  return values.length === 0 ? emptyText : values.join(", ");
}
