import React from 'react'
import ReactDOM from 'react-dom/server'
import { createMemoryHistory } from 'history'
import jsonwebtoken from 'jsonwebtoken'
import { createStore, AppContainer, createActions } from 'resolve-redux'
import { Helmet } from 'react-helmet'
import { ServerStyleSheet, StyleSheetManager } from 'styled-components'

import getRootBasedUrl from 'resolve-runtime/lib/common/utils/get-root-based-url'
import getStaticBasedPath from 'resolve-runtime/lib/common/utils/get-static-based-path'
import jsonUtfStringify from 'resolve-runtime/lib/common/utils/json-utf-stringify'

import createCommentReducer from 'resolve-module-comments/lib/client/reducers/comments'
import * as commentsDefaults from 'resolve-module-comments/lib/common/defaults'

import optimisticReducer from './reducers/optimistic'
import optimisticVotingSaga from './sagas/optimistic-voting-saga'
import storyCreateSaga from './sagas/story-create-saga'

import routes from './routes'

const redux = {
  reducers: {
    comments: createCommentReducer({
      aggregateName: commentsDefaults.aggregateName,
      readModelName: commentsDefaults.readModelName,
      resolverNames: {
        commentsTree: commentsDefaults.commentsTree
      },
      commandTypes: {
        createComment: commentsDefaults.createComment,
        updateComment: commentsDefaults.updateComment,
        removeComment: commentsDefaults.removeComment
      }
    }),
    optimistic: optimisticReducer
  },
  sagas: [optimisticVotingSaga, storyCreateSaga],
  middlewares: [],
  enhancers: []
}

const getHtmlMarkup = ({
  reducers,
  seedClientEnvs,
  markup,
  styleTags,
  initialState,
  bundleUrl,
  faviconUrl
}) => {
  const helmet = Helmet.renderStatic()

  for (const reducerName of Object.keys(reducers)) {
    delete initialState[reducerName]
  }

  return (
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
  )
}

const markupHandler = async (req, res) => {
  const {
    seedClientEnvs,
    viewModels,
    readModels,
    aggregates,
    staticPath,
    jwtCookie,
    rootPath
  } = req.resolve

  const aggregateActions = aggregates.reduce(
    (acc, aggregate) => Object.assign(acc, createActions(aggregate)),
    {}
  )

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

  await res.setHeader('Content-Type', 'text/html')
  await res.end(
    getHtmlMarkup({
      reducers: redux.reducers,
      seedClientEnvs,
      markup,
      styleTags,
      initialState,
      bundleUrl,
      faviconUrl
    })
  )
}

export default markupHandler
