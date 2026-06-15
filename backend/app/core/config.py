from __future__ import annotations

import os
from dataclasses import dataclass, field
from functools import lru_cache
from pathlib import Path

try:
    from dotenv import load_dotenv
except ImportError:  # pragma: no cover
    load_dotenv = None


if load_dotenv is not None:
    project_root = Path(__file__).resolve().parents[3]
    load_dotenv(project_root / ".env", override=False)
    load_dotenv(project_root / "backend" / ".env", override=False)


def _parse_bool(value: str | None, default: bool = False) -> bool:
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _parse_csv(value: str | None, default: list[str]) -> list[str]:
    if not value:
        return default
    return [item.strip() for item in value.split(",") if item.strip()]


@dataclass(slots=True)
class Settings:
    app_name: str = "Caribbean Climate Resilience Orchestrator API"
    app_env: str = "development"
    api_prefix: str = "/api/v1"
    cors_origins: list[str] = field(default_factory=lambda: ["http://localhost:5173"])
    default_country: str = "JM"
    default_horizon: int = 2050
    enable_azure_openai: bool = False
    azure_openai_endpoint: str = ""
    azure_openai_api_key: str = ""
    azure_openai_deployment: str = ""
    azure_openai_api_version: str = ""
    foundry_project_endpoint: str = ""
    foundry_api_key: str = ""
    foundry_agent_id: str = ""
    foundry_knowledge_base_name: str = ""
    azure_search_endpoint: str = ""
    azure_search_admin_key: str = ""
    azure_search_index_name: str = ""
    fabric_semantic_model_id: str = ""
    powerbi_tenant_id: str = ""
    powerbi_client_id: str = ""
    powerbi_client_secret: str = ""
    powerbi_workspace_id: str = ""
    powerbi_report_id: str = ""
    azure_maps_client_id: str = ""
    azure_maps_key: str = ""
    key_vault_uri: str = ""

    @property
    def has_azure_openai(self) -> bool:
        return bool(
            self.enable_azure_openai
            and self.azure_openai_endpoint
            and self.azure_openai_api_key
            and self.azure_openai_deployment
            and self.azure_openai_api_version
        )

    @property
    def has_azure_search(self) -> bool:
        return bool(self.azure_search_endpoint and self.azure_search_admin_key and self.azure_search_index_name)

    @property
    def has_foundry(self) -> bool:
        return bool(self.foundry_project_endpoint and self.foundry_agent_id)

    @property
    def has_foundry_project(self) -> bool:
        return bool(self.foundry_project_endpoint)

    @property
    def has_foundry_agent(self) -> bool:
        return bool(self.foundry_agent_id)

    @property
    def has_fabric(self) -> bool:
        return bool(self.fabric_semantic_model_id)

    @property
    def has_powerbi(self) -> bool:
        return bool(
            self.powerbi_tenant_id
            and self.powerbi_client_id
            and self.powerbi_client_secret
            and self.powerbi_workspace_id
            and self.powerbi_report_id
        )

    @property
    def has_azure_maps(self) -> bool:
        return bool(self.azure_maps_client_id and self.azure_maps_key)


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings(
        app_name=os.getenv("APP_NAME", "Caribbean Climate Resilience Orchestrator API"),
        app_env=os.getenv("APP_ENV", "development"),
        api_prefix=os.getenv("API_PREFIX", "/api/v1"),
        cors_origins=_parse_csv(os.getenv("CORS_ORIGINS"), ["http://localhost:5173"]),
        default_country=os.getenv("DEFAULT_COUNTRY", "JM"),
        default_horizon=int(os.getenv("DEFAULT_HORIZON", "2050")),
        enable_azure_openai=_parse_bool(os.getenv("ENABLE_AZURE_OPENAI"), False),
        azure_openai_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT", ""),
        azure_openai_api_key=os.getenv("AZURE_OPENAI_API_KEY", ""),
        azure_openai_deployment=os.getenv("AZURE_OPENAI_DEPLOYMENT", ""),
        azure_openai_api_version=os.getenv("AZURE_OPENAI_API_VERSION", ""),
        foundry_project_endpoint=os.getenv("FOUNDRY_PROJECT_ENDPOINT", ""),
        foundry_api_key=os.getenv("FOUNDRY_API_KEY", ""),
        foundry_agent_id=os.getenv("FOUNDRY_AGENT_ID", ""),
        foundry_knowledge_base_name=os.getenv("FOUNDRY_KNOWLEDGE_BASE_NAME", ""),
        azure_search_endpoint=os.getenv("AZURE_SEARCH_ENDPOINT", ""),
        azure_search_admin_key=os.getenv("AZURE_SEARCH_ADMIN_KEY", ""),
        azure_search_index_name=os.getenv("AZURE_SEARCH_INDEX_NAME", ""),
        fabric_semantic_model_id=os.getenv("FABRIC_SEMANTIC_MODEL_ID", ""),
        powerbi_tenant_id=os.getenv("POWERBI_TENANT_ID", ""),
        powerbi_client_id=os.getenv("POWERBI_CLIENT_ID", ""),
        powerbi_client_secret=os.getenv("POWERBI_CLIENT_SECRET", ""),
        powerbi_workspace_id=os.getenv("POWERBI_WORKSPACE_ID", ""),
        powerbi_report_id=os.getenv("POWERBI_REPORT_ID", ""),
        azure_maps_client_id=os.getenv("AZURE_MAPS_CLIENT_ID", ""),
        azure_maps_key=os.getenv("AZURE_MAPS_KEY", ""),
        key_vault_uri=os.getenv("KEY_VAULT_URI", ""),
    )
