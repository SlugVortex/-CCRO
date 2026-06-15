# Demo Runbook

## Goal

Deliver a clean, believable hackathon demo that shows:

- a real climate planning use case,
- a clear multi-agent reasoning chain,
- meaningful user interaction,
- Microsoft-native architecture,
- and honest grounding / auditability.

## Best demo story

Use **Jamaica, 2050, all three hazards enabled** as the primary demo path.

Why this path works best:

- it is the most visually legible in the current build,
- the risk contrast between parishes is easy to explain,
- the scenario builder has the strongest narrative payoff,
- and the atlas interactions are easier to follow in a short recording.

## Recommended page order

1. `Risk Map Dashboard`
2. `Map Explorer`
3. `Scenario Builder`
4. `Recommendations`
5. `Data & Audit`
6. `README / Architecture Diagram` as the closing frame if needed

## Click-by-click demo path

### 1. Risk Map Dashboard

What to do:

- Open the app on `Risk Map Dashboard`
- Keep `Country` on `Jamaica`
- Keep `Time Horizon` on `2050`
- Keep `Hurricanes`, `Flood`, and `Sea-Level Rise` enabled
- Click `Run Risk Lens`
- Click 2 or 3 hotspot regions in the atlas
- Use the parish dots directly on the map, not only the hotspot chips

What to say:

- the system is identifying where combined climate stress is concentrated
- the atlas lets planners inspect parish-level exposure
- the detail panel shows why a region is risky, not just that it is risky

### 2. Map Explorer

What to do:

- Click `Open Explorer`
- Click 2 or 3 more parish dots
- Click 1 row in the region ranking table

What to say:

- this gives the team a larger inspection surface for live briefings
- it helps compare parishes without leaving the workflow
- it reinforces that the atlas is interactive rather than a static image

### 3. Scenario Builder

What to do:

- Navigate to `Scenario Builder`
- Set a budget around `40M`
- Choose `Minimize people at risk`
- Select 3 to 4 interventions
- Click `Simulate Scenario`

Best intervention mix for the demo:

- `Elevate primary coastal roads by 1m`
- `Reinforce hospital roofs and backup power`
- `Build and retrofit community shelters`
- `Restore mangroves and living shorelines`

What to say:

- this is where the app becomes a planning tool instead of a map
- the user is not just viewing risk, they are testing policy packages under budget pressure
- the system shows how exposure changes after the intervention mix

### 4. Recommendations

What to do:

- Open `Recommendations`
- Pause on the ranked actions
- Scroll slowly through the narrative brief
- Call out the citations / grounding section if visible

What to say:

- the recommendation engine turns a simulation into a decision package
- the output is ready for ministers, agencies, or donor discussions
- the brief is grounded rather than free-form

### 5. Data & Audit

What to do:

- Open `Data & Audit`
- Pause on source freshness
- Pause on ontology / guardrails / agent trace

What to say:

- this is the trust layer
- judges can inspect the reasoning process, not just the output
- it shows that the system is structured like a real operational pipeline

## What not to do in the demo

- Do not improvise multiple countries unless you rehearse them first
- Do not oversell the current parish dataset as fully live national data
- Do not open Azure portals during the main product demo
- Do not spend too long on the map controls
- Do not switch horizons too many times

## Best positioning language

Use language like this:

- `working prototype`
- `Microsoft-native climate planning surface`
- `live Azure-connected grounding and narration`
- `clear production path through Foundry, Search, Fabric, Power BI, and Azure Maps`

Avoid language like this:

- `fully deployed production platform`
- `all data is live from national systems`
- `fully autonomous decision-maker`

## Judge Q&A truth sheet

### Is it real?

Yes, partially.

Real now:

- Azure OpenAI
- Azure AI Search knowledge base
- Azure Maps connectivity
- Foundry project and agent setup
- live reference-data refresh scripts

Still seeded:

- structured regional planning dataset
- risk coefficients and some modeled intervention effects
- full Fabric and Power BI operational integration

### Is it demo ready?

Yes.

### Is it production ready?

Not fully yet.

The strongest honest answer is:

`It is demo ready today, Azure connected today, and designed with a production path rather than being presented as finished government software.`

## Recording guidance

- Browser zoom: `90%` to `100%`
- Keep only one browser tab visible
- Wait half a second after each page transition
- Move the cursor deliberately
- Do one complete clean take before trying fancier cuts

## Next step after recording

Once you record the screen capture, send it back and I can turn it into:

- a line-by-line voice-over script,
- timestamped narration,
- and a pacing guide for AI voice generation and syncing.
