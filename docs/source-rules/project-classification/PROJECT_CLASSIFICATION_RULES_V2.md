# Project Classification Rules v2

## Purpose

Bid-Leveler needs a professional, sector-sensitive classification system that keeps the app clean for simple projects while preserving deep trade coverage for complex GC work.

The system must walk the line between:

- **overly inclusive**: showing every obscure trade for every project
- **overly exclusive**: hiding important scopes because the project classification is not perfectly known

The solution is additive and layered:

```text
Base common trades
+ Sector trade rules
+ Work Type trade rules
+ Context tag triggers
+ Selected CSI tag evidence
- Classification demotions/exclusions
= Visible / Suggested / Contextual trade package candidates
```

## Core Principle

Do not treat Sector, Work Type, and Context Tags as independent flat lists.

They are dependent:

```text
Sector selected first
→ Work Type labels/options adapt to sector
→ Context Tags are filtered by sector and work type
→ Trade visibility is assembled from all three
```

## Three Classification Layers

### 1. Sector

Sector answers:

> What market/building type is this?

Examples:
Office, Retail, Restaurant, Healthcare, Education, Industrial, Warehouse, Laboratory, Cleanroom, Multifamily, Residential, Civil/Sitework, Government, Detention, Transportation, Airport, Marine, Sports, Mission Critical, Renewable Energy, Agricultural.

### 2. Work Type

Work Type answers:

> What kind of construction effort is being bid?

Keep this list short and canonical. Similar industry terms should be aliases, not separate canonical work types.

Canonical work types:

| Canonical Work Type | Meaning |
|---|---|
| Interior Fit-Out / Renovation | Interior work inside an existing building or shell. Includes tenant improvement, fit-out, build-out, interior renovation, remodel, and similar work. |
| Ground-Up / New Construction | New building from site/foundation through completion. |
| Core & Shell | Base building structure, enclosure, and primary systems without complete tenant build-out. |
| Addition / Expansion | Adds new space to an existing building. |
| Sitework / Civil Only | Site/civil scope without substantial building interior scope. |
| Demolition / Abatement Only | Demolition or abatement package without rebuild scope. |
| Restoration / Adaptive Reuse | Existing building restoration, preservation, reuse, conversion, or major rehabilitation. |
| Maintenance / Repair | Repair, service, replacement, or smaller corrective scope. |
| Specialty Systems Installation | Narrow project focused primarily on a system, equipment package, or specialty scope. |

### 3. Context Tags

Context Tags answer:

> What special conditions or project characteristics modify trade visibility, packaging, ITB language, or estimating assumptions?

Examples:
Occupied Site, Phased Work, Night Work, Public Bid, Prevailing Wage, Secure Facility, High-Rise, Medical Office, Hospital, Surgery Center, Imaging, Infection Control / ICRA, Commercial Kitchen, Cold Storage, Food Processing, Data Center, Lab, Cleanroom, Structural Retrofit, Change of Use, Tilt-Up, Precast, PEMB, Airport Secure Area, Marine / Waterfront.

## Work Type Consolidation

The following are not separate canonical work types:

```text
Tenant Improvement
Build-Out
Fit-Out
Interior Renovation
Interior Remodel
Remodel
Tenant Buildout
Office Buildout
```

They are aliases/display labels for:

```text
Interior Fit-Out / Renovation
```

### Why

For trade visibility, these usually produce the same core trade family:
interior demo, drywall/framing, ceilings, flooring, finishes, doors/hardware, glazing, specialties, MEP modifications, and low voltage.

## Occupied Renovation Cleanup

"Occupied Renovation" is not a separate work type.

It should be modeled as:

```text
Work Type: Interior Fit-Out / Renovation
Context Tag: Occupied Site / Active Operations
```

Occupied status affects:
- temporary protection
- phasing
- night/off-hours work
- dust/noise control
- access/security coordination
- infection control if healthcare
- owner/tenant coordination

It does not define the construction work type by itself.

## Sector-Specific Work Type Labels

The same canonical work type can display differently by sector.

