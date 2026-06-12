import { csiCrosswalkEntries } from "@/data/csiCrosswalk";
import { CsiCrosswalkEntry, CsiCrosswalkSection } from "@/types/CsiCrosswalk";

const entriesBy1995Section = buildLookup("source");
const entriesByCurrentSection = buildLookup("target");

export function getCurrentSectionsFor1995(
  section1995: string
): CsiCrosswalkSection[] {
  return uniqueSections(
    getCrosswalkEntriesFor1995(section1995)
      .map((entry) => entry.targetSection)
      .filter(hasSectionNumber)
  );
}

export function get1995SectionsForCurrent(
  sectionCurrent: string
): CsiCrosswalkSection[] {
  return uniqueSections(
    getCrosswalkEntriesForCurrent(sectionCurrent)
      .map((entry) => entry.sourceSection)
      .filter(hasSectionNumber)
  );
}

export function getCrosswalkEntriesFor1995(
  section1995: string
): CsiCrosswalkEntry[] {
  return entriesBy1995Section.get(normalizeSectionNumber(section1995)) ?? [];
}

export function getCrosswalkEntriesForCurrent(
  sectionCurrent: string
): CsiCrosswalkEntry[] {
  return entriesByCurrentSection.get(normalizeSectionNumber(sectionCurrent)) ?? [];
}

export function expandSectionsToCurrent(section1995s: string[]): string[] {
  return uniqueStrings(
    section1995s.flatMap((section1995) =>
      getCurrentSectionsFor1995(section1995).flatMap((section) =>
        section.sectionNumber ? [section.sectionNumber] : []
      )
    )
  );
}

export function expandSectionsTo1995(sectionCurrents: string[]): string[] {
  return uniqueStrings(
    sectionCurrents.flatMap((sectionCurrent) =>
      get1995SectionsForCurrent(sectionCurrent).flatMap((section) =>
        section.sectionNumber ? [section.sectionNumber] : []
      )
    )
  );
}

function buildLookup(source: "source" | "target") {
  const lookup = new Map<string, CsiCrosswalkEntry[]>();

  csiCrosswalkEntries.forEach((entry) => {
    const sectionNumber =
      source === "source"
        ? entry.sourceSection.sectionNumber
        : entry.targetSection.sectionNumber;

    if (!sectionNumber) return;

    const normalizedSectionNumber = normalizeSectionNumber(sectionNumber);
    const entries = lookup.get(normalizedSectionNumber) ?? [];

    lookup.set(normalizedSectionNumber, [...entries, entry]);
  });

  return lookup;
}

function normalizeSectionNumber(sectionNumber: string) {
  return sectionNumber.replace(/\u00a0/g, " ").trim();
}

function hasSectionNumber(
  section: CsiCrosswalkSection
): section is CsiCrosswalkSection & { sectionNumber: string } {
  return Boolean(section.sectionNumber);
}

function uniqueSections<T extends CsiCrosswalkSection & { sectionNumber: string }>(
  sections: T[]
): T[] {
  const seenSectionNumbers = new Set<string>();

  return sections.filter((section) => {
    const normalizedSectionNumber = normalizeSectionNumber(section.sectionNumber);

    if (seenSectionNumbers.has(normalizedSectionNumber)) return false;

    seenSectionNumbers.add(normalizedSectionNumber);
    return true;
  });
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.map(normalizeSectionNumber)));
}
