import React from 'react'
import { FormControl, ControlLabel, Button } from 'react-bootstrap'

import Form from '../containers/Form'

const Login = () => (
  <div className="example-login-wrapper">
    <ControlLabel className="example-login-label">
      Enter your username:
    </ControlLabel>

    <Form inline method="POST" action="/register">
      <FormControl
        className="example-login-input"
        type="text"
        name="username"
      />
      <Button className="example-login-button" type="submit" bsStyle="success">
        Create Account
      </Button>
    </Form>
  </div>
)

export default Login
