import React from 'react'
import { ResolveReduxProvider } from './resolve-redux-provider'
import { Context } from '@resolve-js/client'

class AppContainer extends React.PureComponent<any> {
  constructor(props: any) {
    super(props)
    // eslint-disable-next-line no-console
    console.warn(
      'AppContainer is deprecated and will be removed in future versions, migrate to ResolveReduxProvider'
    )
  }

  render() {
    const { origin, rootPath, staticPath, store, children } = this.props

    const partialContext: Context = {
      rootPath,
      origin,
      staticPath,
      viewModels: [],
    }

    return (
      <ResolveReduxProvider context={partialContext} store={store}>
        {children}
      </ResolveReduxProvider>
    )
  }
}

export default AppContainer
