import React from 'react'
import { connectReadModel } from 'resolve-redux'
import { connect } from 'react-redux'
import { Helmet } from 'react-helmet'

import Login from '../components/Login'
import Logout from '../components/Logout'
import Header from '../components/Header'

export class App extends React.PureComponent {
  render() {
    let LoginComponent = !this.props.me.name ? Login : Logout

    return (
      <div>
        <Helmet>
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />
          <link rel="stylesheet" href="/bootstrap.min.css" />
          <link rel="stylesheet" href="/style.css" />
          <title>reSolve Auth Example</title>
        </Helmet>

        <Header />

        <div className="example-wrapper">
          <LoginComponent username={this.props.me && this.props.me.name} />
        </div>
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
  connect(mapStateToProps)(App)
)
