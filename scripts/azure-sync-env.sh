#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT_DIR/.env}"

SUBSCRIPTION_ID="${AZ_SUBSCRIPTION_ID:-0616016a-7955-457f-aa6c-3efb5240d67b}"
RESOURCE_GROUP="${AZ_RESOURCE_GROUP:-carib-climate}"
AI_RESOURCE_NAME="${AZ_AI_RESOURCE_NAME:-carib-climate-foundry-resource}"
SEARCH_SERVICE_NAME="${AZ_SEARCH_SERVICE_NAME:-carib-ai-search}"
SEARCH_INDEX_NAME="${AZ_SEARCH_INDEX_NAME:-carib-climate-blob-ks-index}"
OPENAI_DEPLOYMENT_NAME="${AZ_OPENAI_DEPLOYMENT_NAME:-gpt-5.4}"
OPENAI_API_VERSION="${AZ_OPENAI_API_VERSION:-2025-04-01-preview}"

require_command() {
  local command_name="$1"
  local install_url="$2"

  if ! command -v "$command_name" >/dev/null 2>&1; then
    echo "Missing required command: $command_name"
    echo "Install it first: $install_url"
    exit 1
  fi
}

ensure_azure_login() {
  if az account show >/dev/null 2>&1; then
    return 0
  fi

  echo "Azure CLI is not logged in."
  echo "Starting device-code login..."
  az login --use-device-code >/dev/null
}

set_env_value() {
  local key="$1"
  local value="$2"
  local escaped_value

  escaped_value="$(printf '%s' "$value" | sed 's/[&|]/\\&/g')"

  if grep -q "^${key}=" "$ENV_FILE"; then
    sed -i "s|^${key}=.*|${key}=${escaped_value}|" "$ENV_FILE"
  else
    printf '%s=%s\n' "$key" "$value" >>"$ENV_FILE"
  fi
}

require_command "az" "https://aka.ms/installazurecli"

if [[ ! -f "$ENV_FILE" ]]; then
  cp "$ROOT_DIR/.env.example" "$ENV_FILE"
fi

ensure_azure_login

az account set --subscription "$SUBSCRIPTION_ID" >/dev/null

if ! az group show --name "$RESOURCE_GROUP" >/dev/null 2>&1; then
  echo "Resource group '$RESOURCE_GROUP' was not found in subscription '$SUBSCRIPTION_ID'."
  exit 1
fi

if ! az cognitiveservices account show \
  --resource-group "$RESOURCE_GROUP" \
  --name "$AI_RESOURCE_NAME" >/dev/null 2>&1; then
  echo "Azure AI Services resource '$AI_RESOURCE_NAME' was not found in resource group '$RESOURCE_GROUP'."
  exit 1
fi

AZURE_OPENAI_ENDPOINT="$(
  az cognitiveservices account show \
    --resource-group "$RESOURCE_GROUP" \
    --name "$AI_RESOURCE_NAME" \
    --query "properties.endpoint" \
    --output tsv
)"

AZURE_OPENAI_API_KEY="$(
  az cognitiveservices account keys list \
    --resource-group "$RESOURCE_GROUP" \
    --name "$AI_RESOURCE_NAME" \
    --query "key1" \
    --output tsv
)"

set_env_value "ENABLE_AZURE_OPENAI" "true"
set_env_value "AZURE_OPENAI_ENDPOINT" "$AZURE_OPENAI_ENDPOINT"
set_env_value "AZURE_OPENAI_API_KEY" "$AZURE_OPENAI_API_KEY"
set_env_value "AZURE_OPENAI_DEPLOYMENT" "$OPENAI_DEPLOYMENT_NAME"
set_env_value "AZURE_OPENAI_API_VERSION" "$OPENAI_API_VERSION"

if az search service show \
  --resource-group "$RESOURCE_GROUP" \
  --name "$SEARCH_SERVICE_NAME" >/dev/null 2>&1; then
  AZURE_SEARCH_ENDPOINT="https://${SEARCH_SERVICE_NAME}.search.windows.net"
  AZURE_SEARCH_ADMIN_KEY="$(
    az search admin-key show \
      --resource-group "$RESOURCE_GROUP" \
      --service-name "$SEARCH_SERVICE_NAME" \
      --query "primaryKey" \
      --output tsv
  )"

  set_env_value "AZURE_SEARCH_ENDPOINT" "$AZURE_SEARCH_ENDPOINT"
  set_env_value "AZURE_SEARCH_ADMIN_KEY" "$AZURE_SEARCH_ADMIN_KEY"
  set_env_value "AZURE_SEARCH_INDEX_NAME" "$SEARCH_INDEX_NAME"
