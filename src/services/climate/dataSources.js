export const CLIMATE_SOURCES = {
  openMeteoForecast: { name: 'Open-Meteo Forecast API', url: 'https://api.open-meteo.com/v1/forecast', type: 'api', priority: 1 },
  openMeteoHistorical: { name: 'Open-Meteo Historical Weather API / ERA5-Land', url: 'https://archive-api.open-meteo.com/v1/archive', type: 'reanalysis', dataset: 'ERA5-Land', priority: 1 },
  openMeteoClimate: { name: 'Open-Meteo Climate API', url: 'https://climate-api.open-meteo.com/v1/climate', type: 'projection', priority: 2, model: 'EC_Earth3P_HR' },
  openMeteoGeocoding: { name: 'Open-Meteo Geocoding API', url: 'https://geocoding-api.open-meteo.com/v1/search', type: 'geocoding', priority: 1 },
};

export const WILAYAS = [
  { name: 'Adrar', capital: 'Atar', sector: 'elevage' },
  { name: 'Assaba', capital: 'Kiffa', sector: 'elevage' },
  { name: 'Brakna', capital: 'Aleg', sector: 'mixte' },
  { name: 'Dakhlet Nouadhibou', capital: 'Nouadhibou', sector: 'elevage' },
  { name: 'Gorgol', capital: 'Kaédi', sector: 'mixte' },
  { name: 'Guidimakha', capital: 'Sélibaby', sector: 'mixte' },
  { name: 'Hodh Ech Chargui', capital: 'Néma', sector: 'elevage' },
  { name: 'Hodh El Gharbi', capital: 'Ayoun El Atrous', sector: 'elevage' },
  { name: 'Inchiri', capital: 'Akjoujt', sector: 'elevage' },
  { name: 'Nouakchott Nord', capital: 'Dar-Naim', sector: 'mixte' },
  { name: 'Nouakchott Ouest', capital: 'Tevragh-Zeina', sector: 'mixte' },
  { name: 'Nouakchott Sud', capital: 'Arafat', sector: 'mixte' },
  { name: 'Tagant', capital: 'Tidjikja', sector: 'elevage' },
  { name: 'Tiris Zemmour', capital: 'Zouérate', sector: 'elevage' },
  { name: 'Trarza', capital: 'Rosso', sector: 'agri' },
];

export const ZONE_AR = {
  Adrar: 'آدرار', Assaba: 'العصابة', Brakna: 'البراكنة', 'Dakhlet Nouadhibou': 'داخلت نواذيبو',
  Gorgol: 'كوركل', Guidimakha: 'كيديماغا', 'Hodh Ech Chargui': 'الحوض الشرقي', 'Hodh El Gharbi': 'الحوض الغربي',
  Inchiri: 'إينشيري', 'Nouakchott Nord': 'نواكشوط الشمالية', 'Nouakchott Ouest': 'نواكشوط الغربية',
  'Nouakchott Sud': 'نواكشوط الجنوبية', Tagant: 'تكانت', 'Tiris Zemmour': 'تيرس زمور', Trarza: 'الترارزة',
};
