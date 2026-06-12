import { BidSubmission } from "@/types/BidSubmission";

export function getSelectedBidForSection(
  bids: BidSubmission[],
  projectId: string,
  sectionId: string
): BidSubmission | undefined {
  return bids.find(
    (bid) =>
      bid.projectId === projectId &&
      bid.sectionId === sectionId &&
      bid.isSelected
  );
}