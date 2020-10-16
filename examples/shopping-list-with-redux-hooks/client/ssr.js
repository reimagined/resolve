import React from 'react'
import ReactDOM from 'react-dom/server'
import { createStore } from 'resolve-redux'
import { Router } from 'react-router'
import { Helmet } from 'react-helmet'
import { createMemoryHistory } from 'history'
import jsonwebtoken from 'jsonwebtoken'
import * as Redux from 'react-redux'
import { ResolveContext } from 'resolve-react-hooks'

import getRoutes from './get-routes'
import getRedux from './get-redux'
import Routes from '../client/components/Routes'

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

    const context = {
      viewModels,
      subscribeAdapter: {},
      history,
      origin,
      rootPath,
      staticPath: '/',
    }

    const store = createStore({
      ...context,
      redux,
      initialState: { jwt },
      isClient: false,
    })

    const staticContext = {}
    const markup = ReactDOM.renderToStaticMarkup(
      <Redux.Provider store={store}>
        <ResolveContext.Provider value={context}>
          <Router history={history} staticContext={staticContext}>
            <Routes routes={routes} />
          </Router>
        </ResolveContext.Provider>
      </Redux.Provider>
    )

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
