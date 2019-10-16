import { message } from '../constants'

export default ({ resolveConfig, isClient }) => {
  if (resolveConfig.redux == null || resolveConfig.routes == null) {
    throw new Error(`${message.configNotContainSectionError}redux, routes`)
  }
  if (!isClient) {
    throw new Error(
      `${message.clientAliasInServerCodeError}$resolve.reactClientEntry`
    )
  }

  return {
    code: `
      import React from 'react'
      import { render } from 'react-dom'
      import { AppContainer, createStore, deserializeInitialState } from 'resolve-redux'
      import { createBrowserHistory } from 'history'

      import reactIsomorphic from '$resolve.reactIsomorphic'
      import rootPath from '$resolve.rootPath'
      import staticPath from '$resolve.staticPath'
      import viewModels from '$resolve.viewModels'
      import subscribeAdapter from '$resolve.subscribeAdapter'

      var initialState = deserializeInitialState(
        viewModels,
        window.__INITIAL_STATE__
      )

      var origin =
        window.location.origin == null
          ? window.location.protocol +
            '//' +
            window.location.hostname +
            (window.location.port ? ':' + window.location.port : '')
          : window.location.origin

      var history = createBrowserHistory({
        basename: rootPath
      })

      var store = createStore({
        redux: reactIsomorphic.redux,
        viewModels: viewModels,
        subscribeAdapter: subscribeAdapter,
        initialState: initialState,
        history: history,
        origin: origin,
        rootPath: rootPath,
        isClient: true
      })

      render(
        <AppContainer
          origin={origin}
          rootPath={rootPath}
          staticPath={staticPath}
          store={store}
          history={history}
          routes={reactIsomorphic.routes}
        />,
        document.getElementsByClassName('app-container')[0]
      )
    `
  }
}
