import React from 'react'
import ReactDOM from 'react-dom/server'
import { createResolveStore, ResolveReduxProvider } from '@resolve-js/redux'
import { StaticRouter } from 'react-router-dom/server'
import { Helmet } from 'react-helmet'
import { StyleSheetManager, ServerStyleSheet } from 'styled-components'
import { createMemoryHistory } from 'history'
import jsonwebtoken from 'jsonwebtoken'

import { getRoutes } from './get-routes'
import { getRedux } from './get-redux'
import { App } from './containers/App'

const ssrHandler = async (serverContext: any, req: any, res: any) => {
  try {
    const {
      serverImports,
      constants,
      seedClientEnvs,
      utils,
      viewModels,
    } = serverContext
    const { getRootBasedUrl, getStaticBasedPath, jsonUtfStringify } = utils
    const { rootPath, staticPath, jwtCookie } = constants

    const history = createMemoryHistory()
    history.push(getRootBasedUrl(rootPath, req.path))

    const redux = getRedux(serverImports, history)

    const jwt = {}
    try {
      Object.assign(jwt, jsonwebtoken.decode(req.cookies[jwtCookie.name]))
    } catch (e) {}

    const resolveContext = {
      ...constants,
      viewModels,
      origin: '',
    }

    const store = createResolveStore(
      resolveContext,
      {
        initialState: { jwt },
        redux,
      },
      false
    )

    const sheet = new ServerStyleSheet()
    const markup = ReactDOM.renderToStaticMarkup(
      <StyleSheetManager sheet={sheet.instance}>
        <ResolveReduxProvider context={resolveContext} store={store}>
          <StaticRouter basename={rootPath} location={req.path}>
            <App routes={getRoutes()} />
          </StaticRouter>
        </ResolveReduxProvider>
      </StyleSheetManager>
    )

    const styleTags = sheet.getStyleTags()

    const initialState = store.getState()
    const bundleUrl = getStaticBasedPath(rootPath, staticPath, 'index.js')
    const faviconUrl = getStaticBasedPath(rootPath, staticPath, 'favicon.png')

    const helmet = Helmet.renderStatic()

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
