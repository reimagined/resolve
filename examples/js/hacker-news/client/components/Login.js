import React from 'react'
import { AuthForm } from './AuthForm'
const Login = (props) => {
  return React.createElement(
    'div',
    null,
    React.createElement(AuthForm, {
      buttonText: 'login',
      action: `/api/login${props.location.search}`,
      title: 'Login',
    }),
    React.createElement(AuthForm, {
      buttonText: 'create account',
      action: '/api/register',
      title: 'Create account',
    })
  )
}
export { Login }
