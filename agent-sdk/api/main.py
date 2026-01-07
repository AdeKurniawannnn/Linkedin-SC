import sys
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from api.models import GenerateRequest, GenerateResponse

# Import agent and exceptions from parent directory
try:
    from agent import (
        GLMQueryAgent,
        GLMQueryError,
        GLMTimeoutError,
        GLMValidationError,
        GLMAuthError
    )
except ImportError as e:
    print(f"Error importing agent: {e}")
    print(f"Current path: {sys.path}")
    raise

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="GLM Query Generator API",
    description="API for generating search query variants using GLM agent",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize agent
agent = GLMQueryAgent()


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok"}


@app.post("/generate", response_model=GenerateResponse)
async def generate_queries(request: GenerateRequest):
    """
    Generate search query variants.

    Args:
        request: GenerateRequest with input_text, count, focus, and debug options

    Returns:
        GenerateResponse with generated queries and metadata

    Raises:
        HTTPException: 400 for validation errors, 500 for generation errors
    """
    try:
        # Generate query variants (use async version for FastAPI compatibility)
        result = await agent.generate_variants(
            input_text=request.input_text,
            count=request.count,
            focus=request.focus,
            debug=request.debug
        )

        # Prepare response (result is a QueryResult dataclass)
        response = GenerateResponse(
            input=result.input,
            queries=result.queries,
            meta=result.meta
        )

        return response

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=f"Validation error: {str(e)}"
        )

    except GLMValidationError as e:
        raise HTTPException(
            status_code=400,
            detail=f"GLM validation error: {str(e)}"
        )

    except GLMAuthError as e:
        raise HTTPException(
            status_code=401,
            detail=f"GLM authentication error: {str(e)}"
        )

    except GLMTimeoutError as e:
        raise HTTPException(
            status_code=504,
            detail=f"GLM timeout error: {str(e)}"
        )

    except GLMQueryError as e:
        raise HTTPException(
            status_code=500,
            detail=f"GLM query error: {str(e)}"
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
