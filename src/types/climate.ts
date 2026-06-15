export type HazardType = 'hurricane' | 'flood' | 'sea_level'
export type GoalType = 'people' | 'infrastructure'

export type Citation = {
  label: string
  summary: string
  source_url: string
}

export type MapPosition = {
  x: number
  y: number
  w: number
  h: number
}

export type MapCoordinate = {
  lng: number
  lat: number
}

export type CountryOption = {
  code: string
  name: string
  subheading: string
}

export type InterventionOption = {
  id: string
  title: string
  description: string
  cost_musd: number
  impact: Record<string, number>
  applicable_tags: string[]
  benefit_tags: string[]
}

export type DataSourceStatus = {
  name: string
  type: string
  last_updated: string
  status: string
}

export type AgentLog = {
  timestamp: string
  agent: string
  status: string
  message: string
}

export type RegionRisk = {
  id: string
  name: string
  population: number
  hospital_count: number
  shelter_count: number
  critical_facilities: number
  risk_score: number
  baseline_risk_score?: number | null
  expected_loss_musd: number
  people_at_risk: number
  critical_facilities_at_risk: number
  risk_band: string
  tags: string[]
  map_position: MapPosition
  map_coordinate?: MapCoordinate
  drivers: string[]
  component_scores: Record<string, number>
  citations: Citation[]
}

export type DashboardSummary = {
  high_risk_regions: number
  people_at_risk: number
  critical_facilities_at_risk: number
  estimated_annual_loss_musd: number
  delta_vs_2030_pct: Record<string, number>
}

export type Guardrail = {
  title: string
  description: string
  status: string
}

export type OntologySummary = {
  entities: string[]
  relationships: string[]
  semantic_measures: string[]
}

export type HealthResponse = {
  status: string
  service: string
  environment: string
  azure_openai_enabled: boolean
  operating_mode: string
  service_statuses: Record<
    string,
    {
      configured: boolean
      active: boolean
      summary: string
    }
  >
}

export type MetadataResponse = {
  countries: CountryOption[]
  horizons: number[]
  hazards: HazardType[]
  optimization_goals: GoalType[]
  interventions: InterventionOption[]
  demo_scenario: {
    scenario_name: string
    country_code: string
    horizon_year: number
    hazards: HazardType[]
    budget_musd: number
    goal: GoalType
    selected_intervention_ids: string[]
  }
}

export type DashboardResponse = {
  country_code: string
  country_name: string
  horizon_year: number
  hazards: HazardType[]
  summary: DashboardSummary
  regions: RegionRisk[]
  interventions: InterventionOption[]
  data_sources: DataSourceStatus[]
  agent_logs: AgentLog[]
  ontology: OntologySummary
  guardrails: Guardrail[]
}

export type RecommendationItem = {
  rank: number
  id: string
  title: string
  rationale: string
  tags: string[]
  cost_musd: number
  risk_reduction_pct: number
  protected_population: number
  targeted_regions: string[]
}

export type ScenarioSummary = {
  budget_musd: number
  budget_used_musd: number
  budget_remaining_musd: number
  oversubscribed: boolean
  high_risk_regions_before: number
  high_risk_regions_after: number
  people_at_risk_before: number
  people_at_risk_after: number
  critical_facilities_before: number
  critical_facilities_after: number
  annual_loss_before_musd: number
  annual_loss_after_musd: number
  overall_risk_reduction_pct: number
}

export type ReportResponse = {
  executive_summary: string
  detailed_report_markdown: string
  citations: Citation[]
}

export type ScenarioResponse = {
  scenario_name: string
  country_code: string
  country_name: string
  horizon_year: number
  hazards: HazardType[]
  goal: GoalType
  selected_intervention_ids: string[]
  summary: ScenarioSummary
  baseline_regions: RegionRisk[]
  scenario_regions: RegionRisk[]
  recommendations: RecommendationItem[]
  report: ReportResponse
  agent_logs: AgentLog[]
}

export type ClimateFilters = {
  countryCode: string
  horizonYear: number
  hazards: HazardType[]
  budgetMusd: number
  goal: GoalType
  scenarioName: string
  selectedInterventionIds: string[]
}
