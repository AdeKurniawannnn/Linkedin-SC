.PHONY: dev backend frontend install clean help \
        test test-all test-env \
        test-unit test-unit-v test-services test-routes test-utils test-integration test-backend-cov test-cov-term \
        test-vitest test-vitest-watch test-components test-stores test-page test-e2e test-e2e-ui test-frontend-cov \
        test-install

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
	@echo "  $(BRIGHT_GREEN)make dev$(RESET)             - Run both frontend and backend"
	@echo "  $(BRIGHT_BLUE)make backend$(RESET)         - Run backend only (port 8000)"
	@echo "  $(BRIGHT_MAGENTA)make frontend$(RESET)        - Run frontend only (port 3000)"
	@echo "  $(YELLOW)make install$(RESET)         - Install all dependencies"
	@echo "  $(RED)make clean$(RESET)           - Stop all running services"
	@echo ""
	@echo "$(BOLD)Testing:$(RESET)"
	@echo "  $(BRIGHT_RED)make test-env$(RESET)        - Check env config (API keys) - run first!"
	@echo "  $(BRIGHT_GREEN)make test$(RESET)            - Quick tests (unit + vitest, CI-safe)"
	@echo "  $(BRIGHT_RED)make test-all$(RESET)        - Full suite (unit + integration + vitest + E2E)"
	@echo ""
	@echo "$(BOLD)Backend Tests (149 total):$(RESET)"
	@echo "  $(BRIGHT_CYAN)make test-unit$(RESET)       - All unit tests (108)"
	@echo "  $(BRIGHT_BLUE)make test-services$(RESET)   - Service layer (54)"
	@echo "  $(BRIGHT_MAGENTA)make test-routes$(RESET)     - Route layer (40)"
	@echo "  $(BRIGHT_YELLOW)make test-utils$(RESET)      - Utility layer (14)"
	@echo "  $(CYAN)make test-integration$(RESET)  - Integration tests (41, may need API)"
	@echo "  $(WHITE)make test-backend-cov$(RESET)  - Backend with coverage"
	@echo ""
	@echo "$(BOLD)Frontend Tests (167 Vitest + E2E):$(RESET)"
	@echo "  $(BRIGHT_GREEN)make test-vitest$(RESET)     - All Vitest tests (167)"
	@echo "  $(BRIGHT_GREEN)make test-vitest-watch$(RESET) - Vitest watch mode"
	@echo "  $(BRIGHT_BLUE)make test-components$(RESET) - Component tests only (99)"
	@echo "  $(BRIGHT_MAGENTA)make test-stores$(RESET)     - Store tests only (26)"
	@echo "  $(BRIGHT_YELLOW)make test-page$(RESET)       - Page tests only (26)"
	@echo "  $(CYAN)make test-e2e$(RESET)        - E2E Playwright (headless)"
	@echo "  $(WHITE)make test-e2e-ui$(RESET)     - E2E Playwright (UI mode)"
	@echo "  $(DIM)make test-frontend-cov$(RESET) - Frontend with coverage"
	@echo ""
	@echo "$(BOLD)Setup:$(RESET)"
	@echo "  $(DIM)make test-install$(RESET)    - Install test dependencies"

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
# TESTING - COMBINED
# ============================================================================

# Quick tests (unit + vitest, CI-safe)
test: test-unit test-vitest
	@echo "$(BOLD)$(BRIGHT_GREEN)✓ Quick tests complete$(RESET)"

# Full test suite (env check + unit + integration + vitest + e2e)
test-all: test-env test-unit test-integration test-vitest test-e2e
	@echo "$(BOLD)$(BRIGHT_GREEN)✓ Full test suite complete$(RESET)"

# ============================================================================
# BACKEND TESTS
# ============================================================================

# Environment configuration check (run first to catch missing API keys)
test-env:
	@echo "$(BOLD)$(BRIGHT_RED)━━━ ENV CONFIG CHECK$(RESET)"
	cd "$(ROOT_DIR)/LinkedinSC/backend" && source .venv/bin/activate && \
		python -m pytest tests/test_env_config.py -v --tb=short

# All backend unit tests (108)
test-unit:
	@echo "$(BOLD)$(BRIGHT_CYAN)━━━ BACKEND UNIT TESTS$(RESET)"
	cd "$(ROOT_DIR)/LinkedinSC/backend" && source .venv/bin/activate && \
		python -m pytest tests/unit/ -v --tb=short

# Backend unit tests - verbose
test-unit-v:
	@echo "$(BOLD)$(BRIGHT_CYAN)━━━ BACKEND UNIT TESTS (VERBOSE)$(RESET)"
	cd "$(ROOT_DIR)/LinkedinSC/backend" && source .venv/bin/activate && \
		python -m pytest tests/unit/ -v --tb=long -s

