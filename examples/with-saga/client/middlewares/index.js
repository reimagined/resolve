import { actionTypes } from 'resolve-redux'

const {
  SEND_COMMAND_REQUEST,
  SEND_COMMAND_SUCCESS,
  LOAD_READMODEL_STATE_SUCCESS
} = actionTypes

const userCreateMiddleware = store => next => action => {
  if (action.commandType === 'createUser') {
    if (action.type === SEND_COMMAND_REQUEST) {
      store.dispatch({ type: 'startLoading' })
    }

    if (action.type === SEND_COMMAND_SUCCESS) {
      store.dispatch({ type: 'endLoading' })
    }
  }

  if (action.type === LOAD_READMODEL_STATE_SUCCESS) {
    store.dispatch({
      type: 'OptimisticSync',
      payload: {
        originalUsers: action.result
      }
    })
  }

  next(action)
}

export default [userCreateMiddleware]
