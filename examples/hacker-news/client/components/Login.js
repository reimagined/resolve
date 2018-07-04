import React from 'react'

import AuthForm from './AuthForm'
import { rootDirectory } from '../constants'

const Login = props => {
  return (
    <div>
      <AuthForm
        buttonText="login"
        action={`${rootDirectory}/login${props.location.search}`}
        title="Login"
      />
      <AuthForm
        buttonText="create account"
        action={`${rootDirectory}/register`}
        title="Create account"
      />
    </div>
  )
}

export default Login
