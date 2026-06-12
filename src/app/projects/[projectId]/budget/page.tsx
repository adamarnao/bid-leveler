import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import { mockProjects } from "@/data/mockProjects";

type ProjectBudgetPageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

export default async function ProjectBudgetPage({
  params,
}: ProjectBudgetPageProps) {
  const { projectId } = await params;
  const project = mockProjects.find((p) => p.id === projectId);

  if (!project) {
    return (
      <AppShell title="Project Not Found">
        <p>Requested project ID: {projectId}</p>
        <Link href="/">Back to Dashboard</Link>
      </AppShell>
    );
  }

  return (
    <AppShell title={`${project.name} — Budget`}>
      <p>
        Project-specific budget values will be entered here and used when no
        subcontractor bid has been selected.
      </p>
    </AppShell>
  );
}
