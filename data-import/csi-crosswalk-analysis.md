# CSI Crosswalk CSV Analysis

Input file: `data-import/csi-crosswalk.csv`

## Parsing Notes

The CSV was parsed with these columns:

- `1995 SECTION`
- `1995 TITLE`
- `1995 LEVEL`
- `2004 SECTION`
- `2004 TITLE`
- `2004 LEVEL`

Current section numbers contain nonbreaking spaces in the source file, so section numbers were normalized to regular spaces for analysis and examples.

## Summary Counts

| Metric | Count |
| --- | ---: |
| Total rows | 3,041 |
| Unique 1995 sections | 1,011 |
| Unique current sections | 2,558 |
| Rows with missing values | 9 |

## Mapping Shape

Row-level exclusive classification:

| Mapping class | Rows |
| --- | ---: |
| One-to-one | 478 |
| One-to-many | 2,163 |
| Many-to-one | 133 |
| Many-to-many overlap | 263 |
| Incomplete | 4 |

Unique section-level mapping counts:

| Mapping type | Count |
| --- | ---: |
| 1995 sections mapping to multiple current sections | 451 |
| Current sections receiving multiple 1995 sections | 141 |

Notes:

- "One-to-many" means a 1995 section maps to more than one current section.
- "Many-to-one" means a current section receives more than one 1995 section.
- Some rows participate in both patterns, so they are classified as many-to-many overlap at the row level.

## Missing Values

Nine rows have at least one missing field. The missing values are mostly missing current section or current level data.

| 1995 section | 1995 title | Current section | Current title | Missing issue |
| --- | --- | --- | --- | --- |
| 02285 | Rebuilt Miscellaneous Structures | 33 05 16 | Utility Structures | Missing current level |
| 13200 | Ground Storage Tanks | | See 13200 Storage Tanks | Missing current section and current level |
| 13200 | Tank Cleaning Procedures | | | Missing current section, title, and level |
| 13200 | Tank Lining | 09 97 00 | Special Coatings | Missing current level |
| 15105 | Pipes and Tubes | | See 15100 BUILDING SERVICES PIPING | Missing current section and current level |
| 15200 | PROCESS PIPING | 40 20 00 | Liquids Process Piping | Missing current level |
| 15440 | Base-Mounted Pumps | | See 15410 Plumbing Pumps | Missing current section and current level |
| 16130 | Cutout Boxes | 26 05 33 | Raceway and Boxes for Electrical Systems | Missing current level |
| 16340 | Medium-Voltage Vacuum Interrupter Switchgear | 26 13 19 | Medium-Voltage Vacuum Interrupter Switchgear | Missing current level |

## Duplicate And Conflict Checks

### Exact Duplicate Mappings

Exact duplicates were checked using this full key:

- 1995 section
- 1995 title
- Current section
- Current title

Result: no exact duplicate mapping groups were found.

| Check | Count |
| --- | ---: |
| Exact duplicate groups | 0 |
| Rows participating in exact duplicates | 0 |

### Conflicting Mappings

The CSV contains repeated section numbers with different titles and repeated 1995/current section pairs with inconsistent level values. Some of these are probably intentional crosswalk granularity, but they should be treated as review cases before generating strongly typed lookup data.

| Conflict check | Count |
| --- | ---: |
| Same 1995 section number with multiple titles | 418 section groups |
| Same current section number with multiple titles | 3 section groups |
| Same 1995/current section pair with inconsistent level values | 117 pair groups |

#### Same 1995 Section Number With Materially Different Titles

These appear to represent legacy section-number buckets that contain multiple topics.

| 1995 section | Distinct titles | Rows | Example titles |
| --- | ---: | ---: | --- |
| 08810 | 17 | 17 | Bent Glass; Bullet-Resistant Glass; Chemically-Strengthened Glass; Coated Glass; Composite Glass; Decorative Glass; Fire Rated Glass; Float Glass |
| 02370 | 16 | 17 | Cement Concrete Paving for Stream Beds; Erosion and Sedimentation Control; Erosion Control Blankets and Mats; Gabions; Geogrids; Geotextile Sedimentation and Erosion |
| 02980 | 16 | 16 | Cement Concrete Bonded Overlays; Cement Concrete Pavement Recycling; Concrete Pavement Jacking and Slabjacking; Full Depth Patching |
| 12350 | 15 | 15 | Bank Casework; Dental Casework; Display Casework; Dormitory Casework; Educational Facility Casework; Hospital Casework; Kitchen Casework |
| 00800 | 14 | 14 | Anti-Pollution Measures; Assigned Contracts; Equal Employment Opportunity Requirements; Insurance Requirements; Letter of Assent; SUPPLEMENTARY CONDITIONS |
| 14550 | 12 | 19 | Belt Conveyors; Bucket Conveyors; Container Conveyors; Conveyors; Monorail Conveyors; Pneumatic Conveyors |

#### Same Current Section Number With Different Titles

