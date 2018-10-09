import { actionTypes } from 'resolve-redux'
import { routerActions } from 'react-router-redux'

const { SEND_COMMAND_SUCCESS, SEND_COMMAND_FAILURE } = actionTypes

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

export default storyCreateMiddleware
