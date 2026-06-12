import { CsiMasterFormatVersion } from "./Csi";

export type ProjectStatus =
  | "PLAN_REVIEW"
  | "BIDDING"
  | "SUBMITTED"
  | "AWARDED"
  | "NOT_AWARDED"
  | "ARCHIVED";

export type MarketSector =
  | "Residential"
  | "Commercial"
  | "Medical"
  | "Industrial"
  | "Government"
  | "Education"
  | "Hospitality"
  | "Civil"
  | "Energy"
  | "Other";

export type Project = {
  id: string;

  projectNumber?: string;
  name: string;
  client: string;
  estimator?: string;

  marketSector: MarketSector;
  projectCategory: string;
  projectSubtype: string;

  address: string;
  city: string;
  state: string;
  zip: string;

  squareFootage?: number;
  projectDurationMonths?: number;

  deliveryMethod?: string;
  ownershipType?: string;

  planLink?: string;
  documentNotes?: string;

  subcontractorBidDueDate?: string;
  bidReviewDate?: string;
  bidDueDate: string;

  status: ProjectStatus;

  archived: boolean;
  createdDate: string;

  csiVersion: CsiMasterFormatVersion;
};
