import { Client, Context } from 'resolve-client'
import { API } from './create_api'

enum RequestState {
  Requested = 'requested',
  Ready = 'ready',
  Failed = 'failed'
}

type QueryResultEntry = {
  state: RequestState
  data?: any
  timestamp?: number
  error?: Error
}

export type ReadModelResultState = RequestState
export type ViewModelResultState = RequestState

export type ReadModelResultEntry = QueryResultEntry
export type ViewModelResultEntry = QueryResultEntry

type ReadModelResultMapByArgs = {
  [key: string]: ReadModelResultEntry
}
type ReadModelResultMapByResolver = {
  [key: string]: ReadModelResultMapByArgs
}
export type ReadModelResultMapByName = {
  [key: string]: ReadModelResultMapByResolver
}

type ViewModelResultMapByAggregateArgs = {
  [key: string]: ViewModelResultEntry
}
type ViewModelResultMapByAggregateIds = {
  [key: string]: ViewModelResultMapByAggregateArgs
}
export type ViewModelResultMapByName = {
  [key: string]: ViewModelResultMapByAggregateIds
}

export type ReduxState = {
  readModels?: ReadModelResultMapByName
  viewModels?: ViewModelResultMapByName
}

export type ReduxStoreContext = {
  redux: {
    reducers?: { [key: string]: string }
    middlewares?: any[]
    enhancers?: any[]
    sagas?: any[]
  }
  initialState: any
  isClient: boolean
  queryMethod: string
} & Context

export type ChildSagaArgs = {
  store: any
  sessionId: any
  api: API
  queryIdMap: Map<string, string>
  client: Client
} & ReduxStoreContext

export type RootSagaArgs = {
  customSagas: any[]
} & ChildSagaArgs
