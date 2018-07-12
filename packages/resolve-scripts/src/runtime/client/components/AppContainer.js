import React from 'react'
import { Provider as ReduxProvider } from 'react-redux'
import { Provider as ResolveProvider, createApi } from 'resolve-redux'
import { ConnectedRouter } from 'react-router-redux'

import Routes from './Routes'

class AppContainer extends React.PureComponent {
  render() {
    const {
      origin,
      rootPath,
      aggregateActions,
      store,
      history,
      routes,
      isSSR
    } = this.props

    const api = createApi({ origin, rootPath })

    return (
      <ResolveProvider
        value={{
          api,
          origin,
          rootPath,
          aggregateActions
        }}
      >
        <ReduxProvider store={store}>
          <ConnectedRouter history={history} isSSR={isSSR}>
            <Routes routes={routes} />
          </ConnectedRouter>
        </ReduxProvider>
      </ResolveProvider>
    )
  }
}

export default AppContainer
