"""
API Integration Tests for LinkedScraper FastAPI endpoints.

Tests all main API endpoints with httpx AsyncClient against the FastAPI app.
Uses real backend calls with limited pages for cost control.

Run with: pytest tests/integration/test_api_integration.py -v -s --asyncio-mode=auto
"""
import pytest
from httpx import AsyncClient, ASGITransport

# Import FastAPI app
import sys
from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).parent.parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from main import app


# Shared fixture for async client
@pytest.fixture
async def client():
    """Create async test client for FastAPI app"""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


# =============================================================================
# TestSearchEndpoint - POST /api/search
# =============================================================================
@pytest.mark.integration
@pytest.mark.asyncio
class TestSearchEndpoint:
    """Tests for POST /api/search endpoint"""

    async def test_search_profiles_success(self, client: AsyncClient):
        """Test valid profile search returns 200 with expected structure"""
        request_data = {
            "role": "software engineer",
            "location": "Jakarta",
            "country": "id",
            "language": "id",
            "max_pages": 1,
            "site_filter": "profile"
        }

        response = await client.post("/api/search", json=request_data)

        assert response.status_code == 200
        data = response.json()

        # Verify response structure
        assert data["success"] is True
        assert "query" in data
        assert "linkedin.com/in/" in data["query"]
        assert "total_results" in data
        assert isinstance(data["total_results"], int)
        assert "profiles" in data
        assert isinstance(data["profiles"], list)
        assert "metadata" in data

        # Verify metadata structure
        metadata = data["metadata"]
        assert metadata["country"] == "id"
        assert metadata["language"] == "id"
        assert "pages_requested" in metadata
        assert "pages_scraped" in metadata
        assert "time_taken_seconds" in metadata

        # Verify profile structure if we got results
        if data["profiles"]:
            profile = data["profiles"][0]
            assert "name" in profile
            assert "profile_url" in profile
            assert "linkedin.com/in/" in profile["profile_url"]
            assert "rank" in profile
            assert "best_position" in profile
            assert "frequency" in profile
            assert "pages_seen" in profile

    async def test_search_companies_success(self, client: AsyncClient):
        """Test company search with site_filter returns expected structure"""
        request_data = {
            "role": "linkedin.com/company technology",
            "location": "Indonesia",
            "country": "id",
            "language": "id",
            "max_pages": 1,
            "site_filter": "company"
        }

        response = await client.post("/api/search", json=request_data)

        assert response.status_code == 200
        data = response.json()

        # Verify response structure
        assert data["success"] is True
        assert "query" in data
        assert "linkedin.com/company" in data["query"]
        assert "total_results" in data
        assert "profiles" in data  # Companies returned as profiles
        assert "metadata" in data

    async def test_search_invalid_request(self, client: AsyncClient):
        """Test invalid request returns 422 validation error"""
        # Missing required 'role' field
        request_data = {
            "location": "Jakarta",
            "country": "id"
        }

        response = await client.post("/api/search", json=request_data)

        assert response.status_code == 422
        data = response.json()
        assert "detail" in data

    async def test_search_max_pages_validation(self, client: AsyncClient):
        """Test max_pages validation boundaries"""
        # max_pages > 25 should fail
        request_data = {
            "role": "developer",
            "max_pages": 30
        }

        response = await client.post("/api/search", json=request_data)

        assert response.status_code == 422

        # max_pages < 1 should fail
        request_data["max_pages"] = 0
        response = await client.post("/api/search", json=request_data)
        assert response.status_code == 422


