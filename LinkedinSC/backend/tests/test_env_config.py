"""
Tests for environment configuration validation

Ensures that critical environment variables and settings are properly
configured before running the application. These tests catch common
configuration mistakes early and provide clear guidance for setup.

Test Categories:
- API key configuration: Validates required API keys are set
- Settings loading: Ensures SerpSettings can be instantiated
- Configuration validation: Checks for invalid or incomplete configurations
"""
import os
from pathlib import Path
import pytest

# Load .env file from backend directory
try:
    from dotenv import load_dotenv
    backend_dir = Path(__file__).parent.parent
    env_file = backend_dir / ".env"
    if env_file.exists():
        load_dotenv(env_file)
except ImportError:
    pass  # dotenv not installed, rely on system env vars


# =============================================================================
# Tests: SERP API Key Configuration
# =============================================================================

@pytest.mark.unit
def test_serp_api_key_is_configured():
    """
    Test: SERP_BRIGHT_DATA_API_KEY environment variable is set.

    This test ensures the Bright Data API key is configured before running
    any scraper operations. Missing this configuration will cause all
    SERP searches to fail with unhelpful error messages.

    The test explicitly fails with a helpful message to guide setup.

    Failure message guides users to:
    1. Create a .env file in the backend directory
    2. Add SERP_BRIGHT_DATA_API_KEY=<your-api-key>
    3. Reload the environment or restart the application
    """
    api_key = os.getenv("SERP_BRIGHT_DATA_API_KEY")
    assert api_key is not None, (
        "SERP_BRIGHT_DATA_API_KEY environment variable is not set.\n\n"
        "Setup Instructions:\n"
        "1. Create a .env file in LinkedinSC/backend/ directory\n"
        "2. Add: SERP_BRIGHT_DATA_API_KEY=<your-bright-data-api-key>\n"
        "3. Get your API key from: https://brightdata.com/\n"
        "4. Reload your environment (source .env or restart terminal)\n\n"
        "Without this key, the SERP scraper cannot perform searches."
    )


@pytest.mark.unit
def test_serp_api_key_is_not_empty():
    """
    Test: SERP_BRIGHT_DATA_API_KEY is not an empty string.

    Validates that the API key has actual content. An empty string will
    cause auth failures in the Bright Data API.
    """
    api_key = os.getenv("SERP_BRIGHT_DATA_API_KEY", "").strip()
    assert len(api_key) > 0, (
        "SERP_BRIGHT_DATA_API_KEY environment variable is empty.\n\n"
        "Add a valid API key to your .env file:\n"
        "SERP_BRIGHT_DATA_API_KEY=<your-bright-data-api-key>"
    )


@pytest.mark.unit
def test_serp_api_key_has_minimum_length():
    """
    Test: SERP_BRIGHT_DATA_API_KEY meets minimum length requirement.

    Bright Data API keys should be reasonably long (typically 20+ characters).
    If the key is too short, it's likely a typo or incomplete paste.
    """
    api_key = os.getenv("SERP_BRIGHT_DATA_API_KEY", "").strip()
    assert len(api_key) >= 20, (
        f"SERP_BRIGHT_DATA_API_KEY appears to be invalid or incomplete.\n"
        f"Current length: {len(api_key)} characters (expected at least 20).\n\n"
        f"Did you paste the full API key? Check:\n"
        f"1. Copy the key again from Bright Data dashboard\n"
        f"2. Ensure no characters were truncated\n"
        f"3. Paste into .env file and save"
    )


# =============================================================================
# Tests: Settings Loading
# =============================================================================

@pytest.mark.unit
def test_serp_settings_can_be_loaded():
    """
    Test: SerpSettings can be instantiated with current environment.

    This validates that:
    1. The settings module can be imported
    2. SerpSettings pydantic model is valid
    3. All environment variables parse correctly
    4. No validation errors occur

    If this test fails, it usually means:
    - A required setting is invalid
    - An environment variable has the wrong type/format
    - Dependencies (pydantic-settings) are not installed
    """
    try:
        from serp.settings import SerpSettings

        # Attempt to instantiate fresh settings (not cached)
        settings = SerpSettings()

        assert settings is not None, "SerpSettings should be instantiable"
        assert isinstance(settings, SerpSettings), (
            "Settings should be a SerpSettings instance"
        )
    except ImportError as e:
        pytest.skip(f"serp-api-aggregator not installed: {e}")
    except Exception as e:
        pytest.fail(
            f"Failed to load SerpSettings: {type(e).__name__}: {e}\n\n"
            f"This usually means:\n"
            f"1. An environment variable has invalid format\n"
            f"2. A required setting is missing\n"
            f"3. Type validation failed (e.g., integer expected but string given)\n\n"
            f"Check your .env file for typos or invalid values."
        )


