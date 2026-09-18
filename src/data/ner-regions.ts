export type Language = "en" | "hi" | "as"
export type Severity = "Critical" | "Severe" | "Moderate" | "Low"
export type IncidentType = "Road Blockage" | "Crack / Slope Slip" | "Flash Flood" | "Rockfall"
export type SyncStatus = "synced" | "queued" | "syncing"

export interface LocalizedText {
  en: string
  hi: string
  as: string
}

export interface RegionProfile {
  id: string
  name: string
  district: string
  state: string
  city: string
  coords: [number, number]
  slope: number
  rainfall: number
  soil: number
  elevation: number
  severity: Severity
  advice: LocalizedText
  status: LocalizedText
  aliases: string[]
}

export const SEVERITY_LABEL: Record<Severity, LocalizedText> = {
  Critical: { en: "Critical", hi: "आलोचनात्मक", as: "সংকটজনক" },
  Severe: { en: "Severe", hi: "गंभीर", as: "গুৰুতৰ" },
  Moderate: { en: "Moderate", hi: "मध्यम", as: "মধ্যম" },
  Low: { en: "Low / Safe", hi: "निम्न / सुरक्षित", as: "নিম্ন / সুৰক্ষিত" },
}

export const ACTION_LABEL: Record<Severity, LocalizedText> = {
  Critical: {
    en: "SDRF RED ALERT: Mandatory evacuation within 15km buffer. Deploy NDRF/SDRF units & close vulnerable corridors.",
    hi: "एसडीआरएफ रेड अलर्ट: 15 किमी बफर के भीतर अनिवार्य निकासी। एनडीआरएफ/एसडीआरएफ तैनात करें और गलियारे बंद करें।",
    as: "SDRF ৰেড এলাৰ্ট: ১৫ কিমি বাফাৰৰ ভিতৰত বাধ্যতামূলক উচ্ছেদ। NDRF/SDRF মোতায়েন কৰক আৰু কৰিডৰ বন্ধ কৰক।",
  },
  Severe: {
    en: "SDRF RED ALERT: High debris-flow hazard. Deploy heavy clearance machinery and stage quick-response teams.",
    hi: "एसडीआरएफ रेड अलर्ट: मलबा प्रवाह का उच्च जोखिम। त्वरित-प्रतिक्रिया दल और भारी मशीनरी तैनात करें।",
    as: "SDRF ৰেড এলাৰ্ট: উচ্চ ধ্বংসাৱশেষ প্ৰবাহৰ আশংকা। দ্ৰুত-প্ৰতিক্ৰিয়া দল আৰু মেচিনাৰী মোতায়েন কৰক।",
  },
  Moderate: {
    en: "SDRF AMBER ADVISORY: Restrict heavy freight transit. Continuous telemetry watch of slope & pore-water saturation.",
    hi: "एसडीआरएफ एम्बर एडवाइजरी: भारी माल ढुलाई सीमित करें। ढलान और मिट्टी संतृप्ति की निरंतर निगरानी करें।",
    as: "SDRF এম্বাৰ পৰামৰ্শ: গধুৰ মালবাহী যান চলাচল সীমিত কৰক। ঢাল আৰু পানীৰ পৰিপূৰ্ণতা নিৰন্তৰ পৰ্যবেক্ষণ কৰক।",
  },
  Low: {
    en: "SDRF GREEN NORMAL: Routine geological observation. Baseline highway and civilian operations permitted.",
    hi: "एसडीआरएफ ग्रीन नॉर्मल: नियमित भूवैज्ञानिक अवलोकन। सामान्य राजमार्ग और नागरिक संचालन अनुमत।",
    as: "SDRF গ্ৰীণ নৰ্মাল: নিয়মীয়া ভূ-তাত্ত্বিক পৰ্যবেক্ষণ। নিয়মীয়া ৰাজপথ আৰু নাগৰিক কাৰ্য্যকলাপ অনুমোদিত।",
  },
}

