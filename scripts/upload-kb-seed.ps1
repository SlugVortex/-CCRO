param(
    [string]$StorageAccountName = "caribclimatestrorage",
    [string]$ContainerName = "carib-climate-blob",
    [string]$AccountKey = $env:AZ_STORAGE_ACCOUNT_KEY,
    [string]$SourceDir = ""
)

$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
if (-not $SourceDir) {
    $SourceDir = Join-Path $Root "docs\knowledge-base\seed"
}

if (-not (Get-Command az -ErrorAction SilentlyContinue)) {
    throw "Azure CLI (az) is not available on PATH."
}

$pythonCmd = if (Get-Command py -ErrorAction SilentlyContinue) { "py" } elseif (Get-Command python -ErrorAction SilentlyContinue) { "python" } else { $null }
if (-not $pythonCmd) {
    throw "Python launcher not found. Install Python or ensure 'py' or 'python' is on PATH."
}

& $pythonCmd (Join-Path $PSScriptRoot "generate_kb_seed.py")

if (-not $AccountKey) {
    throw "Pass -AccountKey or set AZ_STORAGE_ACCOUNT_KEY before running this script."
}

& az storage blob upload-batch `
    --account-name $StorageAccountName `
    --account-key $AccountKey `
    --destination $ContainerName `
    --source $SourceDir `
    --overwrite true

Write-Host ""
Write-Host "Seed documents uploaded."
Write-Host ""
Write-Host "Next in Foundry:"
Write-Host "  1. Open the knowledge base you already created."
Write-Host "  2. Point it at blob container '$ContainerName' in storage account '$StorageAccountName'."
Write-Host "  3. Use or confirm the Azure AI Search index 'carib-climate-index'."
Write-Host "  4. Trigger a sync or re-index."
