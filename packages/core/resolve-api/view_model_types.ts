export interface ViewModel {
  name: string
  projection: Array<object>
  deserializeState: (state: string) => object
}

export interface ViewModelState {
  data: object
  isLoading: boolean
  isError?: Error
}

export enum LoadViewModelState {
  FAILURE = '@@resolve/LOAD_VIEWMODEL_STATE_FAILURE',
  SUCCESS = '@@resolve/LOAD_VIEWMODEL_STATE_SUCCESS',
  REQUEST = '@@resolve/LOAD_VIEWMODEL_STATE_REQUEST'
}

export interface LoadViewModelStateRequest {
  type: string
  viewModelName: string
  aggregateIds: Array<string>
  aggregateArgs: object
}

export const loadViewModelStateRequest = (
  viewModelName: string,
  aggregateIds: Array<string>,
  aggregateArgs: object
): LoadViewModelStateRequest => ({
  type: LoadViewModelState.REQUEST,
  viewModelName,
  aggregateIds,
  aggregateArgs
})

export interface LoadViewModelStateSuccess {
  type: string
  viewModelName: string
  aggregateIds: Array<string>
  aggregateArgs: object
  result: object
  timestamp: number
}

export const loadViewModelStateSuccess = (
  viewModelName: string,
  aggregateIds: Array<string>,
  aggregateArgs: object,
  result: object,
  timestamp: number
): LoadViewModelStateSuccess => ({
  type: LoadViewModelState.SUCCESS,
  viewModelName,
  aggregateIds,
  aggregateArgs,
  result,
  timestamp
})

export interface LoadViewModelStateFailure {
  type: string
  viewModelName: string
  aggregateIds: Array<string>
  aggregateArgs: object
  error: Error
}

export const loadViewModelStateFailure = (
  viewModelName: string,
  aggregateIds: Array<string>,
  aggregateArgs: object,
  error: Error
): LoadViewModelStateFailure => ({
  type: LoadViewModelState.FAILURE,
  viewModelName,
  aggregateIds,
  aggregateArgs,
  error
})
