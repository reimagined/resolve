import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import styled from 'styled-components'
import { Link as NormalLink } from 'react-router-dom'

import Splitter from '../components/Splitter'
import * as optimisticActions from '../actions/optimistic-actions'
import Form from './Form'

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

const LoginInfo = ({ me }) => (
  <PageAuth>
    {me && me.id ? (
      <div>
        <Link to={`/user/${me.id}`}>{me.name}</Link>
        <Splitter color="white" />
        <Link
          to="/newest"
          onClick={() =>
            document.getElementById('hidden-form-for-logout').submit()
          }
        >
          logout
        </Link>
        <Form method="post" id="hidden-form-for-logout" action="/api/logout">
          <input type="hidden" name="username" value="null" />
          <input type="hidden" />
        </Form>
      </div>
    ) : (
      <Link to="/login">login</Link>
    )}
  </PageAuth>
)

export const mapStateToProps = state => ({
  me: state.jwt
})

export const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      logout: optimisticActions.logout
    },
    dispatch
  )

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(LoginInfo)
