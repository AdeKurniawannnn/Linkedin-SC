"""
LinkedIn scraping service using serp-api-aggregator
"""
import time
import sys
import os
import re
from typing import Dict, Optional

from pathlib import Path
from datetime import datetime

# Add serp-api-aggregator to Python path
# It's located in the sibling directory of LinkedinSC
current_file = Path(__file__).resolve()
# parents[0]=services, [1]=backend, [2]=LinkedinSC, [3]=root (Linkedin SC)
serp_path = current_file.parents[3] / "serp-api-aggregator" / "src"

if not serp_path.exists():
    # Fallback/Debug check
    print(f"[ERROR] serp-api-aggregator not found at {serp_path}")
    # Try another common location if needed or use the absolute path we know works
    serp_path = Path("/Users/adekurniawan/Library/Mobile Documents/com~apple~CloudDocs/Linkedin SC/serp-api-aggregator/src")

if str(serp_path) not in sys.path:
    sys.path.insert(0, str(serp_path))

from serp.client import SerpAggregator
from models import LinkedInProfile, CompanyDetail, RelatedCompany, EmployeeInfo, LinkedInPost, LinkedInJob, LinkedInAllResult


def parse_company_description(description: str) -> Dict[str, Optional[any]]:
    """
    Parse company description to extract structured data

    Example description:
    "Vertilogic. Jasa TI dan Konsultan TI. Ukuran perusahaan: 2-10 karyawan.
    Kantor Pusat: Jakarta, DKI Jakarta. Jenis: Perseroan Tertutup.
    Tahun Pendirian: 2015. Spesialisasi: ..."

    Returns:
        Dict with parsed fields: industry, location, followers, company_size, etc.
    """
    if not description:
        return {}

    parsed = {}

    # Extract industry (first sentence after company name, before location)
    # Pattern: "Company Name. Industry Type. Location..."
    industry_match = re.search(r'\.([^.]+?)\.\s*(?:Ukuran|Kantor|Jenis|Tahun|\d+\s+pengikut|[A-Z][a-z]+,)', description)
    if not industry_match:
        # Alternative: industry might be before location pattern "City, Country"
        industry_match = re.search(r'\.([^.]+?)\.\s*[A-Z][a-z]+,\s*[A-Z]', description)
    if industry_match:
        parsed['industry'] = industry_match.group(1).strip()

    # Extract followers: "X pengikut" or "X followers"
    followers_match = re.search(r'([\d.,]+)\s+(?:pengikut|followers)', description, re.IGNORECASE)
    if followers_match:
        followers_str = followers_match.group(1).replace('.', '').replace(',', '')
        try:
            parsed['followers'] = int(followers_str)
        except ValueError:
            pass

    # Extract company size: "Ukuran perusahaan: X karyawan"
    size_match = re.search(r'Ukuran perusahaan:\s*([^.]+?)(?:\.|$)', description, re.IGNORECASE)
    if size_match:
        parsed['company_size'] = size_match.group(1).strip()

    # Extract headquarters: "Kantor Pusat: Location"
    hq_match = re.search(r'Kantor Pusat:\s*([^.]+?)(?:\.|$)', description, re.IGNORECASE)
    if hq_match:
        parsed['headquarters'] = hq_match.group(1).strip()

    # Extract company type: "Jenis: Type"
    type_match = re.search(r'Jenis:\s*([^.]+?)(?:\.|$)', description, re.IGNORECASE)
    if type_match:
        parsed['company_type'] = type_match.group(1).strip()

    # Extract founded year: "Tahun Pendirian: YYYY"
    year_match = re.search(r'Tahun Pendirian:\s*(\d{4})', description, re.IGNORECASE)
    if year_match:
        try:
            parsed['founded_year'] = int(year_match.group(1))
        except ValueError:
            pass

    # Extract location from "City, Country" pattern if not HQ
    if 'headquarters' not in parsed:
        location_match = re.search(r'([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?),\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)', description)
        if location_match:
            parsed['location'] = f"{location_match.group(1)}, {location_match.group(2)}"
    else:
        parsed['location'] = parsed['headquarters']

    return parsed


