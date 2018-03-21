import React from 'react'
import { gqlConnector } from 'resolve-redux'
import styled from 'styled-components'

const UserInfoRoot = styled.div`
  padding-left: 3em;
  padding-right: 1.25em;
  margin-top: 1em;
  margin-bottom: 0.5em;
`

const Label = styled.div`
  display: inline-block;
  vertical-align: middle;
  width: 60px;
  padding: 5px 0;
`

const Content = styled.div`
  display: inline-block;
  vertical-align: middle;
`

export const UserById = ({ data: { user } }) => {
  if (!user) {
    return null
  }

  return (
    <UserInfoRoot>
      <div>
        <Label>name:</Label>
        <Content>{user.name}</Content>
      </div>
      <div>
        <Label>created:</Label>
        <Content>{new Date(+user.createdAt).toLocaleString('en-US')}</Content>
      </div>
    </UserInfoRoot>
  )
}

export default gqlConnector(
  `
    query($id: ID!) {
      user(id: $id) {
        id
        name
        createdAt
      }
    }
  `,
  {
    options: ({ match: { params: { userId } } }) => ({
      variables: {
        id: userId
      }
    })
  }
)(UserById)
