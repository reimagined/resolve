import React from 'react'
import { connectReadModel } from 'resolve-redux'
import styled from 'styled-components'
import { NavLink } from 'react-router-dom'

import Splitter from '../components/Splitter'
import { connect } from 'react-redux'
import * as userActions from '../actions/userActions'
import { bindActionCreators } from 'redux'

const Link = styled(NavLink)`
  color: white;

  &.active {
    font-weight: bold;
    text-decoration: underline;
  }
`

const PageAuth = styled.div`
  float: right;
`

const LoginInfo = ({ data: { me } }) => (
  <PageAuth>
    {me ? (
      <div>
        <Link to={`/user/${me.id}`}>{me.name}</Link>
        <Splitter color="white" />
        <Link
          to="/"
          onClick={() =>
            document.getElementById('hidden-form-for-logout').submit()
          }
        >
          logout
        </Link>
        <form method="post" id="hidden-form-for-logout" action="logout">
          <input type="hidden" name="username" value="null" />
          <input type="hidden" />
        </form>
      </div>
    ) : (
      <Link to="/login">login</Link>
    )}
  </PageAuth>
)

export const mapStateToProps = () => ({})

export const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      logout: userActions.logout
    },
    dispatch
  )

const getReadModelData = state => {
  try {
    return { me: state.readModels['default']['me'] }
  } catch (err) {
    return { me: null }
  }
}

export default connectReadModel(state => ({
  readModelName: 'default',
  resolverName: 'me',
  variables: {},
  data: getReadModelData(state)
}))(connect(mapStateToProps, mapDispatchToProps)(LoginInfo))
