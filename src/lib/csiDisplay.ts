import { CsiCatalogItem } from "@/types/Csi";

export type CsiLevelTone = "primary" | "secondary" | "success" | "muted";

export function getCsiLevelLabel(level?: number): string {
  switch (level) {
    case 1:
      return "Division";
    case 2:
      return "Subdivision";
    case 3:
      return "Section";
    case 4:
      return "Subsection";
    default:
      return "CSI Item";
  }
}

export function getCsiLevelTone(level?: number): CsiLevelTone {
  switch (level) {
    case 1:
      return "primary";
    case 2:
      return "secondary";
    case 3:
      return "success";
    default:
      return "muted";
  }
}

export function getCsiItemDisplayLabel(item: CsiCatalogItem): string {
  return `${item.number} - ${item.name}`;
}

export function getCsiItemShortLabel(item: CsiCatalogItem): string {
  return item.number;
}
