import getHash from './get_hash'

import {
  QUERY_READMODEL_REQUEST,
  QUERY_READMODEL_SUCCESS,
  QUERY_READMODEL_FAILURE,
  DROP_READMODEL_STATE
} from './action_types'

import { connectorMetaMap } from './constants'

export const dropKey = (state: any, key: any): any => {
  const nextState = { ...state }
  delete nextState[key]

  return nextState
}

export default (): any => {
  const handlers: { [key: string]: any } = {}

  handlers[QUERY_READMODEL_REQUEST] = (state: any, action: any): any => {
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

  handlers[QUERY_READMODEL_SUCCESS] = (state: any, action: any): any => {
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

  handlers[QUERY_READMODEL_FAILURE] = (state: any, action: any): any => {
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

  handlers[DROP_READMODEL_STATE] = (state: any, action: any): any => {
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

  return (_: void, action: any): any => {
    const eventHandler = handlers[action.type]
    if (eventHandler) {
      state = eventHandler(state, action)
    }

    return state
  }
}
