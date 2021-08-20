import React from 'react'
import { Location } from 'history'
import { AuthForm } from './AuthForm'

const Login = (props: { location: Location }) => {
  return (
    <div>
      <AuthForm
        buttonText="login"
        action={`/api/login${props.location.search}`}
        title="Login"
      />
      <AuthForm
        buttonText="create account"
        action="/api/register"
        title="Create account"
      />
    </div>
  )
}

export { Login }
