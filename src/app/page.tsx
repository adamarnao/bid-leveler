"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { mockBidSubmissions } from "@/data/mockBidSubmissions";
import { getMergedProjects, projectsStorageKey } from "@/lib/projects";
import AppShell from "@/components/layout/AppShell";
import { StoredProjectCsiSelection, StoredProjectCsiSelections } from "@/types/Csi";
import { Project } from "@/types/Project";

const projectCsiSelectionsStorageKey = "projectCsiSelections";
const projectDraftInviteSelectionsStorageKey = "projectDraftInviteSelections";
const EMPTY_PROJECT_CSI_SELECTIONS: StoredProjectCsiSelections = {};
const EMPTY_DRAFT_INVITE_SELECTIONS: StoredProjectDraftInviteSelections = {};
const lookaheadRanges: LookaheadRange[] = [
  { label: "1D", days: 1 },
  { label: "3D", days: 3 },
  { label: "1W", days: 7 },
  { label: "2W", days: 14 },
];
const sortOptions: { label: string; value: ProjectSortKey }[] = [
  { label: "Due Soon", value: "dueSoon" },
  { label: "Health Risk", value: "healthRisk" },
  { label: "Recently Created", value: "recentlyCreated" },
  { label: "Status", value: "status" },
  { label: "Name", value: "name" },
];

type ProjectSortKey =
  | "dueSoon"
  | "healthRisk"
  | "recentlyCreated"
  | "status"
  | "name";

type LookaheadRange = {
  label: string;
  days: number;
};

type StoredProjectDraftInviteCandidate = {
  projectId: string;
  subcontractorId: string;
  projectSectionId?: string;
  projectSectionNumber: string;
  matchType: string;
  confidence: string;
  selectedAt: string;
};

type StoredProjectDraftInviteSelection = {
  projectId: string;
  updatedAt: string;
  candidates: StoredProjectDraftInviteCandidate[];
};

type StoredProjectDraftInviteSelections = Record<
  string,
  StoredProjectDraftInviteSelection
>;

type DashboardProject = {
  project: Project;
  selection: StoredProjectCsiSelection | undefined;
  bidCount: number;
  selectedBidCount: number;
  draftInviteCount: number;
  csiScopeCount: number;
  missingCoverageCount: number;
  healthRisk: number;
  nextDueDate: Date | undefined;
};

type LookaheadEvent = {
  id: string;
  project: Project;
  date: Date;
  type: "Sub Bid Due" | "Bid Review" | "GC Bid Due";
  urgency: DateUrgency;
};

type ActionItem = {
  id: string;
  project: Project;
  reason: string;
  priority: "High" | "Medium" | "Low";
  href: string;
};

type DateUrgency = "Overdue" | "Today" | "Soon" | "Upcoming";

