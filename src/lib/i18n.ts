import type { Language } from "@/src/data/ner-regions"

export const UI_STRINGS = {
  title: {
    en: "Megh-Drishti: AI Spatio-Temporal Weather Anomaly Engine",
    hi: "मेघ-दृष्टि: एआई स्थानिक-कालिक मौसमी विसंगति इंजन",
  },
  subtitle: {
    en: "Medium-Range Climatological Tracking Console | MoES PS 26078",
    hi: "माध्यम-दूरी जलवायु ट्रैकिंग कंसोल | MoES PS 26078",
  },
  report: { en: "Report", hi: "रिपोर्ट" },
  newIncident: { en: "Log Weather Anomaly", hi: "मौसमी विसंगति दर्ज करें" },
  onlineSync: { en: "Online Sync", hi: "ऑनलाइन सिंक" },
  offlineSync: { en: "Offline Queue", hi: "ऑफलाइन कतार" },
  simulateOffline: { en: "Field dropout", hi: "फील्ड कटऑफ" },
  regionalOverview: { en: "Regional Overview", hi: "क्षेत्रीय सारांश" },
  criticalZones: { en: "Critical / Severe Zones", hi: "गंभीर क्षेत्र" },
  blockedHighways: { en: "Storm Corridors", hi: "तूफानी गलियारे" },
  pendingReports: { en: "Queued Field Reports", hi: "कतारबद्ध रिपोर्ट" },
  liveIncidents: { en: "Live incidents", hi: "लाइव घटनाएँ" },
  imdAlert: { en: "IMD / Hazard Advisory", hi: "आईएमडी / खतरा सलाह" },
  legend: { en: "Legend", hi: "संकेत सूची" },
  liveFeed: { en: "Live Field & Citizen Reports", hi: "लाइव फील्ड व नागरिक रिपोर्ट" },
  live: { en: "Live", hi: "लाइव" },
  queued: { en: "Queued", hi: "कतार में" },
  searchPlaceholder: {
    en: "Search station, city, coords...",
    hi: "स्टेशन, शहर या निर्देशांक खोजें...",
  },
  useMyLocation: { en: "Use My Location", hi: "मेरा स्थान" },
  scanRisk: { en: "Scan Risk", hi: "जोखिम स्कैन" },
  rainfallOverlay: { en: "Rainfall Radar Overlay", hi: "वर्षा रडार परत" },
  slopeOverlay: { en: "3D Terrain & Slope Relief", hi: "3D भू-भाग एवं ढलान राहत" },
  gpsFallback: {
    en: "GPS unavailable. Locked to command grid.",
    hi: "जीपीएस उपलब्ध नहीं। कमांड ग्रिड पर लॉक।",
  },
  gpsOk: {
    en: "GPS lock acquired. Flying to your coordinates.",
    hi: "जीपीएस लॉक मिला। आपके निर्देशांक पर जा रहे हैं।",
  },
  storedIndexedDb: {
    en: "Stored in Local IndexedDB Queue",
    hi: "स्थानीय IndexedDB कतार में संग्रहीत",
  },
  incidentDrawerTitle: {
    en: "Field Weather Anomaly Drawer",
    hi: "फील्ड मौसमी विसंगति ड्रॉअर",
  },
  incidentDrawerDesc: {
    en: "Log a geotagged weather hazard. Offline reports queue locally until telemetry returns.",
    hi: "जियोटैग मौसमी खतरा दर्ज करें। ऑफलाइन रिपोर्ट टेलीमेट्री लौटने तक स्थानीय कतार में रहेंगी।",
  },
  incidentType: { en: "Incident type", hi: "घटना प्रकार" },
  photoEvidence: { en: "Photo evidence", hi: "फोटो प्रमाण" },
  dropPhoto: { en: "Drag & drop or tap to capture", hi: "खींचें या कैप्चर करें" },
  analyzing: { en: "AI analyzing meteorological storm signature…", hi: "एआई मौसम विक्षोभ विश्लेषित कर रहा है…" },
  geolocation: { en: "Coordinate tags", hi: "निर्देशांक टैग" },
  fetchGps: { en: "Fetch Current GPS", hi: "वर्तमान जीपीएस" },
  roadName: { en: "Sector / Corridor name", hi: "सेक्टर / गलियारा" },
  broadcast: { en: "Broadcast Alert & Sync", hi: "अलर्ट प्रसारित करें" },
  queueInstead: { en: "Queue Offline & Close", hi: "ऑफलाइन कतार में डालें" },
  riskModel: { en: "Telemetry & Live Sync", hi: "टेलीमेट्री और लाइव सिंक" },
  simulateSpike: { en: "Simulate Sensor Spike", hi: "सेंसर स्पाइक सिमुलेट करें" },
  recommendedAction: { en: "Recommended action", hi: "अनुशंसित कार्रवाई" },
  recalculate: { en: "Recalculate Anomaly Index", hi: "विसंगति सूचकांक पुनर्गणना" },
  recalculating: { en: "Recalculating…", hi: "गणना हो रही है…" },
  connectEndpoint: { en: "Connect custom inference endpoint", hi: "कस्टम इंफरेंस एंडपॉइंट" },
  explainability: { en: "Model explainability", hi: "मॉडल व्याख्या" },
  syncNow: { en: "Sync offline queue", hi: "ऑफलाइन कतार सिंक करें" },
  syncing: { en: "Syncing…", hi: "सिंक हो रहा है…" },
  loadingMap: { en: "Loading GIS map…", hi: "जीआईएस मानचित्र लोड हो रहा है…" },
  calculatedIndex: { en: "Spatio-Temporal Anomaly Index (%)", hi: "स्थानिक-कालिक विसंगति सूचकांक (%)" },
  slope: { en: "Thermal Anomaly Δ", hi: "तापीय विसंगति Δ" },
  rainfall: { en: "Precipitation Surge Rate", hi: "वर्षा तीव्रता दर" },
  soil: { en: "Z500 Synoptic Pressure Anomaly (gpm)", hi: "Z500 सिनॉप्टिक दबाव विसंगति (gpm)" },
  shearLabel: { en: "Vertical Wind Shear", hi: "ऊर्ध्वाधर पवन अपरूपण" },
  mock: { en: "regional engine", hi: "क्षेत्रीय इंजन" },
  liveModel: { en: "live model", hi: "लाइव मॉडल" },
  selectZone: { en: "Select anomaly hub", hi: "विसंगति केंद्र चुनें" },
  citizenApp: { en: "Field Unit — Citizen App", hi: "फील्ड इकाई — नागरिक ऐप" },
  english: { en: "English", hi: "English" },
  hindi: { en: "हिन्दी", hi: "हिन्दी" },
  yourLocation: { en: "Your Location", hi: "आपका स्थान" },
  incidentPinned: {
    en: "Weather anomaly pinned to GIS and live feed.",
    hi: "मौसमी विसंगति मानचित्र और लाइव फीड पर पिन हुई।",
  },
  queueSynced: {
    en: "Offline queue flushed to command net.",
    hi: "ऑफलाइन कतार कमांड नेट पर भेजी गई।",
  },
  spikeNotice: {
    en: "Precipitation surge +30 mm/hr injected. Status escalated to Severe Anomaly.",
    hi: "वर्षा तीव्रता +30 मिमी/घंटा स्पाइक। स्थिति गंभीर विसंगति पर।",
  },
  weightSlope: { en: "Thermal Δ weight 35%", hi: "तापीय Δ भार 35%" },
  weightRain: { en: "Precipitation weight 35%", hi: "वर्षा भार 35%" },
  weightSoil: { en: "Z500 synoptic weight 15%", hi: "Z500 सिनॉप्टिक भार 15%" },
  lat: { en: "Latitude", hi: "अक्षांश" },
  lon: { en: "Longitude", hi: "देशांतर" },
  clearSelection: { en: "Reset to default grid", hi: "डिफ़ॉल्ट ग्रिड" },
  orangeAlert: { en: "Orange Alert", hi: "नारंगी चेतावनी" },
  hazardBuffer: { en: "Weather Anomaly Influence Radius", hi: "मौसम विसंगति प्रभाव दायरा" },
  baselineZone: { en: "Baseline zone", hi: "आधार क्षेत्र" },
  fieldPin: { en: "Field incident", hi: "फील्ड घटना" },
  showStations: { en: "Monitoring Stations", hi: "निगरानी केंद्र" },
  showIncidents: { en: "Field Incidents", hi: "घटना रिपोर्ट" },
  showBuffer: { en: "Weather Anomaly Influence Radius", hi: "मौसम विसंगति प्रभाव दायरा" },
  mapLegend: { en: "Legend", hi: "संकेत सूची" },
} as const

export type UiKey = keyof typeof UI_STRINGS

export function t(lang: Language, key: UiKey): string {
  const dict = UI_STRINGS[key]
  if (!dict) return String(key)
  return dict[lang] || dict["en"] || String(key)
}

export const LANGUAGE_OPTIONS: { code: Language; key: UiKey }[] = [
  { code: "en", key: "english" },
  { code: "hi", key: "hindi" },
]
