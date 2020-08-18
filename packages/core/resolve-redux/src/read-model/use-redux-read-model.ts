import { useCallback } from 'react'
import { Action } from 'redux'
import { useDispatch } from 'react-redux'
import { QueryOptions, QueryResult, ReadModelQuery } from 'resolve-client'
import { useQuery } from 'resolve-react-hooks'
import {
  QueryReadModelFailureAction,
  QueryReadModelRequestAction,
  QueryReadModelSuccessAction
} from './actions'
import { firstOfType } from 'resolve-core'
import { isActionCreators, isDependencies, isOptions } from '../helpers'
import {
  QUERY_READMODEL_FAILURE,
  QUERY_READMODEL_REQUEST,
  QUERY_READMODEL_SUCCESS
} from '../action-types'
import { ReduxState } from '../types'
import { getEntry } from './read-model-reducer'

type HookData = {
  request: () => void
  selector: (state: ReduxState) => any
}

type ReadModelReduxActionsCreators = {
  request: (
    query: ReadModelQuery,
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

type ReduxReadModelHookOptions = {
  queryOptions?: QueryOptions
  selectorId?: string
}

const defaultQueryOptions: QueryOptions = {
  method: 'GET'
}

const internalActions: ReadModelReduxActionsCreators = {
  request: (query: ReadModelQuery, selectorId?: string) => ({
    type: QUERY_READMODEL_REQUEST,
    readModelName: query.name,
    resolverName: query.resolver,
    resolverArgs: query.args,
    selectorId
  }),
  success: (
    query: ReadModelQuery,
    result: QueryResult,
    selectorId?: string
  ) => ({
    type: QUERY_READMODEL_SUCCESS,
    readModelName: query.name,
    resolverName: query.resolver,
    resolverArgs: query.args,
    result: result.data,
    timestamp: result.timestamp,
    selectorId
  }),
  failure: (query: ReadModelQuery, error: Error, selectorId?: string) => ({
    type: QUERY_READMODEL_FAILURE,
    readModelName: query.name,
    resolverName: query.resolver,
    resolverArgs: query.args,
    error,
    selectorId
  })
}

function useReduxReadModel(query: ReadModelQuery, initialState: any): HookData
function useReduxReadModel(
  query: ReadModelQuery,
  options: ReduxReadModelHookOptions
): HookData
function useReduxReadModel(
  query: ReadModelQuery,
  actions: ReadModelReduxActionsCreators
): HookData
function useReduxReadModel(
  query: ReadModelQuery,
  dependencies: any[]
): HookData
function useReduxReadModel(
  query: ReadModelQuery,
  options: ReduxReadModelHookOptions,
  actions: ReadModelReduxActionsCreators
): HookData
function useReduxReadModel(
  query: ReadModelQuery,
  options: ReduxReadModelHookOptions,
  dependencies: any[]
): HookData
function useReduxReadModel(
  query: ReadModelQuery,
  options: ReduxReadModelHookOptions,
  actions: ReadModelReduxActionsCreators,
  dependencies: any[]
): HookData
function useReduxReadModel(
  query: ReadModelQuery,
  options?: ReduxReadModelHookOptions | ReadModelReduxActionsCreators | any[],
  actions?: ReadModelReduxActionsCreators | any[],
  dependencies?: any[]
): HookData {
  const actualOptions: ReduxReadModelHookOptions =
    firstOfType<ReduxReadModelHookOptions>(isOptions, options) || {}
  const actualActionCreators: ReadModelReduxActionsCreators =
    firstOfType<ReadModelReduxActionsCreators>(
      isActionCreators,
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
        dispatch(request(query, selectorId))
      }
      executor()
    }, [actualDependencies]),
    selector: (state: ReduxState): any =>
      getEntry(
        state.readModels,
        selectorId
          ? selectorId
          : {
              readModelName: query.name,
              resolverName: query.resolver,
              resolverArgs: query.args
            }
      )
  }
}

export { useReduxReadModel }
