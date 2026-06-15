#!/usr/bin/env bash
set -euo pipefail

if ! command -v gh >/dev/null 2>&1; then
  echo "GitHub CLI 'gh' is required. Install it first."
  exit 1
fi

if [[ ! -f .env ]]; then
  echo ".env not found in the project root."
  exit 1
fi

load_dotenv_defaults() {
  while IFS= read -r raw_line || [[ -n "${raw_line}" ]]; do
    line="${raw_line%$'\r'}"

    if [[ -z "${line//[[:space:]]/}" ]]; then
      continue
    fi

    if [[ "${line}" =~ ^[[:space:]]*# ]]; then
      continue
    fi

    if [[ ! "${line}" =~ ^[[:space:]]*[A-Za-z_][A-Za-z0-9_]*= ]]; then
      continue
    fi

    key_part="${line%%=*}"
    value="${line#*=}"
    key="$(printf '%s' "${key_part}" | xargs)"

    if [[ "${value}" =~ ^\".*\"$ || "${value}" =~ ^\'.*\'$ ]]; then
      value="${value:1:-1}"
    fi

    if [[ -z "${!key:-}" ]]; then
      export "${key}=${value}"
    fi
  done < .env
}

load_dotenv_defaults

if [[ -z "${GITHUB_REPOSITORY:-}" ]]; then
  echo "Set GITHUB_REPOSITORY first, for example:"
  echo "export GITHUB_REPOSITORY='your-user/your-repo'"
  exit 1
fi

if [[ -n "${AZURE_CREDENTIALS_FILE:-}" ]]; then
  if [[ ! -f "${AZURE_CREDENTIALS_FILE}" ]]; then
    echo "AZURE_CREDENTIALS_FILE was set, but the file does not exist: ${AZURE_CREDENTIALS_FILE}"
    exit 1
  fi
  AZURE_CREDENTIALS_JSON="$(cat "${AZURE_CREDENTIALS_FILE}")"
elif [[ -z "${AZURE_CREDENTIALS_JSON:-}" ]]; then
  echo "Set AZURE_CREDENTIALS_FILE or AZURE_CREDENTIALS_JSON first using the JSON output from 'az ad sp create-for-rbac --sdk-auth'."
  exit 1
fi

AZURE_RESOURCE_GROUP_VALUE="${AZURE_RESOURCE_GROUP:-carib-climate}"
AZURE_STORAGE_ACCOUNT_VALUE="${AZURE_STORAGE_ACCOUNT:-ccrofrontendstatic}"
AZURE_BACKEND_WEBAPP_NAME_VALUE="${AZURE_BACKEND_WEBAPP_NAME:-ccro-backend-api}"
VITE_API_BASE_URL_VALUE="${VITE_API_BASE_URL:-https://ccro-backend-api.azurewebsites.net/api/v1}"
FRONTEND_URL_VALUE="${FRONTEND_URL:-https://ccrofrontendstatic.z13.web.core.windows.net/}"
CORS_ORIGINS_VALUE="${CORS_ORIGINS_OVERRIDE:-${FRONTEND_URL_VALUE},http://localhost:5173}"

set_secret() {
  local name="$1"
  local value="$2"
  printf '%s' "$value" | gh secret set "$name" --repo "$GITHUB_REPOSITORY"
  echo "Set $name"
}

set_secret_if_present() {
  local name="$1"
  local value="${2:-}"
  if [[ -n "$value" ]]; then
    set_secret "$name" "$value"
  else
    echo "Skipped $name (empty)"
  fi
}

set_secret "AZURE_CREDENTIALS" "${AZURE_CREDENTIALS_JSON}"
set_secret "AZURE_RESOURCE_GROUP" "${AZURE_RESOURCE_GROUP_VALUE}"
set_secret "AZURE_STORAGE_ACCOUNT" "${AZURE_STORAGE_ACCOUNT_VALUE}"
set_secret_if_present "AZURE_STORAGE_ACCOUNT_KEY" "${AZURE_STORAGE_ACCOUNT_KEY:-${AZ_STORAGE_ACCOUNT_KEY:-}}"
set_secret "AZURE_BACKEND_WEBAPP_NAME" "${AZURE_BACKEND_WEBAPP_NAME_VALUE}"
set_secret "VITE_API_BASE_URL" "${VITE_API_BASE_URL_VALUE}"
set_secret "VITE_AZURE_MAPS_KEY" "${VITE_AZURE_MAPS_KEY:-}"
set_secret "VITE_AZURE_MAPS_CLIENT_ID" "${VITE_AZURE_MAPS_CLIENT_ID:-}"
set_secret "CORS_ORIGINS" "${CORS_ORIGINS_VALUE}"

set_secret "ENABLE_AZURE_OPENAI" "${ENABLE_AZURE_OPENAI:-false}"
set_secret_if_present "AZURE_OPENAI_ENDPOINT" "${AZURE_OPENAI_ENDPOINT:-}"
set_secret_if_present "AZURE_OPENAI_API_KEY" "${AZURE_OPENAI_API_KEY:-}"
set_secret_if_present "AZURE_OPENAI_DEPLOYMENT" "${AZURE_OPENAI_DEPLOYMENT:-}"
set_secret_if_present "AZURE_OPENAI_API_VERSION" "${AZURE_OPENAI_API_VERSION:-}"

set_secret_if_present "FOUNDRY_PROJECT_ENDPOINT" "${FOUNDRY_PROJECT_ENDPOINT:-}"
set_secret_if_present "FOUNDRY_API_KEY" "${FOUNDRY_API_KEY:-}"
set_secret_if_present "FOUNDRY_AGENT_ID" "${FOUNDRY_AGENT_ID:-}"
set_secret_if_present "FOUNDRY_KNOWLEDGE_BASE_NAME" "${FOUNDRY_KNOWLEDGE_BASE_NAME:-}"

set_secret_if_present "AZURE_SEARCH_ENDPOINT" "${AZURE_SEARCH_ENDPOINT:-}"
set_secret_if_present "AZURE_SEARCH_ADMIN_KEY" "${AZURE_SEARCH_ADMIN_KEY:-}"
set_secret_if_present "AZURE_SEARCH_INDEX_NAME" "${AZURE_SEARCH_INDEX_NAME:-}"

set_secret_if_present "FABRIC_SEMANTIC_MODEL_ID" "${FABRIC_SEMANTIC_MODEL_ID:-}"

set_secret_if_present "POWERBI_TENANT_ID" "${POWERBI_TENANT_ID:-}"
set_secret_if_present "POWERBI_CLIENT_ID" "${POWERBI_CLIENT_ID:-}"
set_secret_if_present "POWERBI_CLIENT_SECRET" "${POWERBI_CLIENT_SECRET:-}"
set_secret_if_present "POWERBI_WORKSPACE_ID" "${POWERBI_WORKSPACE_ID:-}"
set_secret_if_present "POWERBI_REPORT_ID" "${POWERBI_REPORT_ID:-}"

set_secret_if_present "AZURE_MAPS_CLIENT_ID" "${AZURE_MAPS_CLIENT_ID:-}"
set_secret_if_present "AZURE_MAPS_KEY" "${AZURE_MAPS_KEY:-}"
set_secret_if_present "KEY_VAULT_URI" "${KEY_VAULT_URI:-}"

echo
echo "All GitHub secrets have been pushed to ${GITHUB_REPOSITORY}."
