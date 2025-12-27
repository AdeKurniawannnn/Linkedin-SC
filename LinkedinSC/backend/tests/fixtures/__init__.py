"""
Test fixtures for LinkedinSC backend

Shared test data, mock responses, and fixture utilities.

Modules:
- mock_serp_responses.py: Factory functions for mock SERP API responses
- mock_crawl_responses.py: Factory functions for mock Crawl4AI responses
"""

from tests.fixtures.mock_serp_responses import (
    MockOrganicResult,
    MockSearchResult,
    create_mock_organic_result,
    create_mock_search_result,
    SAMPLE_PROFILE_RESULTS,
    SAMPLE_COMPANY_RESULTS,
)

from tests.fixtures.mock_crawl_responses import (
    MockCrawlResult,
    create_mock_crawl_result,
    SAMPLE_COMPANY_MARKDOWN,
    SAMPLE_COMPANY_MARKDOWN_INDONESIAN,
    SAMPLE_COMPANY_MARKDOWN_NORWEGIAN,
    SAMPLE_COMPANY_MARKDOWN_BLOCKED,
)

__all__ = [
    # SERP mocks
    "MockOrganicResult",
    "MockSearchResult",
    "create_mock_organic_result",
    "create_mock_search_result",
    "SAMPLE_PROFILE_RESULTS",
    "SAMPLE_COMPANY_RESULTS",
    # Crawl mocks
    "MockCrawlResult",
    "create_mock_crawl_result",
    "SAMPLE_COMPANY_MARKDOWN",
    "SAMPLE_COMPANY_MARKDOWN_INDONESIAN",
    "SAMPLE_COMPANY_MARKDOWN_NORWEGIAN",
    "SAMPLE_COMPANY_MARKDOWN_BLOCKED",
]
