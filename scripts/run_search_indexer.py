from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

import httpx

try:
    from dotenv import load_dotenv
except ImportError:  # pragma: no cover
    load_dotenv = None


PROJECT_ROOT = Path(__file__).resolve().parents[1]


def load_environment(env_file: str) -> None:
    if load_dotenv is not None:
        load_dotenv(Path(env_file).resolve(), override=False)


def call_search(method: str, url: str, api_key: str) -> None:
    response = httpx.request(
        method,
        url,
        headers={"api-key": api_key, "Content-Type": "application/json"},
        timeout=20.0,
    )
    response.raise_for_status()


def main() -> int:
    parser = argparse.ArgumentParser(description="Reset and/or run the Azure AI Search indexer for the climate knowledge base.")
    parser.add_argument("--indexer-name", default="carib-climate-blob-ks-indexer")
    parser.add_argument("--reset", action="store_true", help="Reset the indexer before running it.")
    parser.add_argument("--env-file", default=str(PROJECT_ROOT / ".env"))
    args = parser.parse_args()

    load_environment(args.env_file)
    endpoint = os.getenv("AZURE_SEARCH_ENDPOINT", "").rstrip("/")
    api_key = os.getenv("AZURE_SEARCH_ADMIN_KEY", "")

    if not endpoint or not api_key:
        print("AZURE_SEARCH_ENDPOINT or AZURE_SEARCH_ADMIN_KEY is missing.", file=sys.stderr)
        return 1

    indexer_url = f"{endpoint}/indexers/{args.indexer_name}"

    try:
        if args.reset:
            call_search("POST", f"{indexer_url}/reset?api-version=2023-11-01", api_key)
            print(f"Reset indexer: {args.indexer_name}")

        call_search("POST", f"{indexer_url}/run?api-version=2023-11-01", api_key)
    except httpx.HTTPStatusError as exc:
        print(f"Search API returned HTTP {exc.response.status_code}.", file=sys.stderr)
        print(exc.response.text, file=sys.stderr)
        return 1
    except httpx.HTTPError as exc:
        print(f"Failed to reach Azure AI Search: {exc}", file=sys.stderr)
        return 1

    print(f"Triggered indexer run: {args.indexer_name}")
    print("Give Search a minute, then reopen the app and re-run the scenario to see refreshed grounding.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
