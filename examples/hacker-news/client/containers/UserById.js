import React from 'react'
import { connectReadModel } from 'resolve-redux'
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

const getReadModelData = state => {
  try {
    return {
      user: state.readModels['default']['user'].user,
      me: state.readModels['default']['user'].me
    }
  } catch (err) {
    return { user: null, me: null }
  }
}

export default connectReadModel((state, { match: { params: { userId } } }) => ({
  readModelName: 'default',
  resolverName: 'user',
  variables: { id: userId },
  data: getReadModelData(state)
}))(UserById)
