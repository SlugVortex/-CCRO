from __future__ import annotations

import csv
import json
from collections import defaultdict
from dataclasses import dataclass
from io import StringIO
from pathlib import Path

import httpx


PROJECT_ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = PROJECT_ROOT / "data" / "live"

WORLD_BANK_URL = "https://api.worldbank.org/v2/country/JAM;BRB;DMA/indicator/{indicator}?format=json&per_page=200"
IBTRACS_URL = (
    "https://www.ncei.noaa.gov/data/"
    "international-best-track-archive-for-climate-stewardship-ibtracs/"
    "v04r01/access/csv/ibtracs.NA.list.v04r01.csv"
)


@dataclass(frozen=True)
class CountryBounds:
    code: str
    name: str
    min_lat: float
    max_lat: float
    min_lon: float
    max_lon: float


COUNTRY_BOUNDS = [
    CountryBounds("JM", "Jamaica", 17.6, 18.6, -78.6, -76.0),
    CountryBounds("BB", "Barbados", 13.0, 13.4, -59.7, -59.4),
    CountryBounds("DM", "Dominica", 15.1, 15.7, -61.6, -61.1),
]


def fetch_json(client: httpx.Client, indicator: str) -> dict[str, object]:
    response = client.get(WORLD_BANK_URL.format(indicator=indicator), timeout=30.0)
    response.raise_for_status()
    payload = response.json()
    return {"indicator": indicator, "payload": payload}


def latest_values(world_bank_payload: dict[str, object]) -> list[dict[str, object]]:
    entries = world_bank_payload["payload"][1]
    latest_by_country: dict[str, dict[str, object]] = {}
    for entry in entries:
        if entry["value"] is None:
            continue
        country_code = entry["countryiso3code"]
        year = int(entry["date"])
        previous = latest_by_country.get(country_code)
        if previous is None or year > previous["year"]:
            latest_by_country[country_code] = {
                "country_code": country_code,
                "country_name": entry["country"]["value"],
                "year": year,
                "value": entry["value"],
            }
    return list(latest_by_country.values())


def fetch_ibtracs_summary(client: httpx.Client) -> dict[str, object]:
    response = client.get(IBTRACS_URL, timeout=120.0)
    response.raise_for_status()

    storms_by_country: dict[str, set[str]] = defaultdict(set)
    yearly_hits: dict[str, dict[int, int]] = defaultdict(lambda: defaultdict(int))

    reader = csv.DictReader(StringIO(response.text))
    for row in reader:
        season = row.get("SEASON")
        lat = row.get("LAT")
        lon = row.get("LON")
        sid = row.get("SID")
        if not season or not lat or not lon or not sid:
            continue

        try:
            year = int(float(season))
        except ValueError:
            continue
        if year < 2005:
            continue

        point_lat = float(lat)
        point_lon = float(lon)

        for bounds in COUNTRY_BOUNDS:
            if bounds.min_lat <= point_lat <= bounds.max_lat and bounds.min_lon <= point_lon <= bounds.max_lon:
                storms_by_country[bounds.code].add(sid)
                yearly_hits[bounds.code][year] += 1

    return {
        "source": IBTRACS_URL,
        "countries": [
            {
                "country_code": bounds.code,
                "country_name": bounds.name,
                "storms_near_country_since_2005": len(storms_by_country[bounds.code]),
                "yearly_track_hits": dict(sorted(yearly_hits[bounds.code].items())),
            }
            for bounds in COUNTRY_BOUNDS
        ],
    }


def write_json(path: Path, payload: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    try:
        path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    except PermissionError as exc:
        raise SystemExit(
            f"Permission denied writing {path}.\n"
            "If you are running from WSL on /mnt/z, re-run this script from Windows Python or use cmd.exe /c py ..."
        ) from exc


def main() -> int:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    with httpx.Client(follow_redirects=True) as client:
        population = fetch_json(client, "SP.POP.TOTL")
        gdp = fetch_json(client, "NY.GDP.MKTP.CD")
        ibtracs = fetch_ibtracs_summary(client)

    write_json(OUTPUT_DIR / "world_bank_population_latest.json", latest_values(population))
    write_json(OUTPUT_DIR / "world_bank_gdp_latest.json", latest_values(gdp))
    write_json(OUTPUT_DIR / "ibtracs_country_summary.json", ibtracs)

    print(f"Live reference data written to {OUTPUT_DIR}")
    print("- world_bank_population_latest.json")
    print("- world_bank_gdp_latest.json")
    print("- ibtracs_country_summary.json")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
