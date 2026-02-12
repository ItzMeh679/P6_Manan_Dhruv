#!/bin/bash

# ===================================================================
#      PINNACLE - AZURE CONTAINER APPS DEPLOYMENT SCRIPT
# -------------------------------------------------------------------
#  Prerequisites:
#  - Azure CLI (az) installed and logged in (az login)
#  - Docker installed and running
# ===================================================================

set -e  # Exit on error

# ============================================
# LOAD CONFIGURATION
# ============================================
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/prod.env"

if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Error: prod.env not found!"
    echo "   cp deployment/prod.env.example deployment/prod.env"
    exit 1
fi

set -a
source "$ENV_FILE"
set +a

# Derived Variables
BACKEND_IMAGE="${ACR_NAME}.azurecr.io/${APP_NAME}-backend"
FRONTEND_IMAGE="${ACR_NAME}.azurecr.io/${APP_NAME}-frontend"
ACA_ENV_NAME="${APP_NAME}-env"

# ============================================
# COLORS & FORMATTING
# ============================================
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

print_step() { echo -e "\n${BLUE}==>${NC} ${GREEN}$1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_header() { echo -e "\n${CYAN}╔════════════════════════════════════════════╗\n║ $1\n╚════════════════════════════════════════════╝${NC}"; }

# Timer
START_TIME=$(date +%s)
show_elapsed() {
    END_TIME=$(date +%s)
    ELAPSED=$((END_TIME - START_TIME))
    echo -e "${CYAN}⏱️  Completed in $((ELAPSED / 60))m $((ELAPSED % 60))s${NC}"
}

# ============================================
# PHASE: SETUP
# ============================================
phase_setup() {
    print_header "Setting up Azure Infrastructure"

    print_step "Creating Resource Group: ${RESOURCE_GROUP}"
    az group create --name ${RESOURCE_GROUP} --location ${LOCATION} --output none

    print_step "Creating Container Registry (ACR)..."
    if ! az acr show --name ${ACR_NAME} --resource-group ${RESOURCE_GROUP} &>/dev/null; then
        az acr create --resource-group ${RESOURCE_GROUP} --name ${ACR_NAME} --sku Basic --admin-enabled true --output none
    else
        echo "   ACR already exists, skipping."
    fi

    print_step "Creating Container Apps Environment..."
    if ! az containerapp env show --name ${ACA_ENV_NAME} --resource-group ${RESOURCE_GROUP} &>/dev/null; then
        az containerapp env create --name ${ACA_ENV_NAME} --resource-group ${RESOURCE_GROUP} --location ${LOCATION} --output none
    else
        echo "   Container Apps Environment already exists, skipping."
    fi

    print_step "Creating PostgreSQL Flexible Server (this takes a few minutes)..."
    # Check if exists first to avoid error
    if ! az postgres flexible-server show --resource-group ${RESOURCE_GROUP} --name ${DB_SERVER_NAME} &>/dev/null; then
        az postgres flexible-server create \
            --resource-group ${RESOURCE_GROUP} \
            --name ${DB_SERVER_NAME} \
            --location ${LOCATION} \
            --admin-user ${DB_ADMIN_USER} \
            --admin-password ${DB_ADMIN_PASSWORD} \
            --sku-name Standard_B1ms \
            --tier Burstable \
            --storage-size 32 \
            --version 15 \
            --yes --output none
        
        print_step "Creating Database: ${DB_NAME}..."
        az postgres flexible-server db create \
            --resource-group ${RESOURCE_GROUP} \
            --server-name ${DB_SERVER_NAME} \
            --database-name ${DB_NAME} \
            --output none
            
        print_step "Configuring Firewall (Allow Access from Azure Services)..."
        az postgres flexible-server firewall-rule create \
            --resource-group ${RESOURCE_GROUP} \
            --name ${DB_SERVER_NAME} \
            --rule-name AllowAzureServices \
            --start-ip-address 0.0.0.0 \
            --end-ip-address 0.0.0.0 \
            --output none
    else
        echo "   Database already exists, skipping creation."
    fi

    print_success "Infrastructure Setup Complete!"
}

# ============================================
# PHASE: BUILD
# ============================================
phase_build() {
    print_header "Building & Pushing Docker Images"

    print_step "Logging into ACR..."
    az acr login --name ${ACR_NAME}

    # Get Root Dir
    PROJECT_ROOT="${SCRIPT_DIR}/.."

    print_step "Building Backend..."
    docker build --platform linux/amd64 -t "${BACKEND_IMAGE}:latest" "${PROJECT_ROOT}/backend"
    docker push "${BACKEND_IMAGE}:latest"

    print_step "Building Frontend..."
    # Note: Next.js needs build args, but we are using Runtime Config for env vars in this setup
    # to keep images portable.
    # Update: Passing NEXT_PUBLIC_APP_URL if set, to fix client-side hydration
    if [ -z "$NEXT_PUBLIC_APP_URL" ]; then
        echo "   WARNING: NEXT_PUBLIC_APP_URL is not set. Client-side links may break (localhost)."
        docker build --platform linux/amd64 -t "${FRONTEND_IMAGE}:latest" "${PROJECT_ROOT}/frontend"
    else
        echo "   Injecting NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}"
        docker build --platform linux/amd64 --build-arg NEXT_PUBLIC_APP_URL="${NEXT_PUBLIC_APP_URL}" -t "${FRONTEND_IMAGE}:latest" "${PROJECT_ROOT}/frontend"
    fi
    docker push "${FRONTEND_IMAGE}:latest"

    print_success "Build & Push Complete!"
}

# ============================================
# PHASE: DEPLOY
# ============================================
phase_deploy() {
    print_header "Deploying Services to Container Apps"

    # 1. Construct Database URL
    # Azure Postgres URL format: postgresql://user:password@host:5432/dbname
    # Note: Flexible server requires username without @server
    DB_HOST="${DB_SERVER_NAME}.postgres.database.azure.com"
    DATABASE_URL="postgresql://${DB_ADMIN_USER}:${DB_ADMIN_PASSWORD}@${DB_HOST}:5432/${DB_NAME}?sslmode=require"
    
    # Enable AsyncPG for Python
    ASYNC_DB_URL="postgresql+asyncpg://${DB_ADMIN_USER}:${DB_ADMIN_PASSWORD}@${DB_HOST}:5432/${DB_NAME}?ssl=require"

    # Get ACR Credentials for pulling images
    ACR_PASSWORD=$(az acr credential show --name ${ACR_NAME} --query "passwords[0].value" -o tsv)

    # ----------------------------------------
    # 2. Deploy Backend
    # ----------------------------------------
    print_step "Deploying Backend..."
    
    # We deploy backend first to get its URL
    az containerapp create \
        --name "${APP_NAME}-backend" \
        --resource-group ${RESOURCE_GROUP} \
        --environment ${ACA_ENV_NAME} \
        --image "${BACKEND_IMAGE}:latest" \
        --registry-server "${ACR_NAME}.azurecr.io" \
        --registry-username ${ACR_NAME} \
        --registry-password ${ACR_PASSWORD} \
        --ingress external \
        --target-port 8000 \
        --env-vars DATABASE_URL=${ASYNC_DB_URL} \
        --min-replicas 0 --max-replicas 3 \
        --query "properties.configuration.ingress.fqdn" -o tsv > backend_url.txt

    BACKEND_URL="https://$(cat backend_url.txt)"
    echo "   Backend URL: ${BACKEND_URL}"
    rm backend_url.txt

    # ----------------------------------------
    # 3. Deploy Frontend (First Pass)
    # ----------------------------------------
    print_step "Deploying Frontend..."

    # Create frontend to get its URL (chicken and egg problem solved by update)
    az containerapp create \
        --name "${APP_NAME}-frontend" \
        --resource-group ${RESOURCE_GROUP} \
        --environment ${ACA_ENV_NAME} \
        --image "${FRONTEND_IMAGE}:latest" \
        --registry-server "${ACR_NAME}.azurecr.io" \
        --registry-username ${ACR_NAME} \
        --registry-password ${ACR_PASSWORD} \
        --ingress external \
        --target-port 3000 \
        --env-vars \
            DATABASE_URL=${DATABASE_URL} \
            BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET} \
            GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID} \
            GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET} \
            BACKEND_INTERNAL_URL=${BACKEND_URL} \
        --min-replicas 0 --max-replicas 3 \
        --query "properties.configuration.ingress.fqdn" -o tsv > frontend_url.txt

    FRONTEND_URL="https://$(cat frontend_url.txt)"
    echo "   Frontend URL: ${FRONTEND_URL}"
    rm frontend_url.txt

    # ----------------------------------------
    # 4. Update Frontend Configuration
    # ----------------------------------------
    print_step "Updating Frontend with Public URLs..."
    
    # Now we inject the self-referential URLs
    az containerapp update \
        --name "${APP_NAME}-frontend" \
        --resource-group ${RESOURCE_GROUP} \
        --set-env-vars \
            BETTER_AUTH_URL=${FRONTEND_URL} \
            NEXT_PUBLIC_APP_URL=${FRONTEND_URL}

    print_success "Deployment Complete!"
    echo "   Frontend: ${FRONTEND_URL}"
    echo "   Backend:  ${BACKEND_URL}"
}

