import React from 'react'
import ReactDOM from 'react-dom/server'
import createHistory from 'history/createMemoryHistory'
import jsonwebtoken from 'jsonwebtoken'
import { ServerStyleSheet, StyleSheetManager } from 'styled-components'
import { createStore, AppContainer } from 'resolve-redux'

import getHtmlMarkup from './get_html_markup'
import getStaticBasedPath from './utils/get_static_based_path'

import {
  routes,
  staticPath,
  rootPath,
  jwtCookie,
  aggregateActions,
  redux,
  viewModels,
  readModels,
  aggregates,
  subscribeAdapter
} from './assemblies'

const serverSideRendering = (req, res) => {
  const url = req.params[0] || ''

  const history = createHistory()

  history.push(url)

  const jwt = {}
  try {
    Object.assign(jwt, jsonwebtoken.decode(req.cookies[jwtCookie.name]))
  } catch (e) {}

  const origin = ''

  const store = createStore({
    redux,
    viewModels,
    readModels,
    aggregates,
    subscribeAdapter,
    initialState: {
      jwt
    },
    history,
    origin,
    rootPath,
    isClient: false
  })

  const sheet = new ServerStyleSheet()
  const markup = ReactDOM.renderToStaticMarkup(
    <StyleSheetManager sheet={sheet.instance}>
      <AppContainer
        origin={origin}
        rootPath={rootPath}
        staticPath={staticPath}
        aggregateActions={aggregateActions}
        store={store}
        history={history}
        routes={routes}
        isSSR={true}
      />
    </StyleSheetManager>
  )
  const styleTags = sheet.getStyleTags()

  const initialState = store.getState()
  const bundleUrl = getStaticBasedPath(rootPath, staticPath, 'bundle.js')
  const hmrUrl = getStaticBasedPath(rootPath, staticPath, 'hmr.js')

  res.send(
    getHtmlMarkup({
      markup,
      styleTags,
      initialState,
      bundleUrl,
      hmrUrl
    })
  )
}

export default serverSideRendering
