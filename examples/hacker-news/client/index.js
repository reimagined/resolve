import React from 'react'
import { render } from 'react-dom'
import {
  AppContainer,
  createStore,
  deserializeInitialState
} from 'resolve-redux'
import { createBrowserHistory } from 'history'

import createCommentReducer from 'resolve-module-comments/lib/client/reducers/comments'
import resolveChunk from '../dist/common/client/client-chunk'

import createAggregateActions from './create-aggregate-actions'
import optimisticReducer from './reducers/optimistic'
import optimisticVotingSaga from './sagas/optimistic-voting-saga'
import storyCreateSaga from './sagas/story-create-saga'
import getCommentsOptions from './get-comments-options'

import routes from './routes'

const {
  rootPath,
  staticPath,
  viewModels,
  subscribeAdapter,
  clientImports
} = resolveChunk
const commentsOptions = getCommentsOptions(clientImports, 'comments')

const redux = {
  reducers: {
    comments: createCommentReducer({
      aggregateName: commentsOptions.aggregateName,
      readModelName: commentsOptions.readModelName,
      resolverNames: {
        commentsTree: commentsOptions.commentsTree
      },
      commandTypes: {
        createComment: commentsOptions.createComment,
        updateComment: commentsOptions.updateComment,
        removeComment: commentsOptions.removeComment
      }
    }),
    optimistic: optimisticReducer
  },
  sagas: [optimisticVotingSaga, storyCreateSaga],
  middlewares: [],
  enhancers: []
}

const aggregateActions = createAggregateActions(commentsOptions)

const initialState = deserializeInitialState(
  viewModels,
  window.__INITIAL_STATE__
)

const origin =
  window.location.origin == null
    ? window.location.protocol +
      '//' +
      window.location.hostname +
      (window.location.port ? ':' + window.location.port : '')
    : window.location.origin

const history = createBrowserHistory({
  basename: rootPath
})

var store = createStore({
  redux: redux,
  viewModels: viewModels,
  subscribeAdapter: subscribeAdapter,
  initialState: initialState,
  history: history,
  origin: origin,
  rootPath: rootPath,
  isClient: true
})

render(
  <AppContainer
    origin={origin}
    rootPath={rootPath}
    staticPath={staticPath}
    aggregateActions={aggregateActions}
    store={store}
    history={history}
    routes={routes}
  />,
  document.getElementsByClassName('app-container')[0]
)
