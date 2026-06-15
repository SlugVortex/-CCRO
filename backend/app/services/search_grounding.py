from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Any
from urllib.parse import unquote, urlparse

import httpx

from ..core.config import Settings
from ..models.schemas import Citation


def _collapse_whitespace(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def _friendly_label(blob_url: str, fallback: str) -> str:
    parsed = urlparse(blob_url)
    filename = unquote(parsed.path.rsplit("/", 1)[-1]) if parsed.path else fallback
    stem = filename.rsplit(".", 1)[0] if "." in filename else filename
    stem = re.sub(r"^\d+\-?", "", stem)
    stem = stem.replace("-", " ").replace("_", " ").strip()
    return stem.title() if stem else fallback


@dataclass(slots=True)
class SearchGroundingService:
    settings: Settings
    api_version: str = "2023-11-01"
    max_results: int = 4

    def retrieve_citations(self, query: str) -> list[Citation]:
        if not self.settings.has_azure_search:
            return []

        cleaned_query = _collapse_whitespace(query)
        if not cleaned_query:
            return []

        endpoint = self.settings.azure_search_endpoint.rstrip("/")
        url = f"{endpoint}/indexes/{self.settings.azure_search_index_name}/docs/search?api-version={self.api_version}"
        payload = {
            "search": cleaned_query,
            "top": self.max_results,
            "select": "uid,blob_url,snippet",
            "queryType": "simple",
            "searchMode": "all",
        }
        headers = {
            "api-key": self.settings.azure_search_admin_key,
            "Content-Type": "application/json",
        }

        try:
            with httpx.Client(timeout=8.0) as client:
                response = client.post(url, headers=headers, json=payload)
                response.raise_for_status()
        except httpx.HTTPError:
            return []

        payload_data = response.json()
        documents = payload_data.get("value") or []
        citations: list[Citation] = []
        seen_sources: set[str] = set()

        for document in documents:
            citation = self._to_citation(document)
            if citation is None or citation.source_url in seen_sources:
                continue
            citations.append(citation)
            seen_sources.add(citation.source_url)

        return citations

    def _to_citation(self, document: dict[str, Any]) -> Citation | None:
        blob_url = str(document.get("blob_url") or "").strip()
        snippet = _collapse_whitespace(str(document.get("snippet") or ""))
        uid = str(document.get("uid") or "Knowledge source excerpt")

        if not blob_url and not snippet:
            return None

        label = _friendly_label(blob_url, "Climate Knowledge Base")
        summary_source = snippet or uid
        summary = summary_source[:220].rstrip()
        if len(summary_source) > 220:
            summary = f"{summary}..."

        return Citation(
            label=label,
            summary=summary,
            source_url=blob_url or uid,
        )
