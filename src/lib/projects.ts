import { mockProjects } from "@/data/mockProjects";
import {
  Project,
  ProjectSetupProgress,
  ProjectSetupStatus,
} from "@/types/Project";

export const projectsStorageKey = "projects";

export function getMergedProjects(storageValue?: string): Project[] {
  return mergeProjects(mockProjects, parseSavedProjects(storageValue ?? "[]"));
}

export function getSavedProjects(): Project[] {
  if (typeof window === "undefined") return [];

  return parseSavedProjects(window.localStorage.getItem(projectsStorageKey) || "[]");
}

export function saveProject(project: Project) {
  if (typeof window === "undefined") return;

  const savedProjects = getSavedProjects();
  const nextProjects = [
    ...savedProjects.filter((savedProject) => savedProject.id !== project.id),
    project,
  ];

  window.localStorage.setItem(projectsStorageKey, JSON.stringify(nextProjects));
}

export function appendProject(project: Project) {
  if (typeof window === "undefined") return;

  const savedProjects = getSavedProjects();
  window.localStorage.setItem(
    projectsStorageKey,
    JSON.stringify([...savedProjects, project])
  );
}

export function getProjectSetupStatus(project: Project): ProjectSetupStatus {
  return project.setupStatus ?? "NOT_STARTED";
}

export function getProjectSetupProgress(
  project: Project
): ProjectSetupProgress {
  return {
    currentStepId: project.setupProgress?.currentStepId,
    completedStepIds: project.setupProgress?.completedStepIds ?? [],
    lastEditedAt: project.setupProgress?.lastEditedAt,
  };
}

export function updateProjectSetupProgress(
  project: Project,
  progress: ProjectSetupProgress
): Project {
  const nextCompletedStepIds = Array.from(
    new Set(progress.completedStepIds ?? project.setupProgress?.completedStepIds ?? [])
  );
  const hasProgress =
    Boolean(progress.currentStepId) ||
    nextCompletedStepIds.length > 0 ||
    Boolean(progress.lastEditedAt);
  const currentStatus = getProjectSetupStatus(project);

  return {
    ...project,
    setupStatus:
      currentStatus === "NOT_STARTED" && hasProgress
        ? "IN_PROGRESS"
        : currentStatus,
    setupProgress: {
      ...project.setupProgress,
      ...progress,
      completedStepIds: nextCompletedStepIds,
    },
  };
}

export function isProjectReadyForInvites(project: Project): boolean {
  const setupStatus = getProjectSetupStatus(project);

  return setupStatus === "READY_FOR_INVITES" || setupStatus === "COMPLETE";
}

export function parseSavedProjects(storageValue: string): Project[] {
  try {
    const savedProjects = JSON.parse(storageValue);

    return Array.isArray(savedProjects) ? savedProjects : [];
  } catch {
    return [];
  }
}

function mergeProjects(mockProjectList: Project[], savedProjects: Project[]) {
  const projectsById = new Map<string, Project>();

  mockProjectList.forEach((project) => projectsById.set(project.id, project));
  savedProjects.forEach((project) => projectsById.set(project.id, project));

  return Array.from(projectsById.values());
}
