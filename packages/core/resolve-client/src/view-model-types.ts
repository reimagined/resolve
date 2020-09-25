import { IS_BUILT_IN } from 'resolve-core'

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
