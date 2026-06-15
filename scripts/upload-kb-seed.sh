#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SOURCE_DIR="${KB_SOURCE_DIR:-$ROOT_DIR/docs/knowledge-base/seed}"
STORAGE_ACCOUNT_NAME="${AZ_STORAGE_ACCOUNT_NAME:-caribclimatestrorage}"
CONTAINER_NAME="${AZ_STORAGE_CONTAINER_NAME:-carib-climate-blob}"
ACCOUNT_KEY="${AZ_STORAGE_ACCOUNT_KEY:-}"

read_env_value() {
  local key="$1"
  local env_file="$ROOT_DIR/.env"

  if [[ ! -f "$env_file" ]]; then
    return 0
  fi

  local line
  line="$(grep -m1 "^${key}=" "$env_file" || true)"
  if [[ -z "$line" ]]; then
    return 0
  fi

  printf '%s' "${line#*=}"
}

STORAGE_ACCOUNT_NAME="${AZ_STORAGE_ACCOUNT_NAME:-$(read_env_value AZ_STORAGE_ACCOUNT_NAME)}"
CONTAINER_NAME="${AZ_STORAGE_CONTAINER_NAME:-$(read_env_value AZ_STORAGE_CONTAINER_NAME)}"
ACCOUNT_KEY="${AZ_STORAGE_ACCOUNT_KEY:-$(read_env_value AZ_STORAGE_ACCOUNT_KEY)}"
STORAGE_ACCOUNT_NAME="${STORAGE_ACCOUNT_NAME:-caribclimatestrorage}"
CONTAINER_NAME="${CONTAINER_NAME:-carib-climate-blob}"

if ! command -v az >/dev/null 2>&1; then
  echo "Azure CLI is required. Install it from https://aka.ms/installazurecli"
  exit 1
fi

if [[ "${SKIP_KB_GENERATE:-false}" != "true" ]]; then
  if command -v wslpath >/dev/null 2>&1 && command -v cmd.exe >/dev/null 2>&1; then
    ROOT_DIR_WIN="$(wslpath -w "$ROOT_DIR")"
    cmd.exe /c "cd /d $ROOT_DIR_WIN && py scripts\\generate_kb_seed.py"
  else
    python "$ROOT_DIR/scripts/generate_kb_seed.py"
  fi
fi

if [[ -z "$ACCOUNT_KEY" ]]; then
  echo "Set AZ_STORAGE_ACCOUNT_KEY before running this script."
  exit 1
fi

az storage blob upload-batch \
  --account-name "$STORAGE_ACCOUNT_NAME" \
  --account-key "$ACCOUNT_KEY" \
  --destination "$CONTAINER_NAME" \
  --source "$SOURCE_DIR" \
  --overwrite true

cat <<EOF

Seed documents uploaded.

Next in Foundry:
  1. Open the knowledge base you already created.
  2. Point it at blob container '$CONTAINER_NAME' in storage account '$STORAGE_ACCOUNT_NAME'.
  3. Use or confirm the Azure AI Search index 'carib-climate-index'.
  4. Trigger a sync or re-index.
EOF
