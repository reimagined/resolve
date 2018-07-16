import React from 'react'
import styled from 'styled-components'

import From from '../containers/Form'

const AuthFormRoot = styled.div`
  padding-left: 3em;
  padding-right: 1.25em;
  margin-top: 1em;
  margin-bottom: 0.83em;
`

const AuthFormTitle = styled.div`
  display: block;
  font-size: 1.5em;
  margin-top: 0.83em;
  margin-bottom: 0.83em;
  margin-left: 0px;
  margin-right: 0px;
  font-weight: bold;
`

const AuthFormContent = styled.div`
  display: block;
  margin-bottom: 0.83em;
`

const AuthForm = ({ title, action, buttonText }) => (
  <AuthFormRoot>
    <AuthFormTitle>{title}</AuthFormTitle>
    <From method="POST" action={action}>
      <AuthFormContent>
        username: <input type="text" name="username" />
      </AuthFormContent>
      <input type="submit" value={buttonText} />
    </From>
  </AuthFormRoot>
)

export default AuthForm
