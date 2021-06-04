import React from 'react'
import styled from 'styled-components'
import { Form } from '../containers/Form'
const AuthFormRoot = styled.div`
  margin-bottom: 1em;
`
const AuthFormTitle = styled.div`
  display: block;
  font-size: 1.5em;
  margin-bottom: 0.5em;
  margin-left: 0px;
  margin-right: 0px;
  font-weight: bold;
`
const AuthFormContent = styled.div`
  display: block;
  margin-bottom: 0.83em;
`
const AuthForm = ({ title, action, buttonText }) =>
  React.createElement(
    AuthFormRoot,
    null,
    React.createElement(AuthFormTitle, null, title),
    React.createElement(
      Form,
      { method: 'POST', action: action },
      React.createElement(
        AuthFormContent,
        null,
        React.createElement('div', null, 'username:'),
        React.createElement('input', { type: 'text', name: 'username' })
      ),
      React.createElement('input', { type: 'submit', value: buttonText })
    )
  )
export { AuthForm }
