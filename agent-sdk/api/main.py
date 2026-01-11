"""FastAPI server for query generation."""

import sys
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from api.models import GenerateRequest, GenerateResponse
from generator import (
    QueryGenerator,
    QueryGeneratorError,
    QueryAuthError,
    QueryValidationError,
    QueryTimeoutError,
)

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="Query Generator API",
    description="API for generating LinkedIn search query variants",
    version="3.0.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize generator
generator = QueryGenerator()


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok", "version": "3.0.0"}


@app.post("/generate", response_model=GenerateResponse)
async def generate_queries(request: GenerateRequest):
    """Generate search query variants.

    Args:
        request: GenerateRequest with input_text, count, and debug options

    Returns:
        GenerateResponse with generated queries and metadata

    Raises:
        HTTPException: 400 for validation errors, 401 for auth, 500 for other errors
    """
    try:
        result = await generator.generate(
            input_text=request.input_text,
            count=request.count,
            debug=request.debug,
        )

        return GenerateResponse(
            input=result.input,
            queries=result.queries,
            meta=result.meta,
        )

    except QueryValidationError as e:
        raise HTTPException(
            status_code=400,
            detail=f"Validation error: {str(e)}",
        )

    except QueryAuthError as e:
        raise HTTPException(
            status_code=401,
            detail=f"Authentication error: {str(e)}",
        )

    except QueryTimeoutError as e:
        raise HTTPException(
            status_code=504,
            detail=f"Timeout error: {str(e)}",
        )

    except QueryGeneratorError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Generation error: {str(e)}",
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}",
        )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
