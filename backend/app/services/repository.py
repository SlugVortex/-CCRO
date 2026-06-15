from __future__ import annotations

from copy import deepcopy

from ..data.demo_data import CITATIONS, COUNTRY_DATA, DATA_SOURCES, DEMO_SCENARIO, INTERVENTIONS, ONTOLOGY


class DemoClimateRepository:
    def list_countries(self) -> list[dict[str, object]]:
        return [
            {
                "code": country["code"],
                "name": country["name"],
                "subheading": country["subheading"],
            }
            for country in COUNTRY_DATA.values()
        ]

    def get_country(self, country_code: str) -> dict[str, object]:
        if country_code not in COUNTRY_DATA:
            raise KeyError(f"Unknown country code: {country_code}")
        return deepcopy(COUNTRY_DATA[country_code])

    def list_interventions(self) -> list[dict[str, object]]:
        return deepcopy(INTERVENTIONS)

    def list_data_sources(self) -> list[dict[str, str]]:
        return deepcopy(DATA_SOURCES)

    def get_ontology(self) -> dict[str, list[str]]:
        return deepcopy(ONTOLOGY)

    def list_citations(self) -> list[dict[str, str]]:
        return deepcopy(CITATIONS)

    def get_demo_scenario(self) -> dict[str, object]:
        return deepcopy(DEMO_SCENARIO)
