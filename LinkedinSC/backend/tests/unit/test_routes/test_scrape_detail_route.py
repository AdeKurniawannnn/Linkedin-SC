"""
Unit tests for POST /api/scrape-detail endpoint.

Tests the scrape_company_detail route handler with mocked service functions.
"""
import pytest
from unittest.mock import patch, AsyncMock


class TestScrapeDetailRoute:
    """Test cases for POST /api/scrape-detail endpoint."""

    def test_scrape_detail_happy_path(self, test_app):
        """Test successful scrape-detail request returns 200 OK with company data."""
        mock_response = {
            "success": True,
            "total_scraped": 2,
            "companies": [
                {
                    "url": "https://www.linkedin.com/company/google",
                    "name": "Google",
                    "tagline": "Organize the world's information",
                    "industry": "Technology",
                    "location": "Mountain View, CA",
                    "followers": "30M",
                    "employee_count_range": "10,001+",
                    "full_description": "Google is a multinational technology company...",
                    "specialties": ["Search", "Cloud", "AI"],
                    "about": "About Google",
                    "website": "https://google.com",
                    "phone": None,
                    "founded": 1998,
                    "employee_growth": "10%",
                    "top_employee_schools": ["Stanford", "MIT"],
                    "recent_hires": [],
                    "related_companies": [],
                    "alumni_working_here": [],
                    "scraped_at": "2025-12-28T01:00:00Z"
                },
                {
                    "url": "https://www.linkedin.com/company/microsoft",
                    "name": "Microsoft",
                    "tagline": "Empowering every person",
                    "industry": "Technology",
                    "location": "Redmond, WA",
                    "followers": "25M",
                    "employee_count_range": "10,001+",
                    "full_description": None,
                    "specialties": None,
                    "about": None,
                    "website": None,
                    "phone": None,
                    "founded": 1975,
                    "employee_growth": None,
                    "top_employee_schools": None,
                    "recent_hires": None,
                    "related_companies": None,
                    "alumni_working_here": None,
                    "scraped_at": "2025-12-28T01:00:00Z"
                }
            ],
            "metadata": {
                "urls_requested": 2,
                "urls_scraped": 2,
                "time_taken_seconds": 5.67
            }
        }

        with patch('api.routes.scrape_company_details', new_callable=AsyncMock) as mock_scrape:
            mock_scrape.return_value = mock_response

            response = test_app.post("/api/scrape-detail", json={
                "urls": [
                    "https://www.linkedin.com/company/google",
                    "https://www.linkedin.com/company/microsoft"
                ]
            })

            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert data["total_scraped"] == 2
            assert len(data["companies"]) == 2
            mock_scrape.assert_called_once()

    def test_scrape_detail_validates_urls_array(self, test_app):
        """Test that urls must be an array, not a string."""
        response = test_app.post("/api/scrape-detail", json={
            "urls": "https://www.linkedin.com/company/google"
        })

        assert response.status_code == 422
        data = response.json()
        assert "detail" in data

    def test_scrape_detail_empty_urls_array(self, test_app):
        """Test that empty urls array returns 200 with empty results."""
        mock_response = {
            "success": True,
            "total_scraped": 0,
            "companies": [],
            "metadata": {
                "urls_requested": 0,
                "urls_scraped": 0,
                "time_taken_seconds": 0.01
            }
        }

        with patch('api.routes.scrape_company_details', new_callable=AsyncMock) as mock_scrape:
            mock_scrape.return_value = mock_response

            response = test_app.post("/api/scrape-detail", json={
                "urls": []
            })

            assert response.status_code == 200
            data = response.json()
            assert data["total_scraped"] == 0
            assert data["companies"] == []

    def test_scrape_detail_returns_500_on_crawler_error(self, test_app):
        """Test that crawler exception returns 500 error with proper structure."""
        with patch('api.routes.scrape_company_details', new_callable=AsyncMock) as mock_scrape:
            mock_scrape.side_effect = Exception("Crawl4AI failed to connect")

            response = test_app.post("/api/scrape-detail", json={
                "urls": ["https://www.linkedin.com/company/google"]
            })

            assert response.status_code == 500
            data = response.json()
            assert "detail" in data
            assert data["detail"]["success"] is False
            assert data["detail"]["error"] == "Scraping failed"

    def test_scrape_detail_partial_success(self, test_app):
        """Test handling of partial success when some URLs fail."""
        mock_response = {
            "success": True,
            "total_scraped": 1,
            "companies": [
                {
                    "url": "https://www.linkedin.com/company/google",
                    "name": "Google",
                    "tagline": None,
                    "industry": "Technology",
                    "location": None,
                    "followers": None,
                    "employee_count_range": None,
                    "full_description": None,
                    "specialties": None,
                    "about": None,
                    "website": None,
                    "phone": None,
                    "founded": None,
                    "employee_growth": None,
                    "top_employee_schools": None,
                    "recent_hires": None,
                    "related_companies": None,
                    "alumni_working_here": None,
                    "scraped_at": "2025-12-28T01:00:00Z"
                }
            ],
            "metadata": {
                "urls_requested": 2,
                "urls_scraped": 1,
                "failed_urls": ["https://www.linkedin.com/company/nonexistent"],
                "time_taken_seconds": 3.45
            }
        }

        with patch('api.routes.scrape_company_details', new_callable=AsyncMock) as mock_scrape:
            mock_scrape.return_value = mock_response

            response = test_app.post("/api/scrape-detail", json={
                "urls": [
                    "https://www.linkedin.com/company/google",
                    "https://www.linkedin.com/company/nonexistent"
                ]
            })

            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert data["total_scraped"] == 1
            assert data["metadata"]["urls_requested"] == 2
            assert data["metadata"]["urls_scraped"] == 1

    def test_scrape_detail_max_urls_limit(self, test_app):
        """Test handling of large number of URLs."""
        # Generate 50 URLs
        urls = [f"https://www.linkedin.com/company/company{i}" for i in range(50)]

        mock_response = {
            "success": True,
            "total_scraped": 50,
            "companies": [
                {
                    "url": url,
                    "name": f"Company {i}",
                    "tagline": None,
                    "industry": None,
                    "location": None,
                    "followers": None,
                    "employee_count_range": None,
                    "full_description": None,
                    "specialties": None,
                    "about": None,
                    "website": None,
                    "phone": None,
                    "founded": None,
                    "employee_growth": None,
                    "top_employee_schools": None,
                    "recent_hires": None,
                    "related_companies": None,
                    "alumni_working_here": None,
                    "scraped_at": "2025-12-28T01:00:00Z"
                }
                for i, url in enumerate(urls)
            ],
            "metadata": {
                "urls_requested": 50,
                "urls_scraped": 50,
                "time_taken_seconds": 120.5
            }
        }

        with patch('api.routes.scrape_company_details', new_callable=AsyncMock) as mock_scrape:
            mock_scrape.return_value = mock_response

            response = test_app.post("/api/scrape-detail", json={
                "urls": urls
            })

            assert response.status_code == 200
            data = response.json()
            assert data["total_scraped"] == 50

    def test_scrape_detail_response_serialization(self, test_app):
        """Test that response matches ScrapeDetailResponse Pydantic model schema."""
        mock_response = {
            "success": True,
            "total_scraped": 1,
            "companies": [
                {
                    "url": "https://www.linkedin.com/company/test",
                    "name": "Test Company",
                    "tagline": "Test tagline",
                    "industry": "Tech",
                    "location": "Test City",
                    "followers": "1000",
                    "employee_count_range": "10-50",
                    "full_description": "Full desc",
                    "specialties": ["Test"],
                    "about": "About us",
                    "website": "https://test.com",
                    "phone": "123-456",
                    "founded": 2020,
                    "employee_growth": "5%",
                    "top_employee_schools": ["Test Uni"],
                    "recent_hires": [{"name": "John", "position": "Dev", "connection_degree": "2nd"}],
                    "related_companies": [{"name": "Related Co", "industry": "Tech", "followers": "500"}],
                    "alumni_working_here": [],
                    "scraped_at": "2025-12-28T01:00:00Z"
                }
            ],
            "metadata": {"test": "value"}
        }

        with patch('api.routes.scrape_company_details', new_callable=AsyncMock) as mock_scrape:
            mock_scrape.return_value = mock_response

            response = test_app.post("/api/scrape-detail", json={
                "urls": ["https://www.linkedin.com/company/test"]
            })

            assert response.status_code == 200
            data = response.json()

            # Verify required response fields
            assert "success" in data
            assert "total_scraped" in data
            assert "companies" in data
            assert "metadata" in data
            assert isinstance(data["companies"], list)
            assert isinstance(data["metadata"], dict)

            # Verify company detail structure
            if data["companies"]:
                company = data["companies"][0]
                assert "url" in company
                assert "name" in company
                assert "scraped_at" in company

    def test_scrape_detail_handles_malformed_urls(self, test_app):
        """Test handling of malformed/invalid URLs in the request."""
        mock_response = {
            "success": True,
            "total_scraped": 0,
            "companies": [],
            "metadata": {
                "urls_requested": 2,
                "urls_scraped": 0,
                "failed_urls": ["not-a-valid-url", "http://example.com"],
                "time_taken_seconds": 0.5
            }
        }

        with patch('api.routes.scrape_company_details', new_callable=AsyncMock) as mock_scrape:
            mock_scrape.return_value = mock_response

            response = test_app.post("/api/scrape-detail", json={
                "urls": [
                    "not-a-valid-url",
                    "http://example.com"  # Not a LinkedIn URL
                ]
            })

            # The request should still be processed (URL validation happens in service)
            assert response.status_code == 200
            data = response.json()
            assert data["total_scraped"] == 0
