import { CompanySettings, UserSettings } from "@/types/Settings";

export const userSettingsKey = "userSettings";
export const companySettingsKey = "companySettings";
export const settingsChangedEvent = "bidLevelerSettingsChanged";

export const defaultUserSettings: UserSettings = {
  theme: "light",
};

export const defaultCompanySettings: CompanySettings = {
  companyName: "Bid Leveler",
  primaryAccentColor: "#2563eb",
  secondaryAccentColor: "#64748b",
  defaultCsiVersion: "MASTERFORMAT_CURRENT",
};

export function getUserSettings(): UserSettings {
  return {
    ...defaultUserSettings,
    ...readJson<UserSettings>(userSettingsKey, defaultUserSettings),
  };
}

export function saveUserSettings(settings: UserSettings) {
  writeJson(userSettingsKey, settings);
  notifySettingsChanged();
}

export function getCompanySettings(): CompanySettings {
  return {
    ...defaultCompanySettings,
    ...readJson<CompanySettings>(companySettingsKey, defaultCompanySettings),
  };
}

export function saveCompanySettings(settings: CompanySettings) {
  writeJson(companySettingsKey, settings);
  notifySettingsChanged();
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Unable to read file as data URL."));
      }
    };

    reader.onerror = () => {
      reject(reader.error ?? new Error("Unable to read file."));
    };

    reader.readAsDataURL(file);
  });
}

function readJson<T>(key: string, fallback: T): Partial<T> {
  if (typeof window === "undefined") return fallback;

  try {
    const value = window.localStorage.getItem(key);
    const parsed = value ? JSON.parse(value) : fallback;

    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed
      : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(key, JSON.stringify(value));
}

function notifySettingsChanged() {
  if (typeof window === "undefined") return;

  window.dispatchEvent(new Event(settingsChangedEvent));
}