These should be reviewed because current section numbers are usually expected to have stable labels.

| Current section | Distinct titles | Rows | Titles |
| --- | ---: | ---: | --- |
| 41 00 00 | 2 | 2 | Material Processing and Handling Equipment (Division); Material Processing and Handling Equipment |
| 04 05 19.16 | 2 | 4 | Masonry Anchors; Masonry Embedded Flashing |
| 04 05 19.13 | 2 | 3 | Continuous Joint Reinforcing; Masonry Control and Expansion Joints |

#### Same 1995/Current Pair With Inconsistent LEVEL Values

These pairs repeat the same 1995 section and current section but disagree on either 1995 level, current level, or both.

| Pair | Rows | LEVEL values | Examples |
| --- | ---: | --- | --- |
| 00450 -> 00 45 00 | 2 | 1995: 4, 3; current: 3, 2 | Qualification Statement for Waste Disposal -> Representations and Certifications; Representations and Certifications -> Representations and Certifications |
| 00800 -> 00 73 00 | 3 | 1995: 4, 2; current: 2 | Letter of Assent -> Supplementary Conditions; Specific Project Requirements -> Supplementary Conditions; SUPPLEMENTARY CONDITIONS -> Supplementary Conditions |
| 00890 -> 00 31 43 | 2 | 1995: 4, 3; current: 3 | Notices -> Permit Application; Permits -> Permit Application |
| 01120 -> 01 12 00 | 2 | 1995: 4, 3; current: 2 | Construction By Owner -> Multiple Contract Summary; Multiple Contract Summary -> Multiple Contract Summary |
| 01420 -> 01 42 00 | 2 | 1995: 3, 4; current: 2 | References -> References; Symbols -> References |
| 01630 -> 01 25 00 | 2 | 1995: 3, 4; current: 2 | Product Substitution Procedures -> Substitution Procedures; Substitution Procedures During Construction -> Substitution Procedures |

## Unmapped And Incomplete Rows

### 1995 Rows With No Current Section

Four rows have a 1995 section but no current section.

| 1995 section | 1995 title | Current title / note |
| --- | --- | --- |
| 13200 | Ground Storage Tanks | See 13200 Storage Tanks |
| 13200 | Tank Cleaning Procedures | |
| 15105 | Pipes and Tubes | See 15100 BUILDING SERVICES PIPING |
| 15440 | Base-Mounted Pumps | See 15410 Plumbing Pumps |

### Current Rows With No 1995 Section

No rows were found with a current section but no 1995 section.

### "See ..." Rows With Missing Target Section

Three rows have a `See ...` note but no current section value.

| 1995 section | 1995 title | Current title / note |
| --- | --- | --- |
| 13200 | Ground Storage Tanks | See 13200 Storage Tanks |
| 15105 | Pipes and Tubes | See 15100 BUILDING SERVICES PIPING |
| 15440 | Base-Mounted Pumps | See 15410 Plumbing Pumps |

## LEVEL Distribution

### 1995 LEVEL

| LEVEL | Rows |
| --- | ---: |
| 1 | 22 |
| 2 | 272 |
| 3 | 847 |
| 4 | 1,900 |

### Current LEVEL

| LEVEL | Rows |
| --- | ---: |
| Missing | 9 |
| 1 | 30 |
| 2 | 1,057 |
| 3 | 1,553 |
| 4 | 392 |

### Most Common LEVEL Pairs

| 1995 LEVEL -> Current LEVEL | Rows |
| --- | ---: |
| 4 -> 3 | 1,267 |
| 3 -> 2 | 540 |
| 4 -> 4 | 342 |
| 4 -> 2 | 285 |
| 3 -> 3 | 256 |
| 2 -> 2 | 231 |
| 3 -> 4 | 48 |
| 2 -> 3 | 30 |
| 1 -> 1 | 21 |
| 2 -> 1 | 8 |

## Divisions With Largest Mapping Expansion

Expansion is calculated as:

`unique current sections mapped from division - unique 1995 sections in division`

| 1995 division | Unique 1995 sections | Unique current sections | Expansion | Ratio |
| --- | ---: | ---: | ---: | ---: |
| 02 | 119 | 453 | 334 | 3.81 |
| 15 | 71 | 220 | 149 | 3.10 |
| 01 | 54 | 181 | 127 | 3.35 |
| 07 | 59 | 175 | 116 | 2.97 |
| 13 | 63 | 168 | 105 | 2.67 |
| 08 | 69 | 161 | 92 | 2.33 |
| 10 | 63 | 152 | 89 | 2.41 |
| 11 | 76 | 163 | 87 | 2.14 |
| 00 | 42 | 119 | 77 | 2.83 |
| 12 | 48 | 123 | 75 | 2.56 |

Division 02 has the largest absolute expansion by a wide margin.

## Example Mappings

### Clean One-to-One Examples

