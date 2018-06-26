import {
  LOAD_VIEWMODEL_STATE_REQUEST,
  LOAD_VIEWMODEL_STATE_SUCCESS,
  LOAD_VIEWMODEL_STATE_FAILURE,
  DROP_VIEWMODEL_STATE
} from './action_types'

import { aggregateVersionsMap, connectorMetaMap } from './constants'

import { getKey } from './utils'

const dropKey = (state, key) => {
  const nextState = { ...state }
  delete nextState[key]

  return nextState
}

export default function createViewModelsReducer() {
  const context = {
    initialState: {
      [connectorMetaMap]: {},
      [aggregateVersionsMap]: {}
    },
    handlers: {},
    isInitialized: false
  }

  context.handlers[LOAD_VIEWMODEL_STATE_REQUEST] = (
    state,
    { viewModelName, aggregateIds, aggregateArgs }
  ) => {
    return {
      ...state,
      [connectorMetaMap]: {
        ...state[connectorMetaMap],
        [`${viewModelName}${aggregateIds}${aggregateArgs}`]: {
          isLoading: true,
          isFailure: false
        }
      }
    }
  }

  context.handlers[LOAD_VIEWMODEL_STATE_SUCCESS] = (
    state,
    {
      viewModelName,
      aggregateIds,
      aggregateArgs,
      state: viewModelState,
      aggregateVersionsMap: viewModelAggregateVersionsMap
    }
  ) => {
    const key = `${viewModelName}${aggregateIds}${aggregateArgs}`

    return {
      ...state,
      [viewModelName]: {
        ...state[viewModelName],
        [aggregateIds]: {
          ...state[viewModelName][aggregateIds],
          [aggregateArgs]: viewModelState
        }
      },
      [connectorMetaMap]: {
        ...state[connectorMetaMap],
        [key]: {
          isLoading: false,
          isFailure: false
        }
      },
      [aggregateVersionsMap]: {
        ...state[aggregateVersionsMap],
        [key]: viewModelAggregateVersionsMap
      }
    }
  }

  context.handlers[LOAD_VIEWMODEL_STATE_FAILURE] = (
    state,
    { viewModelName, aggregateIds, aggregateArgs }
  ) => {
    const key = `${viewModelName}${aggregateIds}${aggregateArgs}`

    return {
      ...state,
      [connectorMetaMap]: {
        ...state[connectorMetaMap],
        [key]: {
          isLoading: false,
          isFailure: true
        }
      }
    }
  }

  context.handlers[DROP_VIEWMODEL_STATE] = (
    state,
    { viewModelName, aggregateIds, aggregateArgs }
  ) => {
    const key = `${viewModelName}${aggregateIds}${aggregateArgs}`

    return {
      ...state,
      [viewModelName]: {
        ...state[viewModelName],
        [aggregateIds]: dropKey(
          state[viewModelName][aggregateIds],
          aggregateArgs
        )
      },
      [connectorMetaMap]: dropKey(state[connectorMetaMap], key),
      [aggregateVersionsMap]: dropKey(state[aggregateVersionsMap], key)
    }
  }

  return (prevState = {}, action) => {
    let state = prevState
    if (!context.isInitialized) {
      state = {
        ...state,
        ...context.initialState
      }
      context.isInitialized = true
    }

    const eventHandler = context.handlers[action.type]

    if (eventHandler) {
      return eventHandler(state, action)
    }

    return state
  }
}
