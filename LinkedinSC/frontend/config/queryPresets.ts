/**
 * Query Presets Configuration
 *
 * Pre-defined search query patterns for common LinkedIn searches.
 * Presets are organized by category and can be toggled to build complex queries.
 */

export interface QueryPreset {
  id: string;
  category: 'content_type' | 'seniority' | 'function' | 'industry' | 'location' | 'exclusions';
  label: string;
  description: string;
  queryFragment: string; // The actual query text to add
}

export const PRESET_CATEGORIES = {
  content_type: {
    label: 'Content Type',
    description: 'LinkedIn content types to search',
  },
  seniority: {
    label: 'Seniority Level',
    description: 'Job seniority levels',
  },
  function: {
    label: 'Function/Role',
    description: 'Common job functions',
  },
  industry: {
    label: 'Industry',
    description: 'Target industries',
  },
  location: {
    label: 'Location',
    description: 'Geographic locations',
  },
  exclusions: {
    label: 'Exclusions',
    description: 'Common exclusion patterns',
  },
} as const;

export type PresetCategory = keyof typeof PRESET_CATEGORIES;

export const QUERY_PRESETS: QueryPreset[] = [
  // Content Type
  {
    id: 'type_profile',
    category: 'content_type',
    label: 'Profiles',
    description: 'LinkedIn user profiles',
    queryFragment: 'site:linkedin.com/in/',
  },
  {
    id: 'type_company',
    category: 'content_type',
    label: 'Companies',
    description: 'LinkedIn company pages',
    queryFragment: 'site:linkedin.com/company/',
  },
  {
    id: 'type_posts',
    category: 'content_type',
    label: 'Posts',
    description: 'LinkedIn posts and articles',
    queryFragment: 'site:linkedin.com/posts/',
  },
  {
    id: 'type_jobs',
    category: 'content_type',
    label: 'Jobs',
    description: 'LinkedIn job listings',
    queryFragment: 'site:linkedin.com/jobs/',
  },

  // Seniority Level
  {
    id: 'seniority_cxo',
    category: 'seniority',
    label: 'C-Level',
    description: 'CEO, CTO, CFO, etc.',
    queryFragment: '("CEO" OR "CTO" OR "CFO" OR "COO" OR "CMO" OR "Chief")',
  },
  {
    id: 'seniority_vp',
    category: 'seniority',
    label: 'VP/Director',
    description: 'Vice Presidents and Directors',
    queryFragment: '("VP" OR "Vice President" OR "Director")',
  },
  {
    id: 'seniority_manager',
    category: 'seniority',
    label: 'Manager',
    description: 'Managers and Team Leads',
    queryFragment: '("Manager" OR "Team Lead" OR "Head of")',
  },
  {
    id: 'seniority_senior',
    category: 'seniority',
    label: 'Senior',
    description: 'Senior level positions',
    queryFragment: '("Senior" OR "Sr." OR "Lead")',
  },

  // Function/Role
  {
    id: 'function_engineering',
    category: 'function',
    label: 'Engineering',
    description: 'Software and engineering roles',
    queryFragment: '("Engineer" OR "Developer" OR "Programmer")',
  },
  {
    id: 'function_product',
    category: 'function',
    label: 'Product',
    description: 'Product management roles',
    queryFragment: '("Product Manager" OR "Product Owner" OR "PM")',
  },
  {
    id: 'function_sales',
    category: 'function',
    label: 'Sales',
    description: 'Sales and BD roles',
    queryFragment: '("Sales" OR "Business Development" OR "Account Executive")',
  },
  {
    id: 'function_marketing',
    category: 'function',
    label: 'Marketing',
    description: 'Marketing roles',
    queryFragment: '("Marketing" OR "Growth" OR "Brand")',
  },
  {
    id: 'function_hr',
    category: 'function',
    label: 'HR/People',
    description: 'Human resources roles',
    queryFragment: '("HR" OR "Human Resources" OR "People" OR "Talent")',
  },
  {
    id: 'function_finance',
    category: 'function',
    label: 'Finance',
    description: 'Finance and accounting roles',
    queryFragment: '("Finance" OR "Accounting" OR "Controller" OR "FP&A")',
  },

  // Industry
  {
    id: 'industry_tech',
    category: 'industry',
    label: 'Technology',
    description: 'Tech and software companies',
    queryFragment: '("technology" OR "software" OR "tech" OR "SaaS")',
  },
  {
    id: 'industry_fintech',
    category: 'industry',
    label: 'Fintech',
    description: 'Financial technology',
    queryFragment: '("fintech" OR "financial technology" OR "payments")',
  },
  {
    id: 'industry_ecommerce',
    category: 'industry',
    label: 'E-commerce',
    description: 'E-commerce and retail tech',
    queryFragment: '("e-commerce" OR "ecommerce" OR "retail" OR "marketplace")',
  },
  {
    id: 'industry_healthcare',
    category: 'industry',
    label: 'Healthcare',
    description: 'Healthcare and healthtech',
    queryFragment: '("healthcare" OR "health tech" OR "medical" OR "biotech")',
  },

  // Location
  {
    id: 'loc_indonesia',
    category: 'location',
    label: 'Indonesia',
    description: 'Indonesia-based',
    queryFragment: '"Indonesia"',
  },
  {
    id: 'loc_jakarta',
    category: 'location',
    label: 'Jakarta',
    description: 'Jakarta area',
    queryFragment: '"Jakarta"',
  },
  {
    id: 'loc_singapore',
    category: 'location',
    label: 'Singapore',
    description: 'Singapore-based',
    queryFragment: '"Singapore"',
  },
  {
    id: 'loc_sea',
    category: 'location',
    label: 'Southeast Asia',
    description: 'SEA region',
    queryFragment: '("Southeast Asia" OR "SEA" OR "APAC")',
  },

  // Exclusions
  {
    id: 'exclude_recruiter',
    category: 'exclusions',
    label: 'No Recruiters',
    description: 'Exclude recruiters',
    queryFragment: '-recruiter -recruiting -headhunter',
  },
  {
    id: 'exclude_agency',
    category: 'exclusions',
    label: 'No Agencies',
    description: 'Exclude agencies',
    queryFragment: '-agency -outsourcing -consulting',
  },
  {
    id: 'exclude_intern',
    category: 'exclusions',
    label: 'No Interns',
    description: 'Exclude interns and entry level',
    queryFragment: '-intern -internship -entry-level -trainee',
  },
];

/**
 * Get presets by category
 */
export function getPresetsByCategory(category: PresetCategory): QueryPreset[] {
  return QUERY_PRESETS.filter((preset) => preset.category === category);
}

/**
 * Get all preset categories with their presets
 */
export function getGroupedPresets(): Record<PresetCategory, QueryPreset[]> {
  return {
    content_type: getPresetsByCategory('content_type'),
    seniority: getPresetsByCategory('seniority'),
    function: getPresetsByCategory('function'),
    industry: getPresetsByCategory('industry'),
    location: getPresetsByCategory('location'),
    exclusions: getPresetsByCategory('exclusions'),
  };
}

/**
 * Build query from selected preset IDs
 */
export function buildQueryFromPresets(presetIds: string[]): string {
  const selectedPresets = QUERY_PRESETS.filter((preset) =>
    presetIds.includes(preset.id)
  );

  return selectedPresets.map((preset) => preset.queryFragment).join(' ');
}

/**
 * Get a preset by its ID
 */
export function getPresetById(id: string): QueryPreset | undefined {
  return QUERY_PRESETS.find((preset) => preset.id === id);
}

// Alias export for store compatibility
export { QUERY_PRESETS as queryPresets };
