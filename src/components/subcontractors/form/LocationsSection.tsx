import { Dispatch, SetStateAction } from "react";
import Panel from "@/components/ui/Panel";
import {
  FormInput,
  FormSelect,
  FormTextArea,
} from "@/components/subcontractors/form/FormFields";
import { formatStatus } from "@/components/subcontractors/form/subcontractorFormNormalization";
import {
  SubcontractorLocation,
  SubcontractorLocationType,
} from "@/types/Subcontractor";

const locationTypes: SubcontractorLocationType[] = [
  "HEADQUARTERS",
  "BRANCH",
  "FIELD_OFFICE",
  "BILLING",
];

type LocationsSectionProps = {
  subcontractorId: string;
  locations: SubcontractorLocation[] | undefined;
  expandedLocationIds: string[];
  setExpandedLocationIds: Dispatch<SetStateAction<string[]>>;
  onAddLocation: () => void;
  onUpdateLocation: (
    locationId: string,
    updates: Partial<SubcontractorLocation>
  ) => void;
  onRemoveLocation: (locationId: string) => void;
  onMarkPrimaryLocation: (locationId: string) => void;
  onToggleLocation: (
    locationId: string,
    setExpandedIds: Dispatch<SetStateAction<string[]>>
  ) => void;
};

export default function LocationsSection({
  subcontractorId,
  locations,
  expandedLocationIds,
  setExpandedLocationIds,
  onAddLocation,
  onUpdateLocation,
  onRemoveLocation,
  onMarkPrimaryLocation,
  onToggleLocation,
}: LocationsSectionProps) {
  return (
    <Panel title="Locations / Branches">
      {!locations || locations.length === 0 ? (
        <p className="muted-text">
          This subcontractor uses the company address unless branches are added.
        </p>
      ) : (
        locations.map((location, index) => {
          const isExpanded = expandedLocationIds.includes(location.id);

          return (
            <div key={location.id} className="form-record">
              <div className="form-record-header">
                <button
                  type="button"
                  className="crm-expand-button"
                  aria-expanded={isExpanded}
                  onClick={() =>
                    onToggleLocation(location.id, setExpandedLocationIds)
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
                  onClick={() => onRemoveLocation(location.id)}
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
                      onUpdateLocation(location.id, { name: value })
                    }
                  />
                  <FormSelect
                    label="Location Type"
                    value={location.type}
                    options={locationTypes}
                    onChange={(value) =>
                      onUpdateLocation(location.id, {
                        type: value as SubcontractorLocationType,
                      })
                    }
                  />
                  <FormInput
                    label="Address Line 1"
                    value={location.address.line1}
                    onChange={(value) =>
                      onUpdateLocation(location.id, {
                        address: { ...location.address, line1: value },
                      })
                    }
                  />
                  <FormInput
                    label="Address Line 2"
                    value={location.address.line2 ?? ""}
                    onChange={(value) =>
                      onUpdateLocation(location.id, {
                        address: { ...location.address, line2: value },
                      })
                    }
                  />
                  <FormInput
                    label="City"
                    value={location.address.city}
                    onChange={(value) =>
                      onUpdateLocation(location.id, {
                        address: { ...location.address, city: value },
                      })
                    }
                  />
                  <FormInput
                    label="State"
                    value={location.address.state}
                    onChange={(value) =>
                      onUpdateLocation(location.id, {
                        address: { ...location.address, state: value },
                      })
                    }
                  />
                  <FormInput
                    label="ZIP"
                    value={location.address.zip}
                    onChange={(value) =>
                      onUpdateLocation(location.id, {
                        address: { ...location.address, zip: value },
                      })
                    }
                  />
                  <FormInput
                    label="Main Phone"
                    value={location.mainPhone ?? ""}
                    onChange={(value) =>
                      onUpdateLocation(location.id, { mainPhone: value })
                    }
                  />
                  <FormInput
                    label="Main Phone Extension"
                    value={location.mainPhoneExtension ?? ""}
                    onChange={(value) =>
                      onUpdateLocation(location.id, {
                        mainPhoneExtension: value,
                      })
                    }
                  />
                  <FormInput
                    label="Email"
                    type="email"
                    value={location.email ?? ""}
                    onChange={(value) =>
                      onUpdateLocation(location.id, { email: value })
                    }
                  />
                  <FormTextArea
                    label="Notes"
                    value={location.notes ?? ""}
                    onChange={(value) =>
                      onUpdateLocation(location.id, { notes: value })
                    }
                  />
                  <div className="form-field">
                    <label className="radio-option">
                      <input
                        type="radio"
                        name={`${subcontractorId}-primary-location`}
                        checked={location.isPrimary === true}
                        onChange={() => onMarkPrimaryLocation(location.id)}
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

      <button type="button" className="button-secondary" onClick={onAddLocation}>
        Add Location
      </button>
    </Panel>
  );
}
