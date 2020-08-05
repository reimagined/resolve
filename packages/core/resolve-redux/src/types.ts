import { Client, Context } from 'resolve-client'
import { API } from './create_api'

export enum ReadModelResultState {
  Requested = 'requested',
  Ready = 'ready',
  Failed = 'failed'
}

export type ReadModelResultEntry = {
  state: ReadModelResultState
  data?: any
  timestamp?: number
  error?: Error
}

export type ReadModelResultMapByArgs = {
  [key: string]: ReadModelResultEntry
}
export type ReadModelResultMapByResolver = {
  [key: string]: ReadModelResultMapByArgs
}
export type ReadModelResultMapByName = {
  [key: string]: ReadModelResultMapByResolver
}

export type ReduxState = {
  readModels?: ReadModelResultMapByName
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