async def search_linkedin_profiles(
    role: str,
    location: str = "",
    country: str = "us",
    language: str = "en",
    max_pages: int = 5,
    site_filter: str = "profile"
) -> Dict:
    """
    Search LinkedIn profiles menggunakan serp-api-aggregator

    Fetch pages sampai mendapat target jumlah profiles (max_pages * 10)
    atau mencapai batas maksimum pages.

    Args:
        role: Job role atau position (e.g., 'IT Programmer')
        location: Location/city (e.g., 'Jakarta', 'Singapore')
        country: Country code (default: 'us')
        language: Language code (default: 'en')
        max_pages: Target pages - akan fetch sampai dapat (max_pages * 10) profiles
        site_filter: LinkedIn content type (profile, posts, jobs, company, all)

    Returns:
        Dict dengan hasil scraping
    """
    start_time = time.time()

    # Build query - auto-detect site filter from role
    # If role already contains linkedin.com/company, jangan tambahkan linkedin.com/in/
    # Otherwise, tambahkan linkedin.com/in/ untuk profile search
    if "linkedin.com/company" in role:
        # Company search - role sudah lengkap dengan linkedin.com/company
        query = role
        url_filter = "linkedin.com/company"
    else:
        # Profile search - tambahkan linkedin.com/in/
        query = f"{role} linkedin.com/in/"
        url_filter = "linkedin.com/in/"

    if location.strip():
        query += f" {location.strip()}"

    # Calculate target profiles: EXACTLY max_pages * 10
    target_profiles = max_pages * 10

    # Fetch strategy: Fetch extra pages to ensure we get enough after filtering
    # Profile search: ~60-70% results are profiles (rest filtered out)
    # Company search: ~50-60% results are companies (rest filtered out)
    # Fetch 5x pages to ensure we have enough after filtering
    fetch_pages = max_pages * 5

    # Initialize SERP client with async context manager
    async with SerpAggregator() as client:
        # Fetch pages from Google
        result = await client.search(
            query=query,
            country=country,
            language=language,
            max_pages=fetch_pages,
            use_cache=False
        )

        pages_scraped = result.pages_fetched

        # Debug logging
        print(f"[DEBUG] Query: {query}")
        print(f"[DEBUG] URL filter: {url_filter}")
        print(f"[DEBUG] Total organic results from Google: {len(result.organic)}")

        # Parse hasil SERP dan filter by site type
        profiles = []
        for i, organic_result in enumerate(result.organic):
            # Debug: print first 5 results
            if i < 5:
                print(f"[DEBUG] Result {i+1}: {organic_result.link}")

            if url_filter in organic_result.link:
                # Parse title untuk extract name dan headline
                # Format biasa: "Name - Headline at Company"
                title_parts = organic_result.title.split(' - ', 1)
                name = title_parts[0].strip()
                headline = title_parts[1].strip() if len(title_parts) > 1 else None

                # Get SERP description/snippet
                description = organic_result.description or ""

                # Parse company data if this is a company search
                parsed_data = {}
                if url_filter == "linkedin.com/company":
                    parsed_data = parse_company_description(description)

                profile = LinkedInProfile(
                    name=name,
                    headline=headline,
                    description=description,
                    location=parsed_data.get('location'),
                    company=None,
                    education=None,
                    connections=None,
                    profile_url=organic_result.link,
                    rank=organic_result.rank,
                    best_position=organic_result.best_position,
                    frequency=organic_result.frequency,
                    pages_seen=organic_result.pages_seen,
                    # Company-specific parsed fields
                    industry=parsed_data.get('industry'),
                    followers=parsed_data.get('followers'),
                    company_size=parsed_data.get('company_size'),
                    founded_year=parsed_data.get('founded_year'),
                    company_type=parsed_data.get('company_type'),
                    headquarters=parsed_data.get('headquarters')
                )
                profiles.append(profile)

                # Stop once we have enough profiles (optimization)
                if len(profiles) >= target_profiles:
                    break

        # Truncate to EXACTLY target_profiles
        if len(profiles) > target_profiles:
            profiles = profiles[:target_profiles]

    # Sort profiles by best_position (ascending), then by frequency (descending)
    profiles.sort(key=lambda p: (p.best_position, -p.frequency))

    time_taken = time.time() - start_time

    return {
        "success": True,
        "query": query,
        "total_results": len(profiles),
        "profiles": [p.model_dump() for p in profiles],
        "metadata": {
            "country": country,
            "language": language,
            "pages_requested": max_pages,
            "pages_scraped": pages_scraped,
            "target_profiles": target_profiles,
            "time_taken_seconds": round(time_taken, 2)
        }
    }


