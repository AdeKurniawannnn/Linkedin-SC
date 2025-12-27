"""
Mock SERP responses for testing.

Factory functions for creating mock SearchResult and OrganicResult objects
that mimic the structure returned by serp-api-aggregator.
"""
from typing import List, Optional
from dataclasses import dataclass


@dataclass
class MockOrganicResult:
    """Mock organic result from SERP API."""
    link: str
    title: str
    description: str
    rank: int
    best_position: int
    frequency: int
    pages_seen: List[int]


@dataclass
class MockSearchResult:
    """Mock search result from SERP API."""
    organic: List[MockOrganicResult]
    organic_count: int
    pages_fetched: int
    has_errors: bool = False
    error_message: Optional[str] = None


def create_mock_organic_result(
    link: str = "https://www.linkedin.com/in/johndoe",
    title: str = "John Doe - Software Engineer",
    description: str = "Senior Software Engineer at Tech Company. Jakarta, Indonesia.",
    rank: int = 1,
    best_position: int = 1,
    frequency: int = 1,
    pages_seen: Optional[List[int]] = None
) -> MockOrganicResult:
    """
    Factory function to create a mock organic result.

    Args:
        link: URL of the result
        title: Title of the result
        description: Snippet/description of the result
        rank: Position in SERP results
        best_position: Best position across all pages
        frequency: Number of times result appeared
        pages_seen: List of page numbers where result was seen

    Returns:
        MockOrganicResult with specified values
    """
    if pages_seen is None:
        pages_seen = [1]

    return MockOrganicResult(
        link=link,
        title=title,
        description=description,
        rank=rank,
        best_position=best_position,
        frequency=frequency,
        pages_seen=pages_seen
    )


def create_mock_search_result(
    organic_results: Optional[List[MockOrganicResult]] = None,
    pages_fetched: int = 1,
    has_errors: bool = False,
    error_message: Optional[str] = None
) -> MockSearchResult:
    """
    Factory function to create a mock search result.

    Args:
        organic_results: List of organic results (default: generates sample results)
        pages_fetched: Number of pages fetched
        has_errors: Whether the search had errors
        error_message: Error message if has_errors is True

    Returns:
        MockSearchResult with specified values
    """
    if organic_results is None:
        organic_results = [
            create_mock_organic_result(
                link="https://www.linkedin.com/in/johndoe",
                title="John Doe - Software Engineer at Google",
                description="Senior Software Engineer at Google. Jakarta, Indonesia. 500+ connections.",
                rank=1,
                best_position=1,
                frequency=2,
                pages_seen=[1, 2]
            ),
            create_mock_organic_result(
                link="https://www.linkedin.com/in/janedoe",
                title="Jane Doe - Data Scientist at Microsoft",
                description="Data Scientist at Microsoft. Singapore. Machine Learning expert.",
                rank=2,
                best_position=2,
                frequency=1,
                pages_seen=[1]
            ),
            create_mock_organic_result(
                link="https://www.linkedin.com/company/techstartup",
                title="TechStartup - Software Development Company",
                description="TechStartup. Software Development. Ukuran perusahaan: 50-100 karyawan. Kantor Pusat: Jakarta, DKI Jakarta.",
                rank=3,
                best_position=3,
                frequency=1,
                pages_seen=[1]
            ),
        ]

    return MockSearchResult(
        organic=organic_results,
        organic_count=len(organic_results),
        pages_fetched=pages_fetched,
        has_errors=has_errors,
        error_message=error_message
    )


# Pre-built sample results for common test scenarios
SAMPLE_PROFILE_RESULTS = [
    create_mock_organic_result(
        link="https://id.linkedin.com/in/galihirawan",
        title="Galih Irawan - IT Support as Freelance",
        description="Jawa Barat. IT Support as Freelance. Companies. Universitas Gunadarma. 70 connections.",
        rank=1,
        best_position=1,
        frequency=1,
        pages_seen=[1]
    ),
    create_mock_organic_result(
        link="https://www.linkedin.com/in/satya-nadella-b534ba8",
        title="Satya Nadella - CEO at Microsoft",
        description="Chief Executive Officer at Microsoft. Seattle, Washington. Stanford University.",
        rank=2,
        best_position=2,
        frequency=1,
        pages_seen=[1]
    ),
]

SAMPLE_COMPANY_RESULTS = [
    create_mock_organic_result(
        link="https://www.linkedin.com/company/vertilogic",
        title="Vertilogic - IT Services Company",
        description="Vertilogic. Jasa TI dan Konsultan TI. Ukuran perusahaan: 2-10 karyawan. Kantor Pusat: Jakarta, DKI Jakarta. Jenis: Perseroan Tertutup. Tahun Pendirian: 2015.",
        rank=1,
        best_position=1,
        frequency=1,
        pages_seen=[1]
    ),
    create_mock_organic_result(
        link="https://www.linkedin.com/company/google",
        title="Google - Technology Company",
        description="Google. Technology, Information and Internet. 100,001+ employees. Mountain View, California.",
        rank=2,
        best_position=2,
        frequency=1,
        pages_seen=[1]
    ),
]
