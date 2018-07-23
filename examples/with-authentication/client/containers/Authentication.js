import React from 'react'
import { connectReadModel } from 'resolve-redux'
import { connect } from 'react-redux'

import Login from '../components/Login'
import Logout from '../components/Logout'

export class Authentication extends React.PureComponent {
  render() {
    let LoginComponent = !this.props.me.name ? Login : Logout

    return (
      <div className="example-wrapper">
        <LoginComponent username={this.props.me && this.props.me.name} />
      </div>
    )
  }
}

const mapStateToOptions = () => ({
  readModelName: 'me',
  resolverName: 'me',
  resolverArgs: {}
})

const mapStateToProps = (state, { data }) => ({
  me: data || {}
})

export default connectReadModel(mapStateToOptions)(
  connect(mapStateToProps)(Authentication)
)
