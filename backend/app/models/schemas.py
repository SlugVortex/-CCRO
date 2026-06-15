from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


HazardType = Literal["hurricane", "flood", "sea_level"]
GoalType = Literal["people", "infrastructure"]


class Citation(BaseModel):
    label: str
    summary: str
    source_url: str


class MapPosition(BaseModel):
    x: int
    y: int
    w: int
    h: int


class MapCoordinate(BaseModel):
    lng: float
    lat: float


class CountryOption(BaseModel):
    code: str
    name: str
    subheading: str


class InterventionOption(BaseModel):
    id: str
    title: str
    description: str
    cost_musd: float
    impact: dict[str, float]
    applicable_tags: list[str]
    benefit_tags: list[str]


class DataSourceStatus(BaseModel):
    name: str
    type: str
    last_updated: str
    status: str


class AgentLog(BaseModel):
    timestamp: str
    agent: str
    status: str
    message: str


class RegionRisk(BaseModel):
    id: str
    name: str
    population: int
    hospital_count: int
    shelter_count: int
    critical_facilities: int
    risk_score: float
    baseline_risk_score: float | None = None
    expected_loss_musd: float
    people_at_risk: int
    critical_facilities_at_risk: int
    risk_band: str
    tags: list[str]
    map_position: MapPosition
    map_coordinate: MapCoordinate | None = None
    drivers: list[str]
    component_scores: dict[str, float]
    citations: list[Citation]


class DashboardSummary(BaseModel):
    high_risk_regions: int
    people_at_risk: int
    critical_facilities_at_risk: int
    estimated_annual_loss_musd: float
    delta_vs_2030_pct: dict[str, float]


class Guardrail(BaseModel):
    title: str
    description: str
    status: str


class OntologySummary(BaseModel):
    entities: list[str]
    relationships: list[str]
    semantic_measures: list[str]


class MetadataResponse(BaseModel):
    countries: list[CountryOption]
    horizons: list[int]
    hazards: list[HazardType]
    optimization_goals: list[GoalType]
    interventions: list[InterventionOption]
    demo_scenario: dict[str, object]


class DashboardResponse(BaseModel):
    country_code: str
    country_name: str
    horizon_year: int
    hazards: list[HazardType]
    summary: DashboardSummary
    regions: list[RegionRisk]
    interventions: list[InterventionOption]
    data_sources: list[DataSourceStatus]
    agent_logs: list[AgentLog]
    ontology: OntologySummary
    guardrails: list[Guardrail]


class ScenarioRequest(BaseModel):
    scenario_name: str = "Adaptive resilience plan"
    country_code: str
    horizon_year: int
    hazards: list[HazardType] = Field(default_factory=lambda: ["hurricane", "flood", "sea_level"])
    budget_musd: float = 25.0
    goal: GoalType = "people"
    selected_intervention_ids: list[str] = Field(default_factory=list)


class RecommendationItem(BaseModel):
    rank: int
    id: str
    title: str
    rationale: str
    tags: list[str]
    cost_musd: float
    risk_reduction_pct: float
    protected_population: int
    targeted_regions: list[str]


class ScenarioSummary(BaseModel):
    budget_musd: float
    budget_used_musd: float
    budget_remaining_musd: float
    oversubscribed: bool
    high_risk_regions_before: int
    high_risk_regions_after: int
    people_at_risk_before: int
    people_at_risk_after: int
    critical_facilities_before: int
    critical_facilities_after: int
    annual_loss_before_musd: float
    annual_loss_after_musd: float
    overall_risk_reduction_pct: float


class ReportResponse(BaseModel):
    executive_summary: str
    detailed_report_markdown: str
    citations: list[Citation]


class ScenarioResponse(BaseModel):
    scenario_name: str
    country_code: str
    country_name: str
    horizon_year: int
    hazards: list[HazardType]
    goal: GoalType
    selected_intervention_ids: list[str]
    summary: ScenarioSummary
    baseline_regions: list[RegionRisk]
    scenario_regions: list[RegionRisk]
    recommendations: list[RecommendationItem]
    report: ReportResponse
    agent_logs: list[AgentLog]
