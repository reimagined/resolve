import React from 'react'
import { connect } from 'react-redux'
import { Redirect } from 'react-router-dom'

export const mapStateToProps = state => {
  return {
    jwt: state.jwt
  }
}

const requiredAuth = Component => {
  class RequiredAuth extends React.PureComponent {
    render() {
      const { jwt, ...props } = this.props

      return jwt.id ? <Component {...props} /> : <Redirect to="/login" />
    }
  }

  return connect(mapStateToProps)(RequiredAuth)
}

export default requiredAuth
