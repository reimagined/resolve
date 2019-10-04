import React from 'react'
import { render } from 'react-dom'
import {
  AppContainer,
  createActions,
  createStore,
  deserializeInitialState
} from 'resolve-redux'
import { createBrowserHistory } from 'history'

import createCommentReducer from 'resolve-module-comments/lib/client/reducers/comments'
import * as commentsDefaults from 'resolve-module-comments/lib/common/defaults'

import resolveChunk from '../dist/common/client/client-chunk'

import optimisticReducer from './reducers/optimistic'
import optimisticVotingSaga from './sagas/optimistic-voting-saga'
import storyCreateSaga from './sagas/story-create-saga'

import routes from './routes'

const { rootPath, staticPath, viewModels, subscribeAdapter } = resolveChunk

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

const initialState = deserializeInitialState(
  viewModels,
  window.__INITIAL_STATE__
)

const aggregates = [
  {
    name: 'Story',
    commands: { createStory() {}, upvoteStory() {}, unvoteStory() {} }
  },
  {
    name: 'User',
    commands: { createUser() {}, confirmUser() {}, rejectUser() {} }
  },
  {
    name: commentsDefaults.aggregateName,
    commands: commentsDefaults.commentCommandTypes.reduce((acc, key) => {
      acc[key] = () => {}
      return acc
    }, {})
  }
]

const aggregateActions = aggregates.reduce(
  (acc, aggregate) => Object.assign(acc, createActions(aggregate)),
  {}
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
