import React from 'react'
import ReactDOM from 'react-dom/server'
import { createMemoryHistory } from 'history'
import jsonwebtoken from 'jsonwebtoken'
import { createStore, AppContainer } from '@resolve-js/redux'
import { Helmet } from 'react-helmet'
import { StyleSheetManager, ServerStyleSheet } from 'styled-components'

import getRoutes from './get-routes'
import getRedux from './get-redux'
import Routes from '../client/components/Routes'
import { Router } from 'react-router'

const ssrHandler = async (
  { serverImports, constants, seedClientEnvs, viewModels, utils },
  req,
  res
) => {
  try {
    const { getRootBasedUrl, getStaticBasedPath, jsonUtfStringify } = utils
    const { rootPath, staticPath, jwtCookie } = constants

    const redux = getRedux(serverImports)
    const routes = getRoutes(serverImports)

    const baseQueryUrl = getRootBasedUrl(rootPath, '/')
    const origin = ''
    const url = req.path.substring(baseQueryUrl.length)
    const history = createMemoryHistory()
    history.push(url)

    const jwt = {}
    try {
      Object.assign(jwt, jsonwebtoken.decode(req.cookies[jwtCookie.name]))
    } catch (e) {}

    const store = createStore({
      initialState: { jwt },
      redux,
      viewModels,
      subscriber: {},
      history,
      origin,
      rootPath,
      isClient: false,
    })

    const staticContext = {}
    const sheet = new ServerStyleSheet()
    const markup = ReactDOM.renderToStaticMarkup(
      <StyleSheetManager sheet={sheet.instance}>
        <AppContainer
          origin={origin}
          rootPath={rootPath}
          staticPath={staticPath}
          store={store}
        >
          <Router history={history} staticContext={staticContext}>
            <Routes routes={routes} />
          </Router>
        </AppContainer>
      </StyleSheetManager>
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
      `<div id="app-container">${markup}</div>` +
      `<script src="${bundleUrl}"></script>` +
      '</body>' +
      '</html>'

    await res.setHeader('Content-Type', 'text/html')

    await res.end(markupHtml)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('SSR error', error)
    res.status(500)
    res.end('SSR error')
  }
}

export default ssrHandler
