"use client";

import { useEffect, useMemo, useState } from "react";
import { CsiCodeLabel, CsiLevelBadge } from "@/components/csi";
import {
  createEmptyContact,
  createEmptyContactScope,
  createEmptyLocation,
  createEmptyPrimaryContact,
} from "@/components/subcontractors/form/subcontractorFormFactories";
import {
  clearContactLocation,
  cloneInviteScopes,
  emptyToUndefined,
  ensurePrimaryContact,
  formatCsiSourceVersion,
  formatStatus,
  getSubcontractorSnapshot,
  normalizeContacts,
  normalizeInviteScopes,
  normalizeLocations,
  parseCommaSeparatedValues,
  toggleArrayValue,
  uniqueStrings,
} from "@/components/subcontractors/form/subcontractorFormNormalization";
import {
  csiDivisionIdsContain,
  csiSectionIdsContain,
  getBestPrimaryDivisionId,
  getCrosswalkIssueCount,
  getCsiCoverageTree,
  getCsiDivisionOptions,
  getCsiSectionOptions,
  getDisplayedDivisionIds,
  getDisplayedSectionIds,
  getDivisionIdsForSections,
  getDivisionName,
  getVisibleResponsibilityCsiTree,
  getSectionDivisionId,
  getSectionDivisionIdFromOptions,
  getSelectedSectionGroups,
  filterOutCsiDivisionIds,
  filterOutCsiSectionIds,
  isRealCsiDivisionId,
} from "@/components/subcontractors/form/subcontractorFormCsiHelpers";
import {
  getContactName,
} from "@/components/subcontractors/form/subcontractorFormContactHelpers";
import {
  FormInput,
  FormSelect,
  FormTextArea,
} from "@/components/subcontractors/form/FormFields";
import CompanyInformationSection from "@/components/subcontractors/form/CompanyInformationSection";
import ContactsSection from "@/components/subcontractors/form/ContactsSection";
import LocationsSection from "@/components/subcontractors/form/LocationsSection";
import VendorStatusComplianceSection from "@/components/subcontractors/form/VendorStatusComplianceSection";
import VpiPerformanceSection from "@/components/subcontractors/form/VpiPerformanceSection";
import {
  CsiCatalogTreeNode,
  CsiMasterFormatVersion,
} from "@/types/Csi";
import {
  Subcontractor,
  SubcontractorContact,
  SubcontractorContactRoleContext,
  SubcontractorContactScope,
  SubcontractorLocation,
} from "@/types/Subcontractor";
import Panel from "@/components/ui/Panel";

type SubcontractorFormProps = {
  initialSubcontractor: Subcontractor;
  submitLabel: string;
  onSubmit: (subcontractor: Subcontractor) => void;
};

type StagedCsiCoverageDraft = {
  primaryDivisionId: string;
  csiCoverage: Subcontractor["csiCoverage"];
};

type StagedResponsibilitiesDraft = {
  contactId: string;
  inviteScopes: SubcontractorContactScope[];
};

