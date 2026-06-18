"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { CsiCodeLabel, CsiLevelBadge } from "@/components/csi";
import AppShell from "@/components/layout/AppShell";
import Panel from "@/components/ui/Panel";
import {
  getCsiDivisions,
  getNearestLevel2Ancestor,
  isCsiSectionItem,
  isCsiSubsectionItem,
  resolveCsiCatalogItem,
} from "@/lib/csiCatalog";
import {
  companySettingsKey,
  defaultCompanySettings,
  getCompanySettings,
  settingsChangedEvent,
} from "@/lib/settings";
import { getDisplayedSubcontractorCoverage } from "@/lib/subcontractorCsiCoverage";
import {
  getBadgeClassName,
  getCombinedStatus,
  getComplianceAlerts,
  getDivisionLabel,
  formatVendorStatus,
  getMergedSubcontractors,
  getPrimaryContact,
  getPrimaryPhone,
  isDoNotUseVendor,
  isPreferredVendor,
  getSectionLabel,
  subcontractorsStorageKey,
} from "@/lib/subcontractors";
import { CsiCatalogItem, CsiMasterFormatVersion } from "@/types/Csi";
import { PrequalificationStatus, Subcontractor } from "@/types/Subcontractor";

const subcontractorListUiStateKey = "subcontractorListUiState";

type SubcontractorListUiState = {
  expandedDivisionIds: string[];
  expandedSectionIds: string[];
  scrollY: number;
  lastClickedSubcontractorId?: string;
  lastClickedSectionId?: string;
  restoreOnNextListVisit: boolean;
};

type PrequalificationFilter =
  | "ALL"
  | PrequalificationStatus
  | "COMPLIANT"
  | "HAS_ALERTS";

type DisplayedSubcontractorCoverage = ReturnType<
  typeof getDisplayedSubcontractorCoverage
>;

type DisplayedCoverageBySubcontractorId = Map<
  string,
  DisplayedSubcontractorCoverage
>;

type DisplayedCoverageSection = DisplayedSubcontractorCoverage["sections"][number];

type CsiDetailTag = {
  id: string;
  number: string;
  label: string;
  item?: CsiCatalogItem;
  needsReview: boolean;
};

type SubdivisionSubcontractorEntry = {
  subcontractor: Subcontractor;
  detailTags: CsiDetailTag[];
};

type SubdivisionSubcontractorGroup = {
  subdivisionId: string;
  subdivisionLabel: string;
  subdivisionItem?: CsiCatalogItem;
  warnings: string[];
  subcontractors: SubdivisionSubcontractorEntry[];
};

type DivisionSubcontractorGroup = {
  divisionId: string;
  divisionLabel?: string;
  warnings?: string[];
  subdivisions: SubdivisionSubcontractorGroup[];
};

const prequalificationFilters: PrequalificationFilter[] = [
  "ALL",
  "QUALIFIED",
  "CONDITIONAL",
  "IN_PROGRESS",
  "EXPIRED",
  "REJECTED",
  "NOT_STARTED",
  "COMPLIANT",
  "HAS_ALERTS",
];

const minimumVpiOptions = ["", "3", "4", "4.5"];

