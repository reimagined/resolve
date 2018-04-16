import React from 'react'
import { Form, FormControl, ControlLabel, Button } from 'react-bootstrap'

const Login = () => {
  return (
    <div
      style={{
        borderRadius: '5px',
        border: '#c9c9c9 1px solid',
        padding: '15px',
        minHeight: '130px'
      }}
    >
      <ControlLabel style={{ marginTop: '10px' }}>
        Enter your username:
      </ControlLabel>

      <Form inline method="POST" action="/register">
        <FormControl
          style={{ minWidth: '74%' }}
          className="example-input"
          type="text"
          name="username"
        />
        <Button style={{ float: 'right' }} type="submit" bsStyle="success">
          Create Account
        </Button>
      </Form>
    </div>
  )
}

export default Login
