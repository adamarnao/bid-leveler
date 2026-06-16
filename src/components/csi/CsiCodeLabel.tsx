import { resolveCsiCatalogItem } from "@/lib/csiCatalog";
import { getCsiItemDisplayLabel } from "@/lib/csiDisplay";
import { CsiCatalogItem, CsiMasterFormatVersion } from "@/types/Csi";
import { CsiLevelBadge } from "./CsiLevelBadge";

type CsiCodeLabelProps = {
  item?: CsiCatalogItem;
  version?: CsiMasterFormatVersion;
  idOrNumber?: string;
  showLevelBadge?: boolean;
  className?: string;
};

export function CsiCodeLabel({
  item,
  version,
  idOrNumber,
  showLevelBadge = false,
  className,
}: CsiCodeLabelProps) {
  const resolvedItem =
    item ?? (version && idOrNumber ? resolveCsiCatalogItem(version, idOrNumber) : undefined);
  const fallbackLabel = idOrNumber ?? "Unresolved CSI item";
  const classes = ["csi-code-label", className].filter(Boolean).join(" ");

  if (!resolvedItem) {
    return (
      <span className={classes} title={fallbackLabel}>
        <span className="csi-code-label-title">{fallbackLabel}</span>
      </span>
    );
  }

  return (
    <span className={classes} title={getCsiItemDisplayLabel(resolvedItem)}>
      <span className="csi-code-label-code">{resolvedItem.number}</span>
      <span className="csi-code-label-title">{resolvedItem.name}</span>
      {showLevelBadge ? <CsiLevelBadge item={resolvedItem} /> : null}
    </span>
  );
}
