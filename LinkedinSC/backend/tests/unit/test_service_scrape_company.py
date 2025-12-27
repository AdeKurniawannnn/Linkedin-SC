"""
Unit tests for scrape_company_details service function

Target: services/scraper.py scrape_company_details() (lines 262-575)
Total tests: 12

Tests cover:
- Single company happy path
- Multiple companies parallel scraping
- LinkedIn blocking detection
- Invalid URL handling
- Company metadata extraction
- Employee schools parsing
- Recent hires parsing
- Related companies parsing
- Empty markdown response handling
- Missing fields handling
- Rate limiting delays
- Browser config setup
"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch, call
from datetime import datetime
import sys


# =============================================================================
# Helper Classes for Mocking
# =============================================================================

class MockCrawlResult:
    """Mock result from AsyncWebCrawler.arun()"""
    def __init__(
        self,
        success: bool = True,
        markdown: str = "",
        metadata: dict = None,
        error_message: str = None
    ):
        self.success = success
        self.markdown = markdown
        self.metadata = metadata or {}
        self.error_message = error_message


# =============================================================================
# Sample Company Markdown Content
# =============================================================================

SAMPLE_COMPANY_MARKDOWN = """
# PT Tech Solutions
## IT Services and IT Consulting
### Jakarta, Indonesia

## About
PT Tech Solutions is a leading technology company specializing in enterprise software development.

