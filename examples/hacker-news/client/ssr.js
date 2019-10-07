import React from 'react'
import ReactDOM from 'react-dom/server'
import { createMemoryHistory } from 'history'
import jsonwebtoken from 'jsonwebtoken'
import { createStore, AppContainer } from 'resolve-redux'
import { Helmet } from 'react-helmet'
import { ServerStyleSheet, StyleSheetManager } from 'styled-components'

import getRootBasedUrl from 'resolve-runtime/lib/common/utils/get-root-based-url'
import getStaticBasedPath from 'resolve-runtime/lib/common/utils/get-static-based-path'
import jsonUtfStringify from 'resolve-runtime/lib/common/utils/json-utf-stringify'

import getRedux from './get-redux'
import routes from './routes'

const markupHandler = async (req, res) => {
  const {
    seedClientEnvs,
    rootPath,
    staticPath,
    viewModels,
    jwtCookie,
    serverImports
  } = req.resolve
  const { aggregateActions, ...redux } = getRedux(serverImports, 'comments')
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
    subscribeAdapter: {},
    initialState: { jwt },
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

  const sheet = new ServerStyleSheet()

  const markup = ReactDOM.renderToStaticMarkup(
    <StyleSheetManager sheet={sheet.instance}>{appContainer}</StyleSheetManager>
  )

  const styleTags = sheet.getStyleTags()

  const initialState = store.getState()
  const bundleUrl = getStaticBasedPath(rootPath, staticPath, 'index.js')
  const faviconUrl = getStaticBasedPath(rootPath, staticPath, 'favicon.ico')

  const helmet = Helmet.renderStatic()

  for (const reducerName of Object.keys(redux.reducers)) {
    delete initialState[reducerName]
  }

  const markupHtml =
    `<!doctype html>` +
    `<html ${helmet.htmlAttributes.toString()}>` +
    '<head>' +
    `<link rel="icon" type="image/x-icon" href="${faviconUrl}" />` +
    `${helmet.title.toString()}` +
    `${helmet.meta.toString()}` +
    `${helmet.link.toString()}` +
    `${helmet.style.toString()}` +
    styleTags +
    '<script>' +
    `window.__INITIAL_STATE__=${jsonUtfStringify(initialState)};` +
    `window.__RESOLVE_RUNTIME_ENV__=${jsonUtfStringify(seedClientEnvs)};` +
    '</script>' +
    `${helmet.script.toString()}` +
    '</head>' +
    `<body ${helmet.bodyAttributes.toString()}>` +
    `<div class="app-container">${markup}</div>` +
    `<script src="${bundleUrl}"></script>` +
    '</body>' +
    '</html>'

  await res.setHeader('Content-Type', 'text/html')

  await res.end(markupHtml)
}

export default markupHandler
