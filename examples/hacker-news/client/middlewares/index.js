import { actionTypes } from 'resolve-redux'
import { routerActions, LOCATION_CHANGE } from 'react-router-redux'
import { ROUTE_CHANGED } from '../actions/actionTypes'

import {
  OPTIMISTIC_STORY_UPVOTED,
  OPTIMISTIC_STORY_UNVOTED
} from '../actions/actionTypes'

const {
  SEND_COMMAND_SUCCESS,
  SEND_COMMAND_FAILURE,
  LOAD_VIEWMODEL_STATE_SUCCESS,
  LOAD_READMODEL_STATE_SUCCESS
} = actionTypes

const storyCreateMiddleware = store => next => action => {
  if (
    action.type === SEND_COMMAND_SUCCESS &&
    action.commandType === 'createStory'
  ) {
    setTimeout(() => {
      store.dispatch(routerActions.push(`/storyDetails/${action.aggregateId}`))
    }, 100)
  }
  if (
    action.type === SEND_COMMAND_FAILURE &&
    action.commandType === 'createStory'
  ) {
    setTimeout(() => {
      store.dispatch(routerActions.push(`/error?text=Failed to create a story`))
    }, 100)
  }
  next(action)
}

const optimisticVotingMiddleware = store => next => action => {
  if (
    action.type === SEND_COMMAND_SUCCESS &&
    action.commandType === 'upvoteStory'
  ) {
    store.dispatch({
      type: OPTIMISTIC_STORY_UPVOTED,
      storyId: action.aggregateId
    })
  }
  if (
    action.type === SEND_COMMAND_SUCCESS &&
    action.commandType === 'unvoteStory'
  ) {
    store.dispatch({
      type: OPTIMISTIC_STORY_UNVOTED,
      storyId: action.aggregateId
    })
  }

  next(action)
}

const routeChangeMiddleware = store => next => action => {
  if (action.type === LOCATION_CHANGE) {
    setTimeout(() => {
      store.dispatch({
        type: ROUTE_CHANGED,
        route: null
      })
    }, 1000)
  }
  if (
    action.type === LOAD_VIEWMODEL_STATE_SUCCESS ||
    action.type === LOAD_READMODEL_STATE_SUCCESS
  ) {
    const route = store.getState().prefetchRoute
    if (route) {
      store.dispatch(routerActions.push(route))
    }
  }

  next(action)
}

export default [
  storyCreateMiddleware,
  optimisticVotingMiddleware,
  routeChangeMiddleware
]
