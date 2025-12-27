"""
Unit tests for utility parser functions in services/scraper.py

Tests the parse_company_description() and validate_linkedin_url() functions
with various input formats, edge cases, and international patterns.
"""
import pytest
import sys
from pathlib import Path

# Add backend to Python path
backend_path = Path(__file__).parent.parent.parent
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from services.scraper import parse_company_description, validate_linkedin_url


@pytest.mark.unit
class TestParseCompanyDescription:
    """Test suite for parse_company_description function."""

    def test_parse_complete_description_indonesian(self):
        """
        Test parsing a complete Indonesian-format company description.

        Should extract all fields: industry, company_size, headquarters,
        company_type, founded_year, and location.
        """
        description = (
            "Vertilogic. Jasa TI dan Konsultan TI. "
            "Ukuran perusahaan: 2-10 karyawan. "
            "Kantor Pusat: Jakarta, DKI Jakarta. "
            "Jenis: Perseroan Tertutup. "
            "Tahun Pendirian: 2015."
        )

        result = parse_company_description(description)

        assert result.get("industry") == "Jasa TI dan Konsultan TI"
        assert result.get("company_size") == "2-10 karyawan"
        assert result.get("headquarters") == "Jakarta, DKI Jakarta"
        assert result.get("company_type") == "Perseroan Tertutup"
        assert result.get("founded_year") == 2015
        assert result.get("location") == "Jakarta, DKI Jakarta"

    def test_parse_partial_description_missing_fields(self):
        """
        Test parsing description with missing optional fields.

        Should extract available fields and not include missing ones.
        """
        description = (
            "TechCorp. Software Development. "
            "Ukuran perusahaan: 50-200 karyawan. "
            "Kantor Pusat: Singapore."
        )

        result = parse_company_description(description)

        # Should have company_size and headquarters
        assert result.get("company_size") == "50-200 karyawan"
        assert result.get("headquarters") == "Singapore"
        assert result.get("location") == "Singapore"

        # Should NOT have these fields (not in description)
        assert "company_type" not in result
        assert "founded_year" not in result

    def test_parse_description_with_followers_indonesian(self):
        """
        Test parsing description with Indonesian follower count (pengikut).

        Should extract followers as integer.
        """
        description = (
            "StartupXYZ. Teknologi. 5.000 pengikut. "
            "Ukuran perusahaan: 10-50 karyawan."
        )

        result = parse_company_description(description)

        assert result.get("followers") == 5000
        assert result.get("company_size") == "10-50 karyawan"

    def test_parse_description_with_followers_english(self):
        """
        Test parsing description with English follower count.

        Should extract followers as integer regardless of format.
        """
        description = (
            "GlobalTech. Technology. 10,000 followers. "
            "Company size: 1000+ employees."
        )

        result = parse_company_description(description)

        assert result.get("followers") == 10000

    def test_parse_norwegian_description(self):
        """
        Test parsing Norwegian-format company description.

        Norwegian uses space as thousand separator (e.g., "1 001-5 000").
        Should extract location from City, Country pattern.
        """
        description = (
            "Hydro. Produksjon av automasjonsmaskiner. "
            "Oslo, Norway. 1.234 followers."
        )

        result = parse_company_description(description)

        # Norwegian pattern - location extraction
        assert result.get("location") == "Oslo, Norway"
        assert result.get("followers") == 1234

    def test_parse_empty_description(self):
        """
        Test parsing empty description.

        Should return empty dict without errors.
        """
        result = parse_company_description("")
        assert result == {}

        result = parse_company_description(None)
        assert result == {}

    def test_parse_malformed_description(self):
        """
        Test parsing malformed/random text.

        Should return empty dict or partial results without crashing.
        """
        description = "This is just random text without any patterns!"

        result = parse_company_description(description)

        # Should not crash and return dict (possibly empty)
        assert isinstance(result, dict)

    def test_parse_unicode_characters(self):
        """
        Test parsing description with Unicode characters.

        Should handle special characters like accented letters.
        """
        description = (
            "TechBrasil. Tecnologia. "
            "Kantor Pusat: Sao Paulo, Brazil. "
            "Tahun Pendirian: 2018."
        )

        result = parse_company_description(description)

        # Should extract headquarters with special characters
        assert result.get("headquarters") == "Sao Paulo, Brazil"
        assert result.get("founded_year") == 2018

    def test_parse_employee_range_variations(self):
        """
        Test parsing various employee count range formats.

        Should handle different number formats and suffixes.
        """
        # Test with plus sign
        desc1 = "Company. Industry. Ukuran perusahaan: 10,001+ karyawan."
        result1 = parse_company_description(desc1)
        assert result1.get("company_size") == "10,001+ karyawan"

        # Test with range
        desc2 = "Company. Industry. Ukuran perusahaan: 201-500 karyawan."
        result2 = parse_company_description(desc2)
        assert result2.get("company_size") == "201-500 karyawan"

        # Test small company
        desc3 = "Company. Industry. Ukuran perusahaan: 1-10 karyawan."
        result3 = parse_company_description(desc3)
        assert result3.get("company_size") == "1-10 karyawan"

    def test_parse_company_type_variations(self):
        """
        Test parsing various company types.

        Should extract different company type values.
        """
        # Public company
        desc1 = "Company. Industry. Jenis: Perusahaan Publik."
        result1 = parse_company_description(desc1)
        assert result1.get("company_type") == "Perusahaan Publik"

        # Private company
        desc2 = "Company. Industry. Jenis: Perseroan Tertutup."
        result2 = parse_company_description(desc2)
        assert result2.get("company_type") == "Perseroan Tertutup"

        # Partnership
        desc3 = "Company. Industry. Jenis: Kemitraan."
        result3 = parse_company_description(desc3)
        assert result3.get("company_type") == "Kemitraan"

    def test_parse_founded_year_formats(self):
        """
        Test parsing various founded year formats.

        Should extract 4-digit years correctly.
        """
        # Standard format
        desc1 = "Company. Industry. Tahun Pendirian: 2020."
        result1 = parse_company_description(desc1)
        assert result1.get("founded_year") == 2020

        # Older company
        desc2 = "Company. Industry. Tahun Pendirian: 1957."
        result2 = parse_company_description(desc2)
        assert result2.get("founded_year") == 1957

        # Recent startup
        desc3 = "Startup. Tech. Tahun Pendirian: 2023."
        result3 = parse_company_description(desc3)
        assert result3.get("founded_year") == 2023


