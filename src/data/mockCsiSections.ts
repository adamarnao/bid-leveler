import { getCsiSections } from "@/lib/csiCatalog";
import { CsiSection } from "@/types/Csi";

export const mockCsiSections: CsiSection[] = [
  ...getCsiSections("MASTERFORMAT_CURRENT"),
];
