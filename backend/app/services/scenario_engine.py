from __future__ import annotations

from copy import deepcopy

from .risk_engine import RiskEngine


class ScenarioEngine:
    def __init__(self, risk_engine: RiskEngine):
        self.risk_engine = risk_engine

    def apply(
        self,
        country: dict[str, object],
        actions: list[dict[str, object]],
        selected_action_ids: list[str],
        horizon_year: int,
        hazards: list[str],
    ) -> list[dict[str, object]]:
        selected_actions = [action for action in actions if action["id"] in selected_action_ids]
        scenario_regions: list[dict[str, object]] = []
        for region in deepcopy(country["regions"]):
            adjustments = {
                "hurricane": 0.0,
                "flood": 0.0,
                "sea_level": 0.0,
                "infra": 0.0,
                "social": 0.0,
            }
            for action in selected_actions:
                if not any(tag in region["tags"] for tag in action["applicable_tags"]):
                    continue
                for key, value in action["impact"].items():
                    adjustments[key] = min(0.45, adjustments[key] + float(value))
            scenario_regions.append(self.risk_engine.compute_region_risk(region, horizon_year, hazards, adjustments))
        return scenario_regions
