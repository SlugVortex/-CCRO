# Azure setup guide for Caribbean Climate Resilience Orchestrator

This guide is written for the exact app in this repository and optimized for a startup-credit hackathon build. The priority order is designed to get you to a compelling demo quickly without wasting credits.

## Current known Azure state

From the subscription inspection already completed for this project:

- Subscription: `0616016a-7955-457f-aa6c-3efb5240d67b`
- Resource group: `carib-climate`
- Microsoft Foundry resource: `carib-climate-foundry-resource`
- Foundry project: `carib-climate-foundry`
- Foundry region: `eastus2`
- Azure OpenAI deployment already in use by the app: `gpt-5.4`
- Azure AI Search endpoint already configured in `.env`: `https://carib-ai-search.search.windows.net`
- Azure Maps account already exists: `carib-climate-maps`
- Blob storage account already exists: `caribclimatestrorage`
- Blob container already exists: `carib-climate-blob`

Use those exact names first before creating anything new.

## Fastest safe path from your WSL terminal

This repo now includes a helper script that reads the existing Azure footprint and writes the live Azure AI and Azure AI Search values into the root `.env` without creating new resources:

```bash
az login
cd /mnt/z/Hackathons/Agentic/Stormy/caribbean-climate-orchestrator
chmod +x scripts/azure-sync-env.sh
./scripts/azure-sync-env.sh
```

The script is intentionally conservative:

- It sets the subscription to `0616016a-7955-457f-aa6c-3efb5240d67b`
- It verifies the existing resource group and Foundry resource
- It syncs Azure OpenAI endpoint and key from `carib-climate-foundry-resource`
- It syncs Azure AI Search endpoint and admin key from `carib-ai-search` when that service exists
- It does not create any paid resources

After it finishes, only the Foundry project and agent IDs, plus Fabric, Power BI, and optional Key Vault values, still need to be filled in manually.

## Recommended deployment order

1. Microsoft Foundry resource, project, model deployment, and agent
2. Azure AI Search knowledge base for climate documents
3. Foundry IQ or Search grounding connection to the knowledge base
4. Fabric workspace, lakehouse or warehouse, semantic model, and Power BI report
5. Optional Key Vault for secret storage

## Important Foundry distinction

Microsoft Foundry has three layers that are easy to blur together:

- `Foundry resource`
  - The Azure AIServices resource in your subscription, such as `carib-climate`
- `Foundry project`
  - The working project inside Foundry, such as `carib-climate-foundry`
- `Foundry agent`
  - The actual agent object inside the project that can be invoked

The app now treats these separately:

- If you only have the project endpoint, Foundry is shown as configured but not yet active
- Foundry becomes fully active only after the agent ID is also present

## Credit-conscious strategy

- Must-have for the first working live demo:
  - Microsoft Foundry
  - Azure AI Search
  - Azure Maps
- Strong Microsoft-story upgrade:
  - Fabric
  - Power BI
- Best practice hardening:
  - Key Vault

## 1. Create the Microsoft Foundry project

Use the official Microsoft Foundry quickstart:

