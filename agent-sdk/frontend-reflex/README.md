# Query Generator - Reflex Frontend

Simple Reflex frontend for the QueryGenerator API.

## Setup

```bash
cd agent-sdk/frontend-reflex

# Create virtual environment
uv venv

# Install dependencies
uv pip install -r requirements.txt

# Initialize Reflex
uv run reflex init
```

## Running

1. **Start the API backend** (in another terminal):
```bash
cd agent-sdk
uv run python -m uvicorn api.main:app --reload --port 8000
```

2. **Start the Reflex frontend**:
```bash
cd agent-sdk/frontend-reflex
uv run reflex run
```

The app will be available at http://localhost:3001

## Features

- Natural language input field
- Adjustable query count (1-30)
- Copy-to-clipboard for each generated query
- Error handling with friendly messages
- Dark theme UI
