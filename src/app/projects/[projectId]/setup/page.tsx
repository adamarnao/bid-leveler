"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import Panel from "@/components/ui/Panel";
import {
  getMergedProjects,
  getProjectSetupProgress,
  getProjectSetupStatus,
  projectsStorageKey,
  saveProject,
  updateProjectSetupProgress,
} from "@/lib/projects";
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
  ProjectPlanReviewStatus,
  ProjectPricingConfidence,
  ProjectScopeSetup,
  ProjectStatus,
  ProjectTakeoffStatus,
} from "@/types/Project";
import { StoredProjectCsiSelections } from "@/types/Csi";

const setupSteps = [
  {
    id: "basics",
    title: "Basics",
    summary:
      "Confirm project identity, client, location, status, delivery method, and high-level bid context.",
  },
  {
    id: "internal-team",
    title: "Internal Team",
    summary:
      "Assign estimating, operations, accounting, and support contacts with setup, invite, and bid review permissions.",
  },
  {
    id: "external-team-rfi-routing",
    title: "External Team & RFI Routing",
    summary:
      "Track owner, client, design, consultant, and default RFI recipients for project communication.",
  },
  {
    id: "schedule-milestones",
    title: "Schedule & Milestones",
    summary:
      "Review sub bid due dates, GC bid due dates, walkthroughs, addenda deadlines, and bid review timing.",
  },
  {
    id: "bid-contract-requirements",
    title: "Bid / Contract Requirements",
    summary:
      "Capture bid type, contract terms, bonds, wage requirements, alternates, allowances, unit prices, and required coverage.",
  },
  {
    id: "plans-characteristics-scope",
    title: "Plans, Characteristics & Scope",
    summary:
      "Organize drawing/spec links, project conditions, complexity, phasing, and CSI scope readiness.",
  },
  {
    id: "budget-pricing-readiness",
    title: "Budget / Pricing Readiness",
    summary:
      "Placeholder until takeoffs, historical pricing, ROM assumptions, and budget confidence inputs are available.",
  },
  {
    id: "review-launch",
    title: "Review / Launch",
    summary:
      "Final setup review before the project is ready for invite preparation and bid coverage workflows.",
  },
];

const defaultStepId = setupSteps[0].id;

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
  >
>;

type ProjectSetupDraftState = {
  projectId?: string;
  values: ProjectSetupDraft;
};

let cachedProjectsStorageValue: string | undefined;
let cachedProjects: Project[] = getMergedProjects();
const projectCsiSelectionsStorageKey = "projectCsiSelections";
const projectCsiSelectionsChangeEvent = "projectCsiSelectionsChange";
const EMPTY_PROJECT_CSI_SELECTIONS: StoredProjectCsiSelections = {};
let cachedProjectCsiSelectionsStorageValue: string | undefined;
let cachedProjectCsiSelections: StoredProjectCsiSelections =
  EMPTY_PROJECT_CSI_SELECTIONS;

