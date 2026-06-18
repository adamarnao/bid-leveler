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
import { Project } from "@/types/Project";

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

let cachedProjectsStorageValue: string | undefined;
let cachedProjects: Project[] = getMergedProjects();

export default function ProjectSetupPage() {
  const params = useParams();
  const rawProjectId = params.projectId;
  const projectId = Array.isArray(rawProjectId) ? rawProjectId[0] : rawProjectId;
  const projects = useProjectsSnapshot();
  const storedProject = projects.find((item) => item.id === projectId);
  const [localProject, setLocalProject] = useState<Project | null>(null);
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

  if (!project) {
    return (
      <AppShell title="Project Not Found">
        <p>Requested project ID: {projectId}</p>
        <Link href="/">Back to Dashboard</Link>
      </AppShell>
    );
  }

  const currentProject = project;

  function persistProject(nextProject: Project) {
    saveProject(nextProject);
    setLocalProject(nextProject);
  }

  function handleSaveProgress() {
    const nextProject = updateProjectSetupProgress(currentProject, {
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
    const nextProject = {
      ...updateProjectSetupProgress(currentProject, {
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
            <h1>{currentProject.name}</h1>
            <p className="muted-text">
              {currentProject.client} · {formatProjectStatus(currentProject.status)}
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
                    {isComplete ? "✓" : index + 1}
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
              <div className="project-setup-placeholder">
                <p className="label-text">Future Fields</p>
                <p>{getFutureFieldsSummary(activeStep.id)}</p>
              </div>

              {activeStep.id === "plans-characteristics-scope" && (
                <div className="project-setup-inline-cta">
                  <div>
                    <strong>Project CSI scopes live in Project Scope.</strong>
                    <p className="muted-text">
                      Use the dedicated scope workspace for division cards,
                      staged CSI scope selection, and MasterFormat version
                      handling.
                    </p>
                  </div>
                  <Link
                    href={`/projects/${currentProject.id}/scope`}
                    className="button-secondary"
                  >
                    Open Project Scope
                  </Link>
                </div>
              )}

              {activeStep.id === "budget-pricing-readiness" && (
                <div className="project-setup-inline-cta">
                  <div>
                    <strong>Pricing readiness is a placeholder.</strong>
                    <p className="muted-text">
                      This step will connect budget confidence to takeoffs,
                      historical pricing, ROM assumptions, and estimate review
                      notes in a later phase.
                    </p>
                  </div>
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
