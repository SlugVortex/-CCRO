import unittest

from fastapi.testclient import TestClient

from backend.app.main import app


client = TestClient(app)


class ApiTests(unittest.TestCase):
    def test_health_endpoint(self) -> None:
        response = client.get("/api/v1/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "ok")

    def test_dashboard_endpoint_returns_regions(self) -> None:
        response = client.get("/api/v1/dashboard?country=JM&horizon=2050")
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["country_name"], "Jamaica")
        self.assertGreaterEqual(len(payload["regions"]), 5)

    def test_scenario_endpoint_returns_recommendations(self) -> None:
        response = client.post(
            "/api/v1/scenarios/evaluate",
            json={
                "scenario_name": "Test scenario",
                "country_code": "JM",
                "horizon_year": 2035,
                "hazards": ["hurricane", "flood", "sea_level"],
                "budget_musd": 20,
                "goal": "people",
                "selected_intervention_ids": ["reinforce-hospitals", "expand-shelters"],
            },
        )
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertGreater(payload["summary"]["budget_used_musd"], 0)
        self.assertGreaterEqual(len(payload["recommendations"]), 1)


if __name__ == "__main__":
    unittest.main()
