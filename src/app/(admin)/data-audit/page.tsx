import PageTitle from '@/components/PageTitle'
import ClimateMetricCard from '@/features/climate/components/ClimateMetricCard'
import { useClimateWorkbench } from '@/context/useClimateWorkbenchContext'
import { useDeferredValue, useMemo, useState } from 'react'
import { Badge, Button, Card, CardBody, CardHeader, CardTitle, Col, Form, Nav, NavItem, NavLink, Row, TabContainer, TabContent, Table, TabPane } from 'react-bootstrap'

const DataAuditPage = () => {
  const { dashboard, scenario, health, refreshDashboard, loadDemoScenario } = useClimateWorkbench()
  const [activeTab, setActiveTab] = useState('sources')
  const [agentFilter, setAgentFilter] = useState('All')
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)

  const logs = useMemo(() => scenario?.agent_logs ?? dashboard?.agent_logs ?? [], [dashboard?.agent_logs, scenario?.agent_logs])
  const filteredLogs = useMemo(
    () =>
      logs.filter((log) => {
        const matchesAgent = agentFilter === 'All' || log.agent === agentFilter
        const searchBlob = `${log.agent} ${log.message} ${log.status}`.toLowerCase()
        return matchesAgent && searchBlob.includes(deferredSearch.toLowerCase())
      }),
    [agentFilter, deferredSearch, logs],
  )

  const agentOptions = ['All', ...Array.from(new Set(logs.map((log) => log.agent)))]
  const serviceStatuses = Object.entries(health?.service_statuses ?? {})

  return (
    <>
      <PageTitle title="Data & Audit" />

      <Row className="g-3 mb-4">
        <Col xl={3} md={6}>
          <ClimateMetricCard
            title="System Status"
            value={health?.status ?? 'offline'}
            changeText={health?.service ?? 'API service'}
            changeVariant={health?.status === 'ok' ? 'success' : 'danger'}
            icon="mdi:server-network"
            variant={health?.status === 'ok' ? 'success' : 'danger'}
            progress={health?.status === 'ok' ? 100 : 20}
            footnote={`Environment: ${health?.environment ?? 'unknown'}.`}
          />
        </Col>
        <Col xl={3} md={6}>
          <ClimateMetricCard
            title="Azure Mode"
            value={health?.azure_openai_enabled ? 'Live' : 'Standby'}
            changeText={health?.operating_mode ?? (health?.azure_openai_enabled ? 'Narration and report generation enabled' : 'Fallback reasoning mode')}
            changeVariant={health?.azure_openai_enabled ? 'success' : 'warning'}
            icon="mdi:azure"
            variant="primary"
            progress={health?.azure_openai_enabled ? 96 : 55}
            footnote="Switches automatically based on the configured `.env` values."
          />
        </Col>
        <Col xl={3} md={6}>
          <ClimateMetricCard
            title="Data Sources"
            value={String(dashboard?.data_sources.length ?? 0)}
            changeText={`${(dashboard?.data_sources ?? []).filter((source) => source.status === 'Healthy').length} healthy feeds`}
            changeVariant="info"
            icon="mdi:database-check-outline"
            variant="info"
            progress={Math.min(100, ((dashboard?.data_sources ?? []).filter((source) => source.status === 'Healthy').length / Math.max(dashboard?.data_sources.length ?? 1, 1)) * 100)}
            footnote="NOAA, exposure, sea-level, and infrastructure datasets."
          />
        </Col>
        <Col xl={3} md={6}>
          <ClimateMetricCard
            title="Log Events"
            value={String(logs.length)}
            changeText={`${agentOptions.length - 1} unique agents`}
            changeVariant="primary"
            icon="mdi:file-document-multiple-outline"
            variant="warning"
            progress={Math.min(100, (logs.length / 12) * 100)}
            footnote="Trace events used to prove workflow transparency to judges."
          />
        </Col>
      </Row>

      <Row className="g-4 mb-4">
        <Col xl={8}>
          <Card className="h-100">
            <TabContainer activeKey={activeTab}>
              <CardHeader className="d-flex justify-content-between flex-wrap align-items-center gap-3">
                <div>
                  <CardTitle as="h4" className="mb-1">
                    Operational Audit
                  </CardTitle>
                  <p className="text-muted fw-semibold mb-0">Review data freshness, pipeline activity, and run-level transparency.</p>
                </div>

                <div className="d-flex flex-wrap align-items-center gap-2">
                  <Button variant="outline-secondary" size="sm" onClick={() => void refreshDashboard()}>
                    Refresh source status
                  </Button>
                  <Button variant="outline-primary" size="sm" onClick={() => void loadDemoScenario()}>
                    Load planning scenario
                  </Button>
                  <Nav as="ul" className="nav-pills nav-justified gap-1" role="tablist">
                    <NavItem as="li" role="presentation">
                      <NavLink eventKey="sources" className="rounded-0" onClick={() => setActiveTab('sources')}>
                        Sources
                      </NavLink>
                    </NavItem>
                    <NavItem as="li" role="presentation">
                      <NavLink eventKey="trace" className="rounded-0" onClick={() => setActiveTab('trace')}>
                        Agent Trace
                      </NavLink>
                    </NavItem>
                  </Nav>
                </div>
              </CardHeader>

              <TabContent>
                <TabPane eventKey="sources">
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
                </TabPane>

                <TabPane eventKey="trace">
                  <CardBody>
                    <Row className="g-3 mb-3">
                      <Col lg={4}>
                        <Form.Select value={agentFilter} onChange={(event) => setAgentFilter(event.target.value)}>
                          {agentOptions.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </Form.Select>
                      </Col>
                      <Col lg={8}>
                        <Form.Control value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search logs..." />
                      </Col>
                    </Row>

                    <div className="table-responsive">
                      <Table className="align-middle mb-0">
                        <thead>
                          <tr className="table-light">
                            <th>Time</th>
                            <th>Agent</th>
                            <th>Status</th>
                            <th>Message</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredLogs.map((log) => (
                            <tr key={`${log.agent}-${log.timestamp}`}>
                              <td>{new Date(log.timestamp).toLocaleString()}</td>
                              <td className="fw-semibold">{log.agent}</td>
                              <td>
                                <span className={`badge ${log.status.toLowerCase() === 'ready' ? 'bg-success-subtle text-success' : 'bg-primary-subtle text-primary'}`}>
                                  {log.status}
                                </span>
                              </td>
                              <td>{log.message}</td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  </CardBody>
                </TabPane>
              </TabContent>
            </TabContainer>
          </Card>
        </Col>

        <Col xl={4}>
          <Card className="h-100">
            <CardHeader>
              <CardTitle as="h4" className="mb-1">
                Microsoft Stack Readiness
              </CardTitle>
              <p className="text-muted fw-semibold mb-0">What is live today versus what is staged for the fuller Foundry and Fabric build-out.</p>
            </CardHeader>
            <CardBody className="p-0">
              <div className="table-responsive">
                <Table className="align-middle mb-0">
                  <thead>
                    <tr className="table-light">
                      <th>Service</th>
                      <th>Configured</th>
                      <th>Active</th>
                    </tr>
                  </thead>
                  <tbody>
                    {serviceStatuses.map(([serviceName, status]) => (
                      <tr key={serviceName}>
                        <td>
                          <div>
                            <strong className="text-capitalize">{serviceName.replaceAll('_', ' ')}</strong>
                            <div className="text-muted fs-13 mt-1">{status.summary}</div>
                          </div>
                        </td>
                        <td>
                          <Badge bg={status.configured ? 'success' : 'secondary'}>{status.configured ? 'Yes' : 'No'}</Badge>
                        </td>
                        <td>
                          <Badge bg={status.active ? 'primary' : 'warning'}>{status.active ? 'Live' : 'Staged'}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Row className="g-4 mb-4">
        <Col xl={6}>
          <Card className="h-100">
            <CardHeader>
              <CardTitle as="h4" className="mb-1">
                Ontology Snapshot
              </CardTitle>
              <p className="text-muted fw-semibold mb-0">The Fabric IQ model backing the climate reasoning chain.</p>
            </CardHeader>
            <CardBody>
              <div className="stormy-ontology-grid">
                <div>
                  <span className="stormy-section-kicker">Entities</span>
                  <ul>
                    {(dashboard?.ontology.entities ?? []).map((entity) => (
                      <li key={entity}>{entity}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span className="stormy-section-kicker">Relationships</span>
                  <ul>
                    {(dashboard?.ontology.relationships ?? []).map((relationship) => (
                      <li key={relationship}>{relationship}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardBody>
          </Card>
        </Col>

        <Col xl={6}>
          <Card className="h-100">
            <CardHeader>
              <CardTitle as="h4" className="mb-1">
                Active Guardrails
              </CardTitle>
              <p className="text-muted fw-semibold mb-0">Safety and quality controls applied during every run.</p>
            </CardHeader>
            <CardBody className="stormy-guardrail-list">
              {(dashboard?.guardrails ?? []).map((guardrail) => (
                <div key={guardrail.title} className="stormy-guardrail-item">
                  <div className="d-flex align-items-center justify-content-between gap-3 mb-2">
                    <strong>{guardrail.title}</strong>
                    <Badge bg="success">{guardrail.status}</Badge>
                  </div>
                  <p className="mb-0">{guardrail.description}</p>
                </div>
              ))}
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Row className="g-4">
        <Col xs={12}>
          <Card>
            <CardHeader>
              <CardTitle as="h4" className="mb-1">
                Briefing Flow
              </CardTitle>
              <p className="text-muted fw-semibold mb-0">A clean walkthrough path through the app during your presentation.</p>
            </CardHeader>
            <CardBody className="stormy-guardrail-list">
              {[
                '1. Risk Map: change the horizon or hazard mix, then run Risk Lens and inspect the atlas plus hotspot table.',
                '2. Scenario Builder: load the starter package or select interventions manually and run a constrained budget simulation.',
                '3. Recommendations: show the ranked action plan, grounded citations, and PDF or CSV export.',
                '4. Data & Audit: prove traceability with agent logs, guardrails, and the Microsoft stack readiness table.',
              ].map((step) => (
                <div key={step} className="stormy-guardrail-item">
                  <p className="mb-0">{step}</p>
                </div>
              ))}
            </CardBody>
          </Card>
        </Col>
      </Row>
    </>
  )
}

export default DataAuditPage
