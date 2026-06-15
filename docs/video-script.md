# Demo Video Script

This is the main file to keep open while you record the demo.

Use this with the companion runbook at:

- `Z:\Hackathons\Agentic\Stormy\caribbean-climate-orchestrator\docs\demo-runbook.md`

## Recommended length

- Best polished version: `4 to 5 minutes`
- Extended judge-safe version: `6 to 8 minutes`

## Best recording path

Record in this order:

1. `Risk Map Dashboard`
2. `Open Explorer`
3. `Scenario Builder`
4. `Recommendations`
5. `Data & Audit`
6. `README / architecture` close

Keep the main story on:

- `Country`: `Jamaica`
- `Time Horizon`: `2050`
- `Hazards`: `Hurricanes`, `Flood`, `Sea-Level Rise`

## 5-minute script

### 0:00 - 0:25

Screen:

- Open on `Risk Map Dashboard`
- Pause for two seconds with the dashboard fully loaded

Voice:

`Caribbean Climate Resilience Orchestrator is a Microsoft-native climate planning workspace designed for resilience ministries, disaster agencies, and infrastructure teams. Instead of looking at climate risk as disconnected reports, it lets teams see where risk is concentrated, test adaptation packages, and turn the result into a decision brief.`

### 0:25 - 1:05

Screen:

- Point to the planning lens panel
- Leave `Jamaica`, `2050`, and all three hazards selected
- Click `Run Risk Lens`

Voice:

`The first step is the planning lens. The user chooses the geography, the horizon, and the hazard mix. In this case we are looking at Jamaica in 2050 across hurricanes, flood pressure, and sea-level rise. When we run the risk lens, the system refreshes the regional atlas and ranks the parishes with the highest combined climate stress.`

### 1:05 - 1:45

Screen:

- Click several atlas dots directly on the map
- Let one active parish stay selected
- Pause on the detail panel

Voice:

`The atlas is interactive. Each parish hotspot can be selected directly from the map. As we move across the dots, the detail panel updates with the current risk score, estimated people at risk, facilities at risk, annual loss, and the main drivers behind that score. This makes the output explainable. It does not just say which region is under pressure, it shows why.`

### 1:45 - 2:20

Screen:

- Click `Open Explorer`
- In explorer, click 2 or 3 more dots or use the region ranking table

Voice:

`For deeper inspection, the explorer opens a larger operational view. Here, the planner can compare regions, inspect component scores, and walk through the ranking table. This is useful in a live briefing because it lets the user move from a national summary into parish-level review without leaving the planning workflow.`

### 2:20 - 3:15

Screen:

- Go to `Scenario Builder`
- Keep the demo scenario name
- Set or leave a budget around `40M` to `45M`
- Select `Minimize people at risk`
- Choose a credible package such as roads, hospitals, shelters, mangroves
- Click `Simulate Scenario`

Voice:

`The next step is moving from diagnosis to action. In the scenario builder, the planner assembles an adaptation package under a real budget ceiling. Here we can choose interventions such as elevating coastal roads, hardening hospitals, expanding shelters, and restoring natural buffers like mangroves. Once the package is simulated, the model estimates how much risk is reduced and which regions benefit most.`

### 3:15 - 4:00

Screen:

- Pause on the scenario impact results
- Open `Recommendations`
- Scroll slowly through the ranked actions and narrative brief

Voice:

`After the scenario is modeled, the orchestrator converts the output into a prioritized action plan. The recommendations page ranks the highest-leverage interventions, explains the rationale, and generates a brief that can be used in policy review, donor engagement, or cabinet preparation. This is where the system becomes a planning assistant rather than a passive dashboard.`

### 4:00 - 4:35

Screen:

- Open `Data & Audit`
- Pause on source status, grounding, agent trace, or guardrails

Voice:

`The final layer is auditability. Judges and stakeholders can inspect the source status, grounding path, reasoning trace, and governance-oriented metadata. That matters because climate planning needs trust, not just visuals. The system is designed so users can inspect how conclusions were formed.`

### 4:35 - 5:00

Screen:

- End on README architecture section or architecture diagram

Voice:

`This prototype is built around Azure OpenAI, Azure AI Search, Azure Maps, and Microsoft Foundry, with a clear path into Fabric and Power BI. The goal is simple: help Caribbean planners identify where climate shocks hit hardest and decide what to do next before the next storm arrives.`

## 7-minute extended version

Use the 5-minute script above, then add these expansions:

- Spend an extra `30 to 45 seconds` in the explorer comparing 2 high-risk parishes and 1 lower-risk parish.
- Spend an extra `45 seconds` in Scenario Builder explaining why a budget tradeoff matters.
- Spend an extra `30 to 45 seconds` in Recommendations reading one concrete action recommendation.
- Spend an extra `30 seconds` in Data & Audit explaining grounded knowledge sources and Azure-connected components.

## On-screen move list

If you want a pure click checklist while recording, use this:

1. Open `http://localhost:5173/dashboard`
2. Wait for the atlas to load
3. Click `Run Risk Lens`
4. Click `Kingston`
5. Click `St. Catherine`
6. Click `Portland`
7. Click `Open Explorer`
8. In explorer, click one atlas dot and one row in `Region Ranking`
9. Go to `Scenario Builder`
10. Set budget near `44M`
11. Keep `Minimize people at risk`
12. Select 3 to 4 interventions
13. Click `Simulate Scenario`
14. Go to `Recommendations`
15. Scroll the brief slowly
16. Go to `Data & Audit`
17. End on the README architecture section

## Pacing notes

- Wait half a second after every page switch
- Keep the cursor steady and intentional
- Do not rush the explorer page
- Keep the narration calm and declarative
- If a screen needs time to load, stay silent for that beat and resume after it stabilizes

## Truthful positioning

Use these phrases:

- `working prototype`
- `Azure-connected reasoning workflow`
- `grounded climate planning surface`
- `production-minded architecture`

Avoid these phrases:

- `fully deployed national system`
- `perfect real-time government data integration`
- `fully autonomous planner`

## After recording

Once you capture the screen video, send it back and it can be converted into:

- timestamped narration,
- tighter voice pacing,
- sentence-by-sentence TTS chunks,
- and a final sync-ready script.
