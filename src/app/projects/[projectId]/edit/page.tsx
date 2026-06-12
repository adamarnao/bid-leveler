"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import ProjectForm from "@/components/projects/ProjectForm";
import {
  getMergedProjects,
  projectsStorageKey,
  saveProject,
} from "@/lib/projects";
import { Project } from "@/types/Project";

export default function EditProjectPage() {
  const params = useParams();
  const rawProjectId = params.projectId;
  const projectId = Array.isArray(rawProjectId) ? rawProjectId[0] : rawProjectId;
  const projects = useProjectsSnapshot();
  const project = projects.find((p) => p.id === projectId);

  if (!project) {
    return (
      <AppShell title="Project Not Found">
        <h1>Project Not Found</h1>
        <p>Requested project ID: {projectId}</p>
        <Link href="/">Back to Dashboard</Link>
      </AppShell>
    );
  }

  function updateProject(updatedProject: Project) {
    saveProject(updatedProject);
    window.location.href = `/projects/${updatedProject.id}`;
  }

  return (
    <AppShell title={`Edit ${project.name}`}>
      <Link href={`/projects/${project.id}`}>{"<-"} Back to Command Center</Link>
      <ProjectForm
        initialProject={project}
        submitLabel="Save Project"
        onSubmit={updateProject}
      />
    </AppShell>
  );
}

let cachedProjectsStorageValue: string | undefined;
let cachedProjects: Project[] = getMergedProjects();

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