export default function Home() {
  const projects = useProjectsSnapshot();
  const projectCsiSelections = useProjectCsiSelectionsSnapshot();
  const draftInviteSelections = useDraftInviteSelectionsSnapshot();
  const [sortKey, setSortKey] = useState<ProjectSortKey>("dueSoon");
  const [lookaheadRange, setLookaheadRange] = useState<LookaheadRange>(
    lookaheadRanges[2]
  );
  const today = useMemo(() => startOfLocalDay(new Date()), []);
  const activeProjects = useMemo(
    () => projects.filter((project) => !project.archived),
    [projects]
  );
  const dashboardProjects = useMemo(
    () =>
      activeProjects.map((project) =>
        buildDashboardProject(
          project,
          projectCsiSelections[project.id],
          draftInviteSelections[project.id],
          today
        )
      ),
    [activeProjects, draftInviteSelections, projectCsiSelections, today]
  );
  const sortedProjects = useMemo(
    () => sortDashboardProjects(dashboardProjects, sortKey),
    [dashboardProjects, sortKey]
  );
  const lookaheadEvents = useMemo(
    () =>
      buildLookaheadEvents(activeProjects, today, lookaheadRange.days).sort(
        compareLookaheadEvents
      ),
    [activeProjects, lookaheadRange.days, today]
  );
  const actionItems = useMemo(
    () =>
      buildActionItems(dashboardProjects, today)
        .sort(compareActionItems)
        .slice(0, 8),
    [dashboardProjects, today]
  );

  return (
    <AppShell title="Dashboard">
      <div className="dashboard-shell">
        <section className="dashboard-hero">
          <div>
            <p className="label-text">Estimator Dashboard</p>
            <h1>Dashboard</h1>
            <p className="dashboard-subtitle">
              Today&apos;s bid activity, deadlines, and project health.
            </p>
          </div>
          <div className="dashboard-primary-actions">
            <Link href="/projects/new" className="button-primary">
              New Project
            </Link>
            <Link href="/subcontractors/new" className="button-secondary">
              Add Subcontractor
            </Link>
          </div>
        </section>

        <section className="dashboard-grid">
          <div className="dashboard-main-column">
            <section className="dashboard-panel">
              <div className="dashboard-section-header">
                <div>
                  <p className="label-text">Project Health</p>
                  <h2>Active Projects</h2>
                </div>
                <label className="dashboard-sort-control">
                  <span className="label-text">Sort</span>
                  <select
                    value={sortKey}
                    onChange={(event) =>
                      setSortKey(event.target.value as ProjectSortKey)
                    }
                    className="form-input"
                  >
                    {sortOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {sortedProjects.length === 0 ? (
                <div className="dashboard-empty-state">
                  <p className="muted-text">No active projects yet.</p>
                  <Link href="/projects/new" className="button-primary">
                    New Project
                  </Link>
                </div>
              ) : (
                <div className="dashboard-project-card-grid">
                  {sortedProjects.map((dashboardProject) => (
                    <ProjectHealthCard
                      key={dashboardProject.project.id}
                      dashboardProject={dashboardProject}
                      today={today}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>

          <aside className="dashboard-side-column">
            <section className="dashboard-panel">
              <div className="dashboard-section-header">
                <div>
                  <p className="label-text">Lookahead</p>
                  <h2>Calendar</h2>
                </div>
              </div>
              <div className="dashboard-range-control" role="group" aria-label="Lookahead range">
                {lookaheadRanges.map((range) => (
                  <button
                    key={range.label}
                    type="button"
                    className={
                      range.days === lookaheadRange.days
                        ? "dashboard-range-button dashboard-range-button-active"
                        : "dashboard-range-button"
                    }
                    onClick={() => setLookaheadRange(range)}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
              <div className="dashboard-event-list">
                {lookaheadEvents.length === 0 ? (
                  <p className="muted-text">
                    No project deadlines in this range.
                  </p>
                ) : (
                  lookaheadEvents.map((event) => (
                    <Link
                      key={event.id}
                      href={`/projects/${event.project.id}`}
                      className="dashboard-event-row"
                    >
                      <span className="dashboard-event-date">
                        {formatShortDate(event.date)}
                      </span>
                      <span className="badge badge-muted">{event.type}</span>
                      <span className="dashboard-event-project">
                        {event.project.name}
                      </span>
                      <span className={getUrgencyBadgeClass(event.urgency)}>
                        {event.urgency}
                      </span>
                    </Link>
                  ))
                )}
              </div>
              <p className="muted-text dashboard-integration-note">
                Calendar integrations can connect here later.
              </p>
            </section>

            <section className="dashboard-panel">
              <div className="dashboard-section-header">
                <div>
                  <p className="label-text">Action Center</p>
                  <h2>Needs Attention</h2>
                </div>
              </div>
              <div className="dashboard-action-list">
                {actionItems.length === 0 ? (
                  <p className="muted-text">
                    No urgent project signals from existing data.
                  </p>
                ) : (
                  actionItems.map((item) => (
                    <Link
                      key={item.id}
                      href={item.href}
                      className="dashboard-action-item"
                    >
                      <span className={getPriorityBadgeClass(item.priority)}>
                        {item.priority}
                      </span>
                      <span>
                        <strong>{item.project.name}</strong>
                        <span className="muted-text">{item.reason}</span>
                      </span>
                    </Link>
                  ))
                )}
              </div>
            </section>

            <section className="dashboard-panel">
              <div className="dashboard-section-header">
                <div>
                  <p className="label-text">Quick Actions</p>
                  <h2>Launchpad</h2>
                </div>
              </div>
              <div className="dashboard-quick-actions">
                <Link href="/projects/new" className="dashboard-quick-action">
                  New Project
                </Link>
                <Link href="/subcontractors/new" className="dashboard-quick-action">
                  Add Subcontractor
                </Link>
                <Link href="/masterformat" className="dashboard-quick-action">
                  MasterFormat Reference
                </Link>
                <Link href="/subcontractors" className="dashboard-quick-action">
                  Open Subcontractor Library
                </Link>
              </div>
            </section>
          </aside>
        </section>
      </div>
    </AppShell>
  );
}

function ProjectHealthCard({
  dashboardProject,
  today,
}: {
  dashboardProject: DashboardProject;
  today: Date;
}) {
  const { project } = dashboardProject;

  return (
    <article className="dashboard-project-card">
      <div className="dashboard-project-card-top">
        <div>
          <p className="label-text">{project.projectNumber ?? "Project"}</p>
          <h3>{project.name}</h3>
          <p className="muted-text">{project.client}</p>
        </div>
        <span className={getProjectStatusBadgeClass(project.status)}>
          {formatStatus(project.status)}
        </span>
      </div>

      <div className="dashboard-date-grid">
        <ProjectDateMetric
          label="Sub Bid Due"
          value={project.subcontractorBidDueDate}
          today={today}
        />
        <ProjectDateMetric
          label="Bid Review"
          value={project.bidReviewDate}
          today={today}
        />
        <ProjectDateMetric label="GC Bid Due" value={project.bidDueDate} today={today} />
      </div>

      <div className="dashboard-health-chip-grid">
        <HealthChip label="Bids Received" value={dashboardProject.bidCount} />
        <HealthChip label="Selected Bids" value={dashboardProject.selectedBidCount} />
        <HealthChip label="Draft Invites" value={dashboardProject.draftInviteCount} />
        <HealthChip label="CSI Scopes" value={dashboardProject.csiScopeCount} />
        {dashboardProject.missingCoverageCount > 0 && (
          <HealthChip
            label="Missing Coverage"
            value={dashboardProject.missingCoverageCount}
            tone="warning"
          />
        )}
      </div>

      <div className="dashboard-project-card-actions">
        <Link href={`/projects/${project.id}`} className="button-secondary">
          Open
        </Link>
        <Link href={`/projects/${project.id}/setup`} className="button-secondary">
          Setup
        </Link>
        <Link href={`/projects/${project.id}/invite`} className="button-secondary">
          Invites
        </Link>
        <Link href={`/projects/${project.id}/overview`} className="button-secondary">
          Overview
        </Link>
      </div>
    </article>
  );
}

function ProjectDateMetric({
  label,
  value,
  today,
}: {
  label: string;
  value: string | undefined;
  today: Date;
}) {
  const date = parseDateOnly(value);
  const urgency = date ? getDateUrgency(date, today) : undefined;

  return (
    <div className="dashboard-date-metric">
      <span className="label-text">{label}</span>
      <strong>{date ? formatShortDate(date) : "Not set"}</strong>
      {urgency && <span className={getUrgencyBadgeClass(urgency)}>{urgency}</span>}
    </div>
  );
}

function HealthChip({
  label,
  value,
  tone = "muted",
}: {
  label: string;
  value: number;
  tone?: "muted" | "warning";
}) {
  return (
    <span
      className={
        tone === "warning"
          ? "dashboard-health-chip dashboard-health-chip-warning"
          : "dashboard-health-chip"
      }
    >
      <strong>{value}</strong>
      {label}
    </span>
  );
}

let cachedProjectsStorageValue: string | undefined;
let cachedProjects: Project[] = getMergedProjects();
let cachedProjectCsiSelectionsStorageValue: string | undefined;
let cachedProjectCsiSelections: StoredProjectCsiSelections =
  EMPTY_PROJECT_CSI_SELECTIONS;
let cachedDraftInviteSelectionsStorageValue: string | undefined;
let cachedDraftInviteSelections: StoredProjectDraftInviteSelections =
  EMPTY_DRAFT_INVITE_SELECTIONS;

function useProjectsSnapshot(): Project[] {
  return useSyncExternalStore(
    subscribeToDashboardStorage,
    getProjectsSnapshot,
    getServerProjectsSnapshot
  );
}

function useProjectCsiSelectionsSnapshot(): StoredProjectCsiSelections {
  return useSyncExternalStore(
    subscribeToDashboardStorage,
    getProjectCsiSelectionsSnapshot,
    getServerProjectCsiSelectionsSnapshot
  );
}

function useDraftInviteSelectionsSnapshot(): StoredProjectDraftInviteSelections {
  return useSyncExternalStore(
    subscribeToDashboardStorage,
    getDraftInviteSelectionsSnapshot,
    getServerDraftInviteSelectionsSnapshot
  );
}

function subscribeToDashboardStorage(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener("projectCsiSelectionsChange", onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener("projectCsiSelectionsChange", onStoreChange);
  };
}

function getServerProjectsSnapshot(): Project[] {
  return cachedProjects;
}

function getProjectsSnapshot(): Project[] {
  const storageValue = localStorage.getItem(projectsStorageKey) || "[]";

  if (storageValue !== cachedProjectsStorageValue) {
    cachedProjectsStorageValue = storageValue;
    cachedProjects = getMergedProjects(storageValue);
  }

  return cachedProjects;
}

function getServerProjectCsiSelectionsSnapshot(): StoredProjectCsiSelections {
  return EMPTY_PROJECT_CSI_SELECTIONS;
}

function getProjectCsiSelectionsSnapshot(): StoredProjectCsiSelections {
  const storageValue =
    localStorage.getItem(projectCsiSelectionsStorageKey) || "{}";

  if (storageValue !== cachedProjectCsiSelectionsStorageValue) {
    cachedProjectCsiSelectionsStorageValue = storageValue;
    cachedProjectCsiSelections = parseProjectCsiSelections(storageValue);
  }

  return cachedProjectCsiSelections;
}

function getServerDraftInviteSelectionsSnapshot(): StoredProjectDraftInviteSelections {
  return EMPTY_DRAFT_INVITE_SELECTIONS;
}

function getDraftInviteSelectionsSnapshot(): StoredProjectDraftInviteSelections {
  const storageValue =
    localStorage.getItem(projectDraftInviteSelectionsStorageKey) || "{}";

  if (storageValue !== cachedDraftInviteSelectionsStorageValue) {
    cachedDraftInviteSelectionsStorageValue = storageValue;
    cachedDraftInviteSelections = parseDraftInviteSelections(storageValue);
  }

  return cachedDraftInviteSelections;
}

function buildDashboardProject(
  project: Project,
  selection: StoredProjectCsiSelection | undefined,
  draftInviteSelection: StoredProjectDraftInviteSelection | undefined,
  today: Date
): DashboardProject {
  const bids = mockBidSubmissions.filter((bid) => bid.projectId === project.id);
  const selectedBidCount = bids.filter((bid) => bid.isSelected).length;
  const selectedSectionIds = selection?.sectionIds ?? [];
  const csiScopeCount =
    (selection?.divisionIds.length ?? 0) + selectedSectionIds.length;
  const bidSectionIds = new Set(bids.map((bid) => bid.sectionId));
  const missingCoverageCount = selectedSectionIds.filter(
    (sectionId) => !bidSectionIds.has(sectionId)
  ).length;
  const draftInviteCount = draftInviteSelection?.candidates.length ?? 0;
  const nextDueDate = getNextProjectDate(project, today);
  const healthRisk =
    missingCoverageCount * 3 +
    draftInviteCount +
    getOverdueProjectDateCount(project, today) * 4 +
    Math.max(0, selectedSectionIds.length - bidSectionIds.size);

  return {
    project,
    selection,
    bidCount: bids.length,
    selectedBidCount,
    draftInviteCount,
    csiScopeCount,
    missingCoverageCount,
    healthRisk,
    nextDueDate,
  };
}

function buildLookaheadEvents(
  projects: Project[],
  today: Date,
  rangeDays: number
): LookaheadEvent[] {
  const rangeEnd = addDays(today, rangeDays);

  return projects.flatMap((project) =>
    getProjectDateEvents(project, today)
      .filter((event) => event.date >= today && event.date <= rangeEnd)
      .map((event) => ({ ...event, urgency: getDateUrgency(event.date, today) }))
  );
}

function buildActionItems(
  dashboardProjects: DashboardProject[],
  today: Date
): ActionItem[] {
  return dashboardProjects.flatMap((dashboardProject) => {
    const { project } = dashboardProject;
    const dueItems = getProjectDateEvents(project, today)
      .filter((event) => {
        const urgency = getDateUrgency(event.date, today);

        return urgency === "Overdue" || urgency === "Today" || urgency === "Soon";
      })
      .map<ActionItem>((event) => ({
        id: `${project.id}-${event.type}`,
        project,
        reason: `${event.type} is ${getDateUrgency(event.date, today).toLowerCase()}`,
        priority:
          getDateUrgency(event.date, today) === "Overdue" ? "High" : "Medium",
        href: `/projects/${project.id}`,
      }));
    const draftInviteItem =
      dashboardProject.draftInviteCount > 0
        ? [
            {
              id: `${project.id}-draft-invites`,
              project,
              reason: `${dashboardProject.draftInviteCount} draft invite selections`,
              priority: "Medium" as const,
              href: `/projects/${project.id}/invite`,
            },
          ]
        : [];
    const bidsNeedingReview =
      dashboardProject.bidCount > dashboardProject.selectedBidCount
        ? [
            {
              id: `${project.id}-bid-review`,
              project,
              reason: `${dashboardProject.bidCount - dashboardProject.selectedBidCount} received bids need review proxy`,
              priority: "Medium" as const,
              href: `/projects/${project.id}/overview`,
            },
          ]
        : [];
    const missingCoverage =
      dashboardProject.missingCoverageCount > 0
        ? [
            {
              id: `${project.id}-missing-coverage`,
              project,
              reason: `${dashboardProject.missingCoverageCount} CSI scopes missing bid coverage`,
              priority: "High" as const,
              href: `/projects/${project.id}/invite`,
            },
          ]
        : [];

    return [
      ...dueItems,
      ...missingCoverage,
      ...draftInviteItem,
      ...bidsNeedingReview,
    ];
  });
}

function getProjectDateEvents(project: Project, today: Date) {
  return [
    {
      id: `${project.id}-sub-bid-due`,
      project,
      date: parseDateOnly(project.subcontractorBidDueDate),
      type: "Sub Bid Due" as const,
    },
    {
      id: `${project.id}-bid-review`,
      project,
      date: parseDateOnly(project.bidReviewDate),
      type: "Bid Review" as const,
    },
    {
      id: `${project.id}-gc-bid-due`,
      project,
      date: parseDateOnly(project.bidDueDate),
      type: "GC Bid Due" as const,
    },
  ]
    .filter((event): event is Omit<LookaheadEvent, "urgency"> =>
      Boolean(event.date)
    )
    .map((event) => ({
      ...event,
      date: event.date ?? today,
    }));
}

function getNextProjectDate(project: Project, today: Date) {
  const dates = getProjectDateEvents(project, today)
    .map((event) => event.date)
    .filter((date) => date >= today)
    .sort((dateA, dateB) => dateA.getTime() - dateB.getTime());

  return dates[0];
}

function getOverdueProjectDateCount(project: Project, today: Date) {
  return getProjectDateEvents(project, today).filter((event) => event.date < today)
    .length;
}

function sortDashboardProjects(
  projects: DashboardProject[],
  sortKey: ProjectSortKey
) {
  return [...projects].sort((projectA, projectB) => {
    if (sortKey === "dueSoon") {
      return (
        getSortableDateTime(projectA.nextDueDate) -
          getSortableDateTime(projectB.nextDueDate) ||
        projectA.project.name.localeCompare(projectB.project.name)
      );
    }

    if (sortKey === "healthRisk") {
      return (
        projectB.healthRisk - projectA.healthRisk ||
        projectA.project.name.localeCompare(projectB.project.name)
      );
    }

    if (sortKey === "recentlyCreated") {
      return (
        getSortableDateTime(parseDateOnly(projectB.project.createdDate)) -
          getSortableDateTime(parseDateOnly(projectA.project.createdDate)) ||
        projectA.project.name.localeCompare(projectB.project.name)
      );
    }

    if (sortKey === "status") {
      return (
        getStatusSortValue(projectA.project.status) -
          getStatusSortValue(projectB.project.status) ||
        projectA.project.name.localeCompare(projectB.project.name)
      );
    }

    return projectA.project.name.localeCompare(projectB.project.name);
  });
}

function compareLookaheadEvents(eventA: LookaheadEvent, eventB: LookaheadEvent) {
  return (
    eventA.date.getTime() - eventB.date.getTime() ||
    eventA.project.name.localeCompare(eventB.project.name) ||
    eventA.type.localeCompare(eventB.type)
  );
}

function compareActionItems(itemA: ActionItem, itemB: ActionItem) {
  return (
    getPrioritySortValue(itemA.priority) - getPrioritySortValue(itemB.priority) ||
    itemA.project.name.localeCompare(itemB.project.name)
  );
}

function getDateUrgency(date: Date, today: Date): DateUrgency {
  const dayDifference = getDayDifference(today, date);

  if (dayDifference < 0) return "Overdue";
  if (dayDifference === 0) return "Today";
  if (dayDifference <= 3) return "Soon";

  return "Upcoming";
}

function getUrgencyBadgeClass(urgency: DateUrgency) {
  if (urgency === "Overdue") return "badge badge-danger";
  if (urgency === "Today") return "badge badge-warning";
  if (urgency === "Soon") return "badge badge-primary";

  return "badge badge-muted";
}

function getPriorityBadgeClass(priority: ActionItem["priority"]) {
  if (priority === "High") return "badge badge-danger";
  if (priority === "Medium") return "badge badge-warning";

  return "badge badge-muted";
}

function getProjectStatusBadgeClass(status: Project["status"]) {
  if (status === "AWARDED") return "badge badge-success";
  if (status === "NOT_AWARDED" || status === "ARCHIVED") return "badge badge-muted";
  if (status === "SUBMITTED") return "badge badge-primary";

  return "badge badge-warning";
}

function getPrioritySortValue(priority: ActionItem["priority"]) {
  if (priority === "High") return 0;
  if (priority === "Medium") return 1;

  return 2;
}

function getStatusSortValue(status: Project["status"]) {
  const order: Project["status"][] = [
    "BIDDING",
    "PLAN_REVIEW",
    "SUBMITTED",
    "AWARDED",
    "NOT_AWARDED",
    "ARCHIVED",
  ];

  return order.indexOf(status);
}

function getSortableDateTime(date: Date | undefined) {
  return date?.getTime() ?? Number.MAX_SAFE_INTEGER;
}

function parseProjectCsiSelections(
  storageValue: string
): StoredProjectCsiSelections {
  try {
    const parsed = JSON.parse(storageValue);

    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed
      : EMPTY_PROJECT_CSI_SELECTIONS;
  } catch {
    return EMPTY_PROJECT_CSI_SELECTIONS;
  }
}

function parseDraftInviteSelections(
  storageValue: string
): StoredProjectDraftInviteSelections {
  try {
    const parsed = JSON.parse(storageValue);

    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed
      : EMPTY_DRAFT_INVITE_SELECTIONS;
  } catch {
    return EMPTY_DRAFT_INVITE_SELECTIONS;
  }
}

function parseDateOnly(value: string | undefined): Date | undefined {
  if (!value) return undefined;

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return undefined;

  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function startOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);

  return nextDate;
}

function getDayDifference(startDate: Date, endDate: Date) {
  const millisecondsPerDay = 24 * 60 * 60 * 1000;

  return Math.round(
    (startOfLocalDay(endDate).getTime() - startOfLocalDay(startDate).getTime()) /
      millisecondsPerDay
  );
}

function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatStatus(value: string) {
  return value
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}
