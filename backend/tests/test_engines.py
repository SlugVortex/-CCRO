import unittest

from backend.app.models.schemas import ScenarioRequest
from backend.app.services.orchestrator import get_orchestrator


class EngineTests(unittest.TestCase):
    def test_region_scores_are_bounded(self) -> None:
        orchestrator = get_orchestrator()
        dashboard = orchestrator.get_dashboard("JM", 2050, ["hurricane", "flood", "sea_level"])
        for region in dashboard.regions:
            self.assertGreaterEqual(region.risk_score, 0)
            self.assertLessEqual(region.risk_score, 100)

    def test_scenario_reduces_annual_loss_with_valid_actions(self) -> None:
        orchestrator = get_orchestrator()
        scenario = orchestrator.evaluate_scenario(
            request=ScenarioRequest(
                scenario_name="not-used",
                country_code="JM",
                horizon_year=2035,
                hazards=["hurricane", "flood", "sea_level"],
                budget_musd=30,
                goal="people",
                selected_intervention_ids=[
                    "reinforce-hospitals",
                    "drainage-upgrades",
                    "expand-shelters",
                ],
            )
        )
        self.assertLess(scenario.summary.annual_loss_after_musd, scenario.summary.annual_loss_before_musd)

    def test_recommendations_respect_budget(self) -> None:
        orchestrator = get_orchestrator()
        scenario = orchestrator.evaluate_scenario(
            request=ScenarioRequest(
                scenario_name="budget-check",
                country_code="BB",
                horizon_year=2050,
                hazards=["hurricane", "flood", "sea_level"],
                budget_musd=10,
                goal="infrastructure",
                selected_intervention_ids=["reinforce-hospitals"],
            )
        )
        total_recommendation_cost = sum(item.cost_musd for item in scenario.recommendations)
        self.assertLessEqual(total_recommendation_cost, 10)


if __name__ == "__main__":
    unittest.main()
