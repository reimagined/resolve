import React from 'react'
import { Provider as ReduxProvider } from 'react-redux'
import { Provider as ResolveProvider } from 'resolve-redux'
import { ConnectedRouter } from 'react-router-redux'

import Routes from './Routes'

class AppContainer extends React.PureComponent {
  render() {
    const { aggregateActions, store, history, routes } = this.props

    return (
      <ResolveProvider
        value={{
          aggregateActions
        }}
      >
        <ReduxProvider store={store}>
          <ConnectedRouter history={history}>
            <Routes routes={routes} />
          </ConnectedRouter>
        </ReduxProvider>
      </ResolveProvider>
    )
  }
}

export default AppContainer
