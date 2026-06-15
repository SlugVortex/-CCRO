#!/usr/bin/env bash

set -u -o pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STAMP="$(date +%Y%m%d-%H%M%S)"
OUT_DIR="${AZ_DISCOVERY_OUT_DIR:-$ROOT_DIR/.tmp/azure-discovery-$STAMP}"
RAW_DIR="$OUT_DIR/raw"
SUMMARY_FILE="$OUT_DIR/summary.txt"

SUBSCRIPTION_ID="${AZ_SUBSCRIPTION_ID:-0616016a-7955-457f-aa6c-3efb5240d67b}"
RESOURCE_GROUP="${AZ_RESOURCE_GROUP:-carib-climate}"
AI_RESOURCE_NAME="${AZ_AI_RESOURCE_NAME:-carib-climate}"
SEARCH_SERVICE_NAME="${AZ_SEARCH_SERVICE_NAME:-carib-ai-search}"

mkdir -p "$RAW_DIR"

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

write_header() {
  cat >"$SUMMARY_FILE" <<EOF
Azure discovery summary
Generated: $(date)
Workspace: $ROOT_DIR
Output folder: $OUT_DIR

Assumptions
- Subscription: $SUBSCRIPTION_ID
- Resource group: $RESOURCE_GROUP
- AI resource: $AI_RESOURCE_NAME
- Search service hint: $SEARCH_SERVICE_NAME

EOF
}

append_section() {
  local title="$1"
  {
    printf '\n'
    printf '============================================================\n'
    printf '%s\n' "$title"
    printf '============================================================\n'
  } >>"$SUMMARY_FILE"
}

run_capture() {
  local name="$1"
  shift

  local stdout_file="$RAW_DIR/${name}.out"
  local stderr_file="$RAW_DIR/${name}.err"

  {
    printf '\n$ '
    printf '%q ' "$@"
    printf '\n'
  } >>"$SUMMARY_FILE"

  if "$@" >"$stdout_file" 2>"$stderr_file"; then
    cat "$stdout_file" >>"$SUMMARY_FILE"
    printf '\n[ok] saved raw output to %s\n' "$stdout_file" >>"$SUMMARY_FILE"
    return 0
  fi

  printf '[failed]\n' >>"$SUMMARY_FILE"
  if [[ -s "$stderr_file" ]]; then
    cat "$stderr_file" >>"$SUMMARY_FILE"
  else
    printf 'Command failed with no stderr output.\n' >>"$SUMMARY_FILE"
  fi
  printf '\n[failed] stderr saved to %s\n' "$stderr_file" >>"$SUMMARY_FILE"
  return 1
}

discover_project_details() {
  local project_name="$1"
  local safe_name

  safe_name="$(printf '%s' "$project_name" | tr ' /:\\' '_' | tr -cd '[:alnum:]_.-')"

  append_section "Foundry Project: $project_name"
  run_capture \
    "foundry_project_${safe_name}_show_json" \
    az cognitiveservices account project show \
    --resource-group "$RESOURCE_GROUP" \
    --name "$AI_RESOURCE_NAME" \
    --project-name "$project_name" \
    -o jsonc

  run_capture \
    "foundry_project_${safe_name}_connections_json" \
    az cognitiveservices account project connection list \
    --resource-group "$RESOURCE_GROUP" \
    --name "$AI_RESOURCE_NAME" \
    --project-name "$project_name" \
    --include-all \
    -o jsonc
}

discover_search_details() {
  local search_name="$1"
  local safe_name

  safe_name="$(printf '%s' "$search_name" | tr ' /:\\' '_' | tr -cd '[:alnum:]_.-')"

  append_section "Azure AI Search: $search_name"
  run_capture \
    "search_${safe_name}_show_json" \
    az search service show \
    --resource-group "$RESOURCE_GROUP" \
    --name "$search_name" \
    -o jsonc

  run_capture \
    "search_${safe_name}_admin_keys_json" \
    az search admin-key show \
    --resource-group "$RESOURCE_GROUP" \
    --service-name "$search_name" \
    -o jsonc
}

discover_maps_details() {
  local maps_name="$1"
  local safe_name

  safe_name="$(printf '%s' "$maps_name" | tr ' /:\\' '_' | tr -cd '[:alnum:]_.-')"

  append_section "Azure Maps: $maps_name"
  run_capture \
    "maps_${safe_name}_show_json" \
    az maps account show \
    --resource-group "$RESOURCE_GROUP" \
    --name "$maps_name" \
    -o jsonc

  run_capture \
    "maps_${safe_name}_keys_json" \
    az maps account keys list \
    --resource-group "$RESOURCE_GROUP" \
    --name "$maps_name" \
    -o jsonc
}

require_command "az" "https://aka.ms/installazurecli"
ensure_azure_login

write_header

