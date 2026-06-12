"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import Panel from "@/components/ui/Panel";
import {
  getDivisionLabel,
  getMergedSubcontractors,
  getPrimaryDivisionId,
  getPrimaryPhone,
  getSecondaryDivisionLabels,
  getSectionLabel,
  subcontractorsStorageKey,
} from "@/lib/subcontractors";
import {
  Subcontractor,
  SubcontractorContact,
  SubcontractorLocation,
} from "@/types/Subcontractor";

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

  return (
    <AppShell title={subcontractor.companyName}>
      <div className="command-nav">
        <Link href="/subcontractors" className="command-nav-link">
          {"<-"} Back to Subcontractors
        </Link>
        <Link
          href={`/subcontractors/${subcontractor.id}/edit`}
          className="command-nav-link"
        >
          Edit Subcontractor
        </Link>
      </div>

      <Panel title="Company Information">
        <p>
          <strong>Company:</strong> {subcontractor.companyName}
        </p>
        {subcontractor.dba && (
          <p>
            <strong>DBA:</strong> {subcontractor.dba}
          </p>
        )}
        <p>
          <strong>Address:</strong> {formatAddress(subcontractor)}
        </p>
        <p>
          <strong>Website:</strong>{" "}
          {subcontractor.website ? (
            <a href={subcontractor.website}>{subcontractor.website}</a>
          ) : (
            "Not provided"
          )}
        </p>
        <p>
          <strong>Main Phone:</strong> {subcontractor.mainPhone || "Not provided"}
        </p>
        <p>
          <strong>Relationship Status:</strong>{" "}
          {formatStatus(subcontractor.relationshipStatus)}
        </p>
      </Panel>

      <Panel title="Service Area">
        <p>
          <strong>States:</strong> {subcontractor.serviceArea.states.join(", ")}
        </p>
        <p>
          <strong>Counties:</strong>{" "}
          {subcontractor.serviceArea.counties.join(", ")}
        </p>
        <p>
          <strong>Cities / Markets:</strong>{" "}
          {subcontractor.serviceArea.citiesOrMarkets.join(", ")}
        </p>
        <p>
          <strong>Travel Radius:</strong>{" "}
          {subcontractor.serviceArea.travelRadiusMiles
            ? `${subcontractor.serviceArea.travelRadiusMiles} miles`
            : "Not specified"}
        </p>
        <p>
          <strong>Will Travel:</strong>{" "}
          {subcontractor.serviceArea.willTravel ? "Yes" : "No"}
        </p>
      </Panel>

      {subcontractor.locations && subcontractor.locations.length > 0 && (
        <Panel title="Locations / Branches">
          <table style={{ borderCollapse: "collapse", minWidth: 900 }}>
            <thead>
              <tr>
                <th style={cell}>Location</th>
                <th style={cell}>Type</th>
                <th style={cell}>Address</th>
                <th style={cell}>Main Phone</th>
                <th style={cell}>Service Area</th>
                <th style={cell}>Primary</th>
              </tr>
            </thead>
            <tbody>
              {subcontractor.locations.map((location) => (
                <tr key={location.id}>
                  <td style={cell}>{location.name}</td>
                  <td style={cell}>{formatStatus(location.type)}</td>
                  <td style={cell}>{formatLocationAddress(location)}</td>
                  <td style={cell}>{location.mainPhone || "-"}</td>
                  <td style={cell}>
                    {location.serviceArea
                      ? formatList(
                          [
                            ...location.serviceArea.counties,
                            ...location.serviceArea.citiesOrMarkets,
                          ],
                          "Not specified"
                        )
                      : "Company service area"}
                  </td>
                  <td style={cell}>{location.isPrimary ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      )}

      <Panel title="Contacts">
        <table style={{ borderCollapse: "collapse", minWidth: 1120 }}>
          <thead>
            <tr>
              <th style={cell}>Name</th>
              <th style={cell}>Role / Title</th>
              <th style={cell}>Email</th>
              <th style={cell}>Office Phone</th>
              <th style={cell}>Mobile Phone</th>
              <th style={cell}>Primary Phone</th>
              <th style={cell}>Location</th>
              <th style={cell}>Primary</th>
              <th style={cell}>Default Invite</th>
              <th style={cell}>Status</th>
              <th style={cell}>Responsibility</th>
            </tr>
          </thead>
          <tbody>
            {subcontractor.contacts.map((contact) => {
              const primaryPhone = getPrimaryPhone(contact, subcontractor);

              return (
                <tr key={contact.id}>
                  <td style={cell}>{contact.name}</td>
                  <td style={cell}>{formatContactRoleTitle(contact)}</td>
                  <td style={cell}>{contact.email || "-"}</td>
                  <td style={cell}>{contact.officePhone || "-"}</td>
                  <td style={cell}>{contact.mobilePhone || "-"}</td>
                  <td style={cell}>
                    {primaryPhone
                      ? `${primaryPhone.label}: ${primaryPhone.value}`
                      : "-"}
                  </td>
                  <td style={cell}>
                    {getLocationName(subcontractor, contact.locationId)}
                  </td>
                  <td style={cell}>{contact.isPrimary ? "Yes" : "No"}</td>
                  <td style={cell}>
                    {contact.isDefaultInviteRecipient ? "Yes" : "No"}
                  </td>
                  <td style={cell}>{contact.active === false ? "Inactive" : "Active"}</td>
                  <td style={cell}>{formatContactScopes(contact)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Panel>

      <Panel title="CSI Coverage">
        <p>
          <strong>Primary Division:</strong>{" "}
          {getDivisionLabel(getPrimaryDivisionId(subcontractor))}
        </p>
        <p>
          <strong>Secondary / Cross-Trade Divisions:</strong>{" "}
          {formatList(getSecondaryDivisionLabels(subcontractor), "None")}
        </p>
        <p>
          <strong>Divisions:</strong>{" "}
          {formatList(subcontractor.csiCoverage.divisionIds.map(getDivisionLabel))}
        </p>
        <p>
          <strong>Sections:</strong>{" "}
          {formatList(subcontractor.csiCoverage.sectionIds.map(getSectionLabel))}
        </p>
        <p>
          <strong>Specialty Scope Notes:</strong>{" "}
          {subcontractor.csiCoverage.specialtyScopeNotes || "None"}
        </p>
      </Panel>

      <Panel title="Prequalification">
        <p>
          <strong>Status:</strong>{" "}
          {formatStatus(subcontractor.prequalification.status)}
        </p>
        <p>
          <strong>W9:</strong>{" "}
          {subcontractor.prequalification.w9OnFile ? "On file" : "Missing"}
        </p>
        <p>
          <strong>Insurance:</strong>{" "}
          {subcontractor.prequalification.insuranceOnFile
            ? "On file"
            : "Missing"}
        </p>
        <p>
          <strong>License:</strong>{" "}
          {subcontractor.prequalification.licenseOnFile ? "On file" : "Missing"}
        </p>
        <p>
          <strong>Bonding Capacity:</strong>{" "}
          {subcontractor.prequalification.bondingCapacity
            ? `$${subcontractor.prequalification.bondingCapacity.toLocaleString()}`
            : "Not specified"}
        </p>
        <p>
          <strong>Insurance Expiration:</strong>{" "}
          {subcontractor.prequalification.insuranceExpirationDate || "Not set"}
        </p>
        <p>
          <strong>License Expiration:</strong>{" "}
          {subcontractor.prequalification.licenseExpirationDate || "Not set"}
        </p>
      </Panel>

      <Panel title="Vendor Performance Index">
        <table style={{ borderCollapse: "collapse", minWidth: 640 }}>
          <tbody>
            <VpiRow label="Responsiveness" value={subcontractor.vpi.responsiveness} />
            <VpiRow
              label="Bid Completeness"
              value={subcontractor.vpi.bidCompleteness}
            />
            <VpiRow label="Bid Accuracy" value={subcontractor.vpi.bidAccuracy} />
            <VpiRow
              label="Schedule Performance"
              value={subcontractor.vpi.schedulePerformance}
            />
            <VpiRow label="Field Quality" value={subcontractor.vpi.fieldQuality} />
            <VpiRow
              label="Administrative Compliance"
              value={subcontractor.vpi.administrativeCompliance}
            />
            <VpiRow label="Overall" value={subcontractor.vpi.overall} />
            <tr>
              <th style={cell}>Projects Evaluated</th>
              <td style={cell}>{subcontractor.vpi.projectsEvaluated}</td>
            </tr>
            <tr>
              <th style={cell}>Confidence</th>
              <td style={cell}>
                {formatStatus(subcontractor.vpi.confidenceLevel)}
              </td>
            </tr>
          </tbody>
        </table>
      </Panel>

      <Panel title="Notes">
        <p>{subcontractor.notes || "No notes added yet."}</p>
        {subcontractor.prequalification.notes && (
          <p>
            <strong>Prequalification Notes:</strong>{" "}
            {subcontractor.prequalification.notes}
          </p>
        )}
      </Panel>
    </AppShell>
  );
}

function VpiRow({ label, value }: { label: string; value: number | undefined }) {
  return (
    <tr>
      <th style={cell}>{label}</th>
      <td style={cell}>{value === undefined ? "Not rated" : `${value} / 5`}</td>
    </tr>
  );
}

const cell: React.CSSProperties = {
  border: "1px solid var(--color-border)",
  padding: "8px",
  textAlign: "left",
  verticalAlign: "top",
};

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
  const storageValue =
    localStorage.getItem(subcontractorsStorageKey) || "[]";

  if (storageValue !== cachedSubcontractorsStorageValue) {
    cachedSubcontractorsStorageValue = storageValue;
    cachedSubcontractors = getMergedSubcontractors(storageValue);
  }

  return cachedSubcontractors;
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

function formatContactRoleTitle(contact: SubcontractorContact) {
  return [formatStatus(contact.role), contact.title].filter(Boolean).join(" / ");
}

function getLocationName(
  subcontractor: Subcontractor,
  locationId: string | undefined
) {
  if (!locationId) return "-";

  return (
    subcontractor.locations?.find((location) => location.id === locationId)?.name ??
    locationId
  );
}

function formatContactScopes(contact: SubcontractorContact) {
  if (!contact.inviteScopes || contact.inviteScopes.length === 0) {
    return contact.notes || "General contact";
  }

  return contact.inviteScopes
    .map((scope) => {
      const scopeParts = [
        scope.roleContext ? formatStatus(scope.roleContext) : undefined,
        scope.divisionIds?.map(getDivisionLabel).join(", "),
        scope.sectionIds?.map(getSectionLabel).join(", "),
        scope.counties?.join(", "),
        scope.citiesOrMarkets?.join(", "),
        scope.notes,
      ].filter(Boolean);

      return scopeParts.join(" | ");
    })
    .join("; ");
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
