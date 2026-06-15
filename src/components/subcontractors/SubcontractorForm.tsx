"use client";

import { useEffect, useMemo, useState } from "react";
import { csiCrosswalkEntries } from "@/data/csiCrosswalk";
import { mockCsiDivisions } from "@/data/mockCsiDivisions";
import { mockCsiSections } from "@/data/mockCsiSections";
import {
  getCrosswalkEntriesFor1995,
  getCrosswalkEntriesForCurrent,
} from "@/lib/csiCrosswalk";
import {
  getSectionNumbersForSubcontractor,
  getSubcontractorCoverageForVersion,
} from "@/lib/subcontractorCsiCoverage";
import { formatVendorStatus } from "@/lib/subcontractors";
import { CsiDivision, CsiMasterFormatVersion } from "@/types/Csi";
import {
  ContactRole,
  PhoneType,
  PrequalificationStatus,
  Subcontractor,
  SubcontractorContact,
  SubcontractorContactRoleContext,
  SubcontractorContactScope,
  SubcontractorLocation,
  SubcontractorLocationType,
} from "@/types/Subcontractor";
import Panel from "@/components/ui/Panel";

type SubcontractorFormProps = {
  initialSubcontractor: Subcontractor;
  submitLabel: string;
  onSubmit: (subcontractor: Subcontractor) => void;
};

type CsiPickerSectionOption = {
  id: string;
  divisionId: string;
  number: string;
  name: string;
  additionalTitleCount: number;
};

type StagedCsiCoverageDraft = {
  primaryDivisionId: string;
  csiCoverage: Subcontractor["csiCoverage"];
};

type StagedResponsibilitiesDraft = {
  contactId: string;
  inviteScopes: SubcontractorContactScope[];
};

const prequalificationStatuses: PrequalificationStatus[] = [
  "NOT_STARTED",
  "IN_PROGRESS",
  "QUALIFIED",
  "CONDITIONAL",
  "EXPIRED",
  "REJECTED",
];

const contactRoles: ContactRole[] = [
  "ESTIMATOR",
  "PROJECT_MANAGER",
  "OWNER",
  "ACCOUNTING",
  "GENERAL",
];

const phoneTypes: PhoneType[] = ["OFFICE", "MOBILE"];
const locationTypes: SubcontractorLocationType[] = [
  "HEADQUARTERS",
  "BRANCH",
  "FIELD_OFFICE",
  "BILLING",
];
const csiSourceVersions: CsiMasterFormatVersion[] = [
  "MASTERFORMAT_CURRENT",
  "MASTERFORMAT_1995",
];
const contactRoleContexts: SubcontractorContactRoleContext[] = [
  "ESTIMATING",
  "PROJECT_MANAGEMENT",
  "ACCOUNTING",
  "AWARD",
];

