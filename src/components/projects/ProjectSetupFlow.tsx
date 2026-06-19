"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import Panel from "@/components/ui/Panel";
import {
  getProjectBidPackages,
  projectBidPackagesStorageKey,
} from "@/lib/projectBids";
import {
  getProjectSetupProgress,
  getProjectSetupStatus,
  appendProject,
  saveProject,
  updateProjectSetupProgress,
} from "@/lib/projects";
import { getCompanySettings } from "@/lib/settings";
import {
  Project,
  MarketSector,
  ProjectBidRequirements,
  ProjectBidSubmissionMethod,
  ProjectBidType,
  ProjectBudgetReadiness,
  ProjectCharacteristics,
  ProjectComplexityLevel,
  ProjectContractType,
  ProjectDocumentSource,
  ProjectDocuments,
  ProjectExternalTeamContact,
  ProjectExternalTeamDiscipline,
  ProjectFinishLevel,
  ProjectInternalTeamMember,
  ProjectInternalTeamRole,
  ProjectItbInstructions,
  ProjectPlanReviewStatus,
  ProjectPricingConfidence,
  ProjectScopeSetup,
  ProjectStatus,
  ProjectTakeoffStatus,
} from "@/types/Project";
import { CsiMasterFormatVersion, StoredProjectCsiSelections } from "@/types/Csi";
import { ProjectBidPackage } from "@/types/Bid";

const setupSteps = [
  {
    id: "project-basics",
    group: "ITB Launch Readiness",
    title: "Project Basics",
    summary:
      "Confirm the minimum project identity and location details needed to start a credible ITB.",
  },
  {
    id: "communication-contacts",
    group: "ITB Launch Readiness",
    title: "Project Team / Communication Contacts",
    summary:
      "Identify the internal bid contact, reply-to owner, client contact, and RFI/design routing context needed for ITBs.",
  },
  {
    id: "bid-dates-events",
    group: "ITB Launch Readiness",
    title: "Bid Dates & Project Events",
    summary:
      "Set bid deadlines and note project events such as RFI deadlines, site walks, or pre-bid meetings.",
  },
  {
    id: "documents-bid-instructions",
    group: "ITB Launch Readiness",
    title: "Documents / Bid Instructions",
    summary:
      "Capture document links and bid access instructions subs need before responding to an ITB.",
  },
  {
    id: "project-scope-csi",
    group: "ITB Launch Readiness",
    title: "Project Scope / CSI",
    summary:
      "Review selected CSI scopes that drive matching, Bid Packages, and bid coverage.",
  },
  {
    id: "bid-packages",
    group: "ITB Launch Readiness",
    title: "Bid Packages",
    summary:
      "Group selected CSI scopes into estimator-facing packages that can be invited and leveled.",
  },
  {
    id: "itb-launch",
    group: "ITB Launch Readiness",
    title: "ITB Invite List / Launch",
    summary:
      "Confirm the project has enough information to send ITBs. Full setup can continue after invites are sent.",
  },
  {
    id: "extended-internal-team",
    group: "Post-Invite Setup",
    title: "Extended Internal Team",
    summary:
      "Complete broader internal assignments, permissions, notifications, and review responsibilities.",
  },
  {
    id: "extended-external-team-rfi-routing",
    group: "Post-Invite Setup",
    title: "Extended External Team & RFI Routing",
    summary:
      "Complete the owner, client, design, consultant, and RFI contact matrix after ITBs are moving.",
  },
  {
    id: "bid-contract-requirements",
    group: "Post-Invite Setup",
    title: "Bid / Contract Requirements",
    summary:
      "Capture bid type, contract terms, bonds, wage requirements, alternates, allowances, unit prices, and required coverage.",
  },
  {
    id: "budget-pricing-readiness",
    group: "Post-Invite Setup",
    title: "Budget / Pricing Readiness",
    summary:
      "Placeholder until takeoffs, historical pricing, ROM assumptions, and budget confidence inputs are available.",
  },
  {
    id: "final-setup-review",
    group: "Post-Invite Setup",
    title: "Final Setup Review",
    summary:
      "Review non-blocking setup details after ITB launch readiness has been handled.",
  },
];

const defaultStepId = setupSteps[0].id;
const legacyStepIdAliases: Record<string, string> = {
  basics: "project-basics",
  "internal-team": "communication-contacts",
  "external-team-rfi-routing": "communication-contacts",
  "schedule-milestones": "bid-dates-events",
  "plans-characteristics-scope": "documents-bid-instructions",
  "review-launch": "itb-launch",
};

const projectStatusOptions: ProjectStatus[] = [
  "PLAN_REVIEW",
  "BIDDING",
  "SUBMITTED",
  "AWARDED",
  "NOT_AWARDED",
  "ARCHIVED",
];

const internalTeamRoleOptions: ProjectInternalTeamRole[] = [
  "Preconstruction Manager",
  "Chief Estimator",
  "Senior Estimator",
  "Estimator",
  "Assistant Estimator",
  "Estimating Coordinator",
  "Project Manager",
  "Assistant Project Manager",
  "Project Executive",
  "Operations Manager",
  "Project Engineer",
  "Administrative Support",
  "Accounting Contact",
  "Other",
];

const externalTeamDisciplineOptions: ProjectExternalTeamDiscipline[] = [
  "Owner",
  "Owner Rep",
  "Client/Bid Solicitor",
  "Architectural",
  "Structural",
  "Civil",
  "Mechanical",
  "Electrical",
  "Plumbing",
  "Fire Protection",
  "Low Voltage/Technology",
  "Security",
  "Landscape",
  "Geotechnical",
  "Interior Design",
  "Food Service",
  "Medical Equipment",
  "Other",
];

const bidTypeOptions: ProjectBidType[] = [
  "HARD_BID",
  "BUDGET",
  "GMP",
  "NEGOTIATED",
  "DESIGN_BUILD",
  "OTHER",
];

const contractTypeOptions: ProjectContractType[] = [
  "LUMP_SUM",
  "COST_PLUS",
  "GMP",
  "UNIT_PRICE",
  "TIME_AND_MATERIAL",
  "OTHER",
];

const bidSubmissionMethodOptions: ProjectBidSubmissionMethod[] = [
  "EMAIL",
  "PORTAL",
  "SEALED_BID",
  "IN_PERSON",
  "OTHER",
];

const documentSourceOptions: ProjectDocumentSource[] = [
  "OWNER",
  "ARCHITECT",
  "CLIENT_PORTAL",
  "EMAIL",
  "SHARED_DRIVE",
  "OTHER",
];

const planReviewStatusOptions: ProjectPlanReviewStatus[] = [
  "NOT_STARTED",
  "IN_PROGRESS",
  "NEEDS_CLARIFICATION",
  "REVIEWED",
];

const marketSectorOptions: MarketSector[] = [
  "Residential",
  "Commercial",
  "Medical",
  "Industrial",
  "Government",
  "Education",
  "Hospitality",
  "Civil",
  "Energy",
  "Other",
];

const complexityLevelOptions: ProjectComplexityLevel[] = [
  "LOW",
  "MODERATE",
  "HIGH",
  "VERY_HIGH",
];

const finishLevelOptions: ProjectFinishLevel[] = [
  "BASIC",
  "STANDARD",
  "HIGH_END",
  "SPECIALTY",
];

const takeoffStatusOptions: ProjectTakeoffStatus[] = [
  "NOT_STARTED",
  "IN_PROGRESS",
  "NEEDS_REVIEW",
  "COMPLETE",
];

const pricingConfidenceOptions: ProjectPricingConfidence[] = [
  "LOW",
  "MEDIUM",
  "HIGH",
];

type ProjectSetupDraft = Partial<
  Pick<
    Project,
    | "name"
    | "client"
    | "address"
    | "city"
    | "state"
    | "zip"
    | "estimator"
    | "status"
    | "planLink"
    | "documentNotes"
    | "subcontractorBidDueDate"
    | "bidReviewDate"
    | "bidDueDate"
    | "internalTeam"
    | "externalTeam"
    | "bidRequirements"
    | "projectDocuments"
    | "projectCharacteristics"
    | "projectScope"
    | "budgetReadiness"
    | "itbInstructions"
  >
>;

type ProjectSetupDraftState = {
  projectId?: string;
  values: ProjectSetupDraft;
};

type ProjectSetupFlowMode = "create" | "edit";

type ProjectSetupFlowProps = {
  mode: ProjectSetupFlowMode;
  project?: Project;
};

type ProjectSetupValidationErrors = {
  name?: string;
  client?: string;
};

type SetupReviewStatus = "complete" | "incomplete" | "optional";

type SetupReadinessRow = {
  stepId: string;
  stepName: string;
  requirement: "required" | "recommended" | "post-invite" | "optional";
  status: SetupReviewStatus;
  summary: string;
  blocking: boolean;
};

type SetupReadinessSummary = {
  rows: SetupReadinessRow[];
  requiredReady: boolean;
  completeRequiredCount: number;
  requiredCount: number;
  warningCount: number;
};

const projectCsiSelectionsStorageKey = "projectCsiSelections";
const projectCsiSelectionsChangeEvent = "projectCsiSelectionsChange";
const projectBidPackagesChangeEvent = "projectBidPackagesChange";
const EMPTY_PROJECT_CSI_SELECTIONS: StoredProjectCsiSelections = {};
let cachedProjectCsiSelectionsStorageValue: string | undefined;
let cachedProjectCsiSelections: StoredProjectCsiSelections =
  EMPTY_PROJECT_CSI_SELECTIONS;
let cachedBidPackagesStorageValue: string | undefined;
let cachedBidPackagesProjectId: string | undefined;
let cachedBidPackages: ProjectBidPackage[] = [];

