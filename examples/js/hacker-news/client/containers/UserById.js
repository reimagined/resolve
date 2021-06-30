import React, { useEffect } from 'react'
import { useReduxReadModel } from '@resolve-js/redux'
import { useSelector } from 'react-redux'
import styled from 'styled-components'
const UserInfoRoot = styled.div`
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
const UserById = ({
  match: {
    params: { userId },
  },
}) => {
  const { request: getUser, selector } = useReduxReadModel(
    {
      name: 'HackerNews',
      resolver: 'user',
      args: { id: userId },
    },
    null,
    []
  )
  const { data: user } = useSelector(selector)
  useEffect(() => {
    getUser()
  }, [getUser])
  return user ? (
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
  ) : null
}
export { UserById }
