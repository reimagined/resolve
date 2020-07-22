import { Client, Context } from 'resolve-client'
import { API } from './create_api'

export enum ReadModelResultState {
  Requested,
  Ready,
  Failed
}

export type ReadModelResultEntry = {
  state: ReadModelResultState
  data?: any
  timestamp?: number
  error?: Error
}

type ReadModelResultMapByArgs = {
  [key: string]: ReadModelResultEntry
}
type ReadModelResultMapByResolver = {
  [key: string]: ReadModelResultMapByArgs
}
type ReadModelResultMapByName = {
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
  },
  initialState: any
  isClient: boolean
  queryMethod: string
} & Context

export type RootSagaArgs = {
  store: any
  sessionId: any
  customSagas: any[]
  api: API
  queryIdMap: Map<string, string>
  client: Client
} & ReduxStoreContext