# Service layer tests (54)
test-services:
	@echo "$(BOLD)$(BRIGHT_BLUE)━━━ SERVICE LAYER$(RESET)"
	cd "$(ROOT_DIR)/LinkedinSC/backend" && source .venv/bin/activate && \
		python -m pytest tests/unit/test_service_*.py -v --tb=short

# Route layer tests (40)
test-routes:
	@echo "$(BOLD)$(BRIGHT_MAGENTA)━━━ ROUTE LAYER$(RESET)"
	cd "$(ROOT_DIR)/LinkedinSC/backend" && source .venv/bin/activate && \
		python -m pytest tests/unit/test_routes/ -v --tb=short

# Utility layer tests (14)
test-utils:
	@echo "$(BOLD)$(BRIGHT_YELLOW)━━━ UTILITY LAYER$(RESET)"
	cd "$(ROOT_DIR)/LinkedinSC/backend" && source .venv/bin/activate && \
		python -m pytest tests/unit/test_utils_parsers.py -v --tb=short

# Integration tests (41, may require API keys)
test-integration:
	@echo "$(BOLD)$(CYAN)━━━ INTEGRATION TESTS$(RESET)"
	cd "$(ROOT_DIR)/LinkedinSC/backend" && source .venv/bin/activate && \
		python -m pytest tests/integration/ -v --tb=short

# Backend coverage
test-backend-cov:
	@echo "$(BOLD)$(BRIGHT_CYAN)━━━ BACKEND COVERAGE$(RESET)"
	cd "$(ROOT_DIR)/LinkedinSC/backend" && source .venv/bin/activate && \
		python -m pytest tests/unit/ --cov=services --cov=api --cov=utils --cov-report=html --cov-report=term-missing -v

# Backend coverage - terminal only
test-cov-term:
	@echo "$(BOLD)$(BRIGHT_CYAN)━━━ BACKEND COVERAGE (TERMINAL)$(RESET)"
	cd "$(ROOT_DIR)/LinkedinSC/backend" && source .venv/bin/activate && \
		python -m pytest tests/unit/ --cov=services --cov=api --cov=utils --cov-report=term-missing

# ============================================================================
# FRONTEND TESTS (VITEST)
# ============================================================================

# All Vitest tests (167)
test-vitest:
	@echo "$(BOLD)$(BRIGHT_GREEN)━━━ VITEST TESTS$(RESET)"
	cd "$(ROOT_DIR)/LinkedinSC/frontend" && npm run test:run

# Vitest watch mode
test-vitest-watch:
	@echo "$(BOLD)$(BRIGHT_GREEN)━━━ VITEST WATCH$(RESET)"
	cd "$(ROOT_DIR)/LinkedinSC/frontend" && npm run test

# Component tests only (99)
test-components:
	@echo "$(BOLD)$(BRIGHT_BLUE)━━━ COMPONENT TESTS$(RESET)"
	cd "$(ROOT_DIR)/LinkedinSC/frontend" && npm run test:run -- tests/components/

# Store tests only (26)
test-stores:
	@echo "$(BOLD)$(BRIGHT_MAGENTA)━━━ STORE TESTS$(RESET)"
	cd "$(ROOT_DIR)/LinkedinSC/frontend" && npm run test:run -- tests/stores/

# Page tests only (26)
test-page:
	@echo "$(BOLD)$(BRIGHT_YELLOW)━━━ PAGE TESTS$(RESET)"
	cd "$(ROOT_DIR)/LinkedinSC/frontend" && npm run test:run -- tests/app/

# Frontend coverage
test-frontend-cov:
	@echo "$(BOLD)$(CYAN)━━━ FRONTEND COVERAGE$(RESET)"
	cd "$(ROOT_DIR)/LinkedinSC/frontend" && npm run test:coverage

# ============================================================================
# E2E TESTS (PLAYWRIGHT)
# ============================================================================

# E2E headless
test-e2e:
	@echo "$(BOLD)$(BRIGHT_MAGENTA)━━━ E2E TESTS$(RESET)"
	cd "$(ROOT_DIR)/LinkedinSC/frontend" && npm run test:e2e

# E2E UI mode
test-e2e-ui:
	@echo "$(BOLD)$(BRIGHT_YELLOW)━━━ E2E TESTS (UI MODE)$(RESET)"
	cd "$(ROOT_DIR)/LinkedinSC/frontend" && npm run test:e2e:ui

# ============================================================================
# SETUP
# ============================================================================

# Install test dependencies
test-install:
	@echo "$(BOLD)$(BRIGHT_YELLOW)→$(RESET) Installing test dependencies..."
	cd "$(ROOT_DIR)/LinkedinSC/backend" && source .venv/bin/activate && \
		pip install -r requirements-dev.txt
	@echo "$(BOLD)$(BRIGHT_GREEN)✓ Test dependencies installed$(RESET)"
