import React from 'react'
import { connect } from 'react-redux'

export const mapStateToProps = state => {
  return {
    jwt: state.jwt
  }
}

const requiredAuth = Component => {
  class RequiredAuth extends React.PureComponent {
    componentDidMount() {
      this.optionalRedirect()
    }

    componentDidUpdate(prevProps) {
      if (prevProps.jwt !== this.props.jwt) {
        this.optionalRedirect()
      }
    }

    optionalRedirect = () => {
      if (!this.props.jwt.id) {
        this.props.navigation.navigate('Login')
      }
    }

    render() {
      const { jwt, ...props } = this.props

      return jwt.id ? <Component {...props} /> : null
    }
  }

  return connect(mapStateToProps)(RequiredAuth)
}

export default requiredAuth
