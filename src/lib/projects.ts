import { mockProjects } from "@/data/mockProjects";
import { Project } from "@/types/Project";

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
