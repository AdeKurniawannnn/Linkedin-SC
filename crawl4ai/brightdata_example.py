#!/usr/bin/env python3
"""
Complete example: Bright Data API for Google SERP queries
"""

import requests
import json
import re
from datetime import datetime

class BrightDataSERP:
    def __init__(self, api_key="c69f9a87-ded2-4064-a901-5439af92bb54", zone="serp_api1"):
        self.api_key = api_key
        self.zone = zone
        self.api_url = "https://api.brightdata.com/request"
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }

    def search(self, query, num_results=10):
        """Perform Google search and return structured results"""

        # Encode query for URL
        import urllib.parse
        encoded_query = urllib.parse.quote(query)
        google_url = f"https://www.google.com/search?q={encoded_query}&num={num_results}"

        # Request payload
        payload = {
            "zone": self.zone,
            "url": google_url,
            "format": "raw"
        }

        print(f"🔍 Searching Google for: '{query}'")
        print(f"📊 Requesting {num_results} results")
        print(f"⏰ {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 60)

        try:
            # Make request
            response = requests.post(self.api_url, headers=self.headers, json=payload, timeout=30)

            if response.status_code == 200:
                content = response.text
                print(f"✅ Success! Received {len(content):,} characters")

                # Extract search results
                results = self._extract_results(content, query)

                # Display results
                self._display_results(results, query)

                # Save to file
                self._save_results(results, query)

                return results

            else:
                print(f"❌ Error: HTTP {response.status_code}")
                print(f"Response: {response.text[:300]}")
                return None

        except Exception as e:
            print(f"❌ Exception: {e}")
            return None

    def _extract_results(self, html_content, query):
        """Extract structured search results from HTML"""

        results = []

        # Extract titles using regex (more reliable than parsing minified HTML)
        title_pattern = r'<h3[^>]*>(.*?)</h3>'
        title_matches = re.findall(title_pattern, html_content, re.DOTALL)

        # Clean titles
        clean_titles = []
        for title in title_matches:
            # Remove HTML tags
            clean_title = re.sub(r'<[^>]+>', '', title).strip()
            # Skip if too short or contains Google-specific text
            if len(clean_title) > 10 and not any(skip in clean_title.lower()
                for skip in ['search', 'web results', 'related searches', 'sponsored']):
                clean_titles.append(clean_title)

        # Extract URLs
        url_pattern = r'https?://[^\s<>"\'\)]+'
        all_urls = re.findall(url_pattern, html_content)

        # Filter URLs (exclude Google domains and common junk)
        clean_urls = []
        for url in all_urls:
            if not any(block in url.lower()
                for block in ['google.com', 'google.', 'gstatic.', 'favicon.', 'schema.org', 'w3.org']):
                clean_urls.append(url)

        # Extract snippets/descriptions
        snippet_pattern = r'<div[^>]*class="[^"]*VwiC3b[^"]*"[^>]*>(.*?)</div>'
        snippet_matches = re.findall(snippet_pattern, html_content, re.DOTALL)

        clean_snippets = []
        for snippet in snippet_matches:
            clean_snippet = re.sub(r'<[^>]+>', '', snippet).strip()
            clean_snippet = ' '.join(clean_snippet.split())  # Normalize whitespace
            if len(clean_snippet) > 20:
                clean_snippets.append(clean_snippet)

        # Combine results (basic pairing - could be improved)
        max_results = min(len(clean_titles), len(clean_urls), 10)

        for i in range(max_results):
            result = {
                "position": i + 1,
                "title": clean_titles[i] if i < len(clean_titles) else "No title",
                "url": clean_urls[i] if i < len(clean_urls) else "No URL",
                "snippet": clean_snippets[i] if i < len(clean_snippets) else "No description",
                "query": query,
                "timestamp": datetime.now().isoformat()
            }
            results.append(result)

        return results

    def _display_results(self, results, query):
        """Display search results in readable format"""

        if not results:
            print("❌ No results extracted")
            return

        print(f"\n📋 Found {len(results)} search results for '{query}':")
        print("-" * 60)

        for result in results:
            print(f"\n{result['position']}. **{result['title']}**")
            print(f"   🔗 {result['url']}")
            if result['snippet'] != "No description":
                print(f"   📝 {result['snippet'][:200]}...")

        print(f"\n📊 Summary: {len(results)} results extracted")
        print(f"🤖 LLM Ready: {len(json.dumps(results, ensure_ascii=False)):,} characters")

    def _save_results(self, results, query):
        """Save results to file for later use"""

        # Create filename from query
        safe_query = re.sub(r'[^\w\s-]', '', query).strip()[:30]
        safe_query = re.sub(r'[-\s]+', '_', safe_query)
        filename = f"serp_{safe_query}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"

        # Save to file
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2, ensure_ascii=False)

        print(f"💾 Saved to: {filename}")

def main():
    """Example usage"""

    # Initialize client
    serp_client = BrightDataSERP()

    # Example queries
    example_queries = [
        "Python machine learning libraries 2024",
        "web scraping best practices",
        "Claude AI vs ChatGPT comparison",
        "latest JavaScript frameworks"
    ]

    print("🚀 BRIGHT DATA GOOGLE SERP EXAMPLES")
    print("=" * 70)

    # Let user choose or use first example
    query = example_queries[0]
    print(f"\n📝 Example Query: '{query}'")
    print("Type your own query or press Enter to use example:")

    # For demo, use the first example
    user_query = input() or query

    # Perform search
    results = serp_client.search(user_query)

    if results:
        print(f"\n✨ Query completed successfully!")
        print(f"📈 Ready for LLM processing: {len(results)} structured results")

if __name__ == "__main__":
    main()