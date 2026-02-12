# ==========================================
# DEVELOPMENT (Local Docker Compose)
# ==========================================
.PHONY: up down restart logs clean

# Start all containers in detached mode with build
up:
	docker compose up --build -d

# Stop all containers
down:
	docker compose down

# Restart all containers
restart:
	docker compose down && docker compose up --build -d

# View logs (follow mode)
logs:
	docker compose logs -f

# View specific service logs (usage: make logs-frontend, make logs-backend, make logs-db)
logs-%:
	docker compose logs -f $*

# Remove all containers, networks, and volumes
clean:
	docker compose down -v --remove-orphans

# ==========================================
# DATABASE MIGRATIONS
# ==========================================
.PHONY: db-migration-backend db-migrate-backend db-migrate-frontend db-migrate

# Generate a new migration file for the backend (Alembic)
# Usage: make db-migration-backend msg="description_of_changes"
db-migration-backend:
	@if [ -z "$(msg)" ]; then echo "Error: msg is undefined. Usage: make db-migration-backend msg=\"your message\""; exit 1; fi
	docker compose run --rm backend alembic revision --autogenerate -m "$(msg)"

# Apply pending migrations for the backend (Alembic)
db-migrate-backend:
	docker compose run --rm backend alembic upgrade head

# Push schema changes for the frontend (Drizzle)
# Note: This uses 'drizzle-kit push' which syncs the logical schema directly to the DB.
db-migrate-frontend:
	docker compose run --rm frontend npx drizzle-kit push

# Master command: Migrate both Backend and Frontend
db-migrate: db-migrate-backend db-migrate-frontend

# ==========================================
# PRODUCTION (Azure)
# ==========================================
.PHONY: deploy-setup deploy-build deploy-push deploy-migrate deploy-all

# 1. Setup Infrastructure (Resource Group, ACR, DB, Environment)
deploy-setup:
	chmod +x deployment/azure_deploy.sh
	./deployment/azure_deploy.sh setup

# 2. Build & Push Images
deploy-build:
	./deployment/azure_deploy.sh build

# 3. Deploy Containers (Backend & Frontend)
deploy-push:
	./deployment/azure_deploy.sh deploy

# 4. Run Migrations (Jobs)
deploy-migrate:
	./deployment/azure_deploy.sh migrate

# Run everything (First time deploy)
deploy-all:
	chmod +x deployment/azure_deploy.sh
	./deployment/azure_deploy.sh all
