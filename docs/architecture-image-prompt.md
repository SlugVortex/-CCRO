# Architecture Image Prompt

Paste this into Gemini, ChatGPT image generation, or another diagram-capable image model.

If the tool supports aspect ratio, use:

- `16:9`
- high resolution
- dark mode or light mode depending on your deck style

## Prompt

Create a polished, presentation-ready cloud architecture diagram for a Microsoft hackathon project called **Caribbean Climate Resilience Orchestrator**.

The diagram must look like a professionally designed enterprise architecture slide, not a sketch and not an AI whiteboard mockup.

### Visual style

- clean enterprise architecture layout
- crisp typography
- Microsoft Azure visual language
- balanced spacing and alignment
- subtle shadows
- thin connector arrows
- rounded rectangles
- deep navy and slate text
- Azure blue for platform services
- sea-glass teal for data and grounding layers
- warm coral or amber for outputs
- white or very light neutral background
- no eraser-style hand-drawn look
- no sticky notes
- no messy wireframe aesthetic
- no watermark

### Title

At the top center:

**Caribbean Climate Resilience Orchestrator**  
*Microsoft-native climate risk reasoning and adaptation planning pipeline*

### Left column: External Inputs

Create a section titled **External Climate and Exposure Inputs** with these nodes:

- NOAA / IBTrACS hurricane history
- Sea-level and flood reference layers
- Population and GDP baselines
- Infrastructure and critical facility inventories
- Policy and climate briefing documents

### Center-left column: Data Foundation

Create a section titled **Data Foundation** with these nodes:

- Azure Blob Storage
- Azure AI Search Index
- Knowledge Base
- Structured regional risk dataset
- Live reference refresh scripts

### Center column: Foundry Orchestration

Create a large highlighted orchestration container titled **Microsoft Foundry Orchestration**.

Inside it place these agent nodes:

- Ingestion Agent
- Ontology Agent
- Risk Assessment Agent
- Scenario Agent
- Recommendation Agent

Attach a smaller supporting node inside or beside the container:

- Guardrails and Audit Trace

### Center-right column: Decision Experience

Create a section titled **Decision Experience** with these product surfaces:

- Risk Map Dashboard
- Regional Explorer
- Scenario Builder
- Recommendations and Policy Brief
- Data and Audit Console

### Right column: Operational Outputs

Create a section titled **Operational Outputs** with these nodes:

- Ministerial action brief
- Exportable recommendation package
- Power BI and Fabric path
- Regional planning and funding conversations

### Connections

Show directional arrows:

- External Inputs flow into Azure Blob Storage and Azure AI Search Index
- Blob Storage and AI Search Index feed the Knowledge Base
- Structured regional risk dataset and Knowledge Base feed the Foundry orchestration container
- Guardrails and Audit Trace connect across all agent steps
- Foundry orchestration connects to all decision experience surfaces
- Recommendations and Policy Brief flow into Operational Outputs
- Data and Audit Console has a dotted governance arrow into Operational Outputs

### Small badges and callouts

Add small, tasteful callout labels:

- Live Azure Maps
- Grounded Search
- Scenario Simulation
- Auditability

### Footer note

At the bottom:

**Prototype combines live Azure services with a structured regional planning model and a production path into Fabric and Power BI.**

### Composition rules

- make the diagram horizontally balanced
- avoid oversized empty areas
- use iconography for Azure services
- keep labels readable
- avoid tiny text
- ensure arrows do not overlap heavily
- make the central Foundry container the visual focus
- ensure the whole design feels premium, investor-ready, and hackathon-finalist quality

## Optional follow-up prompt

If the first result is structurally right but visually ugly, run this next:

`Refine this architecture diagram into a premium Microsoft-style enterprise presentation graphic. Improve spacing, hierarchy, icon sizing, arrow routing, typography, and color balance. Keep all node names and system relationships accurate, but make the result look clean, elegant, and submission-ready.`
