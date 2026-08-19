/* ============================================================
   MOTEUR FINANCIER — Étude de faisabilité
   Toutes les valeurs par défaut sont des HYPOTHÈSES DE
   SIMULATION académiques, modifiables par le superviseur.
   ============================================================ */

export const DEFAULT_ASSUMPTIONS = {
  insuredY1: 5000,        // nombre d'assurés année 1
  growthRate: 55,         // croissance annuelle du portefeuille (%)
  premiumAvg: 6000,       // prime moyenne annuelle (MRU)
  claimFreq: 22,          // fréquence de sinistre / taux de déclenchement (%)
  indemnityAvg: 12000,    // indemnité moyenne (MRU)
  adminCosts: 6000000,    // frais administratifs annuels (MRU)
  techCosts: 4000000,     // coûts technologiques annuels (MRU)
  dataCosts: 3000000,     // coûts des données climatiques (MRU)
  opsCosts: 2500000,      // coûts opérationnels annuels (MRU)
  distribRate: 5,         // coûts de distribution (% des primes)
  reinsRate: 10,          // coût de réassurance (% des primes)
  costInflation: 5,       // inflation des coûts fixes (%/an)
  initialInvestment: 50000000, // investissement initial (MRU)
  discountRate: 12,       // taux d'actualisation VAN (%)
};

export const SCENARIOS = {
  pessimiste: {
    mult: { insured: 0.5, premium: 0.9, freq: 1.55, indemnity: 1.25, costs: 1.15, growth: 0.6 },
  },
  central: {
    mult: { insured: 1, premium: 1, freq: 1, indemnity: 1, costs: 1, growth: 1 },
  },
  optimiste: {
    mult: { insured: 1.6, premium: 1.05, freq: 0.72, indemnity: 0.9, costs: 0.92, growth: 1.25 },
  },
};

export const YEARS = [1, 2, 3, 4, 5];

/* Projection annuelle complète pour un jeu d'hypothèses */
export function projectYears(a, mult = SCENARIOS.central.mult) {
  const m = { ...SCENARIOS.central.mult, ...mult };
  const rows = [];
  let cumCF = -a.initialInvestment;
  for (let i = 0; i < YEARS.length; i++) {
    const y = YEARS[i];
    const insured = Math.round(a.insuredY1 * m.insured * Math.pow(1 + (a.growthRate * m.growth) / 100, i));
    const premiumAvg = a.premiumAvg * m.premium;
    const freq = Math.min(100, a.claimFreq * m.freq) / 100;
    const indemnityAvg = a.indemnityAvg * m.indemnity;
    const premiums = insured * premiumAvg;
    const claims = Math.round(insured * freq);
    const indemnities = claims * indemnityAvg;
    const reinsurance = premiums * (a.reinsRate / 100);
    const distribution = premiums * (a.distribRate / 100);
    const fixed =
      (a.adminCosts + a.techCosts + a.dataCosts + a.opsCosts) *
      m.costs *
      Math.pow(1 + a.costInflation / 100, i);
    const resultTech = premiums - indemnities - reinsurance; // résultat technique
    const resultOp = resultTech - distribution - fixed;      // résultat opérationnel
    const resultNet = resultOp;
    cumCF += resultNet;
    rows.push({
      year: y, insured, premiums, claims, indemnities, reinsurance, distribution,
      fixedCosts: fixed, resultTech, resultOp, resultNet, cashflow: resultNet, cumCF,
      lossRatio: premiums > 0 ? (indemnities / premiums) * 100 : 0,
    });
  }
  return rows;
}

