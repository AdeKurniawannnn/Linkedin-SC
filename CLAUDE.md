# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Bash commands

### Development
- `make dev`: Run all services (backend on :8000, frontend on :3000, Convex sync)
- `make dev-backend`: Run backend only
- `make dev-frontend`: Run frontend only
- `make dev-convex`: Run Convex dev server only
- `make clean`: Stop all services (kills processes on ports 8000, 3000)
- `make install`: Install all dependencies

### Backend (LinkedinSC/backend)
- `cd LinkedinSC/backend && source .venv/bin/activate`: Activate Python virtual environment
- `uv pip install -r requirements.txt`: Install backend dependencies
- `python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload`: Run backend server
- `python -m pytest tests/unit/ -v`: Run unit tests (108 tests)
- `python -m pytest tests/integration/ -v`: Run integration tests (41 tests)

### Frontend (LinkedinSC/frontend)
- `npm run dev`: Start Next.js dev server on :3000
- `npm run build`: Build for production
- `npm run test`: Run Vitest in watch mode (167 tests)
- `npm run test:run`: Run Vitest tests once
- `npm run test:e2e`: Run Playwright E2E tests (headless)

### SERP API Aggregator (serp-api-aggregator)
- `cd serp-api-aggregator && uv pip install -e ".[all]"`: Install with all dependencies
- `serp search "query"`: Single search via CLI
- `serp batch "q1" "q2" --parallel`: Batch parallel search
- `serp serve --port 8000`: Start REST API server
- `python tests/test_serp.py --all`: Run full test suite

### Agent SDK (agent-sdk)
- `cd agent-sdk && uv run test_example.py`: Run integration test
- `uv pip install claude-agent-sdk python-dotenv`: Install dependencies

### Testing
- `make test`: Quick tests (backend unit + frontend vitest)
- `make test-all`: Full test suite (includes E2E and integration)
- `make test-env`: Check environment configuration (API keys)

---

## Code style

- **Backend**: Use async/await for all HTTP operations. Prefer `aiohttp` for async requests.
- **Frontend**: Use React 19 with TypeScript. State management via Zustand stores. Server state via TanStack Query.
- **SERP Aggregator**: Unix pipeline pattern - log to stderr, output NDJSON to stdout.
- **Python**: Use UV as package manager and interpreter (not pip/virtualenv).
- **Versioning**: SERP API Aggregator uses `bump2version` for automated versioning.

---

## Project architecture

This is a **LinkedIn lead generation monorepo** with 4 main components:

