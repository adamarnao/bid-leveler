import { ProjectBidPackage } from "@/types/Bid";
import { BidPackageMatchSummary } from "@/types/SubcontractorMatching";

export type ProjectInviteRecipientSource = "MATCHED" | "MANUAL";

export type ProjectInviteRecipientStatus =
  | "DRAFT"
  | "QUEUED"
  | "SENT"
  | "FAILED"
  | "REMOVED";

export type ProjectInviteRecipientConfidence = "LOW" | "MEDIUM" | "HIGH";

export type ProjectInviteRecipient = {
  id: string;
  projectId: string;
  bidPackageId: string;
  subcontractorId: string;
  contactId?: string;
  email?: string;
  selectedScopeItemIds: string[];
  matchType?: string;
  matchLabel?: string;
  confidence?: ProjectInviteRecipientConfidence;
  coverageRatio?: number;
  source: ProjectInviteRecipientSource;
  status: ProjectInviteRecipientStatus;
  sentAt?: string;
  lastSentAt?: string;
  sendCount?: number;
  lastError?: string;
  addedAt: string;
  updatedAt: string;
};

export type ProjectInviteSendBatch = {
  id: string;
  projectId: string;
  bidPackageIds: string[];
  recipientIds: string[];
  status: "DRAFT" | "QUEUED" | "SENT" | "FAILED";
  createdAt: string;
  sentAt?: string;
};

export type ProjectInviteSendLog = {
  id: string;
  projectId: string;
  bidPackageId: string;
  recipientId: string;
  subcontractorId: string;
  contactId?: string;
  email?: string;
  status: "QUEUED" | "SENT" | "FAILED";
  message?: string;
  createdAt: string;
};

export type GenerateInviteRecipientsInput = {
  projectId: string;
  bidPackages: ProjectBidPackage[];
  packageMatches: BidPackageMatchSummary[];
};
