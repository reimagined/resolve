import { useCallback } from 'react'
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

type HookData = {
  request: () => void
}

type ReadModelReduxActionsCreators = {
  request: (query: ReadModelQuery) => QueryReadModelRequestAction
  success: (
    query: ReadModelQuery,
    result: QueryResult
  ) => QueryReadModelSuccessAction
  failure: (query: ReadModelQuery, error: Error) => QueryReadModelFailureAction
}

const defaultQueryOptions: QueryOptions = {
  method: 'GET'
}

const internalActions: ReadModelReduxActionsCreators = {
  request: (query: ReadModelQuery) => ({
    type: QUERY_READMODEL_REQUEST,
    readModelName: query.name,
    resolverName: query.resolver,
    resolverArgs: query.args
  }),
  success: (query: ReadModelQuery, result: QueryResult) => ({
    type: QUERY_READMODEL_SUCCESS,
    readModelName: query.name,
    resolverName: query.resolver,
    resolverArgs: query.args,
    result: result.data,
    timestamp: result.timestamp
  }),
  failure: (query: ReadModelQuery, error: Error) => ({
    type: QUERY_READMODEL_FAILURE,
    readModelName: query.name,
    resolverName: query.resolver,
    resolverArgs: query.args,
    error
  })
}

function useReduxReadModel(query: ReadModelQuery): HookData
function useReduxReadModel(
  query: ReadModelQuery,
  options: QueryOptions
): HookData
function useReduxReadModel(
  query: ReadModelQuery,
  actions: ReadModelReduxActionsCreators
): HookData
function useReduxReadModel(query: ReadModelQuery, dependencies: any[]): HookData
function useReduxReadModel(
  query: ReadModelQuery,
  options: QueryOptions,
  actions: ReadModelReduxActionsCreators
): HookData
function useReduxReadModel(
  query: ReadModelQuery,
  options: QueryOptions,
  dependencies: any[]
): HookData
function useReduxReadModel(
  query: ReadModelQuery,
  options: QueryOptions,
  actions: ReadModelReduxActionsCreators,
  dependencies: any[]
): HookData
function useReduxReadModel(
  query: ReadModelQuery,
  options?: QueryOptions | ReadModelReduxActionsCreators | any[],
  actions?: ReadModelReduxActionsCreators | any[],
  dependencies?: any[]
): HookData {
  const actualOptions: QueryOptions =
    firstOfType<QueryOptions>(isOptions, options) || defaultQueryOptions
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

  const dispatch = useDispatch()
  const executor = useQuery(
    query,
    actualOptions,
    (error, result) => {
      if (error || result == null) {
        if (typeof failure === 'function') {
          if (error) {
            dispatch(failure(query, error))
          } else {
            dispatch(failure(query, new Error(`null response`)))
          }
        }
      } else {
        if (typeof success === 'function') {
          dispatch(success(query, result))
        }
      }
    },
    actualDependencies
  )

  return {
    request: useCallback((): void => {
      if (typeof request === 'function') {
        dispatch(request(query))
      }
      executor()
    }, [actualDependencies])
  }
}

export default useReduxReadModel
