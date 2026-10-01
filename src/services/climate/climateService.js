import { CLIMATE_SOURCES, WILAYAS } from './dataSources';

const cache = new Map();
const keyFor = (type, zone) => `${type}:${zone}`;
const today = () => new Date().toISOString().slice(0, 10);
const yearStart = y => `${y}-01-01`;
const yearEnd = y => `${y}-12-31`;

function provenance(value, unit, source, dataset, date, geographicalArea, temporalResolution, dataType, qualityStatus = 'verified') {
  return { value, unit, source: source.name, sourceUrl: source.url, dataset: dataset || source.dataset || null, date, retrievedAt: new Date().toISOString(), geographicalArea, temporalResolution, dataType, qualityStatus };
}

export async function resolveWilaya(name) {
  const meta = WILAYAS.find(x => x.name === name) || WILAYAS[0];
  const k = keyFor('geo', meta.name);
  if (cache.has(k)) return cache.get(k);
  const q = encodeURIComponent(meta.capital);
  const url = `${CLIMATE_SOURCES.openMeteoGeocoding.url}?name=${q}&count=5&language=fr&format=json`;
  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error('geocoding');
    const json = await r.json();
    const result = (json.results || []).find(x => /Mauritania/i.test(x.country || '')) || json.results?.[0];
    if (!result) throw new Error('geocoding-empty');
    const out = { ...meta, lat: result.latitude, lon: result.longitude, resolvedBy: CLIMATE_SOURCES.openMeteoGeocoding.name };
    cache.set(k, out); return out;
  } catch (_) {
    return { ...meta, lat: null, lon: null, resolvedBy: null, unavailable: true };
  }
}

function aggregateAnnual(times = [], temps = [], precs = [], zone) {
  const map = new Map();
  times.forEach((date, i) => {
    const year = String(date).slice(0, 4);
    if (!map.has(year)) map.set(year, { year, temps: [], rain: 0, n: 0 });
    const row = map.get(year);
    const t = Number(temps[i]); const p = Number(precs[i]);
    if (Number.isFinite(t)) row.temps.push(t);
    if (Number.isFinite(p)) row.rain += p;
    row.n += 1;
  });
  return [...map.values()].map(x => ({
    year: x.year,
    temperature: x.temps.length ? x.temps.reduce((a,b)=>a+b,0)/x.temps.length : null,
    precipitation: x.rain,
    provenance: provenance(x.rain, 'mm', CLIMATE_SOURCES.openMeteoHistorical, 'ERA5-Land', `${x.year}-12-31`, zone, 'annual', 'reanalysis'),
  }));
}

function aggregateMonthly(times = [], temps = [], precs = [], zone) {
  const map = new Map();
  times.forEach((date, i) => {
    const month = String(date).slice(0, 7);
    if (!map.has(month)) map.set(month, { month, temps: [], rain: 0 });
    const row = map.get(month); const t = Number(temps[i]); const p = Number(precs[i]);
    if (Number.isFinite(t)) row.temps.push(t); if (Number.isFinite(p)) row.rain += p;
  });
  return [...map.values()].map(x => ({
    m: x.month,
    precip: x.rain,
    temperature: x.temps.length ? x.temps.reduce((a,b)=>a+b,0)/x.temps.length : null,
    provenance: provenance(x.rain, 'mm', CLIMATE_SOURCES.openMeteoHistorical, 'ERA5-Land', `${x.month}-01`, zone, 'monthly', 'reanalysis'),
  }));
}

