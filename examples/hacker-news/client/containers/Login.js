import React from 'react'
import { connectReadModel } from 'resolve-redux'

import AuthForm from '../components/AuthForm'
import { rootPath } from '../constants'

const Login = props => {
  return (
    <div>
      <AuthForm
        buttonText="login"
        action={`${rootPath}/login${props.location.search}`}
        title="Login"
      />
      <AuthForm
        buttonText="create account"
        action={`${rootPath}/register`}
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
