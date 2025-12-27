"""
Mock Crawl4AI responses for testing.

Factory functions for creating mock crawl results that mimic
the structure returned by AsyncWebCrawler.
"""
from typing import Optional, Dict, Any
from dataclasses import dataclass


@dataclass
class MockCrawlResult:
    """Mock crawl result from Crawl4AI."""
    success: bool
    markdown: Optional[str]
    metadata: Optional[Dict[str, Any]]
    error_message: Optional[str] = None


def create_mock_crawl_result(
    success: bool = True,
    markdown: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
    error_message: Optional[str] = None
) -> MockCrawlResult:
    """
    Factory function to create a mock crawl result.

    Args:
        success: Whether the crawl was successful
        markdown: Extracted markdown content
        metadata: Page metadata (title, etc.)
        error_message: Error message if crawl failed

    Returns:
        MockCrawlResult with specified values
    """
    if metadata is None:
        metadata = {"title": "Company Name | LinkedIn"}

    if markdown is None and success:
        markdown = SAMPLE_COMPANY_MARKDOWN

    return MockCrawlResult(
        success=success,
        markdown=markdown,
        metadata=metadata,
        error_message=error_message
    )


# Sample markdown content for company page testing
SAMPLE_COMPANY_MARKDOWN = """# PT Pertamina (Persero)

## Produksjon av motorvogner

### Jakarta, DKI Jakarta, Indonesia

Bransje
Produksjon av motorvogner

Bedriftsstorrelse
10,001+ ansatte

Hovedkontor
Jakarta, DKI Jakarta

Grunnlagt
1957

## Om oss

PT Pertamina (Persero) is a state-owned enterprise operating in the oil and gas industry.
The company is engaged in all aspects of the petroleum industry from exploration, production, refining, and distribution.

Nettsted
[pertamina.com](https://www.pertamina.com)

Ekstern lenke

Spesialiteter
Oil and Gas, Energy, Refining, Distribution, Exploration

---

## Ansatte

### Wahid Santoso
Manager at PT Pertamina (Persero)

### Andi Pratama
Senior Engineer at PT Pertamina (Persero)

---

## Relaterte selskaper

Logo halaman Chevron
Oil and Gas
287.060 pengikut

Logo halaman Shell
Energy
1.2M pengikut

---

1.234 pengikut
12.456 ansatte

Pertumbuhan karyawan
5,234

Karyawan baru
Wahid dan 2 lainnya

3 karyawan bersekolah di Universitas Indonesia
2 karyawan bersekolah di ITB
"""


SAMPLE_COMPANY_MARKDOWN_INDONESIAN = """# Vertilogic

## Jasa TI dan Konsultan TI

### Jakarta, DKI Jakarta, Indonesia

Bransje
Jasa TI dan Konsultan TI

Ukuran perusahaan
2-10 karyawan

Kantor Pusat
Jakarta, DKI Jakarta

Tahun Pendirian
2015

Jenis
Perseroan Tertutup

## Tentang

Vertilogic is a technology company specializing in IT services and consulting.
We provide end-to-end solutions for businesses.

Website
[vertilogic.com](https://www.vertilogic.com)

Spesialisasi
IT Consulting, Software Development, Cloud Services

---

500 pengikut
"""


SAMPLE_COMPANY_MARKDOWN_NORWEGIAN = """# Hydro

## Produksjon av automasjonsmaskiner

### Oslo, Norway

Bransje
Produksjon av automasjonsmaskiner

Bedriftsstorrelse
1 001-5 000 ansatte

Hovedkontor
Oslo, Norway

Grunnlagt
1905

## Om oss

Norsk Hydro ASA is a Norwegian aluminium and renewable energy company.

Nettsted
[hydro.com](https://www.hydro.com)

---

45,678 followers
"""


SAMPLE_COMPANY_MARKDOWN_BLOCKED = """# Log In or Sign Up

## LinkedIn

Daftar

Join LinkedIn to see full profiles and connect with professionals.
"""
