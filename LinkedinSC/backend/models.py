"""
Pydantic models for request/response validation
"""
from typing import List, Optional
from pydantic import BaseModel, Field


class SearchRequest(BaseModel):
    """Request model for LinkedIn search"""
    role: str = Field(..., description="Job role atau position (e.g., 'software engineer', 'data scientist')")
    location: str = Field(default="", description="Location/city (e.g., 'Jakarta', 'Singapore', 'New York')")
    country: str = Field(default="us", description="Country code (e.g., 'us', 'uk', 'id')")
    language: str = Field(default="en", description="Language code (e.g., 'en', 'id')")
    max_pages: int = Field(default=5, ge=1, le=25, description="Maximum pages to scrape (1-25)")
    site_filter: str = Field(default="profile", description="LinkedIn content type filter (profile, posts, jobs, company, all)")

    class Config:
        json_schema_extra = {
            "example": {
                "role": "IT Programmer",
                "location": "Jakarta",
                "country": "id",
                "language": "id",
                "max_pages": 2
            }
        }


class LinkedInProfile(BaseModel):
    """Single LinkedIn profile result with parsed data"""
    name: str
    headline: Optional[str] = None
    description: Optional[str] = None  # SERP snippet/description (raw text)
    location: Optional[str] = None
    company: Optional[str] = None
    education: Optional[str] = None
    connections: Optional[int] = None
    profile_url: str
    rank: int
    best_position: int
    frequency: int
    pages_seen: List[int]

    # Company-specific fields (parsed from description)
    industry: Optional[str] = None
    followers: Optional[int] = None
    company_size: Optional[str] = None
    founded_year: Optional[int] = None
    company_type: Optional[str] = None
    headquarters: Optional[str] = None


class SearchResponse(BaseModel):
    """Response model for LinkedIn search"""
    success: bool
    query: str
    total_results: int
    profiles: List[LinkedInProfile]
    metadata: dict

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "query": "IT Programmer linkedin.com/in/ Jakarta",
                "total_results": 20,
                "profiles": [
                    {
                        "name": "Galih Irawan",
                        "headline": "IT Support as Freelance",
                        "location": "Jawa Barat",
                        "company": "Companies",
                        "education": "Universitas Gunadarma",
                        "connections": 70,
                        "profile_url": "https://id.linkedin.com/in/galihirawan",
                        "rank": 1,
                        "best_position": 1,
                        "frequency": 1,
                        "pages_seen": [1]
                    }
                ],
                "metadata": {
                    "country": "id",
                    "language": "id",
                    "pages_requested": 2,
                    "pages_scraped": 2,
                    "time_taken_seconds": 3.38
                }
            }
        }


class ErrorResponse(BaseModel):
    """Error response model"""
    success: bool = False
    error: str
    detail: Optional[str] = None


class ScrapeDetailRequest(BaseModel):
    """Request model for detailed company scraping"""
    urls: List[str] = Field(..., description="List of LinkedIn company URLs to scrape")

    class Config:
        json_schema_extra = {
            "example": {
                "urls": [
                    "https://www.linkedin.com/company/google",
                    "https://www.linkedin.com/company/microsoft"
                ]
            }
        }


class RelatedCompany(BaseModel):
    """Related/similar company"""
    name: str
    industry: Optional[str] = None
    followers: Optional[str] = None


class EmployeeInfo(BaseModel):
    """Employee working at company"""
    name: str
    position: Optional[str] = None
    connection_degree: Optional[str] = None


class CompanyDetail(BaseModel):
    """Detailed company information from LinkedIn page scraping"""
    url: str
    name: str
    tagline: Optional[str] = None
    industry: Optional[str] = None
    location: Optional[str] = None
    followers: Optional[str] = None
    employee_count_range: Optional[str] = None
    full_description: Optional[str] = None
    specialties: Optional[List[str]] = None
    about: Optional[str] = None
    website: Optional[str] = None
    phone: Optional[str] = None
    founded: Optional[int] = None
    # Employee insights
    employee_growth: Optional[str] = None
    top_employee_schools: Optional[List[str]] = None
    recent_hires: Optional[List[EmployeeInfo]] = None
    # Related companies
    related_companies: Optional[List[RelatedCompany]] = None
    alumni_working_here: Optional[List[EmployeeInfo]] = None
    scraped_at: str


