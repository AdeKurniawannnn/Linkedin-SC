.PHONY: help install dev dev-frontend dev-backend dev-convex dev-all build lint typecheck test test-run test-e2e test-coverage test-backend clean logs convex-push convex-deploy convex-dashboard

.DEFAULT_GOAL := help

# ============ HELP ============
help:  ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ============ INSTALL ============
install:  ## Install all dependencies
	cd frontend && npm install
	cd backend && uv pip install -r requirements.txt

# ============ DEVELOPMENT ============
dev-frontend:  ## Start Next.js dev server (port 3000)
	cd frontend && npm run dev

dev-backend:  ## Start FastAPI backend (port 8000)
	cd backend && source .venv/bin/activate && uvicorn main:app --host 0.0.0.0 --port 8000 --reload

dev-convex:  ## Start Convex dev server
	cd frontend && npx convex dev

dev:  ## Start frontend + Convex (parallel)
	@make -j2 dev-frontend dev-convex

dev-all:  ## Start frontend + backend + Convex (parallel)
	@make -j3 dev-frontend dev-backend dev-convex

# ============ CONVEX ============
convex-push:  ## Push Convex schema (one-time)
	cd frontend && npx convex dev --once

convex-deploy:  ## Deploy Convex to production
	cd frontend && npx convex deploy

convex-dashboard:  ## Open Convex dashboard
	@echo "Opening http://127.0.0.1:6790"
	@open http://127.0.0.1:6790 2>/dev/null || xdg-open http://127.0.0.1:6790 2>/dev/null || echo "Visit: http://127.0.0.1:6790"

# ============ BUILD & QUALITY ============
build:  ## Build frontend for production
	cd frontend && npm run build

lint:  ## Run ESLint on frontend
	cd frontend && npm run lint

typecheck:  ## Run TypeScript check
	cd frontend && npx tsc --noEmit

# ============ TESTING ============
test:  ## Run frontend unit tests
	cd frontend && npm run test

test-run:  ## Run tests once (no watch)
	cd frontend && npm run test:run

test-e2e:  ## Run Playwright E2E tests
	cd frontend && npm run test:e2e

test-coverage:  ## Run tests with coverage
	cd frontend && npm run test:coverage

test-backend:  ## Run backend pytest
	cd backend && source .venv/bin/activate && pytest

# ============ UTILITIES ============
clean:  ## Clean build artifacts
	rm -rf frontend/.next frontend/node_modules/.cache
	rm -rf backend/__pycache__ backend/.pytest_cache

logs:  ## Show backend logs
	tail -f backend/backend.log
