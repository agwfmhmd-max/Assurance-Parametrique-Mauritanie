/**
 * Official Mauritania socio-economic indicators used by the study.
 *
 * Primary source:
 * ANSADE, RGPH-5 (2023), Theme 8 — Caractéristiques des ménages agricoles.
 * https://ansade.mr/wp-content/uploads/2025/09/Theme-8-Caracteristiques-des-menages-agricoleserevu-DV.pdf
 *
 * Important: the source measures MENAGES, not individual farmers/herders.
 * The application therefore must never label these values as a headcount of
 * individual persons. Values are kept with their exact source definition.
 */
export const OFFICIAL_MAURITANIA_STATS = {
  agriculture: {
    year: 2023,
    source: "ANSADE — RGPH-5 2023, Thème 8",
    sourceUrl: "https://ansade.mr/wp-content/uploads/2025/09/Theme-8-Caracteristiques-des-menages-agricoleserevu-DV.pdf",
    landOwningHouseholdsShare: 23.2,
    agriculturalHouseholdsRuralShare: 84.3,
    agriculturalHouseholdsUrbanShare: 15.6,
    agriculturalHouseholdsNomadicShare: 6.8,
  },
  livestock: {
    year: 2023,
    source: "ANSADE — RGPH-5 2023, Thème 8",
    sourceUrl: "https://ansade.mr/wp-content/uploads/2025/09/Theme-8-Caracteristiques-des-menages-agricoleserevu-DV.pdf",
    definition: "Ménages pratiquant l'élevage",
    // Do not invent a national headcount: the published source must be
    // parsed/loaded before exposing a numeric headcount.
    exactNationalHouseholdCount: null,
  },
};
