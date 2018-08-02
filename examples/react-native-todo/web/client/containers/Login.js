import React from 'react'

import AuthForm from "../components/AuthForm";

class Login extends React.PureComponent {
  render() {
    return (
      <div>
        <AuthForm
          buttonText="login"
          action={`/login`}
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
}

export default Login
