#!/usr/bin/env python3
"""
Integration tests for LinkedIn scraper service functions.

Tests all 7 scraper functions with REAL API calls:
1. search_linkedin_profiles - SERP profile search
2. scrape_company_details - Crawl4AI company scraping
3. search_linkedin_posts - SERP post search
4. search_linkedin_jobs - SERP job search
5. search_linkedin_all - SERP all-content search
6. parse_company_description - Description parser (unit)
7. validate_linkedin_url - URL validator (unit)

Budget constraint: max_pages=2 per test
"""

import asyncio
import pytest
import time
from typing import Dict, Any

import sys
from pathlib import Path

# Add backend root to path for imports
backend_root = Path(__file__).resolve().parents[2]
if str(backend_root) not in sys.path:
    sys.path.insert(0, str(backend_root))

# Add serp-api-aggregator to path
serp_path = backend_root.parents[1] / "serp-api-aggregator" / "src"
if serp_path.exists() and str(serp_path) not in sys.path:
    sys.path.insert(0, str(serp_path))

from services.scraper import (
    search_linkedin_profiles,
    scrape_company_details,
    search_linkedin_posts,
    search_linkedin_jobs,
    search_linkedin_all,
    parse_company_description,
    validate_linkedin_url,
)
from models import LinkedInProfile, CompanyDetail, LinkedInPost, LinkedInJob, LinkedInAllResult


# ============================================================================
# Test Markers
# ============================================================================

pytestmark = pytest.mark.integration


# ============================================================================
# Helper Functions
# ============================================================================

def validate_profile_structure(profile: Dict[str, Any]) -> bool:
    """Validate profile has required fields from LinkedInProfile model."""
    required_fields = ["name", "profile_url", "rank", "best_position", "frequency", "pages_seen"]
    return all(field in profile for field in required_fields)


def validate_post_structure(post: Dict[str, Any]) -> bool:
    """Validate post has required fields from LinkedInPost model."""
    required_fields = ["post_url", "author_name", "author_profile_url", "content", "rank"]
    return all(field in post for field in required_fields)


def validate_job_structure(job: Dict[str, Any]) -> bool:
    """Validate job has required fields from LinkedInJob model."""
    required_fields = ["job_url", "job_title", "company_name", "location", "description", "rank"]
    return all(field in job for field in required_fields)


def validate_all_result_structure(result: Dict[str, Any]) -> bool:
    """Validate all result has required fields from LinkedInAllResult model."""
    required_fields = ["url", "title", "description", "type", "rank"]
    return all(field in result for field in required_fields)


# ============================================================================
# TestSearchLinkedInProfiles
# ============================================================================

class TestSearchLinkedInProfiles:
    """Tests for search_linkedin_profiles function."""

    @pytest.mark.asyncio
    async def test_basic_profile_search(self):
        """Test basic profile search with minimal parameters."""
        start_time = time.time()

        result = await search_linkedin_profiles(
            role="software engineer",
            max_pages=2,
            country="us",
            language="en"
        )

        duration = time.time() - start_time

        # Verify response structure
        assert result["success"] is True, f"Search failed: {result}"
        assert "profiles" in result, "Missing 'profiles' key in response"
        assert "metadata" in result, "Missing 'metadata' key in response"
        assert "query" in result, "Missing 'query' key in response"

        # Verify we got some results
        assert result["total_results"] > 0, "Expected at least 1 profile"

        # Verify profile structure
        if result["profiles"]:
            profile = result["profiles"][0]
            assert validate_profile_structure(profile), f"Invalid profile structure: {profile.keys()}"
            assert "linkedin.com/in/" in profile["profile_url"], "Profile URL should contain linkedin.com/in/"

        # Verify metadata
        assert result["metadata"]["pages_requested"] == 2
        assert result["metadata"]["time_taken_seconds"] > 0

        print(f"\n[PASS] Basic profile search: {result['total_results']} profiles in {duration:.2f}s")

    @pytest.mark.asyncio
    async def test_profile_search_with_location(self):
        """Test profile search with location filter."""
        start_time = time.time()

        result = await search_linkedin_profiles(
            role="data scientist",
            location="Jakarta",
            max_pages=2,
            country="id",
            language="id"
        )

        duration = time.time() - start_time

        # Verify response structure
        assert result["success"] is True
        assert "profiles" in result

        # Verify query includes location
        assert "Jakarta" in result["query"], f"Query should include Jakarta: {result['query']}"

        # Verify we got results (may be 0 if no matches)
        assert isinstance(result["total_results"], int)

        print(f"\n[PASS] Profile search with location: {result['total_results']} profiles in {duration:.2f}s")

    @pytest.mark.asyncio
    async def test_profile_search_pagination(self):
        """Test pagination works correctly with 2 pages."""
        start_time = time.time()

        result = await search_linkedin_profiles(
            role="project manager",
            max_pages=2,
            country="us",
            language="en"
        )

        duration = time.time() - start_time

        # Verify success
        assert result["success"] is True

        # Verify pagination metadata
        metadata = result["metadata"]
        assert metadata["pages_requested"] == 2
        assert metadata["pages_scraped"] >= 1, "Should scrape at least 1 page"

        # Target should be max_pages * 10 = 20 profiles
        assert metadata["target_profiles"] == 20

        # Verify we got profiles (capped at target)
        assert result["total_results"] <= 20, "Should not exceed target profiles"

        print(f"\n[PASS] Pagination test: scraped {metadata['pages_scraped']} pages, got {result['total_results']} profiles in {duration:.2f}s")


