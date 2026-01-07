"""Test example for LinkedIn Query Agent (Agno).

This script demonstrates how to use the Query Agent with the Agno framework.
It generates LinkedIn query variants and saves them to a JSON file.

TODO: Add proper unit tests for Agno integration. This is currently an integration
test script. Consider adding pytest tests in a tests/ directory covering:
- QueryResult Pydantic validation
- Agent memoization behavior
- Error handling paths
- Focus type validation
"""

import asyncio
import json
import sys
from pathlib import Path

# Add current directory to path for local imports
sys.path.insert(0, str(Path(__file__).parent))

from agent import QueryAgent


async def main():
    """Run the test example."""
    print("LinkedIn Query Agent Test (v3.0 - Agno)")
    print("=" * 50)

    # Initialize agent with 180s timeout
    agent = QueryAgent(timeout=180)

    # Test input
    test_input = "CEO Jakarta fintech"
    count = 10
    focus = None  # or "seniority_focused", "industry_focused", etc.
    debug = True

    print(f"\nInput: {test_input}")
    print(f"Count: {count}")
    print(f"Focus: {focus or 'none'}")
    print(f"Debug: {debug}")
    print(f"Model: {agent.model}")
    print(f"Base URL: {agent.base_url}")
    print("\nGenerating query variants...\n")

    try:
        # Generate variants with Agno
        result = await agent.generate_variants(
            test_input,
            count=count,
            focus=focus,
            debug=debug
        )

        # Display results - count total queries (handle arrays)
        total_queries = sum(
            len(q) if isinstance(q, list) else 1
            for q in result.queries.values()
        )
        print(f"Generated {total_queries} queries across {len(result.queries)} types:\n")
        for query_type, queries in result.queries.items():
            print(f"[{query_type}]")
            if isinstance(queries, list):
                for i, q in enumerate(queries, 1):
                    print(f"  {i}. {q}")
            else:
                print(f"  {queries}")
            print()

        if result.meta:
            print(f"Meta: {result.meta}")
            print()

        # Prepare output (Pydantic model_dump)
        output = result.model_dump()

        # Save to file
        output_file = Path(__file__).parent / "test_output.json"
        with open(output_file, "w") as f:
            json.dump(output, f, indent=2)

        print(f"Saved results to {output_file}")
        print("\nTest completed successfully!")

    except Exception as e:
        print(f"Error: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
