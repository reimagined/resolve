import React from 'react'
import { FormControl, Button } from 'react-bootstrap'

import Form from '../containers/Form'

const Logout = ({ username }) => (
  <div className="example-login-wrapper">
    <h1>Hello, {username}</h1>
    <Form method="POST" action="/logout">
      <FormControl type="hidden" name="username" value="null" />
      <Button type="submit" bsStyle="danger">
        Logout
      </Button>
    </Form>
  </div>
)

export default Logout
