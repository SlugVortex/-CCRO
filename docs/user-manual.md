# Caribbean Climate Resilience Orchestrator User Manual

## 1. What this app does

Caribbean Climate Resilience Orchestrator helps resilience teams answer four questions:

1. Which parishes or regions are most exposed to climate shocks?
2. How does the risk change by time horizon?
3. Which interventions reduce that risk most under a fixed budget?
4. What short narrative brief can a minister, planner, or judge read quickly?

The app combines:

- a React operations dashboard,
- a FastAPI reasoning backend,
- Azure OpenAI narration,
- Azure AI Search grounding,
- a Foundry project and agent configuration,
- and a live-or-fallback regional map surface.

## 2. Main pages

### Risk Map

Use this page to:

- select a country,
- choose a planning horizon,
- toggle hazard types,
- run the risk lens,
- inspect the atlas,
- and identify the highest-risk regions.

### Scenario Builder

Use this page to:

- set a scenario name,
- adjust the budget,
- choose an optimization goal,
- pick adaptation actions,
- and simulate a ministerial package.

### Recommendations

Use this page to:

- review ranked actions,
- compare baseline vs scenario outcomes,
- read the executive summary,
- inspect the grounding citations,
- and export a brief or CSV.

### Data & Audit

Use this page to:

- inspect source freshness,
- review ontology concepts,
- understand the guardrails,
- and explain the agent chain during the demo.

## 3. How to run it

### Backend

```bash
cd /mnt/z/Hackathons/Agentic/Stormy/caribbean-climate-orchestrator
python -m uvicorn backend.app.main:app --reload --port 8000
```

### Frontend

Open a second terminal:

```bash
cd /mnt/z/Hackathons/Agentic/Stormy/caribbean-climate-orchestrator
npm run dev
```

Then open:

- `http://localhost:5173`

## 4. Quick health check

Run:

```bash
curl http://127.0.0.1:8000/api/v1/health
```

Healthy demo status should show:

- `azure_openai.active = true`
- `azure_search.active = true`
- `foundry.active = true`
- `azure_maps.active = true`

Fabric and Power BI can still be `false` until those pieces are finished.

## 5. Demo workflow

### Workflow A: Baseline 2050 Jamaica

1. Open `Risk Map`.
2. Set `Country` to `Jamaica`.
3. Set `Time Horizon` to `2050`.
4. Leave all three hazards enabled.
5. Click `Run Risk Lens`.
6. Read the top metrics.
7. Hover or click regions in the atlas.
8. Call out the right-side risk details and the hotspot table.

Use this talking point:

`The system identifies which parishes are most stressed by combined hurricane, flood, and sea-level pressure by 2050, then surfaces the drivers and losses behind that score.`

### Workflow B: Budget-constrained adaptation package

1. Open `Scenario Builder`.
2. Keep the demo country and horizon.
3. Set the budget to a mid-range value such as `40M`.
4. Choose `Minimize people at risk`.
5. Select actions such as:
   - `Reinforce hospital roofs and backup power`
   - `Build and retrofit community shelters`
   - `Elevate primary coastal roads by 1m`
6. Click `Simulate Scenario`.
7. Open `Recommendations`.
8. Review the ranked actions and the modeled reduction.

Use this talking point:

`Instead of a generic answer, the app turns the budget into a ranked package and shows which interventions protect the most people for the available spend.`

### Workflow C: Grounding and explainability

1. Run a dashboard or scenario.
2. Open `Recommendations`.
3. Switch to the `Grounding` tab.
4. Open the cited documents.

Use this talking point:

`The narrative is grounded in the Azure AI Search knowledge base and falls back to trusted demo citations if live retrieval misses.`

## 6. Example tests to run

### UI tests

- Change the country from `Jamaica` to `Barbados` and confirm the metrics and region list change.
- Switch the horizon from `2035` to `2050` and confirm the risk profile increases or shifts.
- Turn off `Sea-Level Rise` and re-run the lens to compare the deltas.
- Select different intervention combinations and confirm the scenario metrics change.
- Toggle dark mode and confirm the page restyles correctly.

### API tests

Metadata:

```bash
curl http://127.0.0.1:8000/api/v1/metadata
```

Dashboard:

```bash
curl "http://127.0.0.1:8000/api/v1/dashboard?country=JM&horizon=2050&hazards=hurricane,flood,sea_level"
```

Scenario:

```bash
curl -X POST http://127.0.0.1:8000/api/v1/scenarios/evaluate \
  -H "Content-Type: application/json" \
  -d '{
    "scenario_name": "Ministerial coastal defense package",
    "country_code": "JM",
    "horizon_year": 2035,
    "hazards": ["hurricane", "flood", "sea_level"],
    "budget_musd": 40,
    "goal": "people",
    "selected_intervention_ids": [
      "reinforce-hospitals",
      "expand-shelters",
      "elevate-coastal-roads"
    ]
  }'
```

### Regression tests

```bash
python -m unittest discover -s backend/tests
node ./node_modules/typescript/bin/tsc -b
```

## 7. Knowledge-base refresh

If you update the climate grounding documents:

```bash
cd /mnt/z/Hackathons/Agentic/Stormy/caribbean-climate-orchestrator
python scripts/fetch_live_reference_data.py
python scripts/generate_kb_seed.py
powershell.exe -ExecutionPolicy Bypass -File .\\scripts\\upload-kb-seed.ps1
python scripts/run_search_indexer.py --reset
```

If WSL cannot overwrite files on `/mnt/z`, run the write steps through Windows from the same WSL shell:

```bash
cmd.exe /c "cd /d Z:\\Hackathons\\Agentic\\Stormy\\caribbean-climate-orchestrator && py scripts\\fetch_live_reference_data.py"
cmd.exe /c "cd /d Z:\\Hackathons\\Agentic\\Stormy\\caribbean-climate-orchestrator && py scripts\\generate_kb_seed.py"
powershell.exe -ExecutionPolicy Bypass -File Z:\\Hackathons\\Agentic\\Stormy\\caribbean-climate-orchestrator\\scripts\\upload-kb-seed.ps1
cmd.exe /c "cd /d Z:\\Hackathons\\Agentic\\Stormy\\caribbean-climate-orchestrator && py scripts\\run_search_indexer.py --reset"
```

## 8. Fabric and Power BI completion steps

### Export seed data

Run:

```bash
cd /mnt/z/Hackathons/Agentic/Stormy/caribbean-climate-orchestrator
python scripts/export_bi_seed.py
```

This generates:

- `docs/bi-seed/regional_risk_baselines.csv`
- `docs/bi-seed/intervention_catalog.csv`
- `docs/bi-seed/data_sources.csv`
- `docs/bi-seed/scenario_comparison.csv`

### Fabric

Use the generated CSV files to populate a Fabric Lakehouse or Warehouse.

What to do:

1. Open Fabric.
2. Create or open a workspace.
3. Create a Lakehouse.
4. Upload the CSV files from `docs/bi-seed/`.
5. Build a semantic model over the risk and scenario tables.
6. Copy the semantic model ID into `.env` as `FABRIC_SEMANTIC_MODEL_ID`.

### Power BI

Use the same CSV files in Power BI Desktop.

What to do:

1. Open Power BI Desktop.
2. Import the CSV files from `docs/bi-seed/`.
3. Build:
   - a map visual by region,
   - a ranked table of high-risk regions,
   - a bar chart of intervention costs,
   - a before-vs-after scenario comparison visual.
4. Publish the report to your workspace.
5. Copy:
   - workspace ID,
   - report ID,
   - client ID,
   - client secret,
   - and tenant ID
   into `.env`.

## 9. Azure Maps troubleshooting

If the live map falls back to SVG:

1. Restart the frontend dev server:

```bash
cd /mnt/z/Hackathons/Agentic/Stormy/caribbean-climate-orchestrator
npm run dev
```

2. Hard refresh the browser with `Ctrl+Shift+R`.
3. Confirm `VITE_AZURE_MAPS_KEY` exists in `.env`.
4. Confirm the health endpoint still reports `azure_maps.active = true`.

## 10. Known current limits

- Foundry is configured, but the app still uses a local orchestrator instead of a fully hosted Foundry workflow for every reasoning step.
- Power BI embed is not live until you publish the report and add the IDs and credentials.
- Fabric semantic querying is not live until you create the semantic model and add its ID.
- The map can still fall back to the embedded atlas if the browser or SDK initialization fails in dev mode.