- [Quickstart: Set up Microsoft Foundry resources](https://learn.microsoft.com/en-us/azure/foundry/tutorials/quickstart-create-foundry-resources)

Key details from the current official guide:

- Create a resource group first.
- Create a Foundry resource with `--kind AIServices --sku s0 --allow-project-management`.
- Create a project inside that resource.
- Deploy or verify the `gpt-5.4` model deployment.
- Copy the project endpoint from the project welcome screen.

### For your current setup

You already have the required Foundry-backed AIServices resource:

- Resource group: `carib-climate`
- Resource name: `carib-climate-foundry-resource`
- Region: `eastus2`

Before creating anything else, verify the existing resource and copy its endpoint and keys:

```bash
az account set --subscription 0616016a-7955-457f-aa6c-3efb5240d67b

az cognitiveservices account show \
  --resource-group carib-climate \
  --name carib-climate-foundry-resource \
  --query "{name:name,kind:kind,location:location,endpoint:properties.endpoint}" \
  -o jsonc

az cognitiveservices account keys list \
  --resource-group carib-climate \
  --name carib-climate-foundry-resource \
  -o jsonc
```

If you have not created a Foundry project yet, do that in the portal instead of creating another AIServices account.

### Portal path

1. Go to [Microsoft Foundry](https://ai.azure.com/).
2. Turn on the new Foundry experience if prompted.
3. Create a new project.
4. In `Advanced options`, choose your resource group and region.
5. After the project opens, go to `Models`.
6. Confirm the project is attached to the existing `carib-climate-foundry-resource` resource in `East US 2`.
7. Deploy or verify the `gpt-5.4` deployment.
8. Copy the project endpoint from the welcome screen.

### Put these into `.env`

- `FOUNDRY_PROJECT_ENDPOINT`
- `AZURE_OPENAI_DEPLOYMENT`

### Also collect

- `AZURE_OPENAI_ENDPOINT`
  - Copy the Azure AI service endpoint attached to the deployed model from Azure or the SDK snippet page.
- `AZURE_OPENAI_API_KEY`
  - Copy from the Azure AI service resource keys page.
- `AZURE_OPENAI_API_VERSION`
  - Use the API version shown in the official SDK snippet for your deployed model or chosen client sample.

## 2. Create Azure AI Search and a knowledge base

Use the official docs:

- [Create a Knowledge Base - Azure AI Search](https://learn.microsoft.com/en-us/azure/search/agentic-retrieval-how-to-create-knowledge-base)

What matters for Caribbean Climate Resilience Orchestrator:

- Create an Azure AI Search service.
- Create a knowledge base that stores climate policy reports, adaptation plans, and hazard documents.
- For local testing, key-based auth is acceptable.
- For production, Microsoft recommends managed identity and role-based auth.

### For your current setup

The app is already pointed at:

- Search service endpoint: `https://carib-ai-search.search.windows.net`

Verify the service and pull the admin key:

```bash
az search service show \
  --resource-group carib-climate \
  --name carib-ai-search \
  -o jsonc

az search admin-key show \
  --resource-group carib-climate \
  --service-name carib-ai-search \
  -o jsonc
```

If `az search service list` asks for a resource group, use `--resource-group carib-climate`.

### Suggested first climate documents to upload

The repo now includes a generator that writes seed climate documents straight from the app's working demo data:

```bash
cd /mnt/z/Hackathons/Agentic/Stormy/caribbean-climate-orchestrator
python scripts/generate_kb_seed.py
```

That creates:

- `docs/knowledge-base/seed/01-regional-risk-baselines.md`
- `docs/knowledge-base/seed/02-intervention-catalog.md`
- `docs/knowledge-base/seed/03-ontology-and-data-sources.md`
- `docs/knowledge-base/seed/04-ministerial-demo-brief.md`
- `docs/knowledge-base/seed/caribbean-climate-seed.json`

If you want to push those into the blob container you already created:

```bash
export AZ_STORAGE_ACCOUNT_KEY="<storage-account-key>"
./scripts/upload-kb-seed.sh
```

Or on Windows PowerShell:

```powershell
$env:AZ_STORAGE_ACCOUNT_KEY = "<storage-account-key>"
.\scripts\upload-kb-seed.ps1
```

### Put these into `.env`

- `AZURE_SEARCH_ENDPOINT`
- `AZURE_SEARCH_ADMIN_KEY`
- `FOUNDRY_KNOWLEDGE_BASE_NAME`

## 3. Connect Foundry IQ to the knowledge base

Use the official doc:

- [Connect Agents to Foundry IQ Knowledge Bases](https://learn.microsoft.com/en-us/azure/foundry/agents/how-to/foundry-iq-connect)

Important requirements from the current guide:

- Your Foundry project needs a system-assigned managed identity for Azure AI Search access.
- On the search service, assign:
  - `Search Index Data Reader`
  - `Search Index Data Contributor` only if you want agent-side writes
- The doc explicitly calls out these values:
  - project endpoint
  - search service endpoint
  - knowledge base name
  - project connection name
  - agent name
  - deployed model name

### Minimal portal flow

1. Open the Foundry project.
2. Enable the project's managed identity.
3. In Azure AI Search, grant that identity `Search Index Data Reader`.
4. Point the knowledge base at blob container `carib-climate-blob` in storage account `caribclimatestrorage`.
5. Use or confirm the Search index `carib-climate-index`.
6. Trigger a sync or re-index after the seed files are uploaded.
7. Create or update your agent so it can use that connection.
8. Copy the created agent ID into the environment.

### What you still need from this step

- `FOUNDRY_PROJECT_ENDPOINT`
- `FOUNDRY_AGENT_ID`
- `FOUNDRY_KNOWLEDGE_BASE_NAME`

### Agent helper

If you are already logged into Azure CLI on the same machine, you can create the Foundry agent from the repo:

```bash
python -m pip install azure-ai-projects azure-identity python-dotenv
python scripts/create_foundry_agent.py --name ccro-risk-agent --model gpt-5.4
```

That writes `FOUNDRY_AGENT_ID` back into `.env`.

## 4. Build the Fabric and Power BI layer

Use the official docs:

- [Power BI semantic models in Microsoft Fabric](https://learn.microsoft.com/en-us/fabric/data-warehouse/semantic-models)
- [Tutorial: Embed Power BI content using a sample embed for your customers application](https://learn.microsoft.com/en-us/power-bi/developer/embedded/embed-sample-for-customers)
- [Set up Power BI Embedded](https://learn.microsoft.com/en-us/power-bi/developer/embedded/register-app)

Important current Fabric note:

- Microsoft says default semantic models are no longer created automatically for many Fabric items, so create the semantic model intentionally instead of assuming it appears for free.

### Recommended path for Caribbean Climate Resilience Orchestrator

1. In Fabric, create a workspace.
2. Create a lakehouse or warehouse for your climate tables.
3. Load your curated tables:
   - parishes or regions
   - hospitals
   - shelters
   - road segments
   - flood zones
   - annual scenario outputs
4. Create a semantic model explicitly.
5. Build a report with:
   - risk map
   - top-risk region table
   - intervention ranking
   - baseline vs scenario comparison
6. Publish the report to the workspace.

### For future embedding in the app

Power BI's official embedding docs recommend:

- Registering a Microsoft Entra application
- Using service principal auth for embed-for-your-customers
- Creating a workspace
- Publishing a report
- Collecting `Workspace ID`, `Report ID`, `Client ID`, `Client secret`, and, for some flows, `Tenant ID`

### Put these into `.env`

- `FABRIC_SEMANTIC_MODEL_ID`
- `POWERBI_TENANT_ID`
- `POWERBI_CLIENT_ID`
- `POWERBI_CLIENT_SECRET`
- `POWERBI_WORKSPACE_ID`
- `POWERBI_REPORT_ID`

## 5. Create an Azure Maps account

Use the official docs:

- [Manage your Azure Maps account in the Azure portal](https://learn.microsoft.com/en-us/azure/azure-maps/how-to-manage-account-keys)
- [Authentication with Azure Maps](https://learn.microsoft.com/en-us/azure/azure-maps/azure-maps-authentication)

Key points from the docs:

- Create a `Maps` resource in the Azure portal.
- Azure Maps automatically creates primary and secondary keys.
- Microsoft recommends treating the shared key as sensitive data.

### Portal path

1. Open the Azure portal.
2. Select `Create a resource`.
3. Search for `Maps`.
4. Create the account.
5. Open the authentication or keys page.
6. Copy the primary key.

### Put this into `.env`

- `AZURE_MAPS_KEY`
- `AZURE_MAPS_CLIENT_ID` if you want AAD-backed client auth in the frontend

## 6. Optional: store secrets in Key Vault

This repo currently reads from `.env` for local development. Once the app is deployed, move secrets into Azure Key Vault and inject them into the backend service at runtime.

### Put this into `.env`

- `KEY_VAULT_URI`

## What to send back after Azure setup

Paste these exact values back into the root `.env` file:

| Variable | Required for demo | Where it comes from |
| --- | --- | --- |
| `AZURE_OPENAI_ENDPOINT` | Yes for live AI summary | Azure AI service resource endpoint |
| `AZURE_OPENAI_API_KEY` | Yes for live AI summary | Azure AI service keys page |
| `AZURE_OPENAI_DEPLOYMENT` | Yes for live AI summary | Foundry model deployment name |
| `AZURE_OPENAI_API_VERSION` | Yes for live AI summary | Official SDK sample version |
| `FOUNDRY_PROJECT_ENDPOINT` | Yes for Foundry integration | Foundry project welcome screen |
| `FOUNDRY_AGENT_ID` | Recommended | Foundry agent details |
| `FOUNDRY_KNOWLEDGE_BASE_NAME` | Recommended | Azure AI Search knowledge base name |
| `AZURE_SEARCH_ENDPOINT` | Recommended | Azure AI Search overview page |
| `AZURE_SEARCH_ADMIN_KEY` | Recommended | Azure AI Search keys page |
| `FABRIC_SEMANTIC_MODEL_ID` | Optional in phase 1 | Fabric item details |
| `POWERBI_TENANT_ID` | Optional in phase 1 | Entra app or tenant overview |
| `POWERBI_CLIENT_ID` | Optional in phase 1 | App registration overview |
| `POWERBI_CLIENT_SECRET` | Optional in phase 1 | App registration secret |
| `POWERBI_WORKSPACE_ID` | Optional in phase 1 | Power BI workspace URL |
| `POWERBI_REPORT_ID` | Optional in phase 1 | Power BI report URL |
| `AZURE_MAPS_KEY` | Recommended | Azure Maps authentication page |
| `KEY_VAULT_URI` | Optional | Key Vault overview |

## First local smoke test after filling `.env`

1. Start the backend with `npm run dev:api`.
2. Start the frontend with `npm run dev`.
3. Open the dashboard.
4. Confirm `/api/v1/health` shows `azure_openai_enabled: true` if live model values are present.
5. Run one scenario and confirm the executive summary still renders.
6. Check the top bar badge. It should read `Azure AI connected` when the live values are valid.

## Official sources

- Foundry resources quickstart: [Microsoft Learn](https://learn.microsoft.com/en-us/azure/foundry/tutorials/quickstart-create-foundry-resources)
- Foundry IQ knowledge base connection: [Microsoft Learn](https://learn.microsoft.com/en-us/azure/foundry/agents/how-to/foundry-iq-connect)
- Azure AI Search knowledge bases: [Microsoft Learn](https://learn.microsoft.com/en-us/azure/search/agentic-retrieval-how-to-create-knowledge-base)
- Fabric semantic models: [Microsoft Learn](https://learn.microsoft.com/en-us/fabric/data-warehouse/semantic-models)
- Power BI Embedded setup: [Microsoft Learn](https://learn.microsoft.com/en-us/power-bi/developer/embedded/register-app)
- Power BI embed tutorial: [Microsoft Learn](https://learn.microsoft.com/en-us/power-bi/developer/embedded/embed-sample-for-customers)
- Azure Maps account management: [Microsoft Learn](https://learn.microsoft.com/en-us/azure/azure-maps/how-to-manage-account-keys)
- Azure Maps authentication: [Microsoft Learn](https://learn.microsoft.com/en-us/azure/azure-maps/azure-maps-authentication)
