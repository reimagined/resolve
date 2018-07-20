import React from 'react'
import ReactDOM from 'react-dom/server'
import createHistory from 'history/createMemoryHistory'
import jsonwebtoken from 'jsonwebtoken'
import { ServerStyleSheet, StyleSheetManager } from 'styled-components'
import { createStore, AppContainer } from 'resolve-redux'

import getHtmlMarkup from './get_html_markup'
import getRootBasedUrl from './utils/get_root_based_url'
import getClientJsPath from './utils/get_client_js_path'

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
  const clientUrl = getRootBasedUrl(rootPath, getClientJsPath(staticPath))

  res.send(
    getHtmlMarkup({
      markup,
      styleTags,
      initialState,
      clientUrl
    })
  )
}

export default serverSideRendering
