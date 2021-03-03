import { Event } from '@resolve-js/core'
import { Client, Context } from '@resolve-js/client'

export enum ResultStatus {
  Initial = 'initial',
  Requested = 'requested',
  Ready = 'ready',
  Failed = 'failed',
}

type QueryResultEntry = {
  status: ResultStatus
  data?: any
  timestamp?: number
  error?: Error
}

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
  serializedState?: string
  isClient: boolean
  queryMethod: string
} & Context

export type ChildSagaArgs = {
  store: any
  sessionId: any
  queryIdMap: Map<string, string>
  client: Client
} & ReduxStoreContext

export type RootSagaArgs = {
  customSagas: any[]
} & ChildSagaArgs

export type ViewModelReactiveEvent = Event
