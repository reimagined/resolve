import { useCallback } from 'react'
import { Action } from 'redux'
import { useDispatch } from 'react-redux'
import { QueryOptions, QueryResult, ReadModelQuery } from 'resolve-client'
import { useQuery } from 'resolve-react-hooks'
import {
  queryReadModelFailure,
  QueryReadModelFailureAction,
  queryReadModelRequest,
  QueryReadModelRequestAction,
  queryReadModelSuccess,
  QueryReadModelSuccessAction
} from './actions'
import { firstOfType } from 'resolve-core'
import { isActionCreators, isDependencies, isOptions } from '../helpers'
import { ReduxState, ResultStatus } from '../types'
import { getEntry } from './read-model-reducer'

type HookData = {
  request: () => void
  selector: (state: ReduxState) => any
}

type ReadModelReduxActionsCreators = {
  request: (
    query: ReadModelQuery,
    initialState: any,
    selectorId?: string
  ) => QueryReadModelRequestAction | Action
  success: (
    query: ReadModelQuery,
    result: QueryResult,
    selectorId?: string
  ) => QueryReadModelSuccessAction | Action
  failure: (
    query: ReadModelQuery,
    error: Error,
    selectorId?: string
  ) => QueryReadModelFailureAction | Action
}

const isReadModelReduxActionsCreators = (
  x: any
): x is ReadModelReduxActionsCreators =>
  isActionCreators(['success', 'request', 'failure'], x)

type ReduxReadModelHookOptions = {
  queryOptions?: QueryOptions
  selectorId?: string
}

const defaultQueryOptions: QueryOptions = {
  method: 'GET'
}

const internalActions: ReadModelReduxActionsCreators = {
  request: queryReadModelRequest,
  success: queryReadModelSuccess,
  failure: queryReadModelFailure
}

function useReduxReadModel(query: ReadModelQuery, initialState: any): HookData
function useReduxReadModel(
  query: ReadModelQuery,
  initialState: any,
  options: ReduxReadModelHookOptions
): HookData
function useReduxReadModel(
  query: ReadModelQuery,
  initialState: any,
  actions: ReadModelReduxActionsCreators
): HookData
function useReduxReadModel(
  query: ReadModelQuery,
  initialState: any,
  dependencies: any[]
): HookData
function useReduxReadModel(
  query: ReadModelQuery,
  initialState: any,
  options: ReduxReadModelHookOptions,
  actions: ReadModelReduxActionsCreators
): HookData
function useReduxReadModel(
  query: ReadModelQuery,
  initialState: any,
  options: ReduxReadModelHookOptions,
  dependencies: any[]
): HookData
function useReduxReadModel(
  query: ReadModelQuery,
  initialState: any,
  options: ReduxReadModelHookOptions,
  actions: ReadModelReduxActionsCreators,
  dependencies: any[]
): HookData
function useReduxReadModel(
  query: ReadModelQuery,
  initialState: any,
  options?: ReduxReadModelHookOptions | ReadModelReduxActionsCreators | any[],
  actions?: ReadModelReduxActionsCreators | any[],
  dependencies?: any[]
): HookData {
  const actualOptions: ReduxReadModelHookOptions =
    firstOfType<ReduxReadModelHookOptions>(isOptions, options) || {}
  const actualActionCreators: ReadModelReduxActionsCreators =
    firstOfType<ReadModelReduxActionsCreators>(
      isReadModelReduxActionsCreators,
      options,
      actions
    ) || internalActions
  const actualDependencies: any[] =
    firstOfType<any[]>(isDependencies, options, actions, dependencies) ??
    [query, actualOptions, actualActionCreators].filter(i => i)

  const { request, success, failure } = actualActionCreators
  const { selectorId } = actualOptions

  const dispatch = useDispatch()
  const executor = useQuery(
    query,
    actualOptions.queryOptions || defaultQueryOptions,
    (error, result) => {
      if (error || result == null) {
        if (typeof failure === 'function') {
          if (error) {
            dispatch(failure(query, error, selectorId))
          } else {
            dispatch(failure(query, new Error(`null response`), selectorId))
          }
        }
      } else {
        if (typeof success === 'function') {
          dispatch(success(query, result, selectorId))
        }
      }
    },
    actualDependencies
  )

  return {
    request: useCallback((): void => {
      if (typeof request === 'function') {
        dispatch(request(query, initialState, selectorId))
      }
      executor()
    }, [actualDependencies]),
    selector: (state: ReduxState): any =>
      getEntry(
        state.readModels,
        selectorId || {
          query
        },
        {
          status: ResultStatus.Initial,
          data: initialState
        }
      )
  }
}

export { useReduxReadModel }
