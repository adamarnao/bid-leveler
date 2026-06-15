"use client";

import { useEffect, useMemo, useState } from "react";
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
  CsiPickerSectionOption,
  csiDivisionIdsContain,
  csiSectionIdsContain,
  getBestPrimaryDivisionId,
  getCrosswalkIssueCount,
  getCsiDivisionOptions,
  getCsiSectionOptions,
  getDisplayedDivisionIds,
  getDisplayedSectionIds,
  getDivisionIdsForSections,
  getDivisionName,
  getSectionDivisionId,
  getSectionDivisionIdFromOptions,
  getSelectedSectionGroups,
  getVisibleResponsibilityDivisions,
  getVisibleResponsibilitySections,
  filterOutCsiDivisionIds,
  filterOutCsiSectionIds,
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
import { CsiDivision, CsiMasterFormatVersion } from "@/types/Csi";
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

  function markDefaultInviteRecipient(contactId: string, checked: boolean) {
    updateContact(contactId, {
      isDefaultInviteRecipient: checked,
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
                Show all source-version CSI divisions and sections
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
                      csiVersion={responsibilityCsiVersion}
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

        <VendorStatusComplianceSection draft={draft} setDraft={setDraft} />

        <VpiPerformanceSection draft={draft} setDraft={setDraft} />
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
  csiVersion,
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
  csiVersion: CsiMasterFormatVersion;
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
            const isOutsideCoverage = !csiDivisionIdsContain(
              csiVersion,
              companyDivisionIds,
              division.id
            );

            return (
              <div key={division.id} className="csi-picker-division">
                <div className="csi-picker-division-row">
                  <span className="crm-expand-button" aria-hidden="true">
                    -
                  </span>
                  <label className="csi-picker-label">
                    <input
                      type="checkbox"
                      checked={csiDivisionIdsContain(
                        csiVersion,
                        scope.divisionIds,
                        division.id
                      )}
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
                        !csiSectionIdsContain(
                          csiVersion,
                          companySectionIds,
                          section.id
                        );

                      return (
                        <label
                          key={section.id}
                          className="csi-picker-section"
                        >
                          <input
                            type="checkbox"
                            checked={csiSectionIdsContain(
                              csiVersion,
                              scope.sectionIds,
                              section.id
                            )}
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