| 1995 section | 1995 title | Current section | Current title |
| --- | --- | --- | --- |
| 00001 | PROJECT TITLE PAGE | 00 01 01 | Project Title Page |
| 00005 | CERTIFICATIONS PAGE | 00 01 05 | Certifications Page |
| 00007 | SEALS PAGE | 00 01 07 | Seals Page |
| 00010 | TABLE OF CONTENTS | 00 01 10 | Table of Contents |
| 00015 | LIST OF DRAWINGS | 00 01 15 | List of Drawing Sheets |

### One-to-Many Examples

| 1995 section | 1995 title | Example current mappings |
| --- | --- | --- |
| 14550 | Belt Conveyors | 41 12 13.19 Belt Bulk Material Conveyors; 41 21 23.13 Belt Piece Material Conveyors; 41 12 16 Bucket Elevators; 41 12 13.23 Container Bulk Material Conveyors |
| 13200 | Elevated Storage Tanks | 21 41 16 Elevated Storage Tanks for Fire-Suppression Water; 22 12 16 Facility Elevated, Potable-Water Storage Tanks; 33 16 19 Elevated Water Utility Storage Tanks |
| 15210 | Air Compressors | 22 15 19 General Service Packaged Air Compressors and Receivers; 22 61 19 Compressed-Air Equipment for Laboratory and Healthcare Facilities; 40 12 00 Compressed Air Process Piping |
| 08810 | Bent Glass | 08 81 00 Glass Glazing; 08 88 56 Ballistics-Resistant Glazing; 08 81 13 Decorative Glass Glazing |
| 02370 | Cement Concrete Paving for Stream Beds | 31 25 00 Erosion and Sedimentation Controls; 31 25 13 Erosion Controls; 31 36 00 Gabions; 31 32 19.13 Geogrid Soil Stabilization |

### Many-to-One Examples

| Current section | Current title | Example 1995 sources |
| --- | --- | --- |
| 04 40 00 | Stone Assemblies | 04400 STONE; 04410 Bluestone; 04410 Granite; 04410 Limestone; 04410 Marble |
| 08 71 00 | Door Hardware | 08710 Controlling Hardware; 08710 Door Hardware; 08710 Door Trim; 08710 Hanging Hardware; 08710 Latching Hardware |
| 32 11 00 | Base Courses | 02710 Aggregate-Bituminous Base Course; 02710 Aggregate-Cement Base Course; 02710 Asphalt-Treated Permeable Base Course; 02720 Sub Ballast |
| 41 22 23 | Hoists | 14610 Air-Powered Fixed Hoists; 14610 Electric Fixed Hoists; 14610 Fixed Hoists; 14620 Air-Powered Trolley Hoists |
| 23 56 00 | Solar Energy Heating Equipment | 13600 SOLAR AND WIND ENERGY EQUIPMENT; 13630 Solar Absorber Plates or Tubing; 13630 Solar Coatings and Surface Treatment |

## Recommended TypeScript Data Model

```ts
export type CsiCrosswalkEntry = {
  id: string;
  sourceVersion: "MASTERFORMAT_1995";
  targetVersion: "MASTERFORMAT_CURRENT";
  sourceSection: {
    sectionNumber: string;
    title: string;
    level: number | null;
  };
  targetSection: {
    sectionNumber: string | null;
    title: string | null;
    level: number | null;
  };
  relationship:
    | "ONE_TO_ONE"
    | "ONE_TO_MANY"
    | "MANY_TO_ONE"
    | "MANY_TO_MANY"
    | "INCOMPLETE";
  notes?: string;
};
```

Recommended lookup types:

```ts
export type CsiCrosswalkBy1995Section = Record<string, CsiCrosswalkEntry[]>;

export type CsiCrosswalkByCurrentSection = Record<string, CsiCrosswalkEntry[]>;
```

For section numbers, store normalized section strings:

- 1995 example: `"14550"`
- Current example: `"41 12 13.19"`

For entries with missing current sections, use `null` for `targetSection.sectionNumber` rather than an empty string.

## Storage Recommendation

Use both a flat array and lookup maps.

Recommended structure:

```ts
export const csiCrosswalkEntries: CsiCrosswalkEntry[] = [];

export const csiCrosswalkBy1995Section: CsiCrosswalkBy1995Section = {};

export const csiCrosswalkByCurrentSection: CsiCrosswalkByCurrentSection = {};
```

Why both:

- Flat array is best for validation, display, import checks, and debugging.
- Lookup by 1995 section is needed when converting old project data forward.
- Lookup by current section is needed when explaining migrated/current sections or tracing back to old specs.
- One-to-many and many-to-one patterns mean single-value maps would lose information, so both lookup maps should return arrays.

For generated code later, the safest approach is:

1. Generate the flat `CsiCrosswalkEntry[]`.
2. Derive lookup maps in code from the flat array, or generate maps from the same source script.
3. Add import validation that reports missing target sections and many-to-many overlaps.
