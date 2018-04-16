import React from 'react'
import { Form, FormControl, Button } from 'react-bootstrap'

const Logout = props => {
  return (
    <div
      style={{
        borderRadius: '5px',
        border: '#c9c9c9 1px solid',
        padding: '15px',
        minHeight: '130px'
      }}
    >
      <h1>Hello, {props.username}</h1>
      <Form method="POST" action="/logout">
        <FormControl type="hidden" name="username" value="null" />
        <Button type="submit" bsStyle="danger">
          Logout
        </Button>
      </Form>
    </div>
  )
}

export default Logout
