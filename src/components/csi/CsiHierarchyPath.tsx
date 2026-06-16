import { getCsiAncestors, resolveCsiCatalogItem } from "@/lib/csiCatalog";
import { getCsiItemDisplayLabel } from "@/lib/csiDisplay";
import { CsiCatalogItem, CsiMasterFormatVersion } from "@/types/Csi";

type CsiHierarchyPathProps = {
  item?: CsiCatalogItem;
  version?: CsiMasterFormatVersion;
  idOrNumber?: string;
  includeCurrent?: boolean;
  className?: string;
};

export function CsiHierarchyPath({
  item,
  version,
  idOrNumber,
  includeCurrent = false,
  className,
}: CsiHierarchyPathProps) {
  const resolvedItem =
    item ?? (version && idOrNumber ? resolveCsiCatalogItem(version, idOrNumber) : undefined);
  const classes = ["csi-hierarchy-path", className].filter(Boolean).join(" ");

  if (!resolvedItem) {
    return (
      <span className={classes}>
        {idOrNumber ? `Unresolved CSI item: ${idOrNumber}` : "No CSI hierarchy available"}
      </span>
    );
  }

  const pathItems = [
    ...getCsiAncestors(resolvedItem.version, resolvedItem.id),
    ...(includeCurrent ? [resolvedItem] : []),
  ];

  if (pathItems.length === 0) {
    return <span className={classes}>No parent hierarchy</span>;
  }

  return (
    <span className={classes} title={pathItems.map(getCsiItemDisplayLabel).join(" > ")}>
      {pathItems.map((pathItem, index) => (
        <span className="csi-hierarchy-path-item" key={pathItem.id}>
          {index > 0 ? <span className="csi-hierarchy-path-separator">/</span> : null}
          <span className="csi-hierarchy-path-code">{pathItem.number}</span>
          <span className="csi-hierarchy-path-title">{pathItem.name}</span>
        </span>
      ))}
    </span>
  );
}
