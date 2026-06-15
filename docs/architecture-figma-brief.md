# Architecture Diagram Brief

Use this in `Figma` as your build spec.

If you want an automated first draft, paste the prompt into `Figma Make`, then manually polish the spacing, alignment, and icon sizing so it looks designed instead of auto-generated.

## Recommended tool

- Best-looking option: `Figma`
- Best free fallback: `draw.io / diagrams.net`

## Style direction

Create a polished enterprise architecture diagram for a Microsoft hackathon project called `Caribbean Climate Resilience Orchestrator`.

Visual style:

- Clean white canvas with very light warm-gray background panels
- Microsoft/Azure architecture icon style
- Thin slate connector lines with subtle arrowheads
- Deep navy for application surfaces
- Azure blue for platform services
- Sea-glass teal for data and grounding layers
- Soft coral or amber for outputs and alerts
- Rounded rectangles with consistent spacing
- No sketch effect, no hand-drawn look, no “AI generated” glow effects
- Use a balanced left-to-right flow
- Add a small legend in the lower-right corner

## Diagram structure

Title at top:

- `Caribbean Climate Resilience Orchestrator`
- Subtitle: `Microsoft-native climate risk reasoning and adaptation planning pipeline`

### Column 1: Inputs

Label this section:

- `External Climate and Exposure Inputs`

Include these nodes:

- `NOAA / IBTrACS hurricane history`
- `Sea-level and flood reference layers`
- `Population and GDP baselines`
- `Infrastructure and critical facility inventories`
- `Policy and climate briefing documents`

### Column 2: Data Foundation

Label this section:

- `Data Foundation`

Include these nodes:

- `Azure Blob Storage`
- `Azure AI Search Index`
- `Knowledge Base`
- `Structured regional risk dataset`
- `Live reference refresh scripts`

### Column 3: Reasoning Core

Label this section:

- `Reasoning Core`

Inside a larger highlighted orchestration container, include:

- `Ingestion Agent`
- `Ontology Agent`
- `Risk Assessment Agent`
- `Scenario Agent`
- `Recommendation Agent`
- `Guardrails and audit trace`

Add a header chip on this container:

- `Microsoft Foundry`

### Column 4: Experience Layer

Label this section:

- `Decision Experience`

Include these nodes:

- `Risk Map Dashboard`
- `Regional Explorer`
- `Scenario Builder`
- `Recommendations and Policy Brief`
- `Data and Audit Console`

### Column 5: Delivery and Scale

Label this section:

- `Operational Outputs`

Include these nodes:

- `Ministerial action brief`
- `Exportable recommendation package`
- `Power BI and Fabric path`
- `Regional planning and funding conversations`

## Connection rules

Show these directional flows:

- External inputs into Blob Storage and Azure AI Search
- Blob Storage and Search into Knowledge Base
- Structured regional risk dataset into the Foundry orchestration container
- Knowledge Base into the Foundry orchestration container
- Guardrails and audit trace connected across all agents
- Foundry orchestration into every product page in the Decision Experience column
- Recommendations and policy brief into Operational Outputs
- Data and Audit Console into Operational Outputs with a dotted “trust and governance” path

## Callout badges

Add these small callout chips:

- `Live Azure Maps` near `Risk Map Dashboard`
- `Grounded Search` near `Knowledge Base`
- `Scenario Simulation` near `Scenario Agent`
- `Auditability` near `Data and Audit Console`

## Footer note

Add a small footer note:

- `Current prototype combines live Azure services with a structured regional planning model and a production path into Fabric and Power BI.`
