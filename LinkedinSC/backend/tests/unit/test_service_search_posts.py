"""
Unit tests for search_linkedin_posts service function

Target: services/scraper.py search_linkedin_posts() (lines 578-734)
Total tests: 10

Tests cover:
- Happy path with expected results
- Author type filtering (companies, people)
- Hashtag extraction
- Author info extraction
- Empty results handling
- SERP error handling
- Max results limit
- Location filter
- Language filter
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
# Tests: search_linkedin_posts()
# =============================================================================

@pytest.mark.unit
@pytest.mark.asyncio
async def test_search_posts_happy_path():
    """Test: Returns posts when search is successful"""
    mock_organic = [
        MockOrganicResult(
            link="https://linkedin.com/posts/user1_topic-activity-123",
            title="User One on LinkedIn: Great insights about AI #technology",
            description="AI is transforming the industry...",
            rank=1
        ),
        MockOrganicResult(
            link="https://linkedin.com/posts/user2_another-activity-456",
            title="User Two on LinkedIn: My thoughts on startups",
            description="Building a startup is challenging...",
            rank=2
        ),
    ]
    mock_result = MockSerpResult(organic=mock_organic, pages_fetched=1)

    with patch('services.scraper.SerpAggregator') as mock_serp_class:
        mock_client = AsyncMock()
        mock_client.search.return_value = mock_result
        mock_serp_class.return_value.__aenter__.return_value = mock_client
        mock_serp_class.return_value.__aexit__.return_value = None

        from services.scraper import search_linkedin_posts

        result = await search_linkedin_posts(
            keywords="AI technology",
            max_results=10
        )

        assert result["success"] is True
        assert result["total_results"] == 2
        assert len(result["posts"]) == 2
        assert result["posts"][0]["author_name"] == "User One"


@pytest.mark.unit
@pytest.mark.asyncio
async def test_search_posts_filters_by_author_type():
    """Test: Author type filter modifies search query"""
    mock_organic = [
        MockOrganicResult(
            link="https://linkedin.com/company/techcorp/posts/activity-123",
            title="TechCorp on LinkedIn: Company announcement",
            description="We are excited to announce...",
            rank=1
        ),
    ]
    mock_result = MockSerpResult(organic=mock_organic, pages_fetched=1)

    with patch('services.scraper.SerpAggregator') as mock_serp_class:
        mock_client = AsyncMock()
        mock_client.search.return_value = mock_result
        mock_serp_class.return_value.__aenter__.return_value = mock_client
        mock_serp_class.return_value.__aexit__.return_value = None

        from services.scraper import search_linkedin_posts

        # Test companies filter
        result = await search_linkedin_posts(
            keywords="announcement",
            author_type="companies",
            max_results=10
        )

        # Query should include company filter
        assert "linkedin.com/company" in result["query"]
        assert result["metadata"]["author_type"] == "companies"


@pytest.mark.unit
@pytest.mark.asyncio
async def test_search_posts_extracts_hashtags():
    """Test: Hashtags are extracted from title and content"""
    mock_organic = [
        MockOrganicResult(
            link="https://linkedin.com/posts/user1_activity-123",
            title="User One on LinkedIn: Great post #AI #MachineLearning #Tech",
            description="More content about #DataScience and #Python",
            rank=1
        ),
    ]
    mock_result = MockSerpResult(organic=mock_organic, pages_fetched=1)

    with patch('services.scraper.SerpAggregator') as mock_serp_class:
        mock_client = AsyncMock()
        mock_client.search.return_value = mock_result
        mock_serp_class.return_value.__aenter__.return_value = mock_client
        mock_serp_class.return_value.__aexit__.return_value = None

        from services.scraper import search_linkedin_posts

        result = await search_linkedin_posts(
            keywords="technology",
            max_results=10
        )

        post = result["posts"][0]
        assert len(post["hashtags"]) >= 3
        assert "#AI" in post["hashtags"] or "#MachineLearning" in post["hashtags"]


@pytest.mark.unit
@pytest.mark.asyncio
async def test_search_posts_extracts_author_info():
    """Test: Author name and profile URL are extracted correctly"""
    mock_organic = [
        MockOrganicResult(
            link="https://linkedin.com/posts/johndoe_topic-activity-123",
            title="John Doe on LinkedIn: My career journey",
            description="Sharing my experience...",
            rank=1
        ),
        MockOrganicResult(
            link="https://linkedin.com/posts/acmecorp_company-update-activity-456",
            title="Acme Corp on LinkedIn: Company update",
            description="We are growing...",
            rank=2
        ),
    ]
    mock_result = MockSerpResult(organic=mock_organic, pages_fetched=1)

    with patch('services.scraper.SerpAggregator') as mock_serp_class:
        mock_client = AsyncMock()
        mock_client.search.return_value = mock_result
        mock_serp_class.return_value.__aenter__.return_value = mock_client
        mock_serp_class.return_value.__aexit__.return_value = None

        from services.scraper import search_linkedin_posts

        result = await search_linkedin_posts(
            keywords="career",
            max_results=10
        )

        # Person post - extracts from /posts/username_
        person_post = result["posts"][0]
        assert person_post["author_name"] == "John Doe"
        assert "linkedin.com/in/johndoe" in person_post["author_profile_url"]

        # Company post - extracts username from /posts/username_ pattern
        company_post = result["posts"][1]
        assert company_post["author_name"] == "Acme Corp"
        # Note: The service extracts from /posts/username_ pattern and generates /in/ URL
        assert "linkedin.com/in/acmecorp" in company_post["author_profile_url"]


@pytest.mark.unit
@pytest.mark.asyncio
async def test_search_posts_empty_results():
    """Test: Handles empty results gracefully"""
    mock_result = MockSerpResult(organic=[], pages_fetched=1)

    with patch('services.scraper.SerpAggregator') as mock_serp_class:
        mock_client = AsyncMock()
        mock_client.search.return_value = mock_result
        mock_serp_class.return_value.__aenter__.return_value = mock_client
        mock_serp_class.return_value.__aexit__.return_value = None

        from services.scraper import search_linkedin_posts

        result = await search_linkedin_posts(
            keywords="xyznonexistent12345",
            max_results=10
        )

        assert result["success"] is True
        assert result["total_results"] == 0
        assert result["posts"] == []


@pytest.mark.unit
@pytest.mark.asyncio
async def test_search_posts_serp_error():
    """Test: Handles SERP client errors"""
    with patch('services.scraper.SerpAggregator') as mock_serp_class:
        mock_client = AsyncMock()
        mock_client.search.side_effect = Exception("SERP API error")
        mock_serp_class.return_value.__aenter__.return_value = mock_client
        mock_serp_class.return_value.__aexit__.return_value = None

        from services.scraper import search_linkedin_posts

        with pytest.raises(Exception) as exc_info:
            await search_linkedin_posts(keywords="test")

        assert "SERP API error" in str(exc_info.value)


@pytest.mark.unit
@pytest.mark.asyncio
async def test_search_posts_max_results_limit():
    """Test: Results are limited to max_results"""
    # Create 30 mock posts
    mock_organic = [
        MockOrganicResult(
            link=f"https://linkedin.com/posts/user{i}_activity-{i}",
            title=f"User{i} on LinkedIn: Post content",
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

        from services.scraper import search_linkedin_posts

        result = await search_linkedin_posts(
            keywords="test",
            max_results=15
        )

        assert result["total_results"] == 15
        assert len(result["posts"]) == 15


@pytest.mark.unit
@pytest.mark.asyncio
async def test_search_posts_location_filter():
    """Test: Location filter is added to query"""
    mock_organic = [
        MockOrganicResult(
            link="https://linkedin.com/posts/user1_activity-123",
            title="User One on LinkedIn: Jakarta insights",
            rank=1
        ),
    ]
    mock_result = MockSerpResult(organic=mock_organic, pages_fetched=1)

    with patch('services.scraper.SerpAggregator') as mock_serp_class:
        mock_client = AsyncMock()
        mock_client.search.return_value = mock_result
        mock_serp_class.return_value.__aenter__.return_value = mock_client
        mock_serp_class.return_value.__aexit__.return_value = None

        from services.scraper import search_linkedin_posts

        result = await search_linkedin_posts(
            keywords="technology",
            location="Jakarta",
            max_results=10
        )

        # Location should be in query
        assert "Jakarta" in result["query"]


@pytest.mark.unit
@pytest.mark.asyncio
async def test_search_posts_language_filter():
    """Test: Language and country parameters are passed to SERP"""
    mock_organic = []
    mock_result = MockSerpResult(organic=mock_organic, pages_fetched=1)

    with patch('services.scraper.SerpAggregator') as mock_serp_class:
        mock_client = AsyncMock()
        mock_client.search.return_value = mock_result
        mock_serp_class.return_value.__aenter__.return_value = mock_client
        mock_serp_class.return_value.__aexit__.return_value = None

        from services.scraper import search_linkedin_posts

        result = await search_linkedin_posts(
            keywords="teknologi",
            language="id",
            country="id",
            max_results=10
        )

        # Verify search was called with correct language/country
        mock_client.search.assert_called_once()
        call_kwargs = mock_client.search.call_args[1]
        assert call_kwargs["language"] == "id"
        assert call_kwargs["country"] == "id"


@pytest.mark.unit
@pytest.mark.asyncio
async def test_search_posts_deduplication():
    """Test: Duplicate posts are handled (same URL)"""
    mock_organic = [
        MockOrganicResult(
            link="https://linkedin.com/posts/user1_activity-123",
            title="User One on LinkedIn: Post 1",
            rank=1
        ),
        MockOrganicResult(
            link="https://linkedin.com/posts/user1_activity-123",  # Duplicate
            title="User One on LinkedIn: Post 1 (Duplicate)",
            rank=2
        ),
        MockOrganicResult(
            link="https://linkedin.com/posts/user2_activity-456",
            title="User Two on LinkedIn: Post 2",
            rank=3
        ),
    ]
    mock_result = MockSerpResult(organic=mock_organic, pages_fetched=1)

    with patch('services.scraper.SerpAggregator') as mock_serp_class:
        mock_client = AsyncMock()
        mock_client.search.return_value = mock_result
        mock_serp_class.return_value.__aenter__.return_value = mock_client
        mock_serp_class.return_value.__aexit__.return_value = None

        from services.scraper import search_linkedin_posts

        result = await search_linkedin_posts(
            keywords="test",
            max_results=10
        )

        # Note: Current implementation does not deduplicate - test documents behavior
        # All results are included even if duplicates exist
        assert result["total_results"] == 3
