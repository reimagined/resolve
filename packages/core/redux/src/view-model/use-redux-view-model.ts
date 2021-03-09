import { AnyAction } from 'redux'
import { QueryOptions, ViewModelQuery } from '@resolve-js/client'
import {
  viewModelEventReceived,
  ViewModelEventReceivedAction,
  viewModelStateUpdate,
  ViewModelStateUpdateAction,
} from './actions'
import { ReduxState, ViewModelReactiveEvent } from '../types'
import { isOptions } from '../helpers'
import { useDispatch } from 'react-redux'
import { useViewModel } from '@resolve-js/react-hooks'
import { useCallback, useMemo, useRef } from 'react'
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

export type ReduxViewModelHookOptions = {
  actions?: ViewModelReduxActionsCreators
  queryOptions?: QueryOptions
  selectorId?: string
}

const defaultQueryOptions: QueryOptions = {
  method: 'GET',
}
const defaultHookOptions: ReduxViewModelHookOptions = {}

const internalActions: ViewModelReduxActionsCreators = {
  stateUpdate: viewModelStateUpdate,
  eventReceived: viewModelEventReceived,
}

export function useReduxViewModel(query: ViewModelQuery): HookData
export function useReduxViewModel(query: ViewModelQuery): HookData
export function useReduxViewModel(
  query: ViewModelQuery,
  options: ReduxViewModelHookOptions
): HookData
export function useReduxViewModel(
  query: ViewModelQuery,
  options: ReduxViewModelHookOptions
): HookData
export function useReduxViewModel(
  query: ViewModelQuery,
  options?: ReduxViewModelHookOptions
): HookData {
  const actualOptions = isOptions<ReduxViewModelHookOptions>(options)
    ? options
    : defaultHookOptions

  const actualActionCreators = actualOptions.actions || internalActions

  const { stateUpdate, eventReceived } = actualActionCreators
  const { selectorId } = actualOptions
  const { name, aggregateIds, args } = query

  const dispatch = useDispatch()

  const stateChangeCallback = useCallback((state: any, initial: boolean) => {
    if (typeof stateUpdate === 'function') {
      dispatch(stateUpdate(query, state, initial, selectorId))
    }
  }, [])
  const eventReceivedCallback = useCallback((event: ViewModelReactiveEvent) => {
    if (typeof eventReceived === 'function') {
      dispatch(eventReceived(query, event, selectorId))
    }
  }, [])

  const { connect, dispose, initialState } = useViewModel(
    name,
    aggregateIds,
    args,
    stateChangeCallback,
    eventReceivedCallback,
    actualOptions.queryOptions || defaultQueryOptions
  )

  const initialStateDispatched = useRef(false)
  if (!initialStateDispatched.current) {
    if (typeof stateUpdate === 'function') {
      dispatch(stateUpdate(query, initialState, true, selectorId))
    }
    initialStateDispatched.current = true
  }

  return useMemo(
    () => ({
      connect,
      dispose,
      selector: (state: ReduxState): any =>
        getEntry(
          state.viewModels,
          selectorId || {
            query,
          }
        ),
    }),
    [connect, dispose]
  )
}
