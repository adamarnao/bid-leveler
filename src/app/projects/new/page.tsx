"use client";

import AppShell from "@/components/layout/AppShell";
import ProjectSetupFlow from "@/components/projects/ProjectSetupFlow";

export default function NewProjectPage() {
  return (
    <AppShell title="Create Project">
      <ProjectSetupFlow mode="create" />
    </AppShell>
  );
}
