import React from 'react'
import ReactDOM from 'react-dom/server'
import createHistory from 'history/createMemoryHistory'
import jsonwebtoken from 'jsonwebtoken'
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

let ServerStyleSheet, StyleSheetManager
try {
  const styledComponents = require('styled-components')
  ServerStyleSheet = styledComponents.ServerStyleSheet
  StyleSheetManager = styledComponents.StyleSheetManager
} catch (err) {}

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