/* Seuil de rentabilité : nombre minimum d'assurés (année 1, coûts fixes année 1) */
export function breakEven(a, mult = SCENARIOS.central.mult) {
  const m = { ...SCENARIOS.central.mult, ...mult };
  const premium = a.premiumAvg * m.premium;
  const freq = Math.min(100, a.claimFreq * m.freq) / 100;
  const indemnity = a.indemnityAvg * m.indemnity;
  const fixed = (a.adminCosts + a.techCosts + a.dataCosts + a.opsCosts) * m.costs;
  // marge par assuré = prime - coût sinistre attendu - réassurance - distribution
  const marginPerInsured =
    premium - freq * indemnity - premium * (a.reinsRate / 100) - premium * (a.distribRate / 100);
  if (marginPerInsured <= 0) {
    return { marginPerInsured, insuredMin: Infinity, premiumMin: Infinity, viable: false };
  }
  const insuredMin = Math.ceil(fixed / marginPerInsured);
  return {
    marginPerInsured,
    insuredMin,
    premiumMin: insuredMin * premium,
    viable: true,
  };
}

/* ROI sur 5 ans */
export function roi(rows, initialInvestment) {
  const netGain = rows.reduce((s, r) => s + r.resultNet, 0);
  return initialInvestment > 0 ? (netGain / initialInvestment) * 100 : 0;
}

/* VAN / NPV */
export function npv(a, rows) {
  const r = a.discountRate / 100;
  let v = -a.initialInvestment;
  rows.forEach((row, i) => { v += row.cashflow / Math.pow(1 + r, i + 1); });
  return v;
}

/* TRI / IRR — recherche par bissection */
export function irr(a, rows) {
  const flows = [-a.initialInvestment, ...rows.map((r) => r.cashflow)];
  const f = (rate) => flows.reduce((s, cf, i) => s + cf / Math.pow(1 + rate, i), 0);
  let lo = -0.99, hi = 10;
  if (f(lo) * f(hi) > 0) return null; // pas de TRI dans la plage
  for (let k = 0; k < 100; k++) {
    const mid = (lo + hi) / 2;
    if (f(lo) * f(mid) <= 0) hi = mid; else lo = mid;
  }
  return ((lo + hi) / 2) * 100;
}

/* Courbe de seuil de rentabilité : résultat net annuel en fonction du nombre d'assurés */
export function breakEvenCurve(a, mult, maxInsured) {
  const m = { ...SCENARIOS.central.mult, ...mult };
  const premium = a.premiumAvg * m.premium;
  const freq = Math.min(100, a.claimFreq * m.freq) / 100;
  const indemnity = a.indemnityAvg * m.indemnity;
  const fixed = (a.adminCosts + a.techCosts + a.dataCosts + a.opsCosts) * m.costs;
  const step = Math.max(50, Math.round(maxInsured / 40));
  const pts = [];
  for (let n = 0; n <= maxInsured; n += step) {
    const rev = n * premium;
    pts.push({
      insured: n,
      revenue: rev,
      totalCost: n * (freq * indemnity) + rev * ((a.reinsRate + a.distribRate) / 100) + fixed,
    });
  }
  return pts;
}

/* Heatmap de sensibilité : fréquence (x) × indemnité (y) → résultat net cumulé 5 ans */
export function sensitivityHeatmap(a, freqRange, indemnityRange) {
  const grid = [];
  for (const fm of freqRange) {
    for (const im of indemnityRange) {
      const rows = projectYears(a, { ...SCENARIOS.central.mult, freq: fm, indemnity: im });
      grid.push({ freq: fm, indemnity: im, net: rows.reduce((s, r) => s + r.resultNet, 0) - a.initialInvestment });
    }
  }
  return grid;
}

export function fmtMRU(n, lang) {
  const v = new Intl.NumberFormat(lang === "ar" ? "ar-MR" : "fr-FR", { maximumFractionDigits: 0 }).format(n);
  return `${v} MRU`;
}

export function fmtCompact(n, lang) {
  const abs = Math.abs(n);
  const nf = new Intl.NumberFormat(lang === "ar" ? "ar-MR" : "fr-FR", { maximumFractionDigits: 1 });
  if (abs >= 1e9) return `${nf.format(n / 1e9)} Mrd`;
  if (abs >= 1e6) return `${nf.format(n / 1e6)} M`;
  if (abs >= 1e3) return `${nf.format(n / 1e3)} k`;
  return nf.format(n);
}