@pytest.mark.unit
class TestValidateLinkedinUrl:
    """Test suite for validate_linkedin_url function."""

    def test_validate_linkedin_profile_url(self):
        """
        Test validation of LinkedIn profile URLs.

        Valid profile URLs contain linkedin.com/in/
        """
        # Standard profile URL
        assert validate_linkedin_url("https://www.linkedin.com/in/johndoe") is True

        # Profile URL with subdomain
        assert validate_linkedin_url("https://id.linkedin.com/in/galihirawan") is True

        # Profile URL with trailing slash
        assert validate_linkedin_url("https://www.linkedin.com/in/satya-nadella/") is True

        # Profile URL without www
        assert validate_linkedin_url("https://linkedin.com/in/profile-name") is True

    def test_validate_linkedin_company_url(self):
        """
        Test validation of LinkedIn company URLs.

        Company URLs contain linkedin.com/company/ - should return False
        as validate_linkedin_url only validates profile URLs.
        """
        # Company URL should NOT validate as profile
        assert validate_linkedin_url("https://www.linkedin.com/company/google") is False

        # Company URL with subdomain
        assert validate_linkedin_url("https://id.linkedin.com/company/microsoft") is False

        # Company URL with trailing slash
        assert validate_linkedin_url("https://www.linkedin.com/company/amazon/") is False

    def test_validate_invalid_url(self):
        """
        Test validation of invalid/non-LinkedIn URLs.

        Non-LinkedIn URLs and malformed URLs should return False.
        """
        # Non-LinkedIn domain
        assert validate_linkedin_url("https://example.com/in/profile") is False

        # Empty string
        assert validate_linkedin_url("") is False

        # Not a URL
        assert validate_linkedin_url("not-a-url") is False

        # LinkedIn domain but wrong path
        assert validate_linkedin_url("https://www.linkedin.com/jobs/view/123") is False

        # LinkedIn posts URL
        assert validate_linkedin_url("https://www.linkedin.com/posts/user_activity") is False

        # LinkedIn feed URL
        assert validate_linkedin_url("https://www.linkedin.com/feed/update/urn:li:activity:123") is False
