import React from 'react';
import { Form, FormControl, Button } from 'react-bootstrap';

const Logout = props => {
  return (
    <div className="example-login-wrapper">
      <h1>Hello, {props.username}</h1>
      <Form method="POST" action="/logout">
        <FormControl type="hidden" name="username" value="null" />
        <Button type="submit" bsStyle="danger">
          Logout
        </Button>
      </Form>
    </div>
  );
};

export default Logout;
