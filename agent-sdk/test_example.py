"""Test example for GLM Query Agent SDK.

This script demonstrates how to use the GLM Query Agent with the Claude Agent SDK.
It generates LinkedIn query variants and saves them to a JSON file.
"""

import asyncio
import json
import sys
from dataclasses import asdict
from pathlib import Path

# Add current directory to path for local imports
sys.path.insert(0, str(Path(__file__).parent))

from generator import QueryGenerator


async def main():
    """Run the test example."""
    print("GLM Query Agent SDK Test (v2.0)")
    print("=" * 50)

    # Initialize generator with 180s timeout
    generator = QueryGenerator(timeout=180)

    # Test input
    test_input = "CEO Jakarta fintech"
    count = 10
    debug = True

    print(f"\nInput: {test_input}")
    print(f"Count: {count}")
    print(f"Debug: {debug}")
    print(f"Model: {generator.model}")
    print(f"Base URL: {generator.base_url}")
    print("\nGenerating query variants...\n")

    try:
        # Generate variants with new API
        result = await generator.generate(
            test_input,
            count=count,
            debug=debug
        )

        # Display results
        print(f"Generated {len(result.queries)} queries:\n")
        for i, query in enumerate(result.queries, 1):
            print(f"{i}. {query}")
        print()

        if result.meta:
            print(f"Meta: {result.meta}")
            print()

        # Prepare output (convert dataclass to dict)
        output = asdict(result)

        # Save to file
        output_file = Path(__file__).parent / "test_output.json"
        with open(output_file, "w") as f:
            json.dump(output, f, indent=2)

        print(f"Saved results to {output_file}")
        print("\nTest completed successfully!")

    except Exception as e:
        print(f"Error: {type(e).__name__}: {e}")
        sys.exit(1)


def run_ignoring_cleanup_errors(coro):
    """Run async coroutine, ignoring SDK cleanup errors."""
    import warnings
    warnings.filterwarnings("ignore", message=".*coroutine.*was never awaited.*")
    warnings.filterwarnings("ignore", message=".*Enable tracemalloc.*")

    loop = asyncio.new_event_loop()
    loop.set_exception_handler(lambda l, c: None)  # Suppress all async errors during cleanup
    try:
        return loop.run_until_complete(coro)
    finally:
        # Suppress pending task warnings during shutdown
        pending = asyncio.all_tasks(loop)
        for task in pending:
            task.cancel()
        loop.close()


if __name__ == "__main__":
    run_ignoring_cleanup_errors(main())
