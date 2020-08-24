import getHash from '../internal/get-hash'
import setEntry from 'lodash.set'
import unsetEntry from 'lodash.unset'
import getByPath from 'lodash.get'

import {
  DROP_VIEWMODEL_STATE,
  VIEWMODEL_STATE_UPDATE
} from '../internal/action-types'
import {
  ViewModelResultEntry,
  ViewModelResultMapByName,
  ResultStatus,
  ReduxState
} from '../types'
import {
  DropViewModelStateAction,
  ViewModelAction,
  ViewModelStateUpdateAction
} from './actions'
import { ViewModelQuery } from 'resolve-client'

export type ViewModelResultSelector = {
  query: ViewModelQuery
}

const getSelector = (
  action: ViewModelAction
): ViewModelResultSelector | string => action.selectorId || action

export const getEntryPath = (
  selector: ViewModelResultSelector | string
): string => {
  if (typeof selector === 'string') {
    return `@@resolve/namedSelectors.${getHash(selector)}`
  }
  const {
    query: { name, aggregateIds, args }
  } = selector
  return `${getHash(name)}.${getHash(aggregateIds)}.${getHash(args, 'no-args')}`
}

export const getEntry = (
  state: ViewModelResultMapByName | undefined,
  selector: ViewModelResultSelector | string,
  placeholder?: ViewModelResultEntry
): ViewModelResultEntry =>
  getByPath(state, getEntryPath(selector), placeholder) as ViewModelResultEntry

export const create = (): any => {
  const handlers: { [key: string]: any } = {}

  handlers[VIEWMODEL_STATE_UPDATE] = (
    state: ViewModelResultMapByName,
    action: ViewModelStateUpdateAction
  ): ViewModelResultMapByName =>
    setEntry(
      {
        ...state
      },
      getEntryPath(getSelector(action)),
      {
        status: action.initial ? ResultStatus.Requested : ResultStatus.Ready,
        data: action.state
      }
    )

  handlers[DROP_VIEWMODEL_STATE] = (
    state: ViewModelResultMapByName,
    action: DropViewModelStateAction
  ): ViewModelResultMapByName => {
    const newState = {
      ...state
    }
    unsetEntry(newState, getEntryPath(getSelector(action)))
    return newState
  }

  return (state: ReduxState = {}, action: any): ReduxState => {
    const eventHandler = handlers[action.type]
    if (eventHandler) {
      return eventHandler(state, action)
    }
    return state
  }
}
