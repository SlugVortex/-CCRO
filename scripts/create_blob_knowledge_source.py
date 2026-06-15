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


def build_connection_string(account_name: str, account_key: str) -> str:
    return (
        f"DefaultEndpointsProtocol=https;"
        f"AccountName={account_name};"
        f"AccountKey={account_key};"
        "EndpointSuffix=core.windows.net"
    )


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Create or update the Azure AI Search blob knowledge source used by the climate knowledge base."
    )
    parser.add_argument("--knowledge-source-name", default="carib-climate-blob-ks")
    parser.add_argument("--storage-account-name", default="caribclimatestrorage")
    parser.add_argument("--container-name", default="carib-climate-blob")
    parser.add_argument("--storage-account-key", default=os.getenv("AZ_STORAGE_ACCOUNT_KEY", ""))
    parser.add_argument(
        "--description",
        default="Blob knowledge source for Caribbean Climate Resilience Orchestrator.",
    )
    parser.add_argument(
        "--env-file",
        default=str(PROJECT_ROOT / ".env"),
        help="Path to .env for loading AZURE_SEARCH settings.",
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

    if not args.storage_account_key:
        print(
            "Missing storage account key. Pass --storage-account-key or set AZ_STORAGE_ACCOUNT_KEY.",
            file=sys.stderr,
        )
        return 1

    payload = {
        "name": args.knowledge_source_name,
        "kind": "azureBlob",
        "description": args.description,
        "encryptionKey": None,
        "azureBlobParameters": {
            "connectionString": build_connection_string(args.storage_account_name, args.storage_account_key),
            "containerName": args.container_name,
            "folderPath": None,
            "isADLSGen2": False,
        },
    }

    url = (
        f"{search_endpoint}/knowledgesources/{args.knowledge_source_name}?"
        f"{urlencode({'api-version': '2026-04-01'})}"
    )

    try:
        response = request_json("PUT", url, search_key, payload)
    except HTTPError as exc:
        print(f"Failed to create/update blob knowledge source: HTTP {exc.code}", file=sys.stderr)
        print(exc.read().decode("utf-8", errors="ignore"), file=sys.stderr)
        return 1
    except URLError as exc:
        print(f"Failed to reach Azure AI Search: {exc}", file=sys.stderr)
        return 1

    print(f"Knowledge source '{args.knowledge_source_name}' created or updated successfully.")
    print(f"Container: {args.container_name}")
    created = response.get("azureBlobParameters", {}).get("createdResources", {})
    if created:
        print("Generated search resources:")
        for key, value in created.items():
            print(f"- {key}: {value}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
