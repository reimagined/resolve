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
type AuthFormProps = { title: string; action: any; buttonText: string }

const AuthForm = ({ title, action, buttonText }: AuthFormProps) => (
  <AuthFormRoot>
    <AuthFormTitle>{title}</AuthFormTitle>
    <Form method="POST" action={action}>
      <AuthFormContent>
        <div>username:</div>
        <input type="text" name="username" />
      </AuthFormContent>
      <input type="submit" value={buttonText} />
    </Form>
  </AuthFormRoot>
)

export { AuthForm }