class ScrapeDetailResponse(BaseModel):
    """Response model for detailed scraping"""
    success: bool
    total_scraped: int
    companies: List[CompanyDetail]
    metadata: dict


class PostsSearchRequest(BaseModel):
    """Request model for LinkedIn posts search"""
    keywords: str = Field(..., description="Keywords to search for in posts")
    author_type: str = Field(default="all", description="Filter by author type: all, companies, people")
    max_results: int = Field(default=20, ge=1, le=100, description="Maximum number of posts to return (1-100)")
    location: str = Field(default="", description="Filter by location (optional)")
    language: str = Field(default="id", description="Language code (e.g., 'en', 'id')")
    country: str = Field(default="id", description="Country code (e.g., 'us', 'id')")

    class Config:
        json_schema_extra = {
            "example": {
                "keywords": "artificial intelligence",
                "author_type": "all",
                "max_results": 20,
                "location": "Jakarta",
                "language": "id",
                "country": "id"
            }
        }


class LinkedInPost(BaseModel):
    """Single LinkedIn post result"""
    post_url: str
    author_name: str
    author_profile_url: str
    posted_date: str
    content: str
    hashtags: List[str] = []
    likes: int = 0
    comments: int = 0
    shares: int = 0
    post_type: str = "text"
    rank: int


class PostsSearchResponse(BaseModel):
    """Response model for LinkedIn posts search"""
    success: bool
    query: str
    total_results: int
    posts: List[LinkedInPost]
    metadata: dict

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "query": "artificial intelligence",
                "total_results": 10,
                "posts": [
                    {
                        "post_url": "https://linkedin.com/posts/...",
                        "author_name": "John Doe",
                        "author_profile_url": "https://linkedin.com/in/johndoe",
                        "posted_date": "2025-12-21",
                        "content": "AI is transforming...",
                        "hashtags": ["#AI", "#Technology"],
                        "likes": 1234,
                        "comments": 56,
                        "shares": 89,
                        "post_type": "text",
                        "rank": 1
                    }
                ],
                "metadata": {
                    "keywords": "artificial intelligence",
                    "author_type": "all",
                    "country": "id",
                    "language": "id",
                    "pages_fetched": 2,
                    "time_taken_seconds": 3.45
                }
            }
        }


class JobsSearchRequest(BaseModel):
    """Request model for LinkedIn jobs search"""
    job_title: str = Field(..., description="Job title or position to search for")
    location: str = Field(default="", description="Filter by location (optional)")
    experience_level: str = Field(default="all", description="Experience level: all, internship, entry, associate, mid-senior, director, executive")
    max_results: int = Field(default=20, ge=1, le=100, description="Maximum number of jobs to return (1-100)")
    language: str = Field(default="id", description="Language code (e.g., 'en', 'id')")
    country: str = Field(default="id", description="Country code (e.g., 'us', 'id')")

    class Config:
        json_schema_extra = {
            "example": {
                "job_title": "Software Engineer",
                "location": "Jakarta",
                "experience_level": "mid-senior",
                "max_results": 20,
                "language": "id",
                "country": "id"
            }
        }


class LinkedInJob(BaseModel):
    """Single LinkedIn job result"""
    job_url: str
    job_title: str
    company_name: str
    location: str
    description: str
    rank: int


