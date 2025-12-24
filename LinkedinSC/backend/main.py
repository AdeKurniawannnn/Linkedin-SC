"""
LinkedScraper Backend API
FastAPI wrapper around serp-api-aggregator
"""
from pathlib import Path
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import router

# Load environment variables from parent directory .env
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

app = FastAPI(
    title="LinkedScraper API",
    description="LinkedIn candidate scraping API powered by Bright Data",
    version="1.0.0"
)

# CORS untuk production dan local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Izinkan semua origin untuk mempermudah deploy
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(router, prefix="/api")

@app.get("/api/health")
def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "LinkedScraper API",
        "cors": "enabled"
    }

@app.get("/search")
@app.post("/search")
def search_fallback():
    """Fallback for missing /api prefix"""
    return {
        "success": False,
        "error": "Wrong endpoint",
        "message": "Please use /api/search instead of /search"
    }

@app.get("/")
def root():
    """Root endpoint"""
    return {
        "message": "LinkedScraper API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "LinkedScraper API"
    }
