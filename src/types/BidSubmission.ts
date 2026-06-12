export type BidSubmission = {
  id: string;

  projectId: string;
  divisionId: string;
  sectionId: string;

  subcontractorId: string;
  subcontractorName: string;

  amount: number;

  inclusions?: string;
  exclusions?: string;
  clarifications?: string;
  notes?: string;

  submittedDate: string;

  isSelected: boolean;
};