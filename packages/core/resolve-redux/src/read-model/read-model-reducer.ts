import getHash from '../get-hash'
import setEntry from 'lodash.set'
import unsetEntry from 'lodash.unset'
import getByPath from 'lodash.get'

import {
  QUERY_READMODEL_REQUEST,
  QUERY_READMODEL_SUCCESS,
  QUERY_READMODEL_FAILURE,
  DROP_READMODEL_STATE
} from '../action-types'
import {
  DropReadModelResultAction,
  QueryReadModelFailureAction,
  QueryReadModelRequestAction,
  QueryReadModelSuccessAction
} from './actions'
import { ReadModelResultEntry, ReadModelResultState, ResolveReduxState } from '../types'

export const getEntryPath = ({
  readModelName,
  resolverName,
  resolverArgs
}: {
  readModelName: string
  resolverName: string
  resolverArgs: any
}): string =>
  `${getHash(readModelName)}.${getHash(resolverName)}.${getHash(resolverArgs)}`

export const getEntry = (
  state: ResolveReduxState,
  selector: {
    readModelName: string
    resolverName: string
    resolverArgs: any
  },
  placeholder?: ReadModelResultEntry
): ReadModelResultEntry => getByPath(state, getEntryPath(selector), placeholder)

export const create = (): any => {
  const handlers: { [key: string]: any } = {}

  handlers[QUERY_READMODEL_REQUEST] = (
    state: ResolveReduxState,
    action: QueryReadModelRequestAction
  ): ResolveReduxState =>
    setEntry(
      {
        ...state
      },
      getEntryPath(action),
      {
        state: ReadModelResultState.Requested
      }
    )

  handlers[QUERY_READMODEL_SUCCESS] = (
    state: ResolveReduxState,
    action: QueryReadModelSuccessAction
  ): ResolveReduxState =>
    setEntry(
      {
        ...state
      },
      getEntryPath(action),
      {
        state: ReadModelResultState.Ready,
        data: action.result,
        timestamp: action.timestamp
      }
    )

  handlers[QUERY_READMODEL_FAILURE] = (
    state: ResolveReduxState,
    action: QueryReadModelFailureAction
  ): ResolveReduxState =>
    setEntry(
      {
        ...state
      },
      getEntryPath(action),
      {
        state: ReadModelResultState.Failed,
        data: null,
        error: action.error
      }
    )

  handlers[DROP_READMODEL_STATE] = (
    state: ResolveReduxState,
    action: DropReadModelResultAction
  ): ResolveReduxState => {
    const newState = {
      ...state
    }
    unsetEntry(newState, getEntryPath(action))
    return newState
  }

  return (state: ResolveReduxState = {}, action: any): ResolveReduxState => {
    const eventHandler = handlers[action.type]
    if (eventHandler) {
      return eventHandler(state, action)
    }
    return state
  }
}
