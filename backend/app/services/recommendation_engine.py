from __future__ import annotations


class RecommendationEngine:
    def recommend(
        self,
        available_actions: list[dict[str, object]],
        baseline_regions: list[dict[str, object]],
        budget_musd: float,
        goal: str,
    ) -> list[dict[str, object]]:
        candidates: list[dict[str, object]] = []
        for action in available_actions:
            targeted_regions = [
                region
                for region in baseline_regions
                if any(tag in region["tags"] for tag in action["applicable_tags"])
            ]
            if not targeted_regions:
                continue

            risk_delta = sum(
                float(region["risk_score"])
                * (
                    float(action["impact"].get("hurricane", 0))
                    + float(action["impact"].get("flood", 0))
                    + float(action["impact"].get("sea_level", 0))
                    + float(action["impact"].get("infra", 0))
                )
                for region in targeted_regions
            )
            protected_population = int(
                sum(int(region["people_at_risk"]) for region in targeted_regions)
                * (
                    0.42
                    if goal == "people"
                    else 0.18 + float(action["impact"].get("infra", 0))
                )
            )
            facilities_weight = sum(int(region["critical_facilities_at_risk"]) for region in targeted_regions)
            goal_multiplier = 1.25 if goal == "people" else 1.35
            score = ((risk_delta * 0.65) + (protected_population / 1000) + facilities_weight * 4) * goal_multiplier
            candidates.append(
                {
                    "action": action,
                    "score": score,
                    "protected_population": protected_population,
                    "targeted_regions": [region["name"] for region in targeted_regions[:4]],
                    "risk_reduction_pct": round(min(26.0, score / 24), 1),
                }
            )

        ordered = sorted(candidates, key=lambda item: item["score"] / float(item["action"]["cost_musd"]), reverse=True)
        remaining = budget_musd
        recommendations: list[dict[str, object]] = []
        for candidate in ordered:
            action = candidate["action"]
            if float(action["cost_musd"]) > remaining:
                continue
            remaining = round(remaining - float(action["cost_musd"]), 1)
            recommendations.append(
                {
                    "id": action["id"],
                    "title": action["title"],
                    "rationale": self._build_rationale(action, candidate),
                    "tags": action["benefit_tags"],
                    "cost_musd": float(action["cost_musd"]),
                    "risk_reduction_pct": candidate["risk_reduction_pct"],
                    "protected_population": candidate["protected_population"],
                    "targeted_regions": candidate["targeted_regions"],
                }
            )
        return recommendations

    @staticmethod
    def _build_rationale(action: dict[str, object], candidate: dict[str, object]) -> str:
        regions = ", ".join(candidate["targeted_regions"])
        return (
            f"Targets {regions} where the current exposure profile aligns with "
            f"{', '.join(action['applicable_tags'][:3])}. "
            f"Projected to protect roughly {candidate['protected_population']:,} residents within the chosen budget."
        )
