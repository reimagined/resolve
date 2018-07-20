import React from 'react'
import { ConnectedRouter } from 'react-router-redux'
import { Provider as ReduxProvider } from 'react-redux'

import { Provider as ResolveProvider } from './resolve_context'
import createApi from './create_api'
import Routes from './routes'

class AppContainer extends React.PureComponent {
  render() {
    const {
      origin,
      rootPath,
      staticPath,
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
          staticPath,
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
