import {
  getDefaultTradeTaxonomy,
  getVisibleTradeTaxonomyForProject,
  type ProjectContextTag,
  type ProjectSectorTag,
  type ProjectWorkTypeTag,
  type TradeTaxonomyNode,
} from "@/features/trade-taxonomy";

import {
  ProjectProfile,
  ProjectProfileTradeVisibilityGroups,
  ProjectProfileTradeVisibilityLevel,
  ProjectProfileTradeVisibilityResult,
} from "./types";

type TradeRule = {
  tradeId: string;
  explanation: string;
};

type TradeVisibilityProfileRules = {
  core: TradeRule[];
  suggested: TradeRule[];
  contextual?: TradeRule[];
  excluded?: TradeRule[];
};

const officeInteriorTradeRules: TradeVisibilityProfileRules = {
  core: [
    rule("demolition", "System default for interior renovation: selective existing conditions and demolition review."),
    rule("drywall-framing", "Sector/work type rule: office interior fit-out normally needs drywall and framing."),
    rule("ceilings", "Sector/work type rule: office interior fit-out normally includes ceiling scope."),
    rule("flooring", "Sector/work type rule: office interior fit-out normally includes floor finishes."),
    rule("painting-coatings", "Sector/work type rule: office interior fit-out normally includes paint or wall finish scope."),
    rule("doors-frames-hardware", "Sector/work type rule: office interior fit-out normally includes doors, frames, and hardware."),
    rule("glass-glazing", "Sector/work type rule: office interiors often include interior glass or glazing."),
    rule("specialties", "System default: basic specialties are normally reviewed for interior projects."),
    rule("fire-protection", "System default: fire protection modifications are normally reviewed for interior work."),
    rule("plumbing", "System default: plumbing modifications may be part of the interior scope."),
    rule("hvac", "System default: HVAC modifications are normally reviewed for interior work."),
    rule("electrical", "System default: electrical modifications are normally reviewed for interior work."),
    rule("low-voltage-technology", "System default: low voltage and technology scope is normally reviewed for interior work."),
  ],
  suggested: [
    rule("finish-carpentry-millwork", "Sector/work type rule: office interiors often include millwork or casework."),
    rule("countertops", "Sector/work type rule: countertops may be included with millwork or split for review."),
    rule("window-treatments", "Sector/work type rule: window treatments are common but should be confirmed."),
    rule("furnishings-ffe", "Sector/work type rule: FF&E may be owner/vendor scope or ITB scope."),
    rule("security-access-control", "Sector/work type rule: access control or security may be relevant to office work."),
  ],
  contextual: [
    rule("temporary-protection", "Context/logistics trigger: occupied, phased, or night work can require temporary protection."),
  ],
  excluded: [
    rule("sitework", "Hidden unless triggered: not normally part of office interior fit-out."),
    rule("concrete", "Hidden unless triggered: not normally part of office interior fit-out."),
    rule("masonry", "Hidden unless triggered: not normally part of office interior fit-out."),
    rule("structural-steel", "Hidden unless triggered: not normally part of office interior fit-out."),
    rule("roofing", "Hidden unless triggered: not normally part of office interior fit-out."),
    rule("overhead-doors", "Hidden unless triggered: not normally part of office interior fit-out."),
    rule("full-building-demolition", "Hidden unless triggered: full building demolition is not normal office TI scope."),
    rule("food-service-systems", "Hidden unless triggered: food service is not normal office TI scope."),
    rule("medical-gas", "Hidden unless triggered: medical gas requires healthcare/lab context."),
    rule("laboratory-cleanroom-systems", "Hidden unless triggered: cleanroom/lab work requires relevant context."),
    rule("process-systems", "Hidden unless triggered: process systems require industrial/lab context."),
  ],
};

