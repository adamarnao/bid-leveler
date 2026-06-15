import { Dispatch, SetStateAction } from "react";
import Panel from "@/components/ui/Panel";
import {
  CheckboxField,
  FormInput,
  FormSelect,
} from "@/components/subcontractors/form/FormFields";
import {
  formatContactSummary,
  getContactScopeSummaries,
  getLocationName,
} from "@/components/subcontractors/form/subcontractorFormContactHelpers";
import {
  ContactRole,
  PhoneType,
  SubcontractorContact,
  SubcontractorLocation,
} from "@/types/Subcontractor";

const contactRoles: ContactRole[] = [
  "ESTIMATOR",
  "PROJECT_MANAGER",
  "OWNER",
  "ACCOUNTING",
  "GENERAL",
];

const phoneTypes: PhoneType[] = ["OFFICE", "MOBILE"];

type ContactsSectionProps = {
  subcontractorId: string;
  contacts: SubcontractorContact[];
  locations: SubcontractorLocation[] | undefined;
  expandedContactIds: string[];
  setExpandedContactIds: Dispatch<SetStateAction<string[]>>;
  onAddContact: () => void;
  onUpdateContact: (
    contactId: string,
    updates: Partial<SubcontractorContact>
  ) => void;
  onRemoveContact: (contactId: string) => void;
  onMarkPrimaryContact: (contactId: string) => void;
  onMarkDefaultInviteRecipient: (contactId: string, checked: boolean) => void;
  onOpenResponsibilities: (contact: SubcontractorContact) => void;
  onToggleContact: (
    contactId: string,
    setExpandedIds: Dispatch<SetStateAction<string[]>>
  ) => void;
};

export default function ContactsSection({
  subcontractorId,
  contacts,
  locations,
  expandedContactIds,
  setExpandedContactIds,
  onAddContact,
  onUpdateContact,
  onRemoveContact,
  onMarkPrimaryContact,
  onMarkDefaultInviteRecipient,
  onOpenResponsibilities,
  onToggleContact,
}: ContactsSectionProps) {
  const availableLocations = locations ?? [];

  return (
    <Panel title="Contacts">
      {contacts.map((contact, index) => {
        const isExpanded = expandedContactIds.includes(contact.id);

        return (
          <div key={contact.id} className="form-record">
            <div className="form-record-header">
              <button
                type="button"
                className="crm-expand-button"
                aria-expanded={isExpanded}
                onClick={() => onToggleContact(contact.id, setExpandedContactIds)}
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
                    {getLocationName(availableLocations, contact.locationId)}
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
                onClick={() => onRemoveContact(contact.id)}
                disabled={contacts.length === 1}
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
                    onUpdateContact(contact.id, { role: value as ContactRole })
                  }
                />
                <FormInput
                  label="Name"
                  value={contact.name}
                  onChange={(value) =>
                    onUpdateContact(contact.id, { name: value })
                  }
                />
                <FormInput
                  label="Job Title"
                  value={contact.title ?? ""}
                  onChange={(value) =>
                    onUpdateContact(contact.id, { title: value })
                  }
                />
                <FormInput
                  label="Email"
                  type="email"
                  value={contact.email ?? ""}
                  onChange={(value) =>
                    onUpdateContact(contact.id, { email: value })
                  }
                />
                <FormInput
                  label="Office Phone"
                  value={contact.officePhone ?? ""}
                  onChange={(value) =>
                    onUpdateContact(contact.id, { officePhone: value })
                  }
                />
                <FormInput
                  label="Ext."
                  value={contact.officePhoneExtension ?? ""}
                  onChange={(value) =>
                    onUpdateContact(contact.id, {
                      officePhoneExtension: value,
                    })
                  }
                />
                <FormInput
                  label="Mobile Phone"
                  value={contact.mobilePhone ?? ""}
                  onChange={(value) =>
                    onUpdateContact(contact.id, { mobilePhone: value })
                  }
                />
                <FormSelect
                  label="Primary Phone"
                  value={contact.primaryPhoneType ?? "OFFICE"}
                  options={phoneTypes}
                  onChange={(value) =>
                    onUpdateContact(contact.id, {
                      primaryPhoneType: value as PhoneType,
                    })
                  }
                />
                <FormSelect
                  label="Location / Branch"
                  value={contact.locationId ?? ""}
                  options={["", ...availableLocations.map((location) => location.id)]}
                  getOptionLabel={(locationId) =>
                    locationId
                      ? getLocationName(availableLocations, locationId)
                      : "Company-wide / no specific branch"
                  }
                  onChange={(value) =>
                    onUpdateContact(contact.id, {
                      locationId: value || undefined,
                    })
                  }
                />
                <div className="form-field">
                  <label className="radio-option">
                    <input
                      type="radio"
                      name={`${subcontractorId}-primary-contact`}
                      checked={contact.isPrimary === true}
                      onChange={() => onMarkPrimaryContact(contact.id)}
                    />
                    Primary contact
                  </label>
                </div>
                <CheckboxField
                  label="Default invite recipient"
                  checked={contact.isDefaultInviteRecipient === true}
                  onChange={(checked) =>
                    onMarkDefaultInviteRecipient(contact.id, checked)
                  }
                />
                <CheckboxField
                  label="Active"
                  checked={contact.active !== false}
                  onChange={(checked) =>
                    onUpdateContact(contact.id, { active: checked })
                  }
                />
                <div className="contact-responsibility-summary">
                  <strong>Responsibilities</strong>
                  {getContactScopeSummaries(contact).length === 0 ? (
                    <p className="muted-text">General company-wide fallback</p>
                  ) : (
                    <ul>
                      {getContactScopeSummaries(contact).map(
                        (summary, summaryIndex) => (
                          <li key={`${contact.id}-scope-summary-${summaryIndex}`}>
                            {summary}
                          </li>
                        )
                      )}
                    </ul>
                  )}
                  <button
                    type="button"
                    className="button-secondary"
                    onClick={() => onOpenResponsibilities(contact)}
                  >
                    Add / Edit Responsibilities
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      <button type="button" className="button-secondary" onClick={onAddContact}>
        Add Contact
      </button>
    </Panel>
  );
}
