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

export class App extends React.PureComponent {
  render() {
    let LoginComponent =
      this.props.data.loading || !this.props.data.me ? Login : Logout

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
          <LoginComponent
            username={this.props.data.me && this.props.data.me.name}
          />
        </div>
      </div>
    )
  }
}

export default connectReadModel(state => ({
  readModelName: 'me',
  resolverName: 'me',
  parameters: {},
  data: getReadModelData(state)
}))(App)