const residentialRenovationTradeRules: TradeVisibilityProfileRules = {
  core: [
    rule("demolition", "System default for renovation: selective demolition and existing conditions review."),
    rule("rough-carpentry", "Sector/work type rule: residential renovation favors wood/stick framing and rough carpentry."),
    rule("drywall-framing", "Sector/work type rule: residential renovation normally includes gypsum board repairs or replacement."),
    rule("finish-carpentry-millwork", "Sector/work type rule: trim, millwork, cabinets, and casework are common residential scopes."),
    rule("countertops", "Sector/work type rule: countertops are common in residential and multifamily renovation."),
    rule("doors-frames-hardware", "Sector/work type rule: doors and hardware are common residential renovation scopes."),
    rule("flooring", "Sector/work type rule: flooring is a core residential renovation package."),
    rule("tile", "Sector/work type rule: tile is common for kitchen/bath renovation."),
    rule("painting-coatings", "Sector/work type rule: painting and wall finishes are common residential renovation scopes."),
    rule("plumbing", "Sector/work type rule: plumbing modifications are common in kitchen/bath renovation."),
    rule("hvac", "System default: HVAC modifications may be required."),
    rule("electrical", "System default: electrical modifications are normally reviewed."),
    rule("residential-appliances", "Sector/work type rule: appliances are common residential/multifamily scope or owner/vendor coordination."),
  ],
  suggested: [
    rule("insulation", "Sector/work type rule: insulation may be relevant depending envelope or wall work."),
    rule("waterproofing", "Sector/work type rule: shower, bath, or wet-area waterproofing may be relevant."),
    rule("specialties", "System default: bath accessories and similar specialties should be reviewed."),
    rule("window-treatments", "Sector/work type rule: window treatments may be included or owner/vendor scope."),
    rule("low-voltage-technology", "System default: security, data, or low voltage may be relevant."),
    rule("roofing", "Context-sensitive: include when exterior or roof work is in scope."),
  ],
  excluded: [
    rule("non-structural-metal-framing", "Hidden unless triggered: residential renovation should not assume metal stud framing."),
    rule("acoustical-ceilings", "Hidden unless triggered: residential renovation should not assume ACT ceilings."),
    rule("storefront", "Hidden unless triggered: storefront/curtain wall is not normal residential remodel scope."),
    rule("curtain-wall", "Hidden unless triggered: storefront/curtain wall is not normal residential remodel scope."),
    rule("medical-gas", "Hidden unless triggered: medical gas requires healthcare/lab context."),
    rule("laboratory-cleanroom-systems", "Hidden unless triggered: cleanroom/lab work requires relevant context."),
    rule("process-systems", "Hidden unless triggered: process systems require industrial/lab context."),
  ],
};

const healthcareContextTradeRules: TradeVisibilityProfileRules = {
  core: [
    ...officeInteriorTradeRules.core,
    rule("medical-gas", "Healthcare context trigger: medical gas should be reviewed for medical office or clinical work."),
    rule("nurse-call", "Healthcare context trigger: nurse call should be reviewed for patient care environments."),
    rule("icra-infection-control", "Healthcare context trigger: ICRA / infection control should be reviewed before ITB."),
  ],
  suggested: [
    ...officeInteriorTradeRules.suggested,
    rule("medical-equipment", "Healthcare context trigger: medical equipment may be owner/vendor scope or ITB coordination."),
  ],
  contextual: [
    rule("imaging-equipment-support", "Context tag trigger: imaging work can require equipment support."),
    rule("radiation-shielding", "Context tag trigger: imaging work can require radiation shielding."),
    rule("lead-lined-construction", "Context tag trigger: imaging work can require lead-lined construction."),
  ],
  excluded: officeInteriorTradeRules.excluded,
};

const restaurantCommercialKitchenTradeRules: TradeVisibilityProfileRules = {
  core: [
    ...officeInteriorTradeRules.core.filter((item) => item.tradeId !== "low-voltage-technology"),
    rule("food-service-systems", "Restaurant/commercial kitchen rule: food service package should be reviewed."),
    rule("food-service-equipment", "Restaurant/commercial kitchen rule: food service equipment should be reviewed."),
    rule("commercial-kitchen-equipment", "Restaurant/commercial kitchen rule: commercial kitchen equipment should be reviewed."),
    rule("kitchen-hood", "Commercial kitchen context trigger: kitchen hood should be reviewed."),
    rule("kitchen-exhaust", "Commercial kitchen context trigger: kitchen exhaust should be reviewed."),
    rule("kitchen-hood-fire-suppression", "Commercial kitchen context trigger: hood fire suppression should be reviewed."),
    rule("grease-interceptors", "Commercial kitchen context trigger: grease interceptor scope should be reviewed."),
    rule("walk-in-coolers-freezers", "Commercial kitchen context trigger: walk-in cooler/freezer scope should be reviewed."),
    rule("refrigeration", "Commercial kitchen context trigger: refrigeration should be reviewed."),
  ],
  suggested: [
    rule("finish-carpentry-millwork", "Sector/work type rule: restaurants often include millwork or casework."),
    rule("countertops", "Sector/work type rule: countertops and service counters may be included."),
    rule("signage", "Sector/work type rule: signage is often relevant for restaurant work."),
    rule("furnishings-ffe", "Sector/work type rule: furniture and FF&E may be owner/vendor scope or ITB scope."),
    rule("low-voltage-technology", "System default: POS/data/security systems may be relevant."),
  ],
  excluded: [
    rule("sitework", "Hidden unless triggered: not normally part of restaurant interior build-out."),
    rule("concrete", "Hidden unless triggered: not normally part of restaurant interior build-out."),
    rule("masonry", "Hidden unless triggered: not normally part of restaurant interior build-out."),
    rule("structural-steel", "Hidden unless triggered: not normally part of restaurant interior build-out."),
    rule("roofing", "Hidden unless triggered: not normally part of restaurant interior build-out."),
    rule("medical-gas", "Hidden unless triggered: medical gas requires healthcare/lab context."),
    rule("laboratory-cleanroom-systems", "Hidden unless triggered: cleanroom/lab work requires relevant context."),
    rule("process-systems", "Hidden unless triggered: process systems require industrial/lab context."),
  ],
};

