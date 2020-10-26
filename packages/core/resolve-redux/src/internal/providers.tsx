import React from 'react'
import { Provider as ReduxProvider } from 'react-redux'

import { Provider as ResolveProvider } from './resolve-context'

class Providers extends React.PureComponent<any> {
  render() {
    const { origin, rootPath, staticPath, store, children } = this.props

    return (
      <ResolveProvider
        value={{
          origin,
          rootPath,
          staticPath,
        }}
      >
        <ReduxProvider store={store}>{children}</ReduxProvider>
      </ResolveProvider>
    )
  }
}

export default Providers
