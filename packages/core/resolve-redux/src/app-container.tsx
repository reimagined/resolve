import React from 'react'
import Providers from './internal/providers'

class AppContainer extends React.PureComponent<any> {
  render() {
    const { origin, rootPath, staticPath, store, children } = this.props

    return (
      <Providers
        origin={origin}
        rootPath={rootPath}
        staticPath={staticPath}
        store={store}
      >
        {children}
      </Providers>
    )
  }
}

export default AppContainer
