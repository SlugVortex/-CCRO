from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

try:
    from dotenv import load_dotenv
except ImportError:  # pragma: no cover
    load_dotenv = None


PROJECT_ROOT = Path(__file__).resolve().parents[1]


def update_env_value(env_path: Path, key: str, value: str) -> None:
    lines = env_path.read_text(encoding="utf-8").splitlines() if env_path.exists() else []
    updated = False
    output: list[str] = []

    for line in lines:
        if line.startswith(f"{key}="):
            output.append(f"{key}={value}")
            updated = True
        else:
            output.append(line)

    if not updated:
        output.append(f"{key}={value}")

    env_path.write_text("\n".join(output) + "\n", encoding="utf-8")


def request_json(method: str, url: str, api_key: str, payload: dict | None = None) -> dict:
    body = None
    headers = {
        "Content-Type": "application/json",
        "api-key": api_key,
    }

    if payload is not None:
        body = json.dumps(payload).encode("utf-8")

    request = Request(url, data=body, method=method, headers=headers)
    with urlopen(request) as response:
        raw = response.read()
        return json.loads(raw.decode("utf-8")) if raw else {}


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Create or update an Azure AI Search knowledge base from the existing blob knowledge source."
    )
    parser.add_argument("--knowledge-base-name", default="carib-climate-kb")
    parser.add_argument("--source-name", default="")
    parser.add_argument(
        "--env-file",
        default=str(PROJECT_ROOT / ".env"),
        help="Path to .env for updating FOUNDRY_KNOWLEDGE_BASE_NAME.",
    )
    args = parser.parse_args()

    env_path = Path(args.env_file).resolve()
    if load_dotenv is not None and env_path.exists():
        load_dotenv(env_path, override=False)

    search_endpoint = os.getenv("AZURE_SEARCH_ENDPOINT", "").rstrip("/")
    search_key = os.getenv("AZURE_SEARCH_ADMIN_KEY", "")

    if not search_endpoint or not search_key:
        print("AZURE_SEARCH_ENDPOINT or AZURE_SEARCH_ADMIN_KEY is missing from .env", file=sys.stderr)
        return 1

    try:
        knowledge_sources_url = f"{search_endpoint}/knowledgesources?{urlencode({'api-version': '2026-05-01-preview', '$select': 'name,kind'})}"
        sources_response = request_json("GET", knowledge_sources_url, search_key)
        sources = sources_response.get("value", [])
    except HTTPError as exc:
        print(f"Failed to list knowledge sources: HTTP {exc.code}", file=sys.stderr)
        print(exc.read().decode("utf-8", errors="ignore"), file=sys.stderr)
        return 1
    except URLError as exc:
        print(f"Failed to reach Azure AI Search: {exc}", file=sys.stderr)
        return 1

    print("Knowledge sources found:")
    for item in sources:
        print(f"- {item.get('name')} ({item.get('kind')})")

    source_name = args.source_name
    if not source_name:
        blob_sources = [item for item in sources if item.get("kind") == "azureBlob"]
        if len(blob_sources) == 1:
            source_name = blob_sources[0]["name"]
        elif len(blob_sources) > 1:
            print(
                "Multiple blob knowledge sources were found. Re-run with --source-name <name>.",
                file=sys.stderr,
            )
            return 2
        else:
            print(
                "No azureBlob knowledge source was found. Create or finish the blob knowledge source in Azure AI Search first.",
                file=sys.stderr,
            )
            return 2

    payload = {
        "name": args.knowledge_base_name,
        "description": "Knowledge base for Caribbean Climate Resilience Orchestrator.",
        "knowledgeSources": [{"name": source_name}],
        "encryptionKey": None,
    }

    try:
        kb_url = f"{search_endpoint}/knowledgebases/{args.knowledge_base_name}?{urlencode({'api-version': '2026-04-01'})}"
        request_json("PUT", kb_url, search_key, payload)
    except HTTPError as exc:
        print(f"Failed to create/update knowledge base: HTTP {exc.code}", file=sys.stderr)
        print(exc.read().decode("utf-8", errors="ignore"), file=sys.stderr)
        return 1
    except URLError as exc:
        print(f"Failed to reach Azure AI Search: {exc}", file=sys.stderr)
        return 1

    try:
        kb_list_url = f"{search_endpoint}/knowledgebases?{urlencode({'api-version': '2026-04-01', '$select': 'name'})}"
        kb_response = request_json("GET", kb_list_url, search_key)
        knowledge_bases = kb_response.get("value", [])
    except Exception:
        knowledge_bases = []

    print("")
    print(f"Knowledge base '{args.knowledge_base_name}' created or updated successfully.")
    print(f"Knowledge source used: {source_name}")
    if knowledge_bases:
        print("Knowledge bases now present:")
        for kb in knowledge_bases:
            print(f"- {kb.get('name')}")

    update_env_value(env_path, "FOUNDRY_KNOWLEDGE_BASE_NAME", args.knowledge_base_name)
    print(f"Updated {env_path} with FOUNDRY_KNOWLEDGE_BASE_NAME={args.knowledge_base_name}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
