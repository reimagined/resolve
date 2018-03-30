import { createStore, applyMiddleware, compose } from 'redux'
import { createResolveMiddleware, actionTypes } from 'resolve-redux'
import Immutable from 'seamless-immutable'
import cookies from 'js-cookie'

import viewModels from '../../common/view-models'
import reducer from '../reducers'
import {
  USER_LOGOUT,
  OPTIMISTIC_STORY_UPVOTED,
  OPTIMISTIC_STORY_UNVOTED
} from '../actions/actionTypes'
import { rootDirectory } from '../constants'

const { SEND_COMMAND } = actionTypes

const isClient = typeof window === 'object'

const composeEnhancers =
  isClient && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
    ? window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({})
    : compose

const logoutMiddleware = () => next => action => {
  if (action.type !== USER_LOGOUT) {
    next(action)
    return
  }
  cookies.remove('authenticationToken')
  window.location.reload()
}

const storyCreateMiddleware = () => next => action => {
  if (action.type === SEND_COMMAND) {
    if (action.command.type === 'createStory') {
      if (action.command.ok) {
        window.location = `${rootDirectory}/storyDetails/${action.aggregateId}`
      } else if (action.command.error) {
        window.location = `${rootDirectory}/error?text=Failed to create a story`
      }
    }
  }
  next(action)
}

const optimisticVotingMiddleware = store => next => action => {
  if (action.type === SEND_COMMAND) {
    if (action.command.type === 'upvoteStory') {
      store.dispatch({
        type: OPTIMISTIC_STORY_UPVOTED,
        storyId: action.aggregateId
      })
    }
    if (action.command.type === 'unvoteStory') {
      store.dispatch({
        type: OPTIMISTIC_STORY_UNVOTED,
        storyId: action.aggregateId
      })
    }
  }
  next(action)
}

export default initialState => {
  const middleware = isClient
    ? [
        createResolveMiddleware({ viewModels }),
        logoutMiddleware,
        storyCreateMiddleware,
        optimisticVotingMiddleware
      ]
    : []

  const enhancer = composeEnhancers(applyMiddleware(...middleware))
  return createStore(reducer, Immutable(initialState), enhancer)
}