```
┌─────────────────────────────────────────────────────────────┐
│                    LinkedIn SC Monorepo                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   Frontend   │    │   Backend    │    │ SERP Aggregator │ │
│  │  (Next.js)   │◄──►│   (FastAPI)  │◄──►│   (Bright Data)│ │
│  │   :3000      │    │    :8000     │    │   (Library)    │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│         │                                           │       │
│         ▼                                           ▼       │
│  ┌──────────────┐                          ┌──────────────┐│
│  │    Convex    │                          │   Agent SDK  ││
│  │ (Database)   │                          │  (GLM 4.7)   ││
│  └──────────────┘                          └──────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### Component Overview

#### 1. **Frontend** (`LinkedinSC/frontend/`)
- **Tech**: Next.js 16, React 19, TypeScript, Tailwind CSS 4, Radix UI
- **State**: Zustand (client), TanStack Query (server), Convex (database)
- **Testing**: Vitest (167 tests), Playwright (E2E)
- **Key Patterns**:
  - Split panel layout (query builder left, results right)
  - Command palette (Cmd+K) for quick preset selection
  - Error boundary with session recovery
  - Mobile responsive with tabbed layout below `lg` breakpoint

#### 2. **Backend** (`LinkedinSC/backend/`)
- **Tech**: FastAPI, Python 3.11, Uvicorn
- **Purpose**: Wrapper around SERP API Aggregator for LinkedIn scraping
- **Endpoints**:
  - `POST /api/search` - Search LinkedIn profiles
  - `POST /api/search-raw` - Execute raw query with content type detection
  - `POST /api/scrape-detail` - Scrape company details via Crawl4AI
  - `POST /api/search-posts` - Search LinkedIn posts
  - `POST /api/search-jobs` - Search LinkedIn jobs
  - `POST /api/search-all` - Search all content types
- **Testing**: 149 tests (108 unit, 41 integration)

#### 3. **SERP API Aggregator** (`serp-api-aggregator/`)
- **Purpose**: Async Python library for Google SERP data via Bright Data API
- **Key Components**:
  - `SerpAggregator` - Main client with caching, rate limiting, progress reporting
  - `bright_data.py` - Core async API client (submit → poll → result)
  - Query processor, deduplicator, CLI tools
- **Performance**:
  - Optimal concurrency: 50-100 requests
  - API throughput: ~4-6 req/s
  - Response time: 3-5s average
  - Pagination depth: ~22 pages (200-240 results)
- **Version**: 0.3.0 (use `bump2version` for releases)

#### 4. **Agent SDK** (`agent-sdk/`)
- **Purpose**: LinkedIn query variant generator using Claude Agent SDK + GLM 4.7
- **Output**: 1-30 optimized LinkedIn search query variants from natural language
- **Query Types**: 10 types (broad, narrow, balanced, industry_focused, seniority_focused, etc.)
- **Usage**:
  ```python
  from agent import GLMQueryAgent
  agent = GLMQueryAgent()
  result = await agent.generate_variants("CEO Jakarta fintech", count=10)
  ```

### Data Flow

1. **User Input** → Frontend query builder (with presets)
2. **Query Generation** → Agent SDK generates variants (optional)
3. **Search Execution** → Backend calls SERP Aggregator
4. **SERP API** → Bright Data API (async polling, 3-5s)
5. **Results** → Deduplicated organic results with metadata
6. **Display** → Frontend table with history tracking
7. **Persistence** → Convex database for search history

### Key Integration Points

- **Backend → SERP Aggregator**: `PYTHONPATH` includes `serp-api-aggregator/src`
- **Frontend → Backend**: Axios REST API calls to `:8000/api/*`
- **Frontend → Convex**: Real-time sync for search history and custom presets
- **Agent SDK → Backend**: Optional query generation before SERP calls

---

## Environment Variables

### Required (root `.env`)
```bash
# Bright Data SERP API
BRIGHT_DATA_API_KEY=c69f9a87-ded2-4064-a901-5439af92bb54
BRIGHT_DATA_ZONE=serp_api1

# GLM 4.7 (for Agent SDK)
ANTHROPIC_AUTH_TOKEN=your-glm-token.suffix
ANTHROPIC_BASE_URL=https://api.z.ai/api/anthropic
GLM_MODEL=glm-4.7

# Convex
NEXT_PUBLIC_CONVEX_URL=...
CONVEX_DEPLOYMENT=...
```

### Backend (LinkedinSC/backend/.env)
- Inherits from root `.env` via `load_dotenv(dotenv_path=Path(__file__).parent.parent / ".env")`

### Frontend (LinkedinSC/frontend/.env.local)
- `NEXT_PUBLIC_CONVEX_URL`: Convex deployment URL
- `NEXT_PUBLIC_API_URL`: Backend API URL (default: http://localhost:8000)

---

## Docker Deployment

**File**: `Dockerfile.backend`

```bash
docker build -t linkedin-sc-backend .
docker run -p 3000:3000 linkedin-sc-backend
```

Note: Container copies entire monorepo so `serp-api-aggregator` library is accessible.

---

## Known Limitations

### SERP API (Bright Data)
- **Bing search**: Not supported (times out, zone not configured)
- **Jobs search**: Times out on `ibp=htl;jobs`
- **Result consistency**: 78% page 1, 10% page 3 (proxy rotation affects ordering)
- **Early termination**: Pagination stops after 3 consecutive empty pages

### Frontend
- Mobile view uses tabbed layout (not split panel)
- Error boundary uses session storage for recovery

### Backend
- No authentication on API endpoints (open CORS)
- No rate limiting implemented

---

## Important Files

- `Makefile`: All development commands
- `Dockerfile.backend`: Container configuration
- `LinkedinSC/PRD.md`: Product requirements (LinkedIn-specific patterns)
- `LinkedinSC/LINKEDIN_URL_PATTERNS.md`: LinkedIn URL patterns reference
- `serp-api-aggregator/tests/GOOGLE_SERP_FINDINGS.md`: Comprehensive SERP API test results
- `agent-sdk/README.md`: GLM query agent usage documentation
- `.cursor/rules/design.mdc`: Frontend design guidelines (use `--design` flag)