def validate_linkedin_url(url: str) -> bool:
    """Validate if URL is a LinkedIn profile"""
    return "linkedin.com/in/" in url.lower()


async def scrape_company_details(urls: list[str]) -> Dict:
    """
    Scrape detailed company information dari LinkedIn company pages
    menggunakan Crawl4AI

    Args:
        urls: List of LinkedIn company URLs

    Returns:
        Dict dengan detailed company information
    """
    start_time = time.time()

    try:
        # Import Crawl4AI
        from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig, CacheMode

        # Configure browser untuk LinkedIn scraping
        browser_config = BrowserConfig(
            headless=True,
            viewport_width=1920,
            viewport_height=1080,
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
        )

        # Configure crawler
        crawler_config = CrawlerRunConfig(
            cache_mode=CacheMode.BYPASS,
            remove_overlay_elements=True,
            wait_for_images=False,
            page_timeout=30000,  # 30 seconds
            screenshot=False
        )

        companies = []

        async with AsyncWebCrawler(config=browser_config) as crawler:
            for url in urls:
                print(f"[CRAWL4AI] Scraping {url}...")

                try:
                    # Crawl the company page
                    result = await crawler.arun(
                        url=url,
                        config=crawler_config
                    )

                    if not result.success:
                        print(f"[CRAWL4AI] Failed to scrape {url}: {result.error_message}")
                        continue

                    # Extract company info from markdown
                    markdown = result.markdown
                    metadata = result.metadata

                    print(f"[CRAWL4AI] Markdown length: {len(markdown)} chars")

                    # Parse company name from title
                    company_name = metadata.get('title', '').split('|')[0].strip()

                    # Debug: Save markdown to file for inspection
                    debug_file = f"/tmp/linkedin_scrape_{company_name.replace(' ', '_')}.md"
                    with open(debug_file, 'w', encoding='utf-8') as f:
                        f.write(markdown)
                    print(f"[DEBUG] Saved markdown to {debug_file}")
                    print(f"[DEBUG] Company: {company_name}")

                    # Extract tagline (## header after company name)
                    tagline_match = re.search(rf'#\s+{re.escape(company_name)}\s*\n##\s+([^\n]+)', markdown)
                    tagline = tagline_match.group(1).strip() if tagline_match else None

                    # Translate common Norwegian/Indonesian industry terms to English
                    translation_dict = {
                        # Norwegian
                        'Produksjon av motorvogner': 'Motor Vehicle Manufacturing',
                        'Produksjon av automasjonsmaskiner': 'Industrial Machinery Manufacturing',
                        'Produksjon': 'Manufacturing',
                        'Perikanan': 'Fisheries',
                        'Tjenester': 'Services',
                        'Teknologi': 'Technology',
                        'Programvareutvikling': 'Software Development',
                        'Detaljhandel': 'Retail',
                        'Matproduksjon': 'Food Production',
                        'Bil og kjøretøy': 'Automotive',
                        'Konsulentvirksomhet': 'Consulting',
                        'Bygg og anlegg': 'Construction',
                        'Helsevesen': 'Healthcare',
                        'Utdanning': 'Education',
                        'Transport og logistikk': 'Transportation and Logistics',
                        # Indonesian
                        'Pertambangan': 'Mining',
                        'Jasa TI dan Konsultan TI': 'IT Services and IT Consulting',
                        'Konstruksi': 'Construction',
                        'Pendidikan': 'Education',
                        'Kesehatan': 'Healthcare',
                        'Keuangan': 'Finance',
                        'Telekomunikasi': 'Telecommunications',
                        'Energi': 'Energy',
                        'Pariwisata': 'Tourism',
                        'Perhotelan': 'Hospitality',
                        'Transportasi': 'Transportation',
                        'Logistik': 'Logistics',
                        'Ritel': 'Retail',
                        'E-commerce': 'E-commerce',
                        'Media': 'Media',
                        'Periklanan': 'Advertising'
                    }
                    if tagline and tagline in translation_dict:
                        tagline = translation_dict[tagline]

                    # Extract location (### header after tagline)
                    location_match = re.search(r'###\s+([^\n]+)', markdown)
                    location = location_match.group(1).strip() if location_match else None

                    # Extract industry (Bransje/Industry/Industri field)
                    industry_match = re.search(r'(?:Bransje|Industry|Industri)\s*\n\s*([^\n]+)', markdown, re.IGNORECASE)
                    industry = industry_match.group(1).strip() if industry_match else tagline  # Fallback to tagline
                    # Clean industry field - remove unwanted text
                    if industry:
                        industry = re.sub(r'\s+(Bedriftsstørrelse|Company size|Ukuran perusahaan).*$', '', industry, flags=re.IGNORECASE).strip()
                        # Translate if Norwegian/Indonesian
                        if industry in translation_dict:
                            industry = translation_dict[industry]

                    # Extract company size/employee count (Bedriftsstørrelse/Company size/Ukuran perusahaan)
                    size_match = re.search(r'(?:Bedriftsstørrelse|Company size|Ukuran perusahaan)\s*\n\s*([^\n]+)', markdown, re.IGNORECASE)
                    employee_count_range = size_match.group(1).strip() if size_match else None
                    # Clean employee count - remove unwanted text
                    if employee_count_range:
                        employee_count_range = re.sub(r'\s+(Hovedkontor|Headquarters|Kantor Pusat).*$', '', employee_count_range, flags=re.IGNORECASE).strip()
                        # Translate Norwegian terms to English
                        employee_count_range = employee_count_range.replace('ansatte', 'employees')

                    # Extract founded year (Grunnlagt/Founded/Tahun Pendirian)
                    founded_match = re.search(r'(?:Grunnlagt|Founded|Tahun Pendirian)\s*\n\s*(\d{4})', markdown, re.IGNORECASE)
                    founded_year = int(founded_match.group(1)) if founded_match else None

                    # Extract followers - not always available
                    followers_match = re.search(r'([\d.,]+[krbKRB]*)\s+(?:pengikut|followers|følgere)', markdown, re.IGNORECASE)
                    followers = followers_match.group(1).strip() if followers_match else None

                    # Extract full description from "Om oss" / "About" / "Gambaran Umum" section
                    overview_match = re.search(r'##\s+(?:Om oss|About|About us|Tentang|Gambaran Umum)\s*\n([^\n#]+(?:\n(?!##|Nettsted|Website|Ekstern)[^\n#]+)*)', markdown, re.IGNORECASE)
                    full_description = overview_match.group(1).strip() if overview_match else None
                    # Remove extra whitespace and clean up
                    if full_description:
                        # Remove "Nettsted" and URLs from description
                        full_description = re.sub(r'\s*(?:Nettsted|Website)\s*\[.*?\]\(.*?\)', '', full_description, flags=re.IGNORECASE)
                        # Remove "Ekstern lenke" text
                        full_description = re.sub(r'\s*Ekstern lenke.*$', '', full_description, flags=re.IGNORECASE)
                        # Clean up whitespace
                        full_description = ' '.join(full_description.split())

                    # Extract specialties (Spesialiteter/Specialties/Spesialisasi)
                    specialties_match = re.search(r'(?:Spesialiteter|Specialties|Spesialisasi)\s*\n\s*([^\n]+)', markdown, re.IGNORECASE)
                    specialties = None
                    if specialties_match:
                        specialties_text = specialties_match.group(1).strip()
                        specialties = [s.strip() for s in specialties_text.split(',')]

                    # Extract website (Nettsted/Website)
                    website_match = re.search(r'(?:Nettsted|Website)\s*\n\s*\[\s*([^\]]+)\s*\]', markdown, re.IGNORECASE)
                    website = website_match.group(1).strip() if website_match else None

                    # Debug: Print extracted fields
                    print(f"[DEBUG] Extracted fields:")
                    print(f"  - Tagline: {tagline}")
                    print(f"  - Location: {location}")
                    print(f"  - Industry: {industry}")
                    print(f"  - Employee count: {employee_count_range}")
                    print(f"  - Founded: {founded_year}")
                    print(f"  - Followers: {followers}")
                    print(f"  - Website: {website}")
                    print(f"  - Specialties: {len(specialties) if specialties else 0} items")
                    print(f"  - Description length: {len(full_description) if full_description else 0} chars")

                    # Extract employee growth
                    growth_match = re.search(r'([\d,]+)\s*\n\s*Pertumbuhan karyawan', markdown, re.IGNORECASE)
                    employee_growth = growth_match.group(1).strip() if growth_match else None

                    # Extract top employee schools
                    schools = []
                    school_matches = re.finditer(r'(\d+)\s+karyawan bersekolah di\s+([^\n]+)', markdown, re.IGNORECASE)
                    for match in school_matches:
                        count = match.group(1)
                        school = match.group(2).strip()
                        schools.append(f"{count} dari {school}")

                    # Extract recent hires
                    recent_hires = []
                    hires_match = re.search(r'Karyawan baru\s*\n[^\n]*\n([^\n]+)', markdown, re.IGNORECASE)
                    if hires_match:
                        hires_text = hires_match.group(1).strip()
                        # Parse "Wahid dan 2 lainnya" pattern
                        names = re.findall(r'([A-Z][a-z]+)', hires_text)
                        for name in names[:3]:  # Limit to 3
                            recent_hires.append(EmployeeInfo(name=name))

                    # Extract related companies
                    related_companies = []
                    # Pattern 1: "Logo halaman CompanyName\nIndustry\n287.060 pengikut"
                    related_matches = re.finditer(r'Logo halaman\s+([^\n]+)\s*\n([^\n]+)\s*\n([\d.,]+)\s+pengikut', markdown)
                    for match in related_matches:
                        company_name_rel = match.group(1).strip()
                        industry_rel = match.group(2).strip()
                        followers_rel = match.group(3).strip()
                        # Skip if name contains markdown syntax
                        if not any(char in company_name_rel for char in ['[', ']', '(', ')', '#', '*']):
                            related_companies.append(RelatedCompany(
                                name=company_name_rel,
                                industry=industry_rel,
                                followers=followers_rel
                            ))

                    # Pattern 2: Alternative without "Logo halaman" - company name followed by industry and followers
                    if len(related_companies) < 3:
                        alt_matches = re.finditer(r'\n([A-Z][^\n]{10,80})\s*\n([A-Za-z][^\n]{5,40})\s*\n([\d.,]+[krbKRB]*)\s+pengikut', markdown)
                        for match in alt_matches:
                            company_name_rel = match.group(1).strip()
                            industry_rel = match.group(2).strip()
                            followers_rel = match.group(3).strip()
                            # Skip if already added or contains markdown
                            if (not any(char in company_name_rel for char in ['[', ']', '(', ')', '#', '*']) and
                                not any(c.name == company_name_rel for c in related_companies)):
                                related_companies.append(RelatedCompany(
                                    name=company_name_rel,
                                    industry=industry_rel,
                                    followers=followers_rel
                                ))
                            if len(related_companies) >= 5:
                                break

                    # Extract alumni working here
                    alumni = []
                    # Look for name followed by position (without markdown syntax)
                    alumni_matches = re.finditer(r'([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})\s*\n([A-Za-z][A-Za-z\s]+(?:di|at)\s+[A-Za-z][^\n![\]()]{10,60}?)(?:\n|$)', markdown)
                    for match in alumni_matches:
                        name = match.group(1).strip()
                        position = match.group(2).strip()
                        # Filter out markdown/HTML syntax
                        if not any(char in position for char in ['[', ']', '(', ')', '!', '*', '#']):
                            if len(name.split()) >= 2 and len(name.split()) <= 4:  # Reasonable name length
                                alumni.append(EmployeeInfo(name=name, position=position))
                        if len(alumni) >= 5:  # Limit to 5
                            break

                    # Create company detail object
                    company_detail = CompanyDetail(
                        url=url,
                        name=company_name,
                        tagline=tagline,
                        industry=industry,
                        location=location,
                        followers=followers,
                        employee_count_range=employee_count_range,
                        full_description=full_description or f"[Scraped from {url}]",
                        specialties=specialties,
                        about=full_description,
                        website=website,
                        phone=None,  # Not extracted yet
                        founded=founded_year,
                        employee_growth=employee_growth,
                        top_employee_schools=schools if schools else None,
                        recent_hires=recent_hires if recent_hires else None,
                        related_companies=related_companies[:5] if related_companies else None,  # Limit to 5
                        alumni_working_here=alumni if alumni else None,
                        scraped_at=datetime.now().isoformat()
                    )

                    companies.append(company_detail)
                    print(f"[CRAWL4AI] ✅ Scraped {company_name} successfully")

                except Exception as e:
                    print(f"[CRAWL4AI] ❌ Error scraping {url}: {str(e)}")
                    continue

    except ImportError as e:
        print(f"[CRAWL4AI] Import error: {e}")
        # Return mock data if Crawl4AI not available
        return {
            "success": False,
            "total_scraped": 0,
            "companies": [],
            "metadata": {
                "error": "Crawl4AI not installed",
                "detail": str(e)
            }
        }

    time_taken = time.time() - start_time

    return {
        "success": True,
        "total_scraped": len(companies),
        "companies": [c.model_dump() for c in companies],
        "metadata": {
            "total_urls": len(urls),
            "successful": len(companies),
            "failed": len(urls) - len(companies),
            "time_taken_seconds": round(time_taken, 2)
        }
    }


