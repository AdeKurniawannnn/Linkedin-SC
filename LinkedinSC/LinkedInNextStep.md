# LinkedIn Query Builder Tool - Development Plan

**Project Type:** Advanced Google Search Query Builder untuk LinkedIn
**Stack:** Next.js 14 + Zustand + TailwindCSS
**Phase:** FASE 1 (Query Builder Manual)

---

## 📋 Setup & Prerequisites

- [x] Install Zustand untuk state management
- [x] Setup Zustand store (`stores/queryBuilderStore.ts`)
- [x] UI polosan (fokus komponen, styling belakangan)
- [ ] Setup project structure untuk Query Builder (routes & components)

---

## 🎯 FASE 1: Query Builder Manual (PRIORITY UTAMA)

### Step 1: Riset LinkedIn URL Pattern 🔍

**Objective:** Identifikasi variasi URL pattern LinkedIn yang muncul di search results

**Tasks:**
- [x] Analisis hasil search LinkedIn untuk pattern URL
- [x] Dokumentasikan tipe-tipe URL LinkedIn:
  - [x] Profile (`/in/`) - 15+ examples, 95%+ success rate
  - [x] Posts/Feed (`/posts/`) - 8 examples, 80%+ success rate
  - [x] Jobs (`/jobs/`) - 4 examples, 70%+ success rate
  - [x] Company (`/company/`) - 3 examples, 60%+ success rate
  - [x] Pulse/Articles (`/pulse/`) - 5 examples found
  - [x] Learning (`/learning/`) - 5 examples found
  - [x] News (`news.linkedin.com`) - 1 example found
  - [x] Blog (`/blog/`) - 1 example found
- [x] Fokus pakai `.com` (global), documented locale variants
- [x] Buat dokumentasi pattern di MD file → **`LINKEDIN_URL_PATTERNS.md`**

**Output Delivered:**
```
✅ 8 distinct URL patterns documented
✅ LINKEDIN_URL_PATTERNS.md created with:
   - Profile: linkedin.com/in/[username]
   - Posts: linkedin.com/posts/[user]-[topic]-activity-[id]-[hash]
   - Jobs: linkedin.com/jobs/[category]-jobs
   - Company: linkedin.com/company/[name] (with sub-pages: /jobs, /life)
   - Pulse: linkedin.com/pulse/[article-slug]-[author]-[hash]
   - Learning: linkedin.com/learning/[course-name]
   - News: news.linkedin.com/[section]/[slug]
   - Blog: linkedin.com/blog/[topic]

✅ Recommendations for Toggle UI:
   - Priority 1 (Must Have): Profile toggle
   - Priority 2 (Should Have): Posts, Jobs, Company toggles
   - Priority 3 (Future): Pulse, Learning toggles
   - Exclude: News, Blog (too rare)

✅ Performance metrics documented
✅ Tested 8 query variations via serp-api-aggregator
```

**Status:** ✅ **COMPLETED** (2025-12-16)

---

### Step 2: Bikin Toggle UI untuk Query Modifier 🎛️

**Objective:** Buat UI toggle untuk modifikasi query LinkedIn + Google search modifiers

#### 2.1 Site Filter Component ✅ **COMPLETED** (2025-12-16)
**Tasks:**
- [x] Buat component `SiteFilter.tsx`
- [x] Toggle untuk tipe LinkedIn:
  - [x] All (`no site filter`)
  - [x] Profile (`site:linkedin.com/in/`)
  - [x] Posts (`site:linkedin.com/posts/`)
  - [x] Jobs (`site:linkedin.com/jobs/`)
  - [x] Company (`site:linkedin.com/company/`)
- [x] State management dengan Zustand (useQueryBuilderStore)
- [x] Preview query string real-time (di test page)
- [x] Responsive layout (mobile & desktop)
- [x] Helper text dengan success rate info

