import getHash from '../get-hash'
import setEntry from 'lodash.set'
import unsetEntry from 'lodash.unset'

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

export enum ReadModelResultState {
  Requested,
  Ready,
  Failed
}

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

export const create = (): any => {
  const handlers: { [key: string]: any } = {}

  handlers[QUERY_READMODEL_REQUEST] = (
    state: any,
    action: QueryReadModelRequestAction
  ): any =>
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
    state: any,
    action: QueryReadModelSuccessAction
  ): any =>
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
    state: any,
    action: QueryReadModelFailureAction
  ): any =>
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
    state: any,
    action: DropReadModelResultAction
  ): any => {
    const newState = {
      ...state
    }
    unsetEntry(newState, getEntryPath(action))
    return newState
  }

  return (state: any = {}, action: any): any => {
    const eventHandler = handlers[action.type]
    if (eventHandler) {
      return eventHandler(state, action)
    }

    return state
  }
}