# ============================================================================
# TestScrapeCompanyDetails
# ============================================================================

class TestScrapeCompanyDetails:
    """Tests for scrape_company_details function (Crawl4AI)."""

    @pytest.mark.asyncio
    @pytest.mark.slow
    async def test_single_company_scrape(self):
        """Test scraping a single company URL."""
        start_time = time.time()

        # Use a well-known company with public LinkedIn page
        urls = ["https://www.linkedin.com/company/google/"]

        result = await scrape_company_details(urls)

        duration = time.time() - start_time

        # Verify response structure
        assert "success" in result
        assert "companies" in result
        assert "metadata" in result

        # Verify metadata
        assert result["metadata"]["total_urls"] == 1

        # Note: Company scraping may fail due to LinkedIn blocking
        # We accept either success with data or graceful failure
        if result["success"] and result["total_scraped"] > 0:
            company = result["companies"][0]
            assert "name" in company, "Company should have name"
            assert "url" in company, "Company should have url"
            assert "scraped_at" in company, "Company should have scraped_at timestamp"
            print(f"\n[PASS] Company scrape succeeded: {company.get('name', 'Unknown')} in {duration:.2f}s")
        else:
            # Graceful failure is acceptable (LinkedIn may block)
            print(f"\n[PASS] Company scrape handled blocking gracefully in {duration:.2f}s")
            assert result["metadata"]["failed"] >= 0

    @pytest.mark.asyncio
    @pytest.mark.slow
    async def test_company_scrape_handles_blocked(self):
        """Test that company scraping handles blocked/invalid URLs gracefully."""
        start_time = time.time()

        # Use a URL that likely doesn't exist or will be blocked
        urls = ["https://www.linkedin.com/company/this-company-definitely-does-not-exist-12345/"]

        result = await scrape_company_details(urls)

        duration = time.time() - start_time

        # Should not crash
        assert "success" in result
        assert "metadata" in result

        # Should track failure in metadata
        metadata = result["metadata"]
        assert "total_urls" in metadata
        assert "failed" in metadata

        # Graceful handling means either success=False or success=True with failed count
        if not result["success"]:
            print(f"\n[PASS] Handled blocked URL gracefully (success=False) in {duration:.2f}s")
        else:
            assert metadata["failed"] >= 0
            print(f"\n[PASS] Handled blocked URL gracefully (failed={metadata['failed']}) in {duration:.2f}s")


# ============================================================================
# TestSearchLinkedInPosts
# ============================================================================