export async function fetchClimateBundle(zoneName) {
  const zone = await resolveWilaya(zoneName);
  if (!Number.isFinite(zone.lat) || !Number.isFinite(zone.lon)) throw new Error('GEO_DATA_UNAVAILABLE');
  const now = today(); const currentYear = Number(now.slice(0, 4));
  const histStart = yearStart(currentYear - 5); const histEnd = yearEnd(currentYear - 1);
  const futureStart = yearStart(currentYear + 1); const futureEnd = yearEnd(currentYear + 5);
  const urls = {
    current: `${CLIMATE_SOURCES.openMeteoForecast.url}?latitude=${zone.lat}&longitude=${zone.lon}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m&daily=precipitation_sum,temperature_2m_max,temperature_2m_min&past_days=7&forecast_days=16&timezone=auto`,
    historical: `${CLIMATE_SOURCES.openMeteoHistorical.url}?latitude=${zone.lat}&longitude=${zone.lon}&start_date=${histStart}&end_date=${histEnd}&daily=temperature_2m_mean,precipitation_sum&timezone=auto`,
    projection: `${CLIMATE_SOURCES.openMeteoClimate.url}?latitude=${zone.lat}&longitude=${zone.lon}&start_date=${futureStart}&end_date=${futureEnd}&models=${CLIMATE_SOURCES.openMeteoClimate.model}&daily=temperature_2m_mean,precipitation_sum&timezone=auto`,
  };
  const responses = await Promise.all(Object.values(urls).map(u => fetch(u)));
  if (responses.some(r => !r.ok)) throw new Error('CLIMATE_API_UNAVAILABLE');
  const [current, historical, projection] = await Promise.all(responses.map(r => r.json()));
  const hist = aggregateAnnual(historical.daily?.time, historical.daily?.temperature_2m_mean, historical.daily?.precipitation_sum, zone.name);
  const monthly = aggregateMonthly(historical.daily?.time, historical.daily?.temperature_2m_mean, historical.daily?.precipitation_sum, zone.name).slice(-12);
  const proj = aggregateAnnual(projection.daily?.time, projection.daily?.temperature_2m_mean, projection.daily?.precipitation_sum, zone.name).map(x => ({ ...x, provenance: { ...x.provenance, source: CLIMATE_SOURCES.openMeteoClimate.name, sourceUrl: CLIMATE_SOURCES.openMeteoClimate.url, dataset: CLIMATE_SOURCES.openMeteoClimate.model, dataType: 'projection', qualityStatus: 'model' } }));
  const records = [];
  const push = (value, unit, source, dataset, date, variable, temporalResolution, dataType) => records.push({ ...provenance(value, unit, source, dataset, date, zone.name, temporalResolution, dataType), variable, wilaya: zone.name, latitude: zone.lat, longitude: zone.lon });
  if (Number.isFinite(Number(current.current?.temperature_2m))) push(Number(current.current.temperature_2m), current.current_units?.temperature_2m || '°C', CLIMATE_SOURCES.openMeteoForecast, null, now, 'temperature_2m', 'instantaneous', 'observed/operational');
  if (Number.isFinite(Number(current.current?.precipitation))) push(Number(current.current.precipitation), current.current_units?.precipitation || 'mm', CLIMATE_SOURCES.openMeteoForecast, null, now, 'precipitation', 'instantaneous', 'observed/operational');
  hist.forEach(x => push(x.precipitation, 'mm', CLIMATE_SOURCES.openMeteoHistorical, 'ERA5-Land', `${x.year}-12-31`, 'precipitation_sum', 'annual', 'reanalysis'));
  proj.forEach(x => push(x.precipitation, 'mm', CLIMATE_SOURCES.openMeteoClimate, CLIMATE_SOURCES.openMeteoClimate.model, `${x.year}-12-31`, 'precipitation_sum', 'annual', 'projection'));
  const bundle = { zone, current, historical: hist, monthly, projections: proj, records, retrievedAt: new Date().toISOString(), qualityStatus: 'verified' };
  cache.set(keyFor('bundle', zoneName), bundle); return bundle;
}

export function getClimateQuality(bundle, coverageCount = 0) {
  return {
    current: bundle?.current ? 'available' : 'unavailable',
    historical: bundle?.historical?.length ? 'ERA5-Land' : 'unavailable',
    projection: bundle?.projections?.length ? 'climate-model' : 'unavailable',
    ndvi: 'unavailable',
    lastUpdated: bundle?.retrievedAt || null,
    coverage: `${coverageCount}/15 wilayas`,
  };
}
