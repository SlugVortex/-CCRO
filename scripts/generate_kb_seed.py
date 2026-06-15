from __future__ import annotations

import json
import sys
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.app.data.demo_data import CITATIONS, COUNTRY_DATA, DATA_SOURCES, DEMO_SCENARIO, INTERVENTIONS, ONTOLOGY


OUTPUT_DIR = PROJECT_ROOT / "docs" / "knowledge-base" / "seed"
LIVE_DATA_DIR = PROJECT_ROOT / "data" / "live"


def write_file(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    try:
        path.write_text(content.strip() + "\n", encoding="utf-8")
    except PermissionError as exc:
        raise SystemExit(
            f"Permission denied writing {path}.\n"
            "If you are running from WSL on /mnt/z, re-run this script from Windows Python or use cmd.exe /c py ..."
        ) from exc


def generate_country_brief() -> str:
    sections = [
        "# Caribbean Climate Regional Risk Baselines",
        "",
        "This briefing package summarizes the demo planning baselines used by Caribbean Climate Resilience Orchestrator.",
        "It is intended to ground a Foundry knowledge base with region-level risk, exposure, and adaptation context.",
        "",
    ]

    for country in COUNTRY_DATA.values():
        sections.extend(
            [
                f"## {country['name']}",
                "",
                str(country["subheading"]),
                "",
            ]
        )

        for region in country["regions"]:
            sections.extend(
                [
                    f"### {region['name']}",
                    "",
                    f"- Population: {region['population']:,}",
                    f"- Poverty index: {region['poverty_index']:.2f}",
                    f"- Density index: {region['density_index']:.2f}",
                    f"- Tourism dependency: {region['tourism_dependency']:.2f}",
                    f"- Hurricane exposure: {region['hurricane_exposure']}",
                    f"- Flood exposure: {region['flood_exposure']}",
                    f"- Sea-level exposure: {region['sea_level_exposure']}",
                    f"- Hospital exposure: {region['hospital_exposure']}",
                    f"- Road exposure: {region['road_exposure']}",
                    f"- Critical facilities: {region['critical_facilities']}",
                    f"- Hospital count: {region['hospital_count']}",
                    f"- Shelter count: {region['shelter_count']}",
                    f"- Estimated annual loss: ${region['annual_loss_musd']:.1f}M",
                    f"- Planning tags: {', '.join(region['tags'])}",
                    "",
                ]
            )

    return "\n".join(sections)


def generate_intervention_catalog() -> str:
    lines = [
        "# Adaptation Intervention Catalog",
        "",
        "These interventions are the candidate actions the orchestration layer uses during scenario simulation.",
        "",
    ]

    for item in INTERVENTIONS:
        impact = ", ".join(f"{key} {value:.2f}" for key, value in item["impact"].items())
        lines.extend(
            [
                f"## {item['title']}",
                "",
                f"- Intervention ID: {item['id']}",
                f"- Cost: ${item['cost_musd']:.1f}M",
                f"- Description: {item['description']}",
                f"- Applicable tags: {', '.join(item['applicable_tags'])}",
                f"- Benefit tags: {', '.join(item['benefit_tags'])}",
                f"- Modeled impact coefficients: {impact}",
                "",
            ]
        )

    return "\n".join(lines)


def generate_ontology_and_sources() -> str:
    lines = [
        "# Data Sources And Climate Planning Ontology",
        "",
        "The project combines structured exposure data, adaptation planning logic, and document grounding.",
        "",
        "## Data sources",
        "",
    ]

    for item in DATA_SOURCES:
        lines.extend(
            [
                f"### {item['name']}",
                "",
                f"- Type: {item['type']}",
                f"- Last updated: {item['last_updated']}",
                f"- Status: {item['status']}",
                "",
            ]
        )

    lines.extend(
        [
            "## Ontology",
            "",
            "### Entities",
            "",
            *[f"- {entity}" for entity in ONTOLOGY["entities"]],
            "",
            "### Relationships",
            "",
            *[f"- {relationship}" for relationship in ONTOLOGY["relationships"]],
            "",
            "### Semantic measures",
            "",
            *[f"- {measure}" for measure in ONTOLOGY["semantic_measures"]],
            "",
        ]
    )

    return "\n".join(lines)


def generate_demo_brief() -> str:
    selected = [item for item in INTERVENTIONS if item["id"] in DEMO_SCENARIO["selected_intervention_ids"]]
    lines = [
        "# Ministerial Demo Scenario Brief",
        "",
        "This is the baseline scenario used in the live demo flow.",
        "",
        f"- Scenario name: {DEMO_SCENARIO['scenario_name']}",
        f"- Country code: {DEMO_SCENARIO['country_code']}",
        f"- Horizon year: {DEMO_SCENARIO['horizon_year']}",
        f"- Hazard set: {', '.join(DEMO_SCENARIO['hazards'])}",
        f"- Budget: ${DEMO_SCENARIO['budget_musd']:.1f}M",
        f"- Optimization goal: {DEMO_SCENARIO['goal']}",
        "",
        "## Selected interventions",
        "",
    ]

    for item in selected:
        lines.extend(
            [
                f"### {item['title']}",
                "",
                f"- Cost: ${item['cost_musd']:.1f}M",
                f"- Why it matters: {item['description']}",
                f"- Benefit tags: {', '.join(item['benefit_tags'])}",
                "",
            ]
        )

    lines.extend(
        [
            "## Reference citations",
            "",
            *[f"- {item['label']}: {item['summary']} ({item['source_url']})" for item in CITATIONS],
            "",
        ]
    )

    return "\n".join(lines)


def generate_json_seed() -> str:
    payload = {
        "countries": COUNTRY_DATA,
        "interventions": INTERVENTIONS,
        "data_sources": DATA_SOURCES,
        "ontology": ONTOLOGY,
        "citations": CITATIONS,
        "demo_scenario": DEMO_SCENARIO,
    }
    return json.dumps(payload, indent=2)


def generate_live_reference_brief() -> str:
    lines = [
        "# Live Reference Data Snapshot",
        "",
        "This document supplements the demo planning package with live external reference data fetched from official sources.",
        "",
    ]

    population_path = LIVE_DATA_DIR / "world_bank_population_latest.json"
    gdp_path = LIVE_DATA_DIR / "world_bank_gdp_latest.json"
    storms_path = LIVE_DATA_DIR / "ibtracs_country_summary.json"

    if population_path.exists():
        population = json.loads(population_path.read_text(encoding="utf-8"))
        lines.extend(["## World Bank population snapshot", ""])
        for item in population:
            lines.append(f"- {item['country_name']} ({item['year']}): population {item['value']:,}")
        lines.append("")

    if gdp_path.exists():
        gdp = json.loads(gdp_path.read_text(encoding="utf-8"))
        lines.extend(["## World Bank GDP snapshot", ""])
        for item in gdp:
            lines.append(f"- {item['country_name']} ({item['year']}): GDP {item['value']}")
        lines.append("")

    if storms_path.exists():
        storms = json.loads(storms_path.read_text(encoding="utf-8"))
        lines.extend(["## NOAA IBTrACS North Atlantic proximity summary", "", f"- Source: {storms['source']}", ""])
        for item in storms["countries"]:
            lines.append(
                f"- {item['country_name']}: {item['storms_near_country_since_2005']} storms near the country footprint since 2005."
            )
        lines.append("")

    if len(lines) == 4:
        lines.append("No live reference snapshot was present when this file was generated.")
        lines.append("")

    return "\n".join(lines)


def main() -> int:
    write_file(OUTPUT_DIR / "01-regional-risk-baselines.md", generate_country_brief())
    write_file(OUTPUT_DIR / "02-intervention-catalog.md", generate_intervention_catalog())
    write_file(OUTPUT_DIR / "03-ontology-and-data-sources.md", generate_ontology_and_sources())
    write_file(OUTPUT_DIR / "04-ministerial-demo-brief.md", generate_demo_brief())
    write_file(OUTPUT_DIR / "05-live-reference-data.md", generate_live_reference_brief())
    write_file(OUTPUT_DIR / "caribbean-climate-seed.json", generate_json_seed())

    print(f"Knowledge-base seed files written to {OUTPUT_DIR}")
    for path in sorted(OUTPUT_DIR.iterdir()):
        print(f"- {path.name}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