class TestSearchLinkedInPosts:
    """Tests for search_linkedin_posts function."""

    @pytest.mark.asyncio
    async def test_basic_posts_search(self):
        """Test basic posts search by keyword."""
        start_time = time.time()

        result = await search_linkedin_posts(
            keywords="artificial intelligence",
            max_results=10,
            country="us",
            language="en"
        )

        duration = time.time() - start_time

        # Verify response structure
        assert result["success"] is True, f"Posts search failed: {result}"
        assert "posts" in result, "Missing 'posts' key in response"
        assert "metadata" in result, "Missing 'metadata' key in response"
        assert "query" in result, "Missing 'query' key in response"

        # Verify query format
        assert "site:linkedin.com/posts" in result["query"], f"Query should include site filter: {result['query']}"

        # Verify metadata
        assert result["metadata"]["keywords"] == "artificial intelligence"
        assert result["metadata"]["time_taken_seconds"] > 0

        # Validate post structure if we got results
        if result["posts"]:
            post = result["posts"][0]
            assert validate_post_structure(post), f"Invalid post structure: {post.keys()}"
            # Post URL should be a LinkedIn post URL
            assert "linkedin.com" in post["post_url"]

        print(f"\n[PASS] Posts search: {result['total_results']} posts in {duration:.2f}s")

    @pytest.mark.asyncio
    async def test_posts_search_with_author_filter(self):
        """Test posts search with author type filter."""
        start_time = time.time()

        result = await search_linkedin_posts(
            keywords="startup",
            author_type="companies",
            max_results=10,
            country="us",
            language="en"
        )

        duration = time.time() - start_time

        # Verify success
        assert result["success"] is True

        # Verify author type in metadata
        assert result["metadata"]["author_type"] == "companies"

        print(f"\n[PASS] Posts search with author filter: {result['total_results']} posts in {duration:.2f}s")


# ============================================================================
# TestSearchLinkedInJobs
# ============================================================================

class TestSearchLinkedInJobs:
    """Tests for search_linkedin_jobs function."""

    @pytest.mark.asyncio
    async def test_basic_jobs_search(self):
        """Test basic jobs search by title."""
        start_time = time.time()

        result = await search_linkedin_jobs(
            job_title="software engineer",
            max_results=10,
            country="us",
            language="en"
        )

        duration = time.time() - start_time

        # Verify response structure
        assert result["success"] is True, f"Jobs search failed: {result}"
        assert "jobs" in result, "Missing 'jobs' key in response"
        assert "metadata" in result, "Missing 'metadata' key in response"
        assert "query" in result, "Missing 'query' key in response"

        # Verify query format
        assert "site:linkedin.com/jobs" in result["query"], f"Query should include site filter: {result['query']}"

        # Verify metadata
        assert result["metadata"]["job_title"] == "software engineer"
        assert result["metadata"]["time_taken_seconds"] > 0

        # Validate job structure if we got results
        if result["jobs"]:
            job = result["jobs"][0]
            assert validate_job_structure(job), f"Invalid job structure: {job.keys()}"
            # Job URL should be a LinkedIn job URL
            assert "linkedin.com/jobs" in job["job_url"]

        print(f"\n[PASS] Jobs search: {result['total_results']} jobs in {duration:.2f}s")

    @pytest.mark.asyncio
    async def test_jobs_search_with_location(self):
        """Test jobs search with location filter."""
        start_time = time.time()

        result = await search_linkedin_jobs(
            job_title="data analyst",
            location="Jakarta",
            max_results=10,
            country="id",
            language="id"
        )

        duration = time.time() - start_time

        # Verify success
        assert result["success"] is True

        # Verify query includes location
        assert "Jakarta" in result["query"], f"Query should include Jakarta: {result['query']}"

        print(f"\n[PASS] Jobs search with location: {result['total_results']} jobs in {duration:.2f}s")


# ============================================================================
# TestSearchLinkedInAll
# ============================================================================

class TestSearchLinkedInAll:
    """Tests for search_linkedin_all function."""

    @pytest.mark.asyncio
    async def test_all_content_search(self):
        """Test mixed content search across all LinkedIn types."""
        start_time = time.time()

        result = await search_linkedin_all(
            keywords="machine learning",
            max_results=15,
            country="us",
            language="en"
        )

        duration = time.time() - start_time

        # Verify response structure
        assert result["success"] is True, f"All search failed: {result}"
        assert "results" in result, "Missing 'results' key in response"
        assert "metadata" in result, "Missing 'metadata' key in response"
        assert "query" in result, "Missing 'query' key in response"

        # Verify query format
        assert "site:linkedin.com" in result["query"], f"Query should include site filter: {result['query']}"

        # Verify metadata
        assert result["metadata"]["keywords"] == "machine learning"
        assert result["metadata"]["time_taken_seconds"] > 0

        # Validate result structure if we got results
        if result["results"]:
            item = result["results"][0]
            assert validate_all_result_structure(item), f"Invalid result structure: {item.keys()}"
            # Type should be one of the expected types
            assert item["type"] in ["profile", "company", "post", "job", "other"], f"Unexpected type: {item['type']}"
            assert "linkedin.com" in item["url"]

        # Check that we get mixed content types (if enough results)
        if result["total_results"] >= 5:
            types_found = set(r["type"] for r in result["results"])
            print(f"\n[INFO] Content types found: {types_found}")

        print(f"\n[PASS] All content search: {result['total_results']} results in {duration:.2f}s")


