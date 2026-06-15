from __future__ import annotations

from textwrap import dedent
from urllib.parse import urlsplit

from ..models.schemas import Citation, RecommendationItem, ReportResponse, ScenarioSummary

try:
    from openai import AzureOpenAI
except ImportError:  # pragma: no cover
    AzureOpenAI = None


class ReportBuilder:
    def __init__(self, settings):
        self.settings = settings

    @staticmethod
    def _normalize_azure_endpoint(endpoint: str) -> str:
        if not endpoint:
            return endpoint

        trimmed = endpoint.strip()
        if "/openai/" not in trimmed:
            return trimmed.rstrip("/")

        parsed = urlsplit(trimmed)
        return f"{parsed.scheme}://{parsed.netloc}"

    def build(
        self,
        country_name: str,
        horizon_year: int,
        goal: str,
        summary: ScenarioSummary,
        recommendations: list[RecommendationItem],
        citations: list[Citation],
    ) -> ReportResponse:
        ai_summary = self._try_azure_openai_summary(country_name, horizon_year, goal, summary, recommendations)
        executive_summary = ai_summary or self._fallback_summary(country_name, horizon_year, goal, summary, recommendations)
        details = self._detailed_markdown(country_name, horizon_year, goal, summary, recommendations, citations)
        return ReportResponse(executive_summary=executive_summary, detailed_report_markdown=details, citations=citations)

    def _fallback_summary(
        self,
        country_name: str,
        horizon_year: int,
        goal: str,
        summary: ScenarioSummary,
        recommendations: list[RecommendationItem],
    ) -> str:
        goal_phrase = "people exposed to climate shocks" if goal == "people" else "critical infrastructure exposure"
        top_actions = ", ".join(item.title for item in recommendations[:3]) or "targeted resilience interventions"
        return (
            f"For {country_name} in {horizon_year}, the modeled plan cuts {goal_phrase} by "
            f"{summary.overall_risk_reduction_pct:.1f}% while using ${summary.budget_used_musd:.1f}M of the "
            f"${summary.budget_musd:.1f}M budget. The strongest moves are {top_actions}."
        )

    def _detailed_markdown(
        self,
        country_name: str,
        horizon_year: int,
        goal: str,
        summary: ScenarioSummary,
        recommendations: list[RecommendationItem],
        citations: list[Citation],
    ) -> str:
        recommendation_lines = "\n".join(
            [
                f"{index + 1}. **{item.title}** - ${item.cost_musd:.1f}M, "
                f"{item.risk_reduction_pct:.1f}% modeled reduction, protects about {item.protected_population:,} people."
                for index, item in enumerate(recommendations[:5])
            ]
        )
        citation_lines = "\n".join([f"- {citation.label}: {citation.summary}" for citation in citations])
        goal_sentence = (
            "The optimization goal emphasized the largest reduction in people at risk."
            if goal == "people"
            else "The optimization goal emphasized keeping hospitals, roads, and shelters operational."
        )
        return dedent(
            f"""
            ## Situation

            {country_name} was modeled against the {horizon_year} horizon using hurricane, flood, and sea-level signals
            plus critical infrastructure and population vulnerability overlays.

            ## What changed

            - High-risk regions moved from **{summary.high_risk_regions_before}** to **{summary.high_risk_regions_after}**.
            - People at risk moved from **{summary.people_at_risk_before:,}** to **{summary.people_at_risk_after:,}**.
            - Critical facilities at risk moved from **{summary.critical_facilities_before}** to **{summary.critical_facilities_after}**.
            - Estimated annual loss moved from **${summary.annual_loss_before_musd:.1f}M** to **${summary.annual_loss_after_musd:.1f}M**.

            {goal_sentence}

            ## Ranked interventions

            {recommendation_lines}

            ## Grounding

            {citation_lines}
            """
        ).strip()

    def _try_azure_openai_summary(
        self,
        country_name: str,
        horizon_year: int,
        goal: str,
        summary: ScenarioSummary,
        recommendations: list[RecommendationItem],
    ) -> str | None:
        if not self.settings.has_azure_openai or AzureOpenAI is None:
            return None

        try:
            client = AzureOpenAI(
                azure_endpoint=self._normalize_azure_endpoint(self.settings.azure_openai_endpoint),
                api_key=self.settings.azure_openai_api_key,
                api_version=self.settings.azure_openai_api_version,
            )
            prompt = {
                "country_name": country_name,
                "horizon_year": horizon_year,
                "goal": goal,
                "summary": summary.model_dump(),
                "recommendations": [item.model_dump() for item in recommendations[:3]],
            }
            completion = client.chat.completions.create(
                model=self.settings.azure_openai_deployment,
                temperature=0.2,
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are a climate adaptation strategist. Write one concise executive sentence "
                            "for a ministerial briefing using the structured scenario payload."
                        ),
                    },
                    {"role": "user", "content": str(prompt)},
                ],
            )
            return completion.choices[0].message.content.strip() if completion.choices else None
        except Exception:
            return None
