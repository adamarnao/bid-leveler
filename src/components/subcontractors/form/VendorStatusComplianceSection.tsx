import { Dispatch, SetStateAction } from "react";
import Panel from "@/components/ui/Panel";
import {
  CheckboxField,
  FormInput,
  FormSelect,
  FormTextArea,
} from "@/components/subcontractors/form/FormFields";
import {
  formatOptionalNumber,
  toOptionalNumber,
} from "@/components/subcontractors/form/subcontractorFormNormalization";
import { formatVendorStatus } from "@/lib/subcontractors";
import {
  PrequalificationStatus,
  Subcontractor,
} from "@/types/Subcontractor";

const prequalificationStatuses: PrequalificationStatus[] = [
  "NOT_STARTED",
  "IN_PROGRESS",
  "QUALIFIED",
  "CONDITIONAL",
  "EXPIRED",
  "REJECTED",
];

type VendorStatusComplianceSectionProps = {
  draft: Subcontractor;
  setDraft: Dispatch<SetStateAction<Subcontractor>>;
};

export default function VendorStatusComplianceSection({
  draft,
  setDraft,
}: VendorStatusComplianceSectionProps) {
  return (
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
  );
}
