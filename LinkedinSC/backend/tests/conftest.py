"""
Pytest configuration and fixtures for LinkedinSC backend tests

Provides:
- pytest-asyncio configuration
- SERP client fixture (real client)
- FastAPI TestClient fixture
- Sample LinkedIn URLs fixture
- Pytest markers for test categorization
"""
import os
import sys
from pathlib import Path
from typing import Generator, AsyncGenerator

import pytest
from fastapi.testclient import TestClient

# Add backend to Python path
backend_path = Path(__file__).parent.parent
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

# Add serp-api-aggregator to Python path
serp_path = backend_path.parent.parent / "serp-api-aggregator" / "src"
if serp_path.exists() and str(serp_path) not in sys.path:
    sys.path.insert(0, str(serp_path))


# =============================================================================
# Pytest Configuration
# =============================================================================

def pytest_configure(config):
    """Register custom markers."""
    config.addinivalue_line(
        "markers", "integration: marks tests as integration tests (may be slow)"
    )
    config.addinivalue_line(
        "markers", "slow: marks tests as slow (deselect with '-m \"not slow\"')"
    )
    config.addinivalue_line(
        "markers", "requires_api_key: marks tests that require SERP API key"
    )
    config.addinivalue_line(
        "markers", "unit: marks tests as unit tests (fast, no external deps)"
    )


# =============================================================================
# FastAPI TestClient Fixture
# =============================================================================

@pytest.fixture(scope="module")
def test_app() -> Generator[TestClient, None, None]:
    """
    Create a FastAPI TestClient for API endpoint testing.

    Scope: module - shared across tests in the same module for efficiency.

    Usage:
        def test_health_check(test_app):
            response = test_app.get("/api/health")
            assert response.status_code == 200
    """
    from main import app

    with TestClient(app) as client:
        yield client


# =============================================================================
# SERP Client Fixture
# =============================================================================

@pytest.fixture
async def serp_client() -> AsyncGenerator:
    """
    Create a real SerpAggregator client for integration tests.

    Note: This fixture requires SERP_BRIGHT_DATA_API_KEY environment variable.
    Tests using this fixture should be marked with @pytest.mark.requires_api_key.

    Usage:
        @pytest.mark.requires_api_key
        @pytest.mark.integration
        async def test_serp_search(serp_client):
            result = await serp_client.search("test query", max_pages=1)
            assert result.organic_count > 0
    """
    try:
        from serp.client import SerpAggregator
    except ImportError:
        pytest.skip("serp-api-aggregator not installed")

    # Check for API key
    api_key = os.getenv("SERP_BRIGHT_DATA_API_KEY")
    if not api_key:
        pytest.skip("SERP_BRIGHT_DATA_API_KEY environment variable not set")

    async with SerpAggregator() as client:
        yield client


# =============================================================================
# Sample LinkedIn URLs Fixture
# =============================================================================

@pytest.fixture
def sample_linkedin_urls() -> dict:
    """
    Provide sample LinkedIn URLs for testing.

    Returns a dict with categorized URLs:
    - profiles: Individual LinkedIn profile URLs
    - companies: LinkedIn company page URLs
    - posts: LinkedIn post URLs
    - jobs: LinkedIn job posting URLs
    - invalid: Invalid/malformed URLs for error testing

    Usage:
        def test_profile_parsing(sample_linkedin_urls):
            for url in sample_linkedin_urls["profiles"]:
                assert validate_linkedin_url(url)
    """
    return {
        "profiles": [
            "https://www.linkedin.com/in/satya-nadella-b534ba8/",
            "https://www.linkedin.com/in/sundarpichai/",
            "https://id.linkedin.com/in/galihirawan",
            "https://uk.linkedin.com/in/johndoe",
        ],
        "companies": [
            "https://www.linkedin.com/company/google",
            "https://www.linkedin.com/company/microsoft",
            "https://www.linkedin.com/company/apple",
            "https://www.linkedin.com/company/amazon",
        ],
        "posts": [
            "https://www.linkedin.com/posts/satya-nadella_ai-technology-activity-7123456789",
            "https://www.linkedin.com/feed/update/urn:li:activity:7123456789",
        ],
        "jobs": [
            "https://www.linkedin.com/jobs/view/3456789012",
            "https://www.linkedin.com/jobs/view/software-engineer-at-google-1234567890",
        ],
        "invalid": [
            "https://linkedin.com",  # Missing path
            "https://example.com/in/profile",  # Wrong domain
            "not-a-url",  # Not a URL
            "",  # Empty string
            None,  # None value
        ],
    }


