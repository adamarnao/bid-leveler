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
  const effectiveUserSettings = previewSettings?.userSettings ?? userSettings;
  const effectiveCompanySettings =
    previewSettings?.companySettings ?? companySettings;

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

  return (
    <div
      className="app-shell"
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
          {effectiveCompanySettings.logoDataUrl && (
            <Image
              src={effectiveCompanySettings.logoDataUrl}
              alt={`${effectiveCompanySettings.companyName} logo`}
              width={40}
              height={40}
              unoptimized
              className="app-brand-logo"
            />
          )}
          <h2 className="app-brand-name">
            {effectiveCompanySettings.companyName || "Bid Leveler"}
          </h2>
        </div>

        <nav className="app-nav">
          <Link href="/" className={getNavLinkClassName(pathname === "/")}>
            Dashboard
          </Link>
          <Link
            href="/projects/new"
            className={getNavLinkClassName(pathname === "/projects/new")}
          >
            Create Project
          </Link>
          <Link
            href="/subcontractors"
            className={getNavLinkClassName(pathname.startsWith("/subcontractors"))}
          >
            Subcontractors
          </Link>
          <Link
            href="/budgets"
            className={getNavLinkClassName(pathname.startsWith("/budgets"))}
          >
            Budgets
          </Link>
          <Link
            href="/reports"
            className={getNavLinkClassName(pathname.startsWith("/reports"))}
          >
            Reports
          </Link>
          <Link
            href="/settings"
            className={getNavLinkClassName(pathname === "/settings")}
          >
            Settings
          </Link>
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
