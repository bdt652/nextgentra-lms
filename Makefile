.PHONY: help install dev build lint test clean docker-up docker-down db-migrate db-seed

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install: ## Install all dependencies
	@echo "Installing dependencies..."
	npm install

dev: ## Start all development servers
	@echo "Starting development servers..."
	npm run dev

dev-backend: ## Start only backend
	@echo "Starting backend..."
	cd backend && python -m uvicorn main:app --reload

dev-teacher: ## Start only teacher portal
	@echo "Starting teacher portal..."
	npm run dev -w apps/teacher-portal

dev-student: ## Start only student portal
	@echo "Starting student portal..."
	npm run dev -w apps/student-portal

build: ## Build all applications
	@echo "Building applications..."
	npm run build

lint: ## Run linter on all packages
	@echo "Running linter..."
	npm run lint

lint-fix: ## Run linter and fix issues
	@echo "Running linter with fixes..."
	npm run lint:fix --parallel

type-check: ## Run TypeScript type checking
	@echo "Running type check..."
	npm run type-check

test: ## Run all tests
	@echo "Running tests..."
	npm run test

test-coverage: ## Run tests with coverage
	@echo "Running tests with coverage..."
	npm run test:coverage

test-backend: ## Run only backend tests
	@echo "Running backend tests..."
	cd backend && python -m pytest tests/ -v

test-frontend: ## Run only frontend tests
	@echo "Running frontend tests..."
	npm run test --workspace=apps/teacher-portal && npm run test --workspace=apps/student-portal

format: ## Format code with Prettier
	@echo "Formatting code..."
	npm run format

docker-up: ## Start Docker services
	@echo "Starting Docker Compose..."
	docker-compose up -d

docker-down: ## Stop Docker services
	@echo "Stopping Docker Compose..."
	docker-compose down

docker-logs: ## Show Docker logs
	@echo "Showing Docker logs..."
	docker-compose logs -f

db-migrate: ## Run database migrations
	@echo "Running migrations..."
	cd backend && npx prisma migrate dev

db-seed: ## Seed database
	@echo "Seeding database..."
	cd backend && npx prisma db seed

db-studio: ## Open Prisma Studio
	@echo "Opening Prisma Studio..."
	cd backend && npx prisma studio

clean: ## Clean build artifacts
	@echo "Cleaning build artifacts..."
	rm -rf apps/*/.next
	rm -rf .turbo
	rm -rf apps/*/.turbo
	rm -rf packages/*/.turbo
	rm -rf coverage
	@echo "✅ Clean complete!"

clean-all: ## Clean everything (including node_modules)
	@echo "Cleaning all build artifacts and caches..."
	rm -rf node_modules
	rm -rf apps/*/node_modules
	rm -rf packages/*/node_modules
	rm -rf apps/*/.next
	rm -rf packages/*/dist
	rm -rf .turbo
	rm -rf apps/*/.turbo
	rm -rf packages/*/.turbo
	rm -rf coverage
	rm -rf .cache
	rm -f *.tsbuildinfo
	rm -rf apps/*/tsconfig.tsbuildinfo
	rm -rf backend/__pycache__
	rm -rf backend/.pytest_cache
	rm -rf backend/.mypy_cache
	rm -rf backend/.ruff_cache
	@echo "✅ Clean complete! Run 'npm install' to reinstall dependencies."

pre-commit: ## Run pre-commit checks manually
	@echo "Running pre-commit checks..."
	npx lint-staged
	node scripts/check-placeholders.js

check-placeholders: ## Check for placeholder code
	@echo "Checking for placeholder code..."
	node scripts/check-placeholders.js

ci-check: ## Run all CI checks locally
	@echo "Running CI checks..."
	npm run lint
	npm run type-check
	npm run test

.DEFAULT_GOAL := help
