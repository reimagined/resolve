import { Action } from 'redux'
import { QueryResult, ViewModelQuery } from 'resolve-client'
import {
  QueryViewModelFailureAction,
  QueryViewModelRequestAction,
  QueryViewModelSuccessAction
} from './actions'
import { ReduxState } from '../types'

type HookData = {
  request: () => void
  selector: (state: ReduxState) => any
}

type ViewModelReduxActionsCreators = {
  request: (
    query: ViewModelQuery,
    selectorId?: string
  ) => QueryViewModelRequestAction | Action
  success: (
    query: ViewModelQuery,
    result: QueryResult,
    selectorId?: string
  ) => QueryViewModelSuccessAction | Action
  failure: (
    query: ViewModelQuery,
    error: Error,
    selectorId?: string
  ) => QueryViewModelFailureAction | Action
}

function useReduxViewModel(query: ViewModelQuery)
