import React from 'react'

import { FormGroup, FormControl, ControlLabel, Button } from 'react-bootstrap'

import Form from './Form'
import requiredNoAuth from '../decorators/required-no-auth'

class Login extends React.PureComponent {
  state = {
    action: '/'
  }

  onLoginClick = () => {
    this.setState(
      {
        action: '/api/auth/local/login'
      },
      () => {
        this.form.submit()
      }
    )
  }

  onRegisterClick = () => {
    this.setState(
      {
        action: '/api/auth/local/register'
      },
      () => {
        this.form.submit()
      }
    )
  }

  formRef = element => {
    this.form = element
  }

  render() {
    return (
      <div className="example-wrapper">
        <h2>Login Form</h2>
        <Form method="POST" action={this.state.action} innerRef={this.formRef}>
          <FormGroup>
            <ControlLabel>username:</ControlLabel>
            <FormControl name="username" type="text" />
          </FormGroup>
          <FormGroup>
            <ControlLabel>password:</ControlLabel>
            <FormControl name="password" type="password" />
          </FormGroup>
          <FormGroup>
            <Button bsStyle="primary" onClick={this.onLoginClick}>
              Login
            </Button>{' '}
            <Button bsStyle="success" onClick={this.onRegisterClick}>
              Register
            </Button>
          </FormGroup>
        </Form>
      </div>
    )
  }
}

export default requiredNoAuth(Login)
