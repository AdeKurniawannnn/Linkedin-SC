"""
Unit tests for search_linkedin_all service function

Target: services/scraper.py search_linkedin_all() (lines 885-980)
Total tests: 10

Tests cover:
- Happy path with mixed results
- Profile classification
- Company classification
- Post classification
- Job classification
- Empty results handling
- SERP error handling
- Max results limit
- Unknown URL type handling
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
# Tests: search_linkedin_all()
# =============================================================================

@pytest.mark.unit
@pytest.mark.asyncio
async def test_search_all_happy_path():
    """Test: Returns mixed content types when search is successful"""
    mock_organic = [
        MockOrganicResult(
            link="https://linkedin.com/in/johndoe",
            title="John Doe - Software Engineer",
            description="Experienced developer...",
            rank=1
        ),
        MockOrganicResult(
            link="https://linkedin.com/company/techcorp",
            title="TechCorp - Technology Company",
            description="Leading tech company...",
            rank=2
        ),
        MockOrganicResult(
            link="https://linkedin.com/posts/user1_activity-123",
            title="User on LinkedIn: Great post",
            description="Content about tech...",
            rank=3
        ),
        MockOrganicResult(
            link="https://linkedin.com/jobs/view/engineer-456",
            title="Engineer - Company",
            description="Job opportunity...",
            rank=4
        ),
    ]
    mock_result = MockSerpResult(organic=mock_organic, pages_fetched=1)

    with patch('services.scraper.SerpAggregator') as mock_serp_class:
        mock_client = AsyncMock()
        mock_client.search.return_value = mock_result
        mock_serp_class.return_value.__aenter__.return_value = mock_client
        mock_serp_class.return_value.__aexit__.return_value = None

        from services.scraper import search_linkedin_all

        result = await search_linkedin_all(
            keywords="technology Jakarta",
            max_results=20
        )

        assert result["success"] is True
        assert result["total_results"] == 4
        assert len(result["results"]) == 4

        # Verify different types are returned
        types = [r["type"] for r in result["results"]]
        assert "profile" in types
        assert "company" in types
        assert "post" in types
        assert "job" in types


@pytest.mark.unit
@pytest.mark.asyncio
async def test_search_all_classifies_profiles():
    """Test: URLs with /in/ are classified as profiles"""
    mock_organic = [
        MockOrganicResult(
            link="https://linkedin.com/in/engineer1",
            title="Engineer One - Developer",
            rank=1
        ),
        MockOrganicResult(
            link="https://id.linkedin.com/in/engineer2",
            title="Engineer Two - Senior Dev",
            rank=2
        ),
        MockOrganicResult(
            link="https://www.linkedin.com/in/engineer3",
            title="Engineer Three - Tech Lead",
            rank=3
        ),
    ]
    mock_result = MockSerpResult(organic=mock_organic, pages_fetched=1)

    with patch('services.scraper.SerpAggregator') as mock_serp_class:
        mock_client = AsyncMock()
        mock_client.search.return_value = mock_result
        mock_serp_class.return_value.__aenter__.return_value = mock_client
        mock_serp_class.return_value.__aexit__.return_value = None

        from services.scraper import search_linkedin_all

        result = await search_linkedin_all(
            keywords="engineer",
            max_results=10
        )

        # All should be classified as profiles
        for item in result["results"]:
            assert item["type"] == "profile"


@pytest.mark.unit
@pytest.mark.asyncio
async def test_search_all_classifies_companies():
    """Test: URLs with /company/ are classified as companies"""
    mock_organic = [
        MockOrganicResult(
            link="https://linkedin.com/company/google",
            title="Google - Tech Company",
            rank=1
        ),
        MockOrganicResult(
            link="https://www.linkedin.com/company/microsoft",
            title="Microsoft Corporation",
            rank=2
        ),
    ]
    mock_result = MockSerpResult(organic=mock_organic, pages_fetched=1)

    with patch('services.scraper.SerpAggregator') as mock_serp_class:
        mock_client = AsyncMock()
        mock_client.search.return_value = mock_result
        mock_serp_class.return_value.__aenter__.return_value = mock_client
        mock_serp_class.return_value.__aexit__.return_value = None

        from services.scraper import search_linkedin_all

        result = await search_linkedin_all(
            keywords="technology",
            max_results=10
        )

        # All should be classified as companies
        for item in result["results"]:
            assert item["type"] == "company"


@pytest.mark.unit
@pytest.mark.asyncio
async def test_search_all_classifies_posts():
    """Test: URLs with /posts/ or /feed/update/ are classified as posts"""
    mock_organic = [
        MockOrganicResult(
            link="https://linkedin.com/posts/user1_activity-123",
            title="User on LinkedIn: Post content",
            rank=1
        ),
        MockOrganicResult(
            link="https://linkedin.com/feed/update/urn:li:activity:789",
            title="Feed update content",
            rank=2
        ),
    ]
    mock_result = MockSerpResult(organic=mock_organic, pages_fetched=1)

    with patch('services.scraper.SerpAggregator') as mock_serp_class:
        mock_client = AsyncMock()
        mock_client.search.return_value = mock_result
        mock_serp_class.return_value.__aenter__.return_value = mock_client
        mock_serp_class.return_value.__aexit__.return_value = None

        from services.scraper import search_linkedin_all

        result = await search_linkedin_all(
            keywords="announcement",
            max_results=10
        )

        # All should be classified as posts
        for item in result["results"]:
            assert item["type"] == "post"


@pytest.mark.unit
@pytest.mark.asyncio
async def test_search_all_classifies_jobs():
    """Test: URLs with /jobs/view/ or /jobs/ are classified as jobs"""
    mock_organic = [
        MockOrganicResult(
            link="https://linkedin.com/jobs/view/engineer-123",
            title="Software Engineer - Company",
            rank=1
        ),
        MockOrganicResult(
            link="https://linkedin.com/jobs/view/developer-456",
            title="Developer - TechCorp",
            rank=2
        ),
    ]
    mock_result = MockSerpResult(organic=mock_organic, pages_fetched=1)

    with patch('services.scraper.SerpAggregator') as mock_serp_class:
        mock_client = AsyncMock()
        mock_client.search.return_value = mock_result
        mock_serp_class.return_value.__aenter__.return_value = mock_client
        mock_serp_class.return_value.__aexit__.return_value = None

        from services.scraper import search_linkedin_all

        result = await search_linkedin_all(
            keywords="software engineer",
            max_results=10
        )

        # All should be classified as jobs
        for item in result["results"]:
            assert item["type"] == "job"


@pytest.mark.unit
@pytest.mark.asyncio
async def test_search_all_empty_results():
    """Test: Handles empty results gracefully"""
    mock_result = MockSerpResult(organic=[], pages_fetched=1)

    with patch('services.scraper.SerpAggregator') as mock_serp_class:
        mock_client = AsyncMock()
        mock_client.search.return_value = mock_result
        mock_serp_class.return_value.__aenter__.return_value = mock_client
        mock_serp_class.return_value.__aexit__.return_value = None

        from services.scraper import search_linkedin_all

        result = await search_linkedin_all(
            keywords="xyznonexistent12345",
            max_results=10
        )

        assert result["success"] is True
        assert result["total_results"] == 0
        assert result["results"] == []


@pytest.mark.unit
@pytest.mark.asyncio
async def test_search_all_serp_error():
    """Test: Handles SERP client errors"""
    with patch('services.scraper.SerpAggregator') as mock_serp_class:
        mock_client = AsyncMock()
        mock_client.search.side_effect = Exception("SERP rate limit exceeded")
        mock_serp_class.return_value.__aenter__.return_value = mock_client
        mock_serp_class.return_value.__aexit__.return_value = None

        from services.scraper import search_linkedin_all

        with pytest.raises(Exception) as exc_info:
            await search_linkedin_all(keywords="test")

        assert "SERP rate limit exceeded" in str(exc_info.value)


@pytest.mark.unit
@pytest.mark.asyncio
async def test_search_all_max_results_limit():
    """Test: Results are limited to max_results"""
    # Create 30 mock results
    mock_organic = [
        MockOrganicResult(
            link=f"https://linkedin.com/in/user{i}",
            title=f"User {i} - Engineer",
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

        from services.scraper import search_linkedin_all

        result = await search_linkedin_all(
            keywords="engineer",
            max_results=15
        )

        assert result["total_results"] == 15
        assert len(result["results"]) == 15


@pytest.mark.unit
@pytest.mark.asyncio
async def test_search_all_unknown_url_type():
    """Test: Unknown URL types are classified as 'other'"""
    mock_organic = [
        MockOrganicResult(
            link="https://linkedin.com/pulse/article-123",  # Article URL
            title="LinkedIn Article",
            rank=1
        ),
        MockOrganicResult(
            link="https://linkedin.com/learning/course-456",  # Learning URL
            title="LinkedIn Learning Course",
            rank=2
        ),
        MockOrganicResult(
            link="https://linkedin.com/events/event-789",  # Events URL
            title="LinkedIn Event",
            rank=3
        ),
    ]
    mock_result = MockSerpResult(organic=mock_organic, pages_fetched=1)

    with patch('services.scraper.SerpAggregator') as mock_serp_class:
        mock_client = AsyncMock()
        mock_client.search.return_value = mock_result
        mock_serp_class.return_value.__aenter__.return_value = mock_client
        mock_serp_class.return_value.__aexit__.return_value = None

        from services.scraper import search_linkedin_all

        result = await search_linkedin_all(
            keywords="learning",
            max_results=10
        )

        # All should be classified as "other"
        for item in result["results"]:
            assert item["type"] == "other"


@pytest.mark.unit
@pytest.mark.asyncio
async def test_search_all_deduplication():
    """Test: Duplicate URLs are handled"""
    mock_organic = [
        MockOrganicResult(
            link="https://linkedin.com/in/sameuser",
            title="Same User - Engineer",
            rank=1
        ),
        MockOrganicResult(
            link="https://linkedin.com/in/sameuser",  # Duplicate
            title="Same User - Engineer (Again)",
            rank=2
        ),
        MockOrganicResult(
            link="https://linkedin.com/in/differentuser",
            title="Different User - Developer",
            rank=3
        ),
    ]
    mock_result = MockSerpResult(organic=mock_organic, pages_fetched=1)

    with patch('services.scraper.SerpAggregator') as mock_serp_class:
        mock_client = AsyncMock()
        mock_client.search.return_value = mock_result
        mock_serp_class.return_value.__aenter__.return_value = mock_client
        mock_serp_class.return_value.__aexit__.return_value = None

        from services.scraper import search_linkedin_all

        result = await search_linkedin_all(
            keywords="user",
            max_results=10
        )

        # Note: Current implementation does not deduplicate - test documents behavior
        assert result["total_results"] == 3
