"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  defaultCompanySettings,
  getCompanySettings,
  getUserSettings,
  SettingsPreview,
  settingsChangedEvent,
  settingsPreviewChangedEvent,
  settingsPreviewClearedEvent,
} from "@/lib/settings";
import { CompanySettings, UserSettings } from "@/types/Settings";

const sidebarCollapsedStorageKey = "appShellSidebarCollapsed";

const navItems = [
  {
    href: "/",
    label: "Dashboard",
    compactLabel: "DB",
    isActive: (pathname: string) => pathname === "/",
  },
  {
    href: "/projects/new",
    label: "Create Project",
    compactLabel: "+P",
    isActive: (pathname: string) => pathname === "/projects/new",
  },
  {
    href: "/subcontractors",
    label: "Subcontractors",
    compactLabel: "SC",
    isActive: (pathname: string) => pathname.startsWith("/subcontractors"),
  },
  {
    href: "/budgets",
    label: "Budgets",
    compactLabel: "BG",
    isActive: (pathname: string) => pathname.startsWith("/budgets"),
  },
  {
    href: "/reports",
    label: "Reports",
    compactLabel: "RP",
    isActive: (pathname: string) => pathname.startsWith("/reports"),
  },
  {
    href: "/settings",
    label: "Settings",
    compactLabel: "ST",
    isActive: (pathname: string) => pathname === "/settings",
  },
];

export default function AppShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [companySettings, setCompanySettings] = useState<CompanySettings>(
    defaultCompanySettings
  );
  const [previewSettings, setPreviewSettings] = useState<SettingsPreview | null>(
    null
  );
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const effectiveUserSettings = previewSettings?.userSettings ?? userSettings;
  const effectiveCompanySettings =
    previewSettings?.companySettings ?? companySettings;
  const brandInitials = getBrandInitials(effectiveCompanySettings.companyName);

  useEffect(() => {
    if (!effectiveUserSettings) return;

    const root = document.documentElement;

    root.dataset.theme = effectiveUserSettings.theme;
    root.style.setProperty(
      "--color-accent-primary",
      effectiveCompanySettings.primaryAccentColor
    );
    root.style.setProperty(
      "--color-accent-secondary",
      effectiveCompanySettings.secondaryAccentColor
    );
  }, [effectiveUserSettings, effectiveCompanySettings]);

  useEffect(() => {
    function loadSettings() {
      setUserSettings(getUserSettings());
      setCompanySettings(getCompanySettings());
    }

    loadSettings();
    window.addEventListener("storage", loadSettings);
    window.addEventListener(settingsChangedEvent, loadSettings);

    return () => {
      window.removeEventListener("storage", loadSettings);
      window.removeEventListener(settingsChangedEvent, loadSettings);
    };
  }, []);

  useEffect(() => {
    function handlePreviewChange(event: Event) {
      setPreviewSettings((event as CustomEvent<SettingsPreview>).detail);
    }

    function handlePreviewClear() {
      setPreviewSettings(null);
    }

    window.addEventListener(settingsPreviewChangedEvent, handlePreviewChange);
    window.addEventListener(settingsPreviewClearedEvent, handlePreviewClear);

    return () => {
      window.removeEventListener(settingsPreviewChangedEvent, handlePreviewChange);
      window.removeEventListener(settingsPreviewClearedEvent, handlePreviewClear);
    };
  }, []);

  useEffect(() => {
    let isActive = true;

    queueMicrotask(() => {
      if (!isActive) return;

      setSidebarCollapsed(
        window.localStorage.getItem(sidebarCollapsedStorageKey) === "true"
      );
    });

    return () => {
      isActive = false;
    };
  }, []);

  function toggleSidebarCollapsed() {
    setSidebarCollapsed((currentValue) => {
      const nextValue = !currentValue;

      window.localStorage.setItem(
        sidebarCollapsedStorageKey,
        String(nextValue)
      );

      return nextValue;
    });
  }

  return (
    <div
      className={
        sidebarCollapsed
          ? "app-shell app-shell-sidebar-collapsed"
          : "app-shell"
      }
      data-theme={effectiveUserSettings?.theme}
      style={
        {
          "--color-accent-primary": effectiveCompanySettings.primaryAccentColor,
          "--color-accent-secondary": effectiveCompanySettings.secondaryAccentColor,
        } as React.CSSProperties
      }
    >
      <aside className="app-sidebar">
        <div className="app-brand">
          {effectiveCompanySettings.logoDataUrl ? (
            <Image
              src={effectiveCompanySettings.logoDataUrl}
              alt={`${effectiveCompanySettings.companyName} logo`}
              width={40}
              height={40}
              unoptimized
              className="app-brand-logo"
            />
          ) : (
            <span className="app-brand-initials">{brandInitials}</span>
          )}
          <h2 className="app-brand-name">
            {effectiveCompanySettings.companyName || "Bid Leveler"}
          </h2>
        </div>

        <button
          type="button"
          className="app-sidebar-toggle"
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!sidebarCollapsed}
          onClick={toggleSidebarCollapsed}
        >
          <span className="app-sidebar-toggle-expanded">Collapse</span>
          <span className="app-sidebar-toggle-collapsed">Expand</span>
        </button>

        <nav className="app-nav">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={getNavLinkClassName(item.isActive(pathname))}
              title={item.label}
              aria-label={item.label}
            >
              <span className="app-nav-label">{item.label}</span>
              <span className="app-nav-compact-label">{item.compactLabel}</span>
            </Link>
          ))}
        </nav>
      </aside>

      <div className="app-content-area">
        <header className="app-top-bar">
          <h1 className="app-page-title">{title}</h1>
        </header>

        <main className="app-main">{children}</main>
      </div>
    </div>
  );
}

function getNavLinkClassName(isActive: boolean) {
  return isActive ? "app-nav-link app-nav-link-active" : "app-nav-link";
}

function getBrandInitials(companyName: string) {
  const initials = companyName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");

  return initials || "BL";
}
