# Knowledge base seed guide

This folder gives the Foundry knowledge base real climate-planning content instead of an empty blob container.

## What is already created in Azure

- Storage account: `caribclimatestrorage`
- Blob container: `carib-climate-blob`
- Azure AI Search service: `carib-ai-search`
- Search index: `carib-climate-index`

Blob storage was a good choice. You do not need to recreate the knowledge source.

## 1. Generate the seed files

From the project root:

```bash
python scripts/generate_kb_seed.py
```

That creates:

- `docs/knowledge-base/seed/01-regional-risk-baselines.md`
- `docs/knowledge-base/seed/02-intervention-catalog.md`
- `docs/knowledge-base/seed/03-ontology-and-data-sources.md`
- `docs/knowledge-base/seed/04-ministerial-demo-brief.md`
- `docs/knowledge-base/seed/caribbean-climate-seed.json`

Use the Markdown files as the primary knowledge-base content.

## 2. Upload the seed files to blob storage

### WSL or Git Bash

```bash
export AZ_STORAGE_ACCOUNT_KEY="<storage-account-key>"
./scripts/upload-kb-seed.sh
```

### Windows PowerShell

```powershell
$env:AZ_STORAGE_ACCOUNT_KEY = "<storage-account-key>"
.\scripts\upload-kb-seed.ps1
```

## 3. Attach the uploaded files in Foundry

1. Open [Microsoft Foundry](https://ai.azure.com/).
2. Open project `carib-climate-foundry`.
3. Open the knowledge base you already created.
4. Choose Azure Blob Storage as the source.
5. Select storage account `caribclimatestrorage`.
6. Select container `carib-climate-blob`.
7. Use search service `carib-ai-search`.
8. Use index `carib-climate-index`.
9. Run the sync or indexer.

## 4. Put the knowledge base name into `.env`

Set:

```env
FOUNDRY_KNOWLEDGE_BASE_NAME=<the exact knowledge base name shown in Foundry>
```

After that, create the agent with:

```bash
python -m pip install azure-ai-projects azure-identity python-dotenv
python scripts/create_foundry_agent.py --name ccro-risk-agent --model gpt-5.4
```

That writes `FOUNDRY_AGENT_ID` into `.env`.