export default function SubcontractorsPage() {
  const subcontractorsSnapshot = useSubcontractorsSnapshot();
  const companyDefaultCsiVersion = useCompanyDefaultCsiVersion();
  const [listDisplayCsiVersion, setListDisplayCsiVersion] =
    useState<CsiMasterFormatVersion>(companyDefaultCsiVersion);
  const hasChangedListDisplayCsiVersion = useRef(false);
  const subcontractors = useMemo(
    () =>
      subcontractorsSnapshot.filter((subcontractor) => !subcontractor.archived),
    [subcontractorsSnapshot]
  );
  const displayedCoverageBySubcontractorId = useMemo(
    () =>
      new Map(
        subcontractors.map((subcontractor) => [
          subcontractor.id,
          getDisplayedSubcontractorCoverage(
            subcontractor,
            listDisplayCsiVersion
          ),
        ])
      ),
    [listDisplayCsiVersion, subcontractors]
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [prequalificationFilter, setPrequalificationFilter] =
    useState<PrequalificationFilter>("ALL");
  const [divisionFilter, setDivisionFilter] = useState("ALL");
  const [sectionFilter, setSectionFilter] = useState("ALL");
  const [preferredOnly, setPreferredOnly] = useState(false);
  const [hideDoNotUse, setHideDoNotUse] = useState(false);
  const [minimumVpi, setMinimumVpi] = useState("");
  const filteredSubcontractors = useMemo(
    () =>
      subcontractors.filter((subcontractor) => {
        const displayedCoverage = displayedCoverageBySubcontractorId.get(
          subcontractor.id
        );

        return displayedCoverage
          ? matchesFilters(subcontractor, displayedCoverage, {
              searchQuery,
              prequalificationFilter,
              divisionFilter,
              sectionFilter,
              preferredOnly,
              hideDoNotUse,
              minimumVpi,
            })
          : false;
      }),
    [
      displayedCoverageBySubcontractorId,
      divisionFilter,
      hideDoNotUse,
      minimumVpi,
      preferredOnly,
      prequalificationFilter,
      searchQuery,
      sectionFilter,
      subcontractors,
    ]
  );
  const groupedSubcontractors = useMemo(
    () =>
      groupSubcontractorsByDisplayedCoverage(
        filteredSubcontractors,
        displayedCoverageBySubcontractorId,
        listDisplayCsiVersion
      ),
    [displayedCoverageBySubcontractorId, filteredSubcontractors, listDisplayCsiVersion]
  );
  const initialUiState = getDefaultListUiState(groupedSubcontractors);
  const [expandedDivisionIds, setExpandedDivisionIds] = useState<string[]>(
    initialUiState.expandedDivisionIds
  );
  const [expandedSectionIds, setExpandedSectionIds] = useState<string[]>(
    initialUiState.expandedSectionIds
  );
  const [hasLoadedUiState, setHasLoadedUiState] = useState(false);
  const hasStartedUiStateRestore = useRef(false);
  const hasRestoredScroll = useRef(false);
  const shouldRestorePosition = useRef(false);
  const isNavigatingToSubcontractorDetailRef = useRef(false);
  const restoreScrollY = useRef(initialUiState.scrollY);
  const restoreSubcontractorId = useRef<string | undefined>(
    initialUiState.lastClickedSubcontractorId
  );
  const restoreSectionId = useRef<string | undefined>(
    initialUiState.lastClickedSectionId
  );
  const availableSectionOptions = useMemo(
    () =>
      getDisplayedSectionOptions(
        subcontractors,
        displayedCoverageBySubcontractorId,
        divisionFilter
      ),
    [displayedCoverageBySubcontractorId, divisionFilter, subcontractors]
  );
  const availableDivisionOptions = useMemo(
    () =>
      getDisplayedDivisionOptions(
        subcontractors,
        listDisplayCsiVersion,
        displayedCoverageBySubcontractorId
      ),
    [listDisplayCsiVersion, displayedCoverageBySubcontractorId, subcontractors]
  );

  useEffect(() => {
    if (hasChangedListDisplayCsiVersion.current) return;

    setListDisplayCsiVersion(companyDefaultCsiVersion);
  }, [companyDefaultCsiVersion]);

  function handleListDisplayCsiVersionChange(value: string) {
    hasChangedListDisplayCsiVersion.current = true;
    setListDisplayCsiVersion(value as CsiMasterFormatVersion);
    setDivisionFilter("ALL");
    setSectionFilter("ALL");
  }

  useEffect(() => {
    if (hasStartedUiStateRestore.current) return;
    if (groupedSubcontractors.length === 0) return;

    const storedState = getStoredListUiState();
    const shouldRestore = storedState?.restoreOnNextListVisit === true;
    const nextUiState = shouldRestore
      ? validateListUiState(storedState, groupedSubcontractors)
      : getDefaultListUiState(groupedSubcontractors);

    hasStartedUiStateRestore.current = true;
    shouldRestorePosition.current = shouldRestore;
    hasRestoredScroll.current = !shouldRestore;
    restoreScrollY.current = nextUiState.scrollY;
    restoreSubcontractorId.current = nextUiState.lastClickedSubcontractorId;
    restoreSectionId.current = nextUiState.lastClickedSectionId;

    requestAnimationFrame(() => {
      setExpandedDivisionIds(nextUiState.expandedDivisionIds);
      setExpandedSectionIds(nextUiState.expandedSectionIds);
      setHasLoadedUiState(true);
      if (!shouldRestore) {
        saveListUiState({
          ...nextUiState,
          restoreOnNextListVisit: false,
        });
      }
    });
  }, [groupedSubcontractors]);

  useEffect(() => {
    if (!hasLoadedUiState) return;
    const storedState = getStoredListUiState();

    saveListUiState({
      ...storedState,
      expandedDivisionIds,
      expandedSectionIds,
      scrollY: hasRestoredScroll.current
        ? window.scrollY
        : restoreScrollY.current,
      restoreOnNextListVisit:
        storedState?.restoreOnNextListVisit === true ||
        (shouldRestorePosition.current && !hasRestoredScroll.current),
    });
  }, [expandedDivisionIds, expandedSectionIds, hasLoadedUiState]);

  useEffect(() => {
    function saveScrollPosition() {
      if (!hasLoadedUiState || !hasRestoredScroll.current) return;
      if (isNavigatingToSubcontractorDetailRef.current) return;

      const storedState = getStoredListUiState();

      saveListUiState({
        ...storedState,
        expandedDivisionIds,
        expandedSectionIds,
        scrollY: window.scrollY,
        restoreOnNextListVisit: storedState?.restoreOnNextListVisit === true,
      });
    }

    window.addEventListener("scroll", saveScrollPosition, { passive: true });

    return () => {
      window.removeEventListener("scroll", saveScrollPosition);
    };
  }, [expandedDivisionIds, expandedSectionIds, hasLoadedUiState]);

  function restoreSavedPosition() {
    const didScrollToRow = scrollToSubcontractorRow(
      restoreSubcontractorId.current,
      restoreSectionId.current
    );

    if (!didScrollToRow) {
      window.scrollTo(0, restoreScrollY.current);
    }

    return didScrollToRow;
  }

  useEffect(() => {
    if (!hasLoadedUiState) return;
    if (!shouldRestorePosition.current) return;
    if (hasRestoredScroll.current) return;

    function completeRestoreAttempt() {
      hasRestoredScroll.current = true;
      shouldRestorePosition.current = false;
      saveListUiState({
        ...getStoredListUiState(),
        expandedDivisionIds,
        expandedSectionIds,
        scrollY: window.scrollY,
        restoreOnNextListVisit: false,
      });
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        restoreSavedPosition();
        window.setTimeout(() => {
          restoreSavedPosition();
          window.setTimeout(() => {
            restoreSavedPosition();
            completeRestoreAttempt();
          }, 150);
        }, 75);
      });
    });
  }, [expandedDivisionIds, expandedSectionIds, hasLoadedUiState]);

  function saveCurrentListUiState(subcontractorId: string, sectionId: string) {
    isNavigatingToSubcontractorDetailRef.current = true;

    saveListUiState({
      expandedDivisionIds,
      expandedSectionIds,
      scrollY: window.scrollY,
      lastClickedSubcontractorId: subcontractorId,
      lastClickedSectionId: sectionId,
      restoreOnNextListVisit: true,
    });
  }

  return (
    <AppShell title="Subcontractors">
      <Panel title="Subcontractor Library">
        <div style={{ marginBottom: 16 }}>
          <Link href="/subcontractors/new">Add / Prequalify Subcontractor</Link>
        </div>
        <p className="muted-text">
          Vendors are grouped by CSI division and subdivision. Section and
          subsection coverage appears as detail tags. Project-specific
          invite ranking will use location, service area, VPI, and compliance
          later.
        </p>
      </Panel>

      <Panel title="Search and Filters">
        <div className="form-grid">
          <SelectField
            label="Display CSI as"
            value={listDisplayCsiVersion}
            options={["MASTERFORMAT_CURRENT", "MASTERFORMAT_1995"]}
            onChange={handleListDisplayCsiVersionChange}
            getOptionLabel={formatCsiMasterFormatVersion}
          />
          <div className="form-field">
            <label>
              Search
              <br />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="form-input"
                placeholder="Company, contact, phone, email, trade, market"
              />
            </label>
          </div>
          <SelectField
            label="Vendor Status / Compliance"
            value={prequalificationFilter}
            options={prequalificationFilters}
            onChange={(value) =>
              setPrequalificationFilter(value as PrequalificationFilter)
            }
            getOptionLabel={formatPrequalificationFilter}
          />
          <SelectField
            label="CSI Division"
            value={divisionFilter}
            options={["ALL", ...availableDivisionOptions.map((division) => division.id)]}
            onChange={(value) => {
              setDivisionFilter(value);
              setSectionFilter("ALL");
            }}
            getOptionLabel={(value) =>
              value === "ALL"
                ? "All"
                : availableDivisionOptions.find((division) => division.id === value)
                    ?.label ?? getDivisionLabel(value)
            }
          />
          <SelectField
            label="CSI Scope"
            value={sectionFilter}
            options={["ALL", ...availableSectionOptions.map((section) => section.id)]}
            onChange={setSectionFilter}
            getOptionLabel={(value) =>
              value === "ALL"
                ? "All"
                : availableSectionOptions.find((section) => section.id === value)
                    ?.label ?? getSectionLabel(value)
            }
          />
          <SelectField
            label="Minimum VPI"
            value={minimumVpi}
            options={minimumVpiOptions}
            onChange={setMinimumVpi}
            getOptionLabel={(value) => (value ? `${value}+` : "Any")}
          />
          <div className="form-field">
            <label className="radio-option">
              <input
                type="checkbox"
                checked={preferredOnly}
                onChange={(event) => setPreferredOnly(event.target.checked)}
              />
              Preferred only
            </label>
          </div>
          <div className="form-field">
            <label className="radio-option">
              <input
                type="checkbox"
                checked={hideDoNotUse}
                onChange={(event) => setHideDoNotUse(event.target.checked)}
              />
              Hide Do Not Use
            </label>
          </div>
        </div>
        <p className="muted-text">
          Showing {filteredSubcontractors.length} of {subcontractors.length} vendors.
        </p>
      </Panel>

      {groupedSubcontractors.length === 0 ? (
        <Panel title="No Matching Vendors">
          <p className="muted-text">
            No subcontractors match the current search and filters.
          </p>
        </Panel>
      ) : (
        groupedSubcontractors.map((divisionGroup) => {
          const isDivisionExpanded = expandedDivisionIds.includes(
            divisionGroup.divisionId
          );

          return (
            <Panel key={divisionGroup.divisionId}>
              <button
                type="button"
                className="crm-expand-row crm-division-row"
                aria-expanded={isDivisionExpanded}
                onClick={() =>
                  toggleExpanded(divisionGroup.divisionId, setExpandedDivisionIds)
                }
              >
                <span className="crm-expand-button">
                  {isDivisionExpanded ? "-" : "+"}
                </span>
                <span>
                  {divisionGroup.divisionLabel ??
                    getDivisionLabel(divisionGroup.divisionId)}
                </span>
                <span className="muted-text">
                  {getDivisionVendorCount(divisionGroup)} vendors
                </span>
              </button>

              {isDivisionExpanded &&
                divisionGroup.subdivisions.map((subdivisionGroup) => {
                  const isSectionExpanded = expandedSectionIds.includes(
                    subdivisionGroup.subdivisionId
                  );

                  return (
                    <div key={subdivisionGroup.subdivisionId} className="crm-section">
                      <button
                        type="button"
                        className="crm-expand-row crm-section-row"
                        aria-expanded={isSectionExpanded}
                        onClick={() =>
                          toggleExpanded(
                            subdivisionGroup.subdivisionId,
                            setExpandedSectionIds
                          )
                        }
                      >
                        <span className="crm-expand-button">
                          {isSectionExpanded ? "-" : "+"}
                        </span>
                        <span className="subcontractor-csi-group-label">
                          {subdivisionGroup.subdivisionItem ? (
                            <CsiCodeLabel
                              item={subdivisionGroup.subdivisionItem}
                              showLevelBadge
                            />
                          ) : (
                            <>
                              <span>{subdivisionGroup.subdivisionLabel}</span>
                              <CsiLevelBadge level={2} />
                            </>
                          )}
                        </span>
                        <span className="muted-text">
                          {subdivisionGroup.subcontractors.length} vendors
                        </span>
                      </button>

                      {isSectionExpanded && (
                        <table className="crm-vendor-table">
                          <thead>
                            <tr>
                              <th style={cell}>Company</th>
                              <th style={cell}>Status</th>
                              <th style={cell}>VPI</th>
                              <th style={cell}>Primary Contact</th>
                              <th style={cell}>Primary Phone</th>
                              <th style={cell}>Primary Email</th>
                              <th style={cell}>Compliance</th>
                              <th style={cell}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {subdivisionGroup.subcontractors.map((entry) => (
                              <VendorRow
                                key={`${subdivisionGroup.subdivisionId}-${entry.subcontractor.id}`}
                                subcontractor={entry.subcontractor}
                                sectionId={subdivisionGroup.subdivisionId}
                                subdivisionLabel={subdivisionGroup.subdivisionLabel}
                                subdivisionItem={subdivisionGroup.subdivisionItem}
                                detailTags={entry.detailTags}
                                onNavigate={saveCurrentListUiState}
                              />
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  );
                })}
            </Panel>
          );
        })
      )}
    </AppShell>
  );
}

function VendorRow({
  subcontractor,
  sectionId,
  subdivisionLabel,
  subdivisionItem,
  detailTags,
  onNavigate,
}: {
  subcontractor: Subcontractor;
  sectionId: string;
  subdivisionLabel: string;
  subdivisionItem?: CsiCatalogItem;
  detailTags: CsiDetailTag[];
  onNavigate: (subcontractorId: string, sectionId: string) => void;
}) {
  const primaryContact = getPrimaryContact(subcontractor);
  const primaryPhone = getPrimaryPhone(primaryContact, subcontractor);
  const combinedStatus = getCombinedStatus(subcontractor);
  const complianceAlerts = getComplianceAlerts(subcontractor);

  return (
    <tr
      data-subcontractor-id={subcontractor.id}
      data-section-id={sectionId}
    >
      <td style={cell}>
        <strong>{subcontractor.companyName}</strong>
        {isPreferredVendor(subcontractor) && (
          <span className="badge badge-primary">* Preferred</span>
        )}
        {subcontractor.dba && (
          <div className="muted-text">DBA: {subcontractor.dba}</div>
        )}
        <div className="subcontractor-row-csi">
          <div className="muted-text">Primary CSI Subdivision</div>
          <div className="subcontractor-row-csi-primary">
            {subdivisionItem ? (
              <CsiCodeLabel item={subdivisionItem} showLevelBadge />
            ) : (
              <>
                <span>{subdivisionLabel}</span>
                <CsiLevelBadge level={2} />
              </>
            )}
          </div>
          {detailTags.length > 0 && (
            <div className="badge-list subcontractor-row-csi-tags">
              {detailTags.map((detailTag) => (
                <span
                  key={detailTag.id}
                  className={
                    detailTag.needsReview
                      ? "badge badge-warning"
                      : "badge badge-muted"
                  }
                  title={detailTag.label}
                >
                  <CsiCodeLabel
                    item={detailTag.item}
                    idOrNumber={detailTag.number}
                    showLevelBadge
                  />
                </span>
              ))}
            </div>
          )}
        </div>
      </td>
      <td style={cell}>
        <span className={getBadgeClassName(combinedStatus.tone)}>
          {combinedStatus.label}
        </span>
      </td>
      <td style={cell}>{formatVpi(subcontractor)}</td>
      <td style={cell}>
        {primaryContact ? (
          <>
            <strong>{primaryContact.name}</strong>
            <div className="muted-text">
              {getContactDisplayLabel(primaryContact)}
            </div>
          </>
        ) : (
          "No contact"
        )}
      </td>
      <td style={cell}>
        {primaryPhone ? `${primaryPhone.label}: ${primaryPhone.value}` : "No phone"}
      </td>
      <td style={cell}>{primaryContact?.email || "No email"}</td>
      <td style={cell}>
        <div className="badge-list">
          {complianceAlerts.length === 0 ? (
            <span className="badge badge-success">Compliant</span>
          ) : (
            complianceAlerts.map((alert) => (
              <span key={alert} className="badge badge-warning">
                {alert}
              </span>
            ))
          )}
        </div>
      </td>
      <td style={cell}>
        <div className="badge-list">
          <Link
            href={`/subcontractors/${subcontractor.id}`}
            onClick={() => onNavigate(subcontractor.id, sectionId)}
          >
            View Profile
          </Link>
          <Link
            href={`/subcontractors/${subcontractor.id}/edit`}
            onClick={() => onNavigate(subcontractor.id, sectionId)}
          >
            Edit
          </Link>
        </div>
      </td>
    </tr>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
  getOptionLabel = formatStatus,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  getOptionLabel?: (value: string) => string;
}) {
  return (
    <div className="form-field">
      <label>
        {label}
        <br />
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="form-input"
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {getOptionLabel(option)}
            </option>
          ))}
        </select>
      </label>
    </div>
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

let cachedCompanySettingsStorageValue: string | undefined;
let cachedCompanyDefaultCsiVersion: CsiMasterFormatVersion =
  defaultCompanySettings.defaultCsiVersion;

function useCompanyDefaultCsiVersion(): CsiMasterFormatVersion {
  return useSyncExternalStore(
    subscribeToCompanySettingsStorage,
    getCompanyDefaultCsiVersionSnapshot,
    getServerCompanyDefaultCsiVersionSnapshot
  );
}

function subscribeToCompanySettingsStorage(onStoreChange: () => void) {
  function handleStorage(event: StorageEvent) {
    if (event.key === companySettingsKey) onStoreChange();
  }

  window.addEventListener("storage", handleStorage);
  window.addEventListener(settingsChangedEvent, onStoreChange);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(settingsChangedEvent, onStoreChange);
  };
}

function getServerCompanyDefaultCsiVersionSnapshot(): CsiMasterFormatVersion {
  return cachedCompanyDefaultCsiVersion;
}

function getCompanyDefaultCsiVersionSnapshot(): CsiMasterFormatVersion {
  const storageValue = localStorage.getItem(companySettingsKey) || "";

  if (storageValue !== cachedCompanySettingsStorageValue) {
    cachedCompanySettingsStorageValue = storageValue;
    cachedCompanyDefaultCsiVersion = getCompanySettings().defaultCsiVersion;
  }

  return cachedCompanyDefaultCsiVersion;
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

function toggleExpanded(
  id: string,
  setExpandedIds: React.Dispatch<React.SetStateAction<string[]>>
) {
  setExpandedIds((currentIds) =>
    currentIds.includes(id)
      ? currentIds.filter((currentId) => currentId !== id)
      : [...currentIds, id]
  );
}

function getDefaultListUiState(
  groupedSubcontractors: DivisionSubcontractorGroup[]
): SubcontractorListUiState {
  return {
    expandedDivisionIds: groupedSubcontractors.map((group) => group.divisionId),
    expandedSectionIds: [],
    scrollY: 0,
    restoreOnNextListVisit: false,
  };
}

function getStoredListUiState(): SubcontractorListUiState | undefined {
  if (typeof window === "undefined") return undefined;

  try {
    const storedValue = sessionStorage.getItem(subcontractorListUiStateKey);
    const parsedValue = storedValue ? JSON.parse(storedValue) : undefined;

    if (!parsedValue || typeof parsedValue !== "object") return undefined;

    return {
      expandedDivisionIds: Array.isArray(parsedValue.expandedDivisionIds)
        ? parsedValue.expandedDivisionIds.filter(isString)
        : [],
      expandedSectionIds: Array.isArray(parsedValue.expandedSectionIds)
        ? parsedValue.expandedSectionIds.filter(isString)
        : [],
      scrollY:
        typeof parsedValue.scrollY === "number" && parsedValue.scrollY > 0
          ? parsedValue.scrollY
          : 0,
      lastClickedSubcontractorId: isString(parsedValue.lastClickedSubcontractorId)
        ? parsedValue.lastClickedSubcontractorId
        : undefined,
      lastClickedSectionId: isString(parsedValue.lastClickedSectionId)
        ? parsedValue.lastClickedSectionId
        : undefined,
      restoreOnNextListVisit: parsedValue.restoreOnNextListVisit === true,
    };
  } catch {
    return undefined;
  }
}

function validateListUiState(
  uiState: SubcontractorListUiState,
  groupedSubcontractors: DivisionSubcontractorGroup[]
): SubcontractorListUiState {
  const availableDivisionIds = new Set(
    groupedSubcontractors.map((group) => group.divisionId)
  );
  const availableSectionIds = new Set(
    groupedSubcontractors.flatMap((group) =>
      group.subdivisions.map((subdivision) => subdivision.subdivisionId)
    )
  );

  return {
    ...uiState,
    expandedDivisionIds: uiState.expandedDivisionIds.filter((divisionId) =>
      availableDivisionIds.has(divisionId)
    ),
    expandedSectionIds: uiState.expandedSectionIds.filter((sectionId) =>
      availableSectionIds.has(sectionId)
    ),
  };
}

function saveListUiState(uiState: Partial<SubcontractorListUiState>) {
  if (typeof window === "undefined") return;

  const normalizedState: SubcontractorListUiState = {
    expandedDivisionIds: uiState.expandedDivisionIds ?? [],
    expandedSectionIds: uiState.expandedSectionIds ?? [],
    scrollY: uiState.scrollY ?? 0,
    lastClickedSubcontractorId: uiState.lastClickedSubcontractorId,
    lastClickedSectionId: uiState.lastClickedSectionId,
    restoreOnNextListVisit: uiState.restoreOnNextListVisit ?? false,
  };

  sessionStorage.setItem(
    subcontractorListUiStateKey,
    JSON.stringify(normalizedState)
  );
}

function scrollToSubcontractorRow(
  subcontractorId: string | undefined,
  sectionId: string | undefined
) {
  if (!subcontractorId) return false;

  const rows = Array.from(
    document.querySelectorAll<HTMLTableRowElement>("[data-subcontractor-id]")
  );
  const matchingRow =
    rows.find(
      (row) =>
        row.dataset.subcontractorId === subcontractorId &&
        (!sectionId || row.dataset.sectionId === sectionId)
    ) ??
    rows.find((row) => row.dataset.subcontractorId === subcontractorId);

  if (!matchingRow) return false;

  matchingRow.scrollIntoView({ block: "center" });
  return true;
}

function groupSubcontractorsByDisplayedCoverage(
  subcontractors: Subcontractor[],
  displayedCoverageBySubcontractorId: DisplayedCoverageBySubcontractorId,
  displayCsiVersion: CsiMasterFormatVersion
): DivisionSubcontractorGroup[] {
  const divisionGroups = new Map<
    string,
    {
      label: string;
      warnings: Set<string>;
      subdivisions: Map<
        string,
        {
          label: string;
          item?: CsiCatalogItem;
          warnings: Set<string>;
          subcontractors: Map<
            string,
            {
              subcontractor: Subcontractor;
              detailTags: Map<string, CsiDetailTag>;
            }
          >;
        }
      >;
    }
  >();

  subcontractors.forEach((subcontractor) => {
    const displayedCoverage = displayedCoverageBySubcontractorId.get(
      subcontractor.id
    );

    if (!displayedCoverage) return;

    const coverageItems =
      displayedCoverage.sections.length > 0
        ? displayedCoverage.sections
        : displayedCoverage.divisions.map((division) => ({
            id: `${division.id}::unassigned`,
            number: division.number,
            name: "Unassigned CSI scope",
            label: `${division.label} - Unassigned CSI scope`,
            divisionId: division.id,
            divisionNumber: division.number,
            sourceFallback: division.sourceFallback,
            needsReview: division.needsReview,
          }));

    coverageItems.forEach((section) => {
      const division =
        displayedCoverage.divisions.find(
          (displayedDivision) => displayedDivision.id === section.divisionId
        ) ??
        displayedCoverage.divisions.find(
          (displayedDivision) =>
            displayedDivision.number === section.divisionNumber
        );
      const divisionId = division?.id ?? section.divisionId;
      const divisionLabel = division?.label ?? getDivisionLabel(divisionId);
      const divisionGroup =
        divisionGroups.get(divisionId) ?? {
          label: divisionLabel,
          warnings: new Set<string>(),
          subdivisions: new Map(),
        };
      const subdivision = getSubdivisionGroupTarget(section, displayCsiVersion);
      const subdivisionId = subdivision.item?.id ?? subdivision.id;
      const subdivisionGroup =
        divisionGroup.subdivisions.get(subdivisionId) ?? {
          label: subdivision.label,
          item: subdivision.item,
          warnings: new Set<string>(),
          subcontractors: new Map(),
        };
      const subcontractorEntry =
        subdivisionGroup.subcontractors.get(subcontractor.id) ?? {
          subcontractor,
          detailTags: new Map<string, CsiDetailTag>(),
        };
      const detailTag = getDetailTag(section, displayCsiVersion);

      displayedCoverage.warnings.forEach((warning) => {
        divisionGroup.warnings.add(warning);
        subdivisionGroup.warnings.add(warning);
      });
      if (section.needsReview) {
        subdivisionGroup.warnings.add("CSI display needs review.");
      }

      if (detailTag) {
        subcontractorEntry.detailTags.set(detailTag.id, detailTag);
      }

      subdivisionGroup.subcontractors.set(subcontractor.id, subcontractorEntry);
      divisionGroup.subdivisions.set(subdivisionId, subdivisionGroup);
      divisionGroups.set(divisionId, divisionGroup);
    });
  });

  return Array.from(divisionGroups.entries())
    .map(([divisionId, divisionGroup]) => ({
      divisionId,
      divisionLabel: divisionGroup.label,
      warnings: Array.from(divisionGroup.warnings),
      subdivisions: Array.from(divisionGroup.subdivisions.entries())
        .map(([subdivisionId, subdivisionGroup]) => ({
          subdivisionId,
          subdivisionLabel: subdivisionGroup.label,
          subdivisionItem: subdivisionGroup.item,
          warnings: Array.from(subdivisionGroup.warnings),
          subcontractors: Array.from(subdivisionGroup.subcontractors.values())
            .map((entry) => ({
              subcontractor: entry.subcontractor,
              detailTags: Array.from(entry.detailTags.values()).sort(
                compareCsiDetailTags
              ),
            }))
            .sort((a, b) =>
              a.subcontractor.companyName.localeCompare(
                b.subcontractor.companyName
              )
            ),
        }))
        .sort((a, b) =>
          (a.subdivisionLabel ?? a.subdivisionId).localeCompare(
            b.subdivisionLabel ?? b.subdivisionId,
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

function matchesFilters(
  subcontractor: Subcontractor,
  displayedCoverage: DisplayedSubcontractorCoverage,
  filters: {
    searchQuery: string;
    prequalificationFilter: PrequalificationFilter;
    divisionFilter: string;
    sectionFilter: string;
    preferredOnly: boolean;
    hideDoNotUse: boolean;
    minimumVpi: string;
  }
) {
  const complianceAlerts = getComplianceAlerts(subcontractor);

  if (filters.hideDoNotUse && isDoNotUseVendor(subcontractor)) {
    return false;
  }

  if (
    filters.preferredOnly &&
    !isPreferredVendor(subcontractor)
  ) {
    return false;
  }

  if (
    !matchesPrequalificationFilter(
      subcontractor.prequalification.status,
      complianceAlerts,
      filters.prequalificationFilter
    )
  ) {
    return false;
  }

  if (
    filters.divisionFilter !== "ALL" &&
    !displayedCoverage.divisions.some(
      (division) => division.id === filters.divisionFilter
    )
  ) {
    return false;
  }

  if (
    filters.sectionFilter !== "ALL" &&
    !displayedCoverage.sections.some(
      (section) => section.id === filters.sectionFilter
    )
  ) {
    return false;
  }

  if (
    filters.minimumVpi &&
    (subcontractor.vpi.overall === undefined ||
      subcontractor.vpi.overall < Number(filters.minimumVpi))
  ) {
    return false;
  }

  if (filters.searchQuery.trim()) {
    return getSearchText(subcontractor, displayedCoverage).includes(
      normalize(filters.searchQuery)
    );
  }

  return true;
}

function matchesPrequalificationFilter(
  status: PrequalificationStatus,
  complianceAlerts: string[],
  filter: PrequalificationFilter
) {
  if (filter === "ALL") return true;
  if (filter === "COMPLIANT") return complianceAlerts.length === 0;
  if (filter === "HAS_ALERTS") return complianceAlerts.length > 0;

  return status === filter;
}

function getSearchText(
  subcontractor: Subcontractor,
  displayedCoverage: ReturnType<typeof getDisplayedSubcontractorCoverage>
) {
  const primaryContact = getPrimaryContact(subcontractor);
  const primaryPhone = getPrimaryPhone(primaryContact, subcontractor);
  const values = [
    subcontractor.companyName,
    subcontractor.dba,
    primaryContact?.name,
    primaryPhone?.value,
    primaryContact?.email,
    subcontractor.mainPhone,
    ...subcontractor.serviceArea.states,
    ...subcontractor.serviceArea.counties,
    ...subcontractor.serviceArea.citiesOrMarkets,
    ...displayedCoverage.divisions.map((division) => division.label),
    ...displayedCoverage.sections.map((section) => section.label),
    subcontractor.csiCoverage.specialtyScopeNotes,
  ];

  return normalize(values.filter(Boolean).join(" "));
}

function getDisplayedDivisionOptions(
  subcontractors: Subcontractor[],
  displayCsiVersion: CsiMasterFormatVersion,
  displayedCoverageBySubcontractorId: DisplayedCoverageBySubcontractorId
) {
  const divisionOptions = new Map<string, { id: string; label: string }>();

  getCsiDivisions(displayCsiVersion).forEach((division) => {
    divisionOptions.set(division.id, {
      id: division.id,
      label: `Division ${division.number} - ${division.name}`,
    });
  });

  subcontractors.forEach((subcontractor) => {
    displayedCoverageBySubcontractorId
      .get(subcontractor.id)
      ?.divisions.forEach((division) => {
        divisionOptions.set(division.id, {
          id: division.id,
          label: division.label,
        });
      });
  });

  return Array.from(divisionOptions.values()).sort((a, b) =>
    a.label.localeCompare(b.label, undefined, { numeric: true })
  );
}

function getDisplayedSectionOptions(
  subcontractors: Subcontractor[],
  displayedCoverageBySubcontractorId: DisplayedCoverageBySubcontractorId,
  divisionFilter: string
) {
  const sectionOptions = new Map<
    string,
    { id: string; label: string; divisionId: string }
  >();

  subcontractors.forEach((subcontractor) => {
    displayedCoverageBySubcontractorId
      .get(subcontractor.id)
      ?.sections.forEach((section) => {
        if (divisionFilter !== "ALL" && section.divisionId !== divisionFilter) {
          return;
        }

        sectionOptions.set(section.id, {
          id: section.id,
          label: section.label,
          divisionId: section.divisionId,
        });
      });
  });

  return Array.from(sectionOptions.values()).sort((a, b) =>
    a.label.localeCompare(b.label, undefined, { numeric: true })
  );
}

function getSubdivisionGroupTarget(
  section: DisplayedCoverageSection,
  displayCsiVersion: CsiMasterFormatVersion
): { id: string; label: string; item?: CsiCatalogItem } {
  const item = resolveDisplayedCoverageItem(section, displayCsiVersion);

  if (item?.level === 2) {
    return {
      id: item.id,
      label: `${item.number} - ${item.name}`,
      item,
    };
  }

  if (item) {
    const nearestSubdivision = getNearestLevel2Ancestor(
      displayCsiVersion,
      item.id
    );

    if (nearestSubdivision) {
      return {
        id: nearestSubdivision.id,
        label: `${nearestSubdivision.number} - ${nearestSubdivision.name}`,
        item: nearestSubdivision,
      };
    }
  }

  return {
    id: `${section.divisionId}::unassigned-subdivision`,
    label: `${getDivisionLabel(section.divisionId)} - Unassigned CSI scope`,
  };
}

function getDetailTag(
  section: DisplayedCoverageSection,
  displayCsiVersion: CsiMasterFormatVersion
): CsiDetailTag | undefined {
  const item = resolveDisplayedCoverageItem(section, displayCsiVersion);

  if (item && !(isCsiSectionItem(item) || isCsiSubsectionItem(item))) {
    return undefined;
  }

  return {
    id: item?.id ?? section.id,
    number: item?.number ?? section.number,
    label: item ? `${item.number} - ${item.name}` : section.label,
    item,
    needsReview: section.needsReview,
  };
}

function resolveDisplayedCoverageItem(
  section: DisplayedCoverageSection,
  displayCsiVersion: CsiMasterFormatVersion
) {
  return (
    resolveCsiCatalogItem(displayCsiVersion, section.id) ??
    resolveCsiCatalogItem(displayCsiVersion, section.number)
  );
}

function compareCsiDetailTags(detailTagA: CsiDetailTag, detailTagB: CsiDetailTag) {
  return detailTagA.label.localeCompare(detailTagB.label, undefined, {
    numeric: true,
  });
}

function normalize(value: string) {
  return value.toLowerCase().trim();
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function getDivisionVendorCount(group: DivisionSubcontractorGroup) {
  const subcontractorIds = new Set<string>();

  group.subdivisions.forEach((subdivision) => {
    subdivision.subcontractors.forEach((entry) => {
      subcontractorIds.add(entry.subcontractor.id);
    });
  });

  return subcontractorIds.size;
}

function formatVpi(subcontractor: Subcontractor) {
  const score = subcontractor.vpi.overall;
  const projectsText =
    subcontractor.vpi.projectsEvaluated === 1 ? "project" : "projects";

  return score === undefined
    ? `Not rated (${subcontractor.vpi.projectsEvaluated} ${projectsText})`
    : `${score.toFixed(1)} / 5 (${subcontractor.vpi.projectsEvaluated} ${projectsText})`;
}

function getContactDisplayLabel(contact: Subcontractor["contacts"][number]) {
  return contact.title?.trim() || formatStatus(contact.role);
}

function formatStatus(value: string) {
  if (value === "ALL") return "All";
  if (value === "COMPLIANT") return "Compliant";
  if (value === "HAS_ALERTS") return "Has Compliance Alerts";

  return value
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

function formatPrequalificationFilter(value: string) {
  if (value === "ALL") return "All";
  if (value === "COMPLIANT") return "Compliant";
  if (value === "HAS_ALERTS") return "Has Compliance Alerts";

  return formatVendorStatus(value as PrequalificationStatus);
}

function formatCsiMasterFormatVersion(value: string) {
  if (value === "MASTERFORMAT_1995") return "MasterFormat 1995";

  return "Current MasterFormat";
}
