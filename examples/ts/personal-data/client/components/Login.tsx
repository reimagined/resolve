import React, { useState } from 'react'
import { useCommand } from '@resolve-js/react-hooks'
import {
  Row,
  Col,
  Container,
  Form,
  FormGroup,
  Input,
  FormText,
  Button,
  Alert,
  Label,
} from 'reactstrap'

const RegistrationForm = ({ user }: { user: any }) => {
  const [values, setValues] = useState({
    nickname: user ? user.nickname : '',
    firstName: user ? user.firstName : '',
    lastName: user ? user.lastName : '',
    phoneNumber: user && user.contacts ? user.contacts.phoneNumber : '',
    address: user && user.contacts ? user.contacts.address : '',
    error: null,
    done: null,
  })

  const [agree, setAgree] = useState(false)

  const handleChange = (prop: string) => (event: any) => {
    setValues({
      ...values,
      error: false,
      done: false,
      [prop]: event.target.value,
    })
  }

  const update = useCommand(
    {
      type: 'update',
      aggregateId: user ? user.id : null,
      aggregateName: 'user-profile',
      payload: values,
    },
    (error) => {
      if (error) {
        setValues({ ...values, error, done: false })
      } else {
        setValues({ ...values, error: false, done: true })
      }
    },
    [user, values]
  )

  const { error, done } = values

  return (
    <React.Fragment>
      <Form method="post" action="/api/register">
        <FormGroup row>
          <Col>{user ? <h4>Profile update</h4> : <h4>Registration</h4>}</Col>
        </FormGroup>
        <FormGroup row>
          <Col>
            <Input
              name="nickname"
              id="nickname"
              placeholder="Nickname"
              defaultValue={user ? user.nickname : ''}
              disabled={!!user}
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
              defaultValue={user ? user.firstName : ''}
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
              defaultValue={user ? user.lastName : ''}
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
              defaultValue={
                user && user.contacts ? user.contacts.phoneNumber : ''
              }
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
              defaultValue={user && user.contacts ? user.contacts.address : ''}
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
        {!user && (
          <FormGroup check className="mb-3">
            <Label check>
              <Input
                id="consent"
                type="checkbox"
                onChange={() => {
                  setAgree(!agree)
                }}
              />{' '}
              I give my consent to the processing of personal data
            </Label>
          </FormGroup>
        )}
        <FormGroup row>
          <Col>
            <div className="mb-3">
              {user ? (
                <Button onClick={() => update()}>Update</Button>
              ) : (
                <Button disabled={!agree} type="submit">
                  Sign Up
                </Button>
              )}
            </div>
            {error && <Alert color="danger">An error occurred</Alert>}
            {done && <Alert color="success">Successfully saved</Alert>}
          </Col>
        </FormGroup>
      </Form>
    </React.Fragment>
  )
}

const Login = ({ user = null }) => {
  return (
    <Container>
      <Row style={{ display: 'flex', justifyContent: 'center' }}>
        <Col className="pt-3" xs="8" sm="6">
          <RegistrationForm user={user} />
        </Col>
      </Row>
    </Container>
  )
}

export default Login
