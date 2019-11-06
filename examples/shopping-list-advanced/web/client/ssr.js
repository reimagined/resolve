import React from 'react'
import ReactDOM from 'react-dom/server'
import { createMemoryHistory } from 'history'
import jsonwebtoken from 'jsonwebtoken'
import { createStore, AppContainer } from 'resolve-redux'
import { Helmet } from 'react-helmet'
import { StyleSheetManager, ServerStyleSheet } from 'styled-components'

import getRootBasedUrl from 'resolve-runtime/lib/common/utils/get-root-based-url'
import getStaticBasedPath from 'resolve-runtime/lib/common/utils/get-static-based-path'
import jsonUtfStringify from 'resolve-runtime/lib/common/utils/json-utf-stringify'

import optimisticShoppingListsSaga from './redux/sagas/optimistic-shopping-lists-saga'
import optimisticShoppingListsReducer from './redux/reducers/optimistic-shopping-lists'

import optimisticSharingsSaga from './redux/sagas/optimistic-sharings-saga'
import optimisticSharingsReducer from './redux/reducers/optimistic-sharings'

import routes from './routes'

const ssrHandler = async (
  { constants, seedClientEnvs, viewModels },
  req,
  res
) => {
  try {
    const { rootPath, staticPath, jwtCookie } = constants
    const redux = {
      reducers: {
        optimisticSharings: optimisticSharingsReducer,
        optimisticShoppingLists: optimisticShoppingListsReducer
      },
      sagas: [optimisticSharingsSaga, optimisticShoppingListsSaga]
    }

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
      subscribeAdapter: {},
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
        store={store}
        history={history}
        routes={routes}
        isSSR={true}
      />
    )

    const sheet = new ServerStyleSheet()
    const markup = ReactDOM.renderToStaticMarkup(
      <StyleSheetManager sheet={sheet.instance}>
        {appContainer}
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
      `<div class="app-container">${markup}</div>` +
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
