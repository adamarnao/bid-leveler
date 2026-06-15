import { mockProjects } from "@/data/mockProjects";
import { mockBidSubmissions } from "@/data/mockBidSubmissions";
import {
  getProjectCsiSectionsByDivision,
  projectCsiIdsReferToSameItem,
  resolveProjectCsiDivision,
} from "@/lib/projectCsiSelections";

type DivisionPageProps = {
  params: Promise<{
    projectId: string;
    divisionId: string;
  }>;
};

export default async function DivisionPage({
  params,
}: DivisionPageProps) {
  const { projectId, divisionId } = await params;

  const project = mockProjects.find((p) => p.id === projectId);

  if (!project) {
    return <h1>Project Not Found</h1>;
  }

  const division = resolveProjectCsiDivision(project.csiVersion, divisionId);

  if (!division) {
    return <h1>Division Not Found</h1>;
  }

  const sections = getProjectCsiSectionsByDivision(
    project.csiVersion,
    division.id
  );

  return (
    <main style={{ padding: 24 }}>
      <a href={`/projects/${project.id}`}>
        ← Back to Project Dashboard
      </a>

      <h1>
        Division {division.number} - {division.name}
      </h1>

      {sections.map((section) => {
        const bids = mockBidSubmissions.filter(
          (bid) =>
            bid.projectId === project.id &&
            projectCsiIdsReferToSameItem(
              project.csiVersion,
              bid.sectionId,
              section.id
            )
        );

        return (
          <section
            key={section.id}
            style={{
              border: "1px solid #555",
              padding: 16,
              marginTop: 24,
              borderRadius: 8,
            }}
          >
            <h2>
              {section.number} - {section.name}
            </h2>

            {bids.length === 0 ? (
              <p>No bids received.</p>
            ) : (
              <table
                style={{
                  borderCollapse: "collapse",
                  minWidth: 1000,
                }}
              >
                <thead>
                  <tr>
                    <th style={cell}>Selected</th>
                    <th style={cell}>Subcontractor</th>
                    <th style={cell}>Amount</th>
                    <th style={cell}>Inclusions</th>
                    <th style={cell}>Exclusions</th>
                    <th style={cell}>Clarifications</th>
                  </tr>
                </thead>

                <tbody>
                  {bids.map((bid) => (
                    <tr key={bid.id}>
                      <td style={cell}>
                        {bid.isSelected ? "✓" : ""}
                      </td>

                      <td style={cell}>
                        {bid.subcontractorName}
                      </td>

                      <td style={cell}>
                        ${bid.amount.toLocaleString()}
                      </td>

                      <td style={cell}>
                        {bid.inclusions}
                      </td>

                      <td style={cell}>
                        {bid.exclusions}
                      </td>

                      <td style={cell}>
                        {bid.clarifications}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        );
      })}
    </main>
  );
}

const cell: React.CSSProperties = {
  border: "1px solid #555",
  padding: "8px",
  verticalAlign: "top",
};