async def search_linkedin_posts(
    keywords: str,
    author_type: str = "all",
    max_results: int = 20,
    location: str = "",
    country: str = "id",
    language: str = "id"
) -> Dict:
    """
    Search LinkedIn posts menggunakan serp-api-aggregator
    
    Args:
        keywords: Keywords untuk cari posts
        author_type: Filter by author (all, companies, people)
        max_results: Target jumlah posts (max 100)
        location: Location filter (optional)
        country: Country code
        language: Language code
        
    Returns:
        Dict dengan hasil scraping posts
    """
    start_time = time.time()
    
    # Build query
    query = f"{keywords} site:linkedin.com/posts"
    
    # Add author type filter
    if author_type == "companies":
        query += " site:linkedin.com/company/*/posts"
    elif author_type == "people":
        query += " site:linkedin.com/in/*/activity"
    
    if location.strip():
        query += f" {location.strip()}"
    
    # Calculate pages needed (10 results per page)
    max_pages = max(1, (max_results + 9) // 10)  # Round up
    
    # Initialize SERP client
    async with SerpAggregator() as client:
        # Fetch pages from Google
        result = await client.search(
            query=query,
            country=country,
            language=language,
            max_pages=max_pages,
            use_cache=False
        )
        
        pages_scraped = result.pages_fetched
        
        print(f"[DEBUG] Posts Query: {query}")
        print(f"[DEBUG] Total organic results: {len(result.organic)}")
        
        # Parse results
        posts = []
        for i, organic_result in enumerate(result.organic):
            # Filter only linkedin.com/posts or linkedin.com/feed/update URLs
            if "/posts/" in organic_result.link or "/feed/update/" in organic_result.link:
                # Extract author name from title
                # Format biasa: "AuthorName on LinkedIn: PostContent..." or just "PostTitle"
                title_parts = organic_result.title.split(" on LinkedIn:", 1)
                if len(title_parts) > 1:
                    author_name = title_parts[0].strip()
                    post_preview = title_parts[1].strip()
                else:
                    # Fallback: Extract dari URL
                    author_name = None
                    post_preview = organic_result.title.strip()

                # Extract author profile URL dan name dari link
                author_profile_url = ""
                username = ""

                # Pattern 1: linkedin.com/posts/username_xxx
                match = re.search(r'/posts/([^_/]+)', organic_result.link)
                if match:
                    username = match.group(1).strip()
                    author_profile_url = f"https://linkedin.com/in/{username}"

                # Pattern 2: linkedin.com/in/username/posts/
                if not author_profile_url:
                    match = re.search(r'/in/([^/]+)', organic_result.link)
                    if match:
                        username = match.group(1).strip()
                        author_profile_url = f"https://linkedin.com/in/{username}"

                # Pattern 3: linkedin.com/company/companyname/posts/
                if not author_profile_url:
                    match = re.search(r'/company/([^/]+)', organic_result.link)
                    if match:
                        username = match.group(1).strip()
                        author_profile_url = f"https://linkedin.com/company/{username}"

                # Set author_name dari username jika belum ada
                if not author_name and username:
                    # Convert username to readable name
                    # pt-finnet-indonesia → PT Finnet Indonesia
                    # davidmaruli07 → Davidmaruli07
                    readable_name = username.replace('-', ' ').title()
                    author_name = readable_name

                # Final fallback
                if not author_name:
                    author_name = "LinkedIn User"

                # Content from description (SERP snippet) or title preview
                content = organic_result.description or post_preview

                # Extract hashtags from content and title - more aggressive
                full_text = f"{organic_result.title} {content}"
                # Match #word but not #numbers-only
                hashtags = list(set(re.findall(r'#[a-zA-Z][a-zA-Z0-9_]*', full_text)))  # Remove duplicates
                
                # Mock engagement data (SERP doesn't provide this)
                # In real implementation, would need Crawl4AI to scrape actual post page
                
                post = LinkedInPost(
                    post_url=organic_result.link,
                    author_name=author_name,
                    author_profile_url=author_profile_url,
                    posted_date=datetime.now().strftime("%Y-%m-%d"),  # SERP doesn't provide date
                    content=content[:500],  # Limit content length
                    hashtags=hashtags[:10],  # Limit hashtags
                    likes=0,  # Would need Crawl4AI to get actual data
                    comments=0,
                    shares=0,
                    post_type="text",  # Default, would need scraping to detect
                    rank=organic_result.rank
                )
                posts.append(post)
                
                # Stop once we have enough posts
                if len(posts) >= max_results:
                    break
        
        # Truncate to exact max_results
        if len(posts) > max_results:
            posts = posts[:max_results]
    
    time_taken = time.time() - start_time
    
    return {
        "success": True,
        "query": query,
        "total_results": len(posts),
        "posts": [p.model_dump() for p in posts],
        "metadata": {
            "keywords": keywords,
            "author_type": author_type,
            "country": country,
            "language": language,
            "pages_fetched": pages_scraped,
            "time_taken_seconds": round(time_taken, 2)
        }
    }


async def search_linkedin_jobs(
    job_title: str,
    location: str = "",
    experience_level: str = "all",
    max_results: int = 20,
    country: str = "id",
    language: str = "id"
) -> Dict:
    """
    Search LinkedIn jobs menggunakan serp-api-aggregator

    Args:
        job_title: Job title atau position yang dicari
        location: Location filter (optional)
        experience_level: Experience level filter
        max_results: Target jumlah jobs (max 100)
        country: Country code
        language: Language code

    Returns:
        Dict dengan hasil scraping jobs
    """
    start_time = time.time()

    # Build query - use /jobs/view/ to get actual job postings, not job lists
    query = f"{job_title} site:linkedin.com/jobs/view"

    # Add location to query
    if location.strip():
        query += f" {location.strip()}"

    # Calculate pages needed (10 results per page)
    max_pages = max(1, (max_results + 9) // 10)  # Round up

    # Initialize SERP client
    async with SerpAggregator() as client:
        # Fetch pages from Google
        result = await client.search(
            query=query,
            country=country,
            language=language,
            max_pages=max_pages,
            use_cache=False
        )

        pages_scraped = result.pages_fetched

        print(f"[DEBUG] Jobs Query: {query}")
        print(f"[DEBUG] Total organic results: {len(result.organic)}")

        # Parse results
        jobs = []
        for i, organic_result in enumerate(result.organic):
            # Filter only linkedin.com/jobs URLs
            if "/jobs/view/" in organic_result.link or "linkedin.com/jobs/" in organic_result.link:
                # Extract job title and company from title
                # Format variations:
                # 1. "Job Title - Company Name"
                # 2. "Job Title at Company Name"
                # 3. "Company membuka lowongan Job Title"
                # 4. "Job Title"
                job_title_clean = organic_result.title
                company_name = ""

                # Pattern 1: "Company membuka lowongan Job Title"
                if "membuka lowongan" in job_title_clean:
                    parts = job_title_clean.split(" membuka lowongan ", 1)
                    if len(parts) > 1:
                        company_name = parts[0].strip()
                        # Remove " di Area ..." from job title
                        job_title_clean = parts[1].split(" di ")[0].strip()
                # Pattern 2: "Job Title - Company Name"
                elif " - " in job_title_clean:
                    parts = job_title_clean.split(" - ", 1)
                    job_title_clean = parts[0].strip()
                    company_name = parts[1].strip() if len(parts) > 1 else ""
                # Pattern 3: "Job Title at Company Name"
                elif " at " in job_title_clean:
                    parts = job_title_clean.split(" at ", 1)
                    job_title_clean = parts[0].strip()
                    company_name = parts[1].strip() if len(parts) > 1 else ""

                # Try to extract from URL if company still empty
                # URL format: linkedin.com/jobs/view/job-title-at-company-name-123
                if not company_name:
                    # Match "at-company-slug-number" pattern, excluding pure numbers
                    url_match = re.search(r'/jobs/view/.*?-at-([a-zA-Z][a-zA-Z0-9-]*)-\d+', organic_result.link)
                    if url_match:
                        company_slug = url_match.group(1)
                        # Convert slug to readable: pt-temas-tbk → Pt Temas Tbk, trend-micro → Trend Micro
                        company_name = company_slug.replace('-', ' ').title()

                # Extract location from description if available
                job_location = location if location else ""
                description = organic_result.description or ""

                # Try to extract location from description patterns
                # Look for explicit "Location:" or "Lokasi:" patterns
                location_match = re.search(r'(?:Location|Lokasi):\s*([^·\n,.;]+)', description)
                if location_match:
                    job_location = location_match.group(1).strip()
                    # Limit to first 50 chars to avoid long descriptions
                    if len(job_location) > 50:
                        job_location = location if location else "Not specified"
                elif not job_location:
                    # Try to find pattern like "Jakarta" or "Jakarta, Indonesia"
                    # Only use if it's early in description (first 100 chars)
                    desc_start = description[:100]
                    location_patterns = re.findall(r'\b(Jakarta|Surabaya|Bandung|Indonesia|Remote)\b', desc_start)
                    if location_patterns:
                        job_location = location_patterns[0]

                job = LinkedInJob(
                    job_url=organic_result.link,
                    job_title=job_title_clean,
                    company_name=company_name or "LinkedIn",
                    location=job_location or "Not specified",
                    description=description[:500],  # Limit description length
                    rank=organic_result.rank
                )
                jobs.append(job)

                # Stop once we have enough jobs
                if len(jobs) >= max_results:
                    break

        # Truncate to exact max_results
        if len(jobs) > max_results:
            jobs = jobs[:max_results]

    time_taken = time.time() - start_time

    return {
        "success": True,
        "query": query,
        "total_results": len(jobs),
        "jobs": [j.model_dump() for j in jobs],
        "metadata": {
            "job_title": job_title,
            "experience_level": experience_level,
            "country": country,
            "language": language,
            "pages_fetched": pages_scraped,
            "time_taken_seconds": round(time_taken, 2)
        }
    }


async def search_linkedin_all(
    keywords: str,
    location: str = "",
    max_results: int = 20,
    country: str = "id",
    language: str = "id"
) -> Dict:
    """
    Search all LinkedIn content types menggunakan serp-api-aggregator

    Args:
        keywords: Keywords untuk cari di semua LinkedIn content
        location: Location filter (optional)
        max_results: Target jumlah results (max 100)
        country: Country code
        language: Language code

    Returns:
        Dict dengan hasil scraping mixed content types
    """
    start_time = time.time()

    # Build query - search all linkedin.com content
    query = f"{keywords} site:linkedin.com"

    # Add location to query
    if location.strip():
        query += f" {location.strip()}"

    # Calculate pages needed (10 results per page)
    max_pages = max(1, (max_results + 9) // 10)  # Round up

    # Initialize SERP client
    async with SerpAggregator() as client:
        # Fetch pages from Google
        result = await client.search(
            query=query,
            country=country,
            language=language,
            max_pages=max_pages,
            use_cache=False
        )

        pages_scraped = result.pages_fetched

        print(f"[DEBUG] All Content Query: {query}")
        print(f"[DEBUG] Total organic results: {len(result.organic)}")

        # Parse and classify results
        all_results = []
        for i, organic_result in enumerate(result.organic):
            # Classify result type based on URL pattern
            result_type = "other"
            url = organic_result.link

            if "/in/" in url and "/posts/" not in url:
                result_type = "profile"
            elif "/company/" in url and "/posts/" not in url:
                result_type = "company"
            elif "/posts/" in url or "/feed/update/" in url:
                result_type = "post"
            elif "/jobs/view/" in url or "/jobs/" in url:
                result_type = "job"

            result_obj = LinkedInAllResult(
                url=url,
                title=organic_result.title,
                description=organic_result.description or "",
                type=result_type,
                rank=organic_result.rank
            )
            all_results.append(result_obj)

            # Stop once we have enough results
            if len(all_results) >= max_results:
                break

        # Truncate to exact max_results
        if len(all_results) > max_results:
            all_results = all_results[:max_results]

    time_taken = time.time() - start_time

    return {
        "success": True,
        "query": query,
        "total_results": len(all_results),
        "results": [r.model_dump() for r in all_results],
        "metadata": {
            "keywords": keywords,
            "country": country,
            "language": language,
            "pages_fetched": pages_scraped,
            "time_taken_seconds": round(time_taken, 2)
        }
    }
