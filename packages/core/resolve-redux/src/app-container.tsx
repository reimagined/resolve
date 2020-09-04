import React from 'react'
import Providers from './internal/providers'

class AppContainer extends React.PureComponent<any> {
  render() {
    const {
      origin,
      rootPath,
      staticPath,
      store,
      children,
      queryMethod,
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
