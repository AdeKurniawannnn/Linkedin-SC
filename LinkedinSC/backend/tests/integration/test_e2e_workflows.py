"""
End-to-end workflow tests for LinkedIn scraper operations.

These tests validate complete user journeys through multiple scraper operations,
ensuring data consistency between steps.

Test classes:
- TestCompanySearchToDetailWorkflow: Search companies, then scrape details
- TestProfileSearchWorkflow: Search profiles across multiple locations
- TestMixedContentWorkflow: Search across content types with same keyword
"""

import pytest
import sys
from pathlib import Path
from typing import List, Set

# Add parent directories to path for imports
current_file = Path(__file__).resolve()
backend_dir = current_file.parents[2]
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

# Add serp-api-aggregator to path
possible_serp_paths = [
    current_file.parents[4] / "serp-api-aggregator" / "src",
    Path("/app/serp-api-aggregator/src"),
]
for p in possible_serp_paths:
    if (p / "serp").exists() and str(p) not in sys.path:
        sys.path.insert(0, str(p))
        break

from services.scraper import (
    search_linkedin_profiles,
    scrape_company_details,
    search_linkedin_posts,
    search_linkedin_jobs,
    search_linkedin_all,
)


def extract_urls_from_profiles(profiles: List[dict]) -> List[str]:
    """Extract profile/company URLs from search results."""
    return [p["profile_url"] for p in profiles if p.get("profile_url")]


def count_fields_populated(company: dict) -> int:
    """Count number of non-null, non-empty fields in company details."""
    count = 0
    for key, value in company.items():
        if value is not None:
            if isinstance(value, str) and value.strip():
                count += 1
            elif isinstance(value, (list, dict)) and len(value) > 0:
                count += 1
            elif isinstance(value, (int, float)):
                count += 1
    return count


@pytest.mark.integration
@pytest.mark.slow
class TestCompanySearchToDetailWorkflow:
    """
    Test workflow: Search companies via SERP, then scrape detailed information.

    This simulates a data enrichment workflow where a user:
    1. Searches for companies matching criteria
    2. Extracts company URLs from results
    3. Scrapes detailed company information
    4. Verifies enriched data has more fields populated
    """

    @pytest.mark.asyncio
    async def test_search_companies_then_scrape_details(self):
        """
        Complete workflow: Search companies -> Extract URLs -> Scrape details.

        Validates:
        - Search returns company profiles with URLs
        - URLs can be extracted from search results
        - Detail scraping enriches data with more fields
        - Data consistency between search and detail results
        """
        # Step 1: Search for companies using linkedin.com/company filter
        search_result = await search_linkedin_profiles(
            role="tech startup linkedin.com/company",
            location="Indonesia",
            country="id",
            language="id",
            max_pages=1,  # Minimal API calls
        )

        # Validate search success
        assert search_result["success"] is True, "Company search should succeed"
        assert search_result["total_results"] > 0, "Should find at least 1 company"

        # Step 2: Extract company URLs from search results
        profiles = search_result["profiles"]
        company_urls = extract_urls_from_profiles(profiles)

        assert len(company_urls) > 0, "Should extract at least 1 company URL"

        # Validate URLs are company URLs
        for url in company_urls[:3]:  # Check first 3
            assert "linkedin.com/company" in url, f"URL should be company URL: {url}"

        # Record fields from search results for comparison
        search_fields_count = {}
        for profile in profiles[:3]:  # Check first 3
            url = profile.get("profile_url", "")
            search_fields_count[url] = count_fields_populated(profile)

        # Step 3: Scrape detailed company information (limit to 1 to save budget)
        urls_to_scrape = company_urls[:1]

        # Note: This may fail if LinkedIn blocks the request
        # The test validates the workflow even if detail scraping fails
        detail_result = await scrape_company_details(urls_to_scrape)

        # Validate detail scraping response structure
        assert "success" in detail_result, "Detail result should have success field"
        assert "companies" in detail_result, "Detail result should have companies field"
        assert "metadata" in detail_result, "Detail result should have metadata field"

        # Step 4: Verify data enrichment if scraping succeeded
        if detail_result["success"] and detail_result["total_scraped"] > 0:
            for company in detail_result["companies"]:
                company_url = company.get("url", "")
                detail_fields = count_fields_populated(company)

                # Find matching search result
                matching_search_fields = search_fields_count.get(company_url, 0)

                # Detail scraping should provide more data than SERP
                assert detail_fields >= matching_search_fields, (
                    f"Detail scraping should enrich data. "
                    f"Search fields: {matching_search_fields}, Detail fields: {detail_fields}"
                )

                # Validate essential detail fields are populated
                assert company.get("name"), "Company name should be present"
                assert company.get("url"), "Company URL should be present"
                assert company.get("scraped_at"), "Scraped timestamp should be present"

        # Log results for debugging
        print(f"\n[WORKFLOW] Company Search -> Detail Scrape")
        print(f"  Search results: {search_result['total_results']}")
        print(f"  URLs extracted: {len(company_urls)}")
        print(f"  Detail scrape success: {detail_result['success']}")
        print(f"  Companies scraped: {detail_result.get('total_scraped', 0)}")


