# Data Sources And Climate Planning Ontology

The project combines structured exposure data, adaptation planning logic, and document grounding.

## Data sources

### NOAA IBTrACS Atlantic hurricane archive

- Type: Historical storm tracks
- Last updated: 2026-06-08
- Status: Healthy

### IPCC AR6 sea-level scenarios

- Type: Projection dataset
- Last updated: 2026-06-03
- Status: Healthy

### WorldPop + national census snapshots

- Type: Population and vulnerability
- Last updated: 2026-06-06
- Status: Healthy

### Critical infrastructure registry

- Type: Hospitals, roads, shelters
- Last updated: 2026-06-09
- Status: Healthy

## Ontology

### Entities

- Parish
- Hospital
- Shelter
- RoadSegment
- FloodZone
- CoastalCommunity

### Relationships

- Parish is_at_risk_from FloodZone
- Hospital serves_population Parish
- RoadSegment supports_evacuation CoastalCommunity
- Shelter is_in Parish
- RoadSegment depends_on FloodZone

### Semantic measures

- risk_score
- expected_annual_loss
- critical_facility_exposure
- protected_population
