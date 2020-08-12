import { Action } from 'redux'
import {
  QueryOptions,
  QueryResult,
  SubscribeCallback,
  ViewModelQuery
} from 'resolve-client'
import {
  QueryViewModelFailureAction,
  QueryViewModelRequestAction,
  QueryViewModelSuccessAction,
  ViewModelStateUpdateAction
} from './actions'
import { ReduxState } from '../types'
import {
  QUERY_VIEWMODEL_FAILURE,
  QUERY_VIEWMODEL_REQUEST,
  QUERY_VIEWMODEL_SUCCESS,
  VIEWMODEL_STATE_UPDATE
} from '../action-types'
import { firstOfType } from 'resolve-core'
import { isActionCreators, isDependencies, isOptions } from '../helpers'
import { useDispatch } from 'react-redux'
import { useClient, useViewModel } from 'resolve-react-hooks'
import { useCallback } from 'react'

type HookData = {
  connect: () => void
  dispose: () => void
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
  update: (
    query: ViewModelQuery,
    result: QueryResult,
    selectorId?: string
  ) => ViewModelStateUpdateAction | Action
}

type ReduxViewModelHookOptions = {
  queryOptions?: QueryOptions
  selectorId?: string
}

const defaultQueryOptions: QueryOptions = {
  method: 'GET'
}

const internalActions: ViewModelReduxActionsCreators = {
  request: (query: ViewModelQuery, selectorId?: string) => ({
    type: QUERY_VIEWMODEL_REQUEST,
    viewModelName: query.name,
    aggregateIds: query.aggregateIds,
    aggregateArgs: query.args,
    selectorId
  }),
  success: (
    query: ViewModelQuery,
    result: QueryResult,
    selectorId?: string
  ) => ({
    type: QUERY_VIEWMODEL_SUCCESS,
    viewModelName: query.name,
    aggregateIds: query.aggregateIds,
    aggregateArgs: query.args,
    result: result.data,
    timestamp: result.timestamp,
    selectorId
  }),
  failure: (query: ViewModelQuery, error: Error, selectorId?: string) => ({
    type: QUERY_VIEWMODEL_FAILURE,
    viewModelName: query.name,
    aggregateIds: query.aggregateIds,
    aggregateArgs: query.args,
    error,
    selectorId
  }),
  update: (
    query: ViewModelQuery,
    result: QueryResult,
    selectorId?: string
  ) => ({
    type: VIEWMODEL_STATE_UPDATE,
    viewModelName: query.name,
    aggregateIds: query.aggregateIds,
    aggregateArgs: query.args,
    result: result.data,
    timestamp: result.timestamp,
    selectorId
  })
}

export function useReduxViewModel(
  query: ViewModelQuery,
  options?: ReduxViewModelHookOptions | ViewModelReduxActionsCreators | any[],
  actions?: ViewModelReduxActionsCreators | any[],
  dependencies?: any[]
): HookData {
  const actualOptions: ReduxViewModelHookOptions =
    firstOfType<ReduxViewModelHookOptions>(isOptions, options) || {}
  const actualActionCreators: ViewModelReduxActionsCreators =
    firstOfType<ViewModelReduxActionsCreators>(
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
  /*
  const { connect, dispose } = useViewModel(
    query.name,
    query.aggregateIds,
    query.args,
    actualOptions.queryOptions || defaultQueryOptions
  )
  */

  /*
  const client = useClient()
  const queryState = useCallback(async () => {
    const result = await client.query(
      {
        name: modelName,
        aggregateIds,
        args: {}
      },
      queryOptions
    )
    if (result) {
      setState(result.data)
    }
  }, [])

  const applyEvent = useCallback(event => {
    setState(viewModel.projection[event.type](closure.state, event))
  }, [])

  const connect = useCallback((done?: SubscribeCallback): void => {
    const asyncConnect = async (): Promise<Subscription> => {
      await queryState()

      const subscribe = client.subscribe(
        modelName,
        aggregateIds,
        event => applyEvent(event),
        undefined,
        () => queryState()
      ) as Promise<Subscription>

      const subscription = await subscribe

      if (subscription) {
        closure.subscription = subscription
      }

      return subscription
    }
    if (typeof done !== 'function') {
      return asyncConnect()
    }

    return {
    connect: () => connect,
    dispose: () => dispose,
    selector: (state: ReduxState): any =>
      getEntry(
        state.readModels,
        selectorId
          ? selectorId
          : {
              viewModelName: query.name,
              aggregateIds: query.aggregateIds,
              aggregateArgs: query.args
            }
      )
  }
     */
  return {
    connect: () => {},
    dispose: () => {},
    selector: (state: ReduxState) =>
      state.viewModels ?? [query.name] ?? [query.args]
  }
}