| Sector | Canonical Work Type | Display Label |
|---|---|---|
| Office | Interior Fit-Out / Renovation | Tenant Improvement / Interior Fit-Out |
| Retail | Interior Fit-Out / Renovation | Store Build-Out / Renovation |
| Restaurant | Interior Fit-Out / Renovation | Restaurant Build-Out / Renovation |
| Healthcare | Interior Fit-Out / Renovation | Medical Office TI / Renovation |
| Multifamily | Interior Fit-Out / Renovation | Unit Renovation / Remodel |
| Residential | Interior Fit-Out / Renovation | Renovation / Remodel |
| Hospitality | Interior Fit-Out / Renovation | Guestroom / Public Area Renovation |
| Warehouse | Interior Fit-Out / Renovation | Warehouse Tenant Build-Out |
| Laboratory | Interior Fit-Out / Renovation | Lab Renovation / Fit-Out |
| Cleanroom | Interior Fit-Out / Renovation | Cleanroom Fit-Out / Renovation |

## Sector-Dependent Context Tags

Context tags should not all show for every sector.

### Office / Commercial

Relevant context tags:
- Occupied Site / Active Operations
- Phased Work
- Night Work
- Public Bid
- Prevailing Wage
- Secure Facility
- High-Rise
- White Box
- Furniture / FF&E
- Access Control / Security
- Roof Work
- Exterior Envelope Scope
- Sitework Scope

Do not show healthcare-only context tags by default.

### Healthcare / Lab / Cleanroom

Relevant context tags:
- Medical Office
- Hospital
- Surgery Center
- Imaging
- Infection Control / ICRA
- Medical Gas Required
- Nurse Call Required
- Radiation Shielding
- Lead-Lined Construction
- Lab
- Cleanroom
- Occupied Site / Active Operations
- Phased Work
- Night Work

Healthcare context should reveal healthcare specialties, but not every food service or industrial item automatically.

### Restaurant / Hospitality

Relevant context tags:
- Commercial Kitchen
- Food Service
- Kitchen Hood
- Walk-In Cooler / Freezer
- Grease Interceptor
- Refrigeration
- Occupied Site / Active Operations
- Phased Work
- Night Work
- Furniture / FF&E
- Signage

Restaurant context should reveal food service and kitchen infrastructure. Hospitality should not automatically show commercial kitchen unless the food-service context is selected.

### Residential / Multifamily

Relevant context tags:
- Occupied Site / Active Operations
- Phased Work
- Night Work
- Unit Renovation
- Kitchen / Bath Renovation
- Wood Framing / Stick Framing
- Masonry / Block Construction
- Roofing
- Siding / Exterior Envelope
- Appliances
- Countertops
- Window Treatments

Residential remodels should not assume metal stud framing or ACT ceilings. Wood/stick framing, cabinetry, countertops, tile, resilient/wood flooring, plumbing/electrical modifications, roofing, siding, windows/doors, and appliances are more typical triggers.

## Residential vs Commercial Interior Logic

Residential / Multifamily renovation should not blindly inherit Office TI trade visibility.

### Residential / Multifamily Renovation Core

- Existing Conditions / Selective Demolition
- Rough Carpentry / Wood Framing
- Finish Carpentry / Trim / Millwork
- Cabinets / Casework
- Countertops
- Doors / Hardware
- Windows if exterior/window scope exists
- Drywall / Gypsum Board
- Painting / Wall Finishes
- Flooring
- Tile
- Plumbing
- HVAC
- Electrical
- Appliances
- Roofing / Siding only if exterior context exists

### Residential / Multifamily Renovation Suggested

- Insulation
- Waterproofing / shower waterproofing
- Bath accessories
- Closet shelving
- Window treatments
- Low voltage / security / access
- Sitework/landscaping only if exterior/site context exists

### Residential / Multifamily Renovation Normally Hidden

- Non-structural metal stud framing as a default assumption
- ACT ceilings as a default assumption
- Structural steel
- Curtain wall / storefront
- Heavy civil/sitework
- Medical gas
- Food service
- Cleanroom/lab/process systems

## Visibility Levels

| Level | Meaning |
|---|---|
| CORE | Expected and normally visible for this classification. |
| SUGGESTED | Often relevant but should be reviewed/confirmed. |
| CONTEXTUAL | Hidden unless a sector/work type/context/CSI tag triggers it. |
| HIDDEN | Available in the library but not shown by default. |
| EXCLUDED | Normally not relevant, but can still be manually enabled by the estimator. |

