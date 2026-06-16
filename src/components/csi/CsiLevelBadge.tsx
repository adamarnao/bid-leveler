import { getCsiLevelLabel, getCsiLevelTone } from "@/lib/csiDisplay";
import { CsiCatalogItem } from "@/types/Csi";

type CsiLevelBadgeProps = {
  level?: number;
  item?: CsiCatalogItem;
  className?: string;
};

export function CsiLevelBadge({
  level,
  item,
  className,
}: CsiLevelBadgeProps) {
  const resolvedLevel = item?.level ?? level;
  const tone = getCsiLevelTone(resolvedLevel);
  const classes = ["csi-level-badge", `csi-level-badge-${tone}`, className]
    .filter(Boolean)
    .join(" ");

  return <span className={classes}>{getCsiLevelLabel(resolvedLevel)}</span>;
}
