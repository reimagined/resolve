import React from 'react'
import { ConnectedRouter } from 'react-router-redux'
import Routes from './routes'
import Providers from './providers'

class AppContainer extends React.PureComponent {
  render() {
    const {
      origin,
      rootPath,
      staticPath,
      store,
      history,
      routes,
      isSSR,
      queryMethod = 'GET'
    } = this.props

    return (
      <Providers
        origin={origin}
        rootPath={rootPath}
        staticPath={staticPath}
        store={store}
        queryMethod={queryMethod}
      >
        <ConnectedRouter history={history} isSSR={isSSR}>
          <Routes routes={routes} />
        </ConnectedRouter>
      </Providers>
    )
  }
}

export default AppContainer