**Output Delivered:**
```
✅ /components/query-builder/SiteFilter.tsx created
   - 5 toggle buttons (All, Profile, Posts, Jobs, Company)
   - Active state visual feedback (variant switching)
   - Zustand store integration working
   - Helper text showing selected filter description
   - Responsive flex-wrap layout

✅ /app/query-builder/page.tsx created
   - Test page untuk SiteFilter component
   - Real-time query preview
   - Instructions untuk user
   - Route: /query-builder

✅ Build verification PASSED
   - TypeScript compilation successful
   - Next.js build completed
   - Route /query-builder prerendered
```

#### 2.2 Google Search Modifiers Component ✅ **COMPLETED** (2025-12-16)
**Tasks:**
- [x] Buat component `SearchModifiers.tsx`
- [x] Must have keywords (input field)
- [x] Exclude keywords (input field dengan `-` prefix)
- [x] Exact match (input field dengan quotes)
- [ ] Date range (dropdown/datepicker) - DEFERRED
- [x] OR operator (toggle `OR`)
- [x] Wildcard (toggle `*`)
- [ ] File type filter (if needed) - NOT NEEDED

**Output Delivered:**
```
✅ /components/query-builder/SearchModifiers.tsx created
   - 3 input sections (Must Have, Exclude, Exact Match)
   - Badge display dengan remove functionality (X button)
   - 2 toggle switches (OR operator, Wildcard)
   - Enter key shortcuts untuk quick adding
   - Visual distinction: default badges (must have), destructive badges (exclude), secondary badges (exact match)

✅ /app/query-builder/page.tsx updated
   - SearchModifiers component imported dan rendered
   - Instructions updated untuk include search modifiers features

✅ UI components installed
   - badge.tsx, switch.tsx, label.tsx dari shadcn/ui

✅ Build verification PASSED
   - TypeScript compilation successful
   - Next.js build completed
   - Dev server running on http://localhost:3000
```

#### 2.3 Additional Filters Component
**Tasks:**
- [ ] Buat component `AdditionalFilters.tsx`
- [ ] Location filter (input field)
- [ ] Company filter (input field)
- [ ] Position/Role filter (input field)
- [ ] Experience level filter (dropdown)
- [ ] Industry filter (dropdown/multi-select)

#### 2.4 Query Preview Component
**Tasks:**
- [ ] Buat component `QueryPreview.tsx`
- [ ] Display query string yang ter-generate
- [ ] Copy to clipboard button
- [ ] Syntax highlighting (optional)
- [ ] Character count

**Status:** 🔴 Not Started

---

### Step 3: Responsive Toggle System ⚡

**Objective:** Sinkronisasi 2 arah antara query string ↔ toggle UI

**Tasks:**
- [ ] Parse query string ke toggle state
  - [ ] Detect `site:` operator
  - [ ] Detect `-` untuk exclude
  - [ ] Detect `"..."` untuk exact match
  - [ ] Detect date range
  - [ ] Detect location/company/position keywords
- [ ] Update toggle otomatis saat query berubah
- [ ] Update query otomatis saat toggle berubah
- [ ] Handle edge cases (invalid query, conflicting modifiers)
- [ ] Debounce input untuk performa

**Behavior Expected:**
```
User input query: "software engineer site:linkedin.com/in/ Jakarta"
→ Toggle "Profile" auto nyala
→ Toggle location auto isi "Jakarta"
→ Role auto isi "software engineer"

User klik Toggle "Posts":
→ Query berubah jadi: "software engineer site:linkedin.com/posts/ Jakarta"
```

**Status:** 🔴 Not Started

---

### Step 4: Basic Actions 💾

**Objective:** Implement core actions (Search, Save, Download)

#### 4.1 Search Action
**Tasks:**
- [ ] Button "Search" dengan icon
- [ ] Execute query ke backend API
- [ ] Loading state
- [ ] Error handling
- [ ] Display results

#### 4.2 Save Query Action
**Tasks:**
- [ ] Button "Save Query"
- [ ] Simpan ke localStorage (temporary)
- [ ] Buat dialog/modal untuk save
  - [ ] Input nama query
  - [ ] Input deskripsi (optional)
  - [ ] Tag/category (optional)
