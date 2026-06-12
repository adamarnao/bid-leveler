"use client";

import { useState } from "react";
import Image from "next/image";
import AppShell from "@/components/layout/AppShell";
import Panel from "@/components/ui/Panel";
import {
  fileToDataUrl,
  getCompanySettings,
  getUserSettings,
  saveCompanySettings,
  saveUserSettings,
} from "@/lib/settings";
import { CsiMasterFormatVersion } from "@/types/Csi";
import { CompanySettings, UserSettings } from "@/types/Settings";

const csiVersionOptions: CsiMasterFormatVersion[] = [
  "MASTERFORMAT_CURRENT",
  "MASTERFORMAT_1995",
];

export default function SettingsPage() {
  const [userSettings, setUserSettings] =
    useState<UserSettings>(() => getUserSettings());
  const [companySettings, setCompanySettings] = useState<CompanySettings>(
    () => getCompanySettings()
  );
  const [saveMessage, setSaveMessage] = useState("");

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
      <form
        onSubmit={saveSettings}
        data-theme={userSettings.theme}
        style={
          {
            "--color-accent-primary": companySettings.primaryAccentColor,
            "--color-accent-secondary": companySettings.secondaryAccentColor,
          } as React.CSSProperties
        }
      >
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
              <label>
                Primary Accent Color
                <br />
                <input
                  type="color"
                  value={companySettings.primaryAccentColor}
                  onChange={(event) =>
                    setCompanySettings({
                      ...companySettings,
                      primaryAccentColor: event.target.value,
                    })
                  }
                  onInput={() => setSaveMessage("")}
                  className="form-input"
                />
              </label>
            </div>

            <div className="form-field">
              <label>
                Secondary Accent Color
                <br />
                <input
                  type="color"
                  value={companySettings.secondaryAccentColor}
                  onChange={(event) =>
                    setCompanySettings({
                      ...companySettings,
                      secondaryAccentColor: event.target.value,
                    })
                  }
                  onInput={() => setSaveMessage("")}
                  className="form-input"
                />
              </label>
            </div>

            <div className="form-field">
              <label>
                Proposal Accent Color
                <br />
                <input
                  type="color"
                  value={
                    companySettings.proposalAccentColor ||
                    companySettings.primaryAccentColor
                  }
                  onChange={(event) =>
                    setCompanySettings({
                      ...companySettings,
                      proposalAccentColor: event.target.value,
                    })
                  }
                  onInput={() => setSaveMessage("")}
                  className="form-input"
                />
              </label>
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
  if (version === "MASTERFORMAT_1995") return "MasterFormat 1995";

  return "Current MasterFormat";
}
