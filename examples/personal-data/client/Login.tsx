import React, { useState } from 'react'
import { useCommand } from 'resolve-react-hooks'
import uuid from 'uuid/v4'
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
  const [values, setValues] = useState({
    nickname: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    address: '',
    error: null
  })

  const handleChange = prop => event => {
    setValues({ ...values, [prop]: event.target.value, error: null })
  }

  const { nickname, firstName, lastName, phoneNumber, address, error } = values

  const register = useCommand(
    {
      type: 'register',
      aggregateId: uuid(),
      aggregateName: 'user-profile',
      payload: {
        nickname,
        firstName,
        lastName,
        phoneNumber,
        address
      }
    },
    error => {
      if (error != null) {
        setValues({ ...values, error })
      }
    },
    [nickname, firstName, lastName, phoneNumber, address]
  ) as () => void

  return (
    <React.Fragment>
      <Form>
        <FormGroup row>
          <Col>
            <h4>Registration</h4>
          </Col>
        </FormGroup>
        {error ? (
          <FormGroup row>
            <Col>
              <Alert color="danger">Error occurred</Alert>
            </Col>
          </FormGroup>
        ) : null}
        <FormGroup row>
          <Col>
            <Input
              name="nickname"
              id="nickname"
              placeholder="Nickname"
              value={nickname}
              onChange={handleChange('nickname')}
            />
          </Col>
        </FormGroup>
        <FormGroup row>
          <Col>
            <Input
              name="firstName"
              id="firstName"
              placeholder="First name"
              value={firstName}
              onChange={handleChange('firstName')}
            />
          </Col>
        </FormGroup>
        <FormGroup row>
          <Col>
            <Input
              name="lastName"
              id="lastName"
              placeholder="Last name"
              value={lastName}
              onChange={handleChange('lastName')}
            />
          </Col>
        </FormGroup>
        <FormGroup row>
          <Col>
            <Input
              name="phoneNumber"
              id="phoneNumber"
              placeholder="Phone number"
              value={phoneNumber}
              onChange={handleChange('phoneNumber')}
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
              value={address}
              onChange={handleChange('address')}
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
            <Button onClick={register}>Sign Up</Button>
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
