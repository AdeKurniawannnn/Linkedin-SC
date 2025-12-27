"""
Unit tests for POST /api/search endpoint.

Tests the search_linkedin route handler with mocked service functions.
"""
import pytest
from unittest.mock import patch, AsyncMock


class TestSearchRoute:
    """Test cases for POST /api/search endpoint."""

    def test_search_route_happy_path(self, test_app):
        """Test successful search request returns 200 OK with expected structure."""
        mock_response = {
            "success": True,
            "query": "software engineer linkedin.com/in/ us",
            "total_results": 2,
            "profiles": [
                {
                    "name": "John Doe",
                    "headline": "Senior Software Engineer",
                    "description": "Experienced developer",
                    "location": "San Francisco",
                    "company": "Tech Corp",
                    "education": "Stanford",
                    "connections": 500,
                    "profile_url": "https://linkedin.com/in/johndoe",
                    "rank": 1,
                    "best_position": 1,
                    "frequency": 1,
                    "pages_seen": [1],
                    "industry": None,
                    "followers": None,
                    "company_size": None,
                    "founded_year": None,
                    "company_type": None,
                    "headquarters": None,
                }
            ],
            "metadata": {
                "country": "us",
                "language": "en",
                "pages_requested": 5,
                "pages_scraped": 2,
                "time_taken_seconds": 3.45
            }
        }

        with patch('api.routes.search_linkedin_profiles', new_callable=AsyncMock) as mock_search:
            mock_search.return_value = mock_response

            response = test_app.post("/api/search", json={
                "role": "software engineer",
                "country": "us"
            })

            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert "profiles" in data
            assert data["total_results"] == 2
            mock_search.assert_called_once()

    def test_search_route_validates_required_fields(self, test_app):
        """Test that missing required 'role' field returns 422 validation error."""
        response = test_app.post("/api/search", json={
            "country": "us"
        })

        assert response.status_code == 422
        data = response.json()
        assert "detail" in data
        # Check that the error mentions the missing 'role' field
        error_fields = [err["loc"][-1] for err in data["detail"]]
        assert "role" in error_fields

    def test_search_route_validates_max_pages_range(self, test_app):
        """Test that max_pages outside valid range (1-25) returns 422."""
        # Test max_pages too high
        response = test_app.post("/api/search", json={
            "role": "engineer",
            "max_pages": 100
        })
        assert response.status_code == 422

        # Test max_pages too low (0)
        response = test_app.post("/api/search", json={
            "role": "engineer",
            "max_pages": 0
        })
        assert response.status_code == 422

    def test_search_route_returns_500_on_service_error(self, test_app):
        """Test that service exception returns 500 error with proper structure."""
        with patch('api.routes.search_linkedin_profiles', new_callable=AsyncMock) as mock_search:
            mock_search.side_effect = Exception("SERP API connection failed")

            response = test_app.post("/api/search", json={
                "role": "developer",
                "country": "us"
            })

            assert response.status_code == 500
            data = response.json()
            assert "detail" in data
            assert data["detail"]["success"] is False
            assert "error" in data["detail"]

    def test_search_route_returns_empty_results(self, test_app):
        """Test that empty search results return 200 OK with empty profiles list."""
        mock_response = {
            "success": True,
            "query": "nonexistent role linkedin.com/in/",
            "total_results": 0,
            "profiles": [],
            "metadata": {
                "country": "us",
                "language": "en",
                "pages_requested": 5,
                "pages_scraped": 2,
                "time_taken_seconds": 1.23
            }
        }

        with patch('api.routes.search_linkedin_profiles', new_callable=AsyncMock) as mock_search:
            mock_search.return_value = mock_response

            response = test_app.post("/api/search", json={
                "role": "nonexistent role xyz123",
                "country": "us"
            })

            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert data["total_results"] == 0
            assert data["profiles"] == []

    def test_search_route_handles_optional_fields_defaults(self, test_app):
        """Test that optional fields receive default values when not provided."""
        mock_response = {
            "success": True,
            "query": "engineer",
            "total_results": 1,
            "profiles": [],
            "metadata": {}
        }

        with patch('api.routes.search_linkedin_profiles', new_callable=AsyncMock) as mock_search:
            mock_search.return_value = mock_response

            response = test_app.post("/api/search", json={
                "role": "engineer"
            })

            assert response.status_code == 200
            # Verify defaults were applied in the call
            call_kwargs = mock_search.call_args.kwargs
            assert call_kwargs["country"] == "us"
            assert call_kwargs["language"] == "en"
            assert call_kwargs["max_pages"] == 5
            assert call_kwargs["location"] == ""
            assert call_kwargs["site_filter"] == "profile"

    def test_search_route_response_serialization(self, test_app):
        """Test that response matches SearchResponse Pydantic model schema."""
        mock_response = {
            "success": True,
            "query": "developer test",
            "total_results": 1,
            "profiles": [
                {
                    "name": "Test User",
                    "headline": "Developer",
                    "description": None,
                    "location": "NYC",
                    "company": None,
                    "education": None,
                    "connections": None,
                    "profile_url": "https://linkedin.com/in/testuser",
                    "rank": 1,
                    "best_position": 1,
                    "frequency": 1,
                    "pages_seen": [1],
                    "industry": None,
                    "followers": None,
                    "company_size": None,
                    "founded_year": None,
                    "company_type": None,
                    "headquarters": None,
                }
            ],
            "metadata": {"test": "value"}
        }

        with patch('api.routes.search_linkedin_profiles', new_callable=AsyncMock) as mock_search:
            mock_search.return_value = mock_response

            response = test_app.post("/api/search", json={
                "role": "developer"
            })

            assert response.status_code == 200
            data = response.json()

            # Verify required response fields
            assert "success" in data
            assert "query" in data
            assert "total_results" in data
            assert "profiles" in data
            assert "metadata" in data
            assert isinstance(data["profiles"], list)
            assert isinstance(data["metadata"], dict)

            # Verify profile structure
            if data["profiles"]:
                profile = data["profiles"][0]
                assert "name" in profile
                assert "profile_url" in profile
                assert "rank" in profile
                assert "best_position" in profile
                assert "frequency" in profile
                assert "pages_seen" in profile

    def test_search_route_content_type_json(self, test_app):
        """Test that response Content-Type header is application/json."""
        mock_response = {
            "success": True,
            "query": "test",
            "total_results": 0,
            "profiles": [],
            "metadata": {}
        }

        with patch('api.routes.search_linkedin_profiles', new_callable=AsyncMock) as mock_search:
            mock_search.return_value = mock_response

            response = test_app.post("/api/search", json={
                "role": "test"
            })

            assert response.status_code == 200
            assert "application/json" in response.headers["content-type"]
