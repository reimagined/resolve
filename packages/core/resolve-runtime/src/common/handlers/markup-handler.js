import React from 'react'
import ReactDOM from 'react-dom/server'
import { createMemoryHistory } from 'history'
import jsonwebtoken from 'jsonwebtoken'
import { createStore, AppContainer } from 'resolve-redux'

import getHtmlMarkup from '../utils/get-html-markup'
import getStaticBasedPath from '../utils/get-static-based-path'
import getRootBasedUrl from '../utils/get-root-based-url'

let ServerStyleSheet, StyleSheetManager
try {
  const styledComponents = require('styled-components')
  ServerStyleSheet = styledComponents.ServerStyleSheet
  StyleSheetManager = styledComponents.StyleSheetManager
} catch (err) {}

const markupHandler = async (req, res) => {
  const {
    seedClientEnvs,
    aggregateActions,
    subscribeAdapter,
    viewModels,
    readModels,
    aggregates,
    staticPath,
    jwtCookie,
    rootPath,
    routes,
    redux
  } = req.resolve

  const baseQueryUrl = getRootBasedUrl(req.resolve.rootPath, '/')
  const url = req.path.substring(baseQueryUrl.length)

  const history = createMemoryHistory()
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

  const appContainer = (
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
  )

  let markup, styleTags

  if (StyleSheetManager) {
    const sheet = new ServerStyleSheet()

    markup = ReactDOM.renderToStaticMarkup(
      <StyleSheetManager sheet={sheet.instance}>
        {appContainer}
      </StyleSheetManager>
    )

    styleTags = sheet.getStyleTags()
  } else {
    markup = ReactDOM.renderToStaticMarkup(appContainer)

    styleTags = ''
  }

  const initialState = store.getState()
  const bundleUrl = getStaticBasedPath(rootPath, staticPath, 'bundle.js')
  const faviconUrl = getStaticBasedPath(rootPath, staticPath, 'favicon.ico')
  const hmrUrl = getStaticBasedPath(rootPath, staticPath, 'hmr.js')

  await res.setHeader('Content-Type', 'text/html')
  await res.end(
    getHtmlMarkup({
      reducers: redux.reducers,
      seedClientEnvs,
      markup,
      styleTags,
      initialState,
      bundleUrl,
      faviconUrl,
      hmrUrl
    })
  )
}

export default markupHandler
