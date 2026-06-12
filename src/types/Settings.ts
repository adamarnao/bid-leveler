import { CsiMasterFormatVersion } from "@/types/Csi";

export type UserSettings = {
  theme: "light" | "dark";
};

export type CompanySettings = {
  companyName: string;
  primaryAccentColor: string;
  secondaryAccentColor: string;
  defaultCsiVersion: CsiMasterFormatVersion;
  logoDataUrl?: string;
  proposalAccentColor?: string;
};