## Active vs Visible

Critical distinction:

```text
Active in master taxonomy
```

does not mean:

```text
Visible for selected project classification
```

Example:
Full Building Demolition can be active in the master taxonomy but hidden for Office Tenant Improvement unless the work type is Demolition / Abatement Only or a full-building demolition context is selected.

## Canonical Visibility Profiles

### Office + Interior Fit-Out / Renovation

Display label: Office + Tenant Improvement / Interior Fit-Out

Core:
- Existing Conditions / Selective Demolition
- Drywall / Framing
- Ceilings
- Flooring
- Wall Finishes
- Doors / Frames / Hardware
- Glass / Glazing
- Basic Specialties
- Fire Protection
- Plumbing
- HVAC
- Electrical
- Low Voltage / Technology

Suggested:
- Finish Carpentry / Millwork
- Countertops
- Window Treatments
- Furnishings / FF&E
- Access Control / Security
- Acoustic Panels

Hidden/contextual:
- Sitework / Civil
- Concrete
- Masonry
- Structural Steel
- Roofing
- Overhead Doors
- Full Building Demolition
- Hazardous Abatement
- Elevators
- Food Service
- Medical Gas
- Cleanroom
- Process Systems

### Office + Ground-Up / New Construction

Core:
- Sitework / Civil
- Concrete
- Masonry as applicable
- Structural Steel or applicable structure
- Misc Metals
- Roofing
- Waterproofing
- Insulation
- Doors / Frames / Hardware
- Glass / Glazing
- Drywall / Framing
- Ceilings
- Flooring
- Wall Finishes
- Specialties
- Fire Protection
- Plumbing
- HVAC
- Electrical
- Low Voltage / Technology

### Residential / Multifamily + Renovation / Remodel

Core:
- Existing Conditions / Selective Demolition
- Rough Carpentry / Wood Framing
- Drywall / Gypsum Board
- Finish Carpentry / Trim / Millwork
- Cabinets / Casework
- Countertops
- Doors / Hardware
- Flooring
- Tile
- Painting / Wall Finishes
- Plumbing
- HVAC
- Electrical
- Appliances

Suggested:
- Insulation
- Waterproofing
- Bath Accessories
- Closet Shelving
- Window Treatments
- Low Voltage / Security
- Windows
- Roofing / Siding only if exterior context exists

Hidden/contextual:
- Metal stud framing
- ACT ceilings
- Structural steel
- Storefront / curtain wall
- Heavy site/civil
- Medical gas
- Food service
- Cleanroom/lab/process systems

### Healthcare + Medical Office + Interior Fit-Out / Renovation

Start with Office TI core, then add/suggest:
- Medical Gas
- Nurse Call
- ICRA / Infection Control
- Medical Equipment
- Imaging Equipment Support if Imaging context selected
- Radiation Shielding / Lead-Lined Construction if Imaging context selected
- Pneumatic Tubes if Hospital context selected

### Restaurant + Interior Fit-Out / Renovation + Commercial Kitchen

Start with interior fit-out core, then add/suggest:
- Food Service Equipment
- Commercial Kitchen Equipment
- Kitchen Hood
- Kitchen Exhaust
- Grease Duct
- Kitchen Hood Fire Suppression
- Grease Interceptor
- Walk-In Cooler / Freezer
- Refrigeration

### Civil / Sitework + Sitework Only

Core:
- Clearing / Grubbing
- Earthwork
- Excavation
- Grading
- Erosion Control
- Site Utilities
- Storm Drainage
- Sanitary Sewer
- Water Service
- Asphalt Paving
- Concrete Paving
- Curbs / Sidewalks
- Landscaping / Irrigation if in scope
- Fencing / Gates if in scope

Hidden:
- Drywall
- Ceilings
- Flooring
- Interior doors/hardware
- Interior MEP unless site utility/electrical service scope exists

## Implementation Rule

Codex should not invent this matrix.

Codex should import/adapt these source files exactly, then report any taxonomy IDs that do not exist in the live app.