const civilSiteworkTradeRules: TradeVisibilityProfileRules = {
  core: [
    rule("sitework", "Sector/work type rule: civil/sitework-only projects center on site/civil packages."),
    rule("earthwork", "Sector/work type rule: earthwork is core for sitework-only projects."),
    rule("utilities", "Sector/work type rule: utilities are core for sitework-only projects."),
    rule("asphalt-paving", "Sector/work type rule: paving should be reviewed for sitework-only projects."),
    rule("concrete-paving", "Sector/work type rule: concrete paving should be reviewed for sitework-only projects."),
    rule("landscaping", "Sector/work type rule: landscaping/irrigation should be reviewed when in scope."),
  ],
  suggested: [
    rule("dewatering", "Sitework rule: dewatering may be needed depending soils and excavation."),
    rule("shoring-sheeting", "Sitework rule: shoring/sheeting may be needed depending excavation."),
    rule("traffic-control", "Sitework rule: traffic control may be needed depending site conditions."),
  ],
  excluded: [
    rule("drywall-framing", "Hidden unless triggered: interior drywall is not normally relevant to sitework-only projects."),
    rule("ceilings", "Hidden unless triggered: ceilings are not normally relevant to sitework-only projects."),
    rule("flooring", "Hidden unless triggered: flooring is not normally relevant to sitework-only projects."),
    rule("doors-frames-hardware", "Hidden unless triggered: interior doors are not normally relevant to sitework-only projects."),
    rule("hvac", "Hidden unless triggered: building HVAC is not normally relevant to sitework-only projects."),
  ],
};

const warehouseGroundUpTradeRules: TradeVisibilityProfileRules = {
  core: [
    rule("sitework", "Ground-up warehouse rule: site/civil scope should be reviewed."),
    rule("concrete", "Ground-up warehouse rule: concrete is normally core."),
    rule("structural-steel", "Ground-up warehouse rule: structural steel or PEMB structure should be reviewed."),
    rule("roofing", "Ground-up warehouse rule: roofing/envelope should be reviewed."),
    rule("overhead-doors", "Warehouse rule: overhead doors and dock equipment are commonly relevant."),
    rule("fire-protection", "System default: fire protection should be reviewed."),
    rule("plumbing", "System default: plumbing should be reviewed."),
    rule("hvac", "System default: HVAC should be reviewed."),
    rule("electrical", "System default: electrical should be reviewed."),
  ],
  suggested: [
    rule("masonry", "Ground-up warehouse rule: masonry may be relevant depending shell design."),
    rule("misc-metals", "Ground-up warehouse rule: miscellaneous metals may be relevant."),
    rule("low-voltage-technology", "System default: security, data, and low-voltage may be relevant."),
  ],
  excluded: [],
};

export function getTradeVisibilityForProjectProfile(
  profile: ProjectProfile,
  taxonomy: TradeTaxonomyNode[] = getDefaultTradeTaxonomy(),
): ProjectProfileTradeVisibilityGroups {
  const context = getTradeVisibilityContext(profile);
  const visibleTrades = getVisibleTradeTaxonomyForProject({ taxonomy, ...context });
  const visibleTradeIds = new Set(visibleTrades.map((trade) => trade.id));
  const tradeById = new Map(taxonomy.map((trade) => [trade.id, trade]));
  const rules = getProfileRules(profile);
  const usedTradeIds = new Set<string>();
  const contextualRules = [
    ...(rules.contextual ?? []),
    ...getContextualRulesFromProfile(profile, visibleTradeIds, rules),
  ];

  const groups: ProjectProfileTradeVisibilityGroups = {
    core: buildResults(rules.core, "CORE", tradeById, usedTradeIds),
    suggested: buildResults(rules.suggested, "SUGGESTED", tradeById, usedTradeIds),
    contextual: buildResults(contextualRules, "CONTEXTUAL", tradeById, usedTradeIds),
    hidden: [],
    excluded: buildResults(rules.excluded ?? [], "EXCLUDED", tradeById, usedTradeIds),
  };

  groups.hidden = taxonomy
    .filter((trade) => trade.isActive)
    .filter((trade) => !usedTradeIds.has(trade.id))
    .filter((trade) => trade.defaultHidden || !visibleTradeIds.has(trade.id))
    .filter((trade) => trade.canBeBidPackage)
    .sort(compareTrades)
    .slice(0, 40)
    .map((trade) => ({
      tradeId: trade.id,
      tradeName: trade.name,
      visibility: "HIDDEN",
      isHiddenByDefault: trade.defaultHidden,
      explanations: [
        trade.defaultHidden
          ? "Hidden by default unless sector, work type, context tag, CSI evidence, or estimator override triggers it."
          : "Not normally relevant for the selected Project Profile.",
      ],
    }));

  return groups;
}

