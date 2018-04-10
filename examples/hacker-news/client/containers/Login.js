import React from 'react'
import { connectReadModel } from 'resolve-redux'

import AuthForm from '../components/AuthForm'
import { rootDirectory } from '../constants'

const Login = props => {
  return (
    <div>
      <AuthForm
        buttonText="login"
        action={`login${props.location.search}`}
        title="Login"
      />
      <AuthForm
        buttonText="create account"
        action="register"
        title="Create account"
      />
    </div>
  )
}

export default connectReadModel((state, ownProps) => ({
  readModelName: 'default',
  resolverName: 'void',
  variables: {},
  ...ownProps
}))(Login)
