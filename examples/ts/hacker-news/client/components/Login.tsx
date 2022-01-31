import React from 'react'
import { useSearchParams } from 'react-router-dom'

import { AuthForm } from './AuthForm'

const Login = () => {
  let [searchParams] = useSearchParams()

  return (
    <div>
      <AuthForm
        buttonText="login"
        action={`/api/login?${searchParams.toString()}`}
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
