import { Dispatch, SetStateAction } from "react";
import Panel from "@/components/ui/Panel";
import { FormInput, VpiInput } from "@/components/subcontractors/form/FormFields";
import { toRequiredNumber } from "@/components/subcontractors/form/subcontractorFormNormalization";
import { Subcontractor } from "@/types/Subcontractor";

type VpiPerformanceSectionProps = {
  draft: Subcontractor;
  setDraft: Dispatch<SetStateAction<Subcontractor>>;
};

export default function VpiPerformanceSection({
  draft,
  setDraft,
}: VpiPerformanceSectionProps) {
  return (
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
  );
}