function rule(tradeId: string, explanation: string): TradeRule {
  return { tradeId, explanation };
}

function getTradeVisibilityContext(profile: ProjectProfile): {
  sectorTags: ProjectSectorTag[];
  workTypeTags: ProjectWorkTypeTag[];
  contextTags: ProjectContextTag[];
} {
  return {
    sectorTags: [profile.classification.sector as ProjectSectorTag],
    workTypeTags: [profile.classification.workType as ProjectWorkTypeTag],
    contextTags: [
      ...profile.classification.contextTags,
      ...(profile.logistics.occupiedSite ? ["occupied_site" as const] : []),
      ...(profile.logistics.phasedWork ? ["phased_work" as const] : []),
      ...(profile.logistics.nightWork ? ["night_work" as const] : []),
      ...(profile.logistics.secureFacility ? ["secure_facility" as const] : []),
      ...(profile.logistics.highRise ? ["high_rise" as const] : []),
      ...(profile.globalAttributes.siteScope === "included" ? ["sitework_scope" as const] : []),
      ...(profile.globalAttributes.envelopeScope === "included" ? ["exterior_envelope_scope" as const] : []),
      ...(profile.procurement.publicPrivate === "public" ? ["public_bid" as const] : []),
      ...(profile.procurement.prevailingWage ? ["prevailing_wage" as const] : []),
    ] as ProjectContextTag[],
  };
}

function getProfileRules(profile: ProjectProfile): TradeVisibilityProfileRules {
  if (profile.classification.sector === "healthcare") return healthcareContextTradeRules;
  if (profile.classification.sector === "restaurant") return restaurantCommercialKitchenTradeRules;
  if (profile.classification.workType === "sitework_civil_only") return civilSiteworkTradeRules;
  if (profile.classification.sector === "warehouse" && profile.classification.workType === "ground_up_new_construction") {
    return warehouseGroundUpTradeRules;
  }
  if (profile.classification.sector === "residential" || profile.classification.sector === "multifamily") {
    return residentialRenovationTradeRules;
  }
  return officeInteriorTradeRules;
}

function getContextualRulesFromProfile(
  profile: ProjectProfile,
  visibleTradeIds: ReadonlySet<string>,
  rules: TradeVisibilityProfileRules,
): TradeRule[] {
  const configuredTradeIds = new Set([
    ...rules.core.map((item) => item.tradeId),
    ...rules.suggested.map((item) => item.tradeId),
    ...(rules.contextual ?? []).map((item) => item.tradeId),
    ...(rules.excluded ?? []).map((item) => item.tradeId),
  ]);

  const contextualRules: TradeRule[] = [];

  visibleTradeIds.forEach((tradeId) => {
    if (configuredTradeIds.has(tradeId)) return;
    contextualRules.push(rule(tradeId, "Context tag, global attribute, or taxonomy rule made this trade visible for the selected Project Profile."));
  });

  return contextualRules;
}

function buildResults(
  rules: readonly TradeRule[],
  visibility: ProjectProfileTradeVisibilityLevel,
  tradeById: ReadonlyMap<string, TradeTaxonomyNode>,
  usedTradeIds: Set<string>,
): ProjectProfileTradeVisibilityResult[] {
  const results: ProjectProfileTradeVisibilityResult[] = [];

  rules.forEach((item) => {
    const trade = tradeById.get(item.tradeId);
    if (!trade || !trade.isActive) return;

    usedTradeIds.add(trade.id);
    results.push({
      tradeId: trade.id,
      tradeName: trade.name,
      visibility,
      isTriggeredByContext: visibility === "CONTEXTUAL",
      isHiddenByDefault: trade.defaultHidden,
      explanations: [item.explanation],
    });
  });

  return results.sort((left, right) => left.tradeName.localeCompare(right.tradeName));
}

function compareTrades(left: TradeTaxonomyNode, right: TradeTaxonomyNode): number {
  return left.sortOrder - right.sortOrder || left.name.localeCompare(right.name);
}
