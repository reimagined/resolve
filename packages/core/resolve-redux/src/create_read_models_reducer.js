import getHash from './get_hash'

import {
  LOAD_READMODEL_STATE_REQUEST,
  LOAD_READMODEL_STATE_SUCCESS,
  LOAD_READMODEL_STATE_FAILURE,
  DROP_READMODEL_STATE
} from './action_types'

import { connectorMetaMap } from './constants'

export const dropKey = (state, key) => {
  const nextState = { ...state }
  delete nextState[key]

  return nextState
}

export default function createReadModelsReducer() {
  const handlers = {}

  handlers[LOAD_READMODEL_STATE_REQUEST] = (state, action) => {
    const readModelName = action.readModelName
    const resolverName = getHash(action.resolverName)
    const resolverArgs = getHash(action.resolverArgs)

    return {
      ...state,
      [connectorMetaMap]: {
        ...state[connectorMetaMap],
        [`${readModelName}${resolverName}${resolverArgs}`]: {
          isLoading: true,
          isFailure: false
        }
      }
    }
  }

  handlers[LOAD_READMODEL_STATE_SUCCESS] = (state, action) => {
    const readModelName = action.readModelName
    const resolverName = getHash(action.resolverName)
    const resolverArgs = getHash(action.resolverArgs)
    const readModelState = action.result

    const key = `${readModelName}${resolverName}${resolverArgs}`

    return {
      ...state,
      [readModelName]: {
        ...(state[readModelName] || {}),
        [resolverName]: {
          ...((state[readModelName] || {})[resolverName] || {}),
          [resolverArgs]: readModelState
        }
      },
      [connectorMetaMap]: {
        ...state[connectorMetaMap],
        [key]: {
          isLoading: false,
          isFailure: false
        }
      }
    }
  }

  handlers[LOAD_READMODEL_STATE_FAILURE] = (state, action) => {
    const readModelName = action.readModelName
    const resolverName = getHash(action.resolverName)
    const resolverArgs = getHash(action.resolverArgs)
    const error = action.error

    const key = `${readModelName}${resolverName}${resolverArgs}`

    return {
      ...state,
      [connectorMetaMap]: {
        ...state[connectorMetaMap],
        [key]: {
          isLoading: false,
          isFailure: true,
          error
        }
      }
    }
  }

  handlers[DROP_READMODEL_STATE] = (state, action) => {
    const readModelName = action.readModelName
    const resolverName = getHash(action.resolverName)
    const resolverArgs = getHash(action.resolverArgs)

    const key = `${readModelName}${resolverName}${resolverArgs}`

    return {
      ...state,
      [readModelName]: {
        ...state[readModelName],
        [resolverName]: dropKey(
          (state[readModelName] || {})[resolverName],
          resolverArgs
        )
      },
      [connectorMetaMap]: dropKey(state[connectorMetaMap], key)
    }
  }

  let state = {
    [connectorMetaMap]: {}
  }

  return (_, action) => {
    const eventHandler = handlers[action.type]
    if (eventHandler) {
      state = eventHandler(state, action)
    }

    return state
  }
}
