"""
Unit tests for POST /api/search-all endpoint.

Tests the search_all route handler with mocked service functions.
"""
import pytest
from unittest.mock import patch, AsyncMock


class TestSearchAllRoute:
    """Test cases for POST /api/search-all endpoint."""

    def test_search_all_happy_path(self, test_app):
        """Test successful search-all request returns 200 OK with expected structure."""
        mock_response = {
            "success": True,
            "query": "Software Engineer Jakarta site:linkedin.com",
            "total_results": 4,
            "results": [
                {
                    "url": "https://linkedin.com/in/johndoe",
                    "title": "John Doe - Senior Software Engineer",
                    "description": "Experienced software engineer with 10+ years...",
                    "type": "profile",
                    "rank": 1
                },
                {
                    "url": "https://linkedin.com/company/techcorp",
                    "title": "TechCorp - Software Development Company",
                    "description": "Leading software development company in Jakarta...",
                    "type": "company",
                    "rank": 2
                },
                {
                    "url": "https://linkedin.com/jobs/view/123456",
                    "title": "Software Engineer at TechCorp",
                    "description": "We are hiring software engineers in Jakarta...",
                    "type": "job",
                    "rank": 3
                },
                {
                    "url": "https://linkedin.com/posts/johndoe-software-123",
                    "title": "Tips for Software Engineers",
                    "description": "Here are my top tips for becoming a better...",
                    "type": "post",
                    "rank": 4
                }
            ],
            "metadata": {
                "keywords": "Software Engineer Jakarta",
                "country": "id",
                "language": "id",
                "pages_fetched": 2,
                "time_taken_seconds": 3.45
            }
        }

        with patch('api.routes.search_linkedin_all', new_callable=AsyncMock) as mock_search:
            mock_search.return_value = mock_response

            response = test_app.post("/api/search-all", json={
                "keywords": "Software Engineer Jakarta",
                "location": "Indonesia",
                "max_results": 20
            })

            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert data["total_results"] == 4
            assert len(data["results"]) == 4
            mock_search.assert_called_once()

    def test_search_all_validates_keywords_required(self, test_app):
        """Test that missing required 'keywords' field returns 422 validation error."""
        response = test_app.post("/api/search-all", json={
            "location": "Jakarta",
            "max_results": 20
        })

        assert response.status_code == 422
        data = response.json()
        assert "detail" in data
        # Check that the error mentions the missing 'keywords' field
        error_fields = [err["loc"][-1] for err in data["detail"]]
        assert "keywords" in error_fields

    def test_search_all_returns_500_on_error(self, test_app):
        """Test that service exception returns 500 error with proper structure."""
        with patch('api.routes.search_linkedin_all', new_callable=AsyncMock) as mock_search:
            mock_search.side_effect = Exception("All content search API timeout")

            response = test_app.post("/api/search-all", json={
                "keywords": "Software Engineer"
            })

            assert response.status_code == 500
            data = response.json()
            assert "detail" in data
            assert data["detail"]["success"] is False
            assert data["detail"]["error"] == "All content search failed"

    def test_search_all_empty_results(self, test_app):
        """Test that empty search results return 200 OK with empty results list."""
        mock_response = {
            "success": True,
            "query": "nonexistent keywords xyz123 site:linkedin.com",
            "total_results": 0,
            "results": [],
            "metadata": {
                "keywords": "nonexistent keywords xyz123",
                "country": "id",
                "language": "id",
                "pages_fetched": 1,
                "time_taken_seconds": 1.23
            }
        }

        with patch('api.routes.search_linkedin_all', new_callable=AsyncMock) as mock_search:
            mock_search.return_value = mock_response

            response = test_app.post("/api/search-all", json={
                "keywords": "nonexistent keywords xyz123"
            })

            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert data["total_results"] == 0
            assert data["results"] == []

    def test_search_all_mixed_content_types(self, test_app):
        """Test that results contain mixed content types (profile, company, job, post)."""
        mock_response = {
            "success": True,
            "query": "test query",
            "total_results": 5,
            "results": [
                {"url": "https://linkedin.com/in/user1", "title": "User 1", "description": "...", "type": "profile", "rank": 1},
                {"url": "https://linkedin.com/company/comp1", "title": "Company 1", "description": "...", "type": "company", "rank": 2},
                {"url": "https://linkedin.com/jobs/view/123", "title": "Job 1", "description": "...", "type": "job", "rank": 3},
                {"url": "https://linkedin.com/posts/post1", "title": "Post 1", "description": "...", "type": "post", "rank": 4},
                {"url": "https://linkedin.com/other/thing", "title": "Other", "description": "...", "type": "other", "rank": 5},
            ],
            "metadata": {}
        }

        with patch('api.routes.search_linkedin_all', new_callable=AsyncMock) as mock_search:
            mock_search.return_value = mock_response

            response = test_app.post("/api/search-all", json={
                "keywords": "test query"
            })

            assert response.status_code == 200
            data = response.json()

            # Verify mixed types
            types = [result["type"] for result in data["results"]]
            assert "profile" in types
            assert "company" in types
            assert "job" in types
            assert "post" in types
            assert "other" in types

    def test_search_all_type_classification(self, test_app):
        """Test that results are properly classified by type."""
        mock_response = {
            "success": True,
            "query": "engineer",
            "total_results": 3,
            "results": [
                {
                    "url": "https://linkedin.com/in/engineer1",
                    "title": "Engineer Profile",
                    "description": "Software engineer profile",
                    "type": "profile",
                    "rank": 1
                },
                {
                    "url": "https://linkedin.com/company/engineering-corp",
                    "title": "Engineering Corp",
                    "description": "Engineering company",
                    "type": "company",
                    "rank": 2
                },
                {
                    "url": "https://linkedin.com/jobs/view/engineer-job",
                    "title": "Engineer Position",
                    "description": "Engineering job opening",
                    "type": "job",
                    "rank": 3
                }
            ],
            "metadata": {}
        }

        with patch('api.routes.search_linkedin_all', new_callable=AsyncMock) as mock_search:
            mock_search.return_value = mock_response

            response = test_app.post("/api/search-all", json={
                "keywords": "engineer"
            })

            assert response.status_code == 200
            data = response.json()

            # Verify type field is present and valid for all results
            valid_types = {"profile", "company", "job", "post", "other"}
            for result in data["results"]:
                assert "type" in result
                assert result["type"] in valid_types

    def test_search_all_response_serialization(self, test_app):
        """Test that response matches AllSearchResponse Pydantic model schema."""
        mock_response = {
            "success": True,
            "query": "test query",
            "total_results": 1,
            "results": [
                {
                    "url": "https://linkedin.com/in/testuser",
                    "title": "Test User - Developer",
                    "description": "Test description",
                    "type": "profile",
                    "rank": 1
                }
            ],
            "metadata": {"test": "value"}
        }

        with patch('api.routes.search_linkedin_all', new_callable=AsyncMock) as mock_search:
            mock_search.return_value = mock_response

            response = test_app.post("/api/search-all", json={
                "keywords": "test"
            })

            assert response.status_code == 200
            data = response.json()

            # Verify required response fields
            assert "success" in data
            assert "query" in data
            assert "total_results" in data
            assert "results" in data
            assert "metadata" in data
            assert isinstance(data["results"], list)
            assert isinstance(data["metadata"], dict)

            # Verify result structure (LinkedInAllResult)
            if data["results"]:
                result = data["results"][0]
                assert "url" in result
                assert "title" in result
                assert "description" in result
                assert "type" in result
                assert "rank" in result

    def test_search_all_max_results_limit(self, test_app):
        """Test that max_results parameter is validated within range (1-100)."""
        # Test max_results too high
        response = test_app.post("/api/search-all", json={
            "keywords": "test",
            "max_results": 500
        })
        assert response.status_code == 422

        # Test max_results too low (0)
        response = test_app.post("/api/search-all", json={
            "keywords": "test",
            "max_results": 0
        })
        assert response.status_code == 422

        # Test valid max_results at boundary
        mock_response = {
            "success": True,
            "query": "test",
            "total_results": 0,
            "results": [],
            "metadata": {}
        }
        with patch('api.routes.search_linkedin_all', new_callable=AsyncMock) as mock_search:
            mock_search.return_value = mock_response

            # Test max boundary (100)
            response = test_app.post("/api/search-all", json={
                "keywords": "test",
                "max_results": 100
            })
            assert response.status_code == 200

            # Test min boundary (1)
            response = test_app.post("/api/search-all", json={
                "keywords": "test",
                "max_results": 1
            })
            assert response.status_code == 200

            # Verify max_results was passed to service
            call_kwargs = mock_search.call_args.kwargs
            assert call_kwargs["max_results"] == 1