# =============================================================================
# TestScrapeDetailEndpoint - POST /api/scrape-detail
# =============================================================================
@pytest.mark.integration
@pytest.mark.asyncio
class TestScrapeDetailEndpoint:
    """Tests for POST /api/scrape-detail endpoint"""

    async def test_scrape_detail_success(self, client: AsyncClient):
        """Test valid company URLs scraping returns expected structure"""
        request_data = {
            "urls": [
                "https://www.linkedin.com/company/google"
            ]
        }

        response = await client.post("/api/scrape-detail", json=request_data)

        # Can be 200 or 500 depending on LinkedIn blocking
        assert response.status_code in [200, 500]

        if response.status_code == 200:
            data = response.json()
            assert "success" in data
            assert "total_scraped" in data
            assert "companies" in data
            assert isinstance(data["companies"], list)
            assert "metadata" in data

            metadata = data["metadata"]
            assert "total_urls" in metadata
            assert "successful" in metadata
            assert "failed" in metadata
            assert "time_taken_seconds" in metadata

            # Verify company structure if we got results
            if data["companies"]:
                company = data["companies"][0]
                assert "url" in company
                assert "name" in company
                assert "scraped_at" in company

    async def test_scrape_detail_empty_urls(self, client: AsyncClient):
        """Test empty URLs list handling"""
        request_data = {
            "urls": []
        }

        response = await client.post("/api/scrape-detail", json=request_data)

        # Empty list is technically valid, should return success with 0 companies
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["total_scraped"] == 0
        assert data["companies"] == []

    async def test_scrape_detail_missing_urls(self, client: AsyncClient):
        """Test missing urls field returns 422"""
        request_data = {}

        response = await client.post("/api/scrape-detail", json=request_data)

        assert response.status_code == 422


# =============================================================================
# TestSearchPostsEndpoint - POST /api/search-posts
# =============================================================================
@pytest.mark.integration
@pytest.mark.asyncio
class TestSearchPostsEndpoint:
    """Tests for POST /api/search-posts endpoint"""

    async def test_search_posts_success(self, client: AsyncClient):
        """Test valid keywords posts search returns expected structure"""
        request_data = {
            "keywords": "artificial intelligence",
            "author_type": "all",
            "max_results": 5,
            "location": "",
            "language": "en",
            "country": "us"
        }

        response = await client.post("/api/search-posts", json=request_data)

        assert response.status_code == 200
        data = response.json()

        # Verify response structure
        assert data["success"] is True
        assert "query" in data
        assert "site:linkedin.com/posts" in data["query"]
        assert "total_results" in data
        assert isinstance(data["total_results"], int)
        assert "posts" in data
        assert isinstance(data["posts"], list)
        assert "metadata" in data

        # Verify metadata
        metadata = data["metadata"]
        assert metadata["keywords"] == "artificial intelligence"
        assert metadata["author_type"] == "all"
        assert "pages_fetched" in metadata
        assert "time_taken_seconds" in metadata

        # Verify post structure if we got results
        if data["posts"]:
            post = data["posts"][0]
            assert "post_url" in post
            assert "author_name" in post
            assert "author_profile_url" in post
            assert "content" in post
            assert "rank" in post

    async def test_search_posts_missing_keywords(self, client: AsyncClient):
        """Test missing keywords returns 422"""
        request_data = {
            "author_type": "all"
        }

        response = await client.post("/api/search-posts", json=request_data)

        assert response.status_code == 422


# =============================================================================
# TestSearchJobsEndpoint - POST /api/search-jobs
# =============================================================================
@pytest.mark.integration
@pytest.mark.asyncio
class TestSearchJobsEndpoint:
    """Tests for POST /api/search-jobs endpoint"""

    async def test_search_jobs_success(self, client: AsyncClient):
        """Test valid job search returns expected structure"""
        request_data = {
            "job_title": "Software Engineer",
            "location": "Jakarta",
            "experience_level": "all",
            "max_results": 5,
            "language": "id",
            "country": "id"
        }

        response = await client.post("/api/search-jobs", json=request_data)

        assert response.status_code == 200
        data = response.json()

        # Verify response structure
        assert data["success"] is True
        assert "query" in data
        assert "site:linkedin.com/jobs/view" in data["query"]
        assert "total_results" in data
        assert isinstance(data["total_results"], int)
        assert "jobs" in data
        assert isinstance(data["jobs"], list)
        assert "metadata" in data

        # Verify metadata
        metadata = data["metadata"]
        assert metadata["job_title"] == "Software Engineer"
        assert "experience_level" in metadata
        assert "pages_fetched" in metadata
        assert "time_taken_seconds" in metadata

        # Verify job structure if we got results
        if data["jobs"]:
            job = data["jobs"][0]
            assert "job_url" in job
            assert "job_title" in job
            assert "company_name" in job
            assert "location" in job
            assert "description" in job
            assert "rank" in job

    async def test_search_jobs_missing_job_title(self, client: AsyncClient):
        """Test missing job_title returns 422"""
        request_data = {
            "location": "Jakarta"
        }

        response = await client.post("/api/search-jobs", json=request_data)

        assert response.status_code == 422


