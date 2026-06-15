from __future__ import annotations

import csv
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.app.services.repository import DemoClimateRepository
from backend.app.services.risk_engine import RiskEngine
from backend.app.services.scenario_engine import ScenarioEngine


OUTPUT_DIR = PROJECT_ROOT / "docs" / "bi-seed"
HAZARDS = ["hurricane", "flood", "sea_level"]
HORIZONS = [2030, 2035, 2050]


def write_csv(path: Path, fieldnames: list[str], rows: list[dict[str, object]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def export_region_baselines(repository: DemoClimateRepository, risk_engine: RiskEngine) -> None:
    rows: list[dict[str, object]] = []
    for country in repository.list_countries():
        country_data = repository.get_country(str(country["code"]))
        for horizon in HORIZONS:
            for region in country_data["regions"]:
                result = risk_engine.compute_region_risk(region, horizon, HAZARDS)
                rows.append(
                    {
                        "country_code": country_data["code"],
                        "country_name": country_data["name"],
                        "horizon_year": horizon,
                        "region_id": result["id"],
                        "region_name": result["name"],
                        "risk_score": result["risk_score"],
                        "risk_band": result["risk_band"],
                        "people_at_risk": result["people_at_risk"],
                        "critical_facilities_at_risk": result["critical_facilities_at_risk"],
                        "expected_loss_musd": result["expected_loss_musd"],
                        "population": result["population"],
                        "critical_facilities": result["critical_facilities"],
                        "hurricane_score": result["component_scores"]["hurricane"],
                        "flood_score": result["component_scores"]["flood"],
                        "sea_level_score": result["component_scores"]["sea_level"],
                        "drivers": " | ".join(result["drivers"]),
                    }
                )

    write_csv(
        OUTPUT_DIR / "regional_risk_baselines.csv",
        [
            "country_code",
            "country_name",
            "horizon_year",
            "region_id",
            "region_name",
            "risk_score",
            "risk_band",
            "people_at_risk",
            "critical_facilities_at_risk",
            "expected_loss_musd",
            "population",
            "critical_facilities",
            "hurricane_score",
            "flood_score",
            "sea_level_score",
            "drivers",
        ],
        rows,
    )


def export_interventions(repository: DemoClimateRepository) -> None:
    rows = []
    for item in repository.list_interventions():
        rows.append(
            {
                "id": item["id"],
                "title": item["title"],
                "description": item["description"],
                "cost_musd": item["cost_musd"],
                "hurricane_impact": item["impact"]["hurricane"],
                "flood_impact": item["impact"]["flood"],
                "sea_level_impact": item["impact"]["sea_level"],
                "infrastructure_impact": item["impact"]["infra"],
                "social_impact": item["impact"]["social"],
                "applicable_tags": " | ".join(item["applicable_tags"]),
                "benefit_tags": " | ".join(item["benefit_tags"]),
            }
        )

    write_csv(
        OUTPUT_DIR / "intervention_catalog.csv",
        [
            "id",
            "title",
            "description",
            "cost_musd",
            "hurricane_impact",
            "flood_impact",
            "sea_level_impact",
            "infrastructure_impact",
            "social_impact",
            "applicable_tags",
            "benefit_tags",
        ],
        rows,
    )


def export_data_sources(repository: DemoClimateRepository) -> None:
    write_csv(
        OUTPUT_DIR / "data_sources.csv",
        ["name", "type", "last_updated", "status"],
        repository.list_data_sources(),
    )


def export_demo_scenario(
    repository: DemoClimateRepository,
    risk_engine: RiskEngine,
    scenario_engine: ScenarioEngine,
) -> None:
    demo = repository.get_demo_scenario()
    country = repository.get_country(str(demo["country_code"]))
    interventions = repository.list_interventions()
    baseline = [
        risk_engine.compute_region_risk(region, int(demo["horizon_year"]), list(demo["hazards"]))
        for region in country["regions"]
    ]
    scenario = scenario_engine.apply(
        country=country,
        actions=interventions,
        selected_action_ids=list(demo["selected_intervention_ids"]),
        horizon_year=int(demo["horizon_year"]),
        hazards=list(demo["hazards"]),
    )
    baseline_lookup = {item["id"]: item for item in baseline}
    rows: list[dict[str, object]] = []
    for item in scenario:
        previous = baseline_lookup[item["id"]]
        rows.append(
            {
                "country_code": country["code"],
                "country_name": country["name"],
                "scenario_name": demo["scenario_name"],
                "horizon_year": demo["horizon_year"],
                "region_id": item["id"],
                "region_name": item["name"],
                "baseline_risk_score": previous["risk_score"],
                "scenario_risk_score": item["risk_score"],
                "baseline_people_at_risk": previous["people_at_risk"],
                "scenario_people_at_risk": item["people_at_risk"],
                "baseline_annual_loss_musd": previous["expected_loss_musd"],
                "scenario_annual_loss_musd": item["expected_loss_musd"],
            }
        )

    write_csv(
        OUTPUT_DIR / "scenario_comparison.csv",
        [
            "country_code",
            "country_name",
            "scenario_name",
            "horizon_year",
            "region_id",
            "region_name",
            "baseline_risk_score",
            "scenario_risk_score",
            "baseline_people_at_risk",
            "scenario_people_at_risk",
            "baseline_annual_loss_musd",
            "scenario_annual_loss_musd",
        ],
        rows,
    )


def main() -> int:
    repository = DemoClimateRepository()
    risk_engine = RiskEngine()
    scenario_engine = ScenarioEngine(risk_engine)

    export_region_baselines(repository, risk_engine)
    export_interventions(repository)
    export_data_sources(repository)
    export_demo_scenario(repository, risk_engine, scenario_engine)

    print(f"Power BI / Fabric seed files written to {OUTPUT_DIR}")
    for path in sorted(OUTPUT_DIR.glob("*.csv")):
        print(f"- {path.name}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
