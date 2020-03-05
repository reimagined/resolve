import React from 'react'
import Providers from './providers'

class AppContainer extends React.PureComponent {
  render() {
    const {
      origin,
      rootPath,
      staticPath,
      store,
      children,
      queryMethod
    } = this.props

    return (
      <Providers
        origin={origin}
        rootPath={rootPath}
        staticPath={staticPath}
        store={store}
        queryMethod={queryMethod}
      >
        {children}
      </Providers>
    )
  }
}

export default AppContainer
