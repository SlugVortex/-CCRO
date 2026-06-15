import axios from 'axios'
import type { DashboardResponse, HealthResponse, MetadataResponse, ScenarioResponse } from '@/types/climate'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  timeout: 15000,
})

export const climateApi = {
  async getHealth() {
    const { data } = await api.get<HealthResponse>('/health')
    return data
  },
  async getMetadata() {
    const { data } = await api.get<MetadataResponse>('/metadata')
    return data
  },
  async getDashboard(params: { country: string; horizon: number; hazards: string[] }) {
    const { data } = await api.get<DashboardResponse>('/dashboard', {
      params: {
        country: params.country,
        horizon: params.horizon,
        hazards: params.hazards.join(','),
      },
    })
    return data
  },
  async evaluateScenario(payload: {
    scenario_name: string
    country_code: string
    horizon_year: number
    hazards: string[]
    budget_musd: number
    goal: string
    selected_intervention_ids: string[]
  }) {
    const { data } = await api.post<ScenarioResponse>('/scenarios/evaluate', payload)
    return data
  },
}