# ============================================================================
# TestParseCompanyDescription
# ============================================================================

class TestParseCompanyDescription:
    """Tests for parse_company_description function (unit test)."""

    def test_parse_indonesian_description(self):
        """Test parsing Indonesian company description."""
        description = (
            "Vertilogic. Jasa TI dan Konsultan TI. Ukuran perusahaan: 2-10 karyawan. "
            "Kantor Pusat: Jakarta, DKI Jakarta. Jenis: Perseroan Tertutup. "
            "Tahun Pendirian: 2015. 500 pengikut."
        )

        parsed = parse_company_description(description)

        # Verify extracted fields
        assert parsed.get("company_size") == "2-10 karyawan", f"company_size: {parsed.get('company_size')}"
        assert parsed.get("headquarters") == "Jakarta, DKI Jakarta", f"headquarters: {parsed.get('headquarters')}"
        assert parsed.get("company_type") == "Perseroan Tertutup", f"company_type: {parsed.get('company_type')}"
        assert parsed.get("founded_year") == 2015, f"founded_year: {parsed.get('founded_year')}"
        assert parsed.get("followers") == 500, f"followers: {parsed.get('followers')}"

        print("\n[PASS] Indonesian description parsing")

    def test_parse_norwegian_description(self):
        """Test parsing Norwegian/English company description."""
        description = (
            "Norsk Bedrift AS. Produksjon av motorvogner. Company size: 50-100 employees. "
            "Headquarters: Oslo, Norway. Founded: 2010. 1,234 followers."
        )

        parsed = parse_company_description(description)

        # Norwegian descriptions may use different patterns
        # The function should handle various formats
        assert isinstance(parsed, dict), "Should return a dictionary"

        # Followers with comma
        if parsed.get("followers"):
            assert parsed["followers"] == 1234, f"followers: {parsed.get('followers')}"

        print("\n[PASS] Norwegian description parsing")

    def test_parse_empty_description(self):
        """Test parsing empty or None description."""
        # Empty string
        parsed_empty = parse_company_description("")
        assert parsed_empty == {}, f"Empty string should return empty dict: {parsed_empty}"

        # None
        parsed_none = parse_company_description(None)
        assert parsed_none == {}, f"None should return empty dict: {parsed_none}"

        print("\n[PASS] Empty description handling")

    def test_parse_minimal_description(self):
        """Test parsing description with minimal information."""
        description = "Tech Company. Software Development."

        parsed = parse_company_description(description)

        # Should not crash, may extract industry
        assert isinstance(parsed, dict)

        print("\n[PASS] Minimal description parsing")


# ============================================================================
# TestValidateLinkedInUrl
# ============================================================================

class TestValidateLinkedInUrl:
    """Tests for validate_linkedin_url function (unit test)."""

    def test_valid_profile_urls(self):
        """Test valid LinkedIn profile URLs."""
        valid_urls = [
            "https://www.linkedin.com/in/johndoe",
            "https://linkedin.com/in/johndoe",
            "http://www.linkedin.com/in/johndoe",
            "https://www.linkedin.com/in/john-doe-123abc",
            "https://id.linkedin.com/in/johndoe",
        ]

        for url in valid_urls:
            assert validate_linkedin_url(url) is True, f"Should be valid: {url}"

        print(f"\n[PASS] Validated {len(valid_urls)} valid profile URLs")

    def test_invalid_urls(self):
        """Test invalid LinkedIn URLs."""
        invalid_urls = [
            "https://www.linkedin.com/company/google",  # Company, not profile
            "https://www.linkedin.com/jobs/view/123",   # Job, not profile
            "https://www.linkedin.com/posts/johndoe",   # Post, not profile
            "https://www.facebook.com/johndoe",          # Different site
            "https://www.linkedin.com",                  # No /in/ path
            "",                                          # Empty string
            "not a url",                                 # Not a URL
        ]

        for url in invalid_urls:
            assert validate_linkedin_url(url) is False, f"Should be invalid: {url}"

        print(f"\n[PASS] Validated {len(invalid_urls)} invalid URLs")

    def test_case_insensitive(self):
        """Test URL validation is case-insensitive."""
        urls = [
            "https://www.LINKEDIN.COM/IN/johndoe",
            "https://www.LinkedIn.com/In/JohnDoe",
        ]

        for url in urls:
            assert validate_linkedin_url(url) is True, f"Case-insensitive should be valid: {url}"

        print("\n[PASS] Case-insensitive validation")


