import { Link } from 'react-router-dom'
import { Card, Col, Container, Row } from 'react-bootstrap'
import { APP_NAME } from '@/context/constants'

const Error404 = () => {
  return (
    <div className="account-pages p-sm-5 position-relative">
      <Container>
        <Row className="justify-content-center">
          <Col xxl={6} lg={8}>
            <Card className="overflow-hidden">
              <Card.Body className="p-5 text-center">
                <div className="mb-4">
                  <span className="stormy-section-kicker">{APP_NAME}</span>
                  <h1 className="mb-2">404</h1>
                  <h4 className="fs-20">Page not found</h4>
                  <p className="text-muted mb-0">
                    That route is outside the current climate workbench. Head back to the dashboard to continue the review.
                  </p>
                </div>

                <Link to="/" className="btn btn-danger">
                  Back to Dashboard
                </Link>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  )
}

export default Error404