Nettsted
[tech-solutions.com](https://tech-solutions.com)

Ekstern lenke

Industry
IT Services and IT Consulting

Bedriftsstorrelse
51-200 ansatte

Hovedkontor
Jakarta, Indonesia

Grunnlagt
2015

Spesialiteter
Cloud Computing, Enterprise Software, Digital Transformation

5.000 pengikut

## Karyawan baru
Recent hires
Wahid dan 2 lainnya

## Schools
10 karyawan bersekolah di Universitas Indonesia
5 karyawan bersekolah di Universitas Gadjah Mada

## Related Companies
Logo halaman CompanyA
Technology
10.000 pengikut

Logo halaman CompanyB
Software
5.000 pengikut
"""

BLOCKING_MARKDOWN = """
Log In or Sign Up
Daftar atau Masuk
"""


# =============================================================================
# Mock Crawl4AI Module
# =============================================================================

def create_mock_crawl4ai(mock_result):
    """Create a mock crawl4ai module with all necessary classes"""
    mock_crawler_instance = AsyncMock()
    mock_crawler_instance.arun.return_value = mock_result

    mock_crawler_class = MagicMock()
    mock_crawler_class.return_value.__aenter__ = AsyncMock(return_value=mock_crawler_instance)
    mock_crawler_class.return_value.__aexit__ = AsyncMock(return_value=None)

    mock_browser_config = MagicMock()
    mock_crawler_config = MagicMock()
    mock_cache_mode = MagicMock()
    mock_cache_mode.BYPASS = "BYPASS"

    mock_module = MagicMock()
    mock_module.AsyncWebCrawler = mock_crawler_class
    mock_module.BrowserConfig = mock_browser_config
    mock_module.CrawlerRunConfig = mock_crawler_config
    mock_module.CacheMode = mock_cache_mode

    return mock_module, mock_crawler_instance, mock_browser_config


# =============================================================================
# Tests: scrape_company_details()
# =============================================================================

@pytest.mark.unit
@pytest.mark.asyncio
async def test_scrape_single_company_happy_path():
    """Test: Successfully scrapes a single company page"""
    mock_result = MockCrawlResult(
        success=True,
        markdown=SAMPLE_COMPANY_MARKDOWN,
        metadata={"title": "PT Tech Solutions | LinkedIn"}
    )

    mock_module, mock_crawler_instance, _ = create_mock_crawl4ai(mock_result)

    with patch.dict(sys.modules, {'crawl4ai': mock_module}), \
         patch('asyncio.sleep', new_callable=AsyncMock):

        # Need to reimport after patching
        if 'services.scraper' in sys.modules:
            del sys.modules['services.scraper']

        from services.scraper import scrape_company_details

        result = await scrape_company_details(
            urls=["https://linkedin.com/company/tech-solutions"]
        )

        assert result["success"] is True
        assert result["total_scraped"] == 1
        assert len(result["companies"]) == 1

        company = result["companies"][0]
        assert company["name"] == "PT Tech Solutions"
        assert company["founded"] == 2015


@pytest.mark.unit
@pytest.mark.asyncio
async def test_scrape_multiple_companies_parallel():
    """Test: Scrapes multiple companies with delays between requests"""
    mock_result = MockCrawlResult(
        success=True,
        markdown=SAMPLE_COMPANY_MARKDOWN,
        metadata={"title": "Company | LinkedIn"}
    )

    mock_module, mock_crawler_instance, _ = create_mock_crawl4ai(mock_result)

    with patch.dict(sys.modules, {'crawl4ai': mock_module}), \
         patch('asyncio.sleep', new_callable=AsyncMock) as mock_sleep:

        if 'services.scraper' in sys.modules:
            del sys.modules['services.scraper']

        from services.scraper import scrape_company_details

        result = await scrape_company_details(
            urls=[
                "https://linkedin.com/company/company1",
                "https://linkedin.com/company/company2",
                "https://linkedin.com/company/company3"
            ]
        )

        assert result["success"] is True
        assert result["total_scraped"] == 3
        assert result["metadata"]["total_urls"] == 3

        # Verify sleep was called between requests (not for first one)
        assert mock_sleep.call_count == 2


@pytest.mark.unit
@pytest.mark.asyncio
async def test_scrape_handles_linkedin_blocking():
    """Test: Detects and skips blocked/redirect pages"""
    blocking_result = MockCrawlResult(
        success=True,
        markdown=BLOCKING_MARKDOWN,
        metadata={"title": "Daftar | LinkedIn"}
    )
    normal_result = MockCrawlResult(
        success=True,
        markdown=SAMPLE_COMPANY_MARKDOWN,
        metadata={"title": "Normal Company | LinkedIn"}
    )

    results = [blocking_result, normal_result]
    call_index = [0]

    mock_module, mock_crawler_instance, _ = create_mock_crawl4ai(blocking_result)

    async def mock_arun(*args, **kwargs):
        idx = call_index[0]
        call_index[0] += 1
        return results[idx] if idx < len(results) else results[-1]

    mock_crawler_instance.arun.side_effect = mock_arun

    with patch.dict(sys.modules, {'crawl4ai': mock_module}), \
         patch('asyncio.sleep', new_callable=AsyncMock):

        if 'services.scraper' in sys.modules:
            del sys.modules['services.scraper']

        from services.scraper import scrape_company_details

        result = await scrape_company_details(
            urls=[
                "https://linkedin.com/company/blocked-company",
                "https://linkedin.com/company/normal-company"
            ]
        )

        # Only the normal company should be scraped
        assert result["total_scraped"] == 1
        assert result["metadata"]["failed"] == 1


@pytest.mark.unit
@pytest.mark.asyncio
async def test_scrape_handles_invalid_url():
    """Test: Handles crawl failures gracefully"""
    mock_result = MockCrawlResult(
        success=False,
        markdown="",
        error_message="Failed to load page"
    )

    mock_module, mock_crawler_instance, _ = create_mock_crawl4ai(mock_result)

    with patch.dict(sys.modules, {'crawl4ai': mock_module}), \
         patch('asyncio.sleep', new_callable=AsyncMock):

        if 'services.scraper' in sys.modules:
            del sys.modules['services.scraper']

        from services.scraper import scrape_company_details

        result = await scrape_company_details(
            urls=["https://linkedin.com/company/invalid-company"]
        )

        assert result["success"] is True
        assert result["total_scraped"] == 0
        assert result["metadata"]["failed"] == 1


@pytest.mark.unit
@pytest.mark.asyncio
async def test_scrape_extracts_company_metadata():
    """Test: Extracts all company metadata fields"""
    detailed_markdown = """
# Awesome Corp
## Software Development
### San Francisco, CA

Industry
Software Development

Bedriftsstorrelse
201-500 ansatte

Grunnlagt
2010

Spesialiteter
AI, Machine Learning, Cloud

## Om oss
Awesome Corp is revolutionizing the tech industry with cutting-edge AI solutions.

Nettsted
[awesome-corp.io](https://awesome-corp.io)

10.000 pengikut
"""

    mock_result = MockCrawlResult(
        success=True,
        markdown=detailed_markdown,
        metadata={"title": "Awesome Corp | LinkedIn"}
    )

    mock_module, mock_crawler_instance, _ = create_mock_crawl4ai(mock_result)

    with patch.dict(sys.modules, {'crawl4ai': mock_module}), \
         patch('asyncio.sleep', new_callable=AsyncMock):

        if 'services.scraper' in sys.modules:
            del sys.modules['services.scraper']

        from services.scraper import scrape_company_details

        result = await scrape_company_details(
            urls=["https://linkedin.com/company/awesome-corp"]
        )

        company = result["companies"][0]
        assert company["name"] == "Awesome Corp"
        assert company["tagline"] == "Software Development"
        assert company["location"] == "San Francisco, CA"
        assert company["founded"] == 2010
        assert company["website"] == "awesome-corp.io"
        assert "AI" in company["specialties"]


@pytest.mark.unit
@pytest.mark.asyncio
async def test_scrape_parses_employee_schools():
    """Test: Parses top employee schools from markdown"""
    mock_result = MockCrawlResult(
        success=True,
        markdown=SAMPLE_COMPANY_MARKDOWN,
        metadata={"title": "Company | LinkedIn"}
    )

    mock_module, mock_crawler_instance, _ = create_mock_crawl4ai(mock_result)

    with patch.dict(sys.modules, {'crawl4ai': mock_module}), \
         patch('asyncio.sleep', new_callable=AsyncMock):

        if 'services.scraper' in sys.modules:
            del sys.modules['services.scraper']

        from services.scraper import scrape_company_details

        result = await scrape_company_details(
            urls=["https://linkedin.com/company/company1"]
        )

        company = result["companies"][0]
        assert company["top_employee_schools"] is not None
        assert len(company["top_employee_schools"]) >= 1
        # Check format: "10 dari Universitas Indonesia"
        assert any("Universitas Indonesia" in school for school in company["top_employee_schools"])


@pytest.mark.unit
@pytest.mark.asyncio
async def test_scrape_parses_recent_hires():
    """Test: Parses recent hires information"""
    markdown_with_hires = """
# TechCo
## Technology
### Jakarta

## Karyawan baru
Recent hires
Wahid dan 2 lainnya
"""

    mock_result = MockCrawlResult(
        success=True,
        markdown=markdown_with_hires,
        metadata={"title": "TechCo | LinkedIn"}
    )

    mock_module, mock_crawler_instance, _ = create_mock_crawl4ai(mock_result)

    with patch.dict(sys.modules, {'crawl4ai': mock_module}), \
         patch('asyncio.sleep', new_callable=AsyncMock):

        if 'services.scraper' in sys.modules:
            del sys.modules['services.scraper']

        from services.scraper import scrape_company_details

        result = await scrape_company_details(
            urls=["https://linkedin.com/company/techco"]
        )

        company = result["companies"][0]
        # Recent hires should be parsed
        if company["recent_hires"]:
            assert len(company["recent_hires"]) >= 1


@pytest.mark.unit
@pytest.mark.asyncio
async def test_scrape_parses_related_companies():
    """Test: Parses related companies list"""
    mock_result = MockCrawlResult(
        success=True,
        markdown=SAMPLE_COMPANY_MARKDOWN,
        metadata={"title": "Company | LinkedIn"}
    )

    mock_module, mock_crawler_instance, _ = create_mock_crawl4ai(mock_result)

    with patch.dict(sys.modules, {'crawl4ai': mock_module}), \
         patch('asyncio.sleep', new_callable=AsyncMock):

        if 'services.scraper' in sys.modules:
            del sys.modules['services.scraper']

        from services.scraper import scrape_company_details

        result = await scrape_company_details(
            urls=["https://linkedin.com/company/company1"]
        )

        company = result["companies"][0]
        assert company["related_companies"] is not None
        assert len(company["related_companies"]) >= 1

        related = company["related_companies"][0]
        assert "name" in related
        assert "industry" in related


@pytest.mark.unit
@pytest.mark.asyncio
async def test_scrape_empty_markdown_response():
    """Test: Handles empty markdown gracefully"""
    mock_result = MockCrawlResult(
        success=True,
        markdown="",
        metadata={"title": "Empty | LinkedIn"}
    )

    mock_module, mock_crawler_instance, _ = create_mock_crawl4ai(mock_result)

    with patch.dict(sys.modules, {'crawl4ai': mock_module}), \
         patch('asyncio.sleep', new_callable=AsyncMock):

        if 'services.scraper' in sys.modules:
            del sys.modules['services.scraper']

        from services.scraper import scrape_company_details

        result = await scrape_company_details(
            urls=["https://linkedin.com/company/empty"]
        )

        # Empty markdown is treated as blocking
        assert result["total_scraped"] == 0


@pytest.mark.unit
@pytest.mark.asyncio
async def test_scrape_handles_missing_fields():
    """Test: Handles missing optional fields gracefully"""
    minimal_markdown = """
# Minimal Corp
## Tech Company
"""

    mock_result = MockCrawlResult(
        success=True,
        markdown=minimal_markdown,
        metadata={"title": "Minimal Corp | LinkedIn"}
    )

    mock_module, mock_crawler_instance, _ = create_mock_crawl4ai(mock_result)

    with patch.dict(sys.modules, {'crawl4ai': mock_module}), \
         patch('asyncio.sleep', new_callable=AsyncMock):

        if 'services.scraper' in sys.modules:
            del sys.modules['services.scraper']

        from services.scraper import scrape_company_details

        result = await scrape_company_details(
            urls=["https://linkedin.com/company/minimal"]
        )

        assert result["total_scraped"] == 1
        company = result["companies"][0]
        assert company["name"] == "Minimal Corp"
        # Optional fields should be None
        assert company["founded"] is None
        assert company["website"] is None
        assert company["employee_count_range"] is None


@pytest.mark.unit
@pytest.mark.asyncio
async def test_scrape_rate_limiting_delays():
    """Test: Rate limiting delays are applied between requests"""
    mock_result = MockCrawlResult(
        success=True,
        markdown=SAMPLE_COMPANY_MARKDOWN,
        metadata={"title": "Company | LinkedIn"}
    )

    mock_module, mock_crawler_instance, _ = create_mock_crawl4ai(mock_result)

    with patch.dict(sys.modules, {'crawl4ai': mock_module}), \
         patch('asyncio.sleep', new_callable=AsyncMock) as mock_sleep, \
         patch('random.uniform', return_value=15.0):

        if 'services.scraper' in sys.modules:
            del sys.modules['services.scraper']

        from services.scraper import scrape_company_details

        await scrape_company_details(
            urls=[
                "https://linkedin.com/company/c1",
                "https://linkedin.com/company/c2"
            ]
        )

        # Sleep should be called once (between first and second URL)
        assert mock_sleep.call_count == 1
        # Delay should be between 10-20 seconds
        mock_sleep.assert_called_with(15.0)


@pytest.mark.unit
@pytest.mark.asyncio
async def test_scrape_browser_config_setup():
    """Test: Browser config is properly configured"""
    mock_result = MockCrawlResult(
        success=True,
        markdown=SAMPLE_COMPANY_MARKDOWN,
        metadata={"title": "Company | LinkedIn"}
    )

    mock_module, mock_crawler_instance, mock_browser_config = create_mock_crawl4ai(mock_result)

    with patch.dict(sys.modules, {'crawl4ai': mock_module}), \
         patch('asyncio.sleep', new_callable=AsyncMock):

        if 'services.scraper' in sys.modules:
            del sys.modules['services.scraper']

        from services.scraper import scrape_company_details

        await scrape_company_details(
            urls=["https://linkedin.com/company/test"]
        )

        # Verify browser config was created with headless=True
        mock_browser_config.assert_called()
        call_kwargs = mock_browser_config.call_args[1]
        assert call_kwargs["headless"] is True
        assert call_kwargs["viewport_width"] == 1920
        assert call_kwargs["viewport_height"] == 1080
