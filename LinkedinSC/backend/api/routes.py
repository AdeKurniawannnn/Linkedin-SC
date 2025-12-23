"""
API routes for LinkedScraper
"""
from fastapi import APIRouter, HTTPException
from models import (
    SearchRequest, SearchResponse, ErrorResponse,
    ScrapeDetailRequest, ScrapeDetailResponse,
    PostsSearchRequest, PostsSearchResponse,
    JobsSearchRequest, JobsSearchResponse,
    AllSearchRequest, AllSearchResponse
)
from services.scraper import search_linkedin_profiles, scrape_company_details, search_linkedin_posts, search_linkedin_jobs, search_linkedin_all

router = APIRouter()


@router.post("/search", response_model=SearchResponse)
async def search_linkedin(request: SearchRequest):
    """
    Search LinkedIn profiles by role and country

    Example request:
    ```json
    {
        "role": "software engineer",
        "country": "us",
        "language": "en",
        "max_pages": 5
    }
    ```
    """
    try:
        result = await search_linkedin_profiles(
            role=request.role,
            location=request.location,
            country=request.country,
            language=request.language,
            max_pages=request.max_pages,
            site_filter=request.site_filter
        )
        return result

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail={
                "success": False,
                "error": "Scraping failed",
                "detail": str(e)
            }
        )


@router.post("/scrape-detail", response_model=ScrapeDetailResponse)
async def scrape_company_detail(request: ScrapeDetailRequest):
    """
    Scrape detailed information dari LinkedIn company pages

    Menggunakan Crawl4AI untuk scraping full page content

    Example request:
    ```json
    {
        "urls": [
            "https://www.linkedin.com/company/google",
            "https://www.linkedin.com/company/microsoft"
        ]
    }
    ```
    """
    try:
        result = await scrape_company_details(urls=request.urls)
        return result

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail={
                "success": False,
                "error": "Scraping failed",
                "detail": str(e)
            }
        )


@router.post("/search-posts", response_model=PostsSearchResponse)
async def search_posts(request: PostsSearchRequest):
    """
    Search LinkedIn posts by keywords

    Mencari postingan LinkedIn berdasarkan keywords/topic

    Example request:
    ```json
    {
        "keywords": "artificial intelligence",
        "author_type": "all",
        "max_results": 20,
        "location": "Jakarta",
        "language": "id",
        "country": "id"
    }
    ```
    """
    try:
        result = await search_linkedin_posts(
            keywords=request.keywords,
            author_type=request.author_type,
            max_results=request.max_results,
            location=request.location,
            country=request.country,
            language=request.language
        )
        return result

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail={
                "success": False,
                "error": "Posts search failed",
                "detail": str(e)
            }
        )


@router.post("/search-jobs", response_model=JobsSearchResponse)
async def search_jobs(request: JobsSearchRequest):
    """
    Search LinkedIn jobs by job title and location

    Mencari lowongan pekerjaan LinkedIn berdasarkan posisi dan lokasi

    Example request:
    ```json
    {
        "job_title": "Software Engineer",
        "location": "Jakarta",
        "experience_level": "mid-senior",
        "max_results": 20,
        "language": "id",
        "country": "id"
    }
    ```
    """
    try:
        result = await search_linkedin_jobs(
            job_title=request.job_title,
            location=request.location,
            experience_level=request.experience_level,
            max_results=request.max_results,
            country=request.country,
            language=request.language
        )
        return result

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail={
                "success": False,
                "error": "Jobs search failed",
                "detail": str(e)
            }
        )


@router.post("/search-all", response_model=AllSearchResponse)
async def search_all(request: AllSearchRequest):
    """
    Search all LinkedIn content types (profiles, companies, posts, jobs)

    Mencari semua jenis konten LinkedIn tanpa filter spesifik

    Example request:
    ```json
    {
        "keywords": "Software Engineer Jakarta",
        "location": "Indonesia",
        "max_results": 20,
        "language": "id",
        "country": "id"
    }
    ```
    """
    try:
        result = await search_linkedin_all(
            keywords=request.keywords,
            location=request.location,
            max_results=request.max_results,
            country=request.country,
            language=request.language
        )
        return result

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail={
                "success": False,
                "error": "All content search failed",
                "detail": str(e)
            }
        )


@router.get("/test")
def test_endpoint():
    """Test endpoint untuk verify API works"""
    return {
        "message": "LinkedScraper API is working!",
        "endpoints": {
            "search": "POST /api/search",
            "scrape-detail": "POST /api/scrape-detail",
            "search-posts": "POST /api/search-posts",
            "search-jobs": "POST /api/search-jobs",
            "search-all": "POST /api/search-all",
            "test": "GET /api/test"
        }
    }