class JobsSearchResponse(BaseModel):
    """Response model for LinkedIn jobs search"""
    success: bool
    query: str
    total_results: int
    jobs: List[LinkedInJob]
    metadata: dict

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "query": "Software Engineer jobs Jakarta",
                "total_results": 10,
                "jobs": [
                    {
                        "job_url": "https://linkedin.com/jobs/view/...",
                        "job_title": "Senior Software Engineer",
                        "company_name": "Tech Company",
                        "location": "Jakarta, Indonesia",
                        "description": "We are looking for experienced software engineers...",
                        "rank": 1
                    }
                ],
                "metadata": {
                    "job_title": "Software Engineer",
                    "experience_level": "mid-senior",
                    "country": "id",
                    "language": "id",
                    "pages_fetched": 2,
                    "time_taken_seconds": 3.45
                }
            }
        }


class AllSearchRequest(BaseModel):
    """Request model for searching all LinkedIn content types"""
    keywords: str = Field(..., description="Keywords to search across all LinkedIn content")
    location: str = Field(default="", description="Filter by location (optional)")
    max_results: int = Field(default=20, ge=1, le=100, description="Maximum number of results to return (1-100)")
    language: str = Field(default="id", description="Language code (e.g., 'en', 'id')")
    country: str = Field(default="id", description="Country code (e.g., 'us', 'id')")

    class Config:
        json_schema_extra = {
            "example": {
                "keywords": "Software Engineer Jakarta",
                "location": "Indonesia",
                "max_results": 20,
                "language": "id",
                "country": "id"
            }
        }


class LinkedInAllResult(BaseModel):
    """Single result from all content types search"""
    url: str
    title: str
    description: str
    type: str  # profile, company, post, job, other
    rank: int


class AllSearchResponse(BaseModel):
    """Response model for all content search"""
    success: bool
    query: str
    total_results: int
    results: List[LinkedInAllResult]
    metadata: dict

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "query": "Software Engineer Jakarta site:linkedin.com",
                "total_results": 20,
                "results": [
                    {
                        "url": "https://linkedin.com/in/johndoe",
                        "title": "John Doe - Software Engineer",
                        "description": "Senior Software Engineer at Tech Company...",
                        "type": "profile",
                        "rank": 1
                    }
                ],
                "metadata": {
                    "keywords": "Software Engineer Jakarta",
                    "country": "id",
                    "language": "id",
                    "pages_fetched": 2,
                    "time_taken_seconds": 3.45
                }
            }
        }


class RawQueryRequest(BaseModel):
    """Request model for raw query search"""
    query: str = Field(..., description="Pre-composed query string (e.g., 'software engineer site:linkedin.com/in/')")
    country: str = Field(default="id", description="Country code (e.g., 'us', 'id')")
    language: str = Field(default="id", description="Language code (e.g., 'en', 'id')")
    max_results: int = Field(default=50, ge=1, le=100, description="Maximum number of results to return (1-100)")

    class Config:
        json_schema_extra = {
            "example": {
                "query": "software engineer site:linkedin.com/in/",
                "country": "id",
                "language": "id",
                "max_results": 50
            }
        }


class UnifiedSearchResult(BaseModel):
    """Single unified result with LinkedIn content type detection"""
    url: str
    title: str
    description: str
    type: str  # profile, company, post, job, other
    rank: int
    # Optional fields for enhanced metadata
    author_name: Optional[str] = None
    company_name: Optional[str] = None
    followers: Optional[int] = None
    location: Optional[str] = None


class UnifiedSearchResponse(BaseModel):
    """Response model for unified raw query search"""
    success: bool
    query: str
    total_results: int
    results: List[UnifiedSearchResult]
    metadata: dict

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "query": "software engineer site:linkedin.com/in/",
                "total_results": 50,
                "results": [
                    {
                        "url": "https://linkedin.com/in/johndoe",
                        "title": "John Doe - Software Engineer",
                        "description": "Senior Software Engineer at Tech Company...",
                        "type": "profile",
                        "rank": 1,
                        "author_name": "John Doe",
                        "company_name": None,
                        "followers": None,
                        "location": "Jakarta"
                    }
                ],
                "metadata": {
                    "country": "id",
                    "language": "id",
                    "max_results": 50,
                    "pages_fetched": 5,
                    "time_taken_seconds": 3.45
                }
            }
        }
