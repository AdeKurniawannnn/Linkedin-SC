"""Simplified schemas for single-pass query generation."""

from typing import Dict, List, Optional

from pydantic import BaseModel, Field


class SimpleQueryResult(BaseModel):
    """Result of single-pass query generation.

    Attributes:
        input: Original natural language input
        queries: List of generated query variants (no type categorization)
        meta: Optional metadata (timestamp, model, counts)
    """

    input: str = Field(..., description="Original natural language input")
    queries: List[str] = Field(
        ...,
        min_length=1,
        description="List of generated query variants",
    )
    meta: Optional[Dict[str, str]] = Field(
        default=None,
        description="Optional metadata (timestamp, model)",
    )
