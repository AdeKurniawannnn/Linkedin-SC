/**
 * Location Presets Configuration
 *
 * Hierarchical global location system for LinkedIn searches.
 * Structure: Region → Country → City
 * Total: ~95 location presets covering major business hubs worldwide.
 */

export interface LocationPreset {
  id: string;
  type: 'region' | 'country' | 'city';
  label: string;
  queryFragment: string;
  parentId?: string;
  flag?: string;
  isQuickPick?: boolean;
}

// Quick pick location IDs for prominent display
export const LOCATION_QUICK_PICKS = [
  'city_jakarta',
  'ctry_sg',
  'reg_sea',
  'city_sydney',
  'city_london',
  'city_nyc',
  'city_sf',
  'city_dubai',
];

export const LOCATION_PRESETS: LocationPreset[] = [
  // ============================================
  // ASIA PACIFIC (APAC)
  // ============================================

  // --- Southeast Asia ---
  {
    id: 'reg_sea',
    type: 'region',
    label: 'Southeast Asia',
    queryFragment: '("Southeast Asia" OR "SEA")',
    isQuickPick: true,
  },

  // Indonesia
  {
    id: 'ctry_id',
    type: 'country',
    label: 'Indonesia',
    queryFragment: '"Indonesia"',
    parentId: 'reg_sea',
    flag: '🇮🇩',
  },
  {
    id: 'city_jakarta',
    type: 'city',
    label: 'Jakarta',
    queryFragment: '"Jakarta"',
    parentId: 'ctry_id',
    flag: '🇮🇩',
    isQuickPick: true,
  },
  {
    id: 'city_surabaya',
    type: 'city',
    label: 'Surabaya',
    queryFragment: '"Surabaya"',
    parentId: 'ctry_id',
    flag: '🇮🇩',
  },
  {
    id: 'city_bandung',
    type: 'city',
    label: 'Bandung',
    queryFragment: '"Bandung"',
    parentId: 'ctry_id',
    flag: '🇮🇩',
  },
  {
    id: 'city_bali',
    type: 'city',
    label: 'Bali',
    queryFragment: '"Bali"',
    parentId: 'ctry_id',
    flag: '🇮🇩',
  },

  // Singapore
  {
    id: 'ctry_sg',
    type: 'country',
    label: 'Singapore',
    queryFragment: '"Singapore"',
    parentId: 'reg_sea',
    flag: '🇸🇬',
    isQuickPick: true,
  },

  // Malaysia
  {
    id: 'ctry_my',
    type: 'country',
    label: 'Malaysia',
    queryFragment: '"Malaysia"',
    parentId: 'reg_sea',
    flag: '🇲🇾',
  },
  {
    id: 'city_kl',
    type: 'city',
    label: 'Kuala Lumpur',
    queryFragment: '"Kuala Lumpur"',
    parentId: 'ctry_my',
    flag: '🇲🇾',
  },

  // Thailand
  {
    id: 'ctry_th',
    type: 'country',
    label: 'Thailand',
    queryFragment: '"Thailand"',
    parentId: 'reg_sea',
    flag: '🇹🇭',
  },
  {
    id: 'city_bangkok',
    type: 'city',
    label: 'Bangkok',
    queryFragment: '"Bangkok"',
    parentId: 'ctry_th',
    flag: '🇹🇭',
  },

  // Vietnam
  {
    id: 'ctry_vn',
    type: 'country',
    label: 'Vietnam',
    queryFragment: '"Vietnam"',
    parentId: 'reg_sea',
    flag: '🇻🇳',
  },
  {
    id: 'city_hcmc',
    type: 'city',
    label: 'Ho Chi Minh City',
    queryFragment: '"Ho Chi Minh City"',
    parentId: 'ctry_vn',
    flag: '🇻🇳',
  },
  {
    id: 'city_hanoi',
    type: 'city',
    label: 'Hanoi',
    queryFragment: '"Hanoi"',
    parentId: 'ctry_vn',
    flag: '🇻🇳',
  },

  // Philippines
  {
    id: 'ctry_ph',
    type: 'country',
    label: 'Philippines',
    queryFragment: '"Philippines"',
    parentId: 'reg_sea',
    flag: '🇵🇭',
  },
  {
    id: 'city_manila',
    type: 'city',
    label: 'Manila',
    queryFragment: '"Manila"',
    parentId: 'ctry_ph',
    flag: '🇵🇭',
  },

  // --- East Asia ---
  {
    id: 'reg_east_asia',
    type: 'region',
    label: 'East Asia',
    queryFragment: '("East Asia" OR "Northeast Asia")',
  },

  // Japan
  {
    id: 'ctry_jp',
    type: 'country',
    label: 'Japan',
    queryFragment: '"Japan"',
    parentId: 'reg_east_asia',
    flag: '🇯🇵',
  },
  {
    id: 'city_tokyo',
    type: 'city',
    label: 'Tokyo',
    queryFragment: '"Tokyo"',
    parentId: 'ctry_jp',
    flag: '🇯🇵',
  },
  {
    id: 'city_osaka',
    type: 'city',
    label: 'Osaka',
    queryFragment: '"Osaka"',
    parentId: 'ctry_jp',
    flag: '🇯🇵',
  },

  // South Korea
  {
    id: 'ctry_kr',
    type: 'country',
    label: 'South Korea',
    queryFragment: '"South Korea"',
    parentId: 'reg_east_asia',
    flag: '🇰🇷',
  },
  {
    id: 'city_seoul',
    type: 'city',
    label: 'Seoul',
    queryFragment: '"Seoul"',
    parentId: 'ctry_kr',
    flag: '🇰🇷',
  },

  // China
  {
    id: 'ctry_cn',
    type: 'country',
    label: 'China',
    queryFragment: '"China"',
    parentId: 'reg_east_asia',
    flag: '🇨🇳',
  },
  {
    id: 'city_shanghai',
    type: 'city',
    label: 'Shanghai',
    queryFragment: '"Shanghai"',
    parentId: 'ctry_cn',
    flag: '🇨🇳',
  },
  {
    id: 'city_beijing',
    type: 'city',
    label: 'Beijing',
    queryFragment: '"Beijing"',
    parentId: 'ctry_cn',
    flag: '🇨🇳',
  },
  {
    id: 'city_shenzhen',
    type: 'city',
    label: 'Shenzhen',
    queryFragment: '"Shenzhen"',
    parentId: 'ctry_cn',
    flag: '🇨🇳',
  },

  // Hong Kong
  {
    id: 'ctry_hk',
    type: 'country',
    label: 'Hong Kong',
    queryFragment: '"Hong Kong"',
    parentId: 'reg_east_asia',
    flag: '🇭🇰',
  },

  // Taiwan
  {
    id: 'ctry_tw',
    type: 'country',
    label: 'Taiwan',
    queryFragment: '"Taiwan"',
    parentId: 'reg_east_asia',
    flag: '🇹🇼',
  },
  {
    id: 'city_taipei',
    type: 'city',
    label: 'Taipei',
    queryFragment: '"Taipei"',
    parentId: 'ctry_tw',
    flag: '🇹🇼',
  },

  // --- South Asia ---
  {
    id: 'reg_south_asia',
    type: 'region',
    label: 'South Asia',
    queryFragment: '("South Asia" OR "Indian Subcontinent")',
  },

  // India
  {
    id: 'ctry_in',
    type: 'country',
    label: 'India',
    queryFragment: '"India"',
    parentId: 'reg_south_asia',
    flag: '🇮🇳',
  },
  {
    id: 'city_mumbai',
    type: 'city',
    label: 'Mumbai',
    queryFragment: '"Mumbai"',
    parentId: 'ctry_in',
    flag: '🇮🇳',
  },
  {
    id: 'city_bangalore',
    type: 'city',
    label: 'Bangalore',
    queryFragment: '"Bangalore"',
    parentId: 'ctry_in',
    flag: '🇮🇳',
  },
  {
    id: 'city_delhi',
    type: 'city',
    label: 'Delhi',
    queryFragment: '"Delhi"',
    parentId: 'ctry_in',
    flag: '🇮🇳',
  },
  {
    id: 'city_hyderabad',
    type: 'city',
    label: 'Hyderabad',
    queryFragment: '"Hyderabad"',
    parentId: 'ctry_in',
    flag: '🇮🇳',
  },

  // --- Oceania ---
  {
    id: 'reg_oceania',
    type: 'region',
    label: 'Oceania',
    queryFragment: '("Oceania" OR "Australia" OR "New Zealand")',
  },

  // Australia
  {
    id: 'ctry_au',
    type: 'country',
    label: 'Australia',
    queryFragment: '"Australia"',
    parentId: 'reg_oceania',
    flag: '🇦🇺',
  },
  {
    id: 'city_sydney',
    type: 'city',
    label: 'Sydney',
    queryFragment: '"Sydney"',
    parentId: 'ctry_au',
    flag: '🇦🇺',
    isQuickPick: true,
  },
  {
    id: 'city_melbourne',
    type: 'city',
    label: 'Melbourne',
    queryFragment: '"Melbourne"',
    parentId: 'ctry_au',
    flag: '🇦🇺',
  },

  // New Zealand
  {
    id: 'ctry_nz',
    type: 'country',
    label: 'New Zealand',
    queryFragment: '"New Zealand"',
    parentId: 'reg_oceania',
    flag: '🇳🇿',
  },
  {
    id: 'city_auckland',
    type: 'city',
    label: 'Auckland',
    queryFragment: '"Auckland"',
    parentId: 'ctry_nz',
    flag: '🇳🇿',
  },

  // ============================================
  // EUROPE
  // ============================================

  // --- Western Europe ---
  {
    id: 'reg_west_eu',
    type: 'region',
    label: 'Western Europe',
    queryFragment: '("Western Europe" OR "Europe")',
  },

  // United Kingdom
  {
    id: 'ctry_uk',
    type: 'country',
    label: 'United Kingdom',
    queryFragment: '"United Kingdom"',
    parentId: 'reg_west_eu',
    flag: '🇬🇧',
  },
  {
    id: 'city_london',
    type: 'city',
    label: 'London',
    queryFragment: '"London"',
    parentId: 'ctry_uk',
    flag: '🇬🇧',
    isQuickPick: true,
  },
  {
    id: 'city_manchester',
    type: 'city',
    label: 'Manchester',
    queryFragment: '"Manchester"',
    parentId: 'ctry_uk',
    flag: '🇬🇧',
  },

  // Germany
  {
    id: 'ctry_de',
    type: 'country',
    label: 'Germany',
    queryFragment: '"Germany"',
    parentId: 'reg_west_eu',
    flag: '🇩🇪',
  },
  {
    id: 'city_berlin',
    type: 'city',
    label: 'Berlin',
    queryFragment: '"Berlin"',
    parentId: 'ctry_de',
    flag: '🇩🇪',
  },
  {
    id: 'city_munich',
    type: 'city',
    label: 'Munich',
    queryFragment: '"Munich"',
    parentId: 'ctry_de',
    flag: '🇩🇪',
  },
  {
    id: 'city_frankfurt',
    type: 'city',
    label: 'Frankfurt',
    queryFragment: '"Frankfurt"',
    parentId: 'ctry_de',
    flag: '🇩🇪',
  },

  // France
  {
    id: 'ctry_fr',
    type: 'country',
    label: 'France',
    queryFragment: '"France"',
    parentId: 'reg_west_eu',
    flag: '🇫🇷',
  },
  {
    id: 'city_paris',
    type: 'city',
    label: 'Paris',
    queryFragment: '"Paris"',
    parentId: 'ctry_fr',
    flag: '🇫🇷',
  },

  // Netherlands
  {
    id: 'ctry_nl',
    type: 'country',
    label: 'Netherlands',
    queryFragment: '"Netherlands"',
    parentId: 'reg_west_eu',
    flag: '🇳🇱',
  },
  {
    id: 'city_amsterdam',
    type: 'city',
    label: 'Amsterdam',
    queryFragment: '"Amsterdam"',
    parentId: 'ctry_nl',
    flag: '🇳🇱',
  },

  // Switzerland
  {
    id: 'ctry_ch',
    type: 'country',
    label: 'Switzerland',
    queryFragment: '"Switzerland"',
    parentId: 'reg_west_eu',
    flag: '🇨🇭',
  },
  {
    id: 'city_zurich',
    type: 'city',
    label: 'Zurich',
    queryFragment: '"Zurich"',
    parentId: 'ctry_ch',
    flag: '🇨🇭',
  },

  // Ireland
  {
    id: 'ctry_ie',
    type: 'country',
    label: 'Ireland',
    queryFragment: '"Ireland"',
    parentId: 'reg_west_eu',
    flag: '🇮🇪',
  },
  {
    id: 'city_dublin',
    type: 'city',
    label: 'Dublin',
    queryFragment: '"Dublin"',
    parentId: 'ctry_ie',
    flag: '🇮🇪',
  },

  // --- Northern Europe ---
  {
    id: 'reg_north_eu',
    type: 'region',
    label: 'Northern Europe',
    queryFragment: '("Northern Europe" OR "Scandinavia" OR "Nordics")',
  },

  // Sweden
  {
    id: 'ctry_se',
    type: 'country',
    label: 'Sweden',
    queryFragment: '"Sweden"',
    parentId: 'reg_north_eu',
    flag: '🇸🇪',
  },
  {
    id: 'city_stockholm',
    type: 'city',
    label: 'Stockholm',
    queryFragment: '"Stockholm"',
    parentId: 'ctry_se',
    flag: '🇸🇪',
  },

  // Denmark
  {
    id: 'ctry_dk',
    type: 'country',
    label: 'Denmark',
    queryFragment: '"Denmark"',
    parentId: 'reg_north_eu',
    flag: '🇩🇰',
  },
  {
    id: 'city_copenhagen',
    type: 'city',
    label: 'Copenhagen',
    queryFragment: '"Copenhagen"',
    parentId: 'ctry_dk',
    flag: '🇩🇰',
  },

  // Finland
  {
    id: 'ctry_fi',
    type: 'country',
    label: 'Finland',
    queryFragment: '"Finland"',
    parentId: 'reg_north_eu',
    flag: '🇫🇮',
  },

  // Norway
  {
    id: 'ctry_no',
    type: 'country',
    label: 'Norway',
    queryFragment: '"Norway"',
    parentId: 'reg_north_eu',
    flag: '🇳🇴',
  },

  // --- Southern Europe ---
  {
    id: 'reg_south_eu',
    type: 'region',
    label: 'Southern Europe',
    queryFragment: '("Southern Europe" OR "Mediterranean")',
  },

  // Spain
  {
    id: 'ctry_es',
    type: 'country',
    label: 'Spain',
    queryFragment: '"Spain"',
    parentId: 'reg_south_eu',
    flag: '🇪🇸',
  },
  {
    id: 'city_madrid',
    type: 'city',
    label: 'Madrid',
    queryFragment: '"Madrid"',
    parentId: 'ctry_es',
    flag: '🇪🇸',
  },
  {
    id: 'city_barcelona',
    type: 'city',
    label: 'Barcelona',
    queryFragment: '"Barcelona"',
    parentId: 'ctry_es',
    flag: '🇪🇸',
  },

  // Italy
  {
    id: 'ctry_it',
    type: 'country',
    label: 'Italy',
    queryFragment: '"Italy"',
    parentId: 'reg_south_eu',
    flag: '🇮🇹',
  },
  {
    id: 'city_milan',
    type: 'city',
    label: 'Milan',
    queryFragment: '"Milan"',
    parentId: 'ctry_it',
    flag: '🇮🇹',
  },

  // Portugal
  {
    id: 'ctry_pt',
    type: 'country',
    label: 'Portugal',
    queryFragment: '"Portugal"',
    parentId: 'reg_south_eu',
    flag: '🇵🇹',
  },
  {
    id: 'city_lisbon',
    type: 'city',
    label: 'Lisbon',
    queryFragment: '"Lisbon"',
    parentId: 'ctry_pt',
    flag: '🇵🇹',
  },

  // ============================================
  // AMERICAS
  // ============================================

  // --- North America ---
  {
    id: 'reg_north_am',
    type: 'region',
    label: 'North America',
    queryFragment: '("North America" OR "USA" OR "Canada")',
  },

  // United States
  {
    id: 'ctry_us',
    type: 'country',
    label: 'United States',
    queryFragment: '"United States"',
    parentId: 'reg_north_am',
    flag: '🇺🇸',
  },
  {
    id: 'city_nyc',
    type: 'city',
    label: 'New York',
    queryFragment: '"New York"',
    parentId: 'ctry_us',
    flag: '🇺🇸',
    isQuickPick: true,
  },
  {
    id: 'city_sf',
    type: 'city',
    label: 'San Francisco',
    queryFragment: '"San Francisco"',
    parentId: 'ctry_us',
    flag: '🇺🇸',
    isQuickPick: true,
  },
  {
    id: 'city_la',
    type: 'city',
    label: 'Los Angeles',
    queryFragment: '"Los Angeles"',
    parentId: 'ctry_us',
    flag: '🇺🇸',
  },
  {
    id: 'city_seattle',
    type: 'city',
    label: 'Seattle',
    queryFragment: '"Seattle"',
    parentId: 'ctry_us',
    flag: '🇺🇸',
  },
  {
    id: 'city_austin',
    type: 'city',
    label: 'Austin',
    queryFragment: '"Austin"',
    parentId: 'ctry_us',
    flag: '🇺🇸',
  },
  {
    id: 'city_boston',
    type: 'city',
    label: 'Boston',
    queryFragment: '"Boston"',
    parentId: 'ctry_us',
    flag: '🇺🇸',
  },
  {
    id: 'city_chicago',
    type: 'city',
    label: 'Chicago',
    queryFragment: '"Chicago"',
    parentId: 'ctry_us',
    flag: '🇺🇸',
  },
  {
    id: 'city_miami',
    type: 'city',
    label: 'Miami',
    queryFragment: '"Miami"',
    parentId: 'ctry_us',
    flag: '🇺🇸',
  },
  {
    id: 'city_denver',
    type: 'city',
    label: 'Denver',
    queryFragment: '"Denver"',
    parentId: 'ctry_us',
    flag: '🇺🇸',
  },

  // Canada
  {
    id: 'ctry_ca',
    type: 'country',
    label: 'Canada',
    queryFragment: '"Canada"',
    parentId: 'reg_north_am',
    flag: '🇨🇦',
  },
  {
    id: 'city_toronto',
    type: 'city',
    label: 'Toronto',
    queryFragment: '"Toronto"',
    parentId: 'ctry_ca',
    flag: '🇨🇦',
  },
  {
    id: 'city_vancouver',
    type: 'city',
    label: 'Vancouver',
    queryFragment: '"Vancouver"',
    parentId: 'ctry_ca',
    flag: '🇨🇦',
  },

  // --- Latin America ---
  {
    id: 'reg_latam',
    type: 'region',
    label: 'Latin America',
    queryFragment: '("Latin America" OR "LATAM")',
  },

  // Brazil
  {
    id: 'ctry_br',
    type: 'country',
    label: 'Brazil',
    queryFragment: '"Brazil"',
    parentId: 'reg_latam',
    flag: '🇧🇷',
  },
  {
    id: 'city_saopaulo',
    type: 'city',
    label: 'Sao Paulo',
    queryFragment: '"Sao Paulo"',
    parentId: 'ctry_br',
    flag: '🇧🇷',
  },

  // Mexico
  {
    id: 'ctry_mx',
    type: 'country',
    label: 'Mexico',
    queryFragment: '"Mexico"',
    parentId: 'reg_latam',
    flag: '🇲🇽',
  },
  {
    id: 'city_mexicocity',
    type: 'city',
    label: 'Mexico City',
    queryFragment: '"Mexico City"',
    parentId: 'ctry_mx',
    flag: '🇲🇽',
  },

  // Argentina
  {
    id: 'ctry_ar',
    type: 'country',
    label: 'Argentina',
    queryFragment: '"Argentina"',
    parentId: 'reg_latam',
    flag: '🇦🇷',
  },
  {
    id: 'city_buenosaires',
    type: 'city',
    label: 'Buenos Aires',
    queryFragment: '"Buenos Aires"',
    parentId: 'ctry_ar',
    flag: '🇦🇷',
  },

  // Colombia
  {
    id: 'ctry_co',
    type: 'country',
    label: 'Colombia',
    queryFragment: '"Colombia"',
    parentId: 'reg_latam',
    flag: '🇨🇴',
  },
  {
    id: 'city_bogota',
    type: 'city',
    label: 'Bogota',
    queryFragment: '"Bogota"',
    parentId: 'ctry_co',
    flag: '🇨🇴',
  },

  // Chile
  {
    id: 'ctry_cl',
    type: 'country',
    label: 'Chile',
    queryFragment: '"Chile"',
    parentId: 'reg_latam',
    flag: '🇨🇱',
  },
  {
    id: 'city_santiago',
    type: 'city',
    label: 'Santiago',
    queryFragment: '"Santiago"',
    parentId: 'ctry_cl',
    flag: '🇨🇱',
  },

  // ============================================
  // MIDDLE EAST & AFRICA (MENA)
  // ============================================

  // --- Middle East ---
  {
    id: 'reg_mena',
    type: 'region',
    label: 'Middle East',
    queryFragment: '("Middle East" OR "MENA")',
  },

  // UAE
  {
    id: 'ctry_ae',
    type: 'country',
    label: 'UAE',
    queryFragment: '"UAE" OR "United Arab Emirates"',
    parentId: 'reg_mena',
    flag: '🇦🇪',
  },
  {
    id: 'city_dubai',
    type: 'city',
    label: 'Dubai',
    queryFragment: '"Dubai"',
    parentId: 'ctry_ae',
    flag: '🇦🇪',
    isQuickPick: true,
  },
  {
    id: 'city_abudhabi',
    type: 'city',
    label: 'Abu Dhabi',
    queryFragment: '"Abu Dhabi"',
    parentId: 'ctry_ae',
    flag: '🇦🇪',
  },

  // Saudi Arabia
  {
    id: 'ctry_sa',
    type: 'country',
    label: 'Saudi Arabia',
    queryFragment: '"Saudi Arabia"',
    parentId: 'reg_mena',
    flag: '🇸🇦',
  },
  {
    id: 'city_riyadh',
    type: 'city',
    label: 'Riyadh',
    queryFragment: '"Riyadh"',
    parentId: 'ctry_sa',
    flag: '🇸🇦',
  },

  // Israel
  {
    id: 'ctry_il',
    type: 'country',
    label: 'Israel',
    queryFragment: '"Israel"',
    parentId: 'reg_mena',
    flag: '🇮🇱',
  },
  {
    id: 'city_telaviv',
    type: 'city',
    label: 'Tel Aviv',
    queryFragment: '"Tel Aviv"',
    parentId: 'ctry_il',
    flag: '🇮🇱',
  },

  // --- Africa ---
  {
    id: 'reg_africa',
    type: 'region',
    label: 'Africa',
    queryFragment: '"Africa"',
  },

  // South Africa
  {
    id: 'ctry_za',
    type: 'country',
    label: 'South Africa',
    queryFragment: '"South Africa"',
    parentId: 'reg_africa',
    flag: '🇿🇦',
  },
  {
    id: 'city_capetown',
    type: 'city',
    label: 'Cape Town',
    queryFragment: '"Cape Town"',
    parentId: 'ctry_za',
    flag: '🇿🇦',
  },
  {
    id: 'city_johannesburg',
    type: 'city',
    label: 'Johannesburg',
    queryFragment: '"Johannesburg"',
    parentId: 'ctry_za',
    flag: '🇿🇦',
  },

  // Nigeria
  {
    id: 'ctry_ng',
    type: 'country',
    label: 'Nigeria',
    queryFragment: '"Nigeria"',
    parentId: 'reg_africa',
    flag: '🇳🇬',
  },
  {
    id: 'city_lagos',
    type: 'city',
    label: 'Lagos',
    queryFragment: '"Lagos"',
    parentId: 'ctry_ng',
    flag: '🇳🇬',
  },

  // Kenya
  {
    id: 'ctry_ke',
    type: 'country',
    label: 'Kenya',
    queryFragment: '"Kenya"',
    parentId: 'reg_africa',
    flag: '🇰🇪',
  },
  {
    id: 'city_nairobi',
    type: 'city',
    label: 'Nairobi',
    queryFragment: '"Nairobi"',
    parentId: 'ctry_ke',
    flag: '🇰🇪',
  },

  // Egypt
  {
    id: 'ctry_eg',
    type: 'country',
    label: 'Egypt',
    queryFragment: '"Egypt"',
    parentId: 'reg_africa',
    flag: '🇪🇬',
  },
  {
    id: 'city_cairo',
    type: 'city',
    label: 'Cairo',
    queryFragment: '"Cairo"',
    parentId: 'ctry_eg',
    flag: '🇪🇬',
  },
];

