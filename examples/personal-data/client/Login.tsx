import React from 'react'

import {
  Row,
  Col,
  Container,
  Form,
  FormGroup,
  Input,
  FormText,
  Button,
  Alert
} from 'reactstrap'

const RegistrationForm = props => {
  return (
    <React.Fragment>
      <Form method="post" action="/api/register">
        <FormGroup row>
          <Col>
            <h4>Registration</h4>
          </Col>
        </FormGroup>
        <FormGroup row>
          <Col>
            <Input name="nickname" id="nickname" placeholder="Nickname" />
          </Col>
        </FormGroup>
        <FormGroup row>
          <Col>
            <Input name="firstName" id="firstName" placeholder="First name" />
          </Col>
        </FormGroup>
        <FormGroup row>
          <Col>
            <Input name="lastName" id="lastName" placeholder="Last name" />
          </Col>
        </FormGroup>
        <FormGroup row>
          <Col>
            <Input
              name="phoneNumber"
              id="phoneNumber"
              placeholder="Phone number"
            />
          </Col>
        </FormGroup>
        <FormGroup row>
          <Col>
            <Input
              type="textarea"
              name="address"
              id="address"
              placeholder="Postal address"
            />
          </Col>
        </FormGroup>
        <FormGroup row>
          <Col>
            <FormText color="muted">
              Information in name related fields, phone number and address is
              personal and will be encrypted before saving to eventstore
            </FormText>
          </Col>
        </FormGroup>
        <FormGroup row>
          <Col>
            <Button type="submit">Sign Up</Button>
          </Col>
        </FormGroup>
      </Form>
    </React.Fragment>
  )
}

const Login = (): any => {
  return (
    <Container>
      <Row style={{ display: 'flex', justifyContent: 'center' }}>
        <Col className="pt-3" xs="8" sm="6">
          <RegistrationForm />
        </Col>
      </Row>
    </Container>
  )
}

export default Login
