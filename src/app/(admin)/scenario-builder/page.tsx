import PageTitle from '@/components/PageTitle'
import ClimateMetricCard from '@/features/climate/components/ClimateMetricCard'
import { useClimateWorkbench } from '@/context/useClimateWorkbenchContext'
import RiskAtlas from '@/features/climate/components/RiskAtlas'
import type { ApexOptions } from 'apexcharts'
import { useEffect, useMemo, useState } from 'react'
import Chart from 'react-apexcharts'
import { Button, Card, CardBody, CardHeader, CardTitle, Col, Form, ProgressBar, Row, Table } from 'react-bootstrap'
import { Link, useNavigate } from 'react-router-dom'

const ScenarioBuilderPage = () => {
  const navigate = useNavigate()
  const {
    metadata,
    dashboard,
    scenario,
    filters,
    loadingScenario,
    setScenarioName,
    setBudgetMusd,
    setGoal,
    toggleIntervention,
    runScenario,
    loadDemoScenario,
    resetScenarioSelections,
  } = useClimateWorkbench()
  const [activeRegionId, setActiveRegionId] = useState<string>()

  useEffect(() => {
    const baseline = scenario?.scenario_regions[0] ?? dashboard?.regions?.[0]
    if (baseline) {
      setActiveRegionId(baseline.id)
    }
  }, [dashboard, scenario])

  const selectedActions = useMemo(
    () => (metadata?.interventions ?? []).filter((item) => filters.selectedInterventionIds.includes(item.id)),
    [filters.selectedInterventionIds, metadata?.interventions],
  )
  const selectedCost = selectedActions.reduce((total, action) => total + action.cost_musd, 0)
  const utilization = Math.min(100, (selectedCost / Math.max(filters.budgetMusd, 1)) * 100)
  const comparisonRows =
    scenario?.scenario_regions
      .map((region) => ({
        name: region.name,
        current: region.risk_score,
        baseline: region.baseline_risk_score ?? region.risk_score,
        delta: (region.baseline_risk_score ?? region.risk_score) - region.risk_score,
      }))
      .sort((left, right) => right.delta - left.delta)
      .slice(0, 5) ?? []
  const leadRegion = scenario?.scenario_regions
    ? [...scenario.scenario_regions].sort((left, right) => right.risk_score - left.risk_score)[0]
    : undefined

  const comparisonOptions: ApexOptions = {
    chart: {
      toolbar: { show: false },
      foreColor: '#6c757d',
    },
    plotOptions: {
      bar: { horizontal: false, borderRadius: 4, columnWidth: '42%' },
    },
    colors: ['#fd7e14', '#20c997'],
    xaxis: {
      categories: comparisonRows.map((item) => item.name),
    },
    grid: {
      borderColor: 'rgba(108, 117, 125, 0.15)',
    },
    dataLabels: {
      enabled: false,
    },
    tooltip: { theme: 'light' },
  }

  const comparisonSeries = [
    {
      name: 'Baseline',
      data: comparisonRows.map((item) => item.baseline),
    },
    {
      name: 'Scenario',
      data: comparisonRows.map((item) => item.current),
    },
  ]

  return (
    <>
      <PageTitle title="Scenario Builder" />

      <Row className="g-3 mb-4">
        <Col xl={3} md={6}>
          <ClimateMetricCard
            title="Selected Actions"
            value={String(filters.selectedInterventionIds.length)}
            changeText={selectedActions.length ? 'Package is active' : 'Choose your first intervention'}
            changeVariant={selectedActions.length ? 'success' : 'warning'}
            icon="mdi:clipboard-check-outline"
            variant="primary"
            progress={Math.min(100, (filters.selectedInterventionIds.length / Math.max(metadata?.interventions.length ?? 1, 1)) * 100)}
            footnote="Mix structural, social, and nature-based actions."
          />
        </Col>
        <Col xl={3} md={6}>
          <ClimateMetricCard
            title="Budget Used"
            value={`$${selectedCost.toFixed(1)}M`}
            changeText={`${Math.max(filters.budgetMusd - selectedCost, 0).toFixed(1)}M remaining`}
            changeVariant={selectedCost > filters.budgetMusd ? 'danger' : 'success'}
            icon="mdi:cash-multiple"
            variant="warning"
            progress={utilization}
            footnote={`Budget ceiling set to $${filters.budgetMusd.toFixed(0)}M.`}
          />
        </Col>
        <Col xl={3} md={6}>
          <ClimateMetricCard
            title="Optimization Goal"
            value={filters.goal === 'people' ? 'People' : 'Infrastructure'}
            changeText={filters.goal === 'people' ? 'Population protection priority' : 'Asset continuity priority'}
            changeVariant="info"
            icon="mdi:target-variant"
            variant="info"
            progress={filters.goal === 'people' ? 72 : 64}
            footnote={`${filters.horizonYear} planning horizon for ${dashboard?.country_name ?? 'the active country'}.`}
          />
        </Col>
        <Col xl={3} md={6}>
          <ClimateMetricCard
            title="Modeled Risk Reduction"
            value={scenario ? `${scenario.summary.overall_risk_reduction_pct.toFixed(1)}%` : 'Pending'}
            changeText={scenario ? `${scenario.summary.high_risk_regions_after} high-risk parishes remain` : 'Run the simulation to compare outcomes'}
            changeVariant={scenario ? 'success' : 'primary'}
            icon="mdi:chart-line-variant"
            variant="success"
            progress={scenario ? Math.min(100, scenario.summary.overall_risk_reduction_pct * 4) : 18}
            footnote="Computed from the current intervention mix."
          />
        </Col>
      </Row>

      <Row className="g-4 mb-4">
        <Col xl={5}>
          <Card className="h-100">
            <CardHeader className="d-flex justify-content-between flex-wrap align-items-center gap-3">
              <div>
                <CardTitle as="h4" className="mb-1">
                  Configure Interventions
                </CardTitle>
                <p className="text-muted fw-semibold mb-0">Build a ministerial package and keep it inside budget.</p>
              </div>
              <Button variant="outline-primary" size="sm" onClick={() => void loadDemoScenario()}>
                Load Starter Plan
              </Button>
            </CardHeader>

            <CardBody>
              <Form className="d-grid gap-3">
                <Form.Group>
                  <Form.Label>Scenario Name</Form.Label>
                  <Form.Control value={filters.scenarioName} onChange={(event) => setScenarioName(event.target.value)} />
                </Form.Group>

                <div>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <Form.Label className="mb-0">Budget</Form.Label>
                    <strong>${filters.budgetMusd.toFixed(0)}M</strong>
                  </div>
                  <Form.Range
                    min={5}
                    max={60}
                    step={1}
                    value={filters.budgetMusd}
                    onChange={(event) => setBudgetMusd(Number(event.target.value))}
                  />
                  <ProgressBar now={utilization} variant={selectedCost > filters.budgetMusd ? 'danger' : 'success'} className="mt-2" />
                  <small className="text-muted">Using ${selectedCost.toFixed(1)}M of the available budget.</small>
                </div>

                <div>
                  <Form.Label>Optimization Goal</Form.Label>
                  <div className="stormy-pill-wrap">
                    <Button variant={filters.goal === 'people' ? 'primary' : 'outline-secondary'} size="sm" onClick={() => setGoal('people')}>
                      Minimize people at risk
                    </Button>
                    <Button
                      variant={filters.goal === 'infrastructure' ? 'primary' : 'outline-secondary'}
                      size="sm"
                      onClick={() => setGoal('infrastructure')}>
                      Minimize infrastructure risk
                    </Button>
                  </div>
                </div>

                <div className="stormy-intervention-stack">
                  {(metadata?.interventions ?? []).map((intervention) => {
                    const selected = filters.selectedInterventionIds.includes(intervention.id)
                    return (
                      <button
                        key={intervention.id}
                        type="button"
                        className={`stormy-intervention-card ${selected ? 'is-selected' : ''}`}
                        onClick={() => toggleIntervention(intervention.id)}>
                        <div className="d-flex justify-content-between align-items-start gap-3">
                          <div>
                            <strong>{intervention.title}</strong>
                            <p>{intervention.description}</p>
                          </div>
                          <span className={`badge ${selected ? 'bg-danger-subtle text-danger' : 'bg-light text-dark'}`}>
                            ${intervention.cost_musd.toFixed(1)}M
                          </span>
                        </div>
                        <div className="stormy-tag-row">
                          {intervention.benefit_tags.map((tag) => (
                            <span key={tag}>{tag}</span>
                          ))}
                        </div>
                      </button>
                    )
                  })}
                </div>

                <div className="d-grid gap-2">
                  <Button variant="primary" onClick={() => void runScenario()} disabled={loadingScenario}>
                    {loadingScenario ? 'Simulating scenario...' : 'Simulate Scenario'}
                  </Button>
                  <Button variant="outline-secondary" onClick={resetScenarioSelections}>
                    Reset Package
                  </Button>
                </div>
              </Form>
            </CardBody>
          </Card>
        </Col>

        <Col xl={7}>
          <Card className="h-100">
            <CardHeader className="d-flex justify-content-between flex-wrap align-items-center gap-3">
              <div>
                <CardTitle as="h4" className="mb-1">
                  Projected Effect
                </CardTitle>
                <p className="text-muted fw-semibold mb-0">Compare the baseline map with the post-intervention risk posture.</p>
              </div>
              <Link to="/recommendations" className="btn btn-outline-primary btn-sm">
                Open Recommendations
              </Link>
            </CardHeader>
            <CardBody>
              {scenario ? (
                <>
                  <Row className="g-3 mb-3">
                    <Col md={4}>
                      <MiniMetric
                        label="High-Risk Parishes"
                        value={`${scenario.summary.high_risk_regions_after}`}
                        note={`Down from ${scenario.summary.high_risk_regions_before}`}
                      />
                    </Col>
                    <Col md={4}>
                      <MiniMetric
                        label="People At Risk"
                        value={scenario.summary.people_at_risk_after.toLocaleString()}
                        note={`Down from ${scenario.summary.people_at_risk_before.toLocaleString()}`}
                      />
                    </Col>
                    <Col md={4}>
                      <MiniMetric
                        label="Annual Loss"
                        value={`$${scenario.summary.annual_loss_after_musd.toFixed(1)}M`}
                        note={`Down from $${scenario.summary.annual_loss_before_musd.toFixed(1)}M`}
                      />
                    </Col>
                  </Row>

                  <RiskAtlas
                    regions={scenario.scenario_regions}
                    activeRegionId={activeRegionId}
                    onSelect={setActiveRegionId}
                    mode="scenario"
                    onOpenLargeMap={() => navigate(`/map-explorer?mode=scenario&region=${activeRegionId ?? scenario?.scenario_regions?.[0]?.id ?? ''}`)}
                  />
                </>
              ) : (
                <div className="stormy-simulation-placeholder">
                  <Row className="g-3 mb-3">
                    <Col md={4}>
                      <MiniMetric label="Atlas" value="Pending" note="The regional comparison map appears after the run." />
                    </Col>
                    <Col md={4}>
                      <MiniMetric label="Risk Delta" value="Pending" note="Modeled reductions are calculated from your selected package." />
                    </Col>
                    <Col md={4}>
                      <MiniMetric label="Lead Parish" value="Pending" note="The post-run pressure point will be highlighted here." />
                    </Col>
                  </Row>

                  <div className="stormy-simulation-placeholder__hero">
                    <span className="stormy-section-kicker">Awaiting Simulation</span>
                    <h4>Run the package to generate a live scenario comparison</h4>
                    <p className="mb-0">
                      This panel will populate with updated parish risk scores, a comparison atlas, and the parish still driving the
                      most urgency after your interventions are applied.
                    </p>
                  </div>

                  <div className="stormy-simulation-placeholder__layout">
                    <div className="stormy-simulation-placeholder__atlas">
                      <span className="stormy-section-kicker">Scenario Output</span>
                      <div className="stormy-simulation-placeholder__frame">
                        <div className="stormy-simulation-placeholder__map-shell" />
                        <div className="stormy-simulation-placeholder__marker stormy-simulation-placeholder__marker--1" />
                        <div className="stormy-simulation-placeholder__marker stormy-simulation-placeholder__marker--2" />
                        <div className="stormy-simulation-placeholder__marker stormy-simulation-placeholder__marker--3" />
                      </div>
                    </div>

                    <div className="stormy-simulation-placeholder__notes">
                      <strong>What appears after the run</strong>
                      <ul>
                        <li>Updated high-risk parish count and annual loss totals.</li>
                        <li>A live regional atlas focused on the selected planning package.</li>
                        <li>A hotspot view showing where the scenario still needs follow-up action.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Row className="g-4">
        <Col xl={7}>
          <Card className="h-100">
            <CardHeader>
              <CardTitle as="h4" className="mb-1">
                Baseline vs Scenario
              </CardTitle>
              <p className="text-muted fw-semibold mb-0">Top parishes with the largest modeled improvement after intervention.</p>
            </CardHeader>
            <CardBody>
              <Chart type="bar" height={320} options={comparisonOptions} series={comparisonSeries} />
            </CardBody>
          </Card>
        </Col>

        <Col xl={5}>
          <Card className="h-100">
            <CardHeader>
              <CardTitle as="h4" className="mb-1">
                Selected Package
              </CardTitle>
              <p className="text-muted fw-semibold mb-0">The intervention mix currently being sent to the scenario agent.</p>
            </CardHeader>
            <CardBody className="p-0">
              <div className="table-responsive">
                <Table className="align-middle mb-0">
                  <thead>
                    <tr className="table-light">
                      <th>Action</th>
                      <th>Cost</th>
                      <th>Primary Benefit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedActions.length ? (
                      selectedActions.map((action) => (
                        <tr key={action.id}>
                          <td>
                            <div>
                              <h5 className="mb-1">{action.title}</h5>
                              <p className="text-muted fs-13 mb-0">{action.description}</p>
                            </div>
                          </td>
                          <td className="fw-semibold">${action.cost_musd.toFixed(1)}M</td>
                          <td>{action.benefit_tags[0] ?? 'Resilience lift'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="text-center text-muted py-4">
                          No interventions selected yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            </CardBody>
            <CardBody className="border-top">
              {leadRegion ? (
                <div className="stormy-summary-strip">
                  <span className={`badge ${bandClass(leadRegion.risk_band)} mb-2`}>{leadRegion.risk_band}</span>
                  <h4 className="mb-1">{leadRegion.name}</h4>
                  <p className="text-muted mb-3">Most exposed parish in the current modeled scenario output.</p>
                  <div className="row g-3">
                    <div className="col-6">
                      <small className="text-muted d-block">Risk Score</small>
                      <strong>{leadRegion.risk_score}</strong>
                    </div>
                    <div className="col-6">
                      <small className="text-muted d-block">People At Risk</small>
                      <strong>{leadRegion.people_at_risk.toLocaleString()}</strong>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-muted mb-0">Once the model runs, this panel highlights the parish still driving the most urgency.</p>
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>
    </>
  )
}

const MiniMetric = ({ label, value, note }: { label: string; value: string; note: string }) => (
  <div className="stormy-mini-metric">
    <span>{label}</span>
    <strong>{value}</strong>
    <small>{note}</small>
  </div>
)

const bandClass = (riskBand: string) => {
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

export default ScenarioBuilderPage
