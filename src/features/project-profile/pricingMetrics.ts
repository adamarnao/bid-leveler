import {
  PricingMetric,
  ProjectProfile,
  SectorPricingMetricGroup,
} from "./types";

export const universalPricingMetrics: PricingMetric[] = [
  { id: "square_footage", label: "Square Footage", valueType: "area", unit: "sf" },
  { id: "duration", label: "Duration", valueType: "duration", unit: "months" },
  { id: "floor_count", label: "Floors", valueType: "number", unit: "count" },
  { id: "location_market", label: "Location / Market", valueType: "text", unit: "none" },
  { id: "project_value", label: "Project Value", valueType: "currency", unit: "usd" },
];

export const sectorPricingMetricGroups: SectorPricingMetricGroup[] = [
  {
    id: "office_retail_restaurant_metrics",
    sectorIds: ["office", "retail", "restaurant"],
    metrics: [
      { id: "rentable_square_footage", label: "Rentable SF", valueType: "area", unit: "sf" },
      { id: "sales_floor_square_footage", label: "Sales Floor SF", valueType: "area", unit: "sf" },
      { id: "kitchen_square_footage", label: "Kitchen SF", valueType: "area", unit: "sf" },
      { id: "seat_count", label: "Seat Count", valueType: "number", unit: "count" },
    ],
  },
  {
    id: "healthcare_metrics",
    sectorIds: ["healthcare"],
    metrics: [
      { id: "exam_room_count", label: "Exam Rooms", valueType: "number", unit: "count" },
      { id: "treatment_room_count", label: "Treatment Rooms", valueType: "number", unit: "count" },
      { id: "imaging_room_count", label: "Imaging Rooms", valueType: "number", unit: "count" },
      { id: "procedure_room_count", label: "Procedure Rooms", valueType: "number", unit: "count" },
      { id: "med_gas_outlet_count", label: "Med Gas Outlet Count", valueType: "number", unit: "count" },
    ],
  },
  {
    id: "hospitality_metrics",
    sectorIds: ["hospitality"],
    metrics: [
      { id: "key_room_count", label: "Keys / Rooms", valueType: "number", unit: "count" },
      { id: "guestroom_count", label: "Guestrooms", valueType: "number", unit: "count" },
      { id: "public_area_square_footage", label: "Public Area SF", valueType: "area", unit: "sf" },
      { id: "restaurant_bar_square_footage", label: "Restaurant / Bar SF", valueType: "area", unit: "sf" },
    ],
  },
  {
    id: "multifamily_metrics",
    sectorIds: ["multifamily"],
    metrics: [
      { id: "unit_count", label: "Unit Count", valueType: "number", unit: "count" },
      { id: "unit_mix", label: "Unit Mix", valueType: "text", unit: "mixed" },
      { id: "common_area_square_footage", label: "Common Area SF", valueType: "area", unit: "sf" },
      { id: "multifamily_floor_count", label: "Floors", valueType: "number", unit: "count" },
    ],
  },
  {
    id: "warehouse_metrics",
    sectorIds: ["warehouse"],
    metrics: [
      { id: "warehouse_square_footage", label: "Warehouse SF", valueType: "area", unit: "sf" },
      { id: "office_square_footage", label: "Office SF", valueType: "area", unit: "sf" },
      { id: "clear_height", label: "Clear Height", valueType: "number", unit: "feet" },
      { id: "dock_door_count", label: "Dock Doors", valueType: "number", unit: "count" },
      { id: "cold_storage_square_footage", label: "Cold Storage SF", valueType: "area", unit: "sf" },
    ],
  },
  {
    id: "civil_sitework_metrics",
    sectorIds: ["civil_sitework"],
    metrics: [
      { id: "acres", label: "Acres", valueType: "area", unit: "acres" },
      { id: "paving_area", label: "Paving SF / SY", valueType: "area", unit: "mixed" },
      { id: "utility_length", label: "Utility LF", valueType: "length", unit: "lf" },
      { id: "earthwork_volume", label: "Earthwork CY", valueType: "volume", unit: "cy" },
    ],
  },
];

export function getPricingMetricsForProfile(profile: ProjectProfile): PricingMetric[] {
  const metrics = new Map<string, PricingMetric>();

  universalPricingMetrics.forEach((metric) => metrics.set(metric.id, metric));

  sectorPricingMetricGroups
    .filter((group) => group.sectorIds.includes(profile.classification.sector))
    .filter(
      (group) =>
        !group.facilityTypeIds ||
        (profile.classification.facilityType !== undefined &&
          group.facilityTypeIds.includes(profile.classification.facilityType)),
    )
    .flatMap((group) => group.metrics)
    .forEach((metric) => metrics.set(metric.id, metric));

  return [...metrics.values()];
}
