import React from 'react';
import { Input, Label } from 'reactstrap';

import Form from '../containers/Form';

const AuthForm = ({ title, action, buttonText }) => (
  <div style={{ maxWidth: '500px', padding: '10px' }}>
    <div>{title}</div>
    <Form method="POST" action={action}>
      <div>
        <Label>username:</Label>
        <Input type="text" name="login" placeholder="login" />
        <br />
        <Input type="password" name="password" placeholder="password" />
        <br />
      </div>
      <Input type="submit" value={buttonText} />
    </Form>
    <br />
  </div>
);

export default AuthForm;
