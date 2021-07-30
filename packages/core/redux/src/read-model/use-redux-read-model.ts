import { useMemo, useRef } from 'react'
import { AnyAction } from 'redux'
import { useDispatch } from 'react-redux'
import isEqual from 'lodash.isequal'
import { firstOfType } from '@resolve-js/core'
import {
  QueryCallback,
  QueryOptions,
  QueryResult,
  ReadModelQuery,
} from '@resolve-js/client'
import { QueryBuilder, useQueryBuilder } from '@resolve-js/react-hooks'
import {
  queryReadModelFailure,
  QueryReadModelFailureAction,
  queryReadModelRequest,
  QueryReadModelRequestAction,
  queryReadModelSuccess,
  QueryReadModelSuccessAction,
} from './actions'
import { isDependencies, isOptions } from '../helpers'
import { ReduxState, ResultStatus } from '../types'
import { badSelectorDrain, getEntry } from './read-model-reducer'
import {
  getSelectorState,
  releaseSelectorState,
  setSelectorState,
} from './initial-state-manager'

type HookData<TArgs extends any[]> = {
  request: (...args: TArgs) => void
  selector: (state: ReduxState) => any
}

type ReadModelReduxActionsCreators<TQuery extends ReadModelQuery> = {
  request?: (
    query: TQuery,
    initialState: any,
    selectorId?: string
  ) => QueryReadModelRequestAction | AnyAction
  success?: (
    query: TQuery,
    result: QueryResult,
    selectorId?: string
  ) => QueryReadModelSuccessAction | AnyAction
  failure?: (
    query: TQuery,
    error: Error,
    selectorId?: string
  ) => QueryReadModelFailureAction | AnyAction
}

export type ReduxReadModelHookOptions<TQuery extends ReadModelQuery> = {
  actions?: ReadModelReduxActionsCreators<TQuery>
  queryOptions?: QueryOptions
  selectorId?: string
}

const defaultQueryOptions: QueryOptions = {
  method: 'GET',
}
const defaultHookOptions: ReduxReadModelHookOptions<ReadModelQuery> = {}

const internalActions: ReadModelReduxActionsCreators<ReadModelQuery> = {
  request: queryReadModelRequest,
  success: queryReadModelSuccess,
  failure: queryReadModelFailure,
}

function isBuilder<TArgs extends any[], TQuery extends ReadModelQuery>(
  query: TQuery | QueryBuilder<TArgs, TQuery>
): query is QueryBuilder<TArgs, TQuery> {
  return typeof query === 'function'
}

function useReduxReadModel<TQuery extends ReadModelQuery>(
  query: TQuery,
  initialState: any
): HookData<void[]>
function useReduxReadModel<TQuery extends ReadModelQuery>(
  query: TQuery,
  initialState: any,
  options: ReduxReadModelHookOptions<TQuery>
): HookData<void[]>
function useReduxReadModel<TQuery extends ReadModelQuery>(
  query: TQuery,
  initialState: any,
  dependencies: any[]
): HookData<void[]>
function useReduxReadModel<TQuery extends ReadModelQuery>(
  query: TQuery,
  initialState: any,
  options: ReduxReadModelHookOptions<TQuery>,
  dependencies: any[]
): HookData<void[]>
function useReduxReadModel<TArgs extends any[], TQuery extends ReadModelQuery>(
  builder: QueryBuilder<TArgs, TQuery>,
  initialState: any
): HookData<TArgs>
function useReduxReadModel<TArgs extends any[], TQuery extends ReadModelQuery>(
  builder: QueryBuilder<TArgs, TQuery>,
  initialState: any,
  options: ReduxReadModelHookOptions<TQuery>
): HookData<TArgs>
function useReduxReadModel<TArgs extends any[], TQuery extends ReadModelQuery>(
  builder: QueryBuilder<TArgs, TQuery>,
  initialState: any,
  dependencies: any[]
): HookData<TArgs>
function useReduxReadModel<TArgs extends any[], TQuery extends ReadModelQuery>(
  builder: QueryBuilder<TArgs, TQuery>,
  initialState: any,
  options: ReduxReadModelHookOptions<TQuery>,
  dependencies: any[]
): HookData<TArgs>

function useReduxReadModel<TArgs extends any[], TQuery extends ReadModelQuery>(
  query: TQuery | QueryBuilder<TArgs, TQuery>,
  initialState: any,
  options?: ReduxReadModelHookOptions<TQuery> | any[],
  dependencies?: any[]
): HookData<TArgs> {
  const actualOptions = isOptions<ReduxReadModelHookOptions<TQuery>>(options)
    ? options
    : defaultHookOptions

  const actualActionCreators = actualOptions.actions || internalActions

  if (
    isBuilder(query) &&
    !actualOptions.selectorId &&
    actualActionCreators === internalActions
  ) {
    throw Error(
      `Query builder function should be used with selector id or custom redux actions`
    )
  }

  const actualDependencies = firstOfType<any[]>(
    isDependencies,
    options,
    dependencies
  )

  const { request, success, failure } = actualActionCreators
  const { selectorId } = actualOptions

  const actualSelector =
    selectorId ||
    (!isBuilder(query)
      ? {
          query,
        }
      : badSelectorDrain)

  const callback: QueryCallback<TQuery> = (error, result, executedQuery) => {
    releaseSelectorState(actualSelector)
    if (error || result == null) {
      if (typeof failure === 'function') {
        if (error) {
          dispatch(failure(executedQuery, error, selectorId))
        } else {
          dispatch(
            failure(executedQuery, new Error(`null response`), selectorId)
          )
        }
      }
    } else {
      if (typeof success === 'function') {
        dispatch(success(executedQuery, result, selectorId))
      }
    }
  }

  const dispatch = useDispatch()
  const executor = actualDependencies
    ? useQueryBuilder(
        (query: TQuery) => query,
        actualOptions.queryOptions || defaultQueryOptions,
        callback,
        actualDependencies
      )
    : useQueryBuilder(
        (query: TQuery) => query,
        actualOptions.queryOptions || defaultQueryOptions,
        callback
      )

  const mutex = useRef({
    assigned: false,
    state: initialState,
    selector: actualSelector,
  })
  if (!mutex.current.assigned) {
    setSelectorState(actualSelector, mutex.current.state)
    mutex.current.assigned = true
  } else {
    if (
      !isEqual(mutex.current.selector, actualSelector) ||
      !isEqual(mutex.current.state, initialState)
    ) {
      releaseSelectorState(mutex.current.selector)
      setSelectorState(actualSelector, initialState)
      mutex.current.selector = actualSelector
      mutex.current.state = initialState
    }
  }

  return useMemo(
    () => ({
      request: (...args: TArgs): void => {
        const dispatchRequest = (query: TQuery): void => {
          if (typeof request === 'function') {
            dispatch(request(query, initialState, selectorId))
          }
        }

        const plainQuery: TQuery = isBuilder(query) ? query(...args) : query

        dispatchRequest(plainQuery)
        executor(plainQuery)
      },
      selector: (state: ReduxState): any =>
        getEntry(state.readModels, actualSelector, {
          status: ResultStatus.Initial,
          data: getSelectorState(actualSelector),
        }),
    }),
    [executor, dispatch]
  )
}

export { useReduxReadModel }
