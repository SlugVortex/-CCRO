from __future__ import annotations

from typing import Iterable


HORIZON_MULTIPLIERS = {
    2030: 1.00,
    2035: 1.08,
    2050: 1.24,
    2100: 1.62,
}


class RiskEngine:
    def compute_region_risk(
        self,
        region: dict[str, object],
        horizon_year: int,
        hazards: Iterable[str],
        adjustments: dict[str, float] | None = None,
    ) -> dict[str, object]:
        selected_hazards = list(hazards)
        multiplier = HORIZON_MULTIPLIERS.get(horizon_year, 1.15)
        adjustments = adjustments or {}

        component_scores = {
            "hurricane": self._apply_reduction(float(region["hurricane_exposure"]), adjustments.get("hurricane", 0.0)),
            "flood": self._apply_reduction(float(region["flood_exposure"]), adjustments.get("flood", 0.0)),
            "sea_level": self._apply_reduction(float(region["sea_level_exposure"]), adjustments.get("sea_level", 0.0)),
            "infra": self._apply_reduction(
                float(region["hospital_exposure"]) * 0.58 + float(region["road_exposure"]) * 0.42,
                adjustments.get("infra", 0.0),
            ),
            "social": self._apply_reduction(
                float(region["poverty_index"]) * 100 * 0.58
                + float(region["density_index"]) * 40
                + float(region["tourism_dependency"]) * 18,
                adjustments.get("social", 0.0),
            ),
        }

        hazard_weight = 0.58 / max(len(selected_hazards), 1)
        weighted_hazards = sum(component_scores[hazard] * hazard_weight for hazard in selected_hazards)
        combined_score = (weighted_hazards + component_scores["infra"] * 0.24 + component_scores["social"] * 0.18) * multiplier
        risk_score = round(max(0.0, min(100.0, combined_score)), 1)
        people_at_risk = int(float(region["population"]) * min(0.92, 0.24 + risk_score / 140))
        critical_at_risk = min(
            int(region["critical_facilities"]),
            max(1, int(round(int(region["critical_facilities"]) * (risk_score / 100)))),
        )
        expected_loss_musd = round(float(region["annual_loss_musd"]) * (0.48 + risk_score / 100), 1)

        component_labels = {
            "hurricane": "Hurricane corridor stress",
            "flood": "Floodplain and drainage pressure",
            "sea_level": "Sea-level and storm surge exposure",
            "infra": "Critical infrastructure exposure",
            "social": "Population vulnerability concentration",
        }
        sorted_drivers = sorted(component_scores.items(), key=lambda item: item[1], reverse=True)[:3]

        return {
            "id": region["id"],
            "name": region["name"],
            "population": region["population"],
            "hospital_count": region["hospital_count"],
            "shelter_count": region["shelter_count"],
            "critical_facilities": region["critical_facilities"],
            "risk_score": risk_score,
            "expected_loss_musd": expected_loss_musd,
            "people_at_risk": people_at_risk,
            "critical_facilities_at_risk": critical_at_risk,
            "risk_band": self._risk_band(risk_score),
            "tags": region["tags"],
            "map_position": region["map_position"],
            "map_coordinate": region.get("map_coordinate"),
            "drivers": [component_labels[key] for key, _ in sorted_drivers],
            "component_scores": {key: round(value, 1) for key, value in component_scores.items()},
        }

    @staticmethod
    def summarize(region_risks: list[dict[str, object]]) -> dict[str, float | int]:
        high_risk_regions = len([item for item in region_risks if float(item["risk_score"]) >= 68])
        people_at_risk = sum(int(item["people_at_risk"]) for item in region_risks)
        critical_at_risk = sum(int(item["critical_facilities_at_risk"]) for item in region_risks)
        annual_loss = round(sum(float(item["expected_loss_musd"]) for item in region_risks), 1)
        return {
            "high_risk_regions": high_risk_regions,
            "people_at_risk": people_at_risk,
            "critical_facilities_at_risk": critical_at_risk,
            "estimated_annual_loss_musd": annual_loss,
        }

    @staticmethod
    def _apply_reduction(value: float, reduction_pct: float) -> float:
        capped_reduction = max(0.0, min(0.55, reduction_pct))
        return max(0.0, value * (1 - capped_reduction))

    @staticmethod
    def _risk_band(score: float) -> str:
        if score >= 80:
            return "Critical"
        if score >= 68:
            return "High"
        if score >= 52:
            return "Moderate"
        if score >= 36:
            return "Watch"
        return "Stable"