# =============================================================================
# TestSearchAllEndpoint - POST /api/search-all
# =============================================================================
@pytest.mark.integration
@pytest.mark.asyncio
class TestSearchAllEndpoint:
    """Tests for POST /api/search-all endpoint"""

    async def test_search_all_success(self, client: AsyncClient):
        """Test mixed content search returns expected structure"""
        request_data = {
            "keywords": "technology Indonesia",
            "location": "",
            "max_results": 5,
            "language": "id",
            "country": "id"
        }

        response = await client.post("/api/search-all", json=request_data)

        assert response.status_code == 200
        data = response.json()

        # Verify response structure
        assert data["success"] is True
        assert "query" in data
        assert "site:linkedin.com" in data["query"]
        assert "total_results" in data
        assert isinstance(data["total_results"], int)
        assert "results" in data
        assert isinstance(data["results"], list)
        assert "metadata" in data

        # Verify metadata
        metadata = data["metadata"]
        assert metadata["keywords"] == "technology Indonesia"
        assert "pages_fetched" in metadata
        assert "time_taken_seconds" in metadata

        # Verify result structure if we got results
        if data["results"]:
            result = data["results"][0]
            assert "url" in result
            assert "title" in result
            assert "description" in result
            assert "type" in result
            assert result["type"] in ["profile", "company", "post", "job", "other"]
            assert "rank" in result

    async def test_search_all_missing_keywords(self, client: AsyncClient):
        """Test missing keywords returns 422"""
        request_data = {
            "location": "Jakarta"
        }

        response = await client.post("/api/search-all", json=request_data)

        assert response.status_code == 422


# =============================================================================
# TestHealthEndpoints - GET /api/test and /api/health
# =============================================================================
@pytest.mark.integration
@pytest.mark.asyncio
class TestHealthEndpoints:
    """Tests for health check endpoints"""

    async def test_api_test_endpoint(self, client: AsyncClient):
        """Test /api/test returns expected structure"""
        response = await client.get("/api/test")

        assert response.status_code == 200
        data = response.json()

        assert "message" in data
        assert data["message"] == "LinkedScraper API is working!"
        assert "endpoints" in data
        assert isinstance(data["endpoints"], dict)

        # Verify all endpoints are listed
        endpoints = data["endpoints"]
        assert "search" in endpoints
        assert "scrape-detail" in endpoints
        assert "search-posts" in endpoints
        assert "search-jobs" in endpoints
        assert "search-all" in endpoints
        assert "test" in endpoints

    async def test_api_health_endpoint(self, client: AsyncClient):
        """Test /api/health returns healthy status"""
        response = await client.get("/api/health")

        assert response.status_code == 200
        data = response.json()

        assert "status" in data
        assert data["status"] == "healthy"
        assert "service" in data


# =============================================================================
# TestErrorHandling - Edge cases and error handling
# =============================================================================
@pytest.mark.integration
@pytest.mark.asyncio
class TestErrorHandling:
    """Tests for error handling and edge cases"""

    async def test_wrong_endpoint_fallback(self, client: AsyncClient):
        """Test /search (without /api prefix) returns fallback message"""
        # Test GET
        response = await client.get("/search")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is False
        assert "Wrong endpoint" in data["error"]
        assert "/api/search" in data["message"]

        # Test POST
        response = await client.post("/search", json={"role": "test"})
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is False

    async def test_root_endpoint(self, client: AsyncClient):
        """Test root / endpoint returns API info"""
        response = await client.get("/")

        assert response.status_code == 200
        data = response.json()

        assert "message" in data
        assert data["message"] == "LinkedScraper API"
        assert "version" in data
        assert "docs" in data

    async def test_health_without_api_prefix(self, client: AsyncClient):
        """Test /health (without /api prefix) endpoint"""
        response = await client.get("/health")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"

    async def test_nonexistent_endpoint(self, client: AsyncClient):
        """Test 404 for non-existent endpoint"""
        response = await client.get("/api/nonexistent")

        assert response.status_code == 404

    async def test_wrong_http_method(self, client: AsyncClient):
        """Test wrong HTTP method returns 405"""
        response = await client.get("/api/search")

        assert response.status_code == 405  # Method Not Allowed

    async def test_invalid_json_body(self, client: AsyncClient):
        """Test invalid JSON returns 422"""
        response = await client.post(
            "/api/search",
            content="invalid json",
            headers={"Content-Type": "application/json"}
        )

        assert response.status_code == 422