export default function SubcontractorForm({
  initialSubcontractor,
  submitLabel,
  onSubmit,
}: SubcontractorFormProps) {
  const fallbackPrimaryContact =
    initialSubcontractor.contacts.find((contact) => contact.isPrimary) ??
    initialSubcontractor.contacts[0] ??
    createEmptyPrimaryContact(initialSubcontractor.id);
  const initialDraft = useMemo<Subcontractor>(() => ({
    ...initialSubcontractor,
    contacts:
      initialSubcontractor.contacts.length > 0
        ? initialSubcontractor.contacts
        : [fallbackPrimaryContact],
  }), [fallbackPrimaryContact, initialSubcontractor]);
  const [draft, setDraft] = useState<Subcontractor>(() => initialDraft);
  const initialSnapshot = useMemo(
    () => getSubcontractorSnapshot(initialDraft),
    [initialDraft]
  );
  const draftSnapshot = useMemo(
    () => getSubcontractorSnapshot(draft),
    [draft]
  );
  const isDirty = initialSnapshot !== draftSnapshot;
  const [expandedContactIds, setExpandedContactIds] = useState<string[]>(() => {
    const primaryContact =
      initialDraft.contacts.find((contact) => contact.isPrimary) ??
      initialDraft.contacts[0];

    return primaryContact ? [primaryContact.id] : [];
  });
  const [expandedLocationIds, setExpandedLocationIds] = useState<string[]>(() => {
    const primaryLocation =
      initialDraft.locations?.find((location) => location.isPrimary) ??
      initialDraft.locations?.[0];

    return primaryLocation ? [primaryLocation.id] : [];
  });
  const savedCsiSourceVersion =
    draft.csiCoverage.sourceVersion ?? "MASTERFORMAT_CURRENT";
  const [pickerDisplayVersion, setPickerDisplayVersion] =
    useState<CsiMasterFormatVersion>(savedCsiSourceVersion);
  const isViewingEquivalentCoverage =
    pickerDisplayVersion !== savedCsiSourceVersion;
  const csiDivisionOptions = useMemo(
    () => getCsiDivisionOptions(pickerDisplayVersion),
    [pickerDisplayVersion]
  );
  const csiSectionOptions = useMemo(
    () => getCsiSectionOptions(pickerDisplayVersion),
    [pickerDisplayVersion]
  );
  const [expandedCsiDivisionIds, setExpandedCsiDivisionIds] = useState<string[]>(
    () => draft.csiCoverage.divisionIds
  );
  const selectedSectionIds = useMemo(
    () =>
      getDisplayedSectionIds(
        draft,
        pickerDisplayVersion,
        csiSectionOptions
      ),
    [draft, pickerDisplayVersion, csiSectionOptions]
  );
  const selectedDivisionIds = useMemo(
    () =>
      getDisplayedDivisionIds(
        draft,
        pickerDisplayVersion,
        csiDivisionOptions,
        csiSectionOptions,
        selectedSectionIds
      ),
    [
      draft,
      pickerDisplayVersion,
      csiDivisionOptions,
      csiSectionOptions,
      selectedSectionIds,
    ]
  );
  const crosswalkIssueCount = useMemo(
    () => getCrosswalkIssueCount(draft, pickerDisplayVersion),
    [draft, pickerDisplayVersion]
  );
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [isCsiModalOpen, setIsCsiModalOpen] = useState(false);
  const [stagedCsiDraft, setStagedCsiDraft] =
    useState<StagedCsiCoverageDraft | null>(null);
  const [stagedPickerDisplayVersion, setStagedPickerDisplayVersion] =
    useState<CsiMasterFormatVersion | null>(null);
  const [stagedExpandedCsiDivisionIds, setStagedExpandedCsiDivisionIds] =
    useState<string[]>([]);
  const [stagedResponsibilitiesDraft, setStagedResponsibilitiesDraft] =
    useState<StagedResponsibilitiesDraft | null>(null);
  const [showAllResponsibilityCsi, setShowAllResponsibilityCsi] =
    useState(false);
  const responsibilityCsiVersion =
    draft.csiCoverage.sourceVersion ?? "MASTERFORMAT_CURRENT";
  const responsibilityDivisionOptions = useMemo(
    () => getCsiDivisionOptions(responsibilityCsiVersion),
    [responsibilityCsiVersion]
  );
  const responsibilitySectionOptions = useMemo(
    () => getCsiSectionOptions(responsibilityCsiVersion),
    [responsibilityCsiVersion]
  );
  const visibleResponsibilityDivisionOptions = useMemo(
    () =>
      getVisibleResponsibilityDivisions(
        responsibilityDivisionOptions,
        responsibilitySectionOptions,
        draft,
        stagedResponsibilitiesDraft?.inviteScopes ?? [],
        showAllResponsibilityCsi
      ),
    [
      draft,
      responsibilityDivisionOptions,
      responsibilitySectionOptions,
      showAllResponsibilityCsi,
      stagedResponsibilitiesDraft,
    ]
  );
  const visibleResponsibilitySectionOptions = useMemo(
    () =>
      getVisibleResponsibilitySections(
        responsibilitySectionOptions,
        draft,
        stagedResponsibilitiesDraft?.inviteScopes ?? [],
        showAllResponsibilityCsi
      ),
    [
      draft,
      responsibilitySectionOptions,
      showAllResponsibilityCsi,
      stagedResponsibilitiesDraft,
    ]
  );
  const stagedCsiSubcontractor = useMemo(
    () =>
      stagedCsiDraft
        ? {
            ...draft,
            primaryDivisionId: stagedCsiDraft.primaryDivisionId,
            csiCoverage: stagedCsiDraft.csiCoverage,
          }
        : null,
    [draft, stagedCsiDraft]
  );
  const effectiveStagedPickerDisplayVersion =
    stagedPickerDisplayVersion ?? pickerDisplayVersion;
  const stagedSavedCsiSourceVersion =
    stagedCsiDraft?.csiCoverage.sourceVersion ?? "MASTERFORMAT_CURRENT";
  const isStagedViewingEquivalentCoverage =
    effectiveStagedPickerDisplayVersion !== stagedSavedCsiSourceVersion;
  const stagedCsiDivisionOptions = useMemo(
    () => getCsiDivisionOptions(effectiveStagedPickerDisplayVersion),
    [effectiveStagedPickerDisplayVersion]
  );
  const stagedCsiSectionOptions = useMemo(
    () => getCsiSectionOptions(effectiveStagedPickerDisplayVersion),
    [effectiveStagedPickerDisplayVersion]
  );
  const stagedSelectedSectionIds = useMemo(
    () =>
      stagedCsiSubcontractor
        ? getDisplayedSectionIds(
            stagedCsiSubcontractor,
            effectiveStagedPickerDisplayVersion,
            stagedCsiSectionOptions
          )
        : new Set<string>(),
    [
      stagedCsiSubcontractor,
      effectiveStagedPickerDisplayVersion,
      stagedCsiSectionOptions,
    ]
  );
  const stagedSelectedDivisionIds = useMemo(
    () =>
      stagedCsiSubcontractor
        ? getDisplayedDivisionIds(
            stagedCsiSubcontractor,
            effectiveStagedPickerDisplayVersion,
            stagedCsiDivisionOptions,
            stagedCsiSectionOptions,
            stagedSelectedSectionIds
          )
        : new Set<string>(),
    [
      stagedCsiSubcontractor,
      effectiveStagedPickerDisplayVersion,
      stagedCsiDivisionOptions,
      stagedCsiSectionOptions,
      stagedSelectedSectionIds,
    ]
  );
  const stagedCrosswalkIssueCount = useMemo(
    () =>
      stagedCsiSubcontractor
        ? getCrosswalkIssueCount(
            stagedCsiSubcontractor,
            effectiveStagedPickerDisplayVersion
          )
        : 0,
    [stagedCsiSubcontractor, effectiveStagedPickerDisplayVersion]
  );

  useEffect(() => {
    if (!isDirty) return;

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isDirty]);

  function getNormalizedDraft() {
    const normalizedSectionIds = draft.csiCoverage.sectionIds;
    const normalizedDivisionIds = Array.from(
      new Set([
        draft.primaryDivisionId,
        ...draft.csiCoverage.divisionIds,
        ...normalizedSectionIds.map(getSectionDivisionId),
      ])
    ).filter(Boolean);
    const normalizedLocations = normalizeLocations(draft.locations ?? []);
    const validLocationIds = new Set(
      normalizedLocations.map((location) => location.id)
    );

    return {
      ...draft,
      dba: emptyToUndefined(draft.dba),
      website: emptyToUndefined(draft.website),
      mainPhone: emptyToUndefined(draft.mainPhone),
      mainPhoneExtension: emptyToUndefined(draft.mainPhoneExtension),
      notes: emptyToUndefined(draft.notes),
      locations:
        normalizedLocations.length > 0 ? normalizedLocations : undefined,
      contacts: normalizeContacts(draft.contacts, validLocationIds),
      csiCoverage: {
        sourceVersion:
          draft.csiCoverage.sourceVersion ?? "MASTERFORMAT_CURRENT",
        divisionIds: normalizedDivisionIds,
        sectionIds: normalizedSectionIds,
        specialtyScopeNotes: emptyToUndefined(
          draft.csiCoverage.specialtyScopeNotes
        ),
      },
      prequalification: {
        ...draft.prequalification,
        bondingCapacity: draft.prequalification.bondingCapacity,
        insuranceExpirationDate: emptyToUndefined(
          draft.prequalification.insuranceExpirationDate
        ),
        licenseExpirationDate: emptyToUndefined(
          draft.prequalification.licenseExpirationDate
        ),
        notes: emptyToUndefined(draft.prequalification.notes),
      },
    };
  }

  function submitSubcontractor(event: React.FormEvent) {
    event.preventDefault();
    onSubmit(getNormalizedDraft());
  }

  function addContact() {
    const nextContact = createEmptyContact(draft.id, draft.contacts.length + 1);

    setDraft({
      ...draft,
      contacts: [...draft.contacts, nextContact],
    });
    setExpandedContactIds((contactIds) => [...contactIds, nextContact.id]);
  }

  function addLocation() {
    const nextLocation = createEmptyLocation(
      draft.id,
      (draft.locations?.length ?? 0) + 1
    );
    const nextLocations = [
      ...(draft.locations ?? []),
      nextLocation,
    ];

    setDraft({
      ...draft,
      locations: nextLocations,
    });
    setExpandedLocationIds((locationIds) => [...locationIds, nextLocation.id]);
  }

  function updateLocation(
    locationId: string,
    updates: Partial<SubcontractorLocation>
  ) {
    setDraft({
      ...draft,
      locations: (draft.locations ?? []).map((location) =>
        location.id === locationId ? { ...location, ...updates } : location
      ),
    });
  }

  function removeLocation(locationId: string) {
    const nextLocations = (draft.locations ?? []).filter(
      (location) => location.id !== locationId
    );

    setDraft({
      ...draft,
      locations: nextLocations.length > 0 ? nextLocations : undefined,
      contacts: draft.contacts.map((contact) => clearContactLocation(contact, locationId)),
    });
  }

  function markPrimaryLocation(locationId: string) {
    setDraft({
      ...draft,
      locations: (draft.locations ?? []).map((location) => ({
        ...location,
        isPrimary: location.id === locationId,
      })),
    });
  }

  function removeContact(contactId: string) {
    const nextContacts = draft.contacts.filter((contact) => contact.id !== contactId);

    setDraft({
      ...draft,
      contacts: ensurePrimaryContact(nextContacts),
    });
  }

  function updateContact(
    contactId: string,
    updates: Partial<SubcontractorContact>
  ) {
    setDraft({
      ...draft,
      contacts: draft.contacts.map((contact) =>
        contact.id === contactId ? { ...contact, ...updates } : contact
      ),
    });
  }

  function markPrimaryContact(contactId: string) {
    setDraft({
      ...draft,
      contacts: draft.contacts.map((contact) => ({
        ...contact,
        isPrimary: contact.id === contactId,
      })),
    });
  }

  function openResponsibilitiesModal(contact: SubcontractorContact) {
    setStagedResponsibilitiesDraft({
      contactId: contact.id,
      inviteScopes: cloneInviteScopes(contact.inviteScopes ?? []),
    });
    setShowAllResponsibilityCsi(false);
  }

  function closeResponsibilitiesModal() {
    setStagedResponsibilitiesDraft(null);
    setShowAllResponsibilityCsi(false);
  }

  function applyResponsibilities() {
    if (!stagedResponsibilitiesDraft) return;

    const validLocationIds = new Set(
      (draft.locations ?? []).map((location) => location.id)
    );

    updateContact(stagedResponsibilitiesDraft.contactId, {
      inviteScopes: normalizeInviteScopes(
        stagedResponsibilitiesDraft.inviteScopes,
        validLocationIds
      ),
    });
    closeResponsibilitiesModal();
  }

  function addResponsibilityScope() {
    if (!stagedResponsibilitiesDraft) return;

    setStagedResponsibilitiesDraft({
      ...stagedResponsibilitiesDraft,
      inviteScopes: [
        ...stagedResponsibilitiesDraft.inviteScopes,
        createEmptyContactScope(),
      ],
    });
  }

  function removeResponsibilityScope(scopeIndex: number) {
    if (!stagedResponsibilitiesDraft) return;

    setStagedResponsibilitiesDraft({
      ...stagedResponsibilitiesDraft,
      inviteScopes: stagedResponsibilitiesDraft.inviteScopes.filter(
        (_scope, index) => index !== scopeIndex
      ),
    });
  }

  function updateResponsibilityScope(
    scopeIndex: number,
    updates: SubcontractorContactScope
  ) {
    if (!stagedResponsibilitiesDraft) return;

    setStagedResponsibilitiesDraft({
      ...stagedResponsibilitiesDraft,
      inviteScopes: stagedResponsibilitiesDraft.inviteScopes.map((scope, index) =>
        index === scopeIndex ? updates : scope
      ),
    });
  }

  function toggleResponsibilityScopeDivision(
    scopeIndex: number,
    divisionId: string,
    checked: boolean
  ) {
    const scope = stagedResponsibilitiesDraft?.inviteScopes[scopeIndex];
    if (!scope) return;

    const childSectionIds = responsibilitySectionOptions
      .filter((section) => section.divisionId === divisionId)
      .map((section) => section.id);
    const nextDivisionIds = checked
      ? uniqueStrings([...(scope.divisionIds ?? []), divisionId])
      : (scope.divisionIds ?? []).filter((id) => id !== divisionId);
    const nextSectionIds = checked
      ? scope.sectionIds
      : (scope.sectionIds ?? []).filter(
          (sectionId) => !childSectionIds.includes(sectionId)
        );

    updateResponsibilityScope(scopeIndex, {
      ...scope,
      divisionIds: nextDivisionIds,
      sectionIds: nextSectionIds,
    });
  }

  function toggleResponsibilityScopeSection(
    scopeIndex: number,
    sectionId: string,
    checked: boolean
  ) {
    const scope = stagedResponsibilitiesDraft?.inviteScopes[scopeIndex];
    if (!scope) return;

    const sectionDivisionId =
      getSectionDivisionIdFromOptions(sectionId, responsibilitySectionOptions) ??
      getSectionDivisionId(sectionId);
    const nextSectionIds = checked
      ? uniqueStrings([...(scope.sectionIds ?? []), sectionId])
      : (scope.sectionIds ?? []).filter((id) => id !== sectionId);
    const nextDivisionIds = checked
      ? uniqueStrings([...(scope.divisionIds ?? []), sectionDivisionId])
      : scope.divisionIds;

    updateResponsibilityScope(scopeIndex, {
      ...scope,
      divisionIds: nextDivisionIds,
      sectionIds: nextSectionIds,
    });
  }

  function openCsiCoverageModal() {
    setStagedCsiDraft({
      primaryDivisionId: draft.primaryDivisionId,
      csiCoverage: {
        ...draft.csiCoverage,
        divisionIds: [...draft.csiCoverage.divisionIds],
        sectionIds: [...draft.csiCoverage.sectionIds],
      },
    });
    setStagedPickerDisplayVersion(pickerDisplayVersion);
    setStagedExpandedCsiDivisionIds([...expandedCsiDivisionIds]);
    setIsCsiModalOpen(true);
  }

  function closeCsiCoverageModal() {
    setIsCsiModalOpen(false);
    setStagedCsiDraft(null);
    setStagedPickerDisplayVersion(null);
    setStagedExpandedCsiDivisionIds([]);
  }

  function applyCsiCoverage() {
    if (!stagedCsiDraft) return;

    setDraft({
      ...draft,
      primaryDivisionId: stagedCsiDraft.primaryDivisionId,
      csiCoverage: stagedCsiDraft.csiCoverage,
    });
    setPickerDisplayVersion(effectiveStagedPickerDisplayVersion);
    setExpandedCsiDivisionIds(stagedExpandedCsiDivisionIds);
    closeCsiCoverageModal();
  }

  function updateStagedCsiCoverage(updates: StagedCsiCoverageDraft) {
    setStagedCsiDraft(updates);
  }

  function toggleStagedDivision(divisionId: string, checked: boolean) {
    if (!stagedCsiDraft) return;

    if (
      !isStagedViewingEquivalentCoverage &&
      !checked &&
      divisionId === stagedCsiDraft.primaryDivisionId
    ) {
      return;
    }

    if (isStagedViewingEquivalentCoverage) {
      const childSectionIds = stagedCsiSectionOptions
        .filter((section) => section.divisionId === divisionId)
        .map((section) => section.id);
      const nextSectionIds = checked
        ? Array.from(stagedSelectedSectionIds)
        : Array.from(stagedSelectedSectionIds).filter(
            (sectionId) => !childSectionIds.includes(sectionId)
          );
      const nextDivisionIds = checked
        ? Array.from(new Set([...getDivisionIdsForSections(nextSectionIds), divisionId]))
        : getDivisionIdsForSections(nextSectionIds).filter(
            (id) => id !== divisionId
          );
      const nextPrimaryDivisionId = getBestPrimaryDivisionId(
        stagedCsiDraft.primaryDivisionId,
        nextDivisionIds,
        divisionId
      );

      updateStagedCsiCoverage({
        primaryDivisionId: nextPrimaryDivisionId,
        csiCoverage: {
          ...stagedCsiDraft.csiCoverage,
          sourceVersion: effectiveStagedPickerDisplayVersion,
          divisionIds: nextDivisionIds,
          sectionIds: nextSectionIds,
        },
      });

      if (checked) {
        setStagedExpandedCsiDivisionIds((divisionIds) =>
          divisionIds.includes(divisionId)
            ? divisionIds
            : [...divisionIds, divisionId]
        );
      }

      return;
    }

    const nextDivisionIds = checked
      ? Array.from(new Set([...stagedCsiDraft.csiCoverage.divisionIds, divisionId]))
      : stagedCsiDraft.csiCoverage.divisionIds.filter((id) => id !== divisionId);
    const nextSectionIds = checked
      ? stagedCsiDraft.csiCoverage.sectionIds
      : stagedCsiDraft.csiCoverage.sectionIds.filter(
          (sectionId) => getSectionDivisionId(sectionId) !== divisionId
        );

    updateStagedCsiCoverage({
      primaryDivisionId: stagedCsiDraft.primaryDivisionId,
      csiCoverage: {
        ...stagedCsiDraft.csiCoverage,
        divisionIds: nextDivisionIds,
        sectionIds: nextSectionIds,
      },
    });

    if (checked) {
      setStagedExpandedCsiDivisionIds((divisionIds) =>
        divisionIds.includes(divisionId) ? divisionIds : [...divisionIds, divisionId]
      );
    }
  }

  function toggleStagedSection(sectionId: string, checked: boolean) {
    if (!stagedCsiDraft) return;

    const divisionId =
      getSectionDivisionIdFromOptions(sectionId, stagedCsiSectionOptions) ??
      getSectionDivisionId(sectionId);

    if (isStagedViewingEquivalentCoverage) {
      const nextSectionIds = checked
        ? Array.from(new Set([...Array.from(stagedSelectedSectionIds), sectionId]))
        : Array.from(stagedSelectedSectionIds).filter((id) => id !== sectionId);
      const nextDivisionIds = checked
        ? Array.from(new Set([...getDivisionIdsForSections(nextSectionIds), divisionId]))
        : getDivisionIdsForSections(nextSectionIds);
      const nextPrimaryDivisionId = getBestPrimaryDivisionId(
        stagedCsiDraft.primaryDivisionId,
        nextDivisionIds,
        divisionId
      );

      updateStagedCsiCoverage({
        primaryDivisionId: nextPrimaryDivisionId,
        csiCoverage: {
          ...stagedCsiDraft.csiCoverage,
          sourceVersion: effectiveStagedPickerDisplayVersion,
          divisionIds: nextDivisionIds,
          sectionIds: nextSectionIds,
        },
      });

      if (checked) {
        setStagedExpandedCsiDivisionIds((divisionIds) =>
          divisionIds.includes(divisionId)
            ? divisionIds
            : [...divisionIds, divisionId]
        );
      }

      return;
    }

    const nextSectionIds = checked
      ? Array.from(new Set([...stagedCsiDraft.csiCoverage.sectionIds, sectionId]))
      : stagedCsiDraft.csiCoverage.sectionIds.filter((id) => id !== sectionId);
    const nextDivisionIds = checked
      ? Array.from(new Set([...stagedCsiDraft.csiCoverage.divisionIds, divisionId]))
      : stagedCsiDraft.csiCoverage.divisionIds;

    updateStagedCsiCoverage({
      primaryDivisionId: stagedCsiDraft.primaryDivisionId,
      csiCoverage: {
        ...stagedCsiDraft.csiCoverage,
        divisionIds: nextDivisionIds,
        sectionIds: nextSectionIds,
      },
    });

    if (checked) {
      setStagedExpandedCsiDivisionIds((divisionIds) =>
        divisionIds.includes(divisionId) ? divisionIds : [...divisionIds, divisionId]
      );
    }
  }

  function updateStagedPrimaryDivision(divisionId: string) {
    if (!stagedCsiDraft) return;

    if (isStagedViewingEquivalentCoverage) {
      const nextSectionIds = Array.from(stagedSelectedSectionIds);
      const nextDivisionIds = Array.from(
        new Set([...getDivisionIdsForSections(nextSectionIds), divisionId])
      );

      updateStagedCsiCoverage({
        primaryDivisionId: divisionId,
        csiCoverage: {
          ...stagedCsiDraft.csiCoverage,
          sourceVersion: effectiveStagedPickerDisplayVersion,
          divisionIds: nextDivisionIds,
          sectionIds: nextSectionIds,
        },
      });

      setStagedExpandedCsiDivisionIds((divisionIds) =>
        divisionIds.includes(divisionId) ? divisionIds : [...divisionIds, divisionId]
      );

      return;
    }

    updateStagedCsiCoverage({
      primaryDivisionId: divisionId,
      csiCoverage: {
        ...stagedCsiDraft.csiCoverage,
        divisionIds: Array.from(
          new Set([...stagedCsiDraft.csiCoverage.divisionIds, divisionId])
        ),
      },
    });
  }

  function cancelEdit() {
    if (!isDirty) {
      window.history.back();
      return;
    }

    setShowUnsavedModal(true);
  }

  function saveAndLeave() {
    onSubmit(getNormalizedDraft());
  }

  function discardAndLeave() {
    setShowUnsavedModal(false);
    window.history.back();
  }

  function updatePreferredVendor(isPreferred: boolean) {
    setDraft({
      ...draft,
      relationshipStatus: isPreferred
        ? "PREFERRED"
        : draft.relationshipStatus === "PREFERRED"
          ? "APPROVED"
          : draft.relationshipStatus,
    });
  }

  function updateDoNotUseVendor(isDoNotUse: boolean) {
    setDraft({
      ...draft,
      relationshipStatus: isDoNotUse
        ? "DO_NOT_USE"
        : draft.relationshipStatus === "DO_NOT_USE"
          ? "APPROVED"
          : draft.relationshipStatus,
    });
  }

  return (
    <form onSubmit={submitSubcontractor}>
      <div className="form-action-bar">
        <div>
          <strong>{draft.companyName || "Subcontractor"}</strong>
          {isDirty && <span className="badge badge-warning">Unsaved changes</span>}
        </div>
        <div className="form-action-buttons">
          <button type="submit" className="button-primary">
            {submitLabel}
          </button>
          <button
            type="button"
            className="button-secondary"
            onClick={cancelEdit}
          >
            Cancel
          </button>
        </div>
      </div>

      {showUnsavedModal && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowUnsavedModal(false);
            }
          }}
        >
          <div
            className="modal-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="unsaved-subcontractor-title"
          >
            <h2 id="unsaved-subcontractor-title">Unsaved changes</h2>
            <p>
              You have unsaved subcontractor changes. Save before leaving,
              discard the changes, or stay on this page.
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="button-secondary"
                onClick={discardAndLeave}
              >
                Discard Changes
              </button>
              <button
                type="button"
                className="button-primary"
                onClick={() => setShowUnsavedModal(false)}
              >
                Stay Here
              </button>
              <button
                type="button"
                className="button-secondary"
                onClick={saveAndLeave}
              >
                Save and Leave
              </button>
            </div>
          </div>
        </div>
      )}

      {isCsiModalOpen && stagedCsiDraft && (
        <div className="modal-backdrop" role="presentation">
          <div
            className="modal-panel modal-panel-wide"
            role="dialog"
            aria-modal="true"
            aria-labelledby="csi-coverage-modal-title"
          >
            <div className="modal-header">
              <div>
                <h2 id="csi-coverage-modal-title">Edit CSI Coverage</h2>
                <p className="muted-text">
                  Select the divisions and sections this subcontractor performs.
                </p>
              </div>
            </div>
            <div className="modal-body-scroll">
              <FormSelect
                label="CSI Coverage Version"
                value={effectiveStagedPickerDisplayVersion}
                options={csiSourceVersions}
                getOptionLabel={formatCsiSourceVersion}
                onChange={(value) =>
                  setStagedPickerDisplayVersion(
                    value as CsiMasterFormatVersion
                  )
                }
              />
              <p className="muted-text">
                Saved source version:{" "}
                {formatCsiSourceVersion(stagedSavedCsiSourceVersion)}.
              </p>
              {isStagedViewingEquivalentCoverage && (
                <p className="muted-text">
                  Equivalent CSI coverage is shown using the crosswalk.
                </p>
              )}
              {isStagedViewingEquivalentCoverage &&
                stagedCrosswalkIssueCount > 0 && (
                  <p className="badge badge-warning">
                    Some selected CSI coverage has incomplete or ambiguous
                    crosswalk mappings.
                  </p>
                )}
              <FormSelect
                label="Primary Division"
                value={stagedCsiDraft.primaryDivisionId}
                options={stagedCsiDivisionOptions.map((division) => division.id)}
                getOptionLabel={(divisionId) => getDivisionName(divisionId)}
                onChange={updateStagedPrimaryDivision}
              />
              <div className="form-field">
                <strong>Divisions and Sections</strong>
                <div className="csi-picker">
                  {stagedCsiDivisionOptions.map((division) => {
                    const sectionOptions = stagedCsiSectionOptions.filter(
                      (section) => section.divisionId === division.id
                    );
                    const selectedSectionCount = sectionOptions.filter((section) =>
                      stagedSelectedSectionIds.has(section.id)
                    ).length;
                    const isExpanded = stagedExpandedCsiDivisionIds.includes(
                      division.id
                    );

                    return (
                      <div key={division.id} className="csi-picker-division">
                        <div className="csi-picker-division-row">
                          <button
                            type="button"
                            className="crm-expand-button"
                            aria-expanded={isExpanded}
                            onClick={() =>
                              toggleExpanded(
                                division.id,
                                setStagedExpandedCsiDivisionIds
                              )
                            }
                          >
                            {isExpanded ? "-" : "+"}
                          </button>
                          <label className="csi-picker-label">
                            <input
                              type="checkbox"
                              checked={stagedSelectedDivisionIds.has(division.id)}
                              onChange={(event) =>
                                toggleStagedDivision(
                                  division.id,
                                  event.target.checked
                                )
                              }
                            />
                            <span>
                              {division.number} - {division.name}
                            </span>
                          </label>
                          <span className="muted-text">
                            {selectedSectionCount} selected
                          </span>
                        </div>

                        {isExpanded && (
                          <div className="csi-picker-sections">
                            {sectionOptions.length === 0 ? (
                              <p className="muted-text">No sections available.</p>
                            ) : (
                              sectionOptions.map((section) => (
                                <label
                                  key={section.id}
                                  className="csi-picker-section"
                                >
                                  <input
                                    type="checkbox"
                                    checked={stagedSelectedSectionIds.has(
                                      section.id
                                    )}
                                    onChange={(event) =>
                                      toggleStagedSection(
                                        section.id,
                                        event.target.checked
                                      )
                                    }
                                  />
                                  <span>
                                    {section.number} - {section.name}
                                  </span>
                                  {section.additionalTitleCount > 0 && (
                                    <span className="badge badge-muted">
                                      +{section.additionalTitleCount} more titles
                                    </span>
                                  )}
                                </label>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="button-primary"
                onClick={applyCsiCoverage}
              >
                Apply Coverage
              </button>
              <button
                type="button"
                className="button-secondary"
                onClick={closeCsiCoverageModal}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {stagedResponsibilitiesDraft && (
        <div className="modal-backdrop" role="presentation">
          <div
            className="modal-panel modal-panel-wide"
            role="dialog"
            aria-modal="true"
            aria-labelledby="contact-responsibilities-modal-title"
          >
            <div className="modal-header">
              <div>
                <h2 id="contact-responsibilities-modal-title">
                  Responsibilities for{" "}
                  {getContactName(draft.contacts, stagedResponsibilitiesDraft.contactId)}
                </h2>
                <p className="muted-text">
                  Responsibilities determine when this contact receives invites
                  for this company.
                </p>
                <p className="muted-text">
                  Responsibilities are edited in the subcontractor&apos;s saved
                  CSI source version. Crosswalk equivalents are used for display
                  and matching elsewhere.
                </p>
              </div>
            </div>

            <div className="modal-body-scroll">
              <label className="radio-option">
                <input
                  type="checkbox"
                  checked={showAllResponsibilityCsi}
                  onChange={(event) =>
                    setShowAllResponsibilityCsi(event.target.checked)
                  }
                />
                Show all CSI divisions and sections
              </label>
              {!showAllResponsibilityCsi && (
                <p className="muted-text">
                  Showing company-covered CSI options plus any already selected
                  exceptions.
                </p>
              )}

              {stagedResponsibilitiesDraft.inviteScopes.length === 0 ? (
                <div className="responsibility-empty-state">
                  <p className="muted-text">
                    No specific responsibilities. This contact is treated as a
                    general company-wide fallback.
                  </p>
                </div>
              ) : (
                <div className="responsibility-scope-list">
                  {stagedResponsibilitiesDraft.inviteScopes.map((scope, index) => (
                    <ResponsibilityScopeEditor
                      key={index}
                      scope={scope}
                      scopeIndex={index}
                      locations={draft.locations ?? []}
                      divisions={visibleResponsibilityDivisionOptions}
                      sections={visibleResponsibilitySectionOptions}
                      companyDivisionIds={draft.csiCoverage.divisionIds}
                      companySectionIds={draft.csiCoverage.sectionIds}
                      onChange={updateResponsibilityScope}
                      onRemove={removeResponsibilityScope}
                      onToggleDivision={toggleResponsibilityScopeDivision}
                      onToggleSection={toggleResponsibilityScopeSection}
                    />
                  ))}
                </div>
              )}

              <button
                type="button"
                className="button-secondary"
                onClick={addResponsibilityScope}
              >
                Add Responsibility Scope
              </button>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="button-primary"
                onClick={applyResponsibilities}
              >
                Apply Responsibilities
              </button>
              <button
                type="button"
                className="button-secondary"
                onClick={closeResponsibilitiesModal}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="form-section-stack">
        <Panel title="Company Information">
          <div className="form-subsection">
            <h3>Company</h3>
            <div className="form-compact-grid">
              <FormInput
                label="Company Name"
                value={draft.companyName}
                onChange={(value) => setDraft({ ...draft, companyName: value })}
                required
              />
              <FormInput
                label="DBA"
                value={draft.dba ?? ""}
                onChange={(value) => setDraft({ ...draft, dba: value })}
              />
              <FormInput
                label="Website"
                value={draft.website ?? ""}
                onChange={(value) => setDraft({ ...draft, website: value })}
              />
              <FormInput
                label="Main Phone"
                value={draft.mainPhone ?? ""}
                onChange={(value) => setDraft({ ...draft, mainPhone: value })}
              />
              <FormInput
                label="Main Phone Extension"
                value={draft.mainPhoneExtension ?? ""}
                onChange={(value) =>
                  setDraft({ ...draft, mainPhoneExtension: value })
                }
              />
              <CheckboxField
                label="Preferred Vendor"
                checked={draft.relationshipStatus === "PREFERRED"}
                onChange={updatePreferredVendor}
                disabled={draft.relationshipStatus === "DO_NOT_USE"}
              />
              <CheckboxField
                label="Do Not Use"
                checked={draft.relationshipStatus === "DO_NOT_USE"}
                onChange={updateDoNotUseVendor}
              />
            </div>
          </div>

          <div className="form-subsection">
            <h3>Address</h3>
            <div className="form-compact-grid">
              <FormInput
                label="Address Line 1"
                value={draft.address.line1}
                onChange={(value) =>
                  setDraft({
                    ...draft,
                    address: { ...draft.address, line1: value },
                  })
                }
              />
              <FormInput
                label="Address Line 2"
                value={draft.address.line2 ?? ""}
                onChange={(value) =>
                  setDraft({
                    ...draft,
                    address: { ...draft.address, line2: value },
                  })
                }
              />
              <FormInput
                label="City"
                value={draft.address.city}
                onChange={(value) =>
                  setDraft({
                    ...draft,
                    address: { ...draft.address, city: value },
                  })
                }
              />
              <FormInput
                label="State"
                value={draft.address.state}
                onChange={(value) =>
                  setDraft({
                    ...draft,
                    address: { ...draft.address, state: value },
                  })
                }
              />
              <FormInput
                label="ZIP"
                value={draft.address.zip}
                onChange={(value) =>
                  setDraft({
                    ...draft,
                    address: { ...draft.address, zip: value },
                  })
                }
              />
            </div>
          </div>

          <div className="form-subsection">
            <h3>Service Area</h3>
            <div className="form-compact-grid">
              <FormInput
                label="States"
                value={draft.serviceArea.states.join(", ")}
                onChange={(value) =>
                  setDraft({
                    ...draft,
                    serviceArea: {
                      ...draft.serviceArea,
                      states: splitList(value),
                    },
                  })
                }
              />
              <FormInput
                label="Counties"
                value={draft.serviceArea.counties.join(", ")}
                onChange={(value) =>
                  setDraft({
                    ...draft,
                    serviceArea: {
                      ...draft.serviceArea,
                      counties: splitList(value),
                    },
                  })
                }
              />
              <FormInput
                label="Cities / Markets"
                value={draft.serviceArea.citiesOrMarkets.join(", ")}
                onChange={(value) =>
                  setDraft({
                    ...draft,
                    serviceArea: {
                      ...draft.serviceArea,
                      citiesOrMarkets: splitList(value),
                    },
                  })
                }
              />
              <FormInput
                label="Travel Radius"
                type="number"
                value={formatOptionalNumber(draft.serviceArea.travelRadiusMiles)}
                onChange={(value) =>
                  setDraft({
                    ...draft,
                    serviceArea: {
                      ...draft.serviceArea,
                      travelRadiusMiles: toOptionalNumber(value),
                    },
                  })
                }
              />
              <div className="form-field">
                <label className="radio-option">
                  <input
                    type="checkbox"
                    checked={draft.serviceArea.willTravel}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        serviceArea: {
                          ...draft.serviceArea,
                          willTravel: event.target.checked,
                        },
                      })
                    }
                  />
                  Will Travel
                </label>
              </div>
            </div>
          </div>

          <div className="form-subsection">
            <h3>Notes</h3>
            <FormTextArea
              label="Notes"
              value={draft.notes ?? ""}
              onChange={(value) => setDraft({ ...draft, notes: value })}
            />
          </div>
        </Panel>

        <Panel title="Locations / Branches">
          {!draft.locations || draft.locations.length === 0 ? (
            <p className="muted-text">
              This subcontractor uses the company address unless branches are added.
            </p>
          ) : (
            draft.locations.map((location, index) => {
              const isExpanded = expandedLocationIds.includes(location.id);

              return (
                <div key={location.id} className="form-record">
                  <div className="form-record-header">
                    <button
                      type="button"
                      className="crm-expand-button"
                      aria-expanded={isExpanded}
                      onClick={() =>
                        toggleExpanded(location.id, setExpandedLocationIds)
                      }
                    >
                      {isExpanded ? "-" : "+"}
                    </button>
                    <div className="form-record-summary">
                      <strong>{location.name || `Location ${index + 1}`}</strong>
                      <span className="muted-text">
                        {formatStatus(location.type)}
                      </span>
                      {location.isPrimary === true && (
                        <span className="badge badge-primary">Primary</span>
                      )}
                    </div>
                    <button
                      type="button"
                      className="button-secondary"
                      onClick={() => removeLocation(location.id)}
                    >
                      Remove
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="form-record-body form-compact-grid">
                      <FormInput
                        label="Location Name"
                        value={location.name}
                        onChange={(value) =>
                          updateLocation(location.id, { name: value })
                        }
                      />
                      <FormSelect
                        label="Location Type"
                        value={location.type}
                        options={locationTypes}
                        onChange={(value) =>
                          updateLocation(location.id, {
                            type: value as SubcontractorLocationType,
                          })
                        }
                      />
                      <FormInput
                        label="Address Line 1"
                        value={location.address.line1}
                        onChange={(value) =>
                          updateLocation(location.id, {
                            address: { ...location.address, line1: value },
                          })
                        }
                      />
                      <FormInput
                        label="Address Line 2"
                        value={location.address.line2 ?? ""}
                        onChange={(value) =>
                          updateLocation(location.id, {
                            address: { ...location.address, line2: value },
                          })
                        }
                      />
                      <FormInput
                        label="City"
                        value={location.address.city}
                        onChange={(value) =>
                          updateLocation(location.id, {
                            address: { ...location.address, city: value },
                          })
                        }
                      />
                      <FormInput
                        label="State"
                        value={location.address.state}
                        onChange={(value) =>
                          updateLocation(location.id, {
                            address: { ...location.address, state: value },
                          })
                        }
                      />
                      <FormInput
                        label="ZIP"
                        value={location.address.zip}
                        onChange={(value) =>
                          updateLocation(location.id, {
                            address: { ...location.address, zip: value },
                          })
                        }
                      />
                      <FormInput
                        label="Main Phone"
                        value={location.mainPhone ?? ""}
                        onChange={(value) =>
                          updateLocation(location.id, { mainPhone: value })
                        }
                      />
                      <FormInput
                        label="Main Phone Extension"
                        value={location.mainPhoneExtension ?? ""}
                        onChange={(value) =>
                          updateLocation(location.id, {
                            mainPhoneExtension: value,
                          })
                        }
                      />
                      <FormInput
                        label="Email"
                        type="email"
                        value={location.email ?? ""}
                        onChange={(value) =>
                          updateLocation(location.id, { email: value })
                        }
                      />
                      <FormTextArea
                        label="Notes"
                        value={location.notes ?? ""}
                        onChange={(value) =>
                          updateLocation(location.id, { notes: value })
                        }
                      />
                      <div className="form-field">
                        <label className="radio-option">
                          <input
                            type="radio"
                            name={`${draft.id}-primary-location`}
                            checked={location.isPrimary === true}
                            onChange={() => markPrimaryLocation(location.id)}
                          />
                          Primary location
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}

          <button type="button" className="button-secondary" onClick={addLocation}>
            Add Location
          </button>
        </Panel>

        <Panel title="Contacts">
          {draft.contacts.map((contact, index) => {
            const isExpanded = expandedContactIds.includes(contact.id);

            return (
              <div key={contact.id} className="form-record">
                <div className="form-record-header">
                  <button
                    type="button"
                    className="crm-expand-button"
                    aria-expanded={isExpanded}
                    onClick={() =>
                      toggleExpanded(contact.id, setExpandedContactIds)
                    }
                  >
                    {isExpanded ? "-" : "+"}
                  </button>
                  <div className="form-record-summary">
                    <strong>{contact.name || `Contact ${index + 1}`}</strong>
                    <span className="muted-text">
                      {formatContactSummary(contact)}
                    </span>
                    {contact.locationId && (
                      <span className="muted-text">
                        {getLocationName(draft.locations ?? [], contact.locationId)}
                      </span>
                    )}
                    {contact.isPrimary === true && (
                      <span className="badge badge-primary">Primary</span>
                    )}
                    {contact.isDefaultInviteRecipient === true && (
                      <span className="badge badge-secondary">Default Invite</span>
                    )}
                    {contact.active === false && (
                      <span className="badge badge-warning">Inactive</span>
                    )}
                  </div>
                  <button
                    type="button"
                    className="button-secondary"
                    onClick={() => removeContact(contact.id)}
                    disabled={draft.contacts.length === 1}
                  >
                    Remove
                  </button>
                </div>

                {isExpanded && (
                  <div className="form-record-body form-compact-grid">
                    <FormSelect
                      label="Contact Type"
                      value={contact.role}
                      options={contactRoles}
                      onChange={(value) =>
                        updateContact(contact.id, { role: value as ContactRole })
                      }
                    />
                    <FormInput
                      label="Name"
                      value={contact.name}
                      onChange={(value) =>
                        updateContact(contact.id, { name: value })
                      }
                    />
                    <FormInput
                      label="Job Title"
                      value={contact.title ?? ""}
                      onChange={(value) =>
                        updateContact(contact.id, { title: value })
                      }
                    />
                    <FormInput
                      label="Email"
                      type="email"
                      value={contact.email ?? ""}
                      onChange={(value) =>
                        updateContact(contact.id, { email: value })
                      }
                    />
                    <FormInput
                      label="Office Phone"
                      value={contact.officePhone ?? ""}
                      onChange={(value) =>
                        updateContact(contact.id, { officePhone: value })
                      }
                    />
                    <FormInput
                      label="Ext."
                      value={contact.officePhoneExtension ?? ""}
                      onChange={(value) =>
                        updateContact(contact.id, {
                          officePhoneExtension: value,
                        })
                      }
                    />
                    <FormInput
                      label="Mobile Phone"
                      value={contact.mobilePhone ?? ""}
                      onChange={(value) =>
                        updateContact(contact.id, { mobilePhone: value })
                      }
                    />
                    <FormSelect
                      label="Primary Phone"
                      value={contact.primaryPhoneType ?? "OFFICE"}
                      options={phoneTypes}
                      onChange={(value) =>
                        updateContact(contact.id, {
                          primaryPhoneType: value as PhoneType,
                        })
                      }
                    />
                    <FormSelect
                      label="Location / Branch"
                      value={contact.locationId ?? ""}
                      options={[
                        "",
                        ...(draft.locations ?? []).map((location) => location.id),
                      ]}
                      getOptionLabel={(locationId) =>
                        locationId
                          ? getLocationName(draft.locations ?? [], locationId)
                          : "Company-wide / no specific branch"
                      }
                      onChange={(value) =>
                        updateContact(contact.id, {
                          locationId: value || undefined,
                        })
                      }
                    />
                    <div className="form-field">
                      <label className="radio-option">
                        <input
                          type="radio"
                          name={`${draft.id}-primary-contact`}
                          checked={contact.isPrimary === true}
                          onChange={() => markPrimaryContact(contact.id)}
                        />
                        Primary contact
                      </label>
                    </div>
                    <CheckboxField
                      label="Default invite recipient"
                      checked={contact.isDefaultInviteRecipient === true}
                      onChange={(checked) =>
                        updateContact(contact.id, {
                          isDefaultInviteRecipient: checked,
                        })
                      }
                    />
                    <CheckboxField
                      label="Active"
                      checked={contact.active !== false}
                      onChange={(checked) =>
                        updateContact(contact.id, { active: checked })
                      }
                    />
                    <div className="contact-responsibility-summary">
                      <strong>Responsibilities</strong>
                      {getContactScopeSummaries(contact).length === 0 ? (
                        <p className="muted-text">General company-wide fallback</p>
                      ) : (
                        <ul>
                          {getContactScopeSummaries(contact).map((summary, summaryIndex) => (
                            <li key={`${contact.id}-scope-summary-${summaryIndex}`}>
                              {summary}
                            </li>
                          ))}
                        </ul>
                      )}
                      <button
                        type="button"
                        className="button-secondary"
                        onClick={() => openResponsibilitiesModal(contact)}
                      >
                        Add / Edit Responsibilities
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          <button type="button" className="button-secondary" onClick={addContact}>
            Add Contact
          </button>
        </Panel>

        <Panel title="CSI Coverage">
          <FormTextArea
            label="Specialty Scope Notes"
            value={draft.csiCoverage.specialtyScopeNotes ?? ""}
            onChange={(value) =>
              setDraft({
                ...draft,
                csiCoverage: {
                  ...draft.csiCoverage,
                  specialtyScopeNotes: value,
                },
              })
            }
          />
          <div className="coverage-summary">
            {selectedDivisionIds.size === 0 && selectedSectionIds.size === 0 ? (
              <p className="muted-text">No CSI coverage selected.</p>
            ) : (
              <>
                <div className="coverage-summary-row">
                  <span>Primary Division</span>
                  <strong>{getDivisionName(draft.primaryDivisionId)}</strong>
                </div>
                <div className="coverage-summary-row">
                  <span>Selected Divisions</span>
                  <div className="coverage-badge-list">
                    {Array.from(selectedDivisionIds).map((divisionId) => (
                      <span key={divisionId} className="badge badge-muted">
                        {getDivisionName(divisionId)}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="coverage-summary-row">
                  <span>Selected Sections</span>
                  {selectedSectionIds.size === 0 ? (
                    <p className="muted-text">No sections selected.</p>
                  ) : (
                    <div className="coverage-section-groups">
                      {getSelectedSectionGroups(
                        csiDivisionOptions,
                        csiSectionOptions,
                        selectedSectionIds
                      ).map((group) => (
                        <div key={group.divisionId} className="coverage-section-group">
                          <strong>{group.divisionLabel}</strong>
                          <ul>
                            {group.sections.map((section) => (
                              <li key={section.id}>
                                {section.number} - {section.name}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
          {isViewingEquivalentCoverage && crosswalkIssueCount > 0 && (
            <p className="badge badge-warning">
              Some selected CSI coverage has incomplete or ambiguous crosswalk
              mappings.
            </p>
          )}
          <div className="settings-actions">
            <button
              type="button"
              className="button-secondary"
              onClick={openCsiCoverageModal}
            >
              Add / Edit CSI Coverage
            </button>
          </div>
        </Panel>

        <Panel title="Vendor Status & Compliance">
          <div className="form-subsection">
            <h3>Vendor Status</h3>
            <div className="form-compact-grid">
              <FormSelect
                label="Vendor Status"
                value={draft.prequalification.status}
                options={prequalificationStatuses}
                getOptionLabel={(value) =>
                  formatVendorStatus(value as PrequalificationStatus)
                }
                onChange={(value) =>
                  setDraft({
                    ...draft,
                    prequalification: {
                      ...draft.prequalification,
                      status: value as PrequalificationStatus,
                    },
                  })
                }
              />
              <FormInput
                label="Bonding Capacity"
                type="number"
                value={formatOptionalNumber(
                  draft.prequalification.bondingCapacity
                )}
                onChange={(value) =>
                  setDraft({
                    ...draft,
                    prequalification: {
                      ...draft.prequalification,
                      bondingCapacity: toOptionalNumber(value),
                    },
                  })
                }
              />
            </div>
          </div>

          <div className="form-subsection">
            <h3>Compliance Documents</h3>
            <div className="compliance-document-list">
              <div className="compliance-document-row">
                <strong>W-9</strong>
                <CheckboxField
                  label="On file"
                  checked={draft.prequalification.w9OnFile}
                  onChange={(checked) =>
                    setDraft({
                      ...draft,
                      prequalification: {
                        ...draft.prequalification,
                        w9OnFile: checked,
                      },
                    })
                  }
                />
                <span className="muted-text">No expiration</span>
                <span className="muted-text">Document link not added yet</span>
              </div>

              <div className="compliance-document-row">
                <strong>Insurance</strong>
                <CheckboxField
                  label="On file"
                  checked={draft.prequalification.insuranceOnFile}
                  onChange={(checked) =>
                    setDraft({
                      ...draft,
                      prequalification: {
                        ...draft.prequalification,
                        insuranceOnFile: checked,
                      },
                    })
                  }
                />
                <FormInput
                  label="Expiration"
                  type="date"
                  value={draft.prequalification.insuranceExpirationDate ?? ""}
                  onChange={(value) =>
                    setDraft({
                      ...draft,
                      prequalification: {
                        ...draft.prequalification,
                        insuranceExpirationDate: value,
                      },
                    })
                  }
                />
                <span className="muted-text">Document link not added yet</span>
              </div>

              <div className="compliance-document-row">
                <strong>License</strong>
                <CheckboxField
                  label="On file"
                  checked={draft.prequalification.licenseOnFile}
                  onChange={(checked) =>
                    setDraft({
                      ...draft,
                      prequalification: {
                        ...draft.prequalification,
                        licenseOnFile: checked,
                      },
                    })
                  }
                />
                <FormInput
                  label="Expiration"
                  type="date"
                  value={draft.prequalification.licenseExpirationDate ?? ""}
                  onChange={(value) =>
                    setDraft({
                      ...draft,
                      prequalification: {
                        ...draft.prequalification,
                        licenseExpirationDate: value,
                      },
                    })
                  }
                />
                <span className="muted-text">Document link not added yet</span>
              </div>
            </div>
          </div>

          <div className="form-subsection">
            <h3>Notes</h3>
            <FormTextArea
              label="Prequalification Notes"
              value={draft.prequalification.notes ?? ""}
              onChange={(value) =>
                setDraft({
                  ...draft,
                  prequalification: {
                    ...draft.prequalification,
                    notes: value,
                  },
                })
              }
            />
          </div>
        </Panel>

        <Panel title="VPI / Performance">
          <div className="form-compact-grid">
            <VpiInput
              label="Overall"
              value={draft.vpi.overall}
              onChange={(value) =>
                setDraft({ ...draft, vpi: { ...draft.vpi, overall: value } })
              }
            />
            <FormInput
              label="Projects Evaluated"
              type="number"
              value={String(draft.vpi.projectsEvaluated)}
              onChange={(value) =>
                setDraft({
                  ...draft,
                  vpi: {
                    ...draft.vpi,
                    projectsEvaluated: toRequiredNumber(value),
                  },
                })
              }
            />
            <VpiInput
              label="Responsiveness"
              value={draft.vpi.responsiveness}
              onChange={(value) =>
                setDraft({
                  ...draft,
                  vpi: { ...draft.vpi, responsiveness: value },
                })
              }
            />
            <VpiInput
              label="Bid Completeness"
              value={draft.vpi.bidCompleteness}
              onChange={(value) =>
                setDraft({
                  ...draft,
                  vpi: { ...draft.vpi, bidCompleteness: value },
                })
              }
            />
            <VpiInput
              label="Bid Accuracy"
              value={draft.vpi.bidAccuracy}
              onChange={(value) =>
                setDraft({ ...draft, vpi: { ...draft.vpi, bidAccuracy: value } })
              }
            />
            <VpiInput
              label="Schedule Performance"
              value={draft.vpi.schedulePerformance}
              onChange={(value) =>
                setDraft({
                  ...draft,
                  vpi: { ...draft.vpi, schedulePerformance: value },
                })
              }
            />
            <VpiInput
              label="Field Quality"
              value={draft.vpi.fieldQuality}
              onChange={(value) =>
                setDraft({ ...draft, vpi: { ...draft.vpi, fieldQuality: value } })
              }
            />
            <VpiInput
              label="Administrative Compliance"
              value={draft.vpi.administrativeCompliance}
              onChange={(value) =>
                setDraft({
                  ...draft,
                  vpi: { ...draft.vpi, administrativeCompliance: value },
                })
              }
            />
          </div>
        </Panel>
      </div>
    </form>
  );
}

function ResponsibilityScopeEditor({
  scope,
  scopeIndex,
  locations,
  divisions,
  sections,
  companyDivisionIds,
  companySectionIds,
  onChange,
  onRemove,
  onToggleDivision,
  onToggleSection,
}: {
  scope: SubcontractorContactScope;
  scopeIndex: number;
  locations: SubcontractorLocation[];
  divisions: CsiDivision[];
  sections: CsiPickerSectionOption[];
  companyDivisionIds: string[];
  companySectionIds: string[];
  onChange: (scopeIndex: number, scope: SubcontractorContactScope) => void;
  onRemove: (scopeIndex: number) => void;
  onToggleDivision: (
    scopeIndex: number,
    divisionId: string,
    checked: boolean
  ) => void;
  onToggleSection: (
    scopeIndex: number,
    sectionId: string,
    checked: boolean
  ) => void;
}) {
  return (
    <div className="responsibility-scope-card">
      <div className="responsibility-scope-header">
        <strong>Scope {scopeIndex + 1}</strong>
        <button
          type="button"
          className="button-secondary"
          onClick={() => onRemove(scopeIndex)}
        >
          Remove
        </button>
      </div>

      <div className="form-compact-grid">
        <FormSelect
          label="Role Context"
          value={scope.roleContext ?? ""}
          options={["", ...contactRoleContexts]}
          getOptionLabel={(value) =>
            value ? formatStatus(value) : "No specific context"
          }
          onChange={(value) =>
            onChange(scopeIndex, {
              ...scope,
              roleContext: value
                ? (value as SubcontractorContactRoleContext)
                : undefined,
            })
          }
        />
        <FormInput
          label="States"
          value={(scope.states ?? []).join(", ")}
          onChange={(value) =>
            onChange(scopeIndex, {
              ...scope,
              states: parseCommaSeparatedValues(value),
            })
          }
        />
        <FormInput
          label="Counties"
          value={(scope.counties ?? []).join(", ")}
          onChange={(value) =>
            onChange(scopeIndex, {
              ...scope,
              counties: parseCommaSeparatedValues(value),
            })
          }
        />
        <FormInput
          label="Cities / Markets"
          value={(scope.citiesOrMarkets ?? []).join(", ")}
          onChange={(value) =>
            onChange(scopeIndex, {
              ...scope,
              citiesOrMarkets: parseCommaSeparatedValues(value),
            })
          }
        />
      </div>

      <div className="responsibility-section">
        <strong>Locations / Branches</strong>
        {locations.length === 0 ? (
          <p className="muted-text">No branches added.</p>
        ) : (
          <div className="responsibility-checkbox-grid">
            {locations.map((location) => (
              <label key={location.id} className="radio-option">
                <input
                  type="checkbox"
                  checked={(scope.locationIds ?? []).includes(location.id)}
                  onChange={(event) =>
                    onChange(scopeIndex, {
                      ...scope,
                      locationIds: toggleArrayValue(
                        scope.locationIds ?? [],
                        location.id,
                        event.target.checked
                      ),
                    })
                  }
                />
                {location.name || "Unnamed location"}
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="responsibility-section">
        <strong>CSI Divisions and Sections</strong>
        <div className="csi-picker">
          {divisions.map((division) => {
            const divisionSections = sections.filter(
              (section) => section.divisionId === division.id
            );
            const isOutsideCoverage = !companyDivisionIds.includes(division.id);

            return (
              <div key={division.id} className="csi-picker-division">
                <div className="csi-picker-division-row">
                  <span className="crm-expand-button" aria-hidden="true">
                    -
                  </span>
                  <label className="csi-picker-label">
                    <input
                      type="checkbox"
                      checked={(scope.divisionIds ?? []).includes(division.id)}
                      onChange={(event) =>
                        onToggleDivision(
                          scopeIndex,
                          division.id,
                          event.target.checked
                        )
                      }
                    />
                    <span>
                      {division.number} - {division.name}
                    </span>
                  </label>
                  {isOutsideCoverage && (
                    <span className="badge badge-warning">
                      Outside company coverage
                    </span>
                  )}
                </div>

                {divisionSections.length > 0 && (
                  <div className="csi-picker-sections">
                    {divisionSections.map((section) => {
                      const sectionOutsideCoverage =
                        !companySectionIds.includes(section.id);

                      return (
                        <label
                          key={section.id}
                          className="csi-picker-section"
                        >
                          <input
                            type="checkbox"
                            checked={(scope.sectionIds ?? []).includes(section.id)}
                            onChange={(event) =>
                              onToggleSection(
                                scopeIndex,
                                section.id,
                                event.target.checked
                              )
                            }
                          />
                          <span>
                            {section.number} - {section.name}
                          </span>
                          {sectionOutsideCoverage && (
                            <span className="badge badge-warning">
                              Outside company coverage
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <FormTextArea
        label="Notes"
        value={scope.notes ?? ""}
        onChange={(value) =>
          onChange(scopeIndex, {
            ...scope,
            notes: value,
          })
        }
      />
    </div>
  );
}

function FormInput({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="form-field">
      <label>
        {label}
        <br />
        <input
          type={type}
          value={value}
          required={required}
          onChange={(event) => onChange(event.target.value)}
          className="form-input"
        />
      </label>
    </div>
  );
}

function FormTextArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="form-field">
      <label>
        {label}
        <br />
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="form-input"
          rows={4}
        />
      </label>
    </div>
  );
}

function FormSelect({
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

function CheckboxField({
  label,
  checked,
  onChange,
  disabled = false,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="form-field">
      <label className="radio-option">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
        />
        {label}
      </label>
    </div>
  );
}

function VpiInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
}) {
  return (
    <FormInput
      label={label}
      type="number"
      value={formatOptionalNumber(value)}
      onChange={(inputValue) => onChange(toOptionalNumber(inputValue))}
    />
  );
}

function createEmptyPrimaryContact(subcontractorId: string): SubcontractorContact {
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

function createEmptyContact(
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

function createEmptyLocation(
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

function createEmptyContactScope(): SubcontractorContactScope {
  return {};
}

function ensurePrimaryContact(contacts: SubcontractorContact[]) {
  if (contacts.length === 0) return contacts;
  if (contacts.some((contact) => contact.isPrimary)) return contacts;

  return contacts.map((contact, index) => ({
    ...contact,
    isPrimary: index === 0,
  }));
}

function normalizeLocations(locations: SubcontractorLocation[]) {
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

function normalizeContacts(
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

function normalizeContactScopes(
  contact: SubcontractorContact,
  validLocationIds: Set<string>
) {
  return normalizeInviteScopes(contact.inviteScopes ?? [], validLocationIds);
}

function normalizeInviteScopes(
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

function removeEmptyScopeArrays(scope: SubcontractorContactScope) {
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

function isMeaningfulContactScope(scope: SubcontractorContactScope) {
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

function getSubcontractorSnapshot(subcontractor: Subcontractor) {
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
        subcontractor.csiCoverage.sourceVersion ?? "MASTERFORMAT_CURRENT",
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

function clearContactLocation(
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

function getLocationName(locations: SubcontractorLocation[], locationId: string) {
  return locations.find((location) => location.id === locationId)?.name || locationId;
}

function getContactName(contacts: SubcontractorContact[], contactId: string) {
  return (
    contacts.find((contact) => contact.id === contactId)?.name ||
    "Selected Contact"
  );
}

function formatContactSummary(contact: SubcontractorContact) {
  const contactType = formatStatus(contact.role);
  const jobTitle = contact.title?.trim();

  return jobTitle || contactType;
}

function getContactScopeSummaries(contact: SubcontractorContact) {
  return (contact.inviteScopes ?? [])
    .map(formatContactScopeSummary)
    .filter(Boolean);
}

function formatContactScopeSummary(scope: SubcontractorContactScope) {
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

function formatScopeCsiSummary(scope: SubcontractorContactScope) {
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

function getVisibleResponsibilityDivisions(
  allDivisions: CsiDivision[],
  allSections: CsiPickerSectionOption[],
  subcontractor: Subcontractor,
  scopes: SubcontractorContactScope[],
  showAll: boolean
) {
  if (showAll) return allDivisions;

  const selectedDivisionIds = new Set([
    ...subcontractor.csiCoverage.divisionIds,
    ...subcontractor.csiCoverage.sectionIds.map(getSectionDivisionId),
    ...scopes.flatMap((scope) => scope.divisionIds ?? []),
    ...scopes
      .flatMap((scope) => scope.sectionIds ?? [])
      .map((sectionId) =>
        getSectionDivisionIdFromOptions(sectionId, allSections) ??
        getSectionDivisionId(sectionId)
      ),
  ]);

  return allDivisions.filter((division) => selectedDivisionIds.has(division.id));
}

function getVisibleResponsibilitySections(
  allSections: CsiPickerSectionOption[],
  subcontractor: Subcontractor,
  scopes: SubcontractorContactScope[],
  showAll: boolean
) {
  if (showAll) return allSections;

  const selectedSectionIds = new Set([
    ...subcontractor.csiCoverage.sectionIds,
    ...scopes.flatMap((scope) => scope.sectionIds ?? []),
  ]);

  return allSections.filter((section) => selectedSectionIds.has(section.id));
}

function getSelectedSectionGroups(
  divisions: CsiDivision[],
  sections: CsiPickerSectionOption[],
  selectedSectionIds: Set<string>
) {
  return divisions
    .map((division) => ({
      divisionId: division.id,
      divisionLabel: `${division.number} - ${division.name}`,
      sections: sections.filter(
        (section) =>
          section.divisionId === division.id && selectedSectionIds.has(section.id)
      ),
    }))
    .filter((group) => group.sections.length > 0);
}

function getDivisionName(divisionId: string) {
  const division = mockCsiDivisions.find((item) => item.id === divisionId);

  return division ? `${division.number} - ${division.name}` : divisionId;
}

function getSectionLabel(sectionId: string) {
  const section = getAllCsiSectionOptions().find((item) => item.id === sectionId);

  return section ? `${section.number} - ${section.name}` : sectionId;
}

function getSectionDivisionId(sectionId: string) {
  const section = getAllCsiSectionOptions().find((item) => item.id === sectionId);

  return section?.divisionId ?? "";
}

function getSectionDivisionIdFromOptions(
  sectionId: string,
  sectionOptions: CsiPickerSectionOption[]
) {
  return sectionOptions.find((section) => section.id === sectionId)?.divisionId;
}

function getDisplayedSectionIds(
  subcontractor: Subcontractor,
  pickerDisplayVersion: CsiMasterFormatVersion,
  visibleSections: CsiPickerSectionOption[]
) {
  const sourceVersion =
    subcontractor.csiCoverage.sourceVersion ?? "MASTERFORMAT_CURRENT";

  if (sourceVersion === pickerDisplayVersion) {
    return new Set(subcontractor.csiCoverage.sectionIds);
  }

  const equivalentSectionNumbers = new Set(
    getSubcontractorCoverageForVersion(
      subcontractor,
      pickerDisplayVersion
    ).sectionNumbers.map(normalizeSectionNumber)
  );

  return new Set(
    visibleSections
      .filter((section) =>
        equivalentSectionNumbers.has(normalizeSectionNumber(section.number))
      )
      .map((section) => section.id)
  );
}

function getDisplayedDivisionIds(
  subcontractor: Subcontractor,
  pickerDisplayVersion: CsiMasterFormatVersion,
  visibleDivisions: CsiDivision[],
  visibleSections: CsiPickerSectionOption[],
  selectedSectionIds: Set<string>
) {
  const sourceVersion =
    subcontractor.csiCoverage.sourceVersion ?? "MASTERFORMAT_CURRENT";

  if (sourceVersion === pickerDisplayVersion) {
    return new Set(subcontractor.csiCoverage.divisionIds);
  }

  const selectedDivisionIds = new Set(
    visibleSections
      .filter((section) => selectedSectionIds.has(section.id))
      .map((section) => section.divisionId)
  );
  const equivalentDivisionNumbers = new Set(
    getSubcontractorCoverageForVersion(
      subcontractor,
      pickerDisplayVersion
    ).divisionNumbers.map(normalizeSectionNumber)
  );

  visibleDivisions.forEach((division) => {
    if (equivalentDivisionNumbers.has(normalizeSectionNumber(division.number))) {
      selectedDivisionIds.add(division.id);
    }
  });

  return selectedDivisionIds;
}

function getDivisionIdsForSections(sectionIds: string[]) {
  return Array.from(
    new Set(sectionIds.map(getSectionDivisionId).filter(Boolean))
  );
}

function cloneInviteScopes(scopes: SubcontractorContactScope[]) {
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

function toggleArrayValue(values: string[], value: string, checked: boolean) {
  return checked
    ? uniqueStrings([...values, value])
    : values.filter((item) => item !== value);
}

function parseCommaSeparatedValues(value: string) {
  return normalizeStringArray(value.split(","));
}

function normalizeStringArray(values: string[] | undefined) {
  return uniqueStrings(values ?? []);
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function getBestPrimaryDivisionId(
  currentPrimaryDivisionId: string,
  selectedDivisionIds: string[],
  fallbackDivisionId: string
) {
  if (selectedDivisionIds.includes(currentPrimaryDivisionId)) {
    return currentPrimaryDivisionId;
  }

  if (selectedDivisionIds.includes(fallbackDivisionId)) {
    return fallbackDivisionId;
  }

  return selectedDivisionIds[0] ?? fallbackDivisionId ?? currentPrimaryDivisionId;
}

function getCrosswalkIssueCount(
  subcontractor: Subcontractor,
  pickerDisplayVersion: CsiMasterFormatVersion
) {
  const sourceVersion =
    subcontractor.csiCoverage.sourceVersion ?? "MASTERFORMAT_CURRENT";

  if (sourceVersion === pickerDisplayVersion) return 0;

  return getSectionNumbersForSubcontractor(subcontractor).filter((sectionNumber) => {
    const entries =
      sourceVersion === "MASTERFORMAT_1995"
        ? getCrosswalkEntriesFor1995(sectionNumber)
        : getCrosswalkEntriesForCurrent(sectionNumber);

    if (entries.length === 0) return true;

    return entries.some((entry) => {
      const missingTarget =
        sourceVersion === "MASTERFORMAT_1995"
          ? !entry.targetSection.sectionNumber
          : !entry.sourceSection.sectionNumber;

      return (
        missingTarget ||
        entry.relationship === "MANY_TO_MANY" ||
        entry.relationship === "INCOMPLETE" ||
        entry.mappingConfidence === "SPECIAL_CASE" ||
        entry.mappingConfidence === "INCOMPLETE"
      );
    });
  }).length;
}

function getCsiDivisionOptions(version: CsiMasterFormatVersion): CsiDivision[] {
  return mockCsiDivisions.filter((division) => division.version === version);
}

function getCsiSectionOptions(
  version: CsiMasterFormatVersion
): CsiPickerSectionOption[] {
  if (version === "MASTERFORMAT_CURRENT") {
    return mockCsiSections.map((section) => ({
      id: section.id,
      divisionId: section.divisionId,
      number: section.number,
      name: section.name,
      additionalTitleCount: 0,
    }));
  }

  return get1995SectionOptions();
}

function get1995SectionOptions(): CsiPickerSectionOption[] {
  const sectionsByNumber = new Map<string, Set<string>>();

  csiCrosswalkEntries.forEach((entry) => {
    const sectionNumber = entry.sourceSection.sectionNumber;
    const title = entry.sourceSection.title;

    if (!sectionNumber) return;

    const titles = sectionsByNumber.get(sectionNumber) ?? new Set<string>();

    if (title) titles.add(title);
    sectionsByNumber.set(sectionNumber, titles);
  });

  return Array.from(sectionsByNumber.entries())
    .map(([sectionNumber, titleSet]) => {
      const titles = Array.from(titleSet);
      const divisionNumber = sectionNumber.slice(0, 2);

      return {
        id: sectionNumber,
        divisionId: `1995-${divisionNumber}`,
        number: sectionNumber,
        name: titles[0] ?? "Untitled Section",
        additionalTitleCount: Math.max(titles.length - 1, 0),
      };
    })
    .sort((a, b) => a.number.localeCompare(b.number));
}

function getAllCsiSectionOptions(): CsiPickerSectionOption[] {
  return [
    ...getCsiSectionOptions("MASTERFORMAT_CURRENT"),
    ...getCsiSectionOptions("MASTERFORMAT_1995"),
  ];
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

function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function emptyToUndefined(value: string | undefined) {
  return value?.trim() ? value.trim() : undefined;
}

function formatOptionalNumber(value: number | undefined) {
  return value === undefined ? "" : String(value);
}

function toOptionalNumber(value: string) {
  if (value.trim() === "") return undefined;

  const numberValue = Number(value);

  return Number.isNaN(numberValue) ? undefined : numberValue;
}

function toRequiredNumber(value: string) {
  const numberValue = Number(value);

  return Number.isNaN(numberValue) ? 0 : numberValue;
}

function normalizeSectionNumber(value: string) {
  return value.replace(/\u00a0/g, " ").trim();
}

function formatStatus(value: string) {
  return value
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

function formatCsiSourceVersion(value: string) {
  if (value === "MASTERFORMAT_CURRENT") return "Current MasterFormat";
  if (value === "MASTERFORMAT_1995") return "MasterFormat 1995";

  return formatStatus(value);
}
