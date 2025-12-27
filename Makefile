.PHONY: dev backend frontend install clean help test test-backend test-frontend test-unit test-unit-v test-services test-routes test-utils test-components test-quick test-cov test-cov-term test-install test-integration test-all

# Get the directory where this Makefile lives (use CURDIR for paths with spaces)
ROOT_DIR := $(CURDIR)

# ANSI color codes for terminal output
RESET   := \033[0m
BOLD    := \033[1m
DIM     := \033[2m

# Colors
BLACK   := \033[30m
RED     := \033[31m
GREEN   := \033[32m
YELLOW  := \033[33m
BLUE    := \033[34m
MAGENTA := \033[35m
CYAN    := \033[36m
WHITE   := \033[37m

# Bright colors
BRIGHT_BLACK   := \033[90m
BRIGHT_RED     := \033[91m
BRIGHT_GREEN   := \033[92m
BRIGHT_YELLOW  := \033[93m
BRIGHT_BLUE    := \033[94m
BRIGHT_MAGENTA := \033[95m
BRIGHT_CYAN    := \033[96m
BRIGHT_WHITE   := \033[97m

# Default target
help:
	@echo "$(BRIGHT_CYAN)Available commands:$(RESET)"
	@echo ""
	@echo "$(BOLD)Development:$(RESET)"
	@echo "  $(BRIGHT_GREEN)make dev$(RESET)            - Run both frontend and backend"
	@echo "  $(BRIGHT_BLUE)make backend$(RESET)        - Run backend only (port 8000)"
	@echo "  $(BRIGHT_MAGENTA)make frontend$(RESET)       - Run frontend only (port 3000)"
	@echo "  $(YELLOW)make install$(RESET)        - Install all dependencies"
	@echo "  $(RED)make clean$(RESET)          - Stop all running services"
	@echo ""
	@echo "$(BOLD)Testing (108 unit + 41 integration tests):$(RESET)"
	@echo "  $(BRIGHT_GREEN)make test$(RESET)           - Run unit + frontend tests (safe for CI)"
	@echo "  $(BRIGHT_RED)make test-all$(RESET)       - Run ALL tests including integration"
	@echo "  $(BRIGHT_CYAN)make test-unit$(RESET)      - Backend unit tests (108 tests)"
	@echo "  $(BRIGHT_BLUE)make test-services$(RESET)  - Service layer tests (54 tests)"
	@echo "  $(BRIGHT_MAGENTA)make test-routes$(RESET)    - Route layer tests (40 tests)"
	@echo "  $(BRIGHT_YELLOW)make test-utils$(RESET)     - Utility layer tests (14 tests)"
	@echo "  $(CYAN)make test-integration$(RESET) - Integration tests (41 tests, may need API)"
	@echo "  $(WHITE)make test-cov$(RESET)       - Run tests with coverage report"
	@echo "  $(DIM)make test-install$(RESET)   - Install test dependencies"

# Run both services (clean first to avoid port conflicts)
dev: clean
	@echo "$(BOLD)$(BRIGHT_GREEN)→$(RESET) $(BOLD)Starting backend on $(BRIGHT_BLUE):8000$(RESET) and frontend on $(BRIGHT_MAGENTA):3000$(RESET)$(BOLD)...$(RESET)"
	@rm -f "$(ROOT_DIR)/LinkedinSC/frontend/.next/dev/lock" 2>/dev/null || true
	@make -j2 backend frontend

# Backend (LinkedinSC)
backend:
	@echo "$(BOLD)$(BRIGHT_BLUE)━━━ BACKEND$(RESET) $(DIM)($(BRIGHT_BLUE)port 8000$(RESET)$(DIM))$(RESET)"
	@echo "$(BRIGHT_BLUE)→$(RESET) Starting LinkedinSC API server..."
	cd "$(ROOT_DIR)/LinkedinSC/backend" && source .venv/bin/activate && uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Frontend (Next.js)
frontend:
	@echo "$(BOLD)$(BRIGHT_MAGENTA)━━━ FRONTEND$(RESET) $(DIM)($(BRIGHT_MAGENTA)port 3000$(RESET)$(DIM))$(RESET)"
	@echo "$(BRIGHT_MAGENTA)→$(RESET) Starting Next.js dev server..."
	cd "$(ROOT_DIR)/LinkedinSC/frontend" && npm run dev -- --port 3000

# Install all dependencies
install:
	@echo "$(BOLD)$(BRIGHT_YELLOW)→$(RESET) $(BOLD)Installing dependencies...$(RESET)"
	@echo "$(BRIGHT_BLUE)→ Backend$(RESET) $(DIM)dependencies...$(RESET)"
	cd "$(ROOT_DIR)/serp-api-aggregator" && uv pip install -e ".[all]"
	@echo "$(BRIGHT_MAGENTA)→ Frontend$(RESET) $(DIM)dependencies...$(RESET)"
	cd "$(ROOT_DIR)/LinkedinSC/frontend" && npm install
	@echo "$(BOLD)$(BRIGHT_GREEN)✓ Installation complete$(RESET)"

# Stop services (kill processes on ports)
clean:
	@echo "$(BOLD)$(RED)→$(RESET) $(BOLD)Stopping services...$(RESET)"
	-lsof -ti:8000 | xargs kill -9 2>/dev/null || true
	-lsof -ti:3000 | xargs kill -9 2>/dev/null || true
	@echo "$(BOLD)$(BRIGHT_GREEN)✓ Services stopped$(RESET)"

# ============================================================================
# TESTING
# ============================================================================

# Run all tests (backend + frontend)
test: test-backend test-frontend
	@echo "$(BOLD)$(BRIGHT_GREEN)✓ All tests complete$(RESET)"

# Run all backend tests (108 unit tests)
test-backend: test-unit
	@echo "$(BOLD)$(BRIGHT_GREEN)✓ Backend tests complete (108 tests)$(RESET)"

# Run all frontend tests
test-frontend: test-components
	@echo "$(BOLD)$(BRIGHT_GREEN)✓ Frontend tests complete$(RESET)"

# Backend unit tests (108 tests - no API calls)
test-unit:
	@echo "$(BOLD)$(BRIGHT_CYAN)━━━ UNIT TESTS$(RESET)"
	@echo "$(BRIGHT_CYAN)→$(RESET) Running backend unit tests (108 tests)..."
	cd "$(ROOT_DIR)/LinkedinSC/backend" && source .venv/bin/activate && \
		python -m pytest tests/unit/ -v --tb=short

# Backend unit tests - verbose with full output
test-unit-v:
	@echo "$(BOLD)$(BRIGHT_CYAN)━━━ UNIT TESTS (VERBOSE)$(RESET)"
	cd "$(ROOT_DIR)/LinkedinSC/backend" && source .venv/bin/activate && \
		python -m pytest tests/unit/ -v --tb=long -s

# Backend service layer tests only (54 tests)
test-services:
	@echo "$(BOLD)$(BRIGHT_BLUE)━━━ SERVICE LAYER TESTS$(RESET)"
	@echo "$(BRIGHT_BLUE)→$(RESET) Running service layer tests (54 tests)..."
	cd "$(ROOT_DIR)/LinkedinSC/backend" && source .venv/bin/activate && \
		python -m pytest tests/unit/test_service_*.py -v --tb=short

# Backend route layer tests only (40 tests)
test-routes:
	@echo "$(BOLD)$(BRIGHT_MAGENTA)━━━ ROUTE LAYER TESTS$(RESET)"
	@echo "$(BRIGHT_MAGENTA)→$(RESET) Running route layer tests (40 tests)..."
	cd "$(ROOT_DIR)/LinkedinSC/backend" && source .venv/bin/activate && \
		python -m pytest tests/unit/test_routes/ -v --tb=short

# Backend utility layer tests only (14 tests)
test-utils:
	@echo "$(BOLD)$(BRIGHT_YELLOW)━━━ UTILITY LAYER TESTS$(RESET)"
	@echo "$(BRIGHT_YELLOW)→$(RESET) Running utility layer tests (14 tests)..."
	cd "$(ROOT_DIR)/LinkedinSC/backend" && source .venv/bin/activate && \
		python -m pytest tests/unit/test_utils_parsers.py -v --tb=short

# Frontend component tests
test-components:
	@echo "$(BOLD)$(BRIGHT_YELLOW)━━━ COMPONENT TESTS$(RESET)"
	@echo "$(BRIGHT_YELLOW)→$(RESET) Running frontend component tests..."
	cd "$(ROOT_DIR)/LinkedinSC/frontend" && npm run test:run

# Quick tests (no API calls - fast feedback)
test-quick: test-unit
	@echo "$(BOLD)$(BRIGHT_GREEN)✓ Quick tests complete (no API calls)$(RESET)"

# Test with coverage report
test-cov:
	@echo "$(BOLD)$(BRIGHT_CYAN)━━━ TEST COVERAGE$(RESET)"
	@echo "$(BRIGHT_CYAN)→$(RESET) Running tests with coverage..."
	cd "$(ROOT_DIR)/LinkedinSC/backend" && source .venv/bin/activate && \
		python -m pytest tests/unit/ --cov=services --cov=api --cov=utils --cov-report=html --cov-report=term-missing -v

# Test with coverage - terminal only
test-cov-term:
	@echo "$(BOLD)$(BRIGHT_CYAN)━━━ TEST COVERAGE (TERMINAL)$(RESET)"
	cd "$(ROOT_DIR)/LinkedinSC/backend" && source .venv/bin/activate && \
		python -m pytest tests/unit/ --cov=services --cov=api --cov=utils --cov-report=term-missing

# Install test dependencies
test-install:
	@echo "$(BOLD)$(BRIGHT_YELLOW)→$(RESET) Installing test dependencies..."
	cd "$(ROOT_DIR)/LinkedinSC/backend" && source .venv/bin/activate && \
		pip install -r requirements-dev.txt
	@echo "$(BOLD)$(BRIGHT_GREEN)✓ Test dependencies installed$(RESET)"

# Integration tests (41 tests - may require API keys/external services)
test-integration:
	@echo "$(BOLD)$(CYAN)━━━ INTEGRATION TESTS$(RESET)"
	@echo "$(CYAN)→$(RESET) Running integration tests (41 tests)..."
	cd "$(ROOT_DIR)/LinkedinSC/backend" && source .venv/bin/activate && \
		python -m pytest tests/integration/ -v --tb=short -m "integration or not integration"

# Run ALL tests (unit + integration + frontend)
test-all: test-unit test-integration test-components
	@echo "$(BOLD)$(BRIGHT_GREEN)✓ All tests complete (108 unit + 41 integration + frontend)$(RESET)"
