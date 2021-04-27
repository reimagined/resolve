import getHash from '../internal/get-hash'
import setEntry from 'lodash.set'
import unsetEntry from 'lodash.unset'
import getByPath from 'lodash.get'
import cloneDeep from 'lodash.clonedeep'

import {
  DROP_VIEWMODEL_STATE,
  VIEWMODEL_STATE_UPDATE,
} from '../internal/action-types'
import {
  ViewModelResultEntry,
  ViewModelResultMapByName,
  ResultStatus,
} from '../types'
import {
  DropViewModelStateAction,
  ViewModelAction,
  ViewModelStateUpdateAction,
} from './actions'
import { ViewModelQuery } from '@resolve-js/client'

type ViewModelActions = DropViewModelStateAction | ViewModelStateUpdateAction

export const namedSelectors = 'namedSelectors'
export const builtInSelectors = 'builtInSelectors'

type ViewModelResultSelector = {
  query: ViewModelQuery
}

export type ViewModelReducerState = {
  [namedSelectors]?: {
    [key: string]: ViewModelResultEntry
  }
  [builtInSelectors]?: ViewModelResultMapByName
}

const getSelector = (
  action: ViewModelAction
): ViewModelResultSelector | string => action.selectorId || action

export const getEntryPath = (
  selector: ViewModelResultSelector | string
): string => {
  if (typeof selector === 'string') {
    return `${namedSelectors}.${getHash(selector)}`
  }
  const {
    query: { name, aggregateIds, args },
  } = selector
  return `${builtInSelectors}.${getHash(name)}.${getHash(
    aggregateIds
  )}.${getHash(args, 'no-args')}`
}

export const getEntry = (
  state: ViewModelResultMapByName | undefined,
  selector: ViewModelResultSelector | string,
  placeholder?: ViewModelResultEntry
): ViewModelResultEntry =>
  getByPath(state, getEntryPath(selector), placeholder) as ViewModelResultEntry

const initialState: ViewModelReducerState = {}

export const reducer = (
  state = initialState,
  action: ViewModelActions
): ViewModelReducerState => {
  switch (action.type) {
    case VIEWMODEL_STATE_UPDATE:
      return setEntry(cloneDeep(state), getEntryPath(getSelector(action)), {
        status: action.initial ? ResultStatus.Requested : ResultStatus.Ready,
        data: action.state,
      })

    case DROP_VIEWMODEL_STATE:
      const newState = cloneDeep(state)
      unsetEntry(newState, getEntryPath(getSelector(action)))
      return newState

    default:
      return state
  }
}
