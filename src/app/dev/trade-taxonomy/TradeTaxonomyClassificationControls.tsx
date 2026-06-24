"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import ContextHelp from "@/components/ui/ContextHelp";
import {
  getContextTagOptionsForClassification,
  getProjectSectorOptions,
  getWorkTypeOptionsForSector,
  ProjectContextTagId,
  ProjectSectorId,
  ProjectWorkTypeId,
} from "@/features/project-classification";

type TradeTaxonomyClassificationControlsProps = {
  selectedSector?: ProjectSectorId;
  selectedWorkType?: ProjectWorkTypeId;
  selectedContextTags: ProjectContextTagId[];
  includeHidden: boolean;
};

const sectorOptions = getProjectSectorOptions();

export default function TradeTaxonomyClassificationControls({
  selectedSector,
  selectedWorkType,
  selectedContextTags,
  includeHidden,
}: TradeTaxonomyClassificationControlsProps) {
  const [sector, setSector] = useState<ProjectSectorId | "">(selectedSector ?? "");
  const [workType, setWorkType] = useState<ProjectWorkTypeId | "">(selectedWorkType ?? "");
  const [contextTags, setContextTags] = useState<ProjectContextTagId[]>(selectedContextTags);
  const [showHidden, setShowHidden] = useState(includeHidden);

  const workTypeOptions = useMemo(() => getWorkTypeOptionsForSector(sector || undefined), [sector]);
  const contextOptions = useMemo(
    () =>
      getContextTagOptionsForClassification({
        sector: sector || undefined,
        workType: workType || undefined,
      }),
    [sector, workType]
  );
  const availableContextIds = useMemo(
    () => new Set(contextOptions.map((option) => option.id)),
    [contextOptions]
  );
  const selectedValidContextTags = contextTags.filter((tag) => availableContextIds.has(tag));

  function handleSectorChange(nextSector: string) {
    const normalizedSector = nextSector as ProjectSectorId | "";
    setSector(normalizedSector);
    pruneContextTags(normalizedSector, workType);
  }

  function handleWorkTypeChange(nextWorkType: string) {
    const normalizedWorkType = nextWorkType as ProjectWorkTypeId | "";
    setWorkType(normalizedWorkType);
    pruneContextTags(sector, normalizedWorkType);
  }

  function pruneContextTags(nextSector: ProjectSectorId | "", nextWorkType: ProjectWorkTypeId | "") {
    const nextAvailableContextIds = new Set(
      getContextTagOptionsForClassification({
        sector: nextSector || undefined,
        workType: nextWorkType || undefined,
      }).map((option) => option.id)
    );

    setContextTags((currentTags) =>
      currentTags.filter((tag) => nextAvailableContextIds.has(tag))
    );
  }

  function toggleContextTag(tag: ProjectContextTagId) {
    setContextTags((currentTags) =>
      currentTags.includes(tag)
        ? currentTags.filter((currentTag) => currentTag !== tag)
        : [...currentTags, tag]
    );
  }

  return (
    <form action="/dev/trade-taxonomy" className="taxonomy-classification-form">
      <div className="taxonomy-control-grid">
        <label className="field-stack">
          <span>Sector</span>
          <select
            name="sector"
            value={sector}
            onChange={(event) => handleSectorChange(event.target.value)}
          >
            <option value="">General / Unselected</option>
            {sectorOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="field-stack">
          <span>Work Type</span>
          <select
            name="workType"
            value={workType}
            onChange={(event) => handleWorkTypeChange(event.target.value)}
          >
            <option value="">Unselected</option>
            {workTypeOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div className="field-stack">
          <span>Context Tags</span>
          <details className="taxonomy-context-dropdown">
            <summary>
              {selectedValidContextTags.length
                ? `${selectedValidContextTags.length} context tags selected`
                : "No context tags selected"}
            </summary>
            <div className="taxonomy-context-options">
              {contextOptions.length ? (
                contextOptions.map((option) => (
                  <label key={option.id} className="taxonomy-context-option">
                    <input
                      type="checkbox"
                      name="context"
                      value={option.id}
                      checked={selectedValidContextTags.includes(option.id)}
                      onChange={() => toggleContextTag(option.id)}
                    />
                    <span className="taxonomy-context-option-label">
                      {option.label}
                      <ContextHelp label={option.label} content={option.description} />
                    </span>
                  </label>
                ))
              ) : (
                <p className="muted-text">No context tags are available for this classification.</p>
              )}
            </div>
          </details>
        </div>

        <label className="taxonomy-toggle-row">
          <input
            type="checkbox"
            name="includeHidden"
            value="true"
            checked={showHidden}
            onChange={(event) => setShowHidden(event.target.checked)}
          />
          <span>Include hidden in master library preview</span>
        </label>
      </div>

      <div className="taxonomy-control-actions">
        <button type="submit" className="button-primary">
          Apply Classification
        </button>
        <Link href="/dev/trade-taxonomy" className="button-secondary">
          Reset
        </Link>
      </div>
    </form>
  );
}
