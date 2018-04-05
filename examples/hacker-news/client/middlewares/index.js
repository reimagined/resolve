import cookies from 'js-cookie'
import {
  USER_LOGOUT,
  OPTIMISTIC_STORY_UPVOTED,
  OPTIMISTIC_STORY_UNVOTED
} from '../actions/actionTypes'
import { rootPath } from '../constants'
import { actionTypes } from 'resolve-redux'
const { SEND_COMMAND } = actionTypes

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
        window.location = `${rootPath}/storyDetails/${action.aggregateId}`
      } else if (action.command.error) {
        window.location = `${rootPath}/error?text=Failed to create a story`
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

export default [
  logoutMiddleware,
  storyCreateMiddleware,
  optimisticVotingMiddleware
]