export const NER_REGIONS: RegionProfile[] = [
  // --- MEGHALAYA ---
  {
    id: "east-khasi-hills",
    name: "East Khasi Hills",
    district: "East Khasi Hills",
    state: "Meghalaya",
    city: "Shillong",
    coords: [25.5788, 91.8933],
    slope: 42,
    rainfall: 185,
    soil: 88,
    elevation: 1496,
    severity: "Severe",
    advice: {
      en: "NH-6 corridor vulnerable to debris flow. Restrict heavy transit.",
      hi: "एनएच-6 गलियारा मलबा प्रवाह के प्रति संवेदनशील है। भारी यातायात प्रतिबंधित करें।",
      as: "NH-6 কৰিডৰ ধ্বংসাৱশেষ প্ৰবাহৰ বাবে বিপদজনক। ভাৰী যানচলাচল সীমিত কৰক।",
    },
    status: {
      en: "Severe Hazard — NH-6 debris-flow watch",
      hi: "गंभीर खतरा — एनएच-6 मलबा-प्रवाह निगरानी",
      as: "গুৰুতৰ বিপদ — NH-6 ধ্বংসাৱশেষ প্ৰবাহ নিৰীক্ষণ",
    },
    aliases: ["shillong", "east khasi", "khasi hills", "nh-6", "meghalaya"],
  },
  {
    id: "sw-khasi-hills",
    name: "SW Khasi Hills (Mawsynram)",
    district: "South West Khasi Hills",
    state: "Meghalaya",
    city: "Mawsynram",
    coords: [25.2974, 91.5822],
    slope: 48,
    rainfall: 280,
    soil: 95,
    elevation: 1400,
    severity: "Critical",
    advice: {
      en: "Extreme torrential precipitation threshold crossed. Red alert for deep rotational slips.",
      hi: "अत्यधिक मूसलाधार बारिश की सीमा पार। गहरे भूस्खलन के लिए रेड अलर्ट।",
      as: "চৰম প্ৰচণ্ড বৰষুণৰ সীমা অতিক্ৰম। গভীৰ ভূমিস্খলনৰ বাবে ৰেড এলাৰ্ট।",
    },
    status: {
      en: "Critical Red Alert — peak pluviometric saturation",
      hi: "क्रिटिकल रेड अलर्ट — अधिकतम वर्षा संतृप्ति",
      as: "সংকটজনক ৰেড এলাৰ্ট — সৰ্বোচ্চ বৃষ্টিপাতৰ সংপৃক্তি",
    },
    aliases: ["mawsynram", "south west khasi", "cherra"],
  },
  {
    id: "west-khasi-hills",
    name: "West Khasi Hills",
    district: "West Khasi Hills",
    state: "Meghalaya",
    city: "Nongstoin",
    coords: [25.5177, 91.2698],
    slope: 39,
    rainfall: 165,
    soil: 80,
    elevation: 1310,
    severity: "Severe",
    advice: {
      en: "NH-127B transit cuts vulnerable to shoulder collapse. Field patrols active.",
      hi: "एनएच-127बी ढलान धंसने के प्रति संवेदनशील। फील्ड गश्ती दल सक्रिय।",
      as: "NH-127B পথ খহি পৰাৰ সম্ভাৱনা। ক্ষেত্ৰ টহল সক্ৰিয়।",
    },
    status: {
      en: "Severe Hazard — Nongstoin highway risk",
      hi: "गंभीर खतरा — नोंगस्टोइन राजमार्ग जोखिम",
      as: "গুৰুতৰ বিপদ — নংষ্টোইন ৰাজপথৰ সংকট",
    },
    aliases: ["nongstoin", "west khasi"],
  },
  {
    id: "west-jaintia-hills",
    name: "West Jaintia Hills",
    district: "West Jaintia Hills",
    state: "Meghalaya",
    city: "Jowai",
    coords: [25.4436, 92.2033],
    slope: 36,
    rainfall: 150,
    soil: 78,
    elevation: 1380,
    severity: "Severe",
    advice: {
      en: "Limestone dissolution zone with active sinkhole risks along NH-44.",
      hi: "एनएच-44 पर चूना पत्थर अपघटन व सिंकहोल का सक्रिय जोखिम।",
      as: "NH-44ত চূণশিল বিগলন আৰু ছিংকহ'লৰ সক্ৰিয় আশংকা।",
    },
    status: {
      en: "Severe Hazard — karst subsidence watch",
      hi: "गंभीर खतरा — कार्स्ट भूधंसाव निगरानी",
      as: "গুৰুতৰ বিপদ — কাৰ্ষ্ট ভূমি ধহাৰ নিৰীক্ষণ",
    },
    aliases: ["jowai", "jaintia", "nh-44"],
  },
  {
    id: "ri-bhoi",
    name: "Ri-Bhoi",
    district: "Ri-Bhoi",
    state: "Meghalaya",
    city: "Nongpoh",
    coords: [25.9036, 91.8803],
    slope: 28,
    rainfall: 110,
    soil: 64,
    elevation: 550,
    severity: "Moderate",
    advice: {
      en: "Guwahati-Shillong arterial highway expressway stable; watch cut slopes.",
      hi: "गुवाहाटी-शिलांग एक्सप्रेसवे स्थिर; कटी ढलानों पर नजर रखें।",
      as: "গুৱাহাটী-শ্বিলং ৰাজপথ স্থিৰ; পাহাৰ কটা ঢাল নিৰীক্ষণ কৰক।",
    },
    status: {
      en: "Moderate Advisory — arterial corridor watch",
      hi: "मध्यम सलाह — मुख्य गलियारा निगरानी",
      as: "মধ্যম সতৰ্কবাণী — মুখ্য পথ নিৰীক্ষণ",
    },
    aliases: ["nongpoh", "ri bhoi", "ribhoi"],
  },

  // --- ASSAM ---
  {
    id: "kamrup-metropolitan",
    name: "Kamrup Metropolitan",
    district: "Kamrup Metropolitan",
    state: "Assam",
    city: "Guwahati",
    coords: [26.1445, 91.7362],
    slope: 18,
    rainfall: 65,
    soil: 45,
    elevation: 55,
    severity: "Moderate",
    advice: {
      en: "Hillside slope retention stable; lowland waterlogging active.",
      hi: "पहाड़ी ढलान स्थिर; निचले इलाकों में जलभराव सक्रिय है।",
      as: "পাহাৰীয়া ঢাল স্থিৰ; নিম্নভূমিত জলাবদ্ধতা সক্ৰিয়।",
    },
    status: {
      en: "Moderate Advisory — lowland inundation",
      hi: "मध्यम सलाह — निचले क्षेत्र में जलभराव",
      as: "মধ্যম সতৰ্কবাণী — নিম্নভূমি জলাবদ্ধতা",
    },
    aliases: ["guwahati", "kamrup", "ghy", "assam"],
  },
  {
    id: "dima-hasao",
    name: "Dima Hasao",
    district: "Dima Hasao",
    state: "Assam",
    city: "Haflong",
    coords: [25.1711, 93.0185],
    slope: 36,
    rainfall: 140,
    soil: 76,
    elevation: 966,
    severity: "Severe",
    advice: {
      en: "Railway cutting zone unstable. SDRF spot surveillance deployed.",
      hi: "रेलवे कटिंग क्षेत्र अस्थिर। एसडीआरएफ निगरानी तैनात।",
      as: "ৰেলৱে কাটিং ক্ষেত্ৰ অস্থিৰ। SDRF নিৰীক্ষণ মোতায়েন।",
    },
    status: {
      en: "Severe Hazard — railway cutting watch",
      hi: "गंभीर खतरा — रेलवे कटिंग निगरानी",
      as: "গুৰুতৰ বিপদ — ৰেলৱে কাটিং নিৰীক্ষণ",
    },
    aliases: ["haflong", "dima hasao", "north cachar", "lumding"],
  },
  {
    id: "cachar",
    name: "Cachar",
    district: "Cachar",
    state: "Assam",
    city: "Silchar",
    coords: [24.8333, 92.7976],
    slope: 10,
    rainfall: 28,
    soil: 35,
    elevation: 22,
    severity: "Low",
    advice: {
      en: "Normal operations. No slope movement detected in plain tracts.",
      hi: "सामान्य संचालन। मैदानी इलाकों में कोई ढलान हलचल नहीं।",
      as: "সাধাৰণ কাৰ্য্যকলাপ। সমতল অঞ্চলত কোনো বিপদাশংকা নাই।",
    },
    status: {
      en: "Safe Zone — no slope movement",
      hi: "सुरक्षित क्षेत्र — ढलान स्थिर",
      as: "সুৰক্ষিত অঞ্চল — ঢাল স্থিৰ",
    },
    aliases: ["silchar", "cachar", "barak", "nh-37"],
  },
  {
    id: "karbi-anglong",
    name: "Karbi Anglong",
    district: "Karbi Anglong",
    state: "Assam",
    city: "Diphu",
    coords: [25.8456, 93.4323],
    slope: 26,
    rainfall: 85,
    soil: 58,
    elevation: 186,
    severity: "Moderate",
    advice: {
      en: "Mikir Hills feeder road cuts experiencing minor debris spills.",
      hi: "मिकिर हिल्स संपर्क मार्गों पर हल्का मलबा गिरने की सूचना।",
      as: "মিকিৰ পাহাৰৰ সংযোগ পথত সামান্য শিল-মাটি খহিছে।",
    },
    status: {
      en: "Moderate Advisory — Mikir Hills transit",
      hi: "मध्यम सलाह — मिकिर हिल्स मार्ग",
      as: "মধ্যম সতৰ্কবাণী — মিকিৰ পাহাৰ পথ",
    },
    aliases: ["diphu", "karbi anglong", "bokajan"],
  },
  {
    id: "dibrugarh",
    name: "Dibrugarh",
    district: "Dibrugarh",
    state: "Assam",
    city: "Dibrugarh",
    coords: [27.4728, 94.9120],
    slope: 8,
    rainfall: 32,
    soil: 30,
    elevation: 108,
    severity: "Low",
    advice: {
      en: "Brahmaputra alluvial banks stable. River monitoring normal.",
      hi: "ब्रह्मपुत्र तटबंध स्थिर। नदी निगरानी सामान्य।",
      as: "ব্ৰহ্মপুত্ৰৰ মথাউৰি স্থিৰ। নদী নিৰীক্ষণ স্বাভাৱিক।",
    },
    status: {
      en: "Safe Zone — baseline alluvial plain",
      hi: "सुरक्षित क्षेत्र — सामान्य मैदानी स्तर",
      as: "সুৰক্ষিত অঞ্চল — স্বাভাৱিক সমভূমি",
    },
    aliases: ["dibrugarh", "upper assam"],
  },

  // --- SIKKIM ---
  {
    id: "north-sikkim",
    name: "North Sikkim",
    district: "North Sikkim",
    state: "Sikkim",
    city: "Mangan",
    coords: [27.5117, 88.5311],
    slope: 54,
    rainfall: 230,
    soil: 94,
    elevation: 1240,
    severity: "Critical",
    advice: {
      en: "Active shear crack expansion along Teesta axis. Mandatory evacuation advisory.",
      hi: "तीस्ता अक्ष पर सक्रिय दरार विस्तार। अनिवार्य निकासी सलाह।",
      as: "তিস্তা অক্ষত সক্ৰিয় ফাট বিস্তাৰ। বাধ্যতামূলক উচ্ছেদ সতৰ্কবাণী।",
    },
    status: {
      en: "Critical Evacuation — Teesta shear zone",
      hi: "आलोचनात्मक निकासी — तीस्ता शियर ज़ोन",
      as: "সংকটজনক উচ্ছেদ — তিস্তা শ্বিয়েৰ জোন",
    },
    aliases: ["mangan", "chungthang", "teesta", "sikkim", "north sikkim"],
  },
  {
    id: "east-sikkim",
    name: "East Sikkim (Gangtok)",
    district: "East Sikkim",
    state: "Sikkim",
    city: "Gangtok",
    coords: [27.3389, 88.6065],
    slope: 41,
    rainfall: 195,
    soil: 82,
    elevation: 1650,
    severity: "Severe",
    advice: {
      en: "NH-10 artery high risk of mudflow near 29th Mile. Regulated one-way convoy.",
      hi: "एनएच-10 पर 29th माइल के पास मडफ्लो का उच्च जोखिम। नियंत्रित एकतरफा काफिला।",
      as: "NH-10ত ২৯ মাইলৰ ওচৰত বোকা প্ৰবাহৰ উচ্চ আশংকা। নিয়ন্ত্ৰিত একমুখী যান-বাহন।",
    },
    status: {
      en: "Severe Hazard — NH-10 Gangtok lifeline",
      hi: "गंभीर खतरा — एनएच-10 गंगटोक जीवनरेखा",
      as: "গুৰুতৰ বিপদ — NH-10 গেংটক লাইফলাইন",
    },
    aliases: ["gangtok", "east sikkim", "nh-10", "ranipool"],
  },
  {
    id: "south-sikkim",
    name: "South Sikkim",
    district: "South Sikkim",
    state: "Sikkim",
    city: "Namchi",
    coords: [27.1667, 88.3500],
    slope: 38,
    rainfall: 140,
    soil: 74,
    elevation: 1315,
    severity: "Severe",
    advice: {
      en: "Tendong Hill geological fault line showing micro-subsidence. Geophones active.",
      hi: "टेंडोंग हिल फॉल्ट लाइन पर भूधंसाव के संकेत। जियोफोन सक्रिय।",
      as: "তেণ্ডং পাহাৰত সামান্য মাটি খহাৰ লক্ষণ। জিঅ'ফোন সক্ৰিয়।",
    },
    status: {
      en: "Severe Hazard — Tendong fault telemetry",
      hi: "गंभीर खतरा — टेंडोंग फॉल्ट निगरानी",
      as: "গুৰুতৰ বিপদ — তেণ্ডং ফল্ট নিৰীক্ষণ",
    },
    aliases: ["namchi", "south sikkim", "ravangla"],
  },
  {
    id: "west-sikkim",
    name: "West Sikkim",
    district: "West Sikkim",
    state: "Sikkim",
    city: "Gyalshing",
    coords: [27.2833, 88.2333],
    slope: 43,
    rainfall: 160,
    soil: 79,
    elevation: 1600,
    severity: "Severe",
    advice: {
      en: "Rangeet valley slopes vulnerable to rotational slides. Heavy vehicles rerouted.",
      hi: "रंगीत घाटी ढलानों पर भूस्खलन का जोखिम। भारी वाहन डायवर्ट किए गए।",
      as: "ৰংগীত উপত্যকাৰ ঢালত স্খলনৰ আশংকা। ভাৰী বাহন বিকল্প পথেৰে প্ৰেৰণ।",
    },
    status: {
      en: "Severe Hazard — Pelling-Gyalshing route",
      hi: "गंभीर खतरा — पेलिंग-ग्यालशिंग मार्ग",
      as: "গুৰুতৰ বিপদ — পেলিং-গ্যালশ্বিং পথ",
    },
    aliases: ["gyalshing", "pelling", "west sikkim"],
  },

  // --- ARUNACHAL PRADESH ---
  {
    id: "tawang",
    name: "Tawang",
    district: "Tawang",
    state: "Arunachal Pradesh",
    city: "Tawang",
    coords: [27.5861, 91.8594],
    slope: 52,
    rainfall: 175,
    soil: 86,
    elevation: 3048,
    severity: "Critical",
    advice: {
      en: "Sela Pass trans-Himalayan corridor high freeze-thaw rockfall alert. BRO teams on standby.",
      hi: "सेला पास ट्रांस-हिमालयी कॉरिडोर पर रॉकफॉल का हाई अलर्ट। बीआरओ टीमें तैयार।",
      as: "চেলা পাছ কৰিডৰত শিল খহি পৰাৰ সতৰ্কবাণী। BRO দল সষ্টম।",
    },
    status: {
      en: "Critical Red Alert — Sela pass rockfall corridor",
      hi: "क्रिटिकल रेड अलर्ट — सेला पास रॉकफॉल क्षेत्र",
      as: "সংকটজনক ৰেড এলাৰ্ট — চেলা পাছ বিপদাশংকা",
    },
    aliases: ["tawang", "sela pass", "jang", "arunachal"],
  },
  {
    id: "west-kameng",
    name: "West Kameng",
    district: "West Kameng",
    state: "Arunachal Pradesh",
    city: "Bomdila",
    coords: [27.2645, 92.4159],
    slope: 45,
    rainfall: 155,
    soil: 81,
    elevation: 2217,
    severity: "Severe",
    advice: {
      en: "Bhalukpong-Bomdila military highway debris flow warning at Kaspi.",
      hi: "भालुकपोंग-बोमडिला मार्ग पर कास्पी के पास मलबा प्रवाह की चेतावनी।",
      as: "ভালুকপং-বমডিলা পথত কাচ্পিৰ ওচৰত ধ্বংসাৱশেষ খহি পৰাৰ সকীয়নি।",
    },
    status: {
      en: "Severe Hazard — Bhalukpong highway axis",
      hi: "गंभीर खतरा — भालुकपोंग राजमार्ग अक्ष",
      as: "গুৰুতৰ বিপদ — ভালুকপং ৰাজপথ অক্ষ",
    },
    aliases: ["bomdila", "west kameng", "bhalukpong", "dirang"],
  },
  {
    id: "papum-pare",
    name: "Papum Pare",
    district: "Papum Pare",
    state: "Arunachal Pradesh",
    city: "Itanagar",
    coords: [27.0844, 93.6053],
    slope: 35,
    rainfall: 135,
    soil: 72,
    elevation: 320,
    severity: "Severe",
    advice: {
      en: "Capital Complex cut slopes vulnerable. Avoid hillsides near Chandranagar.",
      hi: "राजधानी परिसर की कटी ढलानों पर जोखिम। चंद्रनगर के पास पहाड़ियों से बचें।",
      as: "ৰাজধানী কমপ্লেক্স পাহাৰত খহনীয়াৰ সম্ভাৱনা। চন্দ্ৰনগৰৰ পাহাৰৰ পৰা আঁতৰি থাকক।",
    },
    status: {
      en: "Severe Hazard — Itanagar hill cuttings",
      hi: "गंभीर खतरा — ईटानगर पहाड़ी कटिंग",
      as: "গুৰুতৰ বিপদ — ইটানগৰ পাহাৰীয়া খহনীয়া",
    },
    aliases: ["itanagar", "papum pare", "naharlagun"],
  },
  {
    id: "lower-subansiri",
    name: "Lower Subansiri",
    district: "Lower Subansiri",
    state: "Arunachal Pradesh",
    city: "Ziro",
    coords: [27.6300, 93.8300],
    slope: 34,
    rainfall: 115,
    soil: 68,
    elevation: 1572,
    severity: "Moderate",
    advice: {
      en: "Ziro-Potin highway road slip risk during afternoon rain pulses.",
      hi: "दोपहर की बारिश के दौरान जीरो-पोतिन मार्ग पर भूस्खलन जोखिम।",
      as: "দুপৰীয়াৰ বৰষুণৰ সময়ত জিৰ'-পোটিন পথত মাটি খহি পৰাৰ আশংকা।",
    },
    status: {
      en: "Moderate Advisory — Potin highway watch",
      hi: "मध्यम सलाह — पोतिन राजमार्ग निगरानी",
      as: "মধ্যম সতৰ্কবাণী — পোটিন ৰাজপথ নিৰীক্ষণ",
    },
    aliases: ["ziro", "lower subansiri", "potin"],
  },

  // --- NAGALAND ---
  {
    id: "kohima",
    name: "Kohima",
    district: "Kohima",
    state: "Nagaland",
    city: "Kohima",
    coords: [25.6751, 94.1086],
    slope: 43,
    rainfall: 160,
    soil: 83,
    elevation: 1444,
    severity: "Severe",
    advice: {
      en: "NH-29 sinking zone active near Dzüdza bridge. Light motor vehicles only.",
      hi: "द्जुद्जा पुल के पास एनएच-29 धंसाव क्षेत्र सक्रिय। केवल हल्के वाहनों की अनुमति।",
      as: "দজুদজা দলঙৰ ওচৰত NH-29 পথ ধহি পৰিছে। কেৱল পাতল বাহনৰ অনুমতি।",
    },
    status: {
      en: "Severe Hazard — NH-29 sinking zone",
      hi: "गंभीर खतरा — एनएच-29 भूधंसाव क्षेत्र",
      as: "গুৰুতৰ বিপদ — NH-29 ভূমি খহনীয়া",
    },
    aliases: ["kohima", "nagaland", "nh-29", "dzudza"],
  },
  {
    id: "phek",
    name: "Phek",
    district: "Phek",
    state: "Nagaland",
    city: "Phek",
    coords: [25.6833, 94.4667],
    slope: 46,
    rainfall: 170,
    soil: 87,
    elevation: 1500,
    severity: "Critical",
    advice: {
      en: "Tizu river fault active slumping. Evacuate roadside huts along Pfutsero stretch.",
      hi: "तिजु नदी क्षेत्र में सक्रिय ढलान स्लिप। फुटसेरो मार्ग पर किनारे की बस्तियां खाली कराएं।",
      as: "টিজু নদী অঞ্চলত সক্ৰিয় স্খলন। ফুটচেৰ' পথৰ কাষৰ লোকক স্থানান্তৰ কৰক।",
    },
    status: {
      en: "Critical Red Alert — Tizu basin active shear",
      hi: "क्रिटिकल रेड अलर्ट — तिजु बेसिन सक्रिय दरार",
      as: "সংকটজনক ৰেড এলাৰ্ট — টিজু নদী অঞ্চলৰ ফাট",
    },
    aliases: ["phek", "pfutsero", "tizu"],
  },
  {
    id: "mokokchung",
    name: "Mokokchung",
    district: "Mokokchung",
    state: "Nagaland",
    city: "Mokokchung",
    coords: [26.3250, 94.5167],
    slope: 36,
    rainfall: 125,
    soil: 72,
    elevation: 1325,
    severity: "Moderate",
    advice: {
      en: "Changki valley transit route minor mud runoff. Drivers advised daylight travel.",
      hi: "चांगकी घाटी मार्ग पर हल्का कीचड़ बहाव। दिन के समय यात्रा की सलाह।",
      as: "চাংকী উপত্যকা পথত বোকা বৈছে। দিনৰ ভাগত ভ্ৰমণৰ পৰামৰ্শ।",
    },
    status: {
      en: "Moderate Advisory — Changki transit corridor",
      hi: "मध्यम सलाह — चांगकी मार्ग निगरानी",
      as: "মধ্যম সতৰ্কবাণী — চাংকী পথ নিৰীক্ষণ",
    },
    aliases: ["mokokchung", "changki", "tuli"],
  },
  {
    id: "dimapur",
    name: "Dimapur",
    district: "Dimapur",
    state: "Nagaland",
    city: "Dimapur",
    coords: [25.9090, 93.7266],
    slope: 12,
    rainfall: 45,
    soil: 40,
    elevation: 145,
    severity: "Low",
    advice: {
      en: "Plains transit hub normal. No slope hazards reported.",
      hi: "मैदानी क्षेत्र सामान्य। कोई भूस्खलन खतरा नहीं।",
      as: "সমতল পৰিবহণ কেন্দ্ৰ স্বাভাৱিক। কোনো ভূমিস্খলনৰ আশংকা নাই।",
    },
    status: {
      en: "Safe Zone — plains staging area",
      hi: "सुरक्षित क्षेत्र — सामान्य मैदानी बेस",
      as: "সুৰক্ষিত অঞ্চল — সমভূমি ঘাটি",
    },
    aliases: ["dimapur", "chumoukedima"],
  },

  // --- MANIPUR ---
  {
    id: "tamenglong",
    name: "Tamenglong",
    district: "Tamenglong",
    state: "Manipur",
    city: "Tamenglong",
    coords: [24.9833, 93.4833],
    slope: 49,
    rainfall: 210,
    soil: 91,
    elevation: 1260,
    severity: "Critical",
    advice: {
      en: "NH-37 Imphal-Jiribam economic lifeline blocked by massive debris slides near Noney.",
      hi: "नोनी के पास भारी भूस्खलन से एनएच-37 इंफाल-जिरीबाम मार्ग अवरुद्ध।",
      as: "ননেৰ ওচৰত ভয়ংকৰ স্খলনৰ ফলত NH-37 ইম্ফল-জিৰিবাম পথ বন্ধ।",
    },
    status: {
      en: "Critical Red Alert — NH-37 Jiribam corridor failure",
      hi: "क्रिटिकल रेड अलर्ट — एनएच-37 जिरीबाम गलियारा अवरुद्ध",
      as: "সংকটজনক ৰেড এলাৰ্ট — NH-37 জিৰিবাম পথ অচল",
    },
    aliases: ["tamenglong", "noney", "nh-37", "jiribam", "manipur"],
  },
  {
    id: "ukhrul",
    name: "Ukhrul",
    district: "Ukhrul",
    state: "Manipur",
    city: "Ukhrul",
    coords: [25.1167, 94.3667],
    slope: 42,
    rainfall: 150,
    soil: 78,
    elevation: 1662,
    severity: "Severe",
    advice: {
      en: "Shirui Kashong foothill road cuts experiencing fissuring. Monitor hill settlements.",
      hi: "शिरुई काशोंग तलहटी सड़कों पर दरारें। पहाड़ी बस्तियों पर नजर रखें।",
      as: "চিৰুই কাশং পাহাৰীয়া পথত ফাট মেলাৰ বাতৰি। বস্তি অঞ্চল নিৰীক্ষণ কৰক।",
    },
    status: {
      en: "Severe Hazard — Shirui hill slope slip",
      hi: "गंभीर खतरा — शिरुई पहाड़ी ढलान फिसलन",
      as: "গুৰুতৰ বিপদ — চিৰুই পাহাৰ খহনীয়া",
    },
    aliases: ["ukhrul", "shirui", "kamjong"],
  },
  {
    id: "churachandpur",
    name: "Churachandpur",
    district: "Churachandpur",
    state: "Manipur",
    city: "Churachandpur",
    coords: [24.3333, 93.6833],
    slope: 37,
    rainfall: 130,
    soil: 70,
    elevation: 914,
    severity: "Moderate",
    advice: {
      en: "Guite road southern mountain spine prone to rain-induced slumping.",
      hi: "गुइते मार्ग के दक्षिणी पहाड़ी हिस्से पर बारिश से धंसाव का जोखिम।",
      as: "গুইতে পথৰ দক্ষিণ পাহাৰীয়া অংশত বৰষুণৰ ফলত মাটি খহাৰ আশংকা।",
    },
    status: {
      en: "Moderate Advisory — Guite highway watch",
      hi: "मध्यम सलाह — गुइते राजमार्ग निगरानी",
      as: "মধ্যম সতৰ্কবাণী — গুইতে পথ নিৰীক্ষণ",
    },
    aliases: ["churachandpur", "ccpur", "singngat"],
  },
  {
    id: "imphal-west",
    name: "Imphal West",
    district: "Imphal West",
    state: "Manipur",
    city: "Imphal",
    coords: [24.8170, 93.9368],
    slope: 14,
    rainfall: 50,
    soil: 42,
    elevation: 786,
    severity: "Low",
    advice: {
      en: "Valley operations baseline safe. Lowland drainage flow normal.",
      hi: "घाटी क्षेत्र सामान्य व सुरक्षित। जल निकासी प्रवाह सामान्य।",
      as: "উপত্যকা অঞ্চল স্বাভাৱিক আৰু সুৰক্ষিত। পানী নিষ্কাশন নিয়মীয়া।",
    },
    status: {
      en: "Safe Zone — Imphal valley basin",
      hi: "सुरक्षित क्षेत्र — इंफाल घाटी बेसिन",
      as: "সুৰক্ষিত অঞ্চল — ইম্ফল উপত্যকা",
    },
    aliases: ["imphal", "imphal west", "kangla"],
  },

  // --- MIZORAM ---
  {
    id: "aizawl",
    name: "Aizawl",
    district: "Aizawl",
    state: "Mizoram",
    city: "Aizawl",
    coords: [23.7271, 92.7176],
    slope: 47,
    rainfall: 190,
    soil: 89,
    elevation: 1132,
    severity: "Critical",
    advice: {
      en: "Ridge-top settlement slope creep detected in Ramhlun and Laipuitlang. Evacuation alert.",
      hi: "रामहलुन और लाईपुईत्लांग में पहाड़ी धंसाव सक्रिय। बस्ती खाली करने का अलर्ट।",
      as: "ৰামহলুন আৰু লাইপুইৎলাঙত পাহাৰ খহি পৰাৰ সতৰ্কবাণী। উচ্ছেদ সূচনা।",
    },
    status: {
      en: "Critical Red Alert — urban ridge sinking hazard",
      hi: "क्रिटिकल रेड अलर्ट — शहरी पहाड़ी धंसाव खतरा",
      as: "সংকটজনক ৰেড এলাৰ্ট — পাহাৰীয়া চহৰ খহি পৰাৰ আশংকা",
    },
    aliases: ["aizawl", "mizoram", "laipuitlang", "ramhlun"],
  },
  {
    id: "lunglei",
    name: "Lunglei",
    district: "Lunglei",
    state: "Mizoram",
    city: "Lunglei",
    coords: [22.8833, 92.7333],
    slope: 44,
    rainfall: 170,
    soil: 82,
    elevation: 1222,
    severity: "Severe",
    advice: {
      en: "Tlawng river valley flank saturated. Heavy mudslide alert on Southern Highway.",
      hi: "त्लॉन्ग नदी घाटी की ढलान संतृप्त। दक्षिणी राजमार्ग पर मडस्लाइड अलर्ट।",
      as: "ৎলাওং নদী উপত্যকাৰ ঢাল অত্যন্ত ভিজা। দক্ষিণ ৰাজপথত বোকাস্খলনৰ সতৰ্কবাণী।",
    },
    status: {
      en: "Severe Hazard — Southern highway mudflow",
      hi: "गंभीर खतरा — दक्षिणी राजमार्ग मडफ्लो",
      as: "গুৰুতৰ বিপদ — দক্ষিণ ৰাজপথত বোকাস্খলন",
    },
    aliases: ["lunglei", "south mizoram"],
  },
  {
    id: "champhai",
    name: "Champhai",
    district: "Champhai",
    state: "Mizoram",
    city: "Champhai",
    coords: [23.4735, 93.3284],
    slope: 31,
    rainfall: 90,
    soil: 60,
    elevation: 1678,
    severity: "Moderate",
    advice: {
      en: "Moderate mudslide risk on rural feeder roads near Zokhawthar border.",
      hi: "जोखावथर सीमा के पास ग्रामीण संपर्क मार्गों पर मध्यम कीचड़-स्खलन जोखिम।",
      as: "জ'খাউথাৰ সীমান্তৰ ওচৰত মধ্যম বোকাস্খলনৰ আশংকা।",
    },
    status: {
      en: "Moderate Advisory — rural feeder roads",
      hi: "मध्यम सलाह — ग्रामीण संपर्क मार्ग",
      as: "मध्यम সতৰ্কবাণী — গ্ৰাম্য সংযোগ পথ",
    },
    aliases: ["champhai", "zokhawthar", "east mizoram"],
  },
  {
    id: "serchhip",
    name: "Serchhip",
    district: "Serchhip",
    state: "Mizoram",
    city: "Serchhip",
    coords: [23.3100, 92.8500],
    slope: 35,
    rainfall: 110,
    soil: 65,
    elevation: 1296,
    severity: "Moderate",
    advice: {
      en: "Central Mizoram highway ridge stable; caution advised at culverts.",
      hi: "मध्य मिजोरम राजमार्ग स्थिर; पुलियों के पास सावधानी बरतें।",
      as: "মধ্য মিজোৰাম ৰাজপথ স্থিৰ; কালভাৰ্টৰ ওচৰত সাৱধান হওক।",
    },
    status: {
      en: "Moderate Advisory — central highway watch",
      hi: "मध्यम सलाह — केंद्रीय राजमार्ग निगरानी",
      as: "মধ্যম সতৰ্কবাণী — কেন্দ্ৰীয় পথ নিৰীক্ষণ",
    },
    aliases: ["serchhip", "thenzawl"],
  },

  // --- TRIPURA ---
  {
    id: "dhalai",
    name: "Dhalai",
    district: "Dhalai",
    state: "Tripura",
    city: "Ambassa",
    coords: [23.9167, 91.8500],
    slope: 28,
    rainfall: 88,
    soil: 56,
    elevation: 65,
    severity: "Moderate",
    advice: {
      en: "Atharamura hill range cuts experiencing soil slips along NH-8.",
      hi: "एनएच-8 पर अठारमुरा पहाड़ी श्रृंखला में मिट्टी धंसने की सूचना।",
      as: "NH-8ত আঠাৰমুৰা পাহাৰৰ মাটি খহি পৰিছে।",
    },
    status: {
      en: "Moderate Advisory — Atharamura hill range",
      hi: "मध्यम सलाह — अठारमुरा पहाड़ी श्रृंखला",
      as: "মধ্যম সতৰ্কবাণী — আঠাৰমুৰা পাহাৰ",
    },
    aliases: ["ambassa", "dhalai", "atharamura", "nh-8", "tripura"],
  },
  {
    id: "west-tripura",
    name: "West Tripura",
    district: "West Tripura",
    state: "Tripura",
    city: "Agartala",
    coords: [23.8315, 91.2868],
    slope: 11,
    rainfall: 35,
    soil: 38,
    elevation: 16,
    severity: "Low",
    advice: {
      en: "Normal plain conditions. Zero landslide risk in urban capital belt.",
      hi: "सामान्य मैदानी स्थिति। शहरी राजधानी क्षेत्र में शून्य भूस्खलन जोखिम।",
      as: "স্বাভাৱিক সমভূমি স্থিতি। ৰাজধানী অঞ্চলত ভূমিস্খলনৰ কোনো আশংকা নাই।",
    },
    status: {
      en: "Safe Zone — capital plain terrain",
      hi: "सुरक्षित क्षेत्र — राजधानी मैदानी भूभाग",
      as: "সুৰক্ষিত অঞ্চল — ৰাজধানী সমভূমি",
    },
    aliases: ["agartala", "west tripura"],
  },
  {
    id: "gomati",
    name: "Gomati",
    district: "Gomati",
    state: "Tripura",
    city: "Udaipur",
    coords: [23.5333, 91.4833],
    slope: 15,
    rainfall: 42,
    soil: 41,
    elevation: 28,
    severity: "Low",
    advice: {
      en: "Gomati river basin stable. No slope degradation.",
      hi: "गोमती नदी बेसिन स्थिर। कोई ढलान क्षति नहीं।",
      as: "গোমতী নদী অঞ্চল স্থিৰ। কোনো ক্ষয়-ক্ষতি হোৱা নাই।",
    },
    status: {
      en: "Safe Zone — river basin plain",
      hi: "सुरक्षित क्षेत्र — नदी बेसिन मैदान",
      as: "সুৰক্ষিত অঞ্চল — নদী সমভূমি",
    },
    aliases: ["udaipur", "gomati", "tripura"],
  },
]

