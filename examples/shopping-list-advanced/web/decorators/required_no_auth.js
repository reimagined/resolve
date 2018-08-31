import React from 'react'
import { connect } from 'react-redux'
import { Redirect } from 'react-router-dom'

export const mapStateToProps = state => {
  return {
    jwt: state.jwt
  }
}

const requiredNoAuth = Component => {
  class RequiredNoAuth extends React.PureComponent {
    render() {
      const { jwt, ...props } = this.props

      return jwt.id ? <Redirect to="/" /> : <Component {...props} />
    }
  }

  return connect(mapStateToProps)(RequiredNoAuth)
}

export default requiredNoAuth
