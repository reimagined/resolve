import React from 'react'
import { useSelector } from 'react-redux'
import styled from 'styled-components'
import { Link as NormalLink } from 'react-router-dom'
import { Splitter } from '../components/Splitter'
import { Form } from './Form'
const Link = styled(NormalLink)`
  color: white;

  &.active {
    font-weight: bold;
    text-decoration: underline;
  }
`
const PageAuth = styled.div`
  float: right;
`
const LoginInfo = () => {
  const me = useSelector((state) => state.jwt)
  return React.createElement(
    PageAuth,
    null,
    me && me.id
      ? React.createElement(
          'div',
          null,
          React.createElement(Link, { to: `/user/${me.id}` }, me.name),
          React.createElement(Splitter, { color: 'white' }),
          React.createElement(
            Link,
            {
              to: '/newest',
              onClick: () =>
                document.getElementById('hidden-form-for-logout').submit(),
            },
            'logout'
          ),
          React.createElement(
            Form,
            {
              method: 'post',
              id: 'hidden-form-for-logout',
              action: '/api/logout',
            },
            React.createElement('input', {
              type: 'hidden',
              name: 'username',
              value: 'null',
            }),
            React.createElement('input', { type: 'hidden' })
          )
        )
      : React.createElement(Link, { to: '/login' }, 'login')
  )
}
export { LoginInfo }
