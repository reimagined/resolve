import * as React from 'react'
import { Row, Col, Container } from 'reactstrap'

const Login = (): any => {
  return (
    <Container>
      <Row style={{ display: 'flex', justifyContent: 'center' }}>
        <Col xs="8" sm="6">
          <div className="card card-block">Center</div>
        </Col>
      </Row>
    </Container>
  )
}

export default Login
