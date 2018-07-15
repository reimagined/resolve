import React from 'react'
import { connectRootBasedUrls } from 'resolve-redux'
import { Form, FormControl, Button } from 'react-bootstrap'

const RootBasedForm = connectRootBasedUrls(['action'])(Form)

const Logout = ({ username }) => (
  <div className="example-login-wrapper">
    <h1>Hello, {username}</h1>
    <RootBasedForm method="POST" action="/logout">
      <FormControl type="hidden" name="username" value="null" />
      <Button type="submit" bsStyle="danger">
        Logout
      </Button>
    </RootBasedForm>
  </div>
)

export default Logout
