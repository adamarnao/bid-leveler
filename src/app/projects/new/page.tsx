"use client";

import AppShell from "@/components/layout/AppShell";
import ProjectForm from "@/components/projects/ProjectForm";
import { appendProject } from "@/lib/projects";
import { getCompanySettings } from "@/lib/settings";
import { Project } from "@/types/Project";

export default function NewProjectPage() {
  const companySettings = getCompanySettings();
  const initialProject: Project = {
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
    status: "PLAN_REVIEW",
    archived: false,
    createdDate: "",
    csiVersion: companySettings.defaultCsiVersion,
  };

  function createProject(project: Project) {
    appendProject({
      ...project,
      id: Date.now().toString(),
      archived: false,
      createdDate: new Date().toISOString().slice(0, 10),
    });

    window.location.href = "/";
  }

  return (
    <AppShell title="Create New Project">
      <ProjectForm
        initialProject={initialProject}
        submitLabel="Create Project"
        onSubmit={createProject}
      />
    </AppShell>
  );
}
