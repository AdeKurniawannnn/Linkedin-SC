/**
 * DEPRECATED API functions - Archived from lib/api.ts
 * These functions were replaced by the unified searchRaw API
 * Archived on: 2024-12-28
 */
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 180000,
});

// Types matching backend SERP Aggregator
export interface SearchRequest {
  role: string;
  location: string;
  country: string;
  language: string;
  max_pages: number;
}

export interface LinkedInProfile {
  profile_url: string;
  title: string;
  description: string | null;
  rank: number;
  best_position: number;
  avg_position: number;
  frequency: number;
  pages_seen: number[];
  industry: string | null;
  followers: number | null;
  company_size: string | null;
  founded_year: number | null;
  company_type: string | null;
  headquarters: string | null;
  location: string | null;
}

export interface SearchResponse {
  query: string;
  total_results: number;
  profiles: LinkedInProfile[];
  metadata: {
    country: string;
    language: string;
    pages_fetched: number;
    search_engine: string;
    has_errors: boolean;
  };
}

interface BackendProfile {
  name: string;
  headline: string | null;
  description: string | null;
  location: string | null;
  company: string | null;
  education: string | null;
  connections: number | null;
  profile_url: string;
  rank: number;
  best_position: number;
  frequency: number;
  pages_seen: number[];
  industry: string | null;
  followers: number | null;
  company_size: string | null;
  founded_year: number | null;
  company_type: string | null;
  headquarters: string | null;
}

interface BackendSearchResponse {
  success: boolean;
  query: string;
  total_results: number;
  profiles: BackendProfile[];
  metadata: {
    country: string;
    language: string;
    pages_requested: number;
    pages_scraped: number;
    time_taken_seconds: number;
  };
}

/**
 * @deprecated Use searchRaw() instead
 */
export const searchLinkedIn = async (params: SearchRequest): Promise<SearchResponse> => {
  const backendRequest = {
    role: params.role,
    location: params.location,
    country: params.country,
    language: params.language,
    max_pages: params.max_pages,
  };

  const response = await apiClient.post<BackendSearchResponse>('/search', backendRequest);
  const backendResult = response.data;

  const profiles: LinkedInProfile[] = backendResult.profiles.map(profile => ({
    profile_url: profile.profile_url,
    title: `${profile.name}${profile.headline ? ' - ' + profile.headline : ''}`,
    description: profile.description || null,
    rank: profile.rank,
    best_position: profile.best_position,
    avg_position: profile.best_position,
    frequency: profile.frequency,
    pages_seen: profile.pages_seen,
    industry: profile.industry || null,
    followers: profile.followers || null,
    company_size: profile.company_size || null,
    founded_year: profile.founded_year || null,
    company_type: profile.company_type || null,
    headquarters: profile.headquarters || null,
    location: profile.location || null,
  }));

  return {
    query: backendResult.query,
    total_results: backendResult.total_results,
    profiles,
    metadata: {
      country: backendResult.metadata.country,
      language: backendResult.metadata.language,
      pages_fetched: backendResult.metadata.pages_scraped,
      search_engine: 'google',
      has_errors: !backendResult.success,
    },
  };
};

// Scrape Detail Types
export interface ScrapeDetailRequest {
  urls: string[];
}

export interface CompanyDetail {
  url: string;
  name: string;
  tagline: string | null;
  industry: string | null;
  location: string | null;
  followers: string | null;
  employee_count_range: string | null;
  full_description: string | null;
  specialties: string[] | null;
  about: string | null;
  website: string | null;
  phone: string | null;
  founded: number | null;
  employee_growth: string | null;
  top_employee_schools: string[] | null;
  recent_hires: Array<{ name: string; position?: string }> | null;
  related_companies: Array<{ name: string; industry?: string; followers?: string }> | null;
  alumni_working_here: Array<{ name: string; position?: string }> | null;
  scraped_at: string;
}

export interface ScrapeDetailResponse {
  success: boolean;
  total_scraped: number;
  companies: CompanyDetail[];
  metadata: {
    total_urls: number;
    successful: number;
    failed: number;
    time_taken_seconds: number;
  };
}

/**
 * @deprecated Company scraping functionality removed
 */
export const scrapeCompanyDetails = async (urls: string[]): Promise<ScrapeDetailResponse> => {
  const response = await apiClient.post<ScrapeDetailResponse>('/scrape-detail', {
    urls
  });
  return response.data;
};

// Posts Search Types
export interface PostsSearchRequest {
  keywords: string;
  author_type: 'all' | 'companies' | 'people';
  max_results: number;
  location: string;
  language: string;
  country: string;
}

export interface PostsSearchResponse {
  success: boolean;
  query: string;
  total_results: number;
  posts: Array<{
    post_url: string;
    author_name: string;
    author_profile_url: string;
    posted_date: string;
    content: string;
    hashtags: string[];
    likes: number;
    comments: number;
    shares: number;
    post_type: string;
    rank: number;
  }>;
  metadata: {
    keywords: string;
    author_type: string;
    country: string;
    language: string;
    pages_fetched: number;
    time_taken_seconds: number;
  };
}

/**
 * @deprecated Use searchRaw() with site:linkedin.com/posts instead
 */
export const searchLinkedInPosts = async (params: PostsSearchRequest): Promise<PostsSearchResponse> => {
  const response = await apiClient.post<PostsSearchResponse>('/search-posts', params);
  return response.data;
};

// Jobs Search Types
export interface JobsSearchRequest {
  job_title: string;
  location: string;
  experience_level: string;
  max_results: number;
  language: string;
  country: string;
}

export interface JobsSearchResponse {
  success: boolean;
  query: string;
  total_results: number;
  jobs: Array<{
    job_url: string;
    job_title: string;
    company_name: string;
    location: string;
    description: string;
    rank: number;
  }>;
  metadata: {
    job_title: string;
    experience_level: string;
    country: string;
    language: string;
    pages_fetched: number;
    time_taken_seconds: number;
  };
}

/**
 * @deprecated Use searchRaw() with site:linkedin.com/jobs instead
 */
export const searchLinkedInJobs = async (params: JobsSearchRequest): Promise<JobsSearchResponse> => {
  const response = await apiClient.post<JobsSearchResponse>('/search-jobs', params);
  return response.data;
};

// All Search Types (Mixed Content)
export interface AllSearchRequest {
  keywords: string;
  location: string;
  max_results: number;
  language: string;
  country: string;
}

export interface AllSearchResponse {
  success: boolean;
  query: string;
  total_results: number;
  results: Array<{
    url: string;
    title: string;
    description: string;
    type: "profile" | "company" | "post" | "job" | "other";
    rank: number;
  }>;
  metadata: {
    keywords: string;
    country: string;
    language: string;
    pages_fetched: number;
    time_taken_seconds: number;
  };
}

/**
 * @deprecated Use searchRaw() instead
 */
export const searchLinkedInAll = async (params: AllSearchRequest): Promise<AllSearchResponse> => {
  const response = await apiClient.post<AllSearchResponse>('/search-all', params);
  return response.data;
};
