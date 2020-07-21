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

export type ResolveReduxState = {
  readModels?: ReadModelResultMapByName
}
