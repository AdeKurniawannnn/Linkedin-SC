"""
Unit tests for POST /api/search-jobs endpoint.

Tests the search_jobs route handler with mocked service functions.
"""
import pytest
from unittest.mock import patch, AsyncMock


class TestSearchJobsRoute:
    """Test cases for POST /api/search-jobs endpoint."""

    def test_search_jobs_happy_path(self, test_app):
        """Test successful jobs search returns 200 OK with expected structure."""
        mock_response = {
            "success": True,
            "query": "Software Engineer jobs Jakarta",
            "total_results": 2,
            "jobs": [
                {
                    "job_url": "https://linkedin.com/jobs/view/3456789012",
                    "job_title": "Senior Software Engineer",
                    "company_name": "Tech Corp",
                    "location": "Jakarta, Indonesia",
                    "description": "We are looking for experienced software engineers to join our team...",
                    "rank": 1
                },
                {
                    "job_url": "https://linkedin.com/jobs/view/3456789013",
                    "job_title": "Software Engineer",
                    "company_name": "Startup Inc",
                    "location": "Jakarta, Indonesia",
                    "description": "Join our fast-growing startup as a software engineer...",
                    "rank": 2
                }
            ],
            "metadata": {
                "job_title": "Software Engineer",
                "experience_level": "mid-senior",
                "country": "id",
                "language": "id",
                "pages_fetched": 2,
                "time_taken_seconds": 3.45
            }
        }

        with patch('api.routes.search_linkedin_jobs', new_callable=AsyncMock) as mock_search:
            mock_search.return_value = mock_response

            response = test_app.post("/api/search-jobs", json={
                "job_title": "Software Engineer",
                "location": "Jakarta",
                "experience_level": "mid-senior"
            })

            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert data["total_results"] == 2
            assert len(data["jobs"]) == 2
            mock_search.assert_called_once()

    def test_search_jobs_validates_job_title_required(self, test_app):
        """Test that missing required 'job_title' field returns 422 validation error."""
        response = test_app.post("/api/search-jobs", json={
            "location": "Jakarta",
            "experience_level": "mid-senior"
        })

        assert response.status_code == 422
        data = response.json()
        assert "detail" in data
        # Check that the error mentions the missing 'job_title' field
        error_fields = [err["loc"][-1] for err in data["detail"]]
        assert "job_title" in error_fields

    def test_search_jobs_validates_experience_level_values(self, test_app):
        """Test that experience_level accepts valid values."""
        mock_response = {
            "success": True,
            "query": "test",
            "total_results": 0,
            "jobs": [],
            "metadata": {}
        }

        with patch('api.routes.search_linkedin_jobs', new_callable=AsyncMock) as mock_search:
            mock_search.return_value = mock_response

            # Test valid experience levels
            valid_levels = ["all", "internship", "entry", "associate", "mid-senior", "director", "executive"]
            for level in valid_levels:
                response = test_app.post("/api/search-jobs", json={
                    "job_title": "Engineer",
                    "experience_level": level
                })
                # Should succeed (no enum validation at Pydantic level, just string)
                assert response.status_code == 200

    def test_search_jobs_returns_500_on_error(self, test_app):
        """Test that service exception returns 500 error with proper structure."""
        with patch('api.routes.search_linkedin_jobs', new_callable=AsyncMock) as mock_search:
            mock_search.side_effect = Exception("Jobs search API timeout")

            response = test_app.post("/api/search-jobs", json={
                "job_title": "Software Engineer"
            })

            assert response.status_code == 500
            data = response.json()
            assert "detail" in data
            assert data["detail"]["success"] is False
            assert data["detail"]["error"] == "Jobs search failed"

    def test_search_jobs_empty_results(self, test_app):
        """Test that empty search results return 200 OK with empty jobs list."""
        mock_response = {
            "success": True,
            "query": "Nonexistent Job Title xyz123",
            "total_results": 0,
            "jobs": [],
            "metadata": {
                "job_title": "Nonexistent Job Title xyz123",
                "experience_level": "all",
                "country": "id",
                "language": "id",
                "pages_fetched": 1,
                "time_taken_seconds": 1.23
            }
        }

        with patch('api.routes.search_linkedin_jobs', new_callable=AsyncMock) as mock_search:
            mock_search.return_value = mock_response

            response = test_app.post("/api/search-jobs", json={
                "job_title": "Nonexistent Job Title xyz123"
            })

            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert data["total_results"] == 0
            assert data["jobs"] == []

    def test_search_jobs_max_results_limit(self, test_app):
        """Test that max_results parameter is validated within range (1-100)."""
        # Test max_results too high
        response = test_app.post("/api/search-jobs", json={
            "job_title": "Engineer",
            "max_results": 500
        })
        assert response.status_code == 422

        # Test max_results too low (0)
        response = test_app.post("/api/search-jobs", json={
            "job_title": "Engineer",
            "max_results": 0
        })
        assert response.status_code == 422

        # Test valid max_results
        mock_response = {
            "success": True,
            "query": "test",
            "total_results": 0,
            "jobs": [],
            "metadata": {}
        }
        with patch('api.routes.search_linkedin_jobs', new_callable=AsyncMock) as mock_search:
            mock_search.return_value = mock_response

            response = test_app.post("/api/search-jobs", json={
                "job_title": "Engineer",
                "max_results": 100
            })
            assert response.status_code == 200

    def test_search_jobs_response_serialization(self, test_app):
        """Test that response matches JobsSearchResponse Pydantic model schema."""
        mock_response = {
            "success": True,
            "query": "test query",
            "total_results": 1,
            "jobs": [
                {
                    "job_url": "https://linkedin.com/jobs/view/123",
                    "job_title": "Test Position",
                    "company_name": "Test Company",
                    "location": "Test City",
                    "description": "Test description",
                    "rank": 1
                }
            ],
            "metadata": {"test": "value"}
        }

        with patch('api.routes.search_linkedin_jobs', new_callable=AsyncMock) as mock_search:
            mock_search.return_value = mock_response

            response = test_app.post("/api/search-jobs", json={
                "job_title": "Test"
            })

            assert response.status_code == 200
            data = response.json()

            # Verify required response fields
            assert "success" in data
            assert "query" in data
            assert "total_results" in data
            assert "jobs" in data
            assert "metadata" in data
            assert isinstance(data["jobs"], list)
            assert isinstance(data["metadata"], dict)

            # Verify job structure
            if data["jobs"]:
                job = data["jobs"][0]
                assert "job_url" in job
                assert "job_title" in job
                assert "company_name" in job
                assert "location" in job
                assert "description" in job
                assert "rank" in job

    def test_search_jobs_location_filter(self, test_app):
        """Test that location filter is properly passed to service."""
        mock_response = {
            "success": True,
            "query": "Software Engineer Singapore",
            "total_results": 5,
            "jobs": [],
            "metadata": {
                "job_title": "Software Engineer",
                "location": "Singapore"
            }
        }

        with patch('api.routes.search_linkedin_jobs', new_callable=AsyncMock) as mock_search:
            mock_search.return_value = mock_response

            response = test_app.post("/api/search-jobs", json={
                "job_title": "Software Engineer",
                "location": "Singapore"
            })

            assert response.status_code == 200
            # Verify location was passed to service
            call_kwargs = mock_search.call_args.kwargs
            assert call_kwargs["location"] == "Singapore"

            # Test empty location (default)
            mock_search.reset_mock()
            response = test_app.post("/api/search-jobs", json={
                "job_title": "Engineer"
            })
            call_kwargs = mock_search.call_args.kwargs
            assert call_kwargs["location"] == ""
