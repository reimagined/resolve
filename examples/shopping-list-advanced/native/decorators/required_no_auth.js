import React from 'react'
import { connect } from 'react-redux'
import { View } from 'react-native'

export const mapStateToProps = state => {
  return {
    jwt: state.jwt
  }
}

const requiredNoAuth = Component => {
  class RequiredNoAuth extends React.PureComponent {
    componentDidMount() {
      this.optionalRedirect()
    }

    componentDidUpdate(prevProps) {
      if (prevProps.jwt !== this.props.jwt) {
        this.optionalRedirect()
      }
    }

    optionalRedirect = () => {
      if (this.props.jwt.id) {
        this.props.navigation.navigate('My Lists')
      }
    }

    render() {
      const { jwt, ...props } = this.props

      return jwt.id ? <View /> : <Component {...props} />
    }
  }

  return connect(mapStateToProps)(RequiredNoAuth)
}

export default requiredNoAuth
