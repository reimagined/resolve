import React from 'react'
import { connect } from 'react-redux'
import { Redirect } from 'react-router-dom'

export class RequiredAuth extends React.PureComponent {
  render() {
    const { jwt, children } = this.props

    return jwt.id ? <div>{children}</div> : <Redirect to="/login" />
  }
}

const mapStateToProps = state => {
  return {
    jwt: state.jwt
  }
}

export default connect(mapStateToProps)(RequiredAuth)
