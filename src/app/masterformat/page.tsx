"use client";

import { useMemo, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import Panel from "@/components/ui/Panel";
import {
  getCsiAncestors,
  getCsiCatalog,
  getCsiCatalogTree,
  getCsiItemsByLevel,
} from "@/lib/csiCatalog";
import { getCompanySettings } from "@/lib/settings";
import {
  CsiCatalogItem,
  CsiCatalogTreeNode,
  CsiMasterFormatVersion,
} from "@/types/Csi";

type LevelFilter = "ALL" | "1" | "2" | "3" | "4";

const csiVersionOptions: CsiMasterFormatVersion[] = [
  "MASTERFORMAT_CURRENT",
  "MASTERFORMAT_1995",
];

const levelFilterOptions: LevelFilter[] = ["ALL", "1", "2", "3", "4"];

export default function MasterFormatPage() {
  const [version, setVersion] = useState<CsiMasterFormatVersion>(
    () => getCompanySettings().defaultCsiVersion
  );
  const [expandedItemIds, setExpandedItemIds] = useState<Set<string>>(
    () => new Set()
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<LevelFilter>("ALL");
  const [selectedItemId, setSelectedItemId] = useState<string | undefined>();
  const catalog = useMemo(() => getCsiCatalog(version), [version]);
  const catalogTree = useMemo(() => getCsiCatalogTree(version), [version]);
  const catalogItemById = useMemo(
    () => new Map(catalog.map((item) => [item.id, item])),
    [catalog]
  );
  const selectedItem = selectedItemId
    ? catalogItemById.get(selectedItemId)
    : undefined;
  const stats = useMemo(
    () => ({
      total: catalog.length,
      level1: getCsiItemsByLevel(version, 1).length,
      level2: getCsiItemsByLevel(version, 2).length,
      level3: getCsiItemsByLevel(version, 3).length,
      level4: getCsiItemsByLevel(version, 4).length,
    }),
    [catalog.length, version]
  );
  const searchableItems = useMemo(
    () => filterCatalogItems(catalog, searchQuery, levelFilter),
    [catalog, levelFilter, searchQuery]
  );
  const isSearching = searchQuery.trim().length > 0 || levelFilter !== "ALL";

  function handleVersionChange(nextVersion: CsiMasterFormatVersion) {
    setVersion(nextVersion);
    setExpandedItemIds(new Set());
    setSelectedItemId(undefined);
    setSearchQuery("");
    setLevelFilter("ALL");
  }

  function toggleExpanded(itemId: string) {
    setExpandedItemIds((currentIds) => {
      const nextIds = new Set(currentIds);

      if (nextIds.has(itemId)) {
        nextIds.delete(itemId);
      } else {
        nextIds.add(itemId);
      }

      return nextIds;
    });
  }

  function expandAll() {
    setExpandedItemIds(new Set(getExpandableTreeNodeIds(catalogTree)));
  }

  function collapseAll() {
    setExpandedItemIds(new Set());
  }

  return (
    <AppShell title="MasterFormat Reference">
      <Panel title="Catalog Browser">
        <div className="masterformat-toolbar">
          <div className="form-field">
            <label>
              MasterFormat Version
              <br />
              <select
                className="form-input"
                value={version}
                onChange={(event) =>
                  handleVersionChange(event.target.value as CsiMasterFormatVersion)
                }
              >
                {csiVersionOptions.map((option) => (
                  <option key={option} value={option}>
                    {formatCsiVersion(option)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="form-field">
            <label>
              Search
              <br />
              <input
                className="form-input"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Code or title"
              />
            </label>
          </div>

          <div className="form-field">
            <label>
              Level
              <br />
              <select
                className="form-input"
                value={levelFilter}
                onChange={(event) =>
                  setLevelFilter(event.target.value as LevelFilter)
                }
              >
                {levelFilterOptions.map((option) => (
                  <option key={option} value={option}>
                    {formatLevelFilter(option)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="masterformat-toolbar-actions">
            <button type="button" className="button-secondary" onClick={expandAll}>
              Expand All
            </button>
            <button
              type="button"
              className="button-secondary"
              onClick={collapseAll}
            >
              Collapse All
            </button>
          </div>
        </div>

        <div className="masterformat-stats">
          <span className="badge badge-muted">{stats.total} total items</span>
          <span className="badge badge-muted">{stats.level1} divisions</span>
          <span className="badge badge-muted">{stats.level2} subdivisions</span>
          <span className="badge badge-muted">{stats.level3} sections</span>
          <span className="badge badge-muted">{stats.level4} subsections</span>
        </div>
      </Panel>

      <div className="masterformat-layout">
        <Panel title={isSearching ? "Search Results" : "Hierarchy"}>
          {isSearching ? (
            <SearchResults
              version={version}
              items={searchableItems}
              selectedItemId={selectedItemId}
              onSelect={setSelectedItemId}
            />
          ) : (
            <div className="masterformat-tree">
              {catalogTree.map((node) => (
                <TreeNode
                  key={node.item.id}
                  node={node}
                  depth={0}
                  expandedItemIds={expandedItemIds}
                  selectedItemId={selectedItemId}
                  onToggleExpanded={toggleExpanded}
                  onSelect={setSelectedItemId}
                />
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Selected Item">
          {selectedItem ? (
            <SelectedItemDetail version={version} item={selectedItem} />
          ) : (
            <p className="muted-text">
              Select a MasterFormat row to view its ID, level, and parent chain.
            </p>
          )}
        </Panel>
      </div>
    </AppShell>
  );
}

function TreeNode({
  node,
  depth,
  expandedItemIds,
  selectedItemId,
  onToggleExpanded,
  onSelect,
}: {
  node: CsiCatalogTreeNode;
  depth: number;
  expandedItemIds: Set<string>;
  selectedItemId: string | undefined;
  onToggleExpanded: (itemId: string) => void;
  onSelect: (itemId: string) => void;
}) {
  const hasChildren = node.children.length > 0;
  const isExpanded = expandedItemIds.has(node.item.id);
  const isSelected = selectedItemId === node.item.id;

  return (
    <div className="masterformat-tree-node">
      <div
        className={
          isSelected
            ? "masterformat-tree-row masterformat-tree-row-selected"
            : "masterformat-tree-row"
        }
        style={{ "--tree-depth": depth } as React.CSSProperties}
      >
        <button
          type="button"
          className="masterformat-tree-toggle"
          aria-label={
            hasChildren
              ? `${isExpanded ? "Collapse" : "Expand"} ${node.item.number}`
              : `${node.item.number} has no child rows`
          }
          aria-expanded={hasChildren ? isExpanded : undefined}
          disabled={!hasChildren}
          onClick={() => onToggleExpanded(node.item.id)}
        >
          {hasChildren ? (isExpanded ? "-" : "+") : ""}
        </button>
        <button
          type="button"
          className="masterformat-tree-item"
          onClick={() => onSelect(node.item.id)}
        >
          <span className="masterformat-code">{node.item.number}</span>
          <span className="masterformat-name">{node.item.name}</span>
          <span className="badge badge-muted">{formatLevelLabel(node.item)}</span>
        </button>
      </div>

      {isExpanded &&
        node.children.map((childNode) => (
          <TreeNode
            key={childNode.item.id}
            node={childNode}
            depth={depth + 1}
            expandedItemIds={expandedItemIds}
            selectedItemId={selectedItemId}
            onToggleExpanded={onToggleExpanded}
            onSelect={onSelect}
          />
        ))}
    </div>
  );
}

function SearchResults({
  version,
  items,
  selectedItemId,
  onSelect,
}: {
  version: CsiMasterFormatVersion;
  items: CsiCatalogItem[];
  selectedItemId: string | undefined;
  onSelect: (itemId: string) => void;
}) {
  if (items.length === 0) {
    return <p className="muted-text">No MasterFormat rows match the search.</p>;
  }

  return (
    <div className="masterformat-search-results">
      {items.map((item) => {
        const parentPath = getParentPath(version, item);

        return (
          <button
            key={item.id}
            type="button"
            className={
              selectedItemId === item.id
                ? "masterformat-search-row masterformat-search-row-selected"
                : "masterformat-search-row"
            }
            onClick={() => onSelect(item.id)}
          >
            <span className="masterformat-code">{item.number}</span>
            <span className="masterformat-search-content">
              <strong>{item.name}</strong>
              {parentPath && <span className="muted-text">{parentPath}</span>}
            </span>
            <span className="badge badge-muted">{formatLevelLabel(item)}</span>
          </button>
        );
      })}
    </div>
  );
}

function SelectedItemDetail({
  version,
  item,
}: {
  version: CsiMasterFormatVersion;
  item: CsiCatalogItem;
}) {
  const ancestors = getCsiAncestors(version, item.id);

  return (
    <div className="masterformat-detail">
      <dl className="detail-list">
        <div>
          <dt>ID</dt>
          <dd>{item.id}</dd>
        </div>
        <div>
          <dt>Number</dt>
          <dd>{item.number}</dd>
        </div>
        <div>
          <dt>Name</dt>
          <dd>{item.name}</dd>
        </div>
        <div>
          <dt>Level</dt>
          <dd>{formatLevelLabel(item)}</dd>
        </div>
      </dl>

      <div className="detail-group">
        <h3>Parent Chain</h3>
        {ancestors.length === 0 ? (
          <p className="muted-text">Root item</p>
        ) : (
          <ol className="masterformat-parent-chain">
            {ancestors.map((ancestor) => (
              <li key={ancestor.id}>
                <span className="masterformat-code">{ancestor.number}</span>{" "}
                {ancestor.name}
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}

function filterCatalogItems(
  catalog: CsiCatalogItem[],
  query: string,
  levelFilter: LevelFilter
) {
  const normalizedQuery = query.trim().toLowerCase();

  return catalog.filter((item) => {
    const matchesLevel =
      levelFilter === "ALL" || item.level === Number(levelFilter);
    const matchesQuery =
      normalizedQuery.length === 0 ||
      `${item.number} ${item.name}`.toLowerCase().includes(normalizedQuery);

    return matchesLevel && matchesQuery;
  });
}

function getParentPath(version: CsiMasterFormatVersion, item: CsiCatalogItem) {
  return getCsiAncestors(version, item.id)
    .map((ancestor) => `${ancestor.number} ${ancestor.name}`)
    .join(" / ");
}

function getExpandableTreeNodeIds(nodes: CsiCatalogTreeNode[]) {
  const ids: string[] = [];

  nodes.forEach((node) => {
    if (node.children.length > 0) {
      ids.push(node.item.id);
      ids.push(...getExpandableTreeNodeIds(node.children));
    }
  });

  return ids;
}

function formatCsiVersion(version: CsiMasterFormatVersion) {
  return version === "MASTERFORMAT_1995"
    ? "MasterFormat 1995"
    : "Current MasterFormat";
}

function formatLevelFilter(filter: LevelFilter) {
  if (filter === "ALL") return "All";
  if (filter === "1") return "Divisions";
  if (filter === "2") return "Subdivisions";
  if (filter === "3") return "Sections";

  return "Subsections";
}

function formatLevelLabel(item: CsiCatalogItem) {
  if (item.level === 1) return "Level 1 Division";
  if (item.level === 2) return "Level 2 Subdivision";
  if (item.level === 3) return "Level 3 Section";
  if (item.level === 4) return "Level 4 Subsection";

  return `Level ${item.level}`;
}
