# Architecture Diagram

GitHub can render the Mermaid block below directly.

If you want an exported SVG later, run:

```bash
npx @mermaid-js/mermaid-cli -i docs/architecture.mmd -o docs/assets/architecture-diagram.svg
```

```mermaid
flowchart LR
  classDef external fill:#0d3b66,stroke:#0d3b66,color:#ffffff,stroke-width:1.5px;
  classDef agents fill:#1f6f8b,stroke:#155266,color:#ffffff,stroke-width:1.5px;
  classDef azure fill:#5b5fc7,stroke:#4c4fb0,color:#ffffff,stroke-width:1.5px;
  classDef app fill:#f07f46,stroke:#cf6631,color:#ffffff,stroke-width:1.5px;
  classDef store fill:#2a9d8f,stroke:#1e7f73,color:#ffffff,stroke-width:1.5px;
  classDef output fill:#d1495b,stroke:#b93a4b,color:#ffffff,stroke-width:1.5px;

  user["Minister / Resilience Team"]:::external

  subgraph external_data["External climate and context data"]
    noaa["NOAA / IBTrACS storm tracks"]:::external
    sea["Sea-level and flood outlooks"]:::external
    wb["World Bank population and GDP"]:::external
    reports["Climate reports, briefs, and policy PDFs"]:::external
  end

  subgraph ingestion_zone["Data intake and knowledge layer"]
    ingest["IngestionAgent"]:::agents
    blob["Blob seed documents"]:::store
    search["Azure AI Search index + knowledge base"]:::azure
    fabric["Fabric semantic model / lakehouse"]:::azure
    ontology["OntologyAgent"]:::agents
  end

  subgraph reasoning_zone["Reasoning workflow"]
    risk["RiskAssessmentAgent"]:::agents
    scenario["ScenarioAgent"]:::agents
    recommend["RecommendationAgent"]:::agents
    foundry["Microsoft Foundry project + model deployment"]:::azure
  end

  subgraph experience_zone["Application experience"]
    ui["React command center UI"]:::app
    api["FastAPI orchestration API"]:::app
    dashboard["Risk Map Dashboard"]:::app
    builder["Scenario Builder"]:::app
    recs["Recommendations + brief"]:::output
    audit["Data & Audit"]:::output
    maps["Azure Maps"]:::azure
    powerbi["Power BI / Fabric analytics"]:::azure
  end

  noaa --> ingest
  sea --> ingest
  wb --> ingest
  reports --> blob
  blob --> search
  ingest --> fabric
  ingest --> search
  fabric --> ontology
  ontology --> risk
  search --> risk
  risk --> scenario
  scenario --> recommend
  foundry --> api
  api --> risk
  api --> scenario
  api --> recommend
  ui --> api
  ui --> dashboard
  ui --> builder
  ui --> recs
  ui --> audit
  dashboard --> maps
  recs --> powerbi
  risk --> dashboard
  scenario --> builder
  recommend --> recs
  risk --> audit
  scenario --> audit
  recommend --> audit
  user --> ui
```

