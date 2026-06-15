import { APP_NAME, currentYear } from '@/context/constants'
import { Col, Container, Row } from 'react-bootstrap'

const Footer = () => {
  return (
    <footer className="footer">
      <Container fluid>
        <Row>
          <Col xs={12} className="text-center">
            {currentYear} (c) {APP_NAME}. Microsoft-ready climate resilience planning on a React and FastAPI delivery stack.
          </Col>
        </Row>
      </Container>
    </footer>
  )
}

export default Footer
