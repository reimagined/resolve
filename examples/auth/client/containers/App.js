import React from 'react'
import { connectReadModel } from 'resolve-redux'
import { Helmet } from 'react-helmet'

import Login from '../components/Login'
import Logout from '../components/Logout'
import Header from '../components/Header'

const getReadModelData = state => {
  try {
    return { me: state.readModels['me']['me'] }
  } catch (err) {
    return { me: null, loading: true }
  }
}

class App extends React.PureComponent {
  render() {
    let isLogin = true
    let LogComponent = Logout

    if (this.props.data.loading || !this.props.data.me) {
      isLogin = false
      LogComponent = Login
    }

    return (
      <div>
        <Helmet>
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />
          <link rel="stylesheet" href="/bootstrap.min.css" />
          <title>reSolve Auth Example</title>
        </Helmet>

        <Header />

        <h1>
          {isLogin
            ? `Hello, ${this.props.data.me.name}`
            : 'You are not logged in'}
        </h1>

        <LogComponent />
      </div>
    )
  }
}

export default connectReadModel(state => ({
  readModelName: 'me',
  resolverName: 'me',
  variables: {},
  data: getReadModelData(state)
}))(App)