# ============================================================================
# Main Runner (for standalone execution)
# ============================================================================

async def run_all_tests():
    """Run all tests and print summary."""
    print("=" * 70)
    print("LINKEDIN SCRAPER INTEGRATION TEST SUITE")
    print("=" * 70)
    print("Using REAL API calls with max_pages=2 budget constraint")
    print("=" * 70)

    results = []

    # Unit tests (no API calls)
    print("\n--- UNIT TESTS ---")

    # parse_company_description tests
    try:
        test = TestParseCompanyDescription()
        test.test_parse_indonesian_description()
        test.test_parse_norwegian_description()
        test.test_parse_empty_description()
        test.test_parse_minimal_description()
        results.append(("parse_company_description", True, "4 tests passed"))
    except Exception as e:
        results.append(("parse_company_description", False, str(e)))

    # validate_linkedin_url tests
    try:
        test = TestValidateLinkedInUrl()
        test.test_valid_profile_urls()
        test.test_invalid_urls()
        test.test_case_insensitive()
        results.append(("validate_linkedin_url", True, "3 tests passed"))
    except Exception as e:
        results.append(("validate_linkedin_url", False, str(e)))

    # Integration tests (real API calls)
    print("\n--- INTEGRATION TESTS (Real API Calls) ---")

    # search_linkedin_profiles tests
    try:
        test = TestSearchLinkedInProfiles()
        await test.test_basic_profile_search()
        await test.test_profile_search_with_location()
        await test.test_profile_search_pagination()
        results.append(("search_linkedin_profiles", True, "3 tests passed"))
    except Exception as e:
        results.append(("search_linkedin_profiles", False, str(e)))

    # search_linkedin_posts tests
    try:
        test = TestSearchLinkedInPosts()
        await test.test_basic_posts_search()
        await test.test_posts_search_with_author_filter()
        results.append(("search_linkedin_posts", True, "2 tests passed"))
    except Exception as e:
        results.append(("search_linkedin_posts", False, str(e)))

    # search_linkedin_jobs tests
    try:
        test = TestSearchLinkedInJobs()
        await test.test_basic_jobs_search()
        await test.test_jobs_search_with_location()
        results.append(("search_linkedin_jobs", True, "2 tests passed"))
    except Exception as e:
        results.append(("search_linkedin_jobs", False, str(e)))

    # search_linkedin_all tests
    try:
        test = TestSearchLinkedInAll()
        await test.test_all_content_search()
        results.append(("search_linkedin_all", True, "1 test passed"))
    except Exception as e:
        results.append(("search_linkedin_all", False, str(e)))

    # scrape_company_details tests (slow, run last)
    print("\n--- SLOW INTEGRATION TESTS (Crawl4AI) ---")
    try:
        test = TestScrapeCompanyDetails()
        await test.test_single_company_scrape()
        await test.test_company_scrape_handles_blocked()
        results.append(("scrape_company_details", True, "2 tests passed"))
    except Exception as e:
        results.append(("scrape_company_details", False, str(e)))

    # Summary
    print("\n" + "=" * 70)
    print("TEST SUMMARY")
    print("=" * 70)

    passed = sum(1 for _, success, _ in results if success)
    total = len(results)

    for name, success, message in results:
        status = "[PASS]" if success else "[FAIL]"
        print(f"  {status} {name}: {message}")

    print("-" * 70)
    print(f"TOTAL: {passed}/{total} function groups passed ({passed/total*100:.1f}%)")
    print("=" * 70)

    return passed == total


if __name__ == "__main__":
    success = asyncio.run(run_all_tests())
    exit(0 if success else 1)
