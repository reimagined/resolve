import React from 'react'
import { Provider as ReduxProvider } from 'react-redux'

import { Provider as ResolveProvider } from './resolve_context'
import createApi from './create_api'

class Providers extends React.PureComponent {
  render() {
    const { origin, rootPath, staticPath, store, children } = this.props

    const api = createApi({ origin, rootPath, store })

    return (
      <ResolveProvider
        value={{
          api,
          origin,
          rootPath,
          staticPath
        }}
      >
        <ReduxProvider store={store}>{children}</ReduxProvider>
      </ResolveProvider>
    )
  }
}

export default Providers