export default function ProjectSetupFlow({
  mode,
  project: initialProject,
}: ProjectSetupFlowProps) {
  const projectCsiSelections = useProjectCsiSelectionsSnapshot();
  const [localProject, setLocalProject] = useState<Project | null>(null);
  const [draftState, setDraftState] = useState<ProjectSetupDraftState>({
    values: {},
  });
  const [validationErrors, setValidationErrors] =
    useState<ProjectSetupValidationErrors>({});
  const project =
    localProject ??
    initialProject ??
    createUnsavedProject(getCompanySettings().defaultCsiVersion);
  const isCreateMode = mode === "create" && !project.id;
  const projectId = project.id;

  const setupProgress = getProjectSetupProgress(project);
  const setupStatus = getProjectSetupStatus(project);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const normalizedSelectedStepId = selectedStepId
    ? normalizeSetupStepId(selectedStepId)
    : undefined;
  const normalizedProgressStepId = setupProgress.currentStepId
    ? normalizeSetupStepId(setupProgress.currentStepId)
    : undefined;
  const activeStepId =
    normalizedSelectedStepId ?? normalizedProgressStepId ?? defaultStepId;

  const activeStep =
    setupSteps.find((step) => step.id === activeStepId) ?? setupSteps[0];
  const completedStepIds = new Set(
    (setupProgress.completedStepIds ?? []).map(normalizeSetupStepId)
  );
  const completedStepCount = completedStepIds.size;
  const selectedCsiScopeCount = projectId
    ? getProjectCsiScopeCount(projectCsiSelections, projectId)
    : 0;
  const bidPackages = useProjectBidPackagesSnapshot(projectId || "");
  const activeBidPackages = bidPackages.filter(
    (packageRecord) =>
      packageRecord.status !== "CLOSED" && packageRecord.scopeItemIds.length > 0
  );
  const currentProject = project;
  const draftKey = currentProject.id || "new";
  const currentDraft =
    draftState.projectId === draftKey ? draftState.values : {};
  const effectiveProject: Project = { ...currentProject, ...currentDraft };
  const readinessSummary = getSetupReadinessSummary(
    effectiveProject,
    selectedCsiScopeCount,
    activeBidPackages
  );

  function updateDraft<K extends keyof ProjectSetupDraft>(
    field: K,
    value: ProjectSetupDraft[K]
  ) {
    setDraftState((currentValue) => ({
      projectId: draftKey,
      values: {
        ...(currentValue.projectId === currentProject.id
          ? currentValue.values
          : {}),
        [field]: value,
      },
    }));
  }

  function persistProject(nextProject: Project, exitAfterSave = false) {
    if (mode === "create" && !currentProject.id) {
      appendProject(nextProject);
      window.location.assign(`/projects/${nextProject.id}/setup`);
      return;
    }

    saveProject(nextProject);
    if (exitAfterSave) {
      window.location.assign(`/projects/${nextProject.id}`);
      return;
    }

    setLocalProject(nextProject);
    setDraftState({ projectId: nextProject.id, values: {} });
  }

  function buildProjectForSave(nextStepId: string, completedStepIdsForSave?: string[]) {
    const validationResult =
      mode === "create" && !currentProject.id
        ? validateProjectSetupCreateSave(effectiveProject)
        : {};

    setValidationErrors(validationResult);
    if (Object.keys(validationResult).length > 0) return undefined;

    const now = new Date();
    const projectForSave: Project = {
      ...effectiveProject,
      id: effectiveProject.id || createProjectId(),
      archived: effectiveProject.archived ?? false,
      createdDate: effectiveProject.createdDate || now.toISOString().slice(0, 10),
      setupStatus: "IN_PROGRESS",
    };

    return updateProjectSetupProgress(projectForSave, {
      currentStepId: nextStepId,
      completedStepIds: completedStepIdsForSave,
      lastEditedAt: new Date().toISOString(),
    });
  }

  function handleSaveProgress() {
    const nextProject = buildProjectForSave(activeStepId);

    if (nextProject) persistProject(nextProject);
  }

  function handleSaveAndExit() {
    const nextProject = buildProjectForSave(activeStepId);

    if (nextProject) persistProject(nextProject, true);
  }

  function handleMarkStepComplete() {
    const activeStepIndex = setupSteps.findIndex(
      (step) => step.id === activeStepId
    );
    const nextStep = setupSteps[activeStepIndex + 1];
    const nextCompletedStepIds = Array.from(
      new Set([...Array.from(completedStepIds), activeStepId])
    );
    const nextStepId = nextStep?.id ?? activeStepId;
    const nextProject = buildProjectForSave(nextStepId, nextCompletedStepIds);

    if (nextProject) {
      persistProject(nextProject);
      if (currentProject.id) setSelectedStepId(nextStepId);
    }
  }

  function handleMarkReadyForInvites() {
    if (!readinessSummary.requiredReady) return;

    const nextReadyProject = buildProjectForSave(activeStepId);
    if (!nextReadyProject) return;

    const nextProject = {
      ...nextReadyProject,
      setupStatus: "READY_FOR_INVITES" as const,
    };

    persistProject(nextProject);
  }

  return (
    <div className="project-setup-shell">
        <section className="project-setup-hero">
          <div>
            <p className="label-text">
              {isCreateMode ? "Create Project" : "Project Setup"}
            </p>
            <h1>
              {(currentDraft.name ?? currentProject.name) || "Untitled Project"}
            </h1>
            <p className="muted-text">
              {currentDraft.client ?? currentProject.client} -{" "}
              {formatProjectStatus(currentDraft.status ?? currentProject.status)}
            </p>
          </div>
          <div className="project-setup-hero-actions">
            {currentProject.id ? (
              <Link
                href={`/projects/${currentProject.id}/scope`}
                className="button-secondary"
              >
                Open Project Scope
              </Link>
            ) : (
              <span className="button-secondary project-setup-disabled-action">
                Save the project before opening Project Scope.
              </span>
            )}
            <button
              type="button"
              className="button-secondary"
              onClick={handleSaveProgress}
            >
              Save Progress
            </button>
            <button
              type="button"
              className="button-primary"
              onClick={handleSaveAndExit}
            >
              Save & Exit
            </button>
          </div>
        </section>

        <section className="project-setup-status-grid" aria-label="Setup status">
          <div className="project-setup-status-card">
            <span className="label-text">ITB Launch Status</span>
            <strong>{formatSetupStatus(setupStatus)}</strong>
          </div>
          <div className="project-setup-status-card">
            <span className="label-text">Progress</span>
            <strong>
              {completedStepCount} / {setupSteps.length} steps complete
            </strong>
          </div>
          <div className="project-setup-status-card">
            <span className="label-text">Current Step</span>
            <strong>{activeStep.title}</strong>
          </div>
          <div className="project-setup-status-card">
            <span className="label-text">Last Edited</span>
            <strong>{formatLastEdited(setupProgress.lastEditedAt)}</strong>
          </div>
        </section>

        <div className="project-setup-workspace">
          <nav className="project-setup-stepper" aria-label="Setup steps">
            {setupSteps.map((step, index) => {
              const isActive = step.id === activeStep.id;
              const isComplete = completedStepIds.has(step.id);
              const previousStep = setupSteps[index - 1];
              const showGroupLabel =
                index === 0 || previousStep?.group !== step.group;

              return (
                <div key={step.id}>
                  {showGroupLabel ? (
                    <div className="project-setup-step-group">
                      {step.group}
                    </div>
                  ) : null}
                  <button
                    type="button"
                    className={[
                      "project-setup-step",
                      isActive ? "project-setup-step-active" : "",
                      isComplete ? "project-setup-step-complete" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    aria-current={isActive ? "step" : undefined}
                    onClick={() => setSelectedStepId(step.id)}
                  >
                    <span className="project-setup-step-index">
                      {isComplete ? "Done" : index + 1}
                    </span>
                    <span>
                      <span className="project-setup-step-title">
                        {step.title}
                      </span>
                      <span className="project-setup-step-state">
                        {isComplete ? "Complete" : isActive ? "Active" : "Pending"}
                      </span>
                    </span>
                  </button>
                </div>
              );
            })}
          </nav>

          <Panel title={activeStep.title}>
            <div className="project-setup-step-content">
              <p className="muted-text">{activeStep.summary}</p>
              {activeStep.id === "project-basics" ? (
                <ProjectBasicsFields
                  draft={currentDraft}
                  errors={validationErrors}
                  project={currentProject}
                  onChange={updateDraft}
                />
              ) : activeStep.id === "communication-contacts" ? (
                <ProjectCommunicationContactsFields
                  draft={currentDraft}
                  project={currentProject}
                  onChange={updateDraft}
                />
              ) : activeStep.id === "bid-dates-events" ? (
                <ProjectScheduleFields
                  draft={currentDraft}
                  project={currentProject}
                  onChange={updateDraft}
                />
              ) : activeStep.id === "documents-bid-instructions" ? (
                <ProjectDocumentsBidInstructionsFields
                  draft={currentDraft}
                  project={currentProject}
                  onChange={updateDraft}
                />
              ) : activeStep.id === "project-scope-csi" ? (
                <ProjectScopeCsiStep
                  project={currentProject}
                  selectedCsiScopeCount={selectedCsiScopeCount}
                />
              ) : activeStep.id === "bid-packages" ? (
                <ProjectBidPackagesStep
                  project={currentProject}
                  bidPackages={bidPackages}
                  activeBidPackages={activeBidPackages}
                />
              ) : activeStep.id === "extended-internal-team" ? (
                <ProjectInternalTeamFields
                  draft={currentDraft}
                  project={currentProject}
                  onChange={updateDraft}
                />
              ) : activeStep.id === "extended-external-team-rfi-routing" ? (
                <ProjectExternalTeamFields
                  draft={currentDraft}
                  project={currentProject}
                  onChange={updateDraft}
                />
              ) : activeStep.id === "bid-contract-requirements" ? (
                <ProjectBidRequirementsFields
                  draft={currentDraft}
                  project={currentProject}
                  onChange={updateDraft}
                />
              ) : activeStep.id === "plans-characteristics-scope" ? (
                <ProjectPlansCharacteristicsScopeFields
                  draft={currentDraft}
                  project={currentProject}
                  selectedCsiScopeCount={selectedCsiScopeCount}
                  projectSaved={Boolean(currentProject.id)}
                  onChange={updateDraft}
                />
              ) : activeStep.id === "budget-pricing-readiness" ? (
                <ProjectBudgetReadinessFields
                  draft={currentDraft}
                  project={currentProject}
                  onChange={updateDraft}
                />
              ) : activeStep.id === "itb-launch" ? (
                <ProjectReviewLaunchFields
                  project={effectiveProject}
                  readinessSummary={readinessSummary}
                  selectedCsiScopeCount={selectedCsiScopeCount}
                  setupStatus={setupStatus}
                  projectSaved={Boolean(currentProject.id)}
                  onJumpToStep={setSelectedStepId}
                  onMarkReadyForInvites={handleMarkReadyForInvites}
                />
              ) : activeStep.id === "final-setup-review" ? (
                <ProjectFinalSetupReviewFields />
              ) : (
                <div className="project-setup-placeholder">
                  <p className="label-text">Future Fields</p>
                  <p>{getFutureFieldsSummary(activeStep.id)}</p>
                </div>
              )}

              <div className="project-setup-footer-actions">
                <button
                  type="button"
                  className="button-secondary"
                  onClick={handleSaveProgress}
                >
                  Save Progress
                </button>
                <button
                  type="button"
                  className="button-primary"
                  onClick={handleMarkStepComplete}
                >
                  Mark Step Complete
                </button>
              </div>
            </div>
          </Panel>
        </div>
    </div>
  );
}

function useProjectCsiSelectionsSnapshot(): StoredProjectCsiSelections {
  return useSyncExternalStore(
    subscribeToProjectCsiSelectionsStorage,
    getProjectCsiSelectionsSnapshot,
    getServerProjectCsiSelectionsSnapshot
  );
}

function subscribeToProjectCsiSelectionsStorage(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(projectCsiSelectionsChangeEvent, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(projectCsiSelectionsChangeEvent, onStoreChange);
  };
}

function getServerProjectCsiSelectionsSnapshot(): StoredProjectCsiSelections {
  return cachedProjectCsiSelections;
}

function getProjectCsiSelectionsSnapshot(): StoredProjectCsiSelections {
  const storageValue =
    localStorage.getItem(projectCsiSelectionsStorageKey) || "{}";

  if (storageValue !== cachedProjectCsiSelectionsStorageValue) {
    cachedProjectCsiSelectionsStorageValue = storageValue;
    cachedProjectCsiSelections = parseProjectCsiSelections(storageValue);
  }

  return cachedProjectCsiSelections;
}

function useProjectBidPackagesSnapshot(projectId: string): ProjectBidPackage[] {
  return useSyncExternalStore(
    subscribeToProjectBidPackagesStorage,
    () => getProjectBidPackagesSnapshot(projectId),
    getServerProjectBidPackagesSnapshot
  );
}

function subscribeToProjectBidPackagesStorage(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(projectBidPackagesChangeEvent, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(projectBidPackagesChangeEvent, onStoreChange);
  };
}

function getServerProjectBidPackagesSnapshot(): ProjectBidPackage[] {
  return cachedBidPackages;
}

function getProjectBidPackagesSnapshot(projectId: string): ProjectBidPackage[] {
  const storageValue = localStorage.getItem(projectBidPackagesStorageKey) || "[]";

  if (
    storageValue !== cachedBidPackagesStorageValue ||
    projectId !== cachedBidPackagesProjectId
  ) {
    cachedBidPackagesStorageValue = storageValue;
    cachedBidPackagesProjectId = projectId;
    cachedBidPackages = projectId ? getProjectBidPackages(projectId) : [];
  }

  return cachedBidPackages;
}

function parseProjectCsiSelections(
  storageValue: string
): StoredProjectCsiSelections {
  try {
    const parsedValue = JSON.parse(storageValue);
    return parsedValue && typeof parsedValue === "object"
      ? parsedValue
      : EMPTY_PROJECT_CSI_SELECTIONS;
  } catch {
    return EMPTY_PROJECT_CSI_SELECTIONS;
  }
}

function getProjectCsiScopeCount(
  selections: StoredProjectCsiSelections,
  projectId: string
) {
  const selection = selections[projectId];

  return (
    (Array.isArray(selection?.divisionIds) ? selection.divisionIds.length : 0) +
    (Array.isArray(selection?.sectionIds) ? selection.sectionIds.length : 0)
  );
}

function createUnsavedProject(csiVersion: CsiMasterFormatVersion): Project {
  return {
    id: "",
    projectNumber: "",
    name: "",
    client: "",
    estimator: "",
    marketSector: "Commercial",
    projectCategory: "Office",
    projectSubtype: "Corporate Office",
    address: "",
    city: "",
    state: "",
    zip: "",
    squareFootage: undefined,
    projectDurationMonths: undefined,
    deliveryMethod: "",
    ownershipType: "",
    planLink: "",
    documentNotes: "",
    subcontractorBidDueDate: "",
    bidReviewDate: "",
    bidDueDate: "",
    status: "BIDDING",
    archived: false,
    createdDate: "",
    csiVersion,
    setupStatus: "IN_PROGRESS",
    setupProgress: {
      currentStepId: "basics",
      completedStepIds: [],
    },
    itbInstructions: {},
  };
}

function validateProjectSetupCreateSave(
  project: Project
): ProjectSetupValidationErrors {
  return {
    ...(hasText(project.name) ? {} : { name: "Project name is required." }),
    ...(hasText(project.client) ? {} : { client: "Client is required." }),
  };
}

function createProjectId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return Date.now().toString();
}

function normalizeSetupStepId(stepId: string) {
  return legacyStepIdAliases[stepId] ?? stepId;
}

function ProjectBasicsFields({
  draft,
  errors,
  project,
  onChange,
}: {
  draft: ProjectSetupDraft;
  errors: ProjectSetupValidationErrors;
  project: Project;
  onChange: <K extends keyof ProjectSetupDraft>(
    field: K,
    value: ProjectSetupDraft[K]
  ) => void;
}) {
  return (
    <div className="project-setup-field-sections">
      <div className="project-setup-form-card">
        <p className="label-text">Project Identity</p>
        <div className="project-setup-form-grid">
          <label className="form-field">
            Project Name
            <input
              value={draft.name ?? project.name}
              aria-invalid={Boolean(errors.name)}
              onChange={(event) => onChange("name", event.target.value)}
            />
            {errors.name && (
              <span className="new-project-field-error">{errors.name}</span>
            )}
          </label>
          <label className="form-field">
            Client
            <input
              value={draft.client ?? project.client}
              aria-invalid={Boolean(errors.client)}
              onChange={(event) => onChange("client", event.target.value)}
            />
            {errors.client && (
              <span className="new-project-field-error">{errors.client}</span>
            )}
          </label>
          <label className="form-field">
            Estimator
            <input
              value={draft.estimator ?? project.estimator ?? ""}
              onChange={(event) => onChange("estimator", event.target.value)}
            />
          </label>
          <label className="form-field">
            Status
            <select
              value={draft.status ?? project.status}
              onChange={(event) =>
                onChange("status", event.target.value as ProjectStatus)
              }
            >
              {projectStatusOptions.map((status) => (
                <option key={status} value={status}>
                  {formatProjectStatus(status)}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="project-setup-form-card">
        <p className="label-text">Location</p>
        <div className="project-setup-form-grid">
          <label className="form-field project-setup-field-wide">
            Address
            <input
              value={draft.address ?? project.address}
              onChange={(event) => onChange("address", event.target.value)}
            />
          </label>
          <label className="form-field">
            City
            <input
              value={draft.city ?? project.city}
              onChange={(event) => onChange("city", event.target.value)}
            />
          </label>
          <label className="form-field">
            State
            <input
              value={draft.state ?? project.state}
              onChange={(event) => onChange("state", event.target.value)}
            />
          </label>
          <label className="form-field">
            ZIP
            <input
              value={draft.zip ?? project.zip}
              onChange={(event) => onChange("zip", event.target.value)}
            />
          </label>
        </div>
      </div>
    </div>
  );
}

function ProjectScheduleFields({
  draft,
  project,
  onChange,
}: {
  draft: ProjectSetupDraft;
  project: Project;
  onChange: <K extends keyof ProjectSetupDraft>(
    field: K,
    value: ProjectSetupDraft[K]
  ) => void;
}) {
  const itbInstructions = draft.itbInstructions ?? project.itbInstructions ?? {};

  function updateItbInstructions(updates: Partial<ProjectItbInstructions>) {
    onChange("itbInstructions", { ...itbInstructions, ...updates });
  }

  return (
    <div className="project-setup-field-sections">
      <div className="project-setup-form-card">
        <p className="label-text">Bid Milestones</p>
        <div className="project-setup-form-grid">
          <label className="form-field">
            Sub Bid Due Date
            <input
              type="date"
              value={
                draft.subcontractorBidDueDate ??
                project.subcontractorBidDueDate ??
                ""
              }
              onChange={(event) =>
                onChange("subcontractorBidDueDate", event.target.value)
              }
            />
          </label>
          <label className="form-field">
            Bid Review Date
            <input
              type="date"
              value={draft.bidReviewDate ?? project.bidReviewDate ?? ""}
              onChange={(event) => onChange("bidReviewDate", event.target.value)}
            />
          </label>
          <label className="form-field">
            GC Bid Due Date
            <input
              type="date"
              value={draft.bidDueDate ?? project.bidDueDate}
              onChange={(event) => onChange("bidDueDate", event.target.value)}
            />
          </label>
          <label className="form-field project-setup-field-wide">
            Site Walk / Pre-Bid Instructions
            <textarea
              rows={3}
              value={itbInstructions.siteWalkInstructions ?? ""}
              onChange={(event) =>
                updateItbInstructions({
                  siteWalkInstructions: event.target.value,
                })
              }
            />
          </label>
        </div>
      </div>
    </div>
  );
}

function ProjectCommunicationContactsFields({
  draft,
  project,
  onChange,
}: {
  draft: ProjectSetupDraft;
  project: Project;
  onChange: <K extends keyof ProjectSetupDraft>(
    field: K,
    value: ProjectSetupDraft[K]
  ) => void;
}) {
  const itbInstructions = draft.itbInstructions ?? project.itbInstructions ?? {};

  function updateItbInstructions(updates: Partial<ProjectItbInstructions>) {
    onChange("itbInstructions", { ...itbInstructions, ...updates });
  }

  return (
    <div className="project-setup-field-sections">
      <div className="project-setup-form-card">
        <p className="label-text">ITB Communication Contacts</p>
        <p className="muted-text">
          For launch readiness, make sure there is an estimator or internal bid
          contact and enough client/RFI context for subcontractors to respond.
          Full team permissions can be finished after ITBs are sent.
        </p>
        <div className="project-setup-form-grid" style={{ marginTop: 16 }}>
          <label className="form-field">
            Reply-To Name
            <input
              value={itbInstructions.replyToName ?? ""}
              onChange={(event) =>
                updateItbInstructions({ replyToName: event.target.value })
              }
            />
          </label>
          <label className="form-field">
            Reply-To Email
            <input
              type="email"
              value={itbInstructions.replyToEmail ?? ""}
              onChange={(event) =>
                updateItbInstructions({ replyToEmail: event.target.value })
              }
            />
          </label>
          <label className="form-field">
            Reply-To Phone
            <input
              value={itbInstructions.replyToPhone ?? ""}
              onChange={(event) =>
                updateItbInstructions({ replyToPhone: event.target.value })
              }
            />
          </label>
          <label className="form-field project-setup-field-wide">
            RFI Instructions
            <textarea
              rows={3}
              value={itbInstructions.rfiInstructions ?? ""}
              onChange={(event) =>
                updateItbInstructions({ rfiInstructions: event.target.value })
              }
            />
          </label>
        </div>
      </div>
      <ProjectInternalTeamFields
        draft={draft}
        project={project}
        onChange={onChange}
      />
      <ProjectExternalTeamFields
        draft={draft}
        project={project}
        onChange={onChange}
      />
    </div>
  );
}

function ProjectInternalTeamFields({
  draft,
  project,
  onChange,
}: {
  draft: ProjectSetupDraft;
  project: Project;
  onChange: <K extends keyof ProjectSetupDraft>(
    field: K,
    value: ProjectSetupDraft[K]
  ) => void;
}) {
  const team = draft.internalTeam ?? project.internalTeam ?? [];

  function updateTeamMember(
    index: number,
    updates: Partial<ProjectInternalTeamMember>
  ) {
    onChange(
      "internalTeam",
      team.map((member, memberIndex) =>
        memberIndex === index ? { ...member, ...updates } : member
      )
    );
  }

  function addTeamMember() {
    onChange("internalTeam", [
      ...team,
      {
        id: createSetupRowId("internal-team"),
        name: "",
        role: "Estimator",
        email: "",
        phone: "",
        isPrimaryContact: false,
        canReviewBids: false,
        canSendInvites: false,
        notes: "",
      },
    ]);
  }

  function removeTeamMember(index: number) {
    onChange(
      "internalTeam",
      team.filter((_, memberIndex) => memberIndex !== index)
    );
  }

  return (
    <div className="project-setup-field-sections">
      <div className="project-setup-form-card">
        <div className="project-setup-card-header">
          <div>
            <p className="label-text">GC Team</p>
            <p className="muted-text">
              Company settings defaults will later prefill this team.
            </p>
          </div>
          <button
            type="button"
            className="button-secondary"
            onClick={addTeamMember}
          >
            Add Team Member
          </button>
        </div>

        {team.length === 0 ? (
          <p className="project-setup-empty-note">
            No internal team members have been added yet.
          </p>
        ) : (
          <div className="project-setup-row-list">
            {team.map((member, index) => (
              <div className="project-setup-edit-row" key={member.id}>
                <div className="project-setup-row-header">
                  <strong>{member.name || `Team Member ${index + 1}`}</strong>
                  <button
                    type="button"
                    className="button-danger"
                    onClick={() => removeTeamMember(index)}
                  >
                    Remove
                  </button>
                </div>
                <div className="project-setup-form-grid">
                  <label className="form-field">
                    Name
                    <input
                      value={member.name ?? ""}
                      onChange={(event) =>
                        updateTeamMember(index, { name: event.target.value })
                      }
                    />
                  </label>
                  <label className="form-field">
                    Role
                    <select
                      value={member.role ?? ""}
                      onChange={(event) =>
                        updateTeamMember(index, {
                          role: normalizeInternalTeamRole(event.target.value),
                        })
                      }
                    >
                      <option value="">Select role</option>
                      {internalTeamRoleOptions.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="form-field">
                    Email
                    <input
                      type="email"
                      value={member.email ?? ""}
                      onChange={(event) =>
                        updateTeamMember(index, { email: event.target.value })
                      }
                    />
                  </label>
                  <label className="form-field">
                    Phone
                    <input
                      value={member.phone ?? ""}
                      onChange={(event) =>
                        updateTeamMember(index, { phone: event.target.value })
                      }
                    />
                  </label>
                </div>
                <div className="project-setup-toggle-row">
                  <ToggleField
                    checked={member.isPrimaryContact ?? false}
                    label="Primary Contact"
                    onChange={(value) =>
                      updateTeamMember(index, { isPrimaryContact: value })
                    }
                  />
                  <ToggleField
                    checked={member.canReviewBids ?? false}
                    label="Can Review Bids"
                    onChange={(value) =>
                      updateTeamMember(index, { canReviewBids: value })
                    }
                  />
                  <ToggleField
                    checked={member.canSendInvites ?? false}
                    label="Can Send Invites"
                    onChange={(value) =>
                      updateTeamMember(index, { canSendInvites: value })
                    }
                  />
                </div>
                <label className="form-field">
                  Notes
                  <textarea
                    rows={2}
                    value={member.notes ?? ""}
                    onChange={(event) =>
                      updateTeamMember(index, { notes: event.target.value })
                    }
                  />
                </label>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProjectDocumentsBidInstructionsFields({
  draft,
  project,
  onChange,
}: {
  draft: ProjectSetupDraft;
  project: Project;
  onChange: <K extends keyof ProjectSetupDraft>(
    field: K,
    value: ProjectSetupDraft[K]
  ) => void;
}) {
  const documents = draft.projectDocuments ?? project.projectDocuments ?? {};
  const itbInstructions = draft.itbInstructions ?? project.itbInstructions ?? {};

  function updateDocuments(updates: Partial<ProjectDocuments>) {
    onChange("projectDocuments", { ...documents, ...updates });
  }

  function updateItbInstructions(updates: Partial<ProjectItbInstructions>) {
    onChange("itbInstructions", { ...itbInstructions, ...updates });
  }

  return (
    <div className="project-setup-field-sections">
      <div className="project-setup-form-card">
        <p className="label-text">Documents / Bid Instructions</p>
        <p className="muted-text">
          Capture the document access and bid instructions needed for a credible
          ITB. Detailed project characteristics can be completed later.
        </p>
        <div className="project-setup-form-grid">
          <label className="form-field">
            Plans Link
            <input
              value={documents.plansLink ?? draft.planLink ?? project.planLink ?? ""}
              onChange={(event) =>
                updateDocuments({ plansLink: event.target.value })
              }
            />
          </label>
          <label className="form-field">
            Specs Link
            <input
              value={documents.specsLink ?? ""}
              onChange={(event) =>
                updateDocuments({ specsLink: event.target.value })
              }
            />
          </label>
          <label className="form-field">
            Addenda Link
            <input
              value={documents.addendaLink ?? ""}
              onChange={(event) =>
                updateDocuments({ addendaLink: event.target.value })
              }
            />
          </label>
          <label className="form-field">
            Bid Form Link
            <input
              value={documents.bidFormLink ?? ""}
              onChange={(event) =>
                updateDocuments({ bidFormLink: event.target.value })
              }
            />
          </label>
          <label className="form-field">
            Drawing Date
            <input
              type="date"
              value={documents.drawingDate ?? ""}
              onChange={(event) =>
                updateDocuments({ drawingDate: event.target.value })
              }
            />
          </label>
          <label className="form-field">
            Drawing Set Name
            <input
              value={documents.drawingSetName ?? ""}
              onChange={(event) =>
                updateDocuments({ drawingSetName: event.target.value })
              }
            />
          </label>
          <label className="form-field project-setup-field-wide">
            Document Access / Bid Instructions
            <textarea
              rows={3}
              value={
                itbInstructions.documentAccessInstructions ??
                draft.documentNotes ??
                project.documentNotes ??
                ""
              }
              onChange={(event) =>
                updateItbInstructions({
                  documentAccessInstructions: event.target.value,
                })
              }
            />
          </label>
          <label className="form-field project-setup-field-wide">
            Bid Submission Instructions
            <textarea
              rows={3}
              value={itbInstructions.bidSubmissionInstructions ?? ""}
              onChange={(event) =>
                updateItbInstructions({
                  bidSubmissionInstructions: event.target.value,
                })
              }
            />
          </label>
          <label className="form-field project-setup-field-wide">
            Special Instructions
            <textarea
              rows={3}
              value={itbInstructions.specialInstructions ?? ""}
              onChange={(event) =>
                updateItbInstructions({ specialInstructions: event.target.value })
              }
            />
          </label>
        </div>
      </div>
    </div>
  );
}

function ProjectScopeCsiStep({
  project,
  selectedCsiScopeCount,
}: {
  project: Project;
  selectedCsiScopeCount: number;
}) {
  return (
    <div className="project-setup-field-sections">
      <div className="project-setup-form-card">
        <div className="project-setup-card-header">
          <div>
            <p className="label-text">Project Scope / CSI</p>
            <h3>{selectedCsiScopeCount} selected CSI scope(s)</h3>
            <p className="muted-text">
              CSI scope selection remains on the dedicated Project Scope page.
              These scopes drive Bid Packages, invite matching, and bid leveling.
            </p>
          </div>
          {project.id ? (
            <Link href={`/projects/${project.id}/scope`} className="button-primary">
              Open Project Scope
            </Link>
          ) : (
            <span className="button-secondary project-setup-disabled-action">
              Save the project before opening Project Scope.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function ProjectBidPackagesStep({
  project,
  bidPackages,
  activeBidPackages,
}: {
  project: Project;
  bidPackages: ProjectBidPackage[];
  activeBidPackages: ProjectBidPackage[];
}) {
  const mappedScopeCount = activeBidPackages.reduce(
    (total, packageRecord) => total + packageRecord.scopeItemIds.length,
    0
  );

  return (
    <div className="project-setup-field-sections">
      <div className="project-setup-form-card">
        <div className="project-setup-card-header">
          <div>
            <p className="label-text">Bid Packages</p>
            <h3>{activeBidPackages.length} active bid package(s)</h3>
            <p className="muted-text">
              Bid Packages are the estimator-facing groups that will be invited
              and leveled. At least one active package with mapped CSI scopes is
              required for ITB launch readiness.
            </p>
          </div>
          {project.id ? (
            <Link href={`/projects/${project.id}/scope`} className="button-primary">
              Manage Bid Packages
            </Link>
          ) : (
            <span className="button-secondary project-setup-disabled-action">
              Save the project before managing Bid Packages.
            </span>
          )}
        </div>
        <div className="badge-list">
          <span className="badge badge-muted">{bidPackages.length} total</span>
          <span className="badge badge-muted">
            {mappedScopeCount} mapped CSI scope(s)
          </span>
        </div>
        {activeBidPackages.length === 0 ? (
          <div className="project-setup-review-callout">
            <strong>No active Bid Packages are ready.</strong>
            <p className="muted-text">
              Open Project Scope, generate packages from selected CSI scopes, or
              add packages manually.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ProjectExternalTeamFields({
  draft,
  project,
  onChange,
}: {
  draft: ProjectSetupDraft;
  project: Project;
  onChange: <K extends keyof ProjectSetupDraft>(
    field: K,
    value: ProjectSetupDraft[K]
  ) => void;
}) {
  const team = draft.externalTeam ?? project.externalTeam ?? [];

  function updateTeamContact(
    index: number,
    updates: Partial<ProjectExternalTeamContact>
  ) {
    onChange(
      "externalTeam",
      team.map((contact, contactIndex) =>
        contactIndex === index ? { ...contact, ...updates } : contact
      )
    );
  }

  function addTeamContact() {
    onChange("externalTeam", [
      ...team,
      {
        id: createSetupRowId("external-team"),
        firmName: "",
        contactName: "",
        discipline: "Owner",
        email: "",
        phone: "",
        isDefaultRfiRecipient: false,
        isDefaultCc: false,
        notes: "",
      },
    ]);
  }

  function removeTeamContact(index: number) {
    onChange(
      "externalTeam",
      team.filter((_, contactIndex) => contactIndex !== index)
    );
  }

  return (
    <div className="project-setup-field-sections">
      <div className="project-setup-form-card">
        <div className="project-setup-card-header">
          <div>
            <p className="label-text">External Contacts</p>
            <p className="muted-text">
              Track owner, client, design, and consultant contacts for RFI and
              bid communication routing.
            </p>
          </div>
          <button
            type="button"
            className="button-secondary"
            onClick={addTeamContact}
          >
            Add Contact
          </button>
        </div>

        {team.length === 0 ? (
          <p className="project-setup-empty-note">
            No external contacts have been added yet.
          </p>
        ) : (
          <div className="project-setup-row-list">
            {team.map((contact, index) => (
              <div className="project-setup-edit-row" key={contact.id}>
                <div className="project-setup-row-header">
                  <strong>
                    {contact.contactName ||
                      contact.firmName ||
                      `External Contact ${index + 1}`}
                  </strong>
                  <button
                    type="button"
                    className="button-danger"
                    onClick={() => removeTeamContact(index)}
                  >
                    Remove
                  </button>
                </div>
                <div className="project-setup-form-grid">
                  <label className="form-field">
                    Firm Name
                    <input
                      value={contact.firmName ?? ""}
                      onChange={(event) =>
                        updateTeamContact(index, {
                          firmName: event.target.value,
                        })
                      }
                    />
                  </label>
                  <label className="form-field">
                    Contact Name
                    <input
                      value={contact.contactName ?? ""}
                      onChange={(event) =>
                        updateTeamContact(index, {
                          contactName: event.target.value,
                        })
                      }
                    />
                  </label>
                  <label className="form-field">
                    Discipline
                    <select
                      value={contact.discipline ?? ""}
                      onChange={(event) =>
                        updateTeamContact(index, {
                          discipline: normalizeExternalTeamDiscipline(
                            event.target.value
                          ),
                        })
                      }
                    >
                      <option value="">Select discipline</option>
                      {externalTeamDisciplineOptions.map((discipline) => (
                        <option key={discipline} value={discipline}>
                          {discipline}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="form-field">
                    Email
                    <input
                      type="email"
                      value={contact.email ?? ""}
                      onChange={(event) =>
                        updateTeamContact(index, { email: event.target.value })
                      }
                    />
                  </label>
                  <label className="form-field">
                    Phone
                    <input
                      value={contact.phone ?? ""}
                      onChange={(event) =>
                        updateTeamContact(index, { phone: event.target.value })
                      }
                    />
                  </label>
                </div>
                <div className="project-setup-toggle-row">
                  <ToggleField
                    checked={contact.isDefaultRfiRecipient ?? false}
                    label="Default RFI Recipient"
                    onChange={(value) =>
                      updateTeamContact(index, {
                        isDefaultRfiRecipient: value,
                      })
                    }
                  />
                  <ToggleField
                    checked={contact.isDefaultCc ?? false}
                    label="Default CC"
                    onChange={(value) =>
                      updateTeamContact(index, { isDefaultCc: value })
                    }
                  />
                </div>
                <label className="form-field">
                  Notes
                  <textarea
                    rows={2}
                    value={contact.notes ?? ""}
                    onChange={(event) =>
                      updateTeamContact(index, { notes: event.target.value })
                    }
                  />
                </label>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProjectBidRequirementsFields({
  draft,
  project,
  onChange,
}: {
  draft: ProjectSetupDraft;
  project: Project;
  onChange: <K extends keyof ProjectSetupDraft>(
    field: K,
    value: ProjectSetupDraft[K]
  ) => void;
}) {
  const requirements = draft.bidRequirements ?? project.bidRequirements ?? {};

  function updateRequirements(updates: Partial<ProjectBidRequirements>) {
    onChange("bidRequirements", { ...requirements, ...updates });
  }

  return (
    <div className="project-setup-field-sections">
      <div className="project-setup-form-card">
        <p className="label-text">Bid Structure</p>
        <div className="project-setup-form-grid">
          <label className="form-field">
            Bid Type
            <select
              value={requirements.bidType ?? ""}
              onChange={(event) =>
                updateRequirements({
                  bidType: normalizeBidType(event.target.value),
                })
              }
            >
              <option value="">Select bid type</option>
              {bidTypeOptions.map((bidType) => (
                <option key={bidType} value={bidType}>
                  {formatSetupStatus(bidType)}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field">
            Contract Type
            <select
              value={requirements.contractType ?? ""}
              onChange={(event) =>
                updateRequirements({
                  contractType: normalizeContractType(event.target.value),
                })
              }
            >
              <option value="">Select contract type</option>
              {contractTypeOptions.map((contractType) => (
                <option key={contractType} value={contractType}>
                  {formatSetupStatus(contractType)}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field">
            Submission Method
            <select
              value={requirements.bidSubmissionMethod ?? ""}
              onChange={(event) =>
                updateRequirements({
                  bidSubmissionMethod: normalizeBidSubmissionMethod(
                    event.target.value
                  ),
                })
              }
            >
              <option value="">Select method</option>
              {bidSubmissionMethodOptions.map((method) => (
                <option key={method} value={method}>
                  {formatSetupStatus(method)}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field">
            Liquidated Damages
            <input
              value={requirements.liquidatedDamages ?? ""}
              onChange={(event) =>
                updateRequirements({ liquidatedDamages: event.target.value })
              }
            />
          </label>
          <label className="form-field">
            Retainage Percent
            <input
              inputMode="decimal"
              value={formatOptionalNumber(requirements.retainagePercent)}
              onChange={(event) =>
                updateRequirements({
                  retainagePercent: parseOptionalNumber(event.target.value),
                })
              }
            />
          </label>
          <label className="form-field">
            Required Bids Per Scope
            <input
              inputMode="numeric"
              value={formatOptionalNumber(requirements.requiredBidsPerScope)}
              onChange={(event) =>
                updateRequirements({
                  requiredBidsPerScope: parseOptionalNumber(event.target.value),
                })
              }
            />
          </label>
        </div>
      </div>

      <div className="project-setup-form-card">
        <p className="label-text">Requirements</p>
        <div className="project-setup-toggle-row project-setup-toggle-grid">
          <ToggleField
            checked={requirements.bidBondRequired ?? false}
            label="Bid Bond Required"
            onChange={(value) => updateRequirements({ bidBondRequired: value })}
          />
          <ToggleField
            checked={requirements.performanceBondRequired ?? false}
            label="Performance Bond Required"
            onChange={(value) =>
              updateRequirements({ performanceBondRequired: value })
            }
          />
          <ToggleField
            checked={requirements.paymentBondRequired ?? false}
            label="Payment Bond Required"
            onChange={(value) =>
              updateRequirements({ paymentBondRequired: value })
            }
          />
          <ToggleField
            checked={requirements.prevailingWageRequired ?? false}
            label="Prevailing Wage Required"
            onChange={(value) =>
              updateRequirements({ prevailingWageRequired: value })
            }
          />
          <ToggleField
            checked={requirements.davisBaconRequired ?? false}
            label="Davis-Bacon Required"
            onChange={(value) =>
              updateRequirements({ davisBaconRequired: value })
            }
          />
          <ToggleField
            checked={requirements.certifiedPayrollRequired ?? false}
            label="Certified Payroll Required"
            onChange={(value) =>
              updateRequirements({ certifiedPayrollRequired: value })
            }
          />
          <ToggleField
            checked={requirements.taxExempt ?? false}
            label="Tax Exempt"
            onChange={(value) => updateRequirements({ taxExempt: value })}
          />
          <ToggleField
            checked={requirements.alternatesRequired ?? false}
            label="Alternates Required"
            onChange={(value) =>
              updateRequirements({ alternatesRequired: value })
            }
          />
          <ToggleField
            checked={requirements.allowancesRequired ?? false}
            label="Allowances Required"
            onChange={(value) =>
              updateRequirements({ allowancesRequired: value })
            }
          />
          <ToggleField
            checked={requirements.unitPricesRequired ?? false}
            label="Unit Prices Required"
            onChange={(value) =>
              updateRequirements({ unitPricesRequired: value })
            }
          />
          <ToggleField
            checked={requirements.qualificationsAllowed ?? false}
            label="Qualifications Allowed"
            onChange={(value) =>
              updateRequirements({ qualificationsAllowed: value })
            }
          />
        </div>
      </div>
    </div>
  );
}

function ProjectPlansCharacteristicsScopeFields({
  draft,
  project,
  selectedCsiScopeCount,
  projectSaved,
  onChange,
}: {
  draft: ProjectSetupDraft;
  project: Project;
  selectedCsiScopeCount: number;
  projectSaved: boolean;
  onChange: <K extends keyof ProjectSetupDraft>(
    field: K,
    value: ProjectSetupDraft[K]
  ) => void;
}) {
  const documents = draft.projectDocuments ?? project.projectDocuments ?? {};
  const characteristics =
    draft.projectCharacteristics ?? project.projectCharacteristics ?? {};
  const projectScope = draft.projectScope ?? project.projectScope ?? {};

  function updateDocuments(updates: Partial<ProjectDocuments>) {
    onChange("projectDocuments", { ...documents, ...updates });
  }

  function updateCharacteristics(updates: Partial<ProjectCharacteristics>) {
    onChange("projectCharacteristics", { ...characteristics, ...updates });
  }

  function updateScope(updates: Partial<ProjectScopeSetup>) {
    onChange("projectScope", { ...projectScope, ...updates });
  }

  return (
    <div className="project-setup-field-sections">
      <div className="project-setup-form-card">
        <p className="label-text">Documents</p>
        <div className="project-setup-form-grid">
          <label className="form-field">
            Plans Link
            <input
              value={documents.plansLink ?? ""}
              onChange={(event) =>
                updateDocuments({ plansLink: event.target.value })
              }
            />
          </label>
          <label className="form-field">
            Specs Link
            <input
              value={documents.specsLink ?? ""}
              onChange={(event) =>
                updateDocuments({ specsLink: event.target.value })
              }
            />
          </label>
          <label className="form-field">
            Addenda Link
            <input
              value={documents.addendaLink ?? ""}
              onChange={(event) =>
                updateDocuments({ addendaLink: event.target.value })
              }
            />
          </label>
          <label className="form-field">
            Bid Form Link
            <input
              value={documents.bidFormLink ?? ""}
              onChange={(event) =>
                updateDocuments({ bidFormLink: event.target.value })
              }
            />
          </label>
          <label className="form-field">
            Drawing Date
            <input
              type="date"
              value={documents.drawingDate ?? ""}
              onChange={(event) =>
                updateDocuments({ drawingDate: event.target.value })
              }
            />
          </label>
          <label className="form-field">
            Drawing Set Name
            <input
              value={documents.drawingSetName ?? ""}
              onChange={(event) =>
                updateDocuments({ drawingSetName: event.target.value })
              }
            />
          </label>
          <label className="form-field">
            Drawing Set Version
            <input
              value={documents.drawingSetVersion ?? ""}
              onChange={(event) =>
                updateDocuments({ drawingSetVersion: event.target.value })
              }
            />
          </label>
          <label className="form-field">
            Last Addendum Received
            <input
              type="date"
              value={documents.lastAddendumReceived ?? ""}
              onChange={(event) =>
                updateDocuments({ lastAddendumReceived: event.target.value })
              }
            />
          </label>
          <label className="form-field">
            Document Source
            <select
              value={documents.documentSource ?? ""}
              onChange={(event) =>
                updateDocuments({
                  documentSource: normalizeDocumentSource(event.target.value),
                })
              }
            >
              <option value="">Select source</option>
              {documentSourceOptions.map((source) => (
                <option key={source} value={source}>
                  {formatSetupStatus(source)}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field">
            Plan Review Status
            <select
              value={documents.planReviewStatus ?? ""}
              onChange={(event) =>
                updateDocuments({
                  planReviewStatus: normalizePlanReviewStatus(
                    event.target.value
                  ),
                })
              }
            >
              <option value="">Select status</option>
              {planReviewStatusOptions.map((status) => (
                <option key={status} value={status}>
                  {formatSetupStatus(status)}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="project-setup-form-card">
        <p className="label-text">Project Characteristics</p>
        <div className="project-setup-form-grid">
          <label className="form-field">
            Market Sector
            <select
              value={characteristics.marketSector ?? ""}
              onChange={(event) =>
                updateCharacteristics({
                  marketSector: normalizeMarketSector(event.target.value),
                })
              }
            >
              <option value="">Select sector</option>
              {marketSectorOptions.map((sector) => (
                <option key={sector} value={sector}>
                  {sector}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field">
            Building Type
            <input
              value={characteristics.buildingType ?? ""}
              onChange={(event) =>
                updateCharacteristics({ buildingType: event.target.value })
              }
            />
          </label>
          <label className="form-field">
            Work Type
            <input
              value={characteristics.workType ?? ""}
              onChange={(event) =>
                updateCharacteristics({ workType: event.target.value })
              }
            />
          </label>
          <label className="form-field">
            Construction Type
            <input
              value={characteristics.constructionType ?? ""}
              onChange={(event) =>
                updateCharacteristics({ constructionType: event.target.value })
              }
            />
          </label>
          <label className="form-field">
            Square Footage
            <input
              inputMode="numeric"
              value={formatOptionalNumber(characteristics.squareFootage)}
              onChange={(event) =>
                updateCharacteristics({
                  squareFootage: parseOptionalNumber(event.target.value),
                })
              }
            />
          </label>
          <label className="form-field">
            Stories
            <input
              inputMode="numeric"
              value={formatOptionalNumber(characteristics.stories)}
              onChange={(event) =>
                updateCharacteristics({
                  stories: parseOptionalNumber(event.target.value),
                })
              }
            />
          </label>
          <label className="form-field">
            Complexity Level
            <select
              value={characteristics.complexityLevel ?? ""}
              onChange={(event) =>
                updateCharacteristics({
                  complexityLevel: normalizeComplexityLevel(event.target.value),
                })
              }
            >
              <option value="">Select complexity</option>
              {complexityLevelOptions.map((level) => (
                <option key={level} value={level}>
                  {formatSetupStatus(level)}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field">
            Finish Level
            <select
              value={characteristics.finishLevel ?? ""}
              onChange={(event) =>
                updateCharacteristics({
                  finishLevel: normalizeFinishLevel(event.target.value),
                })
              }
            >
              <option value="">Select finish level</option>
              {finishLevelOptions.map((level) => (
                <option key={level} value={level}>
                  {formatSetupStatus(level)}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field project-setup-field-wide">
            Access Constraints
            <textarea
              rows={2}
              value={characteristics.accessConstraints ?? ""}
              onChange={(event) =>
                updateCharacteristics({ accessConstraints: event.target.value })
              }
            />
          </label>
          <label className="form-field project-setup-field-wide">
            Special Conditions
            <textarea
              rows={2}
              value={characteristics.specialConditions ?? ""}
              onChange={(event) =>
                updateCharacteristics({ specialConditions: event.target.value })
              }
            />
          </label>
        </div>
        <div className="project-setup-toggle-row project-setup-toggle-grid">
          <ToggleField
            checked={characteristics.isOccupiedFacility ?? false}
            label="Occupied Facility"
            onChange={(value) =>
              updateCharacteristics({ isOccupiedFacility: value })
            }
          />
          <ToggleField
            checked={characteristics.isExistingBuilding ?? false}
            label="Existing Building"
            onChange={(value) =>
              updateCharacteristics({ isExistingBuilding: value })
            }
          />
          <ToggleField
            checked={characteristics.phasingRequired ?? false}
            label="Phasing Required"
            onChange={(value) =>
              updateCharacteristics({ phasingRequired: value })
            }
          />
          <ToggleField
            checked={characteristics.afterHoursWorkRequired ?? false}
            label="After-Hours Work Required"
            onChange={(value) =>
              updateCharacteristics({ afterHoursWorkRequired: value })
            }
          />
        </div>
      </div>

      <div className="project-setup-form-card">
        <div className="project-setup-card-header">
          <div>
            <p className="label-text">Project Scope</p>
            <p className="muted-text">
              {selectedCsiScopeCount} CSI scopes selected for this project.
            </p>
          </div>
          {projectSaved ? (
            <Link href={`/projects/${project.id}/scope`} className="button-secondary">
              Open Project Scope
            </Link>
          ) : (
            <span className="button-secondary project-setup-disabled-action">
              Save the project before opening Project Scope.
            </span>
          )}
        </div>
        <div className="project-setup-form-grid">
          <ListTextareaField
            label="Bid Packages"
            value={projectScope.bidPackages}
            onChange={(value) => updateScope({ bidPackages: value })}
          />
          <ListTextareaField
            label="Alternates"
            value={projectScope.alternates}
            onChange={(value) => updateScope({ alternates: value })}
          />
          <ListTextareaField
            label="Allowances"
            value={projectScope.allowances}
            onChange={(value) => updateScope({ allowances: value })}
          />
          <ListTextareaField
            label="Unit Prices"
            value={projectScope.unitPrices}
            onChange={(value) => updateScope({ unitPrices: value })}
          />
          <ListTextareaField
            label="Excluded Scopes"
            value={projectScope.excludedScopes}
            onChange={(value) => updateScope({ excludedScopes: value })}
          />
          <ListTextareaField
            label="Owner Direct Scopes"
            value={projectScope.ownerDirectScopes}
            onChange={(value) => updateScope({ ownerDirectScopes: value })}
          />
          <ListTextareaField
            label="GC Self-Perform Scopes"
            value={projectScope.gcSelfPerformScopes}
            onChange={(value) => updateScope({ gcSelfPerformScopes: value })}
          />
          <label className="form-field">
            Takeoff Status
            <select
              value={projectScope.takeoffStatus ?? ""}
              onChange={(event) =>
                updateScope({
                  takeoffStatus: normalizeTakeoffStatus(event.target.value),
                })
              }
            >
              <option value="">Select status</option>
              {takeoffStatusOptions.map((status) => (
                <option key={status} value={status}>
                  {formatSetupStatus(status)}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
    </div>
  );
}

function ProjectBudgetReadinessFields({
  draft,
  project,
  onChange,
}: {
  draft: ProjectSetupDraft;
  project: Project;
  onChange: <K extends keyof ProjectSetupDraft>(
    field: K,
    value: ProjectSetupDraft[K]
  ) => void;
}) {
  const budgetReadiness =
    draft.budgetReadiness ?? project.budgetReadiness ?? {};

  function updateBudgetReadiness(updates: Partial<ProjectBudgetReadiness>) {
    onChange("budgetReadiness", { ...budgetReadiness, ...updates });
  }

  return (
    <div className="project-setup-field-sections">
      <div className="project-setup-inline-cta">
        <div>
          <strong>Pricing readiness is a placeholder.</strong>
          <p className="muted-text">
            Budgeting becomes useful after takeoffs, historical pricing, or ROM
            assumptions are available.
          </p>
        </div>
      </div>

      <div className="project-setup-form-card">
        <p className="label-text">Budget Readiness</p>
        <div className="project-setup-form-grid">
          <label className="form-field">
            Owner Budget
            <input
              inputMode="decimal"
              value={formatOptionalNumber(budgetReadiness.ownerBudget)}
              onChange={(event) =>
                updateBudgetReadiness({
                  ownerBudget: parseOptionalNumber(event.target.value),
                })
              }
            />
          </label>
          <label className="form-field">
            Target Budget
            <input
              inputMode="decimal"
              value={formatOptionalNumber(budgetReadiness.targetBudget)}
              onChange={(event) =>
                updateBudgetReadiness({
                  targetBudget: parseOptionalNumber(event.target.value),
                })
              }
            />
          </label>
          <label className="form-field">
            ROM Estimate
            <input
              inputMode="decimal"
              value={formatOptionalNumber(budgetReadiness.romEstimate)}
              onChange={(event) =>
                updateBudgetReadiness({
                  romEstimate: parseOptionalNumber(event.target.value),
                })
              }
            />
          </label>
          <label className="form-field">
            Pricing Confidence
            <select
              value={budgetReadiness.pricingConfidence ?? ""}
              onChange={(event) =>
                updateBudgetReadiness({
                  pricingConfidence: normalizePricingConfidence(
                    event.target.value
                  ),
                })
              }
            >
              <option value="">Select confidence</option>
              {pricingConfidenceOptions.map((confidence) => (
                <option key={confidence} value={confidence}>
                  {formatSetupStatus(confidence)}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field project-setup-field-wide">
            Notes
            <textarea
              rows={3}
              value={budgetReadiness.notes ?? ""}
              onChange={(event) =>
                updateBudgetReadiness({ notes: event.target.value })
              }
            />
          </label>
        </div>
      </div>
    </div>
  );
}

function ProjectFinalSetupReviewFields() {
  return (
    <div className="project-setup-field-sections">
      <div className="project-setup-form-card">
        <p className="label-text">Final Setup Review</p>
        <h3>Post-invite setup can continue after ITBs are launched.</h3>
        <p className="muted-text">
          Use this stage to finish non-blocking project details such as extended
          characteristics, full team routing, contract requirements, and budget
          readiness. ITB Launch Ready does not mean every setup detail is
          complete.
        </p>
      </div>
    </div>
  );
}

function ProjectReviewLaunchFields({
  project,
  readinessSummary,
  selectedCsiScopeCount,
  setupStatus,
  projectSaved,
  onJumpToStep,
  onMarkReadyForInvites,
}: {
  project: Project;
  readinessSummary: SetupReadinessSummary;
  selectedCsiScopeCount: number;
  setupStatus: string;
  projectSaved: boolean;
  onJumpToStep: (stepId: string) => void;
  onMarkReadyForInvites: () => void;
}) {
  const inviteReady =
    projectSaved &&
    (setupStatus === "READY_FOR_INVITES" || readinessSummary.requiredReady);
  const blockingRows = readinessSummary.rows.filter((row) => row.blocking);
  const requiredRows = readinessSummary.rows.filter(
    (row) => row.requirement === "required"
  );
  const recommendedRows = readinessSummary.rows.filter(
    (row) => row.requirement === "recommended"
  );
  const postInviteRows = readinessSummary.rows.filter(
    (row) => row.requirement === "post-invite" || row.requirement === "optional"
  );

  return (
    <div className="project-setup-field-sections">
      <div className="project-setup-form-card">
        <div className="project-setup-card-header">
          <div>
            <p className="label-text">ITB Launch Readiness</p>
            <h3 className="project-setup-review-title">
              {readinessSummary.requiredReady
                ? "Required ITB launch information is ready"
                : "Required ITB launch information needs attention"}
            </h3>
            <p className="muted-text">
              This means the project has enough information to send ITBs. Full
              project setup can continue after invites are sent.{" "}
              {readinessSummary.completeRequiredCount} /{" "}
              {readinessSummary.requiredCount} required ITB areas complete.{" "}
              {readinessSummary.warningCount} recommendation(s) need attention.{" "}
              {selectedCsiScopeCount} CSI scopes selected.
            </p>
          </div>
          <span
            className={`badge ${
              readinessSummary.requiredReady ? "badge-success" : "badge-warning"
            }`}
          >
            {readinessSummary.requiredReady ? "Ready" : "Blocked"}
          </span>
        </div>

        {!readinessSummary.requiredReady && (
          <div className="project-setup-review-callout">
            <strong>Mark ITB Launch Ready is blocked.</strong>
            <p className="muted-text">
              Complete the required items first:{" "}
              {blockingRows.map((row) => row.stepName).join(", ")}.
            </p>
          </div>
        )}

        <ReadinessGroup
          title="Required for ITB Launch"
          rows={requiredRows}
          onJumpToStep={onJumpToStep}
        />
        <ReadinessGroup
          title="Recommended Before ITB"
          rows={recommendedRows}
          onJumpToStep={onJumpToStep}
        />
        <ReadinessGroup
          title="Post-Invite Setup"
          rows={postInviteRows}
          onJumpToStep={onJumpToStep}
        />
      </div>

      <div className="project-setup-form-card">
        <div className="project-setup-card-header">
          <div>
            <p className="label-text">Launch Actions</p>
            <p className="muted-text">
            Move into scope review, invites, overview, or the command center.
            </p>
          </div>
          <button
            type="button"
            className="button-primary"
            disabled={!projectSaved || !readinessSummary.requiredReady}
            onClick={onMarkReadyForInvites}
          >
            Mark ITB Launch Ready
          </button>
        </div>

        <div className="project-setup-next-actions">
          {projectSaved ? (
            <>
              <Link href={`/projects/${project.id}/scope`} className="button-secondary">
                Open Project Scope
              </Link>
              <Link
                href={`/projects/${project.id}/invite`}
                className={inviteReady ? "button-primary" : "button-secondary"}
              >
                Invite Subs
              </Link>
              <Link
                href={`/projects/${project.id}/overview`}
                className="button-secondary"
              >
                Overview
              </Link>
              <Link href={`/projects/${project.id}`} className="button-secondary">
                Project Command Center
              </Link>
            </>
          ) : (
            <span className="button-secondary project-setup-disabled-action">
              Save the project before launch actions are available.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function ReadinessGroup({
  title,
  rows,
  onJumpToStep,
}: {
  title: string;
  rows: SetupReadinessRow[];
  onJumpToStep: (stepId: string) => void;
}) {
  if (rows.length === 0) return null;

  return (
    <div className="project-setup-review-list">
      <p className="label-text">{title}</p>
      {rows.map((row) => (
        <div className="project-setup-review-row" key={row.stepId}>
          <div>
            <strong>{row.stepName}</strong>
            <p className="muted-text">{row.summary}</p>
          </div>
          <div className="project-setup-review-meta">
            <span className={getReadinessBadgeClassName(row)}>
              {getReadinessStatusLabel(row)}
            </span>
            <span className="badge badge-muted">
              {formatSetupStatus(row.requirement)}
            </span>
            <button
              type="button"
              className="button-secondary"
              onClick={() => onJumpToStep(row.stepId)}
            >
              Jump
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function ListTextareaField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string[] | undefined;
  onChange: (value: string[]) => void;
}) {
  return (
    <label className="form-field">
      {label}
      <textarea
        rows={3}
        value={(value ?? []).join("\n")}
        placeholder="One item per line"
        onChange={(event) => onChange(parseListTextarea(event.target.value))}
      />
    </label>
  );
}

function getSetupReadinessSummary(
  project: Project,
  selectedCsiScopeCount: number,
  activeBidPackages: ProjectBidPackage[]
): SetupReadinessSummary {
  const rows = [
    getBasicsReadiness(project),
    getCommunicationContactReadiness(project),
    getScheduleReadiness(project),
    getDocumentsBidInstructionsReadiness(project),
    getProjectScopeCsiReadiness(selectedCsiScopeCount),
    getBidPackageReadiness(activeBidPackages),
    getExternalTeamReadiness(project),
    getBidRequirementsReadiness(project),
    getInternalTeamReadiness(project),
    getExtendedCharacteristicsReadiness(project),
    getBudgetReadiness(project),
  ];
  const requiredRows = rows.filter((row) => row.requirement === "required");

  return {
    rows,
    requiredReady: requiredRows.every((row) => !row.blocking),
    completeRequiredCount: requiredRows.filter((row) => !row.blocking).length,
    requiredCount: requiredRows.length,
    warningCount: rows.filter((row) => row.status === "incomplete").length,
  };
}

function getBasicsReadiness(project: Project): SetupReadinessRow {
  const missingItems = [
    hasText(project.name) ? undefined : "project name",
    hasText(project.client) ? undefined : "client",
    hasText(project.estimator) ? undefined : "estimator",
  ].filter(isDefined);

  return buildReadinessRow({
    stepId: "project-basics",
    stepName: "Project Basics",
    requirement: "required",
    missingItems,
    completeSummary: "Project name, client, and estimator are set.",
  });
}

function getCommunicationContactReadiness(project: Project): SetupReadinessRow {
  const internalTeam = project.internalTeam ?? [];
  const itbInstructions = project.itbInstructions;
  const hasReplyTo = Boolean(
    hasText(itbInstructions?.replyToName) || hasText(itbInstructions?.replyToEmail)
  );
  const hasInternalBidContact =
    hasReplyTo ||
    hasText(project.estimator) ||
    internalTeam.some(
      (member) =>
        hasText(member.name) &&
        (member.isPrimaryContact ||
          member.canSendInvites ||
          member.role === "Estimator" ||
          member.role === "Estimating Coordinator")
    );
  const missingItems = [
    hasInternalBidContact ? undefined : "estimator or internal bid contact",
  ].filter(isDefined);

  return buildReadinessRow({
    stepId: "communication-contacts",
    stepName: "Project Team / Communication Contacts",
    requirement: "required",
    missingItems,
    completeSummary: "Internal bid contact is ready for ITB communication.",
  });
}

function getInternalTeamReadiness(project: Project): SetupReadinessRow {
  const hasInternalTeam = (project.internalTeam ?? []).length > 0;

  return buildReadinessRow({
    stepId: "extended-internal-team",
    stepName: "Extended Internal Team",
    requirement: "post-invite",
    missingItems: hasInternalTeam ? [] : ["add at least one internal team member"],
    completeSummary: `${project.internalTeam?.length ?? 0} internal team member(s) assigned.`,
  });
}

function getExternalTeamReadiness(project: Project): SetupReadinessRow {
  const externalTeam = project.externalTeam ?? [];
  const hasRfiInstructions = hasText(project.itbInstructions?.rfiInstructions);
  const hasExternalTeam = externalTeam.length > 0;
  const hasDesignOrRfiContact = externalTeam.some(
    (contact) =>
      contact.isDefaultRfiRecipient ||
      isDesignDiscipline(contact.discipline) ||
      /architect|design|rfi/i.test(
        [contact.firmName, contact.contactName, contact.notes].join(" ")
      )
  );
  const missingItems = [
    hasExternalTeam ? undefined : "add at least one external contact",
    hasDesignOrRfiContact || hasRfiInstructions
      ? undefined
      : "identify an architect, design, or RFI contact, or add RFI instructions",
  ].filter(isDefined);

  return buildReadinessRow({
    stepId: "extended-external-team-rfi-routing",
    stepName: "External RFI / Design Contact",
    requirement: "recommended",
    missingItems,
    completeSummary: `${externalTeam.length} external contact(s) with RFI/design routing context.`,
  });
}

function getScheduleReadiness(project: Project): SetupReadinessRow {
  const missingItems = [
    hasText(project.subcontractorBidDueDate)
      ? undefined
      : "sub bid due date",
    hasText(project.bidDueDate) ? undefined : "GC bid due date",
  ].filter(isDefined);
  const recommendedItems = hasText(project.bidReviewDate)
    ? []
    : ["recommended: bid review date"];

  return buildReadinessRow({
    stepId: "bid-dates-events",
    stepName: "Bid Dates & Project Events",
    requirement: "required",
    missingItems,
    recommendedItems: [
      ...recommendedItems,
      "recommended: RFI due date when known",
      "recommended: site walk or pre-bid meeting when scheduled",
    ],
    completeSummary: "Sub bid due date and GC bid due date are set.",
  });
}

function getBidRequirementsReadiness(project: Project): SetupReadinessRow {
  const requirements = project.bidRequirements;
  const hasBidOrContractType = Boolean(
    requirements?.bidType || requirements?.contractType
  );
  const hasRequiredBidsPerScope =
    requirements?.requiredBidsPerScope !== undefined &&
    requirements.requiredBidsPerScope > 0;
  const missingItems = [
    hasBidOrContractType ? undefined : "bid type or contract type",
    hasRequiredBidsPerScope ? undefined : "recommended: required bids per scope",
  ].filter(isDefined);

  return buildReadinessRow({
    stepId: "bid-contract-requirements",
    stepName: "Bid / Contract Requirements",
    requirement: "recommended",
    missingItems,
    completeSummary: "Bid/contract requirements have enough launch context.",
  });
}

function getExtendedCharacteristicsReadiness(project: Project): SetupReadinessRow {
  const characteristics = project.projectCharacteristics;
  const hasCharacteristicSignal = Boolean(
    characteristics &&
      [
        characteristics.marketSector,
        characteristics.buildingType,
        characteristics.workType,
        characteristics.constructionType,
        characteristics.squareFootage,
        characteristics.stories,
        characteristics.complexityLevel,
        characteristics.finishLevel,
        characteristics.accessConstraints,
        characteristics.specialConditions,
        characteristics.isOccupiedFacility,
        characteristics.isExistingBuilding,
        characteristics.phasingRequired,
        characteristics.afterHoursWorkRequired,
      ].some(Boolean)
  );
  const missingItems = [
    hasCharacteristicSignal ? undefined : "extended project characteristics",
  ].filter(isDefined);

  return buildReadinessRow({
    stepId: "final-setup-review",
    stepName: "Extended Characteristics",
    requirement: "post-invite",
    missingItems,
    completeSummary: "Extended project characteristics have been captured.",
  });
}

function getDocumentsBidInstructionsReadiness(project: Project): SetupReadinessRow {
  const documents = project.projectDocuments;
  const itbInstructions = project.itbInstructions;
  const hasDocumentSignal = Boolean(
    itbInstructions?.documentAccessInstructions ||
      project.planLink ||
      (documents &&
        [
          documents.plansLink,
          documents.specsLink,
          documents.addendaLink,
          documents.bidFormLink,
          documents.drawingDate,
          documents.drawingSetName,
          documents.drawingSetVersion,
        ].some(hasText))
  );

  return buildReadinessRow({
    stepId: "documents-bid-instructions",
    stepName: "Documents / Bid Instructions",
    requirement: "required",
    missingItems: hasDocumentSignal
      ? []
      : ["document link or document access/bid instructions"],
    completeSummary: "Document access or bid instructions are captured.",
  });
}

function getProjectScopeCsiReadiness(
  selectedCsiScopeCount: number
): SetupReadinessRow {
  return buildReadinessRow({
    stepId: "project-scope-csi",
    stepName: "Project Scope / CSI",
    requirement: "required",
    missingItems:
      selectedCsiScopeCount > 0 ? [] : ["at least one selected CSI scope"],
    completeSummary: `${selectedCsiScopeCount} CSI scope(s) selected.`,
  });
}

function getBidPackageReadiness(
  activeBidPackages: ProjectBidPackage[]
): SetupReadinessRow {
  const mappedScopeCount = activeBidPackages.reduce(
    (total, packageRecord) => total + packageRecord.scopeItemIds.length,
    0
  );

  return buildReadinessRow({
    stepId: "bid-packages",
    stepName: "Bid Packages",
    requirement: "required",
    missingItems:
      activeBidPackages.length > 0
        ? []
        : ["at least one active Bid Package with mapped CSI scopes"],
    completeSummary: `${activeBidPackages.length} active Bid Package(s) with ${mappedScopeCount} mapped CSI scope(s).`,
  });
}

function getBudgetReadiness(project: Project): SetupReadinessRow {
  const budgetReadiness = project.budgetReadiness;
  const hasBudgetSignal = Boolean(
    budgetReadiness?.ownerBudget ||
      budgetReadiness?.targetBudget ||
      budgetReadiness?.romEstimate
  );

  return {
    stepId: "budget-pricing-readiness",
    stepName: "Budget / Pricing Readiness",
    requirement: "optional",
    status: "optional",
    blocking: false,
    summary: hasBudgetSignal
      ? "Budget or ROM context has been captured."
      : "Optional placeholder until budget, takeoff, historical pricing, or ROM assumptions are available.",
  };
}

function buildReadinessRow({
  stepId,
  stepName,
  requirement,
  missingItems,
  recommendedItems = [],
  completeSummary,
}: {
  stepId: string;
  stepName: string;
  requirement: "required" | "recommended" | "post-invite";
  missingItems: string[];
  recommendedItems?: string[];
  completeSummary: string;
}): SetupReadinessRow {
  const isComplete = missingItems.length === 0;
  const isPostInvite = requirement === "post-invite";
  const summaryParts = [
    isComplete ? completeSummary : `Missing: ${missingItems.join(", ")}.`,
    recommendedItems.length > 0 ? recommendedItems.join(", ") + "." : undefined,
  ].filter(isDefined);

  return {
    stepId,
    stepName,
    requirement,
    status: isComplete ? "complete" : isPostInvite ? "optional" : "incomplete",
    blocking: requirement === "required" && !isComplete,
    summary: summaryParts.join(" "),
  };
}

function getReadinessBadgeClassName(row: SetupReadinessRow) {
  if (row.status === "complete") return "badge badge-success";
  if (row.status === "optional") return "badge badge-muted";
  return row.blocking ? "badge badge-danger" : "badge badge-warning";
}

function getReadinessStatusLabel(row: SetupReadinessRow) {
  if (row.status === "optional") return "Optional";
  return row.status === "complete" ? "Complete" : "Incomplete";
}

function isDesignDiscipline(
  discipline: ProjectExternalTeamDiscipline | undefined
) {
  return Boolean(
    discipline &&
      [
        "Architectural",
        "Structural",
        "Civil",
        "Mechanical",
        "Electrical",
        "Plumbing",
        "Fire Protection",
        "Low Voltage/Technology",
        "Security",
        "Landscape",
        "Geotechnical",
        "Interior Design",
        "Food Service",
        "Medical Equipment",
      ].includes(discipline)
  );
}

function hasText(value: string | number | boolean | undefined) {
  if (typeof value === "number" || typeof value === "boolean") return true;
  return Boolean(value?.trim());
}

function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}

function ToggleField({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="toggle-shell">
      <input
        type="checkbox"
        className="visually-hidden"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="toggle-control" aria-hidden="true" />
      {label}
    </label>
  );
}

function normalizeInternalTeamRole(
  value: string
): ProjectInternalTeamRole | undefined {
  return internalTeamRoleOptions.find((role) => role === value);
}

function normalizeExternalTeamDiscipline(
  value: string
): ProjectExternalTeamDiscipline | undefined {
  return externalTeamDisciplineOptions.find(
    (discipline) => discipline === value
  );
}

function normalizeBidType(value: string): ProjectBidType | undefined {
  return bidTypeOptions.find((bidType) => bidType === value);
}

function normalizeContractType(value: string): ProjectContractType | undefined {
  return contractTypeOptions.find((contractType) => contractType === value);
}

function normalizeBidSubmissionMethod(
  value: string
): ProjectBidSubmissionMethod | undefined {
  return bidSubmissionMethodOptions.find((method) => method === value);
}

function normalizeDocumentSource(
  value: string
): ProjectDocumentSource | undefined {
  return documentSourceOptions.find((source) => source === value);
}

function normalizePlanReviewStatus(
  value: string
): ProjectPlanReviewStatus | undefined {
  return planReviewStatusOptions.find((status) => status === value);
}

function normalizeMarketSector(value: string): MarketSector | undefined {
  return marketSectorOptions.find((sector) => sector === value);
}

function normalizeComplexityLevel(
  value: string
): ProjectComplexityLevel | undefined {
  return complexityLevelOptions.find((level) => level === value);
}

function normalizeFinishLevel(value: string): ProjectFinishLevel | undefined {
  return finishLevelOptions.find((level) => level === value);
}

function normalizeTakeoffStatus(
  value: string
): ProjectTakeoffStatus | undefined {
  return takeoffStatusOptions.find((status) => status === value);
}

function normalizePricingConfidence(
  value: string
): ProjectPricingConfidence | undefined {
  return pricingConfidenceOptions.find((confidence) => confidence === value);
}

function parseListTextarea(value: string) {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseOptionalNumber(value: string) {
  const normalizedValue = value.replace(/,/g, "").trim();

  if (!normalizedValue) return undefined;

  const parsedValue = Number(normalizedValue);

  return Number.isFinite(parsedValue) ? parsedValue : undefined;
}

function formatOptionalNumber(value: number | undefined) {
  return value === undefined ? "" : String(value);
}

function createSetupRowId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}`;
}

function formatSetupStatus(status: string) {
  if (status === "READY_FOR_INVITES") return "ITB Launch Ready";
  if (status === "post-invite") return "Post-Invite";

  return status
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

function formatProjectStatus(status: string) {
  return formatSetupStatus(status);
}

function formatLastEdited(value?: string) {
  if (!value) return "Not saved";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function getFutureFieldsSummary(stepId: string) {
  switch (stepId) {
    case "basics":
      return "Project number, client, estimator, location, delivery method, ownership, and status review.";
    case "internal-team":
      return "GC team assignments, primary contact, invite permissions, setup edit rights, and notification preferences.";
    case "external-team-rfi-routing":
      return "Owner/client/design contacts, consultant disciplines, default RFI recipient, and CC routing.";
    case "schedule-milestones":
      return "Sub bid due date, bid review, GC bid due date, walkthroughs, addenda, and project debrief milestones.";
    case "bid-contract-requirements":
      return "Bid type, contract type, submission method, bond requirements, wage rules, tax status, retainage, alternates, allowances, and unit price requirements.";
    case "plans-characteristics-scope":
      return "Plan/spec links, drawing set metadata, building characteristics, work constraints, special conditions, and CSI scope readiness.";
    case "budget-pricing-readiness":
      return "Owner budget, target budget, ROM estimate, pricing confidence, and notes for future estimating inputs.";
    case "review-launch":
      return "Final setup validation, project readiness review, and launch checks for invite workflows.";
    default:
      return "Setup fields will be added in a later phase.";
  }
}
