#!/bin/bash

# ===================================================================
#   PINNACLE SIEM — Deploy Log Generator to Azure Container Instance
# -------------------------------------------------------------------
#   Prerequisites:
#   - az login completed
#   - ngrok running and URL known
#   - Azure Student subscription active
# ===================================================================

set -e

# ============================================
# CONFIGURATION
# ============================================
RESOURCE_GROUP="rg-pinnacle-logsim"
LOCATION="centralindia"          # Close to India for lower latency
ACR_NAME="pinnaclelogsim"        # Must be globally unique, alphanumeric
CONTAINER_NAME="pinnacle-log-generator"
IMAGE_NAME="log-generator"

# These will be prompted if not set
SIEM_URL="${SIEM_URL:-}"
INGEST_API_KEY="${INGEST_API_KEY:-siem_ingest_key_change_me_in_production}"
LOG_COUNT="${LOG_COUNT:-5}"
LOG_INTERVAL="${LOG_INTERVAL:-10}"

# ============================================
# COLORS
# ============================================
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

print_step() { echo -e "\n${BLUE}==>${NC} ${GREEN}$1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_success() { echo -e "${GREEN}✅ $1${NC}"; }

# ============================================
# VALIDATE INPUTS
# ============================================
if [ -z "$SIEM_URL" ]; then
    echo ""
    echo "Enter your ngrok HTTPS URL (e.g. https://abc123.ngrok-free.app):"
    read -r NGROK_URL
    SIEM_URL="${NGROK_URL}/api/py"
    echo ""
fi

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║  Pinnacle SIEM — Log Generator Deployment    ║"
echo "╠══════════════════════════════════════════════╣"
echo "║  Target URL : ${SIEM_URL}"
echo "║  API Key    : ${INGEST_API_KEY:0:8}..."
echo "║  Batch Size : ${LOG_COUNT} logs/provider"
echo "║  Interval   : ${LOG_INTERVAL}s"
echo "║  Region     : ${LOCATION}"
echo "╚══════════════════════════════════════════════╝"
echo ""

# ============================================
# STEP 1: Create Resource Group
# ============================================
print_step "Creating Resource Group: ${RESOURCE_GROUP}"
az group create --name ${RESOURCE_GROUP} --location ${LOCATION} --output none

# ============================================
# STEP 2: Create Container Registry (if needed)
# ============================================
print_step "Ensuring Container Registry: ${ACR_NAME}"
if ! az acr show --name ${ACR_NAME} --resource-group ${RESOURCE_GROUP} &>/dev/null; then
    az acr create \
        --resource-group ${RESOURCE_GROUP} \
        --name ${ACR_NAME} \
        --sku Basic \
        --admin-enabled true \
        --output none
    print_success "ACR created"
else
    echo "   ACR already exists, skipping."
fi

# ============================================
# STEP 3: Build & Push Image
# ============================================
print_step "Logging into ACR..."
az acr login --name ${ACR_NAME}

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

print_step "Building log generator image..."
docker build \
    --platform linux/amd64 \
    -t "${ACR_NAME}.azurecr.io/${IMAGE_NAME}:latest" \
    -f "${SCRIPT_DIR}/Dockerfile.loggenerator" \
    "${SCRIPT_DIR}"

print_step "Pushing to ACR..."
docker push "${ACR_NAME}.azurecr.io/${IMAGE_NAME}:latest"

# ============================================
# STEP 4: Deploy Container Instance
# ============================================
print_step "Deploying Azure Container Instance..."

# Get ACR credentials
ACR_PASSWORD=$(az acr credential show --name ${ACR_NAME} --query "passwords[0].value" -o tsv)

# Delete existing container if it exists
az container delete \
    --resource-group ${RESOURCE_GROUP} \
    --name ${CONTAINER_NAME} \
    --yes --output none 2>/dev/null || true

az container create \
    --resource-group ${RESOURCE_GROUP} \
    --name ${CONTAINER_NAME} \
    --image "${ACR_NAME}.azurecr.io/${IMAGE_NAME}:latest" \
    --registry-login-server "${ACR_NAME}.azurecr.io" \
    --registry-username ${ACR_NAME} \
    --registry-password ${ACR_PASSWORD} \
    --cpu 0.5 \
    --memory 0.5 \
    --os-type Linux \
    --restart-policy Always \
    --environment-variables \
        SIEM_URL="${SIEM_URL}" \
        INGEST_API_KEY="${INGEST_API_KEY}" \
    --command-line "python -u generate_logs.py --url ${SIEM_URL} --api-key ${INGEST_API_KEY} --count ${LOG_COUNT} --interval ${LOG_INTERVAL}" \
    --output none

# ============================================
# STEP 5: Verify
# ============================================
print_step "Checking container status..."
sleep 5
STATE=$(az container show \
    --resource-group ${RESOURCE_GROUP} \
    --name ${CONTAINER_NAME} \
    --query "instanceView.state" -o tsv 2>/dev/null || echo "Unknown")

echo "   Container State: ${STATE}"

print_step "Fetching recent logs..."
az container logs \
    --resource-group ${RESOURCE_GROUP} \
    --name ${CONTAINER_NAME} \
    --tail 20 2>/dev/null || echo "   (Logs not yet available, container may still be starting)"

echo ""
print_success "Log Generator Deployed! 🚀"
echo ""
echo "  Useful commands:"
echo "    View logs:   az container logs -g ${RESOURCE_GROUP} -n ${CONTAINER_NAME} --follow"
echo "    Stop:        az container stop -g ${RESOURCE_GROUP} -n ${CONTAINER_NAME}"
echo "    Restart:     az container restart -g ${RESOURCE_GROUP} -n ${CONTAINER_NAME}"
echo "    Delete all:  az group delete -g ${RESOURCE_GROUP} --yes --no-wait"
echo ""