const csiSourceVersions: CsiMasterFormatVersion[] = [
  "MASTERFORMAT_2004_PLUS",
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
    draft.csiCoverage.sourceVersion ?? "MASTERFORMAT_2004_PLUS";
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
  const realSelectedDivisionIds = useMemo(
    () => new Set(Array.from(selectedDivisionIds).filter(isRealCsiDivisionId)),
    [selectedDivisionIds]
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
  const [stagedExpandedCsiItemIds, setStagedExpandedCsiItemIds] = useState<
    string[]
  >([]);
  const [stagedResponsibilitiesDraft, setStagedResponsibilitiesDraft] =
    useState<StagedResponsibilitiesDraft | null>(null);
  const [
    expandedResponsibilityCsiItemIds,
    setExpandedResponsibilityCsiItemIds,
  ] = useState<string[]>([]);
  const [showAllResponsibilityCsi, setShowAllResponsibilityCsi] =
    useState(false);
  const responsibilityCsiVersion =
    draft.csiCoverage.sourceVersion ?? "MASTERFORMAT_2004_PLUS";
  const responsibilitySectionOptions = useMemo(
    () => getCsiSectionOptions(responsibilityCsiVersion),
    [responsibilityCsiVersion]
  );
  const visibleResponsibilityCsiTree = useMemo(
    () =>
      getVisibleResponsibilityCsiTree(
        responsibilityCsiVersion,
        draft,
        stagedResponsibilitiesDraft?.inviteScopes ?? [],
        showAllResponsibilityCsi
      ),
    [
      draft,
      responsibilityCsiVersion,
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
    stagedCsiDraft?.csiCoverage.sourceVersion ?? "MASTERFORMAT_2004_PLUS";
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
  const stagedCsiTree = useMemo(
    () => getCsiCoverageTree(effectiveStagedPickerDisplayVersion),
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
    ).filter(isRealCsiDivisionId);
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
          draft.csiCoverage.sourceVersion ?? "MASTERFORMAT_2004_PLUS",
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

  function markDefaultInviteRecipient(contactId: string, checked: boolean) {
    updateContact(contactId, {
      isDefaultInviteRecipient: checked,
    });
  }

  function openResponsibilitiesModal(contact: SubcontractorContact) {
    setStagedResponsibilitiesDraft({
      contactId: contact.id,
      inviteScopes:
        contact.inviteScopes && contact.inviteScopes.length > 0
          ? cloneInviteScopes(contact.inviteScopes)
          : [createEmptyContactScope()],
    });
    setExpandedResponsibilityCsiItemIds([]);
    setShowAllResponsibilityCsi(false);
  }

  function closeResponsibilitiesModal() {
    setStagedResponsibilitiesDraft(null);
    setExpandedResponsibilityCsiItemIds([]);
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
      : filterOutCsiDivisionIds(
          responsibilityCsiVersion,
          scope.divisionIds,
          [divisionId]
        );
    const nextSectionIds = checked
      ? scope.sectionIds
      : filterOutCsiSectionIds(
          responsibilityCsiVersion,
          scope.sectionIds,
          childSectionIds
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
      : filterOutCsiSectionIds(
          responsibilityCsiVersion,
          scope.sectionIds,
          [sectionId]
        );
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
    setStagedExpandedCsiItemIds([]);
    setIsCsiModalOpen(true);
  }

  function closeCsiCoverageModal() {
    setIsCsiModalOpen(false);
    setStagedCsiDraft(null);
    setStagedPickerDisplayVersion(null);
    setStagedExpandedCsiDivisionIds([]);
    setStagedExpandedCsiItemIds([]);
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
                  Select the CSI scopes this subcontractor performs.
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
              <div className="form-field">
                <strong>CSI Scopes</strong>
                <div className="csi-picker">
                  {stagedCsiTree.map((divisionNode) => (
                    <CompanyCsiCoverageDivisionNode
                      key={divisionNode.item.id}
                      node={divisionNode}
                      csiVersion={effectiveStagedPickerDisplayVersion}
                      selectedDivisionIds={stagedSelectedDivisionIds}
                      selectedSectionIds={stagedSelectedSectionIds}
                      expandedDivisionIds={stagedExpandedCsiDivisionIds}
                      expandedItemIds={stagedExpandedCsiItemIds}
                      onToggleExpanded={setStagedExpandedCsiDivisionIds}
                      onToggleExpandedItem={setStagedExpandedCsiItemIds}
                      onToggleDivision={toggleStagedDivision}
                      onToggleSection={toggleStagedSection}
                    />
                  ))}
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
                  Responsibilities are edited in this subcontractor&apos;s saved
                  CSI source version:{" "}
                  {formatCsiSourceVersion(responsibilityCsiVersion)}.
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
                Show all source-version CSI scopes
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
                      csiTree={visibleResponsibilityCsiTree}
                      csiVersion={responsibilityCsiVersion}
                      companyDivisionIds={draft.csiCoverage.divisionIds}
                      companySectionIds={draft.csiCoverage.sectionIds}
                      expandedCsiItemIds={expandedResponsibilityCsiItemIds}
                      onToggleExpandedCsiItem={
                        setExpandedResponsibilityCsiItemIds
                      }
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
        <CompanyInformationSection
          draft={draft}
          setDraft={setDraft}
          onPreferredChange={updatePreferredVendor}
          onDoNotUseChange={updateDoNotUseVendor}
        />

        <LocationsSection
          subcontractorId={draft.id}
          locations={draft.locations}
          expandedLocationIds={expandedLocationIds}
          setExpandedLocationIds={setExpandedLocationIds}
          onAddLocation={addLocation}
          onUpdateLocation={updateLocation}
          onRemoveLocation={removeLocation}
          onMarkPrimaryLocation={markPrimaryLocation}
          onToggleLocation={toggleExpanded}
        />

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
            {realSelectedDivisionIds.size === 0 && selectedSectionIds.size === 0 ? (
              <p className="muted-text">No CSI coverage selected.</p>
            ) : (
              <>
                {getPrimaryCoverageDivisionName(realSelectedDivisionIds) && (
                  <div className="coverage-summary-row">
                    <span>Primary Division</span>
                    <strong>
                      {getPrimaryCoverageDivisionName(realSelectedDivisionIds)}
                    </strong>
                  </div>
                )}
                <div className="coverage-summary-row">
                  <span>Selected Divisions</span>
                  <div className="coverage-badge-list">
                    {Array.from(realSelectedDivisionIds).map((divisionId) => (
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

        <ContactsSection
          subcontractorId={draft.id}
          contacts={draft.contacts}
          locations={draft.locations}
          expandedContactIds={expandedContactIds}
          setExpandedContactIds={setExpandedContactIds}
          onAddContact={addContact}
          onUpdateContact={updateContact}
          onRemoveContact={removeContact}
          onMarkPrimaryContact={markPrimaryContact}
          onMarkDefaultInviteRecipient={markDefaultInviteRecipient}
          onOpenResponsibilities={openResponsibilitiesModal}
          onToggleContact={toggleExpanded}
        />

        <VendorStatusComplianceSection draft={draft} setDraft={setDraft} />

        <VpiPerformanceSection draft={draft} setDraft={setDraft} />
      </div>
    </form>
  );
}

function CompanyCsiCoverageDivisionNode({
  node,
  csiVersion,
  selectedDivisionIds,
  selectedSectionIds,
  expandedDivisionIds,
  expandedItemIds,
  onToggleExpanded,
  onToggleExpandedItem,
  onToggleDivision,
  onToggleSection,
}: {
  node: CsiCatalogTreeNode;
  csiVersion: CsiMasterFormatVersion;
  selectedDivisionIds: Set<string>;
  selectedSectionIds: Set<string>;
  expandedDivisionIds: string[];
  expandedItemIds: string[];
  onToggleExpanded: React.Dispatch<React.SetStateAction<string[]>>;
  onToggleExpandedItem: React.Dispatch<React.SetStateAction<string[]>>;
  onToggleDivision: (divisionId: string, checked: boolean) => void;
  onToggleSection: (sectionId: string, checked: boolean) => void;
}) {
  const divisionId = node.item.divisionId;
  const isExpanded = expandedDivisionIds.includes(divisionId);
  const selectedSectionCount = countSelectedCsiTreeItems(
    node.children,
    csiVersion,
    selectedSectionIds
  );

  return (
    <div className="csi-picker-division">
      <div className="csi-picker-division-row">
        <button
          type="button"
          className="csi-tree-toggle"
          aria-label={`${isExpanded ? "Collapse" : "Expand"} ${node.item.number}`}
          aria-expanded={isExpanded}
          onClick={() => toggleExpanded(divisionId, onToggleExpanded)}
        >
          <span
            className={`csi-tree-caret${isExpanded ? " csi-tree-caret-expanded" : ""}`}
            aria-hidden="true"
          />
        </button>
        <label className={`csi-picker-label csi-tree-level-${node.item.level}`}>
          <input
            type="checkbox"
            checked={csiDivisionIdsContain(
              csiVersion,
              Array.from(selectedDivisionIds),
              divisionId
            )}
            onChange={(event) =>
              onToggleDivision(divisionId, event.target.checked)
            }
          />
          <span>
            <CsiCodeLabel item={node.item} />
          </span>
          <CsiLevelBadge item={node.item} />
        </label>
        <span className="muted-text">{selectedSectionCount} selected</span>
      </div>

      {isExpanded && (
        <div className="csi-picker-sections">
          {node.children.length === 0 ? (
            <p className="muted-text">No CSI scopes available.</p>
          ) : (
            node.children.map((childNode) => (
              <CompanyCsiCoverageTreeNode
                key={childNode.item.id}
                node={childNode}
                csiVersion={csiVersion}
                selectedSectionIds={selectedSectionIds}
                expandedItemIds={expandedItemIds}
                onToggleExpandedItem={onToggleExpandedItem}
                depth={0}
                onToggleSection={onToggleSection}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function CompanyCsiCoverageTreeNode({
  node,
  csiVersion,
  selectedSectionIds,
  expandedItemIds,
  onToggleExpandedItem,
  depth,
  onToggleSection,
}: {
  node: CsiCatalogTreeNode;
  csiVersion: CsiMasterFormatVersion;
  selectedSectionIds: Set<string>;
  expandedItemIds: string[];
  onToggleExpandedItem: React.Dispatch<React.SetStateAction<string[]>>;
  depth: number;
  onToggleSection: (sectionId: string, checked: boolean) => void;
}) {
  const hasChildren = node.children.length > 0;
  const isExpanded = expandedItemIds.includes(node.item.id);

  return (
    <div className="csi-picker-tree-node">
      <div
        className="csi-picker-tree-row"
        style={{ "--tree-depth": depth } as React.CSSProperties}
      >
        <button
          type="button"
          className="csi-tree-toggle"
          aria-label={
            hasChildren
              ? `${isExpanded ? "Collapse" : "Expand"} ${node.item.number}`
              : `${node.item.number} has no child scopes`
          }
          aria-expanded={hasChildren ? isExpanded : undefined}
          disabled={!hasChildren}
          onClick={() => toggleExpanded(node.item.id, onToggleExpandedItem)}
        >
          {hasChildren && (
            <span
              className={`csi-tree-caret${isExpanded ? " csi-tree-caret-expanded" : ""}`}
              aria-hidden="true"
            />
          )}
        </button>
        <label className={`csi-picker-section csi-tree-level-${node.item.level}`}>
          <input
            type="checkbox"
            checked={csiSectionIdsContain(
              csiVersion,
              Array.from(selectedSectionIds),
              node.item.id
            )}
            onChange={(event) =>
              onToggleSection(node.item.id, event.target.checked)
            }
          />
          <span>
            <CsiCodeLabel item={node.item} />
          </span>
          <CsiLevelBadge item={node.item} />
        </label>
      </div>

      {hasChildren && isExpanded && (
        <div className="csi-picker-tree-children">
          {node.children.map((childNode) => (
            <CompanyCsiCoverageTreeNode
              key={childNode.item.id}
              node={childNode}
              csiVersion={csiVersion}
              selectedSectionIds={selectedSectionIds}
              expandedItemIds={expandedItemIds}
              onToggleExpandedItem={onToggleExpandedItem}
              depth={depth + 1}
              onToggleSection={onToggleSection}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function countSelectedCsiTreeItems(
  nodes: CsiCatalogTreeNode[],
  csiVersion: CsiMasterFormatVersion,
  selectedSectionIds: Set<string>
) {
  const selectedIds = Array.from(selectedSectionIds);

  function walk(node: CsiCatalogTreeNode): number {
    const selectedSelf = csiSectionIdsContain(csiVersion, selectedIds, node.item.id)
      ? 1
      : 0;

    return (
      selectedSelf +
      node.children.reduce((count, childNode) => count + walk(childNode), 0)
    );
  }

  return nodes.reduce((count, node) => count + walk(node), 0);
}

function ResponsibilityScopeEditor({
  scope,
  scopeIndex,
  locations,
  csiTree,
  csiVersion,
  companyDivisionIds,
  companySectionIds,
  expandedCsiItemIds,
  onToggleExpandedCsiItem,
  onChange,
  onRemove,
  onToggleDivision,
  onToggleSection,
}: {
  scope: SubcontractorContactScope;
  scopeIndex: number;
  locations: SubcontractorLocation[];
  csiTree: CsiCatalogTreeNode[];
  csiVersion: CsiMasterFormatVersion;
  companyDivisionIds: string[];
  companySectionIds: string[];
  expandedCsiItemIds: string[];
  onToggleExpandedCsiItem: React.Dispatch<React.SetStateAction<string[]>>;
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
        <strong>CSI Scopes</strong>
        <div className="csi-picker">
          {csiTree.length === 0 ? (
            <p className="muted-text">No company CSI coverage selected.</p>
          ) : (
            csiTree.map((node) => (
              <ResponsibilityCsiTreeNode
                key={node.item.id}
                node={node}
                scope={scope}
                scopeIndex={scopeIndex}
                csiVersion={csiVersion}
                companyDivisionIds={companyDivisionIds}
                companySectionIds={companySectionIds}
                expandedItemIds={expandedCsiItemIds}
                onToggleExpandedItem={onToggleExpandedCsiItem}
                depth={0}
                onToggleDivision={onToggleDivision}
                onToggleSection={onToggleSection}
              />
            ))
          )}
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

function ResponsibilityCsiTreeNode({
  node,
  scope,
  scopeIndex,
  csiVersion,
  companyDivisionIds,
  companySectionIds,
  expandedItemIds,
  onToggleExpandedItem,
  depth,
  onToggleDivision,
  onToggleSection,
}: {
  node: CsiCatalogTreeNode;
  scope: SubcontractorContactScope;
  scopeIndex: number;
  csiVersion: CsiMasterFormatVersion;
  companyDivisionIds: string[];
  companySectionIds: string[];
  expandedItemIds: string[];
  onToggleExpandedItem: React.Dispatch<React.SetStateAction<string[]>>;
  depth: number;
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
  const item = node.item;
  const isDivision = item.level === 1;
  const divisionId = item.divisionId;
  const hasChildren = node.children.length > 0;
  const isExpanded = expandedItemIds.includes(item.id);
  const isChecked = isDivision
    ? csiDivisionIdsContain(csiVersion, scope.divisionIds, divisionId)
    : csiSectionIdsContain(csiVersion, scope.sectionIds, item.id);
  const outsideCoverage = isResponsibilityItemOutsideCoverage(
    csiVersion,
    isDivision ? divisionId : item.id,
    companyDivisionIds,
    companySectionIds,
    isDivision
  );

  return (
    <div className="csi-picker-tree-node">
      <div
        className="csi-picker-tree-row"
        style={{ "--tree-depth": depth } as React.CSSProperties}
      >
        <button
          type="button"
          className="csi-tree-toggle"
          aria-label={
            hasChildren
              ? `${isExpanded ? "Collapse" : "Expand"} ${item.number}`
              : `${item.number} has no child scopes`
          }
          aria-expanded={hasChildren ? isExpanded : undefined}
          disabled={!hasChildren}
          onClick={() => toggleExpanded(item.id, onToggleExpandedItem)}
        >
          {hasChildren && (
            <span
              className={`csi-tree-caret${isExpanded ? " csi-tree-caret-expanded" : ""}`}
              aria-hidden="true"
            />
          )}
        </button>
        <label className={`csi-picker-section csi-tree-level-${item.level}`}>
          <input
            type="checkbox"
            checked={isChecked}
            onChange={(event) =>
              isDivision
                ? onToggleDivision(scopeIndex, divisionId, event.target.checked)
                : onToggleSection(scopeIndex, item.id, event.target.checked)
            }
          />
          <span>
            {item.number} - {item.name}
          </span>
          {outsideCoverage && (
            <span className="badge badge-warning">Outside company coverage</span>
          )}
        </label>
      </div>

      {hasChildren && isExpanded && (
        <div className="csi-picker-tree-children">
          {node.children.map((childNode) => (
            <ResponsibilityCsiTreeNode
              key={childNode.item.id}
              node={childNode}
              scope={scope}
              scopeIndex={scopeIndex}
              csiVersion={csiVersion}
              companyDivisionIds={companyDivisionIds}
              companySectionIds={companySectionIds}
              expandedItemIds={expandedItemIds}
              onToggleExpandedItem={onToggleExpandedItem}
              depth={depth + 1}
              onToggleDivision={onToggleDivision}
              onToggleSection={onToggleSection}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function isResponsibilityItemOutsideCoverage(
  csiVersion: CsiMasterFormatVersion,
  itemId: string,
  companyDivisionIds: string[],
  companySectionIds: string[],
  isDivision: boolean
) {
  if (isDivision) {
    return !csiDivisionIdsContain(csiVersion, companyDivisionIds, itemId);
  }

  const divisionId = getSectionDivisionId(itemId);

  return (
    !csiSectionIdsContain(csiVersion, companySectionIds, itemId) &&
    !csiDivisionIdsContain(csiVersion, companyDivisionIds, divisionId)
  );
}

function getPrimaryCoverageDivisionName(selectedDivisionIds: Set<string>) {
  const primaryDivisionId = Array.from(selectedDivisionIds).find(
    isRealCsiDivisionId
  );

  return primaryDivisionId ? getDivisionName(primaryDivisionId) : "";
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
