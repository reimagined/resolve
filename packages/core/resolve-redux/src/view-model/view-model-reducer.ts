import getHash from '../get-hash'

import {
  QUERY_VIEWMODEL_REQUEST,
  QUERY_VIEWMODEL_SUCCESS,
  QUERY_VIEWMODEL_FAILURE,
  DROP_VIEWMODEL_STATE,
  CONNECT_VIEWMODEL,
  DISCONNECT_VIEWMODEL
} from '../action-types'

import {
  connectorMetaMap,
  aggregateVersionsMap,
  lastTimestampMap
} from '../constants'

export const dropKey = (state: any, key: any): any => {
  const nextState = { ...state }
  delete nextState[key]

  return nextState
}

export const create = (viewModels: any[]): any => {
  const handlers: { [key: string]: any } = {}

  handlers[QUERY_VIEWMODEL_REQUEST] = (state: any, action: any): any => {
    const viewModelName = action.viewModelName
    const aggregateIds = getHash(action.aggregateIds)
    const aggregateArgs = getHash(action.aggregateArgs)

    const key = `${viewModelName}${aggregateIds}${aggregateArgs}`

    return {
      ...state,
      [connectorMetaMap]: {
        ...state[connectorMetaMap],
        [`${viewModelName}${aggregateIds}${aggregateArgs}`]: {
          isLoading: true,
          isFailure: false
        }
      },
      [aggregateVersionsMap]: {
        ...state[aggregateVersionsMap],
        [key]: {}
      },
      [lastTimestampMap]: {
        ...state[lastTimestampMap],
        [key]: +Infinity
      }
    }
  }

  handlers[QUERY_VIEWMODEL_SUCCESS] = (state: any, action: any): any => {
    const viewModelName = action.viewModelName
    const aggregateIds = getHash(action.aggregateIds)
    const aggregateArgs = getHash(action.aggregateArgs)
    const viewModelState = action.result
    const viewModelTimestamp = action.timestamp

    const key = `${viewModelName}${aggregateIds}${aggregateArgs}`

    return {
      ...state,
      [viewModelName]: {
        ...(state[viewModelName] || {}),
        [aggregateIds]: {
          ...((state[viewModelName] || {})[aggregateIds] || {}),
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
      [lastTimestampMap]: {
        ...state[lastTimestampMap],
        [key]: viewModelTimestamp
      }
    }
  }

  handlers[QUERY_VIEWMODEL_FAILURE] = (state: any, action: any): any => {
    const viewModelName = action.viewModelName
    const aggregateIds = getHash(action.aggregateIds)
    const aggregateArgs = getHash(action.aggregateArgs)
    const error = action.error

    const key = `${viewModelName}${aggregateIds}${aggregateArgs}`

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

  handlers[DROP_VIEWMODEL_STATE] = (state: any, action: any): any => {
    const viewModelName = action.viewModelName
    const aggregateIds = getHash(action.aggregateIds)
    const aggregateArgs = getHash(action.aggregateArgs)

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
      [aggregateVersionsMap]: dropKey(state[aggregateVersionsMap], key),
      [lastTimestampMap]: dropKey(state[lastTimestampMap], key)
    }
  }

  const aggregateHash = new Map()

  handlers[CONNECT_VIEWMODEL] = (state: any, action: any): any => {
    if (action.aggregateIds !== '*') {
      const aggregatesKey = getHash(action.aggregateIds)
      for (const aggregateId of action.aggregateIds) {
        if (!aggregateHash.has(aggregateId)) {
          aggregateHash.set(aggregateId, [])
        }
        aggregateHash.get(aggregateId).push(aggregatesKey)
      }
    }
    return state
  }

  handlers[DISCONNECT_VIEWMODEL] = (state: any, action: any): any => {
    if (action.aggregateIds !== '*') {
      const aggregatesKey = getHash(action.aggregateIds)
      for (const aggregateId of action.aggregateIds) {
        const aggregateKeys = aggregateHash.get(aggregateId)
        const idx = aggregateKeys.indexOf(aggregatesKey)
        if (idx >= 0) {
          aggregateKeys.splice(idx, 1)
        }
        if (aggregateKeys.length === 0) {
          aggregateHash.delete(aggregateId)
        }
      }
    }
    return state
  }

  const uniqueListeners = new Map()

  for (const viewModel of viewModels) {
    for (const eventType of Object.keys(viewModel.projection).filter(
      eventType => eventType !== 'Init'
    )) {
      if (!uniqueListeners.has(eventType)) {
        uniqueListeners.set(eventType, [])
      }
      uniqueListeners.get(eventType).push(viewModel)
    }
  }

  for (const [eventType, viewModels] of uniqueListeners.entries()) {
    handlers[eventType] = (state: any, action: any): any => {
      for (const viewModel of viewModels) {
        const handler = viewModel.projection[action.type]

        const aggregateKeys: string[] = Array.from(
          new Set(aggregateHash.get(action.aggregateId))
        )

        for (const aggregateKey of aggregateKeys) {
          if (state[viewModel.name] && state[viewModel.name][aggregateKey]) {
            for (const aggregateArgs of Object.keys(
              state[viewModel.name][aggregateKey]
            )) {
              state[viewModel.name][aggregateKey][aggregateArgs] = handler(
                state[viewModel.name][aggregateKey][aggregateArgs],
                action
              )
            }

            state[viewModel.name][aggregateKey] = {
              ...state[viewModel.name][aggregateKey]
            }
          }
        }

        if (state[viewModel.name] && state[viewModel.name]['*']) {
          for (const aggregateArgs of Object.keys(state[viewModel.name]['*'])) {
            state[viewModel.name]['*'][aggregateArgs] = handler(
              state[viewModel.name]['*'][aggregateArgs],
              action
            )
          }

          state[viewModel.name]['*'] = { ...state[viewModel.name]['*'] }
        }

        state[viewModel.name] = { ...state[viewModel.name] }
      }

      return { ...state }
    }
  }

  let state = {
    [connectorMetaMap]: {},
    [aggregateVersionsMap]: {},
    [lastTimestampMap]: {}
  }

  return (_: void, action: any) => {
    const eventHandler = handlers[action.type]
    if (eventHandler) {
      state = eventHandler(state, action)
    }

    return state
  }
}
