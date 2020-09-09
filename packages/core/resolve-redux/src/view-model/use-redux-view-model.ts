import { AnyAction } from 'redux'
import { QueryOptions, ViewModelQuery } from 'resolve-client'
import {
  viewModelEventReceived,
  ViewModelEventReceivedAction,
  viewModelStateUpdate,
  ViewModelStateUpdateAction,
} from './actions'
import { ReduxState, ResultStatus, ViewModelReactiveEvent } from '../types'
import { firstOfType } from 'resolve-core'
import { isDependencies, isOptions } from '../helpers'
import { useDispatch } from 'react-redux'
import { useViewModel } from 'resolve-react-hooks'
import { useCallback } from 'react'
import { getEntry } from './view-model-reducer'

type HookData = {
  connect: () => void
  dispose: () => void
  selector: (state: ReduxState) => any
}

type ViewModelReduxActionsCreators = {
  stateUpdate?: (
    query: ViewModelQuery,
    state: any,
    initial: boolean,
    selectorId?: string
  ) => ViewModelStateUpdateAction | AnyAction
  eventReceived?: (
    query: ViewModelQuery,
    event: ViewModelReactiveEvent,
    selectorId?: string
  ) => ViewModelEventReceivedAction | AnyAction
}

type ReduxViewModelHookOptions = {
  actions?: ViewModelReduxActionsCreators
  queryOptions?: QueryOptions
  selectorId?: string
}

const defaultQueryOptions: QueryOptions = {
  method: 'GET',
}

const internalActions: ViewModelReduxActionsCreators = {
  stateUpdate: viewModelStateUpdate,
  eventReceived: viewModelEventReceived,
}

export function useReduxViewModel(query: ViewModelQuery): HookData
export function useReduxViewModel(
  query: ViewModelQuery,
  dependencies: any[]
): HookData
export function useReduxViewModel(
  query: ViewModelQuery,
  options: ReduxViewModelHookOptions
): HookData
export function useReduxViewModel(
  query: ViewModelQuery,
  options: ReduxViewModelHookOptions,
  dependencies: any[]
): HookData
export function useReduxViewModel(
  query: ViewModelQuery,
  options?: ReduxViewModelHookOptions | any[],
  dependencies?: any[]
): HookData {
  const actualOptions = isOptions<ReduxViewModelHookOptions>(options)
    ? options
    : {}

  const actualActionCreators = actualOptions.actions || internalActions

  const actualDependencies: any[] =
    firstOfType<any[]>(isDependencies, options, dependencies, dependencies) ??
    [query, actualOptions, actualActionCreators].filter((i) => i)

  const { stateUpdate, eventReceived } = actualActionCreators
  const { selectorId } = actualOptions
  const { name, aggregateIds, args } = query

  const dispatch = useDispatch()

  const stateChangeCallback = useCallback((state: any, initial: boolean) => {
    if (typeof stateUpdate === 'function') {
      dispatch(stateUpdate(query, state, initial, selectorId))
    }
  }, actualDependencies)
  const eventReceivedCallback = useCallback((event: ViewModelReactiveEvent) => {
    if (typeof eventReceived === 'function') {
      dispatch(eventReceived(query, event, selectorId))
    }
  }, actualDependencies)

  const { connect, dispose, initialState } = useViewModel(
    name,
    aggregateIds,
    args,
    stateChangeCallback,
    eventReceivedCallback,
    actualOptions.queryOptions || defaultQueryOptions
  )

  return {
    connect,
    dispose,
    selector: (state: ReduxState): any =>
      getEntry(
        state.viewModels,
        selectorId || {
          query,
        },
        {
          status: ResultStatus.Initial,
          data: initialState,
        }
      ),
  }
}
