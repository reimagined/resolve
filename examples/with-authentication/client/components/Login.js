import React from 'react'
import { connectRootBasedUrls } from 'resolve-redux'
import { Form, FormControl, ControlLabel, Button } from 'react-bootstrap'

const RootBasedForm = connectRootBasedUrls(['action'])(Form)

const Login = () => (
  <div className="example-login-wrapper">
    <ControlLabel className="example-login-label">
      Enter your username:
    </ControlLabel>

    <RootBasedForm inline method="POST" action="/register">
      <FormControl
        className="example-login-input"
        type="text"
        name="username"
      />
      <Button className="example-login-button" type="submit" bsStyle="success">
        Create Account
      </Button>
    </RootBasedForm>
  </div>
)

export default Login
