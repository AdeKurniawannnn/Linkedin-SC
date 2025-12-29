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
  isQuickPick?: boolean; // Mark as quick pick for prominent display
}

export const PRESET_CATEGORIES = {
  content_type: {
    label: 'Content Type',
    description: 'LinkedIn content types to search',
    selectionType: 'single' as const,
  },
  seniority: {
    label: 'Seniority Level',
    description: 'Job seniority levels',
    selectionType: 'multiple' as const,
  },
  function: {
    label: 'Function/Role',
    description: 'Common job functions',
    selectionType: 'multiple' as const,
  },
  industry: {
    label: 'Industry',
    description: 'Target industries',
    selectionType: 'multiple' as const,
  },
  location: {
    label: 'Location',
    description: 'Geographic locations',
    selectionType: 'multiple' as const,
  },
  exclusions: {
    label: 'Exclusions',
    description: 'Common exclusion patterns',
    selectionType: 'multiple' as const,
  },
} as const;

export type PresetCategory = keyof typeof PRESET_CATEGORIES;

export const QUERY_PRESETS: QueryPreset[] = [
  // Content Type
  {
    id: 'type_all',
    category: 'content_type',
    label: 'All LinkedIn',
    description: 'All LinkedIn content',
    queryFragment: 'site:linkedin.com',
  },
  {
    id: 'type_profile',
    category: 'content_type',
    label: 'Profiles',
    description: 'LinkedIn user profiles',
    queryFragment: 'site:linkedin.com/in/',
    isQuickPick: true,
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
    isQuickPick: true,
  },
  {
    id: 'seniority_vp',
    category: 'seniority',
    label: 'VP/Director',
    description: 'Vice Presidents and Directors',
    queryFragment: '("VP" OR "Vice President" OR "Director")',
    isQuickPick: true,
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
  {
    id: 'seniority_founder',
    category: 'seniority',
    label: 'Founder/Owner',
    description: 'Founders, co-founders, and business owners',
    queryFragment: '("Founder" OR "Co-founder" OR "Owner" OR "Partner")',
  },
  {
    id: 'seniority_board',
    category: 'seniority',
    label: 'Board/Advisor',
    description: 'Board members and advisors',
    queryFragment: '("Board" OR "Advisor" OR "Advisory")',
  },

  // Function/Role
  {
    id: 'function_engineering',
    category: 'function',
    label: 'Engineering',
    description: 'Software and engineering roles',
    queryFragment: '("Engineer" OR "Developer" OR "Programmer")',
    isQuickPick: true,
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
    isQuickPick: true,
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
  {
    id: 'function_design',
    category: 'function',
    label: 'Design',
    description: 'Design, UX/UI, and creative roles',
    queryFragment: '("Design" OR "UX" OR "UI" OR "Creative")',
  },
  {
    id: 'function_data',
    category: 'function',
    label: 'Data/Analytics',
    description: 'Data science and analytics roles',
    queryFragment: '("Data" OR "Analytics" OR "BI" OR "Data Science")',
  },
  {
    id: 'function_ops',
    category: 'function',
    label: 'Operations',
    description: 'Operations and ops roles',
    queryFragment: '("Operations" OR "Ops")',
  },
  {
    id: 'function_cs',
    category: 'function',
    label: 'Customer Success',
    description: 'Customer success and client success roles',
    queryFragment: '("Customer Success" OR "CS" OR "Client Success")',
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
  {
    id: 'industry_logistics',
    category: 'industry',
    label: 'Logistics',
    description: 'Logistics and supply chain',
    queryFragment: '("logistics" OR "supply chain")',
  },
  {
    id: 'industry_education',
    category: 'industry',
    label: 'Education',
    description: 'Education and edtech',
    queryFragment: '("education" OR "edtech")',
  },
  {
    id: 'industry_media',
    category: 'industry',
    label: 'Media',
    description: 'Media and entertainment',
    queryFragment: '("media" OR "entertainment")',
  },
  {
    id: 'industry_realestate',
    category: 'industry',
    label: 'Real Estate',
    description: 'Real estate and property',
    queryFragment: '("real estate" OR "property")',
  },

  // Location
  {
    id: 'loc_indonesia',
    category: 'location',
    label: 'Indonesia',
    description: 'Indonesia-based',
    queryFragment: '"Indonesia"',
    isQuickPick: true,
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
  {
    id: 'exclude_student',
    category: 'exclusions',
    label: 'No Students',
    description: 'Exclude students and fresh graduates',
    queryFragment: '-student -university -"fresh graduate"',
  },
  {
    id: 'exclude_freelancer',
    category: 'exclusions',
    label: 'No Freelancers',
    description: 'Exclude freelancers and contractors',
    queryFragment: '-freelance -freelancer -contractor',
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

/**
 * Get quick pick presets for prominent display
 */
export function getQuickPickPresets(): QueryPreset[] {
  return QUERY_PRESETS.filter((preset) => preset.isQuickPick);
}

// Alias export for store compatibility
export { QUERY_PRESETS as queryPresets };