export const DEFAULT_REGION = NER_REGIONS[0]

export function localize(text: LocalizedText, lang: Language): string {
  return text[lang]
}

export function findRegionByName(query: string): RegionProfile | undefined {
  const q = query.trim().toLowerCase()
  if (!q) return undefined
  return NER_REGIONS.find(
    (r) =>
      r.name.toLowerCase() === q ||
      r.district.toLowerCase() === q ||
      r.city.toLowerCase() === q ||
      r.id === q ||
      r.aliases.some((a) => a.toLowerCase() === q),
  )
}

export function searchRegions(query: string): RegionProfile[] {
  const q = query.trim().toLowerCase()
  if (!q) return [...NER_REGIONS]
  return NER_REGIONS.filter((r) =>
    [r.name, r.district, r.state, r.city, r.id, ...r.aliases].some((v) => v.toLowerCase().includes(q)),
  )
}

export function findNearestRegion(lat: number, lon: number): RegionProfile {
  let nearest = NER_REGIONS[0]
  let minDist = Number.POSITIVE_INFINITY
  for (const region of NER_REGIONS) {
    const dist = Math.hypot(region.coords[0] - lat, region.coords[1] - lon)
    if (dist < minDist) {
      minDist = dist
      nearest = region
    }
  }
  return nearest
}

export function cloneRegion(region: RegionProfile): RegionProfile {
  return {
    ...region,
    coords: [region.coords[0], region.coords[1]],
    advice: { ...region.advice },
    status: { ...region.status },
    aliases: [...region.aliases],
  }
}
