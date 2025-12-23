# LinkedScraper - Setup & Cara Menjalankan

LinkedScraper adalah aplikasi web untuk mencari profil LinkedIn menggunakan Google SERP API (via Bright Data).

## Arsitektur

```
Frontend (Next.js) → Backend (FastAPI/SERP Aggregator) → Bright Data API → Google SERP
```

## Struktur Proyek

```
LinkedScraper/
├── frontend/           # Next.js UI (Port 3000)
└── SETUP.md           # File ini

serp-api-aggregator/    # Backend API (Port 8000)
├── src/serp/
│   ├── api/           # FastAPI server
│   ├── client.py      # SERP client
│   └── cli/           # CLI tools
```

## Prerequisites

- **Python 3.11+** dengan `uv` package manager
- **Node.js 18+** dengan npm/yarn
- **Bright Data API Key** (sudah dikonfigurasi di backend)

---

## 🚀 Cara Menjalankan

### 1. Jalankan Backend API (Terminal 1)

```bash
# Masuk ke folder backend
cd ~/Library/Mobile\ Documents/com~apple~CloudDocs/skills/serp-api-aggregator

# Aktifkan virtual environment
source .venv/bin/activate

# Install dependencies (jika belum)
uv pip install -e ".[api]"

# Jalankan FastAPI server
serp serve --port 8000

# Atau dengan uvicorn langsung:
uvicorn serp.api.main:app --host 0.0.0.0 --port 8000 --reload
```

**Backend akan berjalan di:** `http://localhost:8000`
- API Docs: `http://localhost:8000/docs`
- Health Check: `http://localhost:8000/health`

### 2. Jalankan Frontend UI (Terminal 2)

```bash
# Masuk ke folder frontend
cd ~/Library/Mobile\ Documents/com~apple~CloudDocs/skills/LinkedScraper/frontend

# Install dependencies (jika belum)
npm install

# Jalankan development server
npm run dev
```

**Frontend akan berjalan di:** `http://localhost:3000`

---

## 🧪 Testing

### Test Backend (CLI)

```bash
# Test single search
serp search "IT programmer linkedin.com/in/ Jakarta" -g id -l id -p 2

# Test dengan lebih banyak pages
serp search "Software Engineer linkedin.com/in/ Singapore" -g sg -l en -p 5
```

### Test Backend (API)

```bash
# Health check
curl http://localhost:8000/health

# Test search endpoint
curl -X POST http://localhost:8000/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "IT programmer linkedin.com/in/ Jakarta",
    "max_pages": 2,
    "country": "id",
    "language": "id"
  }'
```

### Test Frontend

1. Buka browser: `http://localhost:3000`
2. Isi form:
   - **Job Role:** IT Programmer
   - **Location:** Jakarta
   - **Country:** Indonesia (id)
   - **Language:** Indonesia (id)
   - **Max Pages:** 2-5
3. Klik "Search Profiles"
4. Tunggu hasil muncul (~5-15 detik tergantung pages)

---

## 📊 Format Data

### Request ke Backend

```json
{
  "query": "IT programmer linkedin.com/in/ Jakarta",
  "max_pages": 2,
  "country": "id",
  "language": "id",
  "concurrency": 50,
  "use_cache": true
}
```

### Response dari Backend

```json
{
  "general": {
    "query": "IT programmer linkedin.com/in/ Jakarta",
    "search_engine": "google",
    "language": "id"
  },
  "organic": [
    {
      "link": "https://id.linkedin.com/in/example",
      "title": "John Doe - IT Programmer",
      "description": "IT Programmer at Company • Experience: 5+ years...",
      "rank": 1,
      "best_position": 1,
      "avg_position": 1.0,
      "frequency": 2,
      "pages_seen": [1, 2]
    }
  ],
  "pages_fetched": 2,
  "errors": []
}
```

---

## 🔧 Troubleshooting

### Backend Tidak Bisa Start

**Problem:** `ImportError: FastAPI not installed`

**Solusi:**
```bash
cd ~/Library/Mobile\ Documents/com~apple~CloudDocs/skills/serp-api-aggregator
source .venv/bin/activate
uv pip install -e ".[api]"
```

### Frontend Tidak Bisa Connect ke Backend

**Problem:** Network error / Connection refused

**Solusi:**
1. Pastikan backend berjalan di port 8000: `curl http://localhost:8000/health`
2. Check environment variable di `.env.local` (jika ada)
3. Frontend default connect ke `http://localhost:8000/api`

### Results Kosong / Tidak Ada Profil

**Problem:** API mengembalikan 0 results

**Kemungkinan:**
1. **Query terlalu spesifik** - Coba query lebih umum
2. **Bright Data rate limit** - Tunggu beberapa saat
3. **Country/language mismatch** - Sesuaikan dengan lokasi target

**Contoh query yang bagus:**
- ✅ "IT programmer linkedin.com/in/ Jakarta"
- ✅ "Software Engineer linkedin.com/in/ Singapore"
- ✅ "Data Scientist linkedin.com/in/"
- ❌ "Senior Full Stack Developer with 10 years experience linkedin.com/in/ Jakarta Selatan" (terlalu spesifik)

### Timeout / Slow Response

**Normal:** 5-15 detik per search (tergantung pages)
- 2 pages: ~5-7 detik
- 5 pages: ~10-15 detik
- 10 pages: ~20-30 detik

**Terlalu lama (>60 detik):**
1. Check Bright Data API status
2. Reduce `max_pages` (coba 2-3 pages dulu)
3. Check network connection

---

## 📝 Configuration

### Backend Configuration

File: `serp-api-aggregator/src/serp/config.py`

```python
BRIGHT_DATA_API_KEY = "c69f9a87-ded2-4064-a901-5439af92bb54"
BRIGHT_DATA_ZONE = "serp_api1"
BASE_URL = "https://api.brightdata.com"
```

### Frontend Configuration

File: `LinkedScraper/frontend/lib/api.ts`

```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
```

Untuk production, set environment variable:
```bash
NEXT_PUBLIC_API_URL=https://your-backend-api.com/api
```

---

## 🎯 Next Steps

1. **Test dengan berbagai queries** untuk validasi hasil
2. **Adjust max_pages** sesuai kebutuhan (2-5 pages optimal)
3. **Export CSV** untuk analisis data
4. **Deploy** ke production jika diperlukan

---

## 📚 Dokumentasi Lengkap

- **Backend API Docs:** http://localhost:8000/docs
- **SERP Test Results:** `serp-api-aggregator/tests/GOOGLE_SERP_FINDINGS.md`
- **Backend CLI Guide:** `serp-api-aggregator/CLAUDE.md`
