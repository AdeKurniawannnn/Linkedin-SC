"""API request/response models for query generation."""

from enum import Enum
from typing import Dict, List, Optional

from pydantic import BaseModel, Field


class ProviderEnum(str, Enum):
    """Supported LLM providers."""
    glm = "glm"
    openrouter = "openrouter"


class GenerateRequest(BaseModel):
    """Request model for query generation."""

    input_text: str = Field(
        ...,
        min_length=3,
        max_length=500,
        description="Input text describing the target audience (3-500 characters)",
    )
    count: int = Field(
        default=10,
        ge=1,
        le=30,
        description="Number of query variants to generate (1-30)",
    )
    provider: ProviderEnum = Field(
        default=ProviderEnum.glm,
        description="LLM provider to use (glm or openrouter)",
    )
    debug: bool = Field(
        default=False,
        description="Enable debug mode for metadata output",
    )


class GenerateResponse(BaseModel):
    """Response model for query generation."""

    input: str = Field(..., description="Original input text")
    queries: List[str] = Field(
        ...,
        description="Generated query variants as a list",
    )
    meta: Optional[Dict[str, str]] = Field(
        default=None,
        description="Optional metadata about the generation process",
    )
