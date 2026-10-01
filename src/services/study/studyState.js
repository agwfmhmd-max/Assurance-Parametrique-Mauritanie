import { breakEven, irr, npv, projectYears, roi, SCENARIOS } from '../../finance/engine.js';

export const DEFAULT_STUDY_METADATA = {
  title: "Étude de faisabilité de la mise en place d’un système d’assurance paramétrique contre les risques climatiques en Mauritanie : cas des secteurs agricole et de l’élevage",
  institution: 'ISCAE — Mauritanie',
  academicYear: '2025-2026',
  version: '1.0',
};

function cleanNumber(v, fallback = 0) { return Number.isFinite(Number(v)) ? Number(v) : fallback; }

export function buildStudyState({ assumptions, simulator, climate, weights, metadata = {} }) {
  const a = Object.fromEntries(Object.entries(assumptions || {}).map(([k,v]) => [k, typeof v === 'number' ? cleanNumber(v) : v]));
  const sim = simulator || { capital: 100000, climateIndex: 72, coverage: 100, probability: 30, severity: 45, feeRate: 15, reinsRate: 10, margin: 10, zone: 'Trarza', sector: 'agri' };
  const w = weights || { precip: 40, ndvi: 30, soilMoisture: 30 };
  const rows = projectYears(a);
  const scenarios = {};
  Object.keys(SCENARIOS).forEach(k => {
    const r = projectYears(a, SCENARIOS[k].mult);
    scenarios[k] = { rows: r, net5: r.reduce((s,x)=>s+x.resultNet,0), premiums5: r.reduce((s,x)=>s+x.premiums,0), roi: roi(r,a.initialInvestment), npv: npv(a,r), irr: irr(a,r), breakEven: breakEven(a, SCENARIOS[k].mult) };
  });
  const trigger = cleanNumber(sim.climateIndex);
  const triggerRate = Math.max(0, Math.min(100, (100 - trigger) / 100));
  const indemnity = cleanNumber(sim.capital) * triggerRate * cleanNumber(sim.coverage,100) / 100;
  const purePremium = cleanNumber(sim.capital) * cleanNumber(sim.probability) / 100 * cleanNumber(sim.severity) / 100;
  const commercialPremium = purePremium * (1 + cleanNumber(sim.feeRate)/100 + cleanNumber(sim.reinsRate)/100 + cleanNumber(sim.margin)/100);
  const dataQuality = {
    current: climate?.current ? 'available' : 'unavailable',
    historical: climate?.historical?.length ? 'ERA5-Land' : 'unavailable',
    projection: climate?.projections?.length ? 'climate-model' : 'unavailable',
    ndvi: 'unavailable',
    losses: 'unavailable',
    survey: 'unavailable',
    coverage: climate ? '1/15 wilayas loaded in current session' : '0/15 wilayas loaded',
  };
  const state = {
    metadata: { ...DEFAULT_STUDY_METADATA, ...metadata },
    climate: climate?.records || [], historical: climate?.historical || [], projections: climate?.projections || [], zones: climate?.zone ? [climate.zone] : [],
    agriculturalRisk: { index: trigger, triggerRate, basisRisk: 'unavailable' }, pastoralRisk: { index: trigger, triggerRate, basisRisk: 'unavailable' },
    indices: { weights: w, ndvi: null, precipitation: climate?.current?.current?.precipitation ?? null, soilMoisture: null },
    triggers: { trigger: trigger, exit: 0, index: trigger }, indemnities: { capital: cleanNumber(sim.capital), rate: triggerRate * cleanNumber(sim.coverage,100), amount: indemnity },
    premiums: { pure: purePremium, commercial: commercialPremium }, financialAssumptions: a, scenarios, sensitivity: null, surveyResults: null,
    feasibility: { technical: dataQuality.current !== 'unavailable', economic: true, financial: scenarios.central.npv >= 0, institutional: 'to_assess', operational: true },
    conclusions: { conditional: scenarios.central.npv >= 0 ? 'Les paramètres actuels produisent une VAN centrale non négative, sous réserve de la qualité et de la disponibilité des données.' : 'Les paramètres actuels produisent une VAN centrale négative ; une recalibration des hypothèses est nécessaire.' },
    sources: climate?.records || [], dataQuality, generatedAt: new Date().toISOString(),
    simulator: sim, financial: { rows, central: scenarios.central },
  };
  return state;
}

export function stableStringify(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  return `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(',')}}`;
}

export function hashStudyState(state) {
  const s = stableStringify(state);
  let h1 = 0x811c9dc5;
  for (let i=0;i<s.length;i++) { h1 ^= s.charCodeAt(i); h1 = Math.imul(h1, 0x01000193); }
  return `APC-${new Date().getUTCFullYear()}-${(h1 >>> 0).toString(16).toUpperCase().padStart(8,'0')}`;
}
