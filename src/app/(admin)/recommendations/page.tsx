import PageTitle from '@/components/PageTitle'
import ClimateMetricCard from '@/features/climate/components/ClimateMetricCard'
import { APP_NAME } from '@/context/constants'
import { useClimateWorkbench } from '@/context/useClimateWorkbenchContext'
import type { RecommendationItem } from '@/types/climate'
import type { ApexOptions } from 'apexcharts'
import { useEffect, useMemo, useState } from 'react'
import Chart from 'react-apexcharts'
import { Button, Card, CardBody, CardHeader, CardTitle, Col, Nav, NavItem, NavLink, Row, TabContainer, TabContent, Table, TabPane } from 'react-bootstrap'
import { Link } from 'react-router-dom'

const RecommendationsPage = () => {
  const { scenario, dashboard, filters, loadDemoScenario } = useClimateWorkbench()
  const [activeTab, setActiveTab] = useState('actions')

  useEffect(() => {
    if (!scenario && dashboard) {
      void loadDemoScenario()
    }
  }, [dashboard, scenario, loadDemoScenario])

  const reportChartOptions: ApexOptions = {
    chart: { toolbar: { show: false }, foreColor: '#6c757d' },
    plotOptions: { bar: { horizontal: true, borderRadius: 4 } },
    colors: ['#dc3545'],
    xaxis: {
      categories: (scenario?.recommendations ?? []).map((item) => item.title),
    },
    grid: { borderColor: 'rgba(108, 117, 125, 0.15)' },
    dataLabels: { enabled: false },
    tooltip: { theme: 'light' },
  }

  const reportChartSeries = [
    {
      name: 'Risk reduction',
      data: (scenario?.recommendations ?? []).map((item) => item.risk_reduction_pct),
    },
  ]

  const trendRows =
    scenario?.scenario_regions.slice(0, 5).map((region) => ({
      name: region.name,
      baseline: region.baseline_risk_score ?? region.risk_score,
      scenario: region.risk_score,
    })) ?? []

  const trendOptions: ApexOptions = {
    chart: { toolbar: { show: false }, foreColor: '#6c757d' },
    stroke: { curve: 'smooth', width: 3 },
    colors: ['#fd7e14', '#20c997'],
    xaxis: { categories: trendRows.map((item) => item.name) },
    grid: { borderColor: 'rgba(108, 117, 125, 0.15)' },
    tooltip: { theme: 'light' },
  }

  const trendSeries = [
    { name: 'Baseline', data: trendRows.map((item) => item.baseline) },
    { name: 'Scenario', data: trendRows.map((item) => item.scenario) },
  ]

  const scenarioBudgetUsed = scenario ? scenario.summary.budget_used_musd.toFixed(1) : '0.0'
  const overallReduction = scenario ? scenario.summary.overall_risk_reduction_pct.toFixed(1) : '0.0'
  const protectedPopulation = useMemo(
    () => (scenario?.recommendations ?? []).reduce((total, recommendation) => total + recommendation.protected_population, 0),
    [scenario?.recommendations],
  )

  return (
    <>
      <PageTitle title="Recommendations & Report" />

      <Row className="g-3 mb-4">
        <Col xl={3} md={6}>
          <ClimateMetricCard
            title="Recommendations"
            value={String(scenario?.recommendations.length ?? 0)}
            changeText={scenario ? 'Prioritized under budget' : 'Loading scenario package'}
            changeVariant={scenario ? 'success' : 'primary'}
            icon="mdi:format-list-numbered"
            variant="primary"
            progress={Math.min(100, ((scenario?.recommendations.length ?? 0) / 6) * 100)}
            footnote="Ranked actions ready for the judging brief."
          />
        </Col>
        <Col xl={3} md={6}>
          <ClimateMetricCard
            title="Budget Used"
            value={`$${scenarioBudgetUsed}M`}
            changeText={`$${scenario?.summary.budget_remaining_musd.toFixed(1) ?? '0.0'}M remaining`}
            changeVariant={scenario?.summary.oversubscribed ? 'danger' : 'success'}
            icon="mdi:cash-check"
            variant="warning"
            progress={scenario ? Math.min(100, (scenario.summary.budget_used_musd / Math.max(scenario.summary.budget_musd, 1)) * 100) : 0}
            footnote={`Target budget ceiling: $${filters.budgetMusd.toFixed(0)}M.`}
          />
        </Col>
        <Col xl={3} md={6}>
          <ClimateMetricCard
            title="Modeled Reduction"
            value={`${overallReduction}%`}
            changeText={filters.goal === 'people' ? 'Population safety optimized' : 'Infrastructure continuity optimized'}
            changeVariant="success"
            icon="mdi:trending-down"
            variant="success"
            progress={scenario ? Math.min(100, scenario.summary.overall_risk_reduction_pct * 4) : 0}
            footnote="Overall reduction in annualized risk and loss."
          />
        </Col>
        <Col xl={3} md={6}>
          <ClimateMetricCard
            title="Protected Population"
            value={protectedPopulation.toLocaleString()}
            changeText={`${filters.horizonYear} planning horizon`}
            changeVariant="info"
            icon="mdi:shield-account-outline"
            variant="info"
            progress={scenario ? Math.min(100, protectedPopulation / 250000) : 0}
            footnote="Cumulative population protection across the recommended package."
          />
        </Col>
      </Row>

      <Row className="mb-4">
        <Col xl={12}>
          <Card>
            <TabContainer activeKey={activeTab}>
              <CardHeader className="d-flex justify-content-between flex-wrap align-items-center gap-3">
                <div>
                  <CardTitle as="h4" className="mb-1">
                    Ministerial Adaptation Brief
                  </CardTitle>
                  <p className="text-muted fw-semibold mb-0">
                    {scenario?.scenario_name ?? 'Scenario'} for {scenario?.country_name ?? dashboard?.country_name ?? 'the active country'} in{' '}
                    {scenario?.horizon_year ?? filters.horizonYear}.
                  </p>
                </div>

                <div className="d-flex flex-wrap align-items-center gap-2">
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() =>
                      exportPdf(reportWindowHtml(scenario?.report.executive_summary ?? '', scenario?.report.detailed_report_markdown ?? ''))
                    }>
                    Export PDF
                  </Button>
                  <Button variant="outline-secondary" size="sm" onClick={() => exportCsv(scenario?.recommendations ?? [])}>
                    Export CSV
                  </Button>
                  <Link to="/scenario-builder" className="btn btn-primary btn-sm">
                    Back to Scenario Builder
                  </Link>
                  <Nav as="ul" className="nav-pills nav-justified gap-1" role="tablist">
                    <NavItem as="li" role="presentation">
                      <NavLink eventKey="actions" className="rounded-0" onClick={() => setActiveTab('actions')}>
                        Action Plan
                      </NavLink>
                    </NavItem>
                    <NavItem as="li" role="presentation">
                      <NavLink eventKey="brief" className="rounded-0" onClick={() => setActiveTab('brief')}>
                        Policy Brief
                      </NavLink>
                    </NavItem>
                    <NavItem as="li" role="presentation">
                      <NavLink eventKey="citations" className="rounded-0" onClick={() => setActiveTab('citations')}>
                        Grounding
                      </NavLink>
                    </NavItem>
                  </Nav>
                </div>
              </CardHeader>

              <TabContent>
                <TabPane eventKey="actions">
                  <div className="table-responsive">
                    <Table className="align-middle mb-0">
                      <thead>
                        <tr className="table-light">
                          <th>Rank</th>
                          <th>Action</th>
                          <th>Cost</th>
                          <th>Risk Reduction</th>
                          <th>Protected Population</th>
                          <th>Regions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(scenario?.recommendations ?? []).map((recommendation) => (
                          <tr key={recommendation.id}>
                            <td>
                              <span className="badge bg-primary-subtle text-primary">#{recommendation.rank}</span>
                            </td>
                            <td>
                              <div>
                                <h5 className="mb-1">{recommendation.title}</h5>
                                <p className="text-muted fs-13 mb-1">{recommendation.rationale}</p>
                                <div className="stormy-tag-row mt-0">
                                  {recommendation.tags.map((tag) => (
                                    <span key={tag}>{tag}</span>
                                  ))}
                                </div>
                              </div>
                            </td>
                            <td className="fw-semibold">${recommendation.cost_musd.toFixed(1)}M</td>
                            <td className="text-success fw-semibold">{recommendation.risk_reduction_pct.toFixed(1)}%</td>
                            <td>{recommendation.protected_population.toLocaleString()}</td>
                            <td>{recommendation.targeted_regions.join(', ')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </TabPane>

                <TabPane eventKey="brief">
                  <CardBody>
                    <div className="stormy-summary-strip mb-4">
                      <span className="stormy-section-kicker">Executive Summary</span>
                      <h4 className="mb-2">{scenario?.scenario_name ?? 'Scenario package'}</h4>
                      <p className="mb-0">{scenario?.report.executive_summary ?? 'The policy brief will appear here once the scenario report is loaded.'}</p>
                    </div>

                    <div className="stormy-report-block">{renderReportMarkdown(scenario?.report.detailed_report_markdown ?? 'No report loaded yet.')}</div>
                  </CardBody>
                </TabPane>

                <TabPane eventKey="citations">
                  <div className="table-responsive">
                    <Table className="align-middle mb-0">
                      <thead>
                        <tr className="table-light">
                          <th>Source</th>
                          <th>Summary</th>
                          <th>Link</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(scenario?.report.citations ?? []).map((citation) => (
                          <tr key={citation.label}>
                            <td className="fw-semibold">{citation.label}</td>
                            <td>{citation.summary}</td>
                            <td>
                              <a href={citation.source_url} target="_blank" rel="noreferrer" className="btn btn-outline-secondary btn-sm">
                                Open source
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </TabPane>
              </TabContent>
            </TabContainer>
          </Card>
        </Col>
      </Row>

      <Row className="g-4">
        <Col xl={6}>
          <Card className="h-100">
            <CardHeader>
              <CardTitle as="h4" className="mb-1">
                Ranked Intervention Effect
              </CardTitle>
              <p className="text-muted fw-semibold mb-0">Risk reduction delivered by each recommended adaptation action.</p>
            </CardHeader>
            <CardBody>
              <Chart type="bar" height={320} options={reportChartOptions} series={reportChartSeries} />
            </CardBody>
          </Card>
        </Col>
        <Col xl={6}>
          <Card className="h-100">
            <CardHeader>
              <CardTitle as="h4" className="mb-1">
                Baseline vs Scenario
              </CardTitle>
              <p className="text-muted fw-semibold mb-0">Top-region trend line comparing baseline and post-intervention scores.</p>
            </CardHeader>
            <CardBody>
              <Chart type="line" height={320} options={trendOptions} series={trendSeries} />
            </CardBody>
          </Card>
        </Col>
      </Row>
    </>
  )
}

const renderReportMarkdown = (markdown: string) => {
  const lines = markdown.split('\n').filter(Boolean)
  return lines.map((line, index) => {
    if (line.startsWith('## ')) {
      return <h3 key={`${line}-${index}`}>{line.replace('## ', '')}</h3>
    }
    if (line.startsWith('- ')) {
      return <p key={`${line}-${index}`}>- {line.replace('- ', '')}</p>
    }
    if (/^\d+\./.test(line)) {
      return <p key={`${line}-${index}`}>{line}</p>
    }
    return <p key={`${line}-${index}`}>{line.replaceAll('**', '')}</p>
  })
}

const exportCsv = (recommendations: RecommendationItem[]) => {
  const header = 'Rank,Title,Cost (M USD),Risk Reduction %,Protected Population,Tags\n'
  const body = recommendations
    .map(
      (recommendation) =>
        `${recommendation.rank},"${recommendation.title}",${recommendation.cost_musd},${recommendation.risk_reduction_pct},${recommendation.protected_population},"${recommendation.tags.join(' | ')}"`,
    )
    .join('\n')
  const blob = new Blob([header + body], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'ccro-recommendations.csv'
  anchor.click()
  URL.revokeObjectURL(url)
}

const reportWindowHtml = (summary: string, report: string) => `
  <html>
    <head>
      <title>${APP_NAME}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 32px; line-height: 1.6; color: #102436; }
        h1 { color: #102436; }
        h2, h3 { color: #0d6efd; }
      </style>
    </head>
    <body>
      <h1>${APP_NAME}</h1>
      <p>${summary}</p>
      <pre style="white-space: pre-wrap; font-family: Arial, sans-serif;">${report}</pre>
    </body>
  </html>
`

const exportPdf = (html: string) => {
  const newWindow = window.open('', '_blank', 'width=1080,height=900')
  if (!newWindow) {
    return
  }
  newWindow.document.write(html)
  newWindow.document.close()
  newWindow.focus()
  newWindow.print()
}

export default RecommendationsPage
