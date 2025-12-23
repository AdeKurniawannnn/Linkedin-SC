"""
Test script to see all available fields from SERP API
"""
import sys
import os
from pathlib import Path
import asyncio
import json

# Add serp-api-aggregator to path
serp_path = os.path.expanduser("~/Library/Mobile Documents/com~apple~CloudDocs/skills/serp-api-aggregator/src")
sys.path.insert(0, serp_path)

# Load env from parent directory
from dotenv import load_dotenv
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

from serp.client import SerpAggregator


async def test_serp_fields():
    """Fetch sample data and print all available fields"""

    async with SerpAggregator() as client:
        # Test company search
        print("=" * 60)
        print("TESTING: Company Search")
        print("=" * 60)
        result = await client.search(
            query="Emas linkedin.com/company papua",
            country="id",
            language="id",
            max_pages=1
        )

        print(f"\n📊 Total organic results: {len(result.organic)}")
        print(f"📄 Pages fetched: {result.pages_fetched}")

        if result.organic:
            print("\n" + "=" * 60)
            print("FIRST ORGANIC RESULT - ALL FIELDS:")
            print("=" * 60)
            first = result.organic[0]

            # Print semua attributes
            for attr in dir(first):
                if not attr.startswith('_'):
                    value = getattr(first, attr)
                    if not callable(value):
                        print(f"\n{attr}:")
                        if isinstance(value, (list, dict)):
                            print(json.dumps(value, indent=2, default=str))
                        else:
                            print(f"  {value}")

            print("\n" + "=" * 60)
            print("AS JSON:")
            print("=" * 60)
            # Try to serialize to JSON
            if hasattr(first, 'model_dump'):
                print(json.dumps(first.model_dump(), indent=2, default=str))
            elif hasattr(first, '__dict__'):
                print(json.dumps(first.__dict__, indent=2, default=str))

        # Also check profile search for comparison
        print("\n\n" + "=" * 60)
        print("TESTING: Profile Search")
        print("=" * 60)
        result2 = await client.search(
            query="Software Engineer linkedin.com/in/ Jakarta",
            country="id",
            language="id",
            max_pages=1
        )

        if result2.organic:
            print("\nFirst profile result:")
            first_profile = result2.organic[0]
            if hasattr(first_profile, 'model_dump'):
                print(json.dumps(first_profile.model_dump(), indent=2, default=str))


if __name__ == "__main__":
    asyncio.run(test_serp_fields())