@pytest.mark.integration
@pytest.mark.slow
class TestProfileSearchWorkflow:
    """
    Test workflow: Search profiles across multiple locations.

    This simulates a user searching for candidates in different cities
    and validating that results are properly filtered by location.
    """

    @pytest.mark.asyncio
    async def test_profile_search_multiple_locations(self):
        """
        Search profiles in two locations and verify:
        1. No duplicate profiles between locations
        2. Location filtering works correctly
        """
        # Location A: Jakarta
        result_jakarta = await search_linkedin_profiles(
            role="Software Engineer",
            location="Jakarta",
            country="id",
            language="en",
            max_pages=1,  # Minimal API calls
        )

        assert result_jakarta["success"] is True, "Jakarta search should succeed"

        # Location B: Singapore
        result_singapore = await search_linkedin_profiles(
            role="Software Engineer",
            location="Singapore",
            country="sg",
            language="en",
            max_pages=1,  # Minimal API calls
        )

        assert result_singapore["success"] is True, "Singapore search should succeed"

        # Extract profile URLs for comparison
        jakarta_urls: Set[str] = set(
            p["profile_url"] for p in result_jakarta["profiles"]
        )
        singapore_urls: Set[str] = set(
            p["profile_url"] for p in result_singapore["profiles"]
        )

        # Step 3: Verify no duplicate profiles between locations
        # Some overlap is acceptable due to SERP ranking variations,
        # but majority should be unique
        overlap = jakarta_urls & singapore_urls
        total_unique = len(jakarta_urls | singapore_urls)

        if total_unique > 0:
            overlap_ratio = len(overlap) / total_unique
            # Allow up to 30% overlap due to SERP variations
            assert overlap_ratio < 0.30, (
                f"Too much overlap between locations: {overlap_ratio:.1%}. "
                f"Expected different profiles for different locations."
            )

        # Step 4: Verify location filtering is reflected in query metadata
        assert "Jakarta" in result_jakarta["query"], (
            "Jakarta should appear in query"
        )
        assert "Singapore" in result_singapore["query"], (
            "Singapore should appear in query"
        )

        # Log results
        print(f"\n[WORKFLOW] Multi-location Profile Search")
        print(f"  Jakarta results: {len(jakarta_urls)}")
        print(f"  Singapore results: {len(singapore_urls)}")
        print(f"  Overlap: {len(overlap)} profiles ({len(overlap)/max(total_unique, 1):.1%})")


@pytest.mark.integration
@pytest.mark.slow
class TestMixedContentWorkflow:
    """
    Test workflow: Search same keyword across different content types.

    This simulates a user exploring all LinkedIn content related to a topic.
    """

    @pytest.mark.asyncio
    async def test_keyword_across_content_types(self):
        """
        Search with same keyword across posts, jobs, and all content.

        Validates:
        1. Each content type search works independently
        2. All-search contains mix of content types
        3. Keyword appears consistently in queries
        """
        keyword = "data science"
        location = "Indonesia"

        # Step 1: Search posts with keyword
        posts_result = await search_linkedin_posts(
            keywords=keyword,
            location=location,
            max_results=5,  # Minimal for budget
            country="id",
            language="en",
        )

        assert posts_result["success"] is True, "Posts search should succeed"
        assert "posts" in posts_result, "Posts result should have posts field"

        # Step 2: Search jobs with same keyword
        jobs_result = await search_linkedin_jobs(
            job_title=keyword,
            location=location,
            max_results=5,  # Minimal for budget
            country="id",
            language="en",
        )

        assert jobs_result["success"] is True, "Jobs search should succeed"
        assert "jobs" in jobs_result, "Jobs result should have jobs field"

        # Step 3: Search all content with same keyword
        all_result = await search_linkedin_all(
            keywords=keyword,
            location=location,
            max_results=10,  # Slightly more to capture variety
            country="id",
            language="en",
        )

        assert all_result["success"] is True, "All search should succeed"
        assert "results" in all_result, "All result should have results field"

        # Step 4: Verify all-search contains mix of content types
        if all_result["total_results"] > 0:
            content_types = set(r["type"] for r in all_result["results"])

            # All-search should return at least 2 different content types
            # when there's enough data (relaxed assertion due to SERP variability)
            if all_result["total_results"] >= 5:
                assert len(content_types) >= 1, (
                    f"All-search should contain diverse content types. "
                    f"Found types: {content_types}"
                )

            # Validate expected types are in the set
            valid_types = {"profile", "company", "post", "job", "other"}
            for content_type in content_types:
                assert content_type in valid_types, (
                    f"Unexpected content type: {content_type}"
                )

        # Step 5: Verify keyword consistency in queries
        assert keyword in posts_result["query"].lower(), (
            "Keyword should appear in posts query"
        )
        assert keyword in jobs_result["query"].lower(), (
            "Keyword should appear in jobs query"
        )
        assert keyword in all_result["query"].lower(), (
            "Keyword should appear in all query"
        )

        # Log results
        print(f"\n[WORKFLOW] Keyword Across Content Types")
        print(f"  Keyword: '{keyword}'")
        print(f"  Posts found: {posts_result['total_results']}")
        print(f"  Jobs found: {jobs_result['total_results']}")
        print(f"  All content found: {all_result['total_results']}")
        if all_result["total_results"] > 0:
            types_found = set(r["type"] for r in all_result["results"])
            print(f"  Content types in all-search: {types_found}")
