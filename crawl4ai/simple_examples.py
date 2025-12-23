#!/usr/bin/env python3
"""
Simple Bright Data API query examples
"""

import requests
import json

def simple_search(query, api_key="c69f9a87-ded2-4064-a901-5439af92bb54"):
    """Simple search function"""

    import urllib.parse
    encoded_query = urllib.parse.quote(query)
    google_url = f"https://www.google.com/search?q={encoded_query}"

    payload = {
        "zone": "serp_api1",
        "url": google_url,
        "format": "raw"
    }

    response = requests.post(
        "https://api.brightdata.com/request",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        },
        json=payload,
        timeout=30
    )

    if response.status_code == 200:
        return response.text
    else:
        return None

# Example usage examples
examples = [
    {
        "query": "latest AI news 2024",
        "description": "Search for recent AI developments"
    },
    {
        "query": "web scraping Python tutorial",
        "description": "Find learning resources"
    },
    {
        "query": "Claude vs GPT-4 comparison",
        "description": "Compare AI models"
    },
    {
        "query": "best restaurants New York 2024",
        "description": "Local business search"
    }
]

print("🚀 SIMPLE BRIGHT DATA QUERY EXAMPLES")
print("=" * 50)

for i, example in enumerate(examples, 1):
    print(f"\n{i}. {example['description']}")
    print(f"   Query: '{example['query']}'")
    print(f"   curl:")
    print(f"   curl \"https://api.brightdata.com/request\" \\")
    print(f"     -H \"Authorization: Bearer c69f9a87-ded2-4064-a901-5439af92bb54\" \\")
    print(f"     -H \"Content-Type: application/json\" \\")
    print(f"     -d '{{\"zone\": \"serp_api1\", \"url\": \"https://www.google.com/search?q={urllib.parse.quote(example['query'])}\", \"format\": \"raw\"}}'")

# Quick demo with first example
print(f"\n📝 Running quick demo: '{examples[0]['query']}'")
print("-" * 50)

import urllib.parse
result = simple_search(examples[0]['query'])

if result:
    print(f"✅ Success! Received {len(result):,} characters")

    # Extract a quick preview
    import re
    titles = re.findall(r'<h3[^>]*>(.*?)</h3>', result)
    clean_titles = [re.sub(r'<[^>]+>', '', title).strip() for title in titles[:5] if title.strip()]

    print(f"📊 Found {len(clean_titles)} top results:")
    for i, title in enumerate(clean_titles, 1):
        print(f"   {i}. {title[:80]}...")

else:
    print("❌ Query failed")

print(f"\n💡 Usage Tips:")
print("   • Results are complete HTML documents")
print("   • Text extraction is ~50% of content")
print("   • Ready for LLM processing")
print("   • No rate limiting or blocking issues")