fi

if [[ -n "${FOUNDRY_PROJECT_ENDPOINT_OVERRIDE:-}" ]]; then
  set_env_value "FOUNDRY_PROJECT_ENDPOINT" "$FOUNDRY_PROJECT_ENDPOINT_OVERRIDE"
fi

if [[ -n "${FOUNDRY_API_KEY_OVERRIDE:-}" ]]; then
  set_env_value "FOUNDRY_API_KEY" "$FOUNDRY_API_KEY_OVERRIDE"
fi

if [[ -n "${FOUNDRY_AGENT_ID_OVERRIDE:-}" ]]; then
  set_env_value "FOUNDRY_AGENT_ID" "$FOUNDRY_AGENT_ID_OVERRIDE"
fi

if [[ -n "${FOUNDRY_KNOWLEDGE_BASE_NAME_OVERRIDE:-}" ]]; then
  set_env_value "FOUNDRY_KNOWLEDGE_BASE_NAME" "$FOUNDRY_KNOWLEDGE_BASE_NAME_OVERRIDE"
fi

if [[ -n "${AZ_MAPS_CLIENT_ID:-}" ]]; then
  set_env_value "AZURE_MAPS_CLIENT_ID" "$AZ_MAPS_CLIENT_ID"
  set_env_value "VITE_AZURE_MAPS_CLIENT_ID" "$AZ_MAPS_CLIENT_ID"
fi

if [[ -n "${AZ_MAPS_KEY:-}" ]]; then
  set_env_value "AZURE_MAPS_KEY" "$AZ_MAPS_KEY"
  set_env_value "VITE_AZURE_MAPS_KEY" "$AZ_MAPS_KEY"
fi

cat <<EOF

Azure-backed values synced into:
  $ENV_FILE

Updated automatically:
  - ENABLE_AZURE_OPENAI
  - AZURE_OPENAI_ENDPOINT
  - AZURE_OPENAI_API_KEY
  - AZURE_OPENAI_DEPLOYMENT
  - AZURE_OPENAI_API_VERSION
  - AZURE_SEARCH_ENDPOINT (if the service exists)
  - AZURE_SEARCH_ADMIN_KEY (if the service exists)
  - AZURE_SEARCH_INDEX_NAME (defaults to carib-climate-blob-ks-index unless overridden)
  - FOUNDRY_PROJECT_ENDPOINT (only if passed in as FOUNDRY_PROJECT_ENDPOINT_OVERRIDE)
  - FOUNDRY_API_KEY (only if passed in as FOUNDRY_API_KEY_OVERRIDE)
  - FOUNDRY_AGENT_ID (only if passed in as FOUNDRY_AGENT_ID_OVERRIDE)
  - FOUNDRY_KNOWLEDGE_BASE_NAME (only if passed in as FOUNDRY_KNOWLEDGE_BASE_NAME_OVERRIDE)
  - AZURE_MAPS_CLIENT_ID / VITE_AZURE_MAPS_CLIENT_ID (only if passed in as AZ_MAPS_CLIENT_ID)
  - AZURE_MAPS_KEY / VITE_AZURE_MAPS_KEY (only if passed in as AZ_MAPS_KEY)

Still fill these manually after the portal steps:
  - FABRIC_SEMANTIC_MODEL_ID
  - POWERBI_TENANT_ID
  - POWERBI_CLIENT_ID
  - POWERBI_CLIENT_SECRET
  - POWERBI_WORKSPACE_ID
  - POWERBI_REPORT_ID
  - KEY_VAULT_URI (optional)

Next:
  1. Open https://ai.azure.com and connect the existing 'carib-climate-foundry-resource' project resource.
  2. Create or confirm the Foundry project and copy its project endpoint.
  3. Run the Foundry agent helper and seed the Search-backed knowledge base.
  4. Re-run the backend and check /api/v1/health.
EOF
