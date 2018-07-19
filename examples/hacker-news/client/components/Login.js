import React from 'react'

import AuthForm from './AuthForm'

const Login = props => {
  return (
    <div>
      <AuthForm
        buttonText="login"
        action={`/login${props.location.search}`}
        title="Login"
      />
      <AuthForm
        buttonText="create account"
        action="/register"
        title="Create account"
      />
    </div>
  )
}

export default Login