- [ ] List saved queries
- [ ] Load saved query

#### 4.3 Download CSV Action
**Tasks:**
- [ ] Button "Download CSV"
- [ ] Export hasil scraping ke CSV
- [ ] Include columns:
  - [ ] Name/Title
  - [ ] URL
  - [ ] Description
  - [ ] Position
  - [ ] (metadata lain)
- [ ] Custom filename dengan timestamp

#### 4.4 Download Account Data
**Tasks:**
- [ ] Button "Download Account Data"
- [ ] Export semua data account (semua hasil scraping)
- [ ] Format: JSON atau CSV (pilihan user)
- [ ] Include metadata (query, date, results count)

**Status:** 🔴 Not Started

---

## 🤖 FASE 2: AI Query Generator (NEXT PHASE)

### AI-Based Query Builder

**Objective:** User input natural language → AI generate query + auto-update toggle

**Tasks:**
- [ ] Setup AI integration (OpenAI API atau Anthropic Claude)
- [ ] Prompt engineering untuk query generation
- [ ] Input component untuk natural language
  - Example: "Cari employee di Jakarta, posisi Software Engineer, kerja di perusahaan tech startup"
- [ ] AI processing:
  - [ ] Breakdown user intent
  - [ ] Generate query string
  - [ ] Auto-update toggle UI
- [ ] Display generated query
- [ ] Button "Search" untuk execute

### Advanced: Multiple Query Generation

**Tasks:**
- [ ] Generate 1-100 queries dari single input
- [ ] AI bikin variasi query:
  - [ ] Different keyword combinations
  - [ ] Different site filters
  - [ ] Different modifiers
- [ ] Example use case:
  ```
  Input: "Cari HR"
  Output:
  - Query 1: Headhunter companies
  - Query 2: Internal HR di companies
  ```
- [ ] Sorting queries by success rate
- [ ] Batch execute queries
- [ ] Aggregate results

**Status:** 🟡 Planned (Next Phase)

---

## 🧠 FASE 2.5: Agentic System (FUTURE ENHANCEMENT)

**SOP untuk AI Agent:**

1. **Riset & Breakdown User Intent**
   - [ ] Analyze user input
   - [ ] Identify target persona
   - [ ] Extract filters (location, company, role, etc.)

2. **Determine Outcome**
   - [ ] Define success criteria
   - [ ] Estimate result count

3. **Generate Query Variations**
   - [ ] Use templates untuk sektor khusus
   - [ ] Master list keywords untuk industries
   - [ ] Optimize for recall & precision

4. **Execute & Iterate**
   - [ ] Test queries
   - [ ] Refine based on results
   - [ ] Learn from feedback

**Status:** 🟡 Planned (Future)

---

## 🔄 FASE 3: Automation & Database (FUTURE)

### Automation Features

**Tasks:**
- [ ] Execute multiple queries in parallel
- [ ] Queue system untuk batch processing
- [ ] Save hasil ke database (PostgreSQL)
- [ ] Tracking & analytics:
  - [ ] Query success rate
  - [ ] Result count per query
  - [ ] Execution time
  - [ ] Error logs

### Preview Features (Future - Don't Implement Yet)

**Tasks:**
- [ ] Preview hasil LinkedIn (iframe/screenshot)
- [ ] Scraping halaman LinkedIn (full profile data)
- [ ] Rich snippet extraction
- [ ] Contact info extraction

**Status:** 🟡 Planned (Future)

---

## 📊 Development Priority (Current Sprint)

### Sprint 1: Foundation (Week 1-2)
1. [x] Setup Zustand
2. [x] **Step 1:** Riset URL pattern LinkedIn ✅ **DONE** (2025-12-16)
3. [x] **Step 2.1:** Buat Site Filter component ✅ **DONE** (2025-12-16)
4. [x] **Step 2.2:** Buat Search Modifiers component ✅ **DONE** (2025-12-16)
5. [ ] **Step 2.3:** Buat Additional Filters component ← **NEXT**
6. [ ] **Step 2.4:** Buat Query Preview component

