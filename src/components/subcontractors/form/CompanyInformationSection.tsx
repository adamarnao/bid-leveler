import { Dispatch, SetStateAction } from "react";
import Panel from "@/components/ui/Panel";
import {
  CheckboxField,
  FormInput,
  FormTextArea,
} from "@/components/subcontractors/form/FormFields";
import {
  formatWholeNumberInput,
  splitList,
  toOptionalWholeNumber,
} from "@/components/subcontractors/form/subcontractorFormNormalization";
import {
  isDoNotUseVendor,
  isPreferredVendor,
} from "@/lib/subcontractors";
import { Subcontractor } from "@/types/Subcontractor";

type CompanyInformationSectionProps = {
  draft: Subcontractor;
  setDraft: Dispatch<SetStateAction<Subcontractor>>;
  onPreferredChange: (isPreferred: boolean) => void;
  onDoNotUseChange: (isDoNotUse: boolean) => void;
};

export default function CompanyInformationSection({
  draft,
  setDraft,
  onPreferredChange,
  onDoNotUseChange,
}: CompanyInformationSectionProps) {
  return (
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
          <div className="company-phone-extension-field">
            <FormInput
              label="Ext."
              value={draft.mainPhoneExtension ?? ""}
              className="form-field-compact-extension"
              inputMode="numeric"
              maxLength={8}
              onChange={(value) =>
                setDraft({ ...draft, mainPhoneExtension: value })
              }
            />
          </div>
          <div className="form-two-control-row">
            <CheckboxField
              label="Preferred Vendor"
              checked={isPreferredVendor(draft)}
              onChange={onPreferredChange}
              disabled={isDoNotUseVendor(draft)}
            />
            <CheckboxField
              label="Do Not Use"
              checked={isDoNotUseVendor(draft)}
              onChange={onDoNotUseChange}
            />
          </div>
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
            inputMode="numeric"
            suffix="mi"
            value={formatWholeNumberInput(
              String(draft.serviceArea.travelRadiusMiles ?? "")
            )}
            onChange={(value) =>
              setDraft({
                ...draft,
                serviceArea: {
                  ...draft.serviceArea,
                  travelRadiusMiles: toOptionalWholeNumber(value),
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
  );
}
