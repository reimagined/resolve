import { applyChanges } from 'diff-json'

import getHash from './get_hash'

import {
  LOAD_READMODEL_STATE_REQUEST,
  LOAD_READMODEL_STATE_SUCCESS,
  LOAD_READMODEL_STATE_FAILURE,
  DROP_READMODEL_STATE,
  APPLY_READMODEL_DIFF
} from './action_types'

import { connectorMetaMap, diffVersionsMap } from './constants'

export const dropKey = (state, key) => {
  const nextState = { ...state }
  delete nextState[key]

  return nextState
}

const refreshUpdatedObjects = (
  updatedObject,
  changes,
  embeddedKey = '$index'
) => {
  for (const {
    key,
    changes: nextChanges,
    embeddedKey: nextEmbeddedKey
  } of changes) {
    const calcKey =
      embeddedKey !== '$index' && Array.isArray(updatedObject)
        ? updatedObject.reduce(
            (result, value, idx) => (value[embeddedKey] === key ? idx : result),
            0
          )
        : key

    if (
      updatedObject[calcKey] == null ||
      updatedObject[calcKey].constructor === String ||
      updatedObject[calcKey].constructor === Number ||
      updatedObject[calcKey].constructor === Date
    ) {
      continue
    }

    if (Array.isArray(updatedObject[calcKey])) {
      updatedObject[calcKey] = [...updatedObject[calcKey]]
    } else {
      const nextObject = Object.create(
        Object.getPrototypeOf(updatedObject[calcKey])
      )
      Object.assign(nextObject, updatedObject[calcKey])
      updatedObject[calcKey] = nextObject
    }

    if (Array.isArray(nextChanges)) {
      refreshUpdatedObjects(
        updatedObject[calcKey],
        nextChanges,
        nextEmbeddedKey
      )
    }
  }
}

export default function createReadModelsReducer(readModels) {
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
      },
      [diffVersionsMap]: {
        ...state[diffVersionsMap],
        [key]: 0
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
          state[readModelName][resolverName],
          resolverArgs
        )
      },
      [connectorMetaMap]: dropKey(state[connectorMetaMap], key),
      [diffVersionsMap]: dropKey(state[diffVersionsMap], key)
    }
  }

  handlers[APPLY_READMODEL_DIFF] = (state, action) => {
    const readModelName = action.readModelName
    const resolverName = getHash(action.resolverName)
    const resolverArgs = getHash(action.resolverArgs)

    const wrappedReadModelState = {
      wrap: state[readModelName][resolverName][resolverArgs]
    }

    applyChanges(wrappedReadModelState, action.diff)

    refreshUpdatedObjects(wrappedReadModelState, action.diff)

    return {
      ...state,
      [readModelName]: {
        ...state[readModelName],
        [resolverName]: {
          ...state[readModelName][resolverName],
          [resolverArgs]: wrappedReadModelState.wrap
        }
      }
    }
  }

  let state = {
    [connectorMetaMap]: {},
    [diffVersionsMap]: {}
  }

  return (_, action) => {
    const eventHandler = handlers[action.type]
    if (eventHandler) {
      state = eventHandler(state, action)
    }

    return state
  }
}
