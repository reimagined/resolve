import { IS_BUILT_IN } from '@resolve-js/core'

export type ViewModelInitialize = () => any
export type ViewModelReducer = (state: any, event: object) => any
export interface ViewModelDeserializer {
  (state: string): any
  [IS_BUILT_IN]?: boolean
}
export type ViewModel = {
  name: string
  projection: {
    Init: ViewModelInitialize
    [key: string]: ViewModelReducer
  }
  deserializeState: ViewModelDeserializer
}

export enum SubscriptionAdapterStatus {
  Initializing = 'initializing',
  Connecting = 'connecting',
  Connected = 'connected',
  Ready = 'ready',
  Closed = 'closed',
}
