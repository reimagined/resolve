import React, { useState } from 'react'
import { useCommand } from 'resolve-react-hooks'
import {
  Row,
  Col,
  Container,
  Form,
  FormGroup,
  Input,
  FormText,
  Button
} from 'reactstrap'

const RegistrationForm = ({ user }) => {
  const [values, setValues] = useState({
    nickname: user ? user.nickname : '',
    firstName: user ? user.firstName : '',
    lastName: user ? user.lastName : '',
    phoneNumber: user ? user.contacts.phoneNumber : '',
    address: user ? user.contacts.address : ''
  })

  const handleChange = prop => event => {
    setValues({ ...values, [prop]: event.target.value })
  }

  const update = useCommand(
    {
      type: 'update',
      aggregateId: user ? user.id : null,
      aggregateName: 'user-profile',
      payload: values
    },
    [user]
  ) as () => void

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
              defaultValue={user ? user.contacts.phoneNumber : ''}
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
              defaultValue={user ? user.contacts.address : ''}
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
            {user ? (
              <Button onClick={update}>Update</Button>
            ) : (
              <Button type="submit">Sign Up</Button>
            )}
          </Col>
        </FormGroup>
      </Form>
    </React.Fragment>
  )
}

const Login = ({ user }): any => {
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
