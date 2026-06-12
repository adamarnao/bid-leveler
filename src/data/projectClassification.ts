import { MarketSector } from "@/types/Project";

export const projectClassification: Record<
  MarketSector,
  Record<string, string[]>
> = {
  Commercial: {
    Office: ["Corporate Office", "Professional Office", "Call Center", "Office TI"],
    Retail: ["Shopping Center", "Big Box", "Convenience Store", "Grocery", "Automotive Retail", "Retail TI"],
    Restaurant: ["Fast Food", "Fast Casual", "Full Service", "Bar / Tavern", "Restaurant TI"],
    "Tenant Improvement": ["Office TI", "Retail TI", "Medical TI", "Restaurant TI", "General TI"],
    "Mixed Use": ["Retail / Residential", "Office / Retail", "Hospitality / Retail"],
  },

  Residential: {
    "Single Family": ["Custom Home", "Production Home", "Spec Home", "Luxury Home"],
    Multifamily: ["Apartments", "Condominiums", "Townhomes", "Student Housing", "Senior Housing"],
    Renovation: ["Addition", "Interior Remodel", "Whole House Renovation"],
  },

  Medical: {
    "Medical Office": ["Ground-Up", "Tenant Improvement", "Renovation"],
    "Urgent Care": ["Ground-Up", "Tenant Improvement", "Renovation"],
    Hospital: ["Expansion", "Renovation", "Interior Build-Out"],
    "Surgery Center": ["Ground-Up", "Tenant Improvement", "Renovation"],
    Dental: ["Dental Office", "Orthodontic Office", "Dental TI"],
    Veterinary: ["Clinic", "Hospital", "Kennel / Boarding"],
    Laboratory: ["Clinical Lab", "Research Lab", "Testing Lab"],
  },

  Industrial: {
    Warehouse: ["Distribution", "E-Commerce", "Cold Storage", "Flex Warehouse"],
    Manufacturing: ["Light Manufacturing", "Heavy Manufacturing", "Food Processing"],
    "Data Center": ["Enterprise", "Colocation", "Hyperscale"],
  },

  Government: {
    Municipal: ["City Hall", "Public Works", "Community Facility"],
    County: ["Administrative", "Courthouse", "Public Works"],
    State: ["Administrative", "Institutional", "Public Facility"],
    Federal: ["Administrative", "Secure Facility", "Public Facility"],
    "Public Safety": ["Police", "Fire Station", "EMS"],
  },

  Education: {
    Daycare: ["New Facility", "Renovation", "Tenant Improvement"],
    "K-12 School": ["Classroom", "Gymnasium", "Cafeteria", "Campus Expansion"],
    College: ["Classroom", "Laboratory", "Student Housing", "Athletic Facility"],
    University: ["Academic", "Research", "Housing", "Athletic Facility"],
  },

  Hospitality: {
    Hotel: ["Limited Service", "Full Service", "Extended Stay"],
    Resort: ["Guest Rooms", "Amenity Building", "Restaurant / Bar"],
    "Conference Center": ["New Facility", "Renovation", "Expansion"],
  },

  Civil: {
    "Site Development": ["Clearing", "Earthwork", "Paving", "Utilities"],
    Utilities: ["Water", "Sewer", "Storm", "Electrical Utility"],
    Roadway: ["New Road", "Widening", "Repair"],
    Bridge: ["New Bridge", "Repair", "Replacement"],
  },

  Energy: {
    Solar: ["Ground-Mounted", "Roof-Mounted", "Carport"],
    "Battery Storage": ["Utility Scale", "Commercial", "Microgrid"],
    Substation: ["New Substation", "Expansion", "Upgrade"],
    "Power Generation": ["Generator Plant", "Backup Power", "Utility Plant"],
  },

  Other: {
    Other: ["Other"],
  },
};