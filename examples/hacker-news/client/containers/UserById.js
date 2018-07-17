import React from 'react'
import { connectReadModel } from 'resolve-redux'
import { connect } from 'react-redux'
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

export const UserById = ({ user }) => {
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

const mapStateToOptions = (
  state,
  {
    match: {
      params: { userId }
    }
  }
) => ({
  readModelName: 'default',
  resolverName: 'user',
  resolverArgs: { id: userId }
})

const mapStateToProps = (state, { data }) => ({
  user: data,
  me: state.jwt
})

export default connectReadModel(mapStateToOptions)(
  connect(mapStateToProps)(UserById)
)