export default function ProjectSetupPage() {
  const params = useParams();
  const rawProjectId = params.projectId;
  const projectId = Array.isArray(rawProjectId) ? rawProjectId[0] : rawProjectId;
  const projects = useProjectsSnapshot();
  const projectCsiSelections = useProjectCsiSelectionsSnapshot();
  const storedProject = projects.find((item) => item.id === projectId);
  const [localProject, setLocalProject] = useState<Project | null>(null);
  const [draftState, setDraftState] = useState<ProjectSetupDraftState>({
    values: {},
  });
  const project =
    localProject && localProject.id === projectId ? localProject : storedProject;

  const setupProgress = project
    ? getProjectSetupProgress(project)
    : { completedStepIds: [] };
  const setupStatus = project ? getProjectSetupStatus(project) : "NOT_STARTED";
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const activeStepId =
    selectedStepId ?? setupProgress.currentStepId ?? defaultStepId;

  const activeStep =
    setupSteps.find((step) => step.id === activeStepId) ?? setupSteps[0];
  const completedStepIds = useMemo(
    () => new Set(setupProgress.completedStepIds ?? []),
    [setupProgress.completedStepIds]
  );
  const completedStepCount = completedStepIds.size;
  const selectedCsiScopeCount = projectId
    ? getProjectCsiScopeCount(projectCsiSelections, projectId)
    : 0;

  if (!project) {
    return (
      <AppShell title="Project Not Found">
        <p>Requested project ID: {projectId}</p>
        <Link href="/">Back to Dashboard</Link>
      </AppShell>
    );
  }

  const currentProject = project;
  const currentDraft =
    draftState.projectId === currentProject.id ? draftState.values : {};

  function updateDraft<K extends keyof ProjectSetupDraft>(
    field: K,
    value: ProjectSetupDraft[K]
  ) {
    setDraftState((currentValue) => ({
      projectId: currentProject.id,
      values: {
        ...(currentValue.projectId === currentProject.id
          ? currentValue.values
          : {}),
        [field]: value,
      },
    }));
  }

  function persistProject(nextProject: Project) {
    saveProject(nextProject);
    setLocalProject(nextProject);
    setDraftState({ projectId: nextProject.id, values: {} });
  }

  function handleSaveProgress() {
    const editedProject = { ...currentProject, ...currentDraft };
    const nextProject = updateProjectSetupProgress(editedProject, {
      currentStepId: activeStepId,
      lastEditedAt: new Date().toISOString(),
    });

    persistProject(nextProject);
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
    const editedProject = { ...currentProject, ...currentDraft };
    const nextProject = {
      ...updateProjectSetupProgress(editedProject, {
        currentStepId: nextStepId,
        completedStepIds: nextCompletedStepIds,
        lastEditedAt: new Date().toISOString(),
      }),
      setupStatus: "IN_PROGRESS" as const,
    };

    persistProject(nextProject);
    setSelectedStepId(nextStepId);
  }

  return (
    <AppShell title="Project Setup">
      <div className="project-setup-shell">
        <section className="project-setup-hero">
          <div>
            <p className="label-text">Project Setup</p>
            <h1>{currentDraft.name ?? currentProject.name}</h1>
            <p className="muted-text">
              {currentDraft.client ?? currentProject.client} -{" "}
              {formatProjectStatus(currentDraft.status ?? currentProject.status)}
            </p>
          </div>
          <div className="project-setup-hero-actions">
            <Link
              href={`/projects/${currentProject.id}/scope`}
              className="button-secondary"
            >
              Open Project Scope
            </Link>
            <button
              type="button"
              className="button-secondary"
              onClick={handleSaveProgress}
            >
              Save Progress
            </button>
            <Link
              href={`/projects/${currentProject.id}`}
              className="button-primary"
              onClick={handleSaveProgress}
            >
              Save & Exit
            </Link>
          </div>
        </section>

        <section className="project-setup-status-grid" aria-label="Setup status">
          <div className="project-setup-status-card">
            <span className="label-text">Setup Status</span>
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

              return (
                <button
                  key={step.id}
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
              );
            })}
          </nav>

          <Panel title={activeStep.title}>
            <div className="project-setup-step-content">
              <p className="muted-text">{activeStep.summary}</p>
              {activeStep.id === "basics" ? (
                <ProjectBasicsFields
                  draft={currentDraft}
                  project={currentProject}
                  onChange={updateDraft}
                />
              ) : activeStep.id === "internal-team" ? (
                <ProjectInternalTeamFields
                  draft={currentDraft}
                  project={currentProject}
                  onChange={updateDraft}
                />
              ) : activeStep.id === "external-team-rfi-routing" ? (
                <ProjectExternalTeamFields
                  draft={currentDraft}
                  project={currentProject}
                  onChange={updateDraft}
                />
              ) : activeStep.id === "schedule-milestones" ? (
                <ProjectScheduleFields
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
                  onChange={updateDraft}
                />
              ) : activeStep.id === "budget-pricing-readiness" ? (
                <ProjectBudgetReadinessFields
                  draft={currentDraft}
                  project={currentProject}
                  onChange={updateDraft}
                />
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
    </AppShell>
  );
}

function useProjectsSnapshot(): Project[] {
  return useSyncExternalStore(
    subscribeToProjectStorage,
    getProjectsSnapshot,
    getServerProjectsSnapshot
  );
}

function subscribeToProjectStorage(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
  };
}

function getServerProjectsSnapshot(): Project[] {
  return cachedProjects;
}

function getProjectsSnapshot(): Project[] {
  const storageValue = localStorage.getItem(projectsStorageKey) || "[]";

  if (storageValue !== cachedProjectsStorageValue) {
    cachedProjectsStorageValue = storageValue;
    cachedProjects = getMergedProjects(storageValue);
  }

  return cachedProjects;
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

function ProjectBasicsFields({
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
  return (
    <div className="project-setup-field-sections">
      <div className="project-setup-form-card">
        <p className="label-text">Project Identity</p>
        <div className="project-setup-form-grid">
          <label className="form-field">
            Project Name
            <input
              value={draft.name ?? project.name}
              onChange={(event) => onChange("name", event.target.value)}
            />
          </label>
          <label className="form-field">
            Client
            <input
              value={draft.client ?? project.client}
              onChange={(event) => onChange("client", event.target.value)}
            />
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
        </div>
      </div>
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
  onChange,
}: {
  draft: ProjectSetupDraft;
  project: Project;
  selectedCsiScopeCount: number;
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
          <Link href={`/projects/${project.id}/scope`} className="button-secondary">
            Open Project Scope
          </Link>
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
