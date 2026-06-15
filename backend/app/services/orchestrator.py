from __future__ import annotations

from datetime import datetime, timedelta, timezone
from functools import lru_cache

from ..core.config import get_settings
from ..models.schemas import (
    AgentLog,
    Citation,
    CountryOption,
    DashboardResponse,
    DashboardSummary,
    DataSourceStatus,
    Guardrail,
    InterventionOption,
    MetadataResponse,
    OntologySummary,
    RecommendationItem,
    RegionRisk,
    ScenarioRequest,
    ScenarioResponse,
    ScenarioSummary,
)
from .recommendation_engine import RecommendationEngine
from .reporting import ReportBuilder
from .repository import DemoClimateRepository
from .risk_engine import RiskEngine
from .scenario_engine import ScenarioEngine
from .search_grounding import SearchGroundingService


class ClimateOrchestrator:
    def __init__(self) -> None:
        self.settings = get_settings()
        self.repository = DemoClimateRepository()
        self.risk_engine = RiskEngine()
        self.scenario_engine = ScenarioEngine(self.risk_engine)
        self.recommendation_engine = RecommendationEngine()
        self.report_builder = ReportBuilder(self.settings)
        self.search_grounding = SearchGroundingService(self.settings)

    def get_metadata(self) -> MetadataResponse:
        countries = [CountryOption(**item) for item in self.repository.list_countries()]
        interventions = [InterventionOption(**item) for item in self.repository.list_interventions()]
        return MetadataResponse(
            countries=countries,
            horizons=[2030, 2035, 2050, 2100],
            hazards=["hurricane", "flood", "sea_level"],
            optimization_goals=["people", "infrastructure"],
            interventions=interventions,
            demo_scenario=self.repository.get_demo_scenario(),
        )

    def get_dashboard(self, country_code: str, horizon_year: int, hazards: list[str]) -> DashboardResponse:
        country = self.repository.get_country(country_code)
        baseline_regions = self._build_region_risks(country["regions"], horizon_year, hazards)
        baseline_2030 = self._build_region_risks(country["regions"], 2030, hazards)
        summary = self.risk_engine.summarize(baseline_regions)
        baseline_2030_summary = self.risk_engine.summarize(baseline_2030)
        delta_vs_2030 = self._compute_delta(summary, baseline_2030_summary)
        citations = self._resolve_dashboard_citations(country["name"], horizon_year, hazards, baseline_regions)
        region_models = [RegionRisk(**{**region, "citations": citations}) for region in baseline_regions]

        return DashboardResponse(
            country_code=country["code"],
            country_name=country["name"],
            horizon_year=horizon_year,
            hazards=hazards,
            summary=DashboardSummary(**summary, delta_vs_2030_pct=delta_vs_2030),
            regions=sorted(region_models, key=lambda item: item.risk_score, reverse=True),
            interventions=[InterventionOption(**item) for item in self.repository.list_interventions()],
            data_sources=[DataSourceStatus(**item) for item in self.repository.list_data_sources()],
            agent_logs=self._agent_logs(horizon_year, country["name"], "dashboard"),
            ontology=OntologySummary(**self.repository.get_ontology()),
            guardrails=self._guardrails(),
        )

    def evaluate_scenario(self, request: ScenarioRequest) -> ScenarioResponse:
        country = self.repository.get_country(request.country_code)
        actions = self.repository.list_interventions()

        baseline_regions = self._build_region_risks(country["regions"], request.horizon_year, request.hazards)
        scenario_regions = self.scenario_engine.apply(
            country=country,
            actions=actions,
            selected_action_ids=request.selected_intervention_ids,
            horizon_year=request.horizon_year,
            hazards=request.hazards,
        )
        citations = self._resolve_scenario_citations(
            country_name=country["name"],
            horizon_year=request.horizon_year,
            hazards=request.hazards,
            goal=request.goal,
            selected_action_ids=request.selected_intervention_ids,
            available_actions=actions,
        )
        baseline_summary = self.risk_engine.summarize(baseline_regions)
        scenario_summary_data = self.risk_engine.summarize(scenario_regions)
        budget_used = round(
            sum(float(item["cost_musd"]) for item in actions if item["id"] in request.selected_intervention_ids), 1
        )

        recommendations_raw = self.recommendation_engine.recommend(
            available_actions=actions,
            baseline_regions=baseline_regions,
            budget_musd=request.budget_musd,
            goal=request.goal,
        )
        recommendations = [
            RecommendationItem(rank=index + 1, **item)
            for index, item in enumerate(recommendations_raw)
        ]

        summary = ScenarioSummary(
            budget_musd=request.budget_musd,
            budget_used_musd=budget_used,
            budget_remaining_musd=round(request.budget_musd - budget_used, 1),
            oversubscribed=budget_used > request.budget_musd,
            high_risk_regions_before=int(baseline_summary["high_risk_regions"]),
            high_risk_regions_after=int(scenario_summary_data["high_risk_regions"]),
            people_at_risk_before=int(baseline_summary["people_at_risk"]),
            people_at_risk_after=int(scenario_summary_data["people_at_risk"]),
            critical_facilities_before=int(baseline_summary["critical_facilities_at_risk"]),
            critical_facilities_after=int(scenario_summary_data["critical_facilities_at_risk"]),
            annual_loss_before_musd=float(baseline_summary["estimated_annual_loss_musd"]),
            annual_loss_after_musd=float(scenario_summary_data["estimated_annual_loss_musd"]),
            overall_risk_reduction_pct=round(
                (
                    (
                        float(baseline_summary["estimated_annual_loss_musd"])
                        - float(scenario_summary_data["estimated_annual_loss_musd"])
                    )
                    / max(float(baseline_summary["estimated_annual_loss_musd"]), 1.0)
                )
                * 100,
                1,
            ),
        )

        report = self.report_builder.build(
            country_name=country["name"],
            horizon_year=request.horizon_year,
            goal=request.goal,
            summary=summary,
            recommendations=recommendations,
            citations=citations,
        )

        baseline_models = [RegionRisk(**{**item, "citations": citations}) for item in baseline_regions]
        scenario_models = []
        baseline_lookup = {item["id"]: item["risk_score"] for item in baseline_regions}
        for item in scenario_regions:
            scenario_models.append(
                RegionRisk(
                    **{
                        **item,
                        "baseline_risk_score": float(baseline_lookup[item["id"]]),
                        "citations": citations,
                    }
                )
            )

        return ScenarioResponse(
            scenario_name=request.scenario_name,
            country_code=country["code"],
            country_name=country["name"],
            horizon_year=request.horizon_year,
            hazards=request.hazards,
            goal=request.goal,
            selected_intervention_ids=request.selected_intervention_ids,
            summary=summary,
            baseline_regions=sorted(baseline_models, key=lambda item: item.risk_score, reverse=True),
            scenario_regions=sorted(scenario_models, key=lambda item: item.risk_score, reverse=True),
            recommendations=recommendations,
            report=report,
            agent_logs=self._agent_logs(request.horizon_year, country["name"], "scenario"),
        )

    def _build_region_risks(
        self,
        regions: list[dict[str, object]],
        horizon_year: int,
        hazards: list[str],
    ) -> list[dict[str, object]]:
        return [self.risk_engine.compute_region_risk(region, horizon_year, hazards) for region in regions]

    def _resolve_dashboard_citations(
        self,
        country_name: str,
        horizon_year: int,
        hazards: list[str],
        baseline_regions: list[dict[str, object]],
    ) -> list[Citation]:
        sorted_regions = sorted(baseline_regions, key=lambda item: float(item["risk_score"]), reverse=True)
        hotspot_names = " ".join(str(region["name"]) for region in sorted_regions[:3])
        queries = [
            f"{country_name} climate resilience {hotspot_names}",
            "ontology data sources parish hospital roadsegment floodzone",
            f"intervention catalog shelters hospitals roads {country_name} {horizon_year} {' '.join(hazards)}",
        ]
        return self._merge_citations(self._retrieve_search_citations(queries))

    def _resolve_scenario_citations(
        self,
        *,
        country_name: str,
        horizon_year: int,
        hazards: list[str],
        goal: str,
        selected_action_ids: list[str],
        available_actions: list[dict[str, object]],
    ) -> list[Citation]:
        selected_titles = [
            str(action["title"])
            for action in available_actions
            if str(action["id"]) in selected_action_ids
        ]
        action_keywords = " ".join(
            word
            for title in selected_titles[:3]
            for word in title.lower().split()
            if len(word) > 4
        )
        queries = [
            f"intervention catalog {action_keywords}".strip(),
            f"{country_name} climate resilience {goal} {horizon_year} {' '.join(hazards)}",
            "ontology data sources parish hospital roadsegment floodzone",
        ]
        return self._merge_citations(self._retrieve_search_citations(queries))

    def _retrieve_search_citations(self, queries: list[str]) -> list[Citation]:
        merged: list[Citation] = []
        seen_sources: set[str] = set()

        for query in queries:
            for citation in self.search_grounding.retrieve_citations(query):
                if citation.source_url in seen_sources:
                    continue
                merged.append(citation)
                seen_sources.add(citation.source_url)
                if len(merged) == 4:
                    return merged

        return merged

    def _merge_citations(self, live_citations: list[Citation]) -> list[Citation]:
        fallback_citations = [Citation(**item) for item in self.repository.list_citations()]
        merged: list[Citation] = []
        seen_sources: set[str] = set()

        for citation in [*live_citations, *fallback_citations]:
            if citation.source_url in seen_sources:
                continue
            merged.append(citation)
            seen_sources.add(citation.source_url)
            if len(merged) == 4:
                break

        return merged

    @staticmethod
    def _compute_delta(
        current_summary: dict[str, float | int],
        baseline_summary: dict[str, float | int],
    ) -> dict[str, float]:
        deltas: dict[str, float] = {}
        for key, value in current_summary.items():
            baseline = float(baseline_summary[key]) if baseline_summary[key] else 1.0
            deltas[key] = round(((float(value) - baseline) / baseline) * 100, 1)
        return deltas

    @staticmethod
    def _guardrails() -> list[Guardrail]:
        return [
            Guardrail(
                title="Budget bound recommendations",
                description="The planner rejects impossible portfolios and always reports overspend explicitly.",
                status="Active",
            ),
            Guardrail(
                title="Grounded citations",
                description="Narratives always carry dataset references and never claim ungrounded confidence.",
                status="Active",
            ),
            Guardrail(
                title="Three-tier fallback",
                description="If live Azure services are unavailable, the app falls back to deterministic demo scoring.",
                status="Active",
            ),
        ]

    @staticmethod
    def _agent_logs(horizon_year: int, country_name: str, mode: str) -> list[AgentLog]:
        now = datetime.now(timezone.utc).replace(microsecond=0)
        messages = [
            ("IngestionAgent", "Healthy", f"Loaded climate, infrastructure, and population snapshots for {country_name}."),
            ("OntologyAgent", "Healthy", "Resolved Parish, Hospital, Shelter, RoadSegment, and FloodZone relationships."),
            ("RiskAssessmentAgent", "Healthy", f"Computed parish-level risk scores for the {horizon_year} horizon."),
        ]
        if mode == "scenario":
            messages.extend(
                [
                    ("ScenarioAgent", "Healthy", "Applied intervention effects against the baseline exposure model."),
                    ("RecommendationAgent", "Healthy", "Ranked the highest leverage actions under the selected budget."),
                ]
            )

        logs: list[AgentLog] = []
        for offset, (agent, status, message) in enumerate(messages):
            logs.append(
                AgentLog(
                    timestamp=(now - timedelta(minutes=len(messages) - offset)).isoformat(),
                    agent=agent,
                    status=status,
                    message=message,
                )
            )
        return logs


@lru_cache(maxsize=1)
def get_orchestrator() -> ClimateOrchestrator:
    return ClimateOrchestrator()
