"use client";

import { useMemo, useState } from "react";
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
import { CsiDivision, CsiMasterFormatVersion } from "@/types/Csi";
import {
  ContactRole,
  PhoneType,
  PrequalificationStatus,
  RelationshipStatus,
  Subcontractor,
  SubcontractorContact,
  VpiConfidenceLevel,
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

const relationshipStatuses: RelationshipStatus[] = [
  "PREFERRED",
  "APPROVED",
  "CONDITIONAL",
  "INACTIVE",
  "DO_NOT_USE",
];

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
const confidenceLevels: VpiConfidenceLevel[] = ["LOW", "MEDIUM", "HIGH"];
const csiSourceVersions: CsiMasterFormatVersion[] = [
  "MASTERFORMAT_CURRENT",
  "MASTERFORMAT_1995",
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
  const [draft, setDraft] = useState<Subcontractor>(() => ({
    ...initialSubcontractor,
    contacts:
      initialSubcontractor.contacts.length > 0
        ? initialSubcontractor.contacts
        : [fallbackPrimaryContact],
  }));
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

  function submitSubcontractor(event: React.FormEvent) {
    event.preventDefault();

    const normalizedSectionIds = draft.csiCoverage.sectionIds;
    const normalizedDivisionIds = Array.from(
      new Set([
        draft.primaryDivisionId,
        ...draft.csiCoverage.divisionIds,
        ...normalizedSectionIds.map(getSectionDivisionId),
      ])
    ).filter(Boolean);

    onSubmit({
      ...draft,
      dba: emptyToUndefined(draft.dba),
      website: emptyToUndefined(draft.website),
      mainPhone: emptyToUndefined(draft.mainPhone),
      notes: emptyToUndefined(draft.notes),
      contacts: normalizeContacts(draft.contacts),
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
    });
  }

  function addContact() {
    setDraft({
      ...draft,
      contacts: [
        ...draft.contacts,
        createEmptyContact(draft.id, draft.contacts.length + 1),
      ],
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

  function toggleDivision(divisionId: string, checked: boolean) {
    if (
      !isViewingEquivalentCoverage &&
      !checked &&
      divisionId === draft.primaryDivisionId
    ) {
      return;
    }

    if (isViewingEquivalentCoverage) {
      const childSectionIds = csiSectionOptions
        .filter((section) => section.divisionId === divisionId)
        .map((section) => section.id);
      const nextSectionIds = checked
        ? Array.from(selectedSectionIds)
        : Array.from(selectedSectionIds).filter(
            (sectionId) => !childSectionIds.includes(sectionId)
          );
      const nextDivisionIds = checked
        ? Array.from(new Set([...getDivisionIdsForSections(nextSectionIds), divisionId]))
        : getDivisionIdsForSections(nextSectionIds).filter(
            (id) => id !== divisionId
          );
      const nextPrimaryDivisionId = getBestPrimaryDivisionId(
        draft.primaryDivisionId,
        nextDivisionIds,
        divisionId
      );

      setDraft({
        ...draft,
        primaryDivisionId: nextPrimaryDivisionId,
        csiCoverage: {
          ...draft.csiCoverage,
          sourceVersion: pickerDisplayVersion,
          divisionIds: nextDivisionIds,
          sectionIds: nextSectionIds,
        },
      });

      if (checked) {
        setExpandedCsiDivisionIds((divisionIds) =>
          divisionIds.includes(divisionId)
            ? divisionIds
            : [...divisionIds, divisionId]
        );
      }

      return;
    }

    const nextDivisionIds = checked
      ? Array.from(new Set([...draft.csiCoverage.divisionIds, divisionId]))
      : draft.csiCoverage.divisionIds.filter((id) => id !== divisionId);
    const nextSectionIds = checked
      ? draft.csiCoverage.sectionIds
      : draft.csiCoverage.sectionIds.filter(
          (sectionId) => getSectionDivisionId(sectionId) !== divisionId
        );

    setDraft({
      ...draft,
      csiCoverage: {
        ...draft.csiCoverage,
        divisionIds: nextDivisionIds,
        sectionIds: nextSectionIds,
      },
    });

    if (checked) {
      setExpandedCsiDivisionIds((divisionIds) =>
        divisionIds.includes(divisionId) ? divisionIds : [...divisionIds, divisionId]
      );
    }
  }

  function toggleSection(sectionId: string, checked: boolean) {
    const divisionId =
      getSectionDivisionIdFromOptions(sectionId, csiSectionOptions) ??
      getSectionDivisionId(sectionId);

    if (isViewingEquivalentCoverage) {
      const nextSectionIds = checked
        ? Array.from(new Set([...Array.from(selectedSectionIds), sectionId]))
        : Array.from(selectedSectionIds).filter((id) => id !== sectionId);
      const nextDivisionIds = checked
        ? Array.from(new Set([...getDivisionIdsForSections(nextSectionIds), divisionId]))
        : getDivisionIdsForSections(nextSectionIds);
      const nextPrimaryDivisionId = getBestPrimaryDivisionId(
        draft.primaryDivisionId,
        nextDivisionIds,
        divisionId
      );

      setDraft({
        ...draft,
        primaryDivisionId: nextPrimaryDivisionId,
        csiCoverage: {
          ...draft.csiCoverage,
          sourceVersion: pickerDisplayVersion,
          divisionIds: nextDivisionIds,
          sectionIds: nextSectionIds,
        },
      });

      if (checked) {
        setExpandedCsiDivisionIds((divisionIds) =>
          divisionIds.includes(divisionId)
            ? divisionIds
            : [...divisionIds, divisionId]
        );
      }

      return;
    }

    const nextSectionIds = checked
      ? Array.from(new Set([...draft.csiCoverage.sectionIds, sectionId]))
      : draft.csiCoverage.sectionIds.filter((id) => id !== sectionId);
    const nextDivisionIds = checked
      ? Array.from(new Set([...draft.csiCoverage.divisionIds, divisionId]))
      : draft.csiCoverage.divisionIds;

    setDraft({
      ...draft,
      csiCoverage: {
        ...draft.csiCoverage,
        divisionIds: nextDivisionIds,
        sectionIds: nextSectionIds,
      },
    });

    if (checked) {
      setExpandedCsiDivisionIds((divisionIds) =>
        divisionIds.includes(divisionId) ? divisionIds : [...divisionIds, divisionId]
      );
    }
  }

  function updatePrimaryDivision(divisionId: string) {
    if (isViewingEquivalentCoverage) {
      const nextSectionIds = Array.from(selectedSectionIds);
      const nextDivisionIds = Array.from(
        new Set([...getDivisionIdsForSections(nextSectionIds), divisionId])
      );

      setDraft({
        ...draft,
        primaryDivisionId: divisionId,
        csiCoverage: {
          ...draft.csiCoverage,
          sourceVersion: pickerDisplayVersion,
          divisionIds: nextDivisionIds,
          sectionIds: nextSectionIds,
        },
      });

      setExpandedCsiDivisionIds((divisionIds) =>
        divisionIds.includes(divisionId) ? divisionIds : [...divisionIds, divisionId]
      );

      return;
    }

    setDraft({
      ...draft,
      primaryDivisionId: divisionId,
      csiCoverage: {
        ...draft.csiCoverage,
        divisionIds: Array.from(
          new Set([...draft.csiCoverage.divisionIds, divisionId])
        ),
      },
    });
  }

  return (
    <form onSubmit={submitSubcontractor}>
      <div className="form-grid">
        <Panel title="Company Information">
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
          <FormTextArea
            label="Notes"
            value={draft.notes ?? ""}
            onChange={(value) => setDraft({ ...draft, notes: value })}
          />
        </Panel>

        <Panel title="Address">
          <FormInput
            label="Address Line 1"
            value={draft.address.line1}
            onChange={(value) =>
              setDraft({ ...draft, address: { ...draft.address, line1: value } })
            }
          />
          <FormInput
            label="Address Line 2"
            value={draft.address.line2 ?? ""}
            onChange={(value) =>
              setDraft({ ...draft, address: { ...draft.address, line2: value } })
            }
          />
          <FormInput
            label="City"
            value={draft.address.city}
            onChange={(value) =>
              setDraft({ ...draft, address: { ...draft.address, city: value } })
            }
          />
          <FormInput
            label="State"
            value={draft.address.state}
            onChange={(value) =>
              setDraft({ ...draft, address: { ...draft.address, state: value } })
            }
          />
          <FormInput
            label="ZIP"
            value={draft.address.zip}
            onChange={(value) =>
              setDraft({ ...draft, address: { ...draft.address, zip: value } })
            }
          />
        </Panel>

        <Panel title="Service Area">
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
        </Panel>

        <Panel title="Contacts">
          {draft.contacts.map((contact, index) => (
            <div
              key={contact.id}
              style={{
                borderBottom:
                  index === draft.contacts.length - 1
                    ? "0"
                    : "1px solid var(--color-border)",
                marginBottom: 16,
                paddingBottom: 16,
              }}
            >
              <div className="command-header" style={{ marginBottom: 12 }}>
                <h3 style={{ margin: 0 }}>
                  {contact.name || `Contact ${index + 1}`}
                </h3>
                <button
                  type="button"
                  className="button-secondary"
                  onClick={() => removeContact(contact.id)}
                  disabled={draft.contacts.length === 1}
                >
                  Remove
                </button>
              </div>

              <FormSelect
                label="Role"
                value={contact.role}
                options={contactRoles}
                onChange={(value) =>
                  updateContact(contact.id, { role: value as ContactRole })
                }
              />
              <FormInput
                label="Name"
                value={contact.name}
                onChange={(value) => updateContact(contact.id, { name: value })}
              />
              <FormInput
                label="Title"
                value={contact.title ?? ""}
                onChange={(value) => updateContact(contact.id, { title: value })}
              />
              <FormInput
                label="Email"
                type="email"
                value={contact.email ?? ""}
                onChange={(value) => updateContact(contact.id, { email: value })}
              />
              <FormInput
                label="Office Phone"
                value={contact.officePhone ?? ""}
                onChange={(value) =>
                  updateContact(contact.id, { officePhone: value })
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
            </div>
          ))}

          <button type="button" className="button-secondary" onClick={addContact}>
            Add Contact
          </button>
        </Panel>

        <Panel title="CSI Coverage">
          <FormSelect
            label="CSI Coverage Version"
            value={pickerDisplayVersion}
            options={csiSourceVersions}
            getOptionLabel={formatCsiSourceVersion}
            onChange={(value) =>
              setPickerDisplayVersion(value as CsiMasterFormatVersion)
            }
          />
          <p className="muted-text">
            Saved source version: {formatCsiSourceVersion(savedCsiSourceVersion)}.
          </p>
          {isViewingEquivalentCoverage && (
            <p className="muted-text">
              Equivalent CSI coverage is shown using the crosswalk.
            </p>
          )}
          {isViewingEquivalentCoverage && crosswalkIssueCount > 0 && (
            <p className="badge badge-warning">
              Some selected CSI coverage has incomplete or ambiguous crosswalk
              mappings.
            </p>
          )}
          <FormSelect
            label="Primary Division"
            value={draft.primaryDivisionId}
            options={csiDivisionOptions.map((division) => division.id)}
            getOptionLabel={(divisionId) => getDivisionName(divisionId)}
            onChange={updatePrimaryDivision}
          />
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
          <div className="form-field">
            <strong>Divisions and Sections</strong>
            <div className="csi-picker">
              {csiDivisionOptions.map((division) => {
                const sectionOptions = csiSectionOptions.filter(
                  (section) => section.divisionId === division.id
                );
                const selectedSectionCount = sectionOptions.filter((section) =>
                  selectedSectionIds.has(section.id)
                ).length;
                const isExpanded = expandedCsiDivisionIds.includes(division.id);

                return (
                  <div key={division.id} className="csi-picker-division">
                    <div className="csi-picker-division-row">
                      <button
                        type="button"
                        className="crm-expand-button"
                        aria-expanded={isExpanded}
                        onClick={() =>
                          toggleExpanded(division.id, setExpandedCsiDivisionIds)
                        }
                      >
                        {isExpanded ? "-" : "+"}
                      </button>
                      <label className="csi-picker-label">
                        <input
                          type="checkbox"
                          checked={selectedDivisionIds.has(division.id)}
                          onChange={(event) =>
                            toggleDivision(division.id, event.target.checked)
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
                            <label key={section.id} className="csi-picker-section">
                              <input
                                type="checkbox"
                                checked={selectedSectionIds.has(section.id)}
                                onChange={(event) =>
                                  toggleSection(section.id, event.target.checked)
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
        </Panel>

        <Panel title="Relationship / Prequalification">
          <FormSelect
            label="Relationship Status"
            value={draft.relationshipStatus}
            options={relationshipStatuses}
            onChange={(value) =>
              setDraft({
                ...draft,
                relationshipStatus: value as RelationshipStatus,
              })
            }
          />
          <FormSelect
            label="Prequalification Status"
            value={draft.prequalification.status}
            options={prequalificationStatuses}
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
            value={formatOptionalNumber(draft.prequalification.bondingCapacity)}
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
        </Panel>

        <Panel title="Compliance">
          <CheckboxField
            label="W-9 on File"
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
          <CheckboxField
            label="Insurance on File"
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
            label="Insurance Expiration"
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
          <CheckboxField
            label="License on File"
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
            label="License Expiration"
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
        </Panel>

        <Panel title="Vendor Performance Index">
          <VpiInput
            label="Responsiveness"
            value={draft.vpi.responsiveness}
            onChange={(value) =>
              setDraft({ ...draft, vpi: { ...draft.vpi, responsiveness: value } })
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
          <FormSelect
            label="Confidence"
            value={draft.vpi.confidenceLevel}
            options={confidenceLevels}
            onChange={(value) =>
              setDraft({
                ...draft,
                vpi: {
                  ...draft.vpi,
                  confidenceLevel: value as VpiConfidenceLevel,
                },
              })
            }
          />
        </Panel>
      </div>

      <div className="settings-actions">
        <button type="submit" className="button-primary">
          {submitLabel}
        </button>
      </div>
    </form>
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
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="form-field">
      <label className="radio-option">
        <input
          type="checkbox"
          checked={checked}
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

function ensurePrimaryContact(contacts: SubcontractorContact[]) {
  if (contacts.length === 0) return contacts;
  if (contacts.some((contact) => contact.isPrimary)) return contacts;

  return contacts.map((contact, index) => ({
    ...contact,
    isPrimary: index === 0,
  }));
}

function normalizeContacts(contacts: SubcontractorContact[]) {
  return ensurePrimaryContact(contacts).map((contact) => ({
    ...contact,
    locationId: emptyToUndefined(contact.locationId),
    title: emptyToUndefined(contact.title),
    email: emptyToUndefined(contact.email),
    officePhone: emptyToUndefined(contact.officePhone),
    mobilePhone: emptyToUndefined(contact.mobilePhone),
    phone: emptyToUndefined(contact.phone),
    notes: emptyToUndefined(contact.notes),
    isPrimary: contact.isPrimary === true,
    isDefaultInviteRecipient: contact.isDefaultInviteRecipient === true,
    active: contact.active !== false,
  }));
}

function getDivisionName(divisionId: string) {
  const division = mockCsiDivisions.find((item) => item.id === divisionId);

  return division ? `${division.number} - ${division.name}` : divisionId;
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
