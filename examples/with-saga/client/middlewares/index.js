import { actionTypes } from 'resolve-redux'

const { SEND_COMMAND_REQUEST, SEND_COMMAND_SUCCESS } = actionTypes

const userCreateMiddleware = store => next => action => {
  if (action.commandType === 'createUser') {
    if (action.type === SEND_COMMAND_REQUEST) {
      store.dispatch({ type: 'startLoading' })
    }

    if (action.type === SEND_COMMAND_SUCCESS) {
      store.dispatch({ type: 'endLoading' })
    }
  }

  next(action)
}

export default [userCreateMiddleware]