# ============================================
# PHASE: MIGRATE (Azure Jobs)
# ============================================
phase_migrate() {
    print_header "Running Database Migrations"

    DB_HOST="${DB_SERVER_NAME}.postgres.database.azure.com"
    # Python URL (Async)
    ASYNC_DB_URL="postgresql+asyncpg://${DB_ADMIN_USER}:${DB_ADMIN_PASSWORD}@${DB_HOST}:5432/${DB_NAME}?ssl=require"
    # Node/Drizzle URL - Enforcing SSL
    DATABASE_URL="postgresql://${DB_ADMIN_USER}:${DB_ADMIN_PASSWORD}@${DB_HOST}:5432/${DB_NAME}?sslmode=require"

    ACR_PASSWORD=$(az acr credential show --name ${ACR_NAME} --query "passwords[0].value" -o tsv)

    print_step "Starting Backend Migration Job (Alembic)..."
    
    # Delete existing job to ensure fresh config
    az containerapp job delete --name "${APP_NAME}-migrate-backend" --resource-group ${RESOURCE_GROUP} --yes --output none 2>/dev/null || true

    echo "   Creating backend migration job..."
    az containerapp job create \
        --name "${APP_NAME}-migrate-backend" \
        --resource-group ${RESOURCE_GROUP} \
        --environment ${ACA_ENV_NAME} \
        --trigger-type Manual \
        --replica-timeout 300 \
        --replica-retry-limit 1 \
        --replica-completion-count 1 \
        --parallelism 1 \
        --image "${BACKEND_IMAGE}:latest" \
        --registry-server "${ACR_NAME}.azurecr.io" \
        --registry-username ${ACR_NAME} \
        --registry-password ${ACR_PASSWORD} \
        --env-vars "DATABASE_URL=${ASYNC_DB_URL}" \
        --cpu 0.5 --memory 1Gi \
        --command "alembic" \
        --args "upgrade" "head" \
        --output none

    az containerapp job start --name "${APP_NAME}-migrate-backend" --resource-group ${RESOURCE_GROUP} --output none
    echo "   Alembic migration job started..."

    print_step "Starting Frontend Migration Job (Drizzle)..."
    
    # Delete existing job to ensure fresh config
    az containerapp job delete --name "${APP_NAME}-migrate-frontend" --resource-group ${RESOURCE_GROUP} --yes --output none 2>/dev/null || true

    echo "   Creating frontend migration job..."
    az containerapp job create \
        --name "${APP_NAME}-migrate-frontend" \
        --resource-group ${RESOURCE_GROUP} \
        --environment ${ACA_ENV_NAME} \
        --trigger-type Manual \
        --replica-timeout 300 \
        --replica-retry-limit 1 \
        --replica-completion-count 1 \
        --parallelism 1 \
        --image "${FRONTEND_IMAGE}:latest" \
        --registry-server "${ACR_NAME}.azurecr.io" \
        --registry-username ${ACR_NAME} \
        --registry-password ${ACR_PASSWORD} \
        --env-vars "DATABASE_URL=${DATABASE_URL}" \
        --cpu 0.5 --memory 1Gi \
        --command "npx" \
        --args "drizzle-kit" "push" \
        --output none

    az containerapp job start --name "${APP_NAME}-migrate-frontend" --resource-group ${RESOURCE_GROUP} --output none
    echo "   Drizzle migration job started..."
    
    print_success "Migrations Triggered. Check Azure Portal for execution status."
}

# ============================================
# MAIN EXECUTION
# ============================================
case "$1" in
    setup) phase_setup ;;
    build) phase_build ;;
    deploy) phase_deploy ;;
    migrate) phase_migrate ;;
    all) 
        phase_setup
        phase_build
        phase_deploy
        phase_migrate
        show_elapsed
        ;;
    *)
        echo "Usage: ./azure_deploy.sh [setup|build|deploy|migrate|all]"
        exit 1
        ;;
esac
