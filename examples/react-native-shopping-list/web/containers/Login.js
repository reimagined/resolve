import React from 'react'

import { FormGroup, FormControl, ControlLabel, Button } from 'react-bootstrap'

import Form from './Form'
import requiredNoAuth from '../decorators/requiredNoAuth'

class Login extends React.PureComponent {
  state = {
    action: '/'
  }

  onLoginClick = () => {
    this.setState(
      {
        action: '/auth/local/login'
      },
      () => {
        this.form.submit()
      }
    )
  }

  onRegisterClick = () => {
    this.setState(
      {
        action: '/auth/local/register'
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
            <ControlLabel>username</ControlLabel>
            <FormControl name="username" type="text" />
          </FormGroup>
          <FormGroup>
            <ControlLabel>password</ControlLabel>
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
        <br />
        <h2>Login with your social</h2>
        <Button bsStyle="primary" block>
          <i className="fab fa-google fa-fw" /> Login with Google
        </Button>
      </div>
    )
  }
}

export default requiredNoAuth(Login)
