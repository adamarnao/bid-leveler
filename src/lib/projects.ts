import { mockProjects } from "@/data/mockProjects";
import { deleteProjectBidData } from "@/lib/projectBids";
import { deleteProjectInviteRecipientsForProject } from "@/lib/projectInvites";
import {
  Project,
  ProjectSetupProgress,
  ProjectSetupStatus,
} from "@/types/Project";

export const projectsStorageKey = "projects";
const projectCsiSelectionsStorageKey = "projectCsiSelections";
const projectDraftInviteSelectionsStorageKey = "projectDraftInviteSelections";

type ProjectReadOptions = {
  includeDeleted?: boolean;
};

export function getMergedProjects(
  storageValue?: string,
  options: ProjectReadOptions = {}
): Project[] {
  return filterDeletedProjects(
    mergeProjects(mockProjects, parseSavedProjects(storageValue ?? "[]")),
    options
  );
}

export function getSavedProjects(options: ProjectReadOptions = {}): Project[] {
  if (typeof window === "undefined") return [];

  return filterDeletedProjects(
    parseSavedProjects(window.localStorage.getItem(projectsStorageKey) || "[]"),
    options
  );
}

export function saveProject(project: Project) {
  if (typeof window === "undefined") return;

  const savedProjects = getSavedProjects({ includeDeleted: true });
  const nextProjects = [
    ...savedProjects.filter((savedProject) => savedProject.id !== project.id),
    project,
  ];

  window.localStorage.setItem(projectsStorageKey, JSON.stringify(nextProjects));
}

export function appendProject(project: Project) {
  if (typeof window === "undefined") return;

  const savedProjects = getSavedProjects({ includeDeleted: true });
  window.localStorage.setItem(
    projectsStorageKey,
    JSON.stringify([
      ...savedProjects.filter((savedProject) => savedProject.id !== project.id),
      project,
    ])
  );
}

export function archiveProject(projectId: string) {
  updateStoredProject(projectId, (project) => ({
    ...project,
    archived: true,
    archivedAt: new Date().toISOString(),
  }));
}

export function restoreProject(projectId: string) {
  updateStoredProject(projectId, (project) => ({
    ...project,
    archived: false,
    archivedAt: undefined,
  }));
}

export function deleteProjectPermanently(projectId: string) {
  if (typeof window === "undefined") return;

  const savedProjects = getSavedProjects({ includeDeleted: true });
  const mockProject = mockProjects.find((project) => project.id === projectId);
  const savedProject = savedProjects.find((project) => project.id === projectId);
  const nextProjects = savedProjects.filter((project) => project.id !== projectId);

  if (mockProject) {
    nextProjects.push({
      ...mockProject,
      ...savedProject,
      deleted: true,
      deletedAt: new Date().toISOString(),
    });
  }

  window.localStorage.setItem(projectsStorageKey, JSON.stringify(nextProjects));
  removeProjectScopedStorageEntry(projectCsiSelectionsStorageKey, projectId);
  removeProjectScopedStorageEntry(
    projectDraftInviteSelectionsStorageKey,
    projectId
  );
  deleteProjectBidData(projectId);
  deleteProjectInviteRecipientsForProject(projectId);
}

export function getActiveProjects(projects: Project[]): Project[] {
  return projects.filter((project) => !project.deleted && !project.archived);
}

export function getArchivedProjects(projects: Project[]): Project[] {
  return projects.filter((project) => !project.deleted && project.archived);
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

function filterDeletedProjects(
  projects: Project[],
  options: ProjectReadOptions
): Project[] {
  return options.includeDeleted
    ? projects
    : projects.filter((project) => !project.deleted);
}

function updateStoredProject(
  projectId: string,
  updateProject: (project: Project) => Project
) {
  if (typeof window === "undefined") return;

  const storageValue = window.localStorage.getItem(projectsStorageKey) || "[]";
  const savedProjects = parseSavedProjects(storageValue);
  const project = getMergedProjects(storageValue, { includeDeleted: true }).find(
    (mergedProject) => mergedProject.id === projectId
  );

  if (!project || project.deleted) return;

  const nextProject = updateProject(project);
  const nextProjects = [
    ...savedProjects.filter((savedProject) => savedProject.id !== projectId),
    nextProject,
  ];

  window.localStorage.setItem(projectsStorageKey, JSON.stringify(nextProjects));
}

function removeProjectScopedStorageEntry(storageKey: string, projectId: string) {
  const storageValue = window.localStorage.getItem(storageKey);

  if (!storageValue) return;

  try {
    const parsedValue = JSON.parse(storageValue);

    if (
      !parsedValue ||
      typeof parsedValue !== "object" ||
      Array.isArray(parsedValue) ||
      !(projectId in parsedValue)
    ) {
      return;
    }

    delete parsedValue[projectId];
    window.localStorage.setItem(storageKey, JSON.stringify(parsedValue));
  } catch {
    return;
  }
}
