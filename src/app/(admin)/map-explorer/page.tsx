import PageTitle from '@/components/PageTitle'
import RiskAtlas from '@/features/climate/components/RiskAtlas'
import { useClimateWorkbench } from '@/context/useClimateWorkbenchContext'
import { useEffect, useMemo, useState } from 'react'
import { Badge, Button, Card, CardBody, CardHeader, CardTitle, Col, Row, Table } from 'react-bootstrap'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

const componentScoreLabels: Record<string, string> = {
  hurricane: 'Hurricane stress',
  flood: 'Flood exposure',
  sea_level: 'Sea-level pressure',
  infra: 'Infrastructure stress',
  social: 'Social vulnerability',
}

const MapExplorerPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { dashboard, scenario, filters, refreshDashboard, runScenario, loadingDashboard, loadingScenario } = useClimateWorkbench()
  const mode = searchParams.get('mode') === 'scenario' ? 'scenario' : 'baseline'
  const regionFromQuery = searchParams.get('region') ?? undefined
  const [activeRegionId, setActiveRegionId] = useState<string | undefined>(regionFromQuery)

  const regions = mode === 'scenario' ? scenario?.scenario_regions ?? dashboard?.regions ?? [] : dashboard?.regions ?? []
  const selectedRegion = regions.find((region) => region.id === activeRegionId) ?? regions[0]
  const sortedRegions = useMemo(() => [...regions].sort((left, right) => right.risk_score - left.risk_score), [regions])
  const componentRows = useMemo(
    () =>
      selectedRegion
        ? Object.entries(selectedRegion.component_scores)
            .map(([key, value]) => ({
              key,
              label: componentScoreLabels[key] ?? key,
              value,
            }))
            .sort((left, right) => right.value - left.value)
        : [],
    [selectedRegion],
  )

  useEffect(() => {
    if (regionFromQuery) {
      setActiveRegionId(regionFromQuery)
    }
  }, [regionFromQuery])

  useEffect(() => {
    if (!selectedRegion && regions[0]) {
      setActiveRegionId(regions[0].id)
    }
  }, [regions, selectedRegion])

  useEffect(() => {
    if (!dashboard) {
      void refreshDashboard()
      return
    }

    if (mode === 'scenario' && !scenario) {
      void runScenario()
    }
  }, [dashboard, mode, refreshDashboard, runScenario, scenario])

  return (
    <>
      <PageTitle title="Map Explorer" />

      <Row className="g-4 mb-4">
        <Col xl={9}>
          <Card className="h-100">
            <CardHeader className="d-flex justify-content-between flex-wrap align-items-center gap-3">
              <div>
                <CardTitle as="h3" className="mb-1">
                  Regional Explorer
                </CardTitle>
                <p className="text-muted fw-semibold mb-0">
                  Full-screen atlas for region inspection, metric comparison, and focused review during a live briefing.
                </p>
              </div>
              <div className="d-flex gap-2">
                <Badge bg={mode === 'scenario' ? 'warning' : 'primary'}>{mode === 'scenario' ? 'Scenario Mode' : 'Baseline Mode'}</Badge>
                <Button variant="outline-secondary" size="sm" onClick={() => navigate(mode === 'scenario' ? '/scenario-builder' : '/dashboard')}>
                  Back to {mode === 'scenario' ? 'Scenario Builder' : 'Dashboard'}
                </Button>
              </div>
            </CardHeader>
            <CardBody>
              {regions.length ? (
                <RiskAtlas
                  regions={regions}
                  activeRegionId={selectedRegion?.id}
                  countryCode={dashboard?.country_code ?? filters.countryCode}
                  onSelect={setActiveRegionId}
                  mode={mode}
                  variant="expanded"
                />
              ) : (
                <div className="stormy-empty-state">
                  {loadingDashboard || loadingScenario ? 'Loading explorer map...' : 'No regional data is available yet.'}
                </div>
              )}
            </CardBody>
          </Card>
        </Col>

        <Col xl={3}>
          <Card className="h-100">
            <CardHeader>
              <CardTitle as="h4" className="mb-1">
                Explorer Notes
              </CardTitle>
              <p className="text-muted fw-semibold mb-0">Use this panel while recording to explain what the map is showing.</p>
            </CardHeader>
            <CardBody className="d-grid gap-3">
              <div className="stormy-summary-strip">
                <small className="text-muted d-block mb-1">Country</small>
                <strong>{dashboard?.country_name ?? 'Jamaica'}</strong>
              </div>
              <div className="stormy-summary-strip">
                <small className="text-muted d-block mb-1">Planning horizon</small>
                <strong>{filters.horizonYear}</strong>
              </div>
              <div className="stormy-summary-strip">
                <small className="text-muted d-block mb-1">Hazards</small>
                <strong>{filters.hazards.map((hazard) => hazard.replace('_', ' ')).join(', ')}</strong>
              </div>
              <div className="stormy-summary-strip">
                <small className="text-muted d-block mb-1">Selected region</small>
                <strong>{selectedRegion?.name ?? 'None selected'}</strong>
              </div>
              <div className="stormy-summary-strip">
                <small className="text-muted d-block mb-1">Best talking point</small>
                <p className="mb-0 text-muted">
                  Explain why the selected region ranks high, then transition into the scenario page to show how that risk can be reduced.
                </p>
              </div>
              <Link to="/recommendations" className="btn btn-primary btn-sm">
                Open Recommendations
              </Link>
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Row className="g-4">
        <Col lg={5}>
          <Card className="h-100">
            <CardHeader>
              <CardTitle as="h4" className="mb-1">
                Region Drivers
              </CardTitle>
              <p className="text-muted fw-semibold mb-0">Component scores behind the selected region.</p>
            </CardHeader>
            <CardBody className="p-0">
              <div className="table-responsive">
                <Table className="align-middle mb-0">
                  <thead>
                    <tr className="table-light">
                      <th>Component</th>
                      <th>Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {componentRows.map((row) => (
                      <tr key={row.key}>
                        <td>{row.label}</td>
                        <td className="fw-semibold">{row.value.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </CardBody>
          </Card>
        </Col>

        <Col lg={7}>
          <Card className="h-100">
            <CardHeader className="d-flex justify-content-between flex-wrap align-items-center gap-3">
              <div>
                <CardTitle as="h4" className="mb-1">
                  Region Ranking
                </CardTitle>
                <p className="text-muted fw-semibold mb-0">Top risk regions for the current map lens.</p>
              </div>
              <Badge bg="danger">{sortedRegions.filter((region) => region.risk_band === 'Critical').length} critical</Badge>
            </CardHeader>
            <CardBody className="p-0">
              <div className="table-responsive">
                <Table className="align-middle mb-0">
                  <thead>
                    <tr className="table-light">
                      <th>Region</th>
                      <th>Band</th>
                      <th>Risk</th>
                      <th>People at risk</th>
                      <th>Loss</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedRegions.map((region) => (
                      <tr key={region.id} className={region.id === selectedRegion?.id ? 'table-primary' : ''} onClick={() => setActiveRegionId(region.id)}>
                        <td className="fw-semibold">{region.name}</td>
                        <td>{region.risk_band}</td>
                        <td>{region.risk_score}</td>
                        <td>{region.people_at_risk.toLocaleString()}</td>
                        <td>${region.expected_loss_musd.toFixed(1)}M</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </>
  )
}

export default MapExplorerPage
