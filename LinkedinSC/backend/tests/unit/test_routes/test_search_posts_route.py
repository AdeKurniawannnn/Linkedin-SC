"""
Unit tests for POST /api/search-posts endpoint.

Tests the search_posts route handler with mocked service functions.
"""
import pytest
from unittest.mock import patch, AsyncMock


class TestSearchPostsRoute:
    """Test cases for POST /api/search-posts endpoint."""

    def test_search_posts_happy_path(self, test_app):
        """Test successful posts search returns 200 OK with expected structure."""
        mock_response = {
            "success": True,
            "query": "artificial intelligence",
            "total_results": 2,
            "posts": [
                {
                    "post_url": "https://linkedin.com/posts/johndoe-ai-123456",
                    "author_name": "John Doe",
                    "author_profile_url": "https://linkedin.com/in/johndoe",
                    "posted_date": "2025-12-25",
                    "content": "AI is transforming industries across the globe...",
                    "hashtags": ["#AI", "#Technology", "#Innovation"],
                    "likes": 1234,
                    "comments": 56,
                    "shares": 89,
                    "post_type": "text",
                    "rank": 1
                },
                {
                    "post_url": "https://linkedin.com/posts/janedoe-ml-789012",
                    "author_name": "Jane Doe",
                    "author_profile_url": "https://linkedin.com/in/janedoe",
                    "posted_date": "2025-12-24",
                    "content": "Machine learning applications in healthcare...",
                    "hashtags": ["#ML", "#Healthcare"],
                    "likes": 567,
                    "comments": 23,
                    "shares": 45,
                    "post_type": "article",
                    "rank": 2
                }
            ],
            "metadata": {
                "keywords": "artificial intelligence",
                "author_type": "all",
                "country": "id",
                "language": "id",
                "pages_fetched": 2,
                "time_taken_seconds": 3.45
            }
        }

        with patch('api.routes.search_linkedin_posts', new_callable=AsyncMock) as mock_search:
            mock_search.return_value = mock_response

            response = test_app.post("/api/search-posts", json={
                "keywords": "artificial intelligence",
                "author_type": "all",
                "max_results": 20
            })

            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert data["total_results"] == 2
            assert len(data["posts"]) == 2
            mock_search.assert_called_once()

    def test_search_posts_validates_keywords_required(self, test_app):
        """Test that missing required 'keywords' field returns 422 validation error."""
        response = test_app.post("/api/search-posts", json={
            "author_type": "all",
            "max_results": 20
        })

        assert response.status_code == 422
        data = response.json()
        assert "detail" in data
        # Check that the error mentions the missing 'keywords' field
        error_fields = [err["loc"][-1] for err in data["detail"]]
        assert "keywords" in error_fields

    def test_search_posts_validates_author_type_values(self, test_app):
        """Test that author_type accepts valid values (all, companies, people)."""
        mock_response = {
            "success": True,
            "query": "test",
            "total_results": 0,
            "posts": [],
            "metadata": {}
        }

        with patch('api.routes.search_linkedin_posts', new_callable=AsyncMock) as mock_search:
            mock_search.return_value = mock_response

            # Test valid author_type values
            for author_type in ["all", "companies", "people"]:
                response = test_app.post("/api/search-posts", json={
                    "keywords": "test",
                    "author_type": author_type
                })
                assert response.status_code == 200

    def test_search_posts_returns_500_on_error(self, test_app):
        """Test that service exception returns 500 error with proper structure."""
        with patch('api.routes.search_linkedin_posts', new_callable=AsyncMock) as mock_search:
            mock_search.side_effect = Exception("Posts search API timeout")

            response = test_app.post("/api/search-posts", json={
                "keywords": "artificial intelligence"
            })

            assert response.status_code == 500
            data = response.json()
            assert "detail" in data
            assert data["detail"]["success"] is False
            assert data["detail"]["error"] == "Posts search failed"

    def test_search_posts_empty_results(self, test_app):
        """Test that empty search results return 200 OK with empty posts list."""
        mock_response = {
            "success": True,
            "query": "nonexistent topic xyz123",
            "total_results": 0,
            "posts": [],
            "metadata": {
                "keywords": "nonexistent topic xyz123",
                "author_type": "all",
                "country": "id",
                "language": "id",
                "pages_fetched": 1,
                "time_taken_seconds": 1.23
            }
        }

        with patch('api.routes.search_linkedin_posts', new_callable=AsyncMock) as mock_search:
            mock_search.return_value = mock_response

            response = test_app.post("/api/search-posts", json={
                "keywords": "nonexistent topic xyz123"
            })

            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert data["total_results"] == 0
            assert data["posts"] == []

    def test_search_posts_max_results_limit(self, test_app):
        """Test that max_results parameter is validated within range (1-100)."""
        # Test max_results too high
        response = test_app.post("/api/search-posts", json={
            "keywords": "test",
            "max_results": 500
        })
        assert response.status_code == 422

        # Test max_results too low (0)
        response = test_app.post("/api/search-posts", json={
            "keywords": "test",
            "max_results": 0
        })
        assert response.status_code == 422

        # Test valid max_results
        mock_response = {
            "success": True,
            "query": "test",
            "total_results": 0,
            "posts": [],
            "metadata": {}
        }
        with patch('api.routes.search_linkedin_posts', new_callable=AsyncMock) as mock_search:
            mock_search.return_value = mock_response

            response = test_app.post("/api/search-posts", json={
                "keywords": "test",
                "max_results": 100
            })
            assert response.status_code == 200

    def test_search_posts_response_serialization(self, test_app):
        """Test that response matches PostsSearchResponse Pydantic model schema."""
        mock_response = {
            "success": True,
            "query": "test query",
            "total_results": 1,
            "posts": [
                {
                    "post_url": "https://linkedin.com/posts/test-123",
                    "author_name": "Test Author",
                    "author_profile_url": "https://linkedin.com/in/testauthor",
                    "posted_date": "2025-12-28",
                    "content": "Test content",
                    "hashtags": ["#test"],
                    "likes": 10,
                    "comments": 5,
                    "shares": 2,
                    "post_type": "text",
                    "rank": 1
                }
            ],
            "metadata": {"test": "value"}
        }

        with patch('api.routes.search_linkedin_posts', new_callable=AsyncMock) as mock_search:
            mock_search.return_value = mock_response

            response = test_app.post("/api/search-posts", json={
                "keywords": "test"
            })

            assert response.status_code == 200
            data = response.json()

            # Verify required response fields
            assert "success" in data
            assert "query" in data
            assert "total_results" in data
            assert "posts" in data
            assert "metadata" in data
            assert isinstance(data["posts"], list)
            assert isinstance(data["metadata"], dict)

            # Verify post structure
            if data["posts"]:
                post = data["posts"][0]
                assert "post_url" in post
                assert "author_name" in post
                assert "author_profile_url" in post
                assert "posted_date" in post
                assert "content" in post
                assert "hashtags" in post
                assert "likes" in post
                assert "comments" in post
                assert "shares" in post
                assert "post_type" in post
                assert "rank" in post

    def test_search_posts_optional_fields_defaults(self, test_app):
        """Test that optional fields receive default values when not provided."""
        mock_response = {
            "success": True,
            "query": "test",
            "total_results": 0,
            "posts": [],
            "metadata": {}
        }

        with patch('api.routes.search_linkedin_posts', new_callable=AsyncMock) as mock_search:
            mock_search.return_value = mock_response

            response = test_app.post("/api/search-posts", json={
                "keywords": "test"
            })

            assert response.status_code == 200
            # Verify defaults were applied in the call
            call_kwargs = mock_search.call_args.kwargs
            assert call_kwargs["author_type"] == "all"
            assert call_kwargs["max_results"] == 20
            assert call_kwargs["location"] == ""
            assert call_kwargs["language"] == "id"
            assert call_kwargs["country"] == "id"
