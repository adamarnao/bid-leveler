"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { getMergedProjects, projectsStorageKey } from "@/lib/projects";
import { Project } from "@/types/Project";
import AppShell from "@/components/layout/AppShell";

export default function Home() {
  const projects = useProjectsSnapshot();

  const activeProjects = projects.filter((project) => !project.archived);

  return (
    <AppShell title="Dashboard">
      <div className="dashboard-project-header">
        <h2>Active Projects</h2>
        <div className="dashboard-project-actions">
          <Link href="/projects/new" className="button-primary">
            New Project
          </Link>
          <Link href="/subcontractors" className="button-secondary">
            Subcontractors
          </Link>
        </div>
      </div>

      <table style={{ borderCollapse: "collapse", minWidth: 1000 }}>
        <thead>
          <tr>
            <th style={cell}>Project</th>
            <th style={cell}>Client</th>
            <th style={cell}>Type</th>
            <th style={cell}>Status</th>
            <th style={cell}>Bid Due</th>
            <th style={cell}>CSI</th>
            <th style={cell}>Action</th>
          </tr>
        </thead>

        <tbody>
          {activeProjects.map((project) => (
            <tr key={project.id}>
              <td style={cell}>{project.name}</td>
              <td style={cell}>{project.client}</td>
              <td style={cell}>
                {project.marketSector} / {project.projectCategory} /{" "}
                {project.projectSubtype}
              </td>
              <td style={cell}>{project.status}</td>
              <td style={cell}>{project.bidDueDate}</td>
              <td style={cell}>{project.csiVersion}</td>
              <td style={cell}>
                <Link href={`/projects/${project.id}`}>Open</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </AppShell>
  );
}

const cell: React.CSSProperties = {
  border: "1px solid #555",
  padding: "8px",
};

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
