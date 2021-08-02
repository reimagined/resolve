import setEntry from 'lodash.set'
import unsetEntry from 'lodash.unset'
import getByPath from 'lodash.get'
import cloneDeep from 'lodash.clonedeep'
import { ReadModelQuery } from '@resolve-js/client'
import getHash from '../internal/get-hash'

import {
  QUERY_READMODEL_REQUEST,
  QUERY_READMODEL_SUCCESS,
  QUERY_READMODEL_FAILURE,
  DROP_READMODEL_STATE,
} from '../internal/action-types'
import {
  ReadModelAction,
  DropReadModelResultAction,
  QueryReadModelFailureAction,
  QueryReadModelRequestAction,
  QueryReadModelSuccessAction,
} from './actions'
import {
  ReadModelResultEntry,
  ReadModelResultMapByName,
  ResultStatus,
} from '../types'

type ReadModelActions =
  | DropReadModelResultAction
  | QueryReadModelFailureAction
  | QueryReadModelRequestAction
  | QueryReadModelSuccessAction

export const namedSelectors = 'namedSelectors'
export const badSelectorDrain = 'badSelectorDrain'
export const builtInSelectors = 'builtInSelectors'

type ReadModelResultEntrySelector = {
  query: ReadModelQuery
}

export type ReadModelReducerState = {
  [namedSelectors]?: {
    [key: string]: ReadModelResultEntry
  }
  [badSelectorDrain]?: ReadModelResultEntry
  [builtInSelectors]?: ReadModelResultMapByName
}

const getSelector = (
  action: ReadModelAction
): ReadModelResultEntrySelector | string => action.selectorId || action

const getEntryPath = (
  selector: ReadModelResultEntrySelector | string
): string => {
  if (typeof selector === 'string') {
    return `${namedSelectors}.${getHash(selector)}`
  }
  const {
    query: { name, resolver, args },
  } = selector
  return `${builtInSelectors}.${getHash(name)}.${getHash(resolver)}.${getHash(
    args
  )}`
}

export const getEntry = (
  state: ReadModelResultMapByName | undefined,
  selector: ReadModelResultEntrySelector | string,
  placeholder?: ReadModelResultEntry
): ReadModelResultEntry =>
  getByPath(state, getEntryPath(selector), placeholder) as ReadModelResultEntry

const initialState: ReadModelReducerState = {}

export const reducer = (
  state = initialState,
  action: ReadModelActions
): ReadModelReducerState => {
  switch (action.type) {
    case QUERY_READMODEL_REQUEST:
      return setEntry(cloneDeep(state), getEntryPath(getSelector(action)), {
        status: ResultStatus.Requested,
        data: action.initialState,
      })

    case QUERY_READMODEL_SUCCESS:
      return setEntry(cloneDeep(state), getEntryPath(getSelector(action)), {
        status: ResultStatus.Ready,
        data: action.result.data,
      })

    case QUERY_READMODEL_FAILURE:
      return setEntry(cloneDeep(state), getEntryPath(getSelector(action)), {
        status: ResultStatus.Failed,
        data: null,
        error: action.error?.message ?? 'unknown error',
      })

    case DROP_READMODEL_STATE:
      const newState = cloneDeep(state)
      unsetEntry(newState, getEntryPath(getSelector(action)))
      return newState

    default:
      return state
  }
}