@pytest.mark.unit
def test_serp_settings_api_key_is_accessible():
    """
    Test: API key is properly loaded into SerpSettings.

    Validates that the bright_data_api_key setting is:
    1. Loaded from environment
    2. Stored as a SecretStr (for security)
    3. Accessible via the settings object

    Note: SecretStr hides the value in logs/repr for security.
    """
    try:
        from serp.settings import SerpSettings

        settings = SerpSettings()

        assert settings.bright_data_api_key is not None, (
            "bright_data_api_key should be loaded from SERP_BRIGHT_DATA_API_KEY"
        )

        # SecretStr should have get_secret_value() method
        assert hasattr(settings.bright_data_api_key, "get_secret_value"), (
            "API key should be stored as SecretStr for security"
        )

        # Verify the key value is accessible
        key_value = settings.bright_data_api_key.get_secret_value()
        assert len(key_value) > 0, (
            "API key value should not be empty"
        )
    except ImportError as e:
        pytest.skip(f"serp-api-aggregator not installed: {e}")
    except Exception as e:
        pytest.fail(
            f"Failed to access API key from SerpSettings: {type(e).__name__}: {e}"
        )


# =============================================================================
# Tests: Configuration Validity
# =============================================================================

@pytest.mark.unit
def test_serp_settings_defaults_are_reasonable():
    """
    Test: SerpSettings default values are sensible.

    Validates that default configuration values won't cause obvious issues:
    - Timeouts are positive and reasonable
    - Concurrency limits are within bounds
    - Cache settings are valid
    - Rate limiting settings are sensible

    This catches configuration changes that might break things silently.
    """
    try:
        from serp.settings import SerpSettings

        settings = SerpSettings()

        # Timeout should be positive and less than 2 minutes
        assert settings.request_timeout > 0, "request_timeout must be positive"
        assert settings.request_timeout <= 120, "request_timeout should be < 2 minutes"

        # Concurrency should be reasonable
        assert 1 <= settings.default_concurrency <= 200, (
            "default_concurrency should be between 1 and 200"
        )

        # Max pages should allow at least 1 page
        assert settings.default_max_pages >= 1, "default_max_pages should be >= 1"

        # Retry settings should be non-negative
        assert settings.max_retries >= 0, "max_retries should be non-negative"
        assert settings.retry_backoff >= 1.0, "retry_backoff should be >= 1.0"

        # Cache TTL should be non-negative (0 means no expiry, which is valid)
        assert settings.cache_ttl >= 0, "cache_ttl should be non-negative"

        # Rate limiting should be enabled and reasonable
        if settings.rate_limit_enabled:
            assert settings.rate_limit_rps > 0, "rate_limit_rps should be positive"
            assert settings.rate_limit_burst >= 1, "rate_limit_burst should be >= 1"

    except ImportError as e:
        pytest.skip(f"serp-api-aggregator not installed: {e}")
    except Exception as e:
        pytest.fail(
            f"SerpSettings has invalid defaults: {type(e).__name__}: {e}"
        )


# =============================================================================
# Tests: Integration
# =============================================================================

@pytest.mark.unit
def test_env_config_end_to_end():
    """
    Test: Complete configuration flow from environment to SerpSettings.

    This is an integration test of the environment configuration system.
    It validates the end-to-end flow:
    1. API key exists in environment
    2. SerpSettings can load it
    3. Settings are valid and accessible
    4. Default values are reasonable

    If this test fails, the application likely cannot run successfully.
    """
    # Check API key is set
    api_key = os.getenv("SERP_BRIGHT_DATA_API_KEY")
    assert api_key, "SERP_BRIGHT_DATA_API_KEY not configured"

    # Load settings
    try:
        from serp.settings import SerpSettings

        settings = SerpSettings()

        # Verify settings are loaded
        assert settings.bright_data_api_key is not None
        assert settings.api_base_url == "https://api.brightdata.com"
        assert settings.default_country == "us"
        assert settings.default_language == "en"

        # Verify settings are usable
        assert settings.max_poll_time > 0
        assert settings.default_max_pages > 0

    except Exception as e:
        pytest.fail(
            f"Complete configuration flow failed: {type(e).__name__}: {e}\n\n"
            f"The application cannot run successfully with this configuration."
        )
