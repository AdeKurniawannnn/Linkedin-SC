"""Test example for GLM Query Agent SDK.

This script demonstrates how to use the GLM Query Agent with the Claude Agent SDK.
It generates LinkedIn query variants and saves them to a JSON file.
"""

import asyncio
import json
import sys
from pathlib import Path

# Add current directory to path for local imports
sys.path.insert(0, str(Path(__file__).parent))

from agent import GLMQueryAgent


async def main():
    """Run the test example."""
    print("GLM Query Agent SDK Test")
    print("=" * 50)

    # Initialize agent with 180s timeout
    agent = GLMQueryAgent(timeout=180)

    # Test input
    test_input = "CEO Jakarta fintech"
    print(f"\nInput: {test_input}")
    print(f"Model: {agent.model}")
    print(f"Base URL: {agent.base_url}")
    print("\nGenerating query variants...\n")

    try:
        # Generate variants
        result = await agent.generate_variants(test_input)

        # Display results
        print(f"✓ Generated {len(result.variants)} variants:\n")
        for i, variant in enumerate(result.variants, 1):
            print(f"{i}. [{variant.strategy_type}]")
            print(f"   Query: {variant.query}")
            print(f"   Precision: {variant.expected_precision} | Volume: {variant.expected_volume}")
            print(f"   Explanation: {variant.explanation}")
            print()

        # Prepare output
        output = {
            "metadata": result.metadata,
            "variants": [
                {
                    "query": v.query,
                    "strategy_type": v.strategy_type,
                    "expected_precision": v.expected_precision,
                    "expected_volume": v.expected_volume,
                    "explanation": v.explanation,
                    "targeting_focus": v.targeting_focus
                }
                for v in result.variants
            ]
        }

        # Save to file
        output_file = Path(__file__).parent / "test_output.json"
        with open(output_file, "w") as f:
            json.dump(output, f, indent=2)

        print(f"✓ Saved results to {output_file}")
        print("\nTest completed successfully!")

    except Exception as e:
        print(f"✗ Error: {type(e).__name__}: {e}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
