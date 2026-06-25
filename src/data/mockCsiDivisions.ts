import { getCsiDivisions } from "@/lib/csiCatalog";
import { CsiDivision } from "@/types/Csi";

export const mockCsiDivisions: CsiDivision[] = [
  ...getCsiDivisions("MASTERFORMAT_1995"),
  ...getCsiDivisions("MASTERFORMAT_2004_PLUS"),
];
