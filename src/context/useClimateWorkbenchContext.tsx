import { climateApi } from '@/api/climate'
import { createContext, startTransition, useContext, useEffect, useState, type ReactNode } from 'react'
import type {
  ClimateFilters,
  DashboardResponse,
  GoalType,
  HazardType,
  HealthResponse,
  MetadataResponse,
  ScenarioResponse,
} from '@/types/climate'

type ClimateWorkbenchContextType = {
  health: HealthResponse | null
  metadata: MetadataResponse | null
  dashboard: DashboardResponse | null
  scenario: ScenarioResponse | null
  filters: ClimateFilters
  loadingDashboard: boolean
  loadingScenario: boolean
  bootstrapping: boolean
  error: string | null
  setCountryCode: (countryCode: string) => void
  setHorizonYear: (horizonYear: number) => void
  setBudgetMusd: (budgetMusd: number) => void
  setGoal: (goal: GoalType) => void
  setScenarioName: (name: string) => void
  toggleHazard: (hazard: HazardType) => void
  toggleIntervention: (interventionId: string) => void
  refreshDashboard: (overrides?: Partial<ClimateFilters>) => Promise<void>
  runScenario: (overrides?: Partial<ClimateFilters>) => Promise<void>
  loadDemoScenario: () => Promise<void>
  resetScenarioSelections: () => void
}

const defaultFilters: ClimateFilters = {
  countryCode: 'JM',
  horizonYear: 2050,
  hazards: ['hurricane', 'flood', 'sea_level'],
  budgetMusd: 25,
  goal: 'people',
  scenarioName: 'Adaptive resilience plan',
  selectedInterventionIds: [],
}

const ClimateWorkbenchContext = createContext<ClimateWorkbenchContextType | undefined>(undefined)

export const ClimateWorkbenchProvider = ({ children }: { children: ReactNode }) => {
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [metadata, setMetadata] = useState<MetadataResponse | null>(null)
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null)
  const [scenario, setScenario] = useState<ScenarioResponse | null>(null)
  const [filters, setFilters] = useState<ClimateFilters>(defaultFilters)
  const [loadingDashboard, setLoadingDashboard] = useState(false)
  const [loadingScenario, setLoadingScenario] = useState(false)
  const [bootstrapping, setBootstrapping] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const mergeFilters = (overrides?: Partial<ClimateFilters>) => ({ ...filters, ...overrides })

  const refreshDashboard = async (overrides?: Partial<ClimateFilters>) => {
    const nextFilters = mergeFilters(overrides)
    setLoadingDashboard(true)
    setError(null)
    try {
      const data = await climateApi.getDashboard({
        country: nextFilters.countryCode,
        horizon: nextFilters.horizonYear,
        hazards: nextFilters.hazards,
      })
      startTransition(() => {
        setDashboard(data)
        setFilters(nextFilters)
      })
    } catch (requestError) {
      setError('The API is offline. Start the FastAPI service to unlock live scenario data.')
    } finally {
      setLoadingDashboard(false)
    }
  }

  const runScenario = async (overrides?: Partial<ClimateFilters>) => {
    const nextFilters = mergeFilters(overrides)
    setLoadingScenario(true)
    setError(null)
    try {
      const data = await climateApi.evaluateScenario({
        scenario_name: nextFilters.scenarioName,
        country_code: nextFilters.countryCode,
        horizon_year: nextFilters.horizonYear,
        hazards: nextFilters.hazards,
        budget_musd: nextFilters.budgetMusd,
        goal: nextFilters.goal,
        selected_intervention_ids: nextFilters.selectedInterventionIds,
      })
      startTransition(() => {
        setScenario(data)
        setFilters(nextFilters)
      })
    } catch (requestError) {
      setError('Scenario simulation failed. Check the backend logs or retry with the starter preset.')
    } finally {
      setLoadingScenario(false)
    }
  }

  const loadDemoScenario = async () => {
    if (!metadata) {
      return
    }
    const demo = metadata.demo_scenario
    const demoFilters: ClimateFilters = {
      countryCode: demo.country_code,
      horizonYear: demo.horizon_year,
      hazards: demo.hazards,
      budgetMusd: demo.budget_musd,
      goal: demo.goal,
      scenarioName: demo.scenario_name,
      selectedInterventionIds: demo.selected_intervention_ids,
    }
    setFilters(demoFilters)
    await refreshDashboard(demoFilters)
    await runScenario(demoFilters)
  }

  const resetScenarioSelections = () => {
    setScenario(null)
    setFilters((current) => ({
      ...current,
      selectedInterventionIds: [],
      budgetMusd: 25,
      goal: 'people',
      scenarioName: 'Adaptive resilience plan',
    }))
  }

  useEffect(() => {
    const bootstrap = async () => {
      setBootstrapping(true)
      try {
        const [healthData, metadataData] = await Promise.all([climateApi.getHealth(), climateApi.getMetadata()])
        startTransition(() => {
          setHealth(healthData)
          setMetadata(metadataData)
          setFilters((current) => ({
            ...current,
            countryCode: metadataData.demo_scenario.country_code,
            horizonYear: 2050,
          }))
        })
        await refreshDashboard({
          countryCode: metadataData.demo_scenario.country_code,
          horizonYear: 2050,
          hazards: metadataData.hazards,
        })
      } catch (requestError) {
        setError('Bootstrapping failed. The UI is ready, but it needs the API service to populate climate data.')
      } finally {
        setBootstrapping(false)
      }
    }

    void bootstrap()
  }, [])

  return (
    <ClimateWorkbenchContext.Provider
      value={{
        health,
        metadata,
        dashboard,
        scenario,
        filters,
        loadingDashboard,
        loadingScenario,
        bootstrapping,
        error,
        setCountryCode: (countryCode: string) => setFilters((current) => ({ ...current, countryCode })),
        setHorizonYear: (horizonYear: number) => setFilters((current) => ({ ...current, horizonYear })),
        setBudgetMusd: (budgetMusd: number) => setFilters((current) => ({ ...current, budgetMusd })),
        setGoal: (goal: GoalType) => setFilters((current) => ({ ...current, goal })),
        setScenarioName: (scenarioName: string) => setFilters((current) => ({ ...current, scenarioName })),
        toggleHazard: (hazard: HazardType) =>
          setFilters((current) => {
            const exists = current.hazards.includes(hazard)
            if (exists && current.hazards.length === 1) {
              return current
            }
            return {
              ...current,
              hazards: exists ? current.hazards.filter((item) => item !== hazard) : [...current.hazards, hazard],
            }
          }),
        toggleIntervention: (interventionId: string) =>
          setFilters((current) => {
            const exists = current.selectedInterventionIds.includes(interventionId)
            return {
              ...current,
              selectedInterventionIds: exists
                ? current.selectedInterventionIds.filter((item) => item !== interventionId)
                : [...current.selectedInterventionIds, interventionId],
            }
          }),
        refreshDashboard,
        runScenario,
        loadDemoScenario,
        resetScenarioSelections,
      }}>
      {children}
    </ClimateWorkbenchContext.Provider>
  )
}

export const useClimateWorkbench = () => {
  const context = useContext(ClimateWorkbenchContext)
  if (!context) {
    throw new Error('useClimateWorkbench must be used inside ClimateWorkbenchProvider')
  }
  return context
}
