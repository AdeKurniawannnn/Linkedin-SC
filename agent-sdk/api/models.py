from pydantic import BaseModel, Field, field_validator
from typing import Dict, List, Union, Optional


class GenerateRequest(BaseModel):
    """Request model for query generation."""

    input_text: str = Field(
        ...,
        min_length=3,
        max_length=500,
        description="Input text describing the target audience (3-500 characters)"
    )
    count: int = Field(
        default=3,
        ge=1,
        le=30,
        description="Number of query variants to generate (1-30)"
    )
    focus: Optional[str] = Field(
        default=None,
        description="Query focus type (broad, narrow, balanced, etc.)"
    )
    debug: bool = Field(
        default=False,
        description="Enable debug mode for detailed output"
    )

    @field_validator('focus')
    @classmethod
    def validate_focus(cls, v: Optional[str]) -> Optional[str]:
        """Validate focus parameter."""
        if v is None:
            return v

        valid_focus_types = {
            'broad',
            'narrow',
            'balanced',
            'industry_focused',
            'seniority_focused',
            'location_focused',
            'ultra_broad',
            'ultra_narrow',
            'decision_maker',
            'emerging_market'
        }

        if v not in valid_focus_types:
            raise ValueError(
                f"Invalid focus type. Must be one of: {', '.join(sorted(valid_focus_types))}"
            )

        return v


class GenerateResponse(BaseModel):
    """Response model for query generation."""

    input: str = Field(
        ...,
        description="Original input text"
    )
    queries: Dict[str, Union[str, List[str]]] = Field(
        ...,
        description="Generated query variants grouped by type"
    )
    meta: Optional[Dict] = Field(
        default=None,
        description="Optional metadata about the generation process"
    )