append_section "Preflight"
run_capture "az_version" az version
run_capture "account_show" az account show -o jsonc
run_capture "provider_cognitive" az provider show --namespace Microsoft.CognitiveServices --query "{namespace:namespace, registrationState:registrationState}" -o jsonc
run_capture "provider_search" az provider show --namespace Microsoft.Search --query "{namespace:namespace, registrationState:registrationState}" -o jsonc
run_capture "provider_maps" az provider show --namespace Microsoft.Maps --query "{namespace:namespace, registrationState:registrationState}" -o jsonc

append_section "Subscription Target"
run_capture "account_set" az account set --subscription "$SUBSCRIPTION_ID"
run_capture "account_show_after_set" az account show -o jsonc

append_section "Resource Groups"
run_capture "matching_resource_groups_table" az group list --query "[?contains(name, 'carib') || contains(name, 'climate')].{name:name,location:location}" -o table
run_capture "target_resource_group_json" az group show --name "$RESOURCE_GROUP" -o jsonc
run_capture "resource_list_table" az resource list --resource-group "$RESOURCE_GROUP" --query "[].{name:name,type:type,location:location}" -o table

append_section "Azure AI Services / Foundry Account"
run_capture "cog_accounts_table" az cognitiveservices account list --resource-group "$RESOURCE_GROUP" -o table
run_capture "ai_resource_show_json" az cognitiveservices account show --resource-group "$RESOURCE_GROUP" --name "$AI_RESOURCE_NAME" -o jsonc
run_capture "ai_resource_identity_json" az cognitiveservices account identity show --resource-group "$RESOURCE_GROUP" --name "$AI_RESOURCE_NAME" -o jsonc
run_capture "ai_resource_keys_json" az cognitiveservices account keys list --resource-group "$RESOURCE_GROUP" --name "$AI_RESOURCE_NAME" -o jsonc
run_capture "ai_resource_models_json" az cognitiveservices account list-models --resource-group "$RESOURCE_GROUP" --name "$AI_RESOURCE_NAME" -o jsonc
run_capture "ai_resource_deployments_json" az cognitiveservices account deployment list --resource-group "$RESOURCE_GROUP" --name "$AI_RESOURCE_NAME" -o jsonc
run_capture "ai_resource_projects_json" az cognitiveservices account project list --resource-group "$RESOURCE_GROUP" --name "$AI_RESOURCE_NAME" -o jsonc

PROJECT_NAMES="$(
  az cognitiveservices account project list \
    --resource-group "$RESOURCE_GROUP" \
    --name "$AI_RESOURCE_NAME" \
    --query "[].name" \
    -o tsv 2>/dev/null || true
)"

if [[ -n "$PROJECT_NAMES" ]]; then
  while IFS= read -r project_name; do
    [[ -z "$project_name" ]] && continue
    discover_project_details "$project_name"
  done <<<"$PROJECT_NAMES"
else
  append_section "Foundry Projects"
  printf 'No projects were returned by az cognitiveservices account project list.\n' >>"$SUMMARY_FILE"
fi

append_section "Azure AI Search"
run_capture "search_services_table" az search service list --resource-group "$RESOURCE_GROUP" -o table

SEARCH_NAMES="$(
  az search service list \
    --resource-group "$RESOURCE_GROUP" \
    --query "[].name" \
    -o tsv 2>/dev/null || true
)"

if [[ -z "$SEARCH_NAMES" && -n "$SEARCH_SERVICE_NAME" ]]; then
  SEARCH_NAMES="$SEARCH_SERVICE_NAME"
fi

if [[ -n "$SEARCH_NAMES" ]]; then
  while IFS= read -r search_name; do
    [[ -z "$search_name" ]] && continue
    discover_search_details "$search_name"
  done <<<"$SEARCH_NAMES"
else
  printf 'No Azure AI Search services were found in %s.\n' "$RESOURCE_GROUP" >>"$SUMMARY_FILE"
fi

append_section "Azure Maps"
run_capture "maps_accounts_table" az maps account list --resource-group "$RESOURCE_GROUP" -o table

MAPS_NAMES="$(
  az maps account list \
    --resource-group "$RESOURCE_GROUP" \
    --query "[].name" \
    -o tsv 2>/dev/null || true
)"

if [[ -n "$MAPS_NAMES" ]]; then
  while IFS= read -r maps_name; do
    [[ -z "$maps_name" ]] && continue
    discover_maps_details "$maps_name"
  done <<<"$MAPS_NAMES"
else
  printf 'No Azure Maps accounts were found in %s.\n' "$RESOURCE_GROUP" >>"$SUMMARY_FILE"
fi

append_section "Next Step"
cat >>"$SUMMARY_FILE" <<EOF
Paste this file back into Codex first:
  $SUMMARY_FILE

If I need deeper inspection after that, I may ask for one or two specific raw files from:
  $RAW_DIR

This discovery intentionally includes secrets in some raw outputs:
- ai_resource_keys_json
- search_*_admin_keys_json
- maps_*_keys_json

Only paste those raw files if I explicitly ask for them.
EOF

cat <<EOF
Azure discovery complete.

Summary to paste back:
  $SUMMARY_FILE

Raw outputs:
  $RAW_DIR
EOF
