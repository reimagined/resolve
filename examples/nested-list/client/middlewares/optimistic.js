import { actionTypes } from 'resolve-redux'

const { SEND_COMMAND_SUCCESS, LOAD_READMODEL_STATE_SUCCESS } = actionTypes

export default [
  store => next => action => {
    if (
      action.type === SEND_COMMAND_SUCCESS &&
      action.commandType === 'createList'
    ) {
      store.dispatch({
        type: 'OptimisticListCreated',
        payload: {
          id: action.aggregateId,
          title: action.payload.title
        }
      })
    }
    if (
      action.type === SEND_COMMAND_SUCCESS &&
      action.commandType === 'removeList'
    ) {
      store.dispatch({
        type: 'OptimisticListDeleted',
        payload: {
          id: action.aggregateId
        }
      })
    }
    if (action.type === LOAD_READMODEL_STATE_SUCCESS) {
      store.dispatch({
        type: 'OptimisticSync',
        payload: {
          originalLists: action.result
        }
      })
    }

    next(action)
  }
]
