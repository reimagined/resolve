import React from 'react'

import Form from '../containers/Form'

const AuthForm = ({ title, action, buttonText }) => (
  <div>
    <div>{title}</div>
    <Form method="POST" action={action}>
      <div>
        username: <input type="text" name="username" />
      </div>
      <div>
        password: <input type="password" name="password" />
      </div>
      <input type="submit" value={buttonText} />
    </Form>
  </div>
)

export default AuthForm
