import PageTitle from '@/components/PageTitle'
import ClimateMetricCard from '@/features/climate/components/ClimateMetricCard'
import { useClimateWorkbench } from '@/context/useClimateWorkbenchContext'
import AgentLogTimeline from '@/features/climate/components/AgentLogTimeline'
import RiskAtlas from '@/features/climate/components/RiskAtlas'
import type { HazardType, RegionRisk } from '@/types/climate'
import type { ApexOptions } from 'apexcharts'
import { useEffect, useMemo, useState } from 'react'
import Chart from 'react-apexcharts'
import { Alert, Badge, Button, Card, CardBody, CardHeader, CardTitle, Col, Form, Row, Spinner, Table } from 'react-bootstrap'
import { Link, useNavigate } from 'react-router-dom'

const DashboardPage = () => {
  const navigate = useNavigate()
  const {
    dashboard,
    metadata,
    filters,
    loadingDashboard,
    error,
    setCountryCode,
    setHorizonYear,
    toggleHazard,
    refreshDashboard,
    loadDemoScenario,
  } = useClimateWorkbench()
  const [activeRegionId, setActiveRegionId] = useState<string>()
  const [lastRefreshLabel, setLastRefreshLabel] = useState('Refreshes the atlas, metrics, and hotspot table using the current planning lens.')

  useEffect(() => {
    if (dashboard?.regions[0]) {
      setActiveRegionId(dashboard.regions[0].id)
    }
  }, [dashboard])

  const topRegions = useMemo(
    () => [...(dashboard?.regions ?? [])].sort((left, right) => right.risk_score - left.risk_score).slice(0, 5),
    [dashboard?.regions],
  )

  const chartOptions: ApexOptions = {
    chart: {
      toolbar: { show: false },
      foreColor: '#6c757d',
    },
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 4,
        barHeight: '48%',
      },
    },
    colors: ['#dc3545'],
    xaxis: {
      categories: topRegions.map((region) => region.name),
      max: 100,
    },
    grid: {
      borderColor: 'rgba(108, 117, 125, 0.15)',
    },
    dataLabels: {
      enabled: false,
    },
    tooltip: {
      theme: 'light',
    },
  }

  const chartSeries = [
    {
      name: 'Risk score',
      data: topRegions.map((region) => region.risk_score),
    },
  ]

  const handleRunMap = async () => {
    await refreshDashboard()
    setLastRefreshLabel(`Refreshed atlas and hotspot metrics at ${new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}.`)
  }

  const handleLoadScenarioBrief = async () => {
    await loadDemoScenario()
    navigate('/recommendations')
  }

  return (
    <>
      <PageTitle title="Risk Map Dashboard" />

      {error ? (
        <Alert variant="warning" className="mb-4">
          {error}
        </Alert>
      ) : null}

      <Row className="g-3 mb-4">
        <Col xl={3} md={6}>
          <ClimateMetricCard
            title="High-Risk Parishes"
            value={String(dashboard?.summary.high_risk_regions ?? 0)}
            changeText={formatDelta(dashboard?.summary.delta_vs_2030_pct.high_risk_regions ?? 0, 'vs 2030 baseline')}
            changeVariant={deltaVariant(dashboard?.summary.delta_vs_2030_pct.high_risk_regions ?? 0, true)}
            icon="mdi:map-marker-alert-outline"
            variant="danger"
            progress={Math.min(100, ((dashboard?.summary.high_risk_regions ?? 0) / 12) * 100)}
            footnote="Parishes above the critical response threshold."
          />
        </Col>
        <Col xl={3} md={6}>
          <ClimateMetricCard
            title="People At Risk"
            value={(dashboard?.summary.people_at_risk ?? 0).toLocaleString()}
            changeText={formatDelta(dashboard?.summary.delta_vs_2030_pct.people_at_risk ?? 0, 'vs 2030 baseline')}
            changeVariant={deltaVariant(dashboard?.summary.delta_vs_2030_pct.people_at_risk ?? 0, true)}
            icon="mdi:account-group-outline"
            variant="warning"
            progress={Math.min(100, ((dashboard?.summary.people_at_risk ?? 0) / 2000000) * 100)}
            footnote="Population inside modeled hurricane and flood exposure zones."
          />
        </Col>
        <Col xl={3} md={6}>
          <ClimateMetricCard
            title="Critical Facilities"
            value={String(dashboard?.summary.critical_facilities_at_risk ?? 0)}
            changeText={formatDelta(dashboard?.summary.delta_vs_2030_pct.critical_facilities_at_risk ?? 0, 'vs 2030 baseline')}
            changeVariant={deltaVariant(dashboard?.summary.delta_vs_2030_pct.critical_facilities_at_risk ?? 0, true)}
            icon="mdi:hospital-box-outline"
            variant="primary"
            progress={Math.min(100, ((dashboard?.summary.critical_facilities_at_risk ?? 0) / 120) * 100)}
            footnote="Hospitals, shelters, and key public assets in harm's way."
          />
        </Col>
        <Col xl={3} md={6}>
          <ClimateMetricCard
            title="Estimated Annual Loss"
            value={`$${(dashboard?.summary.estimated_annual_loss_musd ?? 0).toFixed(1)}M`}
            changeText={formatDelta(dashboard?.summary.delta_vs_2030_pct.estimated_annual_loss_musd ?? 0, 'vs 2030 baseline')}
            changeVariant={deltaVariant(dashboard?.summary.delta_vs_2030_pct.estimated_annual_loss_musd ?? 0, true)}
            icon="mdi:cash-fast"
            variant="info"
            progress={Math.min(100, ((dashboard?.summary.estimated_annual_loss_musd ?? 0) / 1600) * 100)}
            footnote="Modeled annualized loss across the active planning horizon."
          />
        </Col>
      </Row>

      <Row className="g-4 mb-4">
        <Col lg={4}>
          <Card className="h-100">
            <CardHeader>
              <CardTitle as="h4" className="mb-1">
                Planning Lens
              </CardTitle>
              <p className="text-muted fw-semibold mb-0">Set the geography, time horizon, and hazard mix for the reasoning run.</p>
            </CardHeader>
            <CardBody>
              <Form className="d-grid gap-3">
                <Form.Group>
                  <Form.Label>Country</Form.Label>
                  <Form.Select value={filters.countryCode} onChange={(event) => setCountryCode(event.target.value)}>
                    {(metadata?.countries ?? []).map((country) => (
                      <option key={country.code} value={country.code}>
                        {country.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group>
                  <Form.Label>Time Horizon</Form.Label>
                  <Form.Select
                    value={filters.horizonYear}
                    onChange={(event) => setHorizonYear(Number(event.target.value))}>
                    {(metadata?.horizons ?? []).map((horizon) => (
                      <option key={horizon} value={horizon}>
                        {horizon}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <div>
                  <Form.Label>Hazard Focus</Form.Label>
                  <div className="stormy-pill-wrap">
                    {(metadata?.hazards ?? []).map((hazard) => {
                      const active = filters.hazards.includes(hazard)
                      return (
                        <Button
                          key={hazard}
                          variant={active ? 'primary' : 'outline-secondary'}
                          size="sm"
                          onClick={() => toggleHazard(hazard)}>
                          {hazardLabel[hazard]}
                        </Button>
                      )
                    })}
                  </div>
                </div>

                <div className="d-grid gap-2">
                  <Button variant="primary" onClick={() => void handleRunMap()} disabled={loadingDashboard}>
                    {loadingDashboard ? 'Refreshing atlas...' : 'Run Risk Lens'}
                  </Button>
                  <Button variant="outline-primary" onClick={() => void handleLoadScenarioBrief()}>
                    Open Scenario Brief
                  </Button>
                  <small className="stormy-feedback-note">{lastRefreshLabel}</small>
                </div>
              </Form>
            </CardBody>
          </Card>
        </Col>

        <Col lg={8}>
          <Card className="h-100">
            <CardHeader className="d-flex justify-content-between flex-wrap align-items-center gap-3">
              <div>
                <CardTitle as="h4" className="mb-1">
                  Regional Risk Atlas
                </CardTitle>
                <p className="text-muted fw-semibold mb-0">Inspect parish-level exposure, loss estimates, and infrastructure stress.</p>
              </div>
              <div className="d-flex align-items-center gap-2">
                <span className="badge bg-primary-subtle text-primary text-uppercase">Foundry pipeline</span>
                {loadingDashboard ? <Spinner animation="border" size="sm" /> : null}
              </div>
            </CardHeader>
            <CardBody>
              <RiskAtlas
                regions={dashboard?.regions ?? []}
                activeRegionId={activeRegionId}
                countryCode={dashboard?.country_code ?? filters.countryCode}
                onSelect={setActiveRegionId}
                mode="baseline"
                onOpenLargeMap={() => navigate(`/map-explorer?mode=baseline&region=${activeRegionId ?? dashboard?.regions?.[0]?.id ?? ''}`)}
              />
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Row className="g-4 mb-4">
        <Col lg={8}>
          <Card className="h-100">
            <CardHeader className="d-flex justify-content-between flex-wrap align-items-center gap-3">
              <div>
                <CardTitle as="h4" className="mb-1">
                  Highest-Risk Parishes
                </CardTitle>
                <p className="text-muted fw-semibold mb-0">Ranked exposure, expected losses, and climate drivers behind the score.</p>
              </div>
              <Link to="/scenario-builder" className="btn btn-outline-primary btn-sm">
                Open Scenario Builder
              </Link>
            </CardHeader>
            <CardBody className="p-0">
              <div className="table-responsive">
                <Table className="align-middle mb-0">
                  <thead>
                    <tr className="table-light">
                      <th>Parish</th>
                      <th>Risk Band</th>
                      <th>People at Risk</th>
                      <th>Annual Loss</th>
                      <th>Primary Drivers</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topRegions.map((region) => (
                      <tr key={region.id}>
                        <td>
                          <div>
                            <h5 className="mb-1">{region.name}</h5>
                            <p className="text-muted fs-13 mb-0">{region.critical_facilities} critical facilities tracked</p>
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${bandClass(region.risk_band)}`}>{region.risk_band}</span>
                        </td>
                        <td>{region.people_at_risk.toLocaleString()}</td>
                        <td className="fw-semibold text-danger">${region.expected_loss_musd.toFixed(1)}M</td>
                        <td>
                          <div className="stormy-tag-row mt-0">
                            {region.drivers.slice(0, 2).map((driver) => (
                              <span key={driver}>{driver}</span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </CardBody>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="h-100">
            <CardHeader>
              <CardTitle as="h4" className="mb-1">
                Agent Chain
              </CardTitle>
              <p className="text-muted fw-semibold mb-0">Live reasoning trace across ingestion, ontology, risk, scenario, and recommendation steps.</p>
            </CardHeader>
            <CardBody>
              <div className="d-flex flex-wrap gap-2 mb-3">
                {(dashboard?.guardrails ?? []).slice(0, 2).map((guardrail) => (
                  <Badge key={guardrail.title} bg="success">
                    {guardrail.status}
                  </Badge>
                ))}
              </div>
              <AgentLogTimeline logs={(dashboard?.agent_logs ?? []).slice(0, 5)} />
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Row className="g-4">
        <Col lg={6}>
          <Card className="h-100">
            <CardHeader>
              <CardTitle as="h4" className="mb-1">
                Source Freshness
              </CardTitle>
              <p className="text-muted fw-semibold mb-0">Operational status for the climate data feeds powering the workbench.</p>
            </CardHeader>
            <CardBody className="p-0">
              <div className="table-responsive">
                <Table className="align-middle mb-0">
                  <thead>
                    <tr className="table-light">
                      <th>Source</th>
                      <th>Type</th>
                      <th>Last Updated</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(dashboard?.data_sources ?? []).map((source) => (
                      <tr key={source.name}>
                        <td className="fw-semibold">{source.name}</td>
                        <td>{source.type}</td>
                        <td>{source.last_updated}</td>
                        <td>
                          <span className={`badge ${source.status === 'Healthy' ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning'}`}>
                            {source.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </CardBody>
          </Card>
        </Col>

        <Col lg={6}>
          <Card className="h-100">
            <CardHeader>
              <CardTitle as="h4" className="mb-1">
                Exposure Ranking
              </CardTitle>
              <p className="text-muted fw-semibold mb-0">Quick comparison of the top five parishes by composite climate risk score.</p>
            </CardHeader>
            <CardBody>
              <Chart type="bar" height={286} options={chartOptions} series={chartSeries} />
            </CardBody>
          </Card>
        </Col>
      </Row>
    </>
  )
}

const hazardLabel: Record<HazardType, string> = {
  hurricane: 'Hurricanes',
  flood: 'Flood',
  sea_level: 'Sea-Level Rise',
}

const formatDelta = (delta: number, suffix: string) => `${delta >= 0 ? '+' : '-'}${Math.abs(delta).toFixed(1)}% ${suffix}`

const deltaVariant = (delta: number, positiveIsBad: boolean) => {
  if (delta === 0) {
    return 'primary'
  }
  if (positiveIsBad) {
    return delta > 0 ? 'danger' : 'success'
  }
  return delta > 0 ? 'success' : 'danger'
}

const bandClass = (riskBand: RegionRisk['risk_band']) => {
  switch (riskBand) {
    case 'Critical':
      return 'bg-danger-subtle text-danger'
    case 'High':
      return 'bg-warning-subtle text-warning'
    case 'Moderate':
      return 'bg-primary-subtle text-primary'
    case 'Watch':
      return 'bg-info-subtle text-info'
    default:
      return 'bg-success-subtle text-success'
  }
}

export default DashboardPage