# =============================================================================
# Sample Search Queries Fixture
# =============================================================================

@pytest.fixture
def sample_search_queries() -> dict:
    """
    Provide sample search queries for testing.

    Returns a dict with categorized queries:
    - profile_searches: Queries for profile search testing
    - company_searches: Queries for company search testing
    - post_searches: Queries for post search testing
    - job_searches: Queries for job search testing

    Usage:
        @pytest.mark.integration
        async def test_profile_search(serp_client, sample_search_queries):
            for query in sample_search_queries["profile_searches"]:
                result = await search_linkedin_profiles(role=query["role"])
                assert result["success"]
    """
    return {
        "profile_searches": [
            {"role": "Software Engineer", "location": "Jakarta", "country": "id"},
            {"role": "Data Scientist", "location": "Singapore", "country": "sg"},
            {"role": "IT Manager", "location": "", "country": "us"},
        ],
        "company_searches": [
            {"role": "technology linkedin.com/company", "location": "Indonesia", "country": "id"},
            {"role": "startup linkedin.com/company", "location": "Jakarta", "country": "id"},
        ],
        "post_searches": [
            {"keywords": "artificial intelligence", "author_type": "all"},
            {"keywords": "startup", "author_type": "companies"},
        ],
        "job_searches": [
            {"job_title": "Software Engineer", "location": "Jakarta"},
            {"job_title": "Data Analyst", "location": "Remote"},
        ],
    }


# =============================================================================
# Mock SERP Response Fixture
# =============================================================================

@pytest.fixture
def mock_serp_response() -> dict:
    """
    Provide a mock SERP response for unit testing.

    Mimics the structure returned by SerpAggregator.search().

    Usage:
        def test_parse_serp_results(mock_serp_response):
            profiles = parse_organic_results(mock_serp_response["organic"])
            assert len(profiles) > 0
    """
    return {
        "organic": [
            {
                "link": "https://id.linkedin.com/in/galihirawan",
                "title": "Galih Irawan - IT Support as Freelance",
                "description": "Jawa Barat. IT Support as Freelance. Companies. Universitas Gunadarma.",
                "rank": 1,
                "best_position": 1,
                "frequency": 1,
                "pages_seen": [1],
            },
            {
                "link": "https://www.linkedin.com/company/vertilogic",
                "title": "Vertilogic - IT Services Company",
                "description": "Vertilogic. Jasa TI dan Konsultan TI. Ukuran perusahaan: 2-10 karyawan. Kantor Pusat: Jakarta, DKI Jakarta.",
                "rank": 2,
                "best_position": 2,
                "frequency": 1,
                "pages_seen": [1],
            },
        ],
        "organic_count": 2,
        "pages_fetched": 1,
        "has_errors": False,
    }


# =============================================================================
# Company Description Samples Fixture
# =============================================================================

@pytest.fixture
def sample_company_descriptions() -> list:
    """
    Provide sample company descriptions for parsing tests.

    Each item contains:
    - description: Raw description text
    - expected: Expected parsed values

    Usage:
        def test_parse_company_description(sample_company_descriptions):
            for sample in sample_company_descriptions:
                result = parse_company_description(sample["description"])
                assert result.get("industry") == sample["expected"].get("industry")
    """
    return [
        {
            "description": "Vertilogic. Jasa TI dan Konsultan TI. Ukuran perusahaan: 2-10 karyawan. Kantor Pusat: Jakarta, DKI Jakarta. Jenis: Perseroan Tertutup. Tahun Pendirian: 2015.",
            "expected": {
                "industry": "Jasa TI dan Konsultan TI",
                "company_size": "2-10 karyawan",
                "headquarters": "Jakarta, DKI Jakarta",
                "company_type": "Perseroan Tertutup",
                "founded_year": 2015,
            },
        },
        {
            "description": "TechCorp. Software Development. 1000 pengikut. Company size: 50-200 employees. Headquarters: Singapore.",
            "expected": {
                "followers": 1000,
            },
        },
    ]
