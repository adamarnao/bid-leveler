import type { NormalizedCsiCode } from "./types";

export function normalizeCsiCode(input: string): NormalizedCsiCode {
  const compact = input.trim().replace(/[^0-9A-Za-z]/g, "").toUpperCase();

  return {
    displayCode: formatDisplayCsiCode(compact, input),
    normalizedCode: compact,
  };
}

export function makeNormalizedCsiCodeKey(version: string, code: string): string {
  return `${version}:${normalizeCsiCode(code).normalizedCode}`;
}

function formatDisplayCsiCode(compact: string, original: string): string {
  if (!compact) return original.trim();

  if (/^\d{6}$/.test(compact)) {
    return `${compact.slice(0, 2)} ${compact.slice(2, 4)} ${compact.slice(4)}`;
  }

  if (/^\d{5}$/.test(compact) && compact.startsWith("0")) {
    return compact;
  }

  return original.trim().replace(/-/g, " ").replace(/\s+/g, " ");
}

export function normalizeTitle(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
