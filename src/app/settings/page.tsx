"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import AppShell from "@/components/layout/AppShell";
import Panel from "@/components/ui/Panel";
import {
  clearSettingsPreview,
  dispatchSettingsPreview,
  fileToDataUrl,
  getCompanySettings,
  getUserSettings,
  saveCompanySettings,
  saveUserSettings,
} from "@/lib/settings";
import { CsiMasterFormatVersion } from "@/types/Csi";
import { CompanySettings, UserSettings } from "@/types/Settings";

const csiVersionOptions: CsiMasterFormatVersion[] = [
  "MASTERFORMAT_2004_PLUS",
  "MASTERFORMAT_1995",
];

export default function SettingsPage() {
  const [userSettings, setUserSettings] =
    useState<UserSettings>(() => getUserSettings());
  const [companySettings, setCompanySettings] = useState<CompanySettings>(
    () => getCompanySettings()
  );
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    dispatchSettingsPreview({
      userSettings,
      companySettings,
    });
  }, [userSettings, companySettings]);

  useEffect(() => {
    return () => {
      clearSettingsPreview();
    };
  }, []);

  async function handleLogoUpload(file: File | undefined) {
    if (!file) return;

    const logoDataUrl = await fileToDataUrl(file);
    setSaveMessage("");
    setCompanySettings((settings) => ({
      ...settings,
      logoDataUrl,
    }));
  }

  function saveSettings(event: React.FormEvent) {
    event.preventDefault();
    saveUserSettings(userSettings);
    saveCompanySettings(companySettings);
    setSaveMessage("Settings saved.");
  }

  return (
    <AppShell title="Settings">
      <form onSubmit={saveSettings}>
        <div className="form-grid">
          <Panel title="Display Preferences">
            <div className="form-field">
              <div>Theme</div>
              <div className="radio-group">
                <label className="radio-option">
                  <input
                    type="radio"
                    name="theme"
                    value="light"
                    checked={userSettings.theme === "light"}
                    onChange={() => {
                      setSaveMessage("");
                      setUserSettings({
                        ...userSettings,
                        theme: "light",
                      });
                    }}
                  />
                  Light
                </label>
                <label className="radio-option">
                  <input
                    type="radio"
                    name="theme"
                    value="dark"
                    checked={userSettings.theme === "dark"}
                    onChange={() => {
                      setSaveMessage("");
                      setUserSettings({
                        ...userSettings,
                        theme: "dark",
                      });
                    }}
                  />
                  Dark
                </label>
              </div>
            </div>
          </Panel>

          <Panel title="Company Defaults">
            <div className="form-field">
              <label>
                Default CSI MasterFormat
                <br />
                <select
                  value={companySettings.defaultCsiVersion}
                  onChange={(event) =>
                    setCompanySettings({
                      ...companySettings,
                      defaultCsiVersion: event.target
                        .value as CsiMasterFormatVersion,
                    })
                  }
                  onInput={() => setSaveMessage("")}
                  className="form-input"
                >
                  {csiVersionOptions.map((version) => (
                    <option key={version} value={version}>
                      {formatCsiVersion(version)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </Panel>

          <Panel title="Company Branding">
            <div className="form-field">
              <label>
                Company Name
                <br />
                <input
                  value={companySettings.companyName}
                  onChange={(event) =>
                    setCompanySettings({
                      ...companySettings,
                      companyName: event.target.value,
                    })
                  }
                  onInput={() => setSaveMessage("")}
                  className="form-input"
                />
              </label>
            </div>

            <div className="form-field">
              <ColorField
                label="Primary Accent Color"
                value={companySettings.primaryAccentColor}
                onChange={(primaryAccentColor) => {
                  setSaveMessage("");
                  setCompanySettings({
                    ...companySettings,
                    primaryAccentColor,
                  });
                }}
              />
            </div>

            <div className="form-field">
              <ColorField
                label="Secondary Accent Color"
                value={companySettings.secondaryAccentColor}
                onChange={(secondaryAccentColor) => {
                  setSaveMessage("");
                  setCompanySettings({
                    ...companySettings,
                    secondaryAccentColor,
                  });
                }}
              />
            </div>

            <div className="form-field">
              <ColorField
                label="Proposal Accent Color"
                value={
                  companySettings.proposalAccentColor ||
                  companySettings.primaryAccentColor
                }
                onChange={(proposalAccentColor) => {
                  setSaveMessage("");
                  setCompanySettings({
                    ...companySettings,
                    proposalAccentColor,
                  });
                }}
              />
            </div>
          </Panel>

          <Panel title="Company Logo">
            {companySettings.logoDataUrl && (
              <div className="form-field">
                <Image
                  src={companySettings.logoDataUrl}
                  alt={`${companySettings.companyName} logo preview`}
                  width={40}
                  height={40}
                  unoptimized
                  className="app-brand-logo"
                />
              </div>
            )}

            <div className="form-field">
              <label>
                Upload Logo
                <br />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => handleLogoUpload(event.target.files?.[0])}
                  className="form-input"
                />
              </label>
            </div>

            <button
              type="button"
              className="button-secondary"
              onClick={() =>
                setCompanySettings((settings) => ({
                  ...settings,
                  logoDataUrl: undefined,
                }))
              }
            >
              Clear Logo
            </button>
          </Panel>
        </div>

        <div className="settings-actions">
          <button type="submit" className="button-primary">
            Save Settings
          </button>
          {saveMessage && <span className="save-confirmation">{saveMessage}</span>}
        </div>
      </form>
    </AppShell>
  );
}

function formatCsiVersion(version: CsiMasterFormatVersion) {
  if (version === "MASTERFORMAT_1995") return "MasterFormat 1995 / 16-Division";

  return "MasterFormat 2004+ / 50-Division";
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label>
      {label}
      <span className="color-control">
        <span
          className="color-swatch"
          style={{ backgroundColor: value }}
          aria-hidden="true"
        />
        <input
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="color-input"
        />
        <span className="muted-text">{value}</span>
      </span>
    </label>
  );
}