### Sprint 2: Interaction (Week 3)
7. [ ] **Step 3:** Implement responsive toggle system
8. [ ] **Step 4.1:** Basic search functionality

### Sprint 3: Actions (Week 4)
9. [ ] **Step 4.2:** Save query functionality
10. [ ] **Step 4.3:** Download CSV
11. [ ] **Step 4.4:** Download account data

---

## 🎨 UI/UX Guidelines

### Current Phase (FASE 1)
- ✅ **UI polosan** - Fokus komponen bekerja dengan benar
- ⏳ **Styling nanti** - Setelah semua komponen berfungsi
- 🎯 **Focus:** Functionality over aesthetics

### Design Principles
- Minimalist layout
- Clear toggle states (on/off visual feedback)
- Real-time query preview
- Responsive (mobile-friendly)

---

## 🛠️ Tech Stack

| Component | Technology | Status |
|-----------|------------|--------|
| Frontend Framework | Next.js 14 + TypeScript | ✅ Ready |
| State Management | Zustand | ✅ Installed |
| Styling | TailwindCSS | ✅ Ready |
| UI Components | shadcn/ui | ✅ Ready |
| Backend API | FastAPI (existing) | ✅ Ready |
| AI Integration | OpenAI API / Claude | ⏳ FASE 2 |
| Database | PostgreSQL | ⏳ FASE 3 |

---

## 📦 File Structure (Planned)

```
LinkedScraper/
├── frontend/
│   ├── app/
│   │   ├── query-builder/          # NEW - Query Builder Tool
│   │   │   ├── page.tsx            # Main page
│   │   │   └── layout.tsx
│   │   └── ...
│   ├── components/
│   │   ├── query-builder/          # NEW - Query Builder Components
│   │   │   ├── SiteFilter.tsx
│   │   │   ├── SearchModifiers.tsx
│   │   │   ├── AdditionalFilters.tsx
│   │   │   ├── QueryPreview.tsx
│   │   │   └── SavedQueries.tsx
│   │   └── ...
│   ├── stores/                     # NEW - Zustand stores
│   │   └── queryBuilderStore.ts
│   └── ...
└── ...
```

---

## 🎯 Success Criteria

### FASE 1 (Current)
- [ ] User dapat toggle site filter (profile/posts/jobs/company)
- [ ] User dapat tambah modifiers (exclude, exact, date range)
- [ ] Query string ter-generate otomatis sesuai toggle
- [ ] Toggle auto-update saat user edit query manual
- [ ] User dapat save query
- [ ] User dapat download hasil CSV

### FASE 2 (Next)
- [ ] AI dapat generate query dari natural language input
- [ ] AI dapat generate multiple query variations
- [ ] Query sorting by success rate works

### FASE 3 (Future)
- [ ] Batch execution dengan parallel processing works
- [ ] Database save & tracking works
- [ ] Analytics dashboard tersedia

---

## 📝 Notes

- **Kesimpulan:** Tool ini adalah **advanced Google search query builder khusus LinkedIn** dengan AI assist untuk generate multiple query variations dan automation untuk execute banyak queries sekaligus.
- **Current Focus:** FASE 1 - Manual query builder dengan toggle system
- **Philosophy:** Build functionality first, polish later

---

**Last Updated:** 2025-12-16
**Current Phase:** FASE 1 - Step 2.3 (Build Additional Filters Component)
**Next Milestone:** Complete Step 2 (Toggle UI Components)
**Recent Completions:**
- ✅ Step 1 - LinkedIn URL Pattern Research (8 patterns documented)
- ✅ Step 2.1 - Site Filter Component (5 toggle buttons, Zustand integration, test page)
- ✅ Step 2.2 - Search Modifiers Component (3 input sections, badge management, toggle switches)
