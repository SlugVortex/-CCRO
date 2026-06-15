param(
    [string]$SubscriptionId = "0616016a-7955-457f-aa6c-3efb5240d67b",
    [string]$ResourceGroup = "carib-climate",
    [string]$FoundryResource = "carib-climate-foundry-resource",
    [string]$FoundryProject = "carib-climate-foundry",
    [string]$SearchService = "carib-ai-search",
    [string]$PowerBiAppName = "ccro-powerbi-embed"
)

$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
$SummaryDir = Join-Path $Root ".tmp\azure-bootstrap"
$SummaryPath = Join-Path $SummaryDir "summary.txt"

New-Item -ItemType Directory -Force -Path $SummaryDir | Out-Null

function Write-Section {
    param([string]$Title)
    Add-Content -Path $SummaryPath -Value ""
    Add-Content -Path $SummaryPath -Value ("=" * 68)
    Add-Content -Path $SummaryPath -Value $Title
    Add-Content -Path $SummaryPath -Value ("=" * 68)
}

function Run-Az {
    param(
        [string]$Label,
        [string[]]$Arguments,
        [switch]$AllowFailure
    )

    Write-Section $Label
    Add-Content -Path $SummaryPath -Value ('$ az ' + ($Arguments -join ' '))

    try {
        $output = & az @Arguments 2>&1
        if ($output) {
            $output | Add-Content -Path $SummaryPath
        }
    }
    catch {
        Add-Content -Path $SummaryPath -Value ("FAILED: " + $_.Exception.Message)
        if (-not $AllowFailure) {
            throw
        }
    }
}

if (-not (Get-Command az -ErrorAction SilentlyContinue)) {
    throw "Azure CLI (az) is not available on PATH in this PowerShell session."
}

$pythonCmd = if (Get-Command py -ErrorAction SilentlyContinue) { "py" } elseif (Get-Command python -ErrorAction SilentlyContinue) { "python" } else { $null }
if (-not $pythonCmd) {
    throw "Python launcher not found. Install Python or ensure 'py' or 'python' is on PATH."
}

Set-Content -Path $SummaryPath -Value @(
    "Azure bootstrap summary",
    "Generated: $(Get-Date -Format s)",
    "Workspace: $Root",
    "SubscriptionId: $SubscriptionId",
    "ResourceGroup: $ResourceGroup",
    "FoundryResource: $FoundryResource",
    "FoundryProject: $FoundryProject",
    "SearchService: $SearchService"
)

Run-Az "Azure Account" @("account", "show", "-o", "jsonc")
Run-Az "Set Subscription" @("account", "set", "--subscription", $SubscriptionId)
Run-Az "Foundry Resource" @("cognitiveservices", "account", "show", "--resource-group", $ResourceGroup, "--name", $FoundryResource, "-o", "jsonc") -AllowFailure
Run-Az "Foundry Project" @("cognitiveservices", "account", "project", "show", "--resource-group", $ResourceGroup, "--name", $FoundryResource, "--project-name", $FoundryProject, "-o", "jsonc") -AllowFailure
Run-Az "Foundry Deployments" @("cognitiveservices", "account", "deployment", "list", "--resource-group", $ResourceGroup, "--name", $FoundryResource, "-o", "jsonc") -AllowFailure
Run-Az "Search Service" @("search", "service", "show", "--resource-group", $ResourceGroup, "--name", $SearchService, "-o", "jsonc") -AllowFailure
Run-Az "Maps Accounts" @("resource", "list", "--resource-group", $ResourceGroup, "--resource-type", "Microsoft.Maps/accounts", "-o", "table") -AllowFailure

Write-Section "Power BI App Registration"
try {
    $tenantId = (& az account show --query tenantId -o tsv).Trim()
    $appRaw = & az ad app list --display-name $PowerBiAppName --query "[0].{appId:appId,id:id}" -o json
    $app = if ($appRaw -and $appRaw -ne "null") { $appRaw | ConvertFrom-Json } else { $null }

    if (-not $app) {
        $app = (& az ad app create --display-name $PowerBiAppName --sign-in-audience AzureADMyOrg --query "{appId:appId,id:id}" -o json) | ConvertFrom-Json
        & az ad sp create --id $app.appId | Out-Null
        Add-Content -Path $SummaryPath -Value "Created new Entra app registration."
    }
    else {
        Add-Content -Path $SummaryPath -Value "Reusing existing Entra app registration."
    }

    $secret = (& az ad app credential reset --id $app.appId --append --query "{password:password}" -o json | ConvertFrom-Json).password
    Add-Content -Path $SummaryPath -Value ("POWERBI_TENANT_ID=" + $tenantId)
    Add-Content -Path $SummaryPath -Value ("POWERBI_CLIENT_ID=" + $app.appId)
    Add-Content -Path $SummaryPath -Value ("POWERBI_CLIENT_SECRET=" + $secret)
}
catch {
    Add-Content -Path $SummaryPath -Value ("FAILED: " + $_.Exception.Message)
}

Write-Section "Foundry Agent Creation"
try {
    $agentVenv = Join-Path $Root ".tmp\foundry-agent-venv"
    if (-not (Test-Path $agentVenv)) {
        & $pythonCmd -m venv $agentVenv 2>&1 | Add-Content -Path $SummaryPath
    }
    $venvPython = Join-Path $agentVenv "Scripts\python.exe"
    & $venvPython -m pip install --upgrade pip 2>&1 | Add-Content -Path $SummaryPath
    & $venvPython -m pip install azure-ai-projects azure-identity python-dotenv 2>&1 | Add-Content -Path $SummaryPath
    & $venvPython (Join-Path $PSScriptRoot "create_foundry_agent.py") --name "ccro-risk-agent" --model "gpt-5.4" 2>&1 | Add-Content -Path $SummaryPath
}
catch {
    Add-Content -Path $SummaryPath -Value ("FAILED: " + $_.Exception.Message)
}

Write-Section "Manual Steps Still Required"
Add-Content -Path $SummaryPath -Value "1. Create the Foundry knowledge base / Search connection in the Foundry UI."
Add-Content -Path $SummaryPath -Value "2. Copy FOUNDRY_KNOWLEDGE_BASE_NAME."
Add-Content -Path $SummaryPath -Value "3. Create the Fabric semantic model and copy FABRIC_SEMANTIC_MODEL_ID."
Add-Content -Path $SummaryPath -Value "4. Publish the Power BI report and copy POWERBI_WORKSPACE_ID and POWERBI_REPORT_ID."

Write-Host ""
Write-Host "Bootstrap complete."
Write-Host "Paste this file back into Codex:"
Write-Host "  $SummaryPath"
