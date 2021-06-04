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
  return user
    ? React.createElement(
        UserInfoRoot,
        null,
        React.createElement(
          'div',
          null,
          React.createElement(Label, null, 'name:'),
          React.createElement(Content, null, user.name)
        ),
        React.createElement(
          'div',
          null,
          React.createElement(Label, null, 'created:'),
          React.createElement(
            Content,
            null,
            new Date(+user.createdAt).toLocaleString('en-US')
          )
        )
      )
    : null
}
export { UserById }
