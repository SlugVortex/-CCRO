from __future__ import annotations

from fastapi import APIRouter, Depends, Query

from ...core.config import Settings, get_settings
from ...models.schemas import DashboardResponse, MetadataResponse, ScenarioRequest, ScenarioResponse
from ...services.orchestrator import ClimateOrchestrator, get_orchestrator

router = APIRouter(tags=["climate"])


@router.get("/health")
def health(settings: Settings = Depends(get_settings)) -> dict[str, object]:
    return {
        "status": "ok",
        "service": settings.app_name,
        "environment": settings.app_env,
        "azure_openai_enabled": settings.has_azure_openai,
        "operating_mode": "Azure-assisted climate planning" if settings.has_azure_openai else "Deterministic demo pipeline",
        "service_statuses": {
            "azure_openai": {
                "configured": settings.has_azure_openai,
                "active": settings.has_azure_openai,
                "summary": "Narration and report generation are live."
                if settings.has_azure_openai
                else "Azure OpenAI keys are missing, so narrative generation falls back to demo text.",
            },
            "azure_search": {
                "configured": settings.has_azure_search,
                "active": settings.has_azure_search,
                "summary": "Live Azure AI Search grounding is wired into the reasoning pipeline with demo-citation fallback."
                if settings.has_azure_search
                else "Azure AI Search is not configured yet.",
            },
            "foundry": {
                "configured": settings.has_foundry_project,
                "active": settings.has_foundry,
                "summary": (
                    "Foundry project and agent settings are present, but agent-service orchestration is still mocked locally."
                    if settings.has_foundry
                    else "Foundry project is configured, but the agent ID is still missing."
                    if settings.has_foundry_project
                    else "Foundry project endpoint is still missing."
                ),
            },
            "azure_maps": {
                "configured": settings.has_azure_maps,
                "active": settings.has_azure_maps,
                "summary": "Azure Maps credentials are loaded and the atlas can render the live map with an SVG fallback."
                if settings.has_azure_maps
                else "Azure Maps keys are not configured yet.",
            },
            "fabric": {
                "configured": settings.has_fabric,
                "active": False,
                "summary": "Fabric semantic model ID is present, but no live semantic queries are running yet."
                if settings.has_fabric
                else "Fabric semantic model wiring is still pending.",
            },
            "powerbi": {
                "configured": settings.has_powerbi,
                "active": False,
                "summary": "Power BI embed settings are configured, but no live embedded report is mounted yet."
                if settings.has_powerbi
                else "Power BI embed credentials are still missing.",
            },
        },
    }


@router.get("/metadata", response_model=MetadataResponse)
def metadata(orchestrator: ClimateOrchestrator = Depends(get_orchestrator)) -> MetadataResponse:
    return orchestrator.get_metadata()


@router.get("/dashboard", response_model=DashboardResponse)
def dashboard(
    country: str | None = Query(default=None),
    horizon: int | None = Query(default=None),
    hazards: str | None = Query(default=None),
    settings: Settings = Depends(get_settings),
    orchestrator: ClimateOrchestrator = Depends(get_orchestrator),
) -> DashboardResponse:
    selected_hazards = (
        [item.strip() for item in hazards.split(",") if item.strip()]
        if hazards
        else ["hurricane", "flood", "sea_level"]
    )
    return orchestrator.get_dashboard(
        country_code=country or settings.default_country,
        horizon_year=horizon or settings.default_horizon,
        hazards=selected_hazards,
    )


@router.post("/scenarios/evaluate", response_model=ScenarioResponse)
def evaluate_scenario(
    request: ScenarioRequest,
    orchestrator: ClimateOrchestrator = Depends(get_orchestrator),
) -> ScenarioResponse:
    return orchestrator.evaluate_scenario(request)
