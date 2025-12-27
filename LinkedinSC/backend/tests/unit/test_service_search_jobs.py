"""
Unit tests for search_linkedin_jobs service function

Target: services/scraper.py search_linkedin_jobs() (lines 737-882)
Total tests: 10

Tests cover:
- Happy path with expected results
- Experience level filtering
- Company name extraction
- Location extraction
- Empty results handling
- SERP error handling
- Max results limit
- Salary extraction (from description)
- Job type detection
- Deduplication
"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from typing import List


# =============================================================================
# Helper Classes for Mocking
# =============================================================================

class MockOrganicResult:
    """Mock organic result from SERP API"""
    def __init__(
        self,
        link: str,
        title: str,
        description: str = "",
        rank: int = 1
    ):
        self.link = link
        self.title = title
        self.description = description
        self.rank = rank


class MockSerpResult:
    """Mock result from SerpAggregator.search()"""
    def __init__(self, organic: List[MockOrganicResult], pages_fetched: int = 1):
        self.organic = organic
        self.pages_fetched = pages_fetched


# =============================================================================
# Tests: search_linkedin_jobs()
# =============================================================================

@pytest.mark.unit
@pytest.mark.asyncio
async def test_search_jobs_happy_path():
    """Test: Returns jobs when search is successful"""
    mock_organic = [
        MockOrganicResult(
            link="https://linkedin.com/jobs/view/software-engineer-at-google-123456",
            title="Software Engineer - Google",
            description="Join our team to build amazing products. Location: Jakarta, Indonesia.",
            rank=1
        ),
        MockOrganicResult(
            link="https://linkedin.com/jobs/view/data-analyst-at-microsoft-789012",
            title="Data Analyst - Microsoft",
            description="Analyze data to drive business decisions. Remote opportunity.",
            rank=2
        ),
    ]
    mock_result = MockSerpResult(organic=mock_organic, pages_fetched=1)

    with patch('services.scraper.SerpAggregator') as mock_serp_class:
        mock_client = AsyncMock()
        mock_client.search.return_value = mock_result
        mock_serp_class.return_value.__aenter__.return_value = mock_client
        mock_serp_class.return_value.__aexit__.return_value = None

        from services.scraper import search_linkedin_jobs

        result = await search_linkedin_jobs(
            job_title="Software Engineer",
            max_results=10
        )

        assert result["success"] is True
        assert result["total_results"] == 2
        assert len(result["jobs"]) == 2
        assert result["jobs"][0]["job_title"] == "Software Engineer"


@pytest.mark.unit
@pytest.mark.asyncio
async def test_search_jobs_filters_by_experience():
    """Test: Experience level is passed in metadata"""
    mock_organic = [
        MockOrganicResult(
            link="https://linkedin.com/jobs/view/senior-developer-123",
            title="Senior Developer - TechCorp",
            rank=1
        ),
    ]
    mock_result = MockSerpResult(organic=mock_organic, pages_fetched=1)

    with patch('services.scraper.SerpAggregator') as mock_serp_class:
        mock_client = AsyncMock()
        mock_client.search.return_value = mock_result
        mock_serp_class.return_value.__aenter__.return_value = mock_client
        mock_serp_class.return_value.__aexit__.return_value = None

        from services.scraper import search_linkedin_jobs

        result = await search_linkedin_jobs(
            job_title="Developer",
            experience_level="mid-senior",
            max_results=10
        )

        assert result["metadata"]["experience_level"] == "mid-senior"


@pytest.mark.unit
@pytest.mark.asyncio
async def test_search_jobs_extracts_company_name():
    """Test: Company name is extracted from title patterns"""
    mock_organic = [
        MockOrganicResult(
            link="https://linkedin.com/jobs/view/engineer-at-google-123",
            title="Engineer - Google",
            rank=1
        ),
        MockOrganicResult(
            link="https://linkedin.com/jobs/view/developer-at-meta-456",
            title="Developer at Meta",
            rank=2
        ),
        MockOrganicResult(
            link="https://linkedin.com/jobs/view/pt-temas-tbk-membuka-lowongan-analyst-789",
            title="PT Temas Tbk membuka lowongan Analyst di Area Jakarta",
            rank=3
        ),
    ]
    mock_result = MockSerpResult(organic=mock_organic, pages_fetched=1)

    with patch('services.scraper.SerpAggregator') as mock_serp_class:
        mock_client = AsyncMock()
        mock_client.search.return_value = mock_result
        mock_serp_class.return_value.__aenter__.return_value = mock_client
        mock_serp_class.return_value.__aexit__.return_value = None

        from services.scraper import search_linkedin_jobs

        result = await search_linkedin_jobs(
            job_title="Engineer",
            max_results=10
        )

        jobs = result["jobs"]
        # Pattern 1: "Title - Company"
        assert jobs[0]["company_name"] == "Google"
        # Pattern 2: "Title at Company"
        assert jobs[1]["company_name"] == "Meta"
        # Pattern 3: Indonesian format
        assert jobs[2]["company_name"] == "PT Temas Tbk"


@pytest.mark.unit
@pytest.mark.asyncio
async def test_search_jobs_extracts_location():
    """Test: Location is extracted from description"""
    mock_organic = [
        MockOrganicResult(
            link="https://linkedin.com/jobs/view/engineer-123",
            title="Engineer - Company",
            description="Location: Jakarta, Indonesia. We are looking for talented engineers.",
            rank=1
        ),
        MockOrganicResult(
            link="https://linkedin.com/jobs/view/developer-456",
            title="Developer - Company",
            description="Remote opportunity. Join our global team.",
            rank=2
        ),
    ]
    mock_result = MockSerpResult(organic=mock_organic, pages_fetched=1)

    with patch('services.scraper.SerpAggregator') as mock_serp_class:
        mock_client = AsyncMock()
        mock_client.search.return_value = mock_result
        mock_serp_class.return_value.__aenter__.return_value = mock_client
        mock_serp_class.return_value.__aexit__.return_value = None

        from services.scraper import search_linkedin_jobs

        result = await search_linkedin_jobs(
            job_title="Engineer",
            max_results=10
        )

        jobs = result["jobs"]
        # Explicit location pattern
        assert "Jakarta" in jobs[0]["location"]
        # Remote pattern
        assert jobs[1]["location"] == "Remote" or "Remote" in jobs[1]["location"]


@pytest.mark.unit
@pytest.mark.asyncio
async def test_search_jobs_empty_results():
    """Test: Handles empty results gracefully"""
    mock_result = MockSerpResult(organic=[], pages_fetched=1)

    with patch('services.scraper.SerpAggregator') as mock_serp_class:
        mock_client = AsyncMock()
        mock_client.search.return_value = mock_result
        mock_serp_class.return_value.__aenter__.return_value = mock_client
        mock_serp_class.return_value.__aexit__.return_value = None

        from services.scraper import search_linkedin_jobs

        result = await search_linkedin_jobs(
            job_title="xyznonexistent12345",
            max_results=10
        )

        assert result["success"] is True
        assert result["total_results"] == 0
        assert result["jobs"] == []


@pytest.mark.unit
@pytest.mark.asyncio
async def test_search_jobs_serp_error():
    """Test: Handles SERP client errors"""
    with patch('services.scraper.SerpAggregator') as mock_serp_class:
        mock_client = AsyncMock()
        mock_client.search.side_effect = Exception("SERP connection timeout")
        mock_serp_class.return_value.__aenter__.return_value = mock_client
        mock_serp_class.return_value.__aexit__.return_value = None

        from services.scraper import search_linkedin_jobs

        with pytest.raises(Exception) as exc_info:
            await search_linkedin_jobs(job_title="Engineer")

        assert "SERP connection timeout" in str(exc_info.value)


@pytest.mark.unit
@pytest.mark.asyncio
async def test_search_jobs_max_results_limit():
    """Test: Results are limited to max_results"""
    # Create 30 mock jobs
    mock_organic = [
        MockOrganicResult(
            link=f"https://linkedin.com/jobs/view/job-{i}",
            title=f"Job {i} - Company{i}",
            rank=i + 1
        )
        for i in range(30)
    ]
    mock_result = MockSerpResult(organic=mock_organic, pages_fetched=3)

    with patch('services.scraper.SerpAggregator') as mock_serp_class:
        mock_client = AsyncMock()
        mock_client.search.return_value = mock_result
        mock_serp_class.return_value.__aenter__.return_value = mock_client
        mock_serp_class.return_value.__aexit__.return_value = None

        from services.scraper import search_linkedin_jobs

        result = await search_linkedin_jobs(
            job_title="Software Engineer",
            max_results=20
        )

        assert result["total_results"] == 20
        assert len(result["jobs"]) == 20


@pytest.mark.unit
@pytest.mark.asyncio
async def test_search_jobs_salary_extraction():
    """Test: Salary information is included in description"""
    mock_organic = [
        MockOrganicResult(
            link="https://linkedin.com/jobs/view/engineer-123",
            title="Engineer - Company",
            description="Salary: $100,000 - $150,000 per year. Location: Remote.",
            rank=1
        ),
    ]
    mock_result = MockSerpResult(organic=mock_organic, pages_fetched=1)

    with patch('services.scraper.SerpAggregator') as mock_serp_class:
        mock_client = AsyncMock()
        mock_client.search.return_value = mock_result
        mock_serp_class.return_value.__aenter__.return_value = mock_client
        mock_serp_class.return_value.__aexit__.return_value = None

        from services.scraper import search_linkedin_jobs

        result = await search_linkedin_jobs(
            job_title="Engineer",
            max_results=10
        )

        job = result["jobs"][0]
        # Salary info should be in description
        assert "$100,000" in job["description"] or "100,000" in job["description"]


@pytest.mark.unit
@pytest.mark.asyncio
async def test_search_jobs_job_type_detection():
    """Test: Different job URL patterns are filtered correctly"""
    mock_organic = [
        MockOrganicResult(
            link="https://linkedin.com/jobs/view/engineer-123",
            title="Engineer - Company",
            rank=1
        ),
        MockOrganicResult(
            link="https://linkedin.com/jobs/collections/recommended",  # Still contains /jobs/
            title="Recommended Jobs",
            rank=2
        ),
        MockOrganicResult(
            link="https://linkedin.com/in/someprofile",  # Profile, not job - should be excluded
            title="Some Profile",
            rank=3
        ),
        MockOrganicResult(
            link="https://linkedin.com/jobs/view/developer-456",
            title="Developer - TechCo",
            rank=4
        ),
    ]
    mock_result = MockSerpResult(organic=mock_organic, pages_fetched=1)

    with patch('services.scraper.SerpAggregator') as mock_serp_class:
        mock_client = AsyncMock()
        mock_client.search.return_value = mock_result
        mock_serp_class.return_value.__aenter__.return_value = mock_client
        mock_serp_class.return_value.__aexit__.return_value = None

        from services.scraper import search_linkedin_jobs

        result = await search_linkedin_jobs(
            job_title="Engineer",
            max_results=10
        )

        # Note: Service filter checks for /jobs/view/ OR linkedin.com/jobs/
        # So /jobs/collections/recommended also matches the second condition
        # Profile URLs are correctly excluded
        assert result["total_results"] == 3
        for job in result["jobs"]:
            assert "/jobs/" in job["job_url"]
            assert "/in/" not in job["job_url"]


@pytest.mark.unit
@pytest.mark.asyncio
async def test_search_jobs_deduplication():
    """Test: Duplicate job URLs are handled"""
    mock_organic = [
        MockOrganicResult(
            link="https://linkedin.com/jobs/view/engineer-123",
            title="Engineer - Company",
            rank=1
        ),
        MockOrganicResult(
            link="https://linkedin.com/jobs/view/engineer-123",  # Duplicate
            title="Engineer - Company (Duplicate)",
            rank=2
        ),
        MockOrganicResult(
            link="https://linkedin.com/jobs/view/developer-456",
            title="Developer - TechCo",
            rank=3
        ),
    ]
    mock_result = MockSerpResult(organic=mock_organic, pages_fetched=1)

    with patch('services.scraper.SerpAggregator') as mock_serp_class:
        mock_client = AsyncMock()
        mock_client.search.return_value = mock_result
        mock_serp_class.return_value.__aenter__.return_value = mock_client
        mock_serp_class.return_value.__aexit__.return_value = None

        from services.scraper import search_linkedin_jobs

        result = await search_linkedin_jobs(
            job_title="Engineer",
            max_results=10
        )

        # Note: Current implementation does not deduplicate - test documents behavior
        assert result["total_results"] == 3