/**
 * Get location presets by type
 */
export function getLocationsByType(type: LocationPreset['type']): LocationPreset[] {
  return LOCATION_PRESETS.filter((loc) => loc.type === type);
}

/**
 * Get location presets by parent
 */
export function getLocationsByParent(parentId: string): LocationPreset[] {
  return LOCATION_PRESETS.filter((loc) => loc.parentId === parentId);
}

/**
 * Get quick pick locations
 */
export function getQuickPickLocations(): LocationPreset[] {
  return LOCATION_PRESETS.filter((loc) => loc.isQuickPick);
}

/**
 * Get a location by ID
 */
export function getLocationById(id: string): LocationPreset | undefined {
  return LOCATION_PRESETS.find((loc) => loc.id === id);
}

/**
 * Build location query from selected location IDs
 */
export function buildLocationQuery(selectedIds: string[]): string {
  if (selectedIds.length === 0) return '';

  const locations = LOCATION_PRESETS.filter((l) => selectedIds.includes(l.id));
  const fragments = locations.map((l) => l.queryFragment);

  if (fragments.length === 1) return fragments[0];

  // Combine multiple locations with OR
  return `(${fragments.join(' OR ')})`;
}

/**
 * Group locations by type for display
 */
export function getGroupedLocations(): Record<LocationPreset['type'], LocationPreset[]> {
  return {
    region: getLocationsByType('region'),
    country: getLocationsByType('country'),
    city: getLocationsByType('city'),
  };
}